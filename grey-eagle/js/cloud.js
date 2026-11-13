// 灰鷹軍團 — 雲端帳號（和「競技對決 ARENA」共用同一套 Firebase 帳號）。
// 帳號：Firebase Authentication（電子郵件/密碼，名稱轉成和 ARENA 相同的內部 email）。
// 存檔：Firestore users/{uid} 文件裡的 ge（整份存檔 JSON）和 geUpd（最後存檔時間）兩個欄位，
//       用 updateMask 只寫這兩個欄位，不會動到 ARENA 的資料。
'use strict';
(function (G) {
  const FB = { apiKey: 'AIzaSyDCvPT1HVRj6dc8wtkkFKPlulUjHIpWlCA', projectId: 'rivals-online' };
  const LS = 'greyEagle.cloud';
  const NAME_RE = /^[A-Za-z0-9_㐀-鿿]{3,16}$/;
  const SAVE_DELAY = 5000;

  const ERR = {
    EMAIL_EXISTS: '這個名稱已經有人用了', INVALID_LOGIN_CREDENTIALS: '帳號或密碼錯誤', INVALID_PASSWORD: '帳號或密碼錯誤',
    EMAIL_NOT_FOUND: '帳號或密碼錯誤', WEAK_PASSWORD: '密碼至少 6 個字', TOO_MANY_ATTEMPTS_TRY_LATER: '嘗試太多次，請稍後再試',
    USER_DISABLED: '這個帳號已被停用', TOKEN_EXPIRED: '登入已過期，請重新登入', INVALID_REFRESH_TOKEN: '登入已過期，請重新登入',
    USER_NOT_FOUND: '登入已過期，請重新登入', PERMISSION_DENIED: '雲端拒絕存取', RESOURCE_EXHAUSTED: '今天的雲端免費使用量用完了，進度先存在這台裝置，之後會自動同步',
  };
  function msg(e) {
    if (typeof e === 'string') return e;
    if (e && e.net) return '連不到雲端。如果你是在 Claude 的預覽頁面玩，雲端帳號只能在網站版使用。';
    const c = (e && e.code) || '';
    return ERR[c] || ('雲端錯誤：' + (c || e));
  }

  // ---------- 和 ARENA 相同的帳號名稱 → email 規則 ----------
  async function sha256hex(str) {
    const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function fbEmail(name) {
    const k = String(name).toLowerCase();
    const h = [...new TextEncoder().encode(k)].map(b => b.toString(16).padStart(2, '0')).join('');
    return (h.length <= 62 ? 'u' + h : 'h' + (await sha256hex(k)).slice(0, 60)) + '@rivals-arena.app';
  }
  const fbPw = pw => { pw = String(pw); return pw.length < 6 ? pw + '·rvl-legacy' : pw; };

  // ---------- 網路 ----------
  async function fetchJson(url, opt) {
    let r;
    const ac = new AbortController(), tm = setTimeout(() => ac.abort(), 12000);
    try { r = await fetch(url, Object.assign({ signal: ac.signal }, opt)); } catch (e) { throw { net: 1 }; } finally { clearTimeout(tm); }
    let j = {}; try { j = await r.json(); } catch (e) { /* 空回應 */ }
    if (!r.ok) {
      const er = (j && j.error) || {}, m = String(er.message || '');
      throw { code: /^[A-Z_]+/.test(m) ? m.split(/[\s:]/)[0] : (er.status || 'HTTP_' + r.status), status: r.status };
    }
    return j;
  }
  const key = () => '?key=' + encodeURIComponent(FB.apiKey);
  const auth = (ep, body) => fetchJson('https://identitytoolkit.googleapis.com/v1/accounts:' + ep + key(),
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.assign({ returnSecureToken: true }, body)) });
  const docUrl = uid => 'https://firestore.googleapis.com/v1/projects/' + FB.projectId + '/databases/(default)/documents/users/' + encodeURIComponent(uid);

  // ---------- 登入狀態 ----------
  const C = { uid: null, name: '', rt: null, id: null, exp: 0, state: 'off', timer: 0, busy: false, again: false, lastErr: '' };
  function remember() { try { if (C.uid) localStorage.setItem(LS, JSON.stringify({ uid: C.uid, name: C.name, rt: C.rt })); else localStorage.removeItem(LS); } catch (e) { /* 存不了就算了 */ } }
  function setTok(id, rt, exp, uid) { C.id = id; if (rt) C.rt = rt; C.exp = Date.now() + (+exp || 3600) * 1000 - 60000; if (uid) C.uid = uid; remember(); }
  async function token(force) {
    if (!force && C.id && Date.now() < C.exp) return C.id;
    const j = await fetchJson('https://securetoken.googleapis.com/v1/token' + key(), {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(C.rt),
    });
    setTok(j.id_token, j.refresh_token, j.expires_in, j.user_id);
    return C.id;
  }
  async function docReq(method, body, query, keepalive) {
    for (let i = 0; ; i++) {
      const tok = await token(i > 0);
      try {
        return await fetchJson(docUrl(C.uid) + (query || ''), {
          method, keepalive: !!keepalive,
          headers: Object.assign({ Authorization: 'Bearer ' + tok }, body ? { 'Content-Type': 'application/json' } : {}),
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (e) { if (e && e.status === 401 && i === 0) continue; throw e; }
    }
  }
  async function pull() {
    try {
      const j = await docReq('GET');
      const f = j.fields || {};
      let save = null; try { save = JSON.parse((f.ge && f.ge.stringValue) || 'null'); } catch (e) { /* 壞掉的存檔當作沒有 */ }
      return { save, upd: +(f.geUpd && f.geUpd.integerValue) || 0 };
    } catch (e) { if (e && e.status === 404) return { save: null, upd: 0 }; throw e; }
  }
  function push(keepalive) {
    const S = G.getSave();
    return docReq('PATCH', { fields: { ge: { stringValue: JSON.stringify(S) }, geUpd: { integerValue: String(S.upd || Date.now()) } } },
      '?updateMask.fieldPaths=ge&updateMask.fieldPaths=geUpd', keepalive);
  }

  // ---------- 同步 ----------
  function setState(s, err) { C.state = s; C.lastErr = err || ''; render(); }
  async function flush(keepalive) {
    clearTimeout(C.timer); C.timer = 0;
    if (!C.uid) return;
    if (C.busy) { C.again = true; return; }
    C.busy = true; setState('busy');
    try { await push(keepalive); setState('ok'); }
    catch (e) {
      setState('err', msg(e));
      if (e && (e.code === 'INVALID_REFRESH_TOKEN' || e.code === 'TOKEN_EXPIRED' || e.code === 'USER_NOT_FOUND')) logout(true);
      else C.timer = setTimeout(() => flush(), 60000);
    } finally {
      C.busy = false;
      if (C.again) { C.again = false; flush(); }
    }
  }
  function changed() {
    if (!C.uid) return;
    setState('dirty');
    clearTimeout(C.timer); C.timer = setTimeout(() => flush(), SAVE_DELAY);
  }
  // 登入後：雲端有存檔就用雲端的；雲端沒有就把這台裝置的進度上傳
  async function afterLogin(isNew) {
    setState('busy');
    const r = await pull();
    const local = G.getSave();
    if (r.save && !isNew) {
      if ((local.upd || 0) > r.upd && C.sameDevice) { await flush(); G.toast('☁️ 已把這台裝置較新的進度上傳'); }
      else { G.setSave(r.save); G.toast('☁️ 已載入雲端存檔'); setState('ok'); }
    } else {
      await flush();
      G.toast(isNew ? '☁️ 帳號建立好了，目前進度已上傳' : '☁️ 已把這台裝置的進度上傳到雲端');
    }
  }

  async function login(name, pw, isNew) {
    name = String(name || '').trim(); pw = String(pw || '');
    if (!NAME_RE.test(name)) throw '帳號名稱要 3～16 個字（英文、數字、底線或中文）';
    if (isNew && pw.length < 6) throw '密碼至少 6 個字';
    if (!pw) throw '請輸入密碼';
    const email = await fbEmail(name);
    const j = isNew ? await auth('signUp', { email, password: pw }) : await auth('signInWithPassword', { email, password: fbPw(pw) });
    C.name = name; C.sameDevice = false;
    setTok(j.idToken, j.refreshToken, j.expiresIn, j.localId);
    await afterLogin(isNew);
  }
  function logout(expired) {
    clearTimeout(C.timer);
    C.uid = null; C.rt = null; C.id = null; C.name = '';
    remember(); setState('off');
    // 登出後回到全新的本機存檔，避免下一個人接著玩到別人的進度
    G.setSave(G.freshSave());
    if (expired) G.toast('☁️ 登入已過期，請重新登入');
  }

  // ---------- 介面 ----------
  const $ = id => document.getElementById(id);
  const STATE_TXT = { off: '', ok: '已同步', dirty: '等待同步…', busy: '同步中…', err: '同步失敗' };
  function render() {
    const b = $('cloudBtn'); if (!b) return;
    if (!C.uid) { b.innerHTML = '☁️ 登入 / 註冊'; b.className = ''; }
    else { b.innerHTML = `☁️ <b>${esc(C.name)}</b> <small>${STATE_TXT[C.state] || ''}</small>`; b.className = C.state === 'err' ? 'err' : 'on'; }
    const st = $('acctState');
    if (st) st.textContent = C.uid ? (C.state === 'err' ? C.lastErr : STATE_TXT[C.state]) : '';
  }
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function openPanel() {
    const ov = $('acct'); ov.classList.remove('hidden');
    $('acctIn').classList.toggle('hidden', !!C.uid);
    $('acctOut').classList.toggle('hidden', !C.uid);
    $('acctMsg').textContent = '';
    if (C.uid) $('acctName').textContent = C.name;
    render();
  }
  async function submit(isNew) {
    const m = $('acctMsg'); m.className = ''; m.textContent = isNew ? '建立帳號中…' : '登入中…';
    $('acctLogin').disabled = $('acctSignup').disabled = true;
    try {
      await login($('acctUser').value, $('acctPw').value, isNew);
      $('acctPw').value = '';
      $('acct').classList.add('hidden');
    } catch (e) {
      if (C.uid && !isNew) { /* 已經登入但同步失敗：保留登入 */ $('acct').classList.add('hidden'); setState('err', msg(e)); }
      m.className = 'bad'; m.textContent = msg(e);
    } finally { $('acctLogin').disabled = $('acctSignup').disabled = false; }
  }

  function init() {
    $('cloudBtn').onclick = openPanel;
    $('acctClose').onclick = () => $('acct').classList.add('hidden');
    $('acctLogin').onclick = () => submit(false);
    $('acctSignup').onclick = () => submit(true);
    $('acctPw').addEventListener('keydown', e => { if (e.key === 'Enter') submit(false); });
    $('acctLogout').onclick = () => { flush().finally(() => { logout(); $('acct').classList.add('hidden'); G.toast('已登出'); }); };
    $('acctSync').onclick = () => flush();
    document.addEventListener('visibilitychange', () => { if (document.hidden && C.timer) flush(true); });
    // 上次登入過：自動恢復，並看看雲端有沒有比較新的進度（例如在別台裝置玩過）
    let saved = null; try { saved = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) { /* 沒有 */ }
    if (saved && saved.uid && saved.rt) {
      C.uid = saved.uid; C.name = saved.name || ''; C.rt = saved.rt; C.sameDevice = true;
      render();
      (async () => {
        try {
          const r = await pull();
          const local = G.getSave();
          if (r.save && r.upd > (local.upd || 0)) { G.setSave(r.save); G.toast('☁️ 已載入其他裝置的最新進度'); setState('ok'); }
          else if ((local.upd || 0) > r.upd) await flush();
          else setState('ok');
        } catch (e) {
          if (e && (e.code === 'INVALID_REFRESH_TOKEN' || e.code === 'TOKEN_EXPIRED' || e.code === 'USER_NOT_FOUND')) logout(true);
          else setState('err', msg(e));
        }
      })();
    }
    render();
  }

  G.cloud = { init, changed, flush, state: () => C };
})(window.GE);
