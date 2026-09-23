/* =====================================================================
   ГІЛКА B — картка товару як у Amazon (швидкий перегляд).
   Тап по товару (головна, лістинг, пошук) відкриває картку
   поверх поточного екрана; сусідні товари того ж списку визирають з боків
   і гортаються свайпом (мишею — перетягуванням, тачпадом — двома пальцями,
   з клавіатури — ← →).
   «Усі деталі» — повна картка товару (#pdp), «У кошик» → степер «− N шт +».
   Закривається хрестиком, тапом повз картку або Esc.
   Тексти — DATA.quickView (js/branches/b.js), стилі — css/branches/b-quickview.css.
   Товари в «Схожих товарах» і в чаті Машрума відкривають повну картку (#pdp).
   ===================================================================== */

const QuickView = {
  el: null,
  ids: [],
  index: 0,
  pending: null, // товар, по якому щойно тапнули (див. перехоплення App.go нижче)

  init() {
    const el = document.createElement('div');
    el.className = 'qv';
    el.hidden = true;
    el.innerHTML = `
      <button class="qv__close" type="button" aria-label="${DATA.quickView.close}">
        <img src="assets/icons/close.svg" alt="">
      </button>
      <div class="qv__viewport"><div class="qv__track"></div></div>`;
    document.querySelector('.phone').appendChild(el);
    this.el = el;
    this.track = el.querySelector('.qv__track');

    el.querySelector('.qv__close').addEventListener('click', () => this.close());
    // тап по затемненню (не по картці) — закрити
    el.addEventListener('click', e => { if (!e.target.closest('.qv-card, .qv__close') && !this.dragged) this.close(); });
    el.addEventListener('click', e => {
      const more = e.target.closest('[data-qv-details]');
      if (more) { this.close(); App.go('pdp', more.dataset.qvDetails); }
      // тап по сусідній картці — зробити її поточною
      const card = e.target.closest('.qv-card');
      if (card && !card.classList.contains('is-current') && !this.dragged) {
        e.stopPropagation(); e.preventDefault();
        this.show(Number(card.dataset.index));
      }
    }, true);
    document.addEventListener('keydown', e => {
      if (this.el.hidden) return;
      if (e.key === 'Escape') this.close();
      if (e.key === 'ArrowRight') this.show(this.index + 1);
      if (e.key === 'ArrowLeft') this.show(this.index - 1);
    });
    this.enableSwipe();
  },

  /** Відкрити товар id; сусіди — інші товари з того ж списку (link — картка, по якій тапнули) */
  open(id, link) {
    const list = link && link.parentElement
      ? [...link.parentElement.querySelectorAll(':scope > [data-go="pdp"][data-param]')].filter(n => !n.hidden)
      : [];
    this.ids = list.length ? [...new Set(list.map(n => n.dataset.param))] : [id];
    if (!this.ids.includes(id)) this.ids = [id];
    this.track.innerHTML = this.ids.map((pid, i) => this.card(pid, i)).join('');
    this.el.hidden = false;
    document.querySelector('.phone').classList.add('qv-open');
    requestAnimationFrame(() => this.el.classList.add('is-open'));
    this.show(this.ids.indexOf(id), { instant: true });
    Cart.render(); // степери й лайки в нових картках
  },

  close() {
    this.el.classList.remove('is-open');
    document.querySelector('.phone').classList.remove('qv-open');
    setTimeout(() => { if (!this.el.classList.contains('is-open')) { this.el.hidden = true; this.track.innerHTML = ''; } }, 220);
  },

  /** Зробити поточною картку i (з анімацією прокрутки) */
  show(i, { instant = false } = {}) {
    this.index = Math.max(0, Math.min(this.ids.length - 1, i));
    this.track.style.transition = instant ? 'none' : '';
    this.track.style.setProperty('--qv-index', this.index);
    this.track.style.setProperty('--qv-drag', '0px');
    this.track.querySelectorAll('.qv-card').forEach((c, n) => c.classList.toggle('is-current', n === this.index));
  },

  card(id, i) {
    const p = DATA.products[id];
    const info = DATA.pdp.products[id] || {};
    const Q = DATA.quickView;
    const rows = (info.details || []).slice(0, Q.detailRows);
    return `
      <article class="qv-card" data-index="${i}" aria-label="${p.name}">
        <div class="qv-card__scroll">
          <h2 class="qv-card__title">${p.shortName || p.name}</h2>
          ${p.rating ? `<span class="qv-card__rating"><img src="assets/icons/star.svg" alt="">${p.rating}</span>` : ''}
          <div class="qv-card__gallery">
            <img src="${p.image}" alt="${p.name}">
          </div>
          <div class="qv-card__bar">
            <span class="qv-card__dots" aria-hidden="true">
              ${Array.from({ length: DATA.pdp.gallery }, (_, n) => `<i class="${n === 0 ? 'is-active' : ''}"></i>`).join('')}
            </span>
            <button class="like-btn qv-card__like" type="button" data-like aria-pressed="false" aria-label="Вподобати">
              <img class="like-btn__off" src="assets/icons/heart-red.svg" alt="">
              <img class="like-btn__on" src="assets/icons/heart-red-filled.svg" alt="">
            </button>
          </div>
          <div class="qv-card__price">
            <strong>${UI.money(p.price).replace('.00', '')}</strong>
            ${p.oldPrice ? `<span class="price-old">${p.oldPrice.toFixed(2)}</span><span class="discount-tag">−${p.discount}%</span>` : ''}
            <span class="qv-card__weight">${p.weight}</span>
          </div>
          ${info.description ? `<p class="qv-card__text">${info.description}</p>` : ''}
          ${rows.length ? `<dl class="qv-card__rows">${rows.map(r => `<div><dt>${r.label}:</dt><dd>${r.value}</dd></div>`).join('')}</dl>` : ''}
          ${info.warning ? `<p class="qv-card__warning"><b>${info.warning.badge}</b>${info.warning.text}</p>` : ''}
        </div>
        <div class="qv-card__actions">
          <button class="qv-card__details" type="button" data-qv-details="${id}">${Q.details}</button>
          <div class="qty qv-card__cta" data-qty="${id}">
            <button class="qty__add" type="button" data-add="${id}">${Q.addToCart}</button>
            <div class="qty__stepper" role="group" aria-label="Кількість">
              <button type="button" data-remove="${id}" aria-label="Зменшити"><img src="assets/icons/minus-white.svg" alt=""></button>
              <output aria-live="polite">0 шт</output>
              <button type="button" data-add="${id}" aria-label="Збільшити"><img src="assets/icons/plus-white.svg" alt=""></button>
            </div>
          </div>
        </div>
      </article>`;
  },

  /** Свайп між картками: палець або миша; коротке перетягування — лише тап */
  enableSwipe() {
    let x0 = 0, y0 = 0, dx = 0, active = false, horizontal = null;
    const vp = this.el.querySelector('.qv__viewport');
    vp.addEventListener('pointerdown', e => {
      if (e.button !== 0 || e.target.closest('button')) return;
      active = true; horizontal = null; dx = 0; this.dragged = false;
      x0 = e.clientX; y0 = e.clientY;
    });
    vp.addEventListener('dragstart', e => e.preventDefault()); // картинка не «тягнеться» браузером

    /* Тачпад (свайп двома пальцями) і коліщатко з Shift: один жест — одна картка.
       У macOS після свайпу ще до секунди йдуть «інерційні» події — вони лише згасають.
       Новий жест відрізняємо від інерції за паузою або за різким зростанням швидкості. */
    const g = { axis: null, sx: 0, sy: 0, fired: false, firedAt: 0, last: 0, lastT: 0 };
    this.el.addEventListener('wheel', e => {
      const now = performance.now();
      const dxw = e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX;
      const dyw = e.shiftKey && !e.deltaX ? 0 : e.deltaY;
      const speed = Math.abs(dxw) + Math.abs(dyw);
      const fresh = now - g.lastT > 120                                  // пауза — новий жест
        || (g.fired && now - g.firedAt > 200 && speed > g.last * 1.6 + 3); // інерція згасала, а тут — розгін
      if (fresh) Object.assign(g, { axis: null, sx: 0, sy: 0, fired: false });
      g.last = speed; g.lastT = now;

      if (!g.axis) {
        g.sx += dxw; g.sy += dyw;
        if (Math.max(Math.abs(g.sx), Math.abs(g.sy)) >= 6) g.axis = Math.abs(g.sx) >= Math.abs(g.sy) * 0.7 ? 'x' : 'y';
        if (Math.abs(dxw) > Math.abs(dyw)) e.preventDefault();
        if (g.axis !== 'x') return; // вертикально — прокрутка вмісту картки
      } else if (g.axis === 'x') {
        e.preventDefault();
        g.sx += dxw;
      } else return;

      if (!g.fired && Math.abs(g.sx) > 24) {
        this.show(this.index + (g.sx > 0 ? 1 : -1));
        g.fired = true; g.firedAt = now; // решта жесту (інерція) далі не гортає
      }
    }, { passive: false });
    window.addEventListener('pointermove', e => {
      if (!active) return;
      dx = e.clientX - x0;
      if (horizontal === null && Math.hypot(dx, e.clientY - y0) > 6) horizontal = Math.abs(dx) > Math.abs(e.clientY - y0);
      if (!horizontal) return; // вертикально — прокрутка вмісту картки
      if (!this.dragged) try { vp.setPointerCapture(e.pointerId); } catch (err) { /* ок і без захоплення */ }
      this.dragged = true;
      this.track.style.transition = 'none';
      this.track.style.setProperty('--qv-drag', dx + 'px');
      e.preventDefault();
    });
    window.addEventListener('pointerup', () => {
      if (!active) return;
      active = false;
      if (horizontal) this.show(this.index + (dx < -50 ? 1 : dx > 50 ? -1 : 0));
      setTimeout(() => { this.dragged = false; }, 0); // клік після свайпу не рахується
    });
  },
};

if (Branch.current === 'b') {
  /* Перехоплюємо перехід на картку товару: запамʼятовуємо, по чому тапнули
     (фаза захоплення — до обробника в js/app.js), і замість переходу відкриваємо картку. */
  document.addEventListener('click', e => {
    const link = e.target.closest('[data-go="pdp"][data-param]');
    // «Схожі товари» на повній картці й товари в чаті — повна картка, не оверлей
    const skip = !link || e.target.closest('[data-add], [data-remove], [data-like], .ai-chat, .pdp-similar, .qv');
    QuickView.pending = skip ? null : { id: link.dataset.param, link };
  }, true);

  const go = App.go.bind(App);
  App.go = function (id, param, opts) {
    const p = QuickView.pending;
    QuickView.pending = null;
    if (id === 'pdp' && p && p.id === param) return QuickView.open(param, p.link);
    return go(id, param, opts);
  };

  document.addEventListener('DOMContentLoaded', () => QuickView.init());
}
