/* =====================================================================
   ОСТРІВЕЦЬ — Машрум сам звертається до гостя (гілка A).
   Тексти й відповіді — DATA.aiChat.island, стилі — css/mg-island.css.

   Стани (тех. схема в дизайні):
     спокій     — плаваючий грибочок, над ним QR;
     звернення  — біла «пігулка» заввишки з грибочок у спокої розгортається вліво,
                  Машрум відкочується в її лівий край і трохи зменшується,
                  поруч — текст; на місці грибочка — білий круглий хрестик.
   • Тап по тексту — чат: звернення МГ + його продовження з товарами й тегами.
   • Тап по Машруму — як завжди, чат (острівець згортається).
   • Хрестик, Esc, перехід на інший екран — згорнути.
   • Тригер для тесту — головна: проскролили «Тільки онлайн», зʼявився банер за ним.
     DATA.aiChat.island.repeat: true — щоразу, як банер знову заїжджає на екран (демо);
     false — раз за сесію («На початок» — знову).
   Гілка B не використовує: там Машрум живе в таб-барі.
   ===================================================================== */

const MgIsland = {
  root: null,
  context: null,

  init() {
    const fab = document.querySelector('.fab-stack .ai-fab');
    if (!fab || (typeof Branch !== 'undefined' && Branch.current === 'b')) return;
    this.initVersions();

    const root = document.createElement('div');
    root.className = 'mg-island';
    fab.before(root);
    root.innerHTML = `
      <div class="mg-island__surface">
        <button class="mg-island__text" type="button"></button>
      </div>
      <button class="mg-island__close" type="button" aria-label="Сховати звернення">
        <img src="assets/icons/close.svg" alt="">
      </button>
      <span class="visually-hidden" role="status"></span>`;
    root.append(fab); // грибочок — останнім, над «пігулкою»
    this.root = root;
    this.text = root.querySelector('.mg-island__text');
    this.live = root.querySelector('[role="status"]');

    this.text.addEventListener('click', () => this.activate());
    root.querySelector('.mg-island__close').addEventListener('click', () => this.hide());
    fab.addEventListener('click', () => this.hide(), true); // чат відкриє js/ai-chat.js
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && this.isOpen()) this.hide(); });
    document.addEventListener('screenchange', () => this.hide());

    // ширина «пігулки» — від лівого поля телефона до хрестика
    new ResizeObserver(() => this.layout()).observe(document.querySelector('.phone'));
    this.layout();
    this.hide();
    this.watchHome();
  },

  isOpen() { return this.root.classList.contains('is-open'); },

  /* ---------- Експеримент: тема острівця ----------
     Світлий / Темний + «Скло» (напівпрозоре матове, вмикається поверх будь-якої теми).
     Перемикач «Острівець» — під перемикачем тегів; вибір памʼятається.
     Стилі — css/mg-island-themes.css (атрибути data-island-theme і data-island-glass на <html>). */
  themes: { light: 'Світлий', dark: 'Темний' },
  setTheme({ theme = this.theme, glass = this.glass, remember = false } = {}) {
    this.theme = this.themes[theme] ? theme : 'light';
    this.glass = Boolean(glass);
    const html = document.documentElement;
    html.dataset.islandTheme = this.theme;
    if (this.glass) html.dataset.islandGlass = ''; else delete html.dataset.islandGlass;
    document.querySelectorAll('[data-island-theme-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.islandThemeBtn === this.theme)));
    document.querySelectorAll('[data-island-glass-btn]').forEach(b => b.setAttribute('aria-pressed', String(this.glass)));
    if (remember) try { localStorage.setItem('silpo-island-look', JSON.stringify({ theme: this.theme, glass: this.glass })); } catch (e) { /* ок */ }
  },
  initVersions() {
    const box = document.createElement('div');
    box.className = 'chips-toggle island-toggle';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Вигляд острівця');
    box.innerHTML = '<span class="chips-toggle__label">Острівець</span>'
      + Object.entries(this.themes).map(([k, label]) =>
        `<button class="chips-toggle__btn" type="button" data-island-theme-btn="${k}" aria-pressed="false">${label}</button>`).join('')
      + '<span class="island-toggle__sep" aria-hidden="true"></span>'
      + '<button class="chips-toggle__btn" type="button" data-island-glass-btn aria-pressed="false">Скло</button>';
    document.body.appendChild(box);
    box.addEventListener('click', e => {
      const t = e.target.closest('[data-island-theme-btn]');
      if (t) this.setTheme({ theme: t.dataset.islandThemeBtn, remember: true });
      if (e.target.closest('[data-island-glass-btn]')) this.setTheme({ glass: !this.glass, remember: true });
    });
    let saved = {};
    try { saved = JSON.parse(localStorage.getItem('silpo-island-look')) || {}; } catch (e) { /* приватний режим */ }
    const d = DATA.aiChat.island;
    this.setTheme({ theme: saved.theme || d.theme || 'light', glass: saved.glass ?? d.glass ?? false });
  },

  /** Геометрія в пікселях: слот грибочка 76×112, «пігулка» — ліворуч від хрестика */
  layout() {
    const phone = document.querySelector('.phone').getBoundingClientRect();
    const slot = this.root.getBoundingClientRect();
    if (!slot.width) return;
    const cs = getComputedStyle(this.root);
    const h = parseFloat(cs.getPropertyValue('--isl-h'));        // висота «пігулки»
    const close = parseFloat(cs.getPropertyValue('--isl-close')); // кружечок із хрестиком
    const gap = parseFloat(cs.getPropertyValue('--isl-gap'));    // між «пігулкою» й хрестиком
    const edge = parseFloat(cs.getPropertyValue('--isl-edge'));  // від лівого краю телефона
    const closeLeft = (slot.width - close) / 2;                  // хрестик — по центру слота
    const right = slot.width - closeLeft + gap;                   // правий край «пігулки» від правого краю слота
    const width = (slot.left - phone.left) + (slot.width - right) - edge;
    this.root.style.setProperty('--isl-right', right + 'px');
    this.root.style.setProperty('--isl-w', Math.round(width) + 'px');
    // Машрум — у лівий край «пігулки»: центр грибочка → центр кола висотою h
    const inset = parseFloat(cs.getPropertyValue('--isl-inset')) || 0; // «паспарту» зліва
    const target = slot.width - right - width + h / 2 + inset;
    this.root.style.setProperty('--isl-travel', Math.round(target - slot.width / 2) + 'px');
  },

  /** Показати звернення; ctx — звідки і що МГ продовжить у чаті (DATA.aiChat.island.<ключ>) */
  speak(key) {
    const ctx = DATA.aiChat.island[key];
    if (!ctx) return;
    this.context = ctx;
    this.layout();
    this.text.textContent = ctx.text;
    this.live.textContent = ctx.text;
    this.root.querySelector('.mg-island__surface').inert = false;
    this.root.querySelector('.mg-island__close').inert = false;
    this.root.classList.add('is-open');
  },

  hide() {
    if (!this.root) return;
    this.root.classList.remove('is-open');
    this.root.querySelector('.mg-island__surface').inert = true;
    this.root.querySelector('.mg-island__close').inert = true;
    this.live.textContent = '';
  },

  /** Тап по тексту — чат: звернення як перша репліка МГ, далі його продовження */
  activate() {
    const ctx = this.context;
    this.hide();
    if (!ctx || typeof AiChat === 'undefined') return;
    AiChat.open({ greet: false });
    AiChat.greetedOn = AiChat.contextKey(); // уже в розмові — вітатися не треба
    if (!AiChat.thread.some(m => m.from === 'user')) AiChat.thread = [];
    AiChat.thread.push({ from: 'bot', text: ctx.text });
    AiChat.anchor = null;
    AiChat.render();
    const r = ctx.reply;
    const items = (r.items || []).map(i => (typeof i === 'string' ? { id: i } : i));
    AiChat.reply(this.fill(r.answer, items, r.countForms), items, AiChat.nodes(r.next), r.mood);
  },

  /** Підстановки у відповіді: {count} {countWord} {sum} — набір; {deliveryRules} {deliveryHere} — доставка
      за тими самими правилами, що й у кошику (DATA.cart.delivery) */
  fill(text, items, forms) {
    const money = v => UI.money(v).replace('.00', '');
    const D = DATA.cart.delivery;
    const sum = items.reduce((t, i) => t + DATA.products[i.id].price, 0);
    const tiers = [...D.tiers].sort((a, b) => a.from - b.from);
    const rules = [`до ${money(tiers[0].from)} — ${money(D.price)}`,
      ...tiers.map(t => `від ${money(t.from)} — ${t.price <= 1 ? 'за ' : ''}${money(t.price)}`)].join(', ');
    let here = D.price;
    tiers.forEach(t => { if (sum >= t.from) here = t.price; });
    return text
      .split('{count}').join(items.length)
      .split('{countWord}').join(forms ? aiPlural(items.length, forms) : '')
      .split('{sum}').join(money(sum))
      .split('{deliveryRules}').join(rules)
      .split('{deliveryHere}').join(money(here));
  },

  /** Головна: банер після «Тільки онлайн» зʼявився на екрані — Машрум заговорює.
      DATA.aiChat.island.repeat — щоразу, як банер знову заїжджає на екран (для демо);
      інакше — раз за сесію. */
  watchHome() {
    let done = false, visible = false;
    const io = new IntersectionObserver(entries => {
      const seen = entries.some(e => e.isIntersecting);
      const cameIn = seen && !visible; // щойно заїхав, а не просто ще на екрані
      visible = seen;
      // демо: банер виїхав з екрана — згортаємо, щоб наступного разу анімація програлась знову
      if (!seen && DATA.aiChat.island.repeat) this.hide();
      if (!cameIn || done) return;
      const home = App.current && App.current.id === 'home';
      const chatOpen = typeof AiChat !== 'undefined' && AiChat.el && !AiChat.el.hidden;
      if (!home || chatOpen) return;
      if (!DATA.aiChat.island.repeat) { done = true; io.disconnect(); }
      this.speak('home');
    }, { threshold: 0.6 });
    const banner = document.querySelector('#home .home-banner');
    if (banner) io.observe(banner);
  },
};

document.addEventListener('DOMContentLoaded', () => setTimeout(() => MgIsland.init()));
