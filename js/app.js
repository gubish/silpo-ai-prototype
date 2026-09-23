/* =====================================================================
   APP — навігація між екранами, кошик, лайки, drag-скрол каруселей.
   ===================================================================== */

/* Колір статус-бару для кожного екрана (лавандовий / білий) */
const STATUSBAR_BG = {
  home: 'var(--bg-lavender)',
  catalog: 'var(--bg-lavender)',
  thankyou: 'var(--bg-lavender)',
  listing: 'var(--white)',
  search: 'var(--white)',
  pdp: 'var(--white)',
  cart: 'var(--white)',
  checkout: 'var(--white)',
};

/* ---------------- Кошик (спільний для всіх екранів) ---------------- */
const Cart = {
  items: new Map(), // id товару → кількість

  add(id, delta = 1) {
    const qty = Math.max(0, (this.items.get(id) || 0) + delta);
    if (qty) this.items.set(id, qty); else this.items.delete(id);
    this.render();
  },
  count() {
    let n = 0; this.items.forEach(q => { n += q; }); return n;
  },
  total() {
    let sum = 0; this.items.forEach((q, id) => { sum += q * DATA.products[id].price; }); return sum;
  },
  clear() { this.items.clear(); this.render(); },

  /* --- Розрахунки для кошика й чекауту --- */
  /** Сума за старими цінами (до знижок) */
  goodsTotal() {
    let sum = 0; this.items.forEach((q, id) => { const p = DATA.products[id]; sum += q * (p.oldPrice || p.price); }); return sum;
  },
  /** Скільки зекономлено на знижках */
  discountTotal() { return this.goodsTotal() - this.total(); },
  /** Вартість доставки за порогами з DATA.cart.delivery */
  deliveryPrice() {
    const d = DATA.cart.delivery;
    let price = d.price;
    d.tiers.forEach(t => { if (this.total() >= t.from) price = t.price; });
    return this.count() ? price : 0;
  },
  payable() { return this.total() + this.deliveryPrice(); },
  /** Орієнтовна вага: «250 г» → 0.25, «0,75 л» → 0.75 */
  weightKg() {
    let kg = 0;
    this.items.forEach((q, id) => {
      const m = String(DATA.products[id].weight || '').replace(',', '.').match(/([\d.]+)\s*(кг|г|л|мл)/);
      if (m) kg += q * parseFloat(m[1]) / (m[2] === 'г' || m[2] === 'мл' ? 1000 : 1);
    });
    return kg;
  },
  /** Оновлює всі лічильники на сторінці */
  render() {
    // «+» → степер «− N шт +» (лістинг, кошик)
    document.querySelectorAll('[data-qty]').forEach(el => {
      const qty = this.items.get(el.dataset.qty) || 0;
      el.classList.toggle('has-qty', qty > 0);
      el.querySelector('output').textContent = qty + ' шт';
    });
    const count = this.count();
    document.querySelectorAll('[data-cart-count]').forEach(el => { el.hidden = !count; el.textContent = count; });
    document.querySelectorAll('[data-cart-label]').forEach(el => { el.textContent = count ? UI.money(this.total()) : 'Кошик'; });
    document.querySelectorAll('[data-cart-total]').forEach(el => { el.textContent = UI.money(this.total()); });
    document.querySelectorAll('[data-cart-visible]').forEach(el => { el.hidden = !count; });
    placeFabs(); // плашка кошика зʼявилась / зникла — грибочок посунувся
    // екрани, яким треба перемалюватися при зміні кошика (кошик, чекаут)
    Object.values(Screens).forEach(s => s.update && s.update());
  },
};

/* ---------------- Навігація ----------------
   Адреса екрана: #id або #id/параметр — напр. #listing/fruits, #pdp/banana.
   Екрани з параметром (лістинг, картка товару) перемальовуються при його зміні;
   без параметра відкривається те, що було відкрито останнім. */
const App = {
  current: null,
  params: {},      // останній параметр кожного екрана
  rendered: {},    // з яким параметром екран намальований

  /** Історія переходів для «Назад»: [{ id, param, chat }] (chat — екран був під відкритим чатом) */
  history: [],

  go(id, param, { record = true, fromChat = false } = {}) {
    const next = document.getElementById(id);
    if (!next) return;
    if (record && this.current) {
      const prev = { id: this.current.id, param: this.params[this.current.id], chat: fromChat };
      if (prev.id !== id || (param && param !== prev.param)) this.history.push(prev);
    }
    if (param) this.params[id] = param;
    param = this.params[id];
    if (this.rendered[id] !== param) this.renderScreen(next, param);
    if (next !== this.current) {
      if (this.current) this.current.classList.remove('is-active');
      next.classList.add('is-active');
      this.current = next;
    }
    next.scrollTop = 0;
    document.querySelector('.statusbar').style.setProperty('--statusbar-bg', STATUSBAR_BG[id] || 'var(--white)');
    document.querySelector('.qr-fab').hidden = id !== 'home'; // QR — лише на головній
    placeFabs();
    const hash = '#' + id + (param ? '/' + param : '');
    if (location.hash !== hash) history.pushState(null, '', hash);
    Cart.render();
    // інші модулі (чат) дізнаються про перехід
    document.dispatchEvent(new CustomEvent('screenchange', { detail: { id, param } }));
  },

  /** «Назад»: на екран, з якого прийшли (або в чат, якщо прийшли з нього) */
  back() {
    const prev = this.history.pop();
    if (!prev) return this.go('home', undefined, { record: false });
    if (prev.chat && typeof AiChat !== 'undefined') return AiChat.returnTo(prev);
    this.go(prev.id, prev.param, { record: false });
  },

  renderScreen(el, param) {
    const render = Screens[el.id];
    if (!render) return;
    render(el, param);
    this.rendered[el.id] = param;
    el.querySelectorAll('.hscroll').forEach(enableDragScroll);
  },

  /** «#pdp/banana» → ['pdp', 'banana'] */
  fromHash() {
    const [id, param] = decodeURIComponent(location.hash.slice(1)).split('/');
    return document.getElementById(id) ? [id, param] : ['home'];
  },

  init() {
    // гілка дизайну A / B: її дані й екрани — до першого рендеру (js/branches.js)
    Branch.apply();
    // статус-бар
    document.querySelector('.statusbar__time').textContent = DATA.statusBar.time;
    // стартовий вміст кошика (DATA.cart.startItems)
    Object.entries(DATA.cart.startItems || {}).forEach(([id, q]) => Cart.items.set(id, q));

    // рендер усіх екранів
    document.querySelectorAll('.screen').forEach(el => this.renderScreen(el));

    document.addEventListener('click', onClick);

    // працює «Назад» браузера та відкриття потрібного екрана за адресою
    window.addEventListener('hashchange', () => this.go(...this.fromHash()));
    this.go(...this.fromHash());
  },
};

