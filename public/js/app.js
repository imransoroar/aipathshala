/* Shared shell: header, footer, toasts, auth-aware nav. Include LAST. */
function navLinks() {
  const u = API.user();
  const adminLink = API.isAdmin()
    ? `<a href="/admin.html" data-i18n="nav_admin">${t('nav_admin')}</a>` : '';
  const authArea = API.isAuthed()
    ? `<a href="/dashboard.html" class="nav-dash" data-i18n="nav_dashboard">${t('nav_dashboard')}</a>
       ${adminLink}
       <div class="nav-user">
         <button class="avatar-btn" id="userMenuBtn">${(u && u.name ? u.name[0] : 'U').toUpperCase()}</button>
         <div class="user-menu" id="userMenu">
           <div class="user-menu-name">${u ? u.name : ''}</div>
           <a href="/dashboard.html" data-i18n="nav_dashboard">${t('nav_dashboard')}</a>
           <a href="#" id="logoutBtn" data-i18n="logout">${t('logout')}</a>
         </div>
       </div>`
    : `<a href="/login.html" class="btn btn-ghost" data-i18n="login">${t('login')}</a>
       <a href="/register.html" class="btn btn-primary" data-i18n="signup">${t('signup')}</a>`;

  return `
    <a href="/courses.html" data-i18n="nav_courses">${t('nav_courses')}</a>
    <a href="/courses.html#categories" data-i18n="nav_categories">${t('nav_categories')}</a>
    ${authArea}
    <button id="langToggle" class="lang-toggle" title="Language">${getLang() === 'bn' ? 'EN' : 'বাং'}</button>`;
}

function renderHeader() {
  const el = document.getElementById('site-header');
  if (!el) return;
  el.innerHTML = `
    <div class="container nav">
      <a class="logo" href="/">
        <span class="logo-mark">AI</span>
        <span class="logo-text" data-i18n="brand">${t('brand')}</span>
      </a>
      <button class="hamburger" id="hamburger" aria-label="menu">&#9776;</button>
      <nav class="nav-links" id="navLinks">${navLinks()}</nav>
    </div>`;
  wireHeader();
}

function wireHeader() {
  const tg = document.getElementById('langToggle');
  if (tg) tg.onclick = () => setLang(getLang() === 'bn' ? 'en' : 'bn');
  const lo = document.getElementById('logoutBtn');
  if (lo) lo.onclick = (e) => { e.preventDefault(); API.logout(); location.href = '/'; };
  const ham = document.getElementById('hamburger');
  if (ham) ham.onclick = () => document.getElementById('navLinks').classList.toggle('open');
  const umb = document.getElementById('userMenuBtn');
  if (umb) umb.onclick = (e) => { e.stopPropagation(); document.getElementById('userMenu').classList.toggle('open'); };
  document.addEventListener('click', () => { const m = document.getElementById('userMenu'); if (m) m.classList.remove('open'); });
}

function renderFooter() {
  const el = document.getElementById('site-footer');
  if (!el) return;
  const yr = new Date().getFullYear();
  el.innerHTML = `
    <div class="container footer-grid">
      <div>
        <div class="logo footer-logo"><span class="logo-mark">AI</span><span class="logo-text">${t('brand')}</span></div>
        <p class="muted" data-i18n="footer_about">${t('footer_about')}</p>
      </div>
      <div>
        <h4 data-i18n="nav_courses">${t('nav_courses')}</h4>
        <a href="/courses.html">${t('all_courses')}</a>
        <a href="/courses.html#categories">${t('nav_categories')}</a>
      </div>
      <div>
        <h4 data-i18n="nav_about">${t('nav_about')}</h4>
        <a href="#">Terms & Conditions</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Refund Policy</a>
      </div>
      <div>
        <h4>Contact</h4>
        <p class="muted">care@aipathshala.com<br>+880 1700-000000<br>Dhaka, Bangladesh</p>
      </div>
    </div>
    <div class="footer-bottom container">© ${yr} ${t('brand')}. <span data-i18n="footer_rights">${t('footer_rights')}</span></div>`;
}

function toast(msg, type) {
  let c = document.getElementById('toast-c');
  if (!c) { c = document.createElement('div'); c.id = 'toast-c'; c.className = 'toast-c'; document.body.appendChild(c); }
  const el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  el.textContent = msg;
  c.appendChild(el);
  setTimeout(() => el.classList.add('show'), 10);
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 3200);
}
window.toast = toast;

function requireLogin() {
  if (!API.isAuthed()) { location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search); return false; }
  return true;
}
window.requireLogin = requireLogin;

function bootShell() {
  renderHeader();
  renderFooter();
  applyI18n();
  document.addEventListener('langchange', () => { renderHeader(); renderFooter(); applyI18n(); });
}
document.addEventListener('DOMContentLoaded', bootShell);

/* ============ premium interactions (added) ============ */
// Sticky header shadow on scroll
function initScrollHeader(){
  const h=document.getElementById('site-header');
  if(!h) return;
  const on=()=>h.classList.toggle('scrolled', window.scrollY>8);
  on(); window.addEventListener('scroll', on, {passive:true});
}

// Scroll-reveal using IntersectionObserver
let _revealObs=null;
function initReveal(){
  if(!('IntersectionObserver' in window)){ document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in')); return; }
  _revealObs=new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); _revealObs.unobserve(e.target); } });
  },{threshold:.12, rootMargin:'0px 0px -40px 0px'});
  revealScan();
}
function revealScan(){ if(_revealObs) document.querySelectorAll('.reveal:not(.in)').forEach(e=>_revealObs.observe(e)); }
window.revealScan=revealScan;

// Animated number counters: <b data-count="2000" data-suffix="+">
function animateCounters(scope){
  (scope||document).querySelectorAll('[data-count]:not(.counted)').forEach(el=>{
    const target=parseFloat(el.getAttribute('data-count'))||0;
    const suffix=el.getAttribute('data-suffix')||'';
    const dec=(el.getAttribute('data-dec')|0);
    el.classList.add('counted');
    const run=()=>{
      const dur=1400, t0=performance.now();
      const tick=(t)=>{ const p=Math.min(1,(t-t0)/dur); const e=1-Math.pow(1-p,3);
        const v=target*e; el.textContent=(dec?v.toFixed(dec):Math.round(v).toLocaleString(getLang()==='bn'?'bn-BD':'en-US'))+suffix;
        if(p<1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    };
    if('IntersectionObserver' in window){
      const o=new IntersectionObserver((en)=>{en.forEach(x=>{if(x.isIntersecting){run();o.disconnect();}})},{threshold:.4});
      o.observe(el);
    } else run();
  });
}
window.animateCounters=animateCounters;

document.addEventListener('DOMContentLoaded', ()=>{ initScrollHeader(); initReveal(); animateCounters(); });
