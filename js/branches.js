/* =====================================================================
   ГІЛКИ ДИЗАЙНУ — два напрями прототипу, які перемикаються кнопками
   «Дизайн A | B» під «На початок» (поза телефоном).
   • A — основний прототип (усі файли як є).
   • B — надбудова над A: змінює лише те, що описано у файлах гілки,
     решта (кошик, навігація, чат) спільна. Файли гілки B:
       js/branches/b.js   — зміни текстів/даних і, за потреби, свої екрани
       css/branches/b.css — зміни стилів (селектори з [data-branch="b"])
   • C — демо-збірка: база A (МГ-острівець у кутку) + пошук із B і жовті
     теги МГ лише на каталозі, лістингу, картці товару й у кошику — js/branches/c.js.
     Спільні з B надбудови вмикає features у Branch.list.
   • Перемикання перезапускає прототип на тому ж екрані (кошик і чат з нуля).
   • Вибір памʼятається в браузері; для посилання на конкретну гілку
     додайте ?branch=b перед #: index.html?branch=b#pdp/banana
   ===================================================================== */

const Branch = {
  /** Назви гілок у перемикачі; title — підказка при наведенні */
  list: {
    a: { label: 'A', title: 'Гілка A — основний дизайн' },
    b: { label: 'B', title: 'Гілка B — альтернативний дизайн', features: ['search', 'mg'] },
    c: { label: 'C', title: 'Гілка C — демо: A + пошук і теги МГ із B', features: ['search', 'mg'] },
  },
  fallback: 'a',
  storageKey: 'silpo-branch',

  /** Зміни для кожної гілки: { data, screens } — заповнюють js/branches/<id>.js */
  overrides: {},

  /** Поточна гілка: ?branch= в адресі → збережений вибір → A */
  current: (() => {
    const fromUrl = new URLSearchParams(location.search).get('branch');
    let saved = null;
    try { saved = localStorage.getItem('silpo-branch'); } catch (e) { /* приватний режим */ }
    return fromUrl || saved || 'a';
  })(),

  /** Чи бере поточна гілка спільну надбудову: 'search' — підказки пошуку (js/branches/b-search.js),
      'mg' — жовті чипи «Помічник може допомогти» (js/branches/b-mg.js) */
  has(feature) {
    return (this.list[this.current]?.features || []).includes(feature);
  },

  /** Файл гілки описує свої зміни: Branch.define('b', { data: {...}, screens: {...} }) */
  define(id, { data, screens } = {}) {
    this.overrides[id] = { data: data || {}, screens: screens || {} };
  },

  /** Об'єднує зміни гілки з DATA: об'єкти — поглибше, масиви й значення — замінюються цілком */
  merge(target, patch) {
    Object.entries(patch).forEach(([k, v]) => {
      const isObj = x => x && typeof x === 'object' && !Array.isArray(x);
      if (isObj(v) && isObj(target[k])) this.merge(target[k], v);
      else target[k] = v;
    });
  },

  /** Викликає App.init до першого рендеру */
  apply() {
    if (!this.list[this.current]) this.current = this.fallback;
    document.documentElement.dataset.branch = this.current;
    const o = this.overrides[this.current];
    if (o) {
      this.merge(DATA, o.data);
      Object.assign(Screens, o.screens); // свій екран гілки замість основного
    }
    this.renderToggle();
    this.renderQr();
  },

  /** QR-код поза телефоном: онлайн-версія поточної гілки (assets/qr/branch-<id>.svg — tools/make-qr.py) */
  renderQr() {
    const card = document.querySelector('.qr-card');
    if (!card) return;
    card.querySelector('.qr-card__code').src = `assets/qr/branch-${this.current}.svg`;
    card.querySelector('.qr-card__hint').textContent = `Гілка ${this.list[this.current].label} · наведіть камеру`;
  },

  set(id) {
    if (id === this.current) return;
    try { localStorage.setItem(this.storageKey, id); } catch (e) { /* без памʼяті — через адресу */ }
    const url = new URL(location.href);
    url.searchParams.set('branch', id);
    location.replace(url.href); // той самий екран (#…), нова гілка
  },

  renderToggle() {
    const box = document.querySelector('.branch-toggle');
    if (!box) return;
    box.insertAdjacentHTML('beforeend', Object.entries(this.list).map(([id, b]) =>
      `<button class="chips-toggle__btn" type="button" data-branch-id="${id}" title="${b.title}"
               aria-pressed="${id === this.current}">${b.label}</button>`).join(''));
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-branch-id]');
      if (b) this.set(b.dataset.branchId);
    });
  },
};
