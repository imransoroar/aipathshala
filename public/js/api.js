/* Tiny API client + auth/token helpers (token stored in localStorage). */
const API = {
  token() { return localStorage.getItem('token'); },
  setToken(t) { t ? localStorage.setItem('token', t) : localStorage.removeItem('token'); },
  user() { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } },
  setUser(u) { u ? localStorage.setItem('user', JSON.stringify(u)) : localStorage.removeItem('user'); },
  isAuthed() { return !!this.token(); },
  isAdmin() { const u = this.user(); return u && u.role === 'admin'; },

  async req(method, path, body) {
    const headers = { 'Content-Type': 'application/json' };
    const tk = this.token();
    if (tk) headers.Authorization = 'Bearer ' + tk;
    const res = await fetch('/api' + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch { /* no body */ }
    if (!res.ok) throw Object.assign(new Error((data && data.error) || ('Error ' + res.status)), { status: res.status, data });
    return data;
  },
  get(p) { return this.req('GET', p); },
  post(p, b) { return this.req('POST', p, b); },
  patch(p, b) { return this.req('PATCH', p, b); },
  del(p) { return this.req('DELETE', p); },

  async login(email, password) {
    const r = await this.post('/auth/login', { email, password });
    this.setToken(r.token); this.setUser(r.user); return r.user;
  },
  async register(payload) {
    const r = await this.post('/auth/register', payload);
    this.setToken(r.token); this.setUser(r.user); return r.user;
  },
  logout() { this.setToken(null); this.setUser(null); },
};
window.API = API;

window.money = (amount, currency) => {
  const c = currency || 'BDT';
  if (!amount || amount <= 0) return t('free');
  const symbol = c === 'BDT' ? '৳' : c + ' ';
  return symbol + Number(amount).toLocaleString(getLang() === 'bn' ? 'bn-BD' : 'en-US');
};