/** Висота, на якій висить грибочок: клавіатура (якщо відкрита) + нижня панель екрана + плашка кошика (якщо видима) */
function placeFabs() {
  const screen = App.current;
  if (!screen) return;
  const bar = screen.querySelector('.tabbar, .plp-bottom, .search-bottom, .pdp-bottom, .cart-bottom, .co-bottom, .cat-bottom, .ty-actions');
  const pill = screen.querySelector('.cart-pill:not([hidden])');
  const h = el => (el ? el.getBoundingClientRect().height : 0);
  // відкрита iOS-клавіатура (js/keyboard.js) теж піднімає грибочок — над нею
  const kb = screen.classList.contains('has-keyboard') ? h(document.querySelector('.kb')) : 0;
  const bottom = kb + h(bar) + (pill ? h(pill) + 10 : 0) + 16;
  document.querySelector('.fab-stack').style.setProperty('--fab-bottom', Math.round(bottom) + 'px');
}

function onClick(e) {
  // «На початок»: чистий старт з головної — кошик, чат, лайки й фільтри з нуля
  if (e.target.closest('[data-restart]')) {
    history.replaceState(null, '', '#home');
    location.reload();
    return;
  }
  const add = e.target.closest('[data-add]');
  if (add) { e.stopPropagation(); Cart.add(add.dataset.add); return; }
  // «У кошик» на PDP: додати товар і перейти в кошик
  const addGo = e.target.closest('[data-add-go]');
  if (addGo) { Cart.add(addGo.dataset.addGo); App.go('cart'); return; }
  if (e.target.closest('[data-cart-clear]')) { Cart.clear(); return; }
  const removeAll = e.target.closest('[data-remove-all]');
  if (removeAll) { e.stopPropagation(); Cart.add(removeAll.dataset.removeAll, -Infinity); return; }
  const remove = e.target.closest('[data-remove]');
  if (remove) { e.stopPropagation(); Cart.add(remove.dataset.remove, -1); return; }

  const like = e.target.closest('[data-like]');
  if (like) {
    e.stopPropagation();
    like.setAttribute('aria-pressed', like.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    return;
  }

  // вибір одного варіанта з групи (спосіб доставки, день, час, тип адреси)
  const choice = e.target.closest('[data-choice]');
  if (choice) {
    const group = choice.dataset.choice;
    choice.closest('.screen').querySelectorAll(`[data-choice="${group}"]`)
      .forEach(el => el.setAttribute('aria-pressed', el === choice ? 'true' : 'false'));
    return;
  }

  // чипси-перемикачі (вкл/викл)
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    toggle.setAttribute('aria-pressed', toggle.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    return;
  }

  // перехід до секції на тому ж екрані (нижня панель каталогу)
  const jump = e.target.closest('[data-scroll-to]');
  if (jump) {
    jump.parentElement.querySelectorAll('.is-active').forEach(el => el.classList.remove('is-active'));
    jump.classList.add('is-active');
    document.getElementById(jump.dataset.scrollTo)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  // data-back — «Назад» туди, звідки прийшли (кошик, картка товару)
  if (e.target.closest('[data-back]')) { App.back(); return; }

  // data-param — який товар / яку категорію відкрити (#pdp/banana, #listing/fruits)
  const link = e.target.closest('[data-go]');
  if (link) App.go(link.dataset.go, link.dataset.param);
}

/* ---------------- Drag-скрол каруселей мишею ---------------- */
function enableDragScroll(row) {
  let startX = 0, startScroll = 0, dragging = false, moved = false;

  row.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    dragging = true; moved = false;
    startX = e.clientX; startScroll = row.scrollLeft;
  });
  window.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) { moved = true; row.classList.add('is-dragging'); }
    if (moved) { row.scrollLeft = startScroll - dx; e.preventDefault(); }
  });
  window.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    row.classList.remove('is-dragging');
  });
  // клік після перетягування не повинен відкривати товар
  row.addEventListener('click', e => {
    if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; }
  }, true);
  row.addEventListener('dragstart', e => e.preventDefault());
  row.addEventListener('keydown', e => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    row.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * row.clientWidth * 0.7, behavior: 'smooth' });
  });
}

document.addEventListener('DOMContentLoaded', () => App.init());
