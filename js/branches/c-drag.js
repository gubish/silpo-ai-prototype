/* =====================================================================
   ГІЛКА C — Машрума можна перетягнути й кинути будь-де на екрані.
   • Тап — як і раніше, чат. Перетягування починається, коли палець
     зрушив на кілька пікселів (тоді тап не спрацьовує).
   • Кинули на стікі-футер (нижня панель, плашка кошика, клавіатура) —
     МГ плавно відʼїжджає трохи вище за нього. На інших екранах теж
     тримається над їхнім футером.
   • Викинули за межі екрана (або різко жбурнули до краю) — МГ зникає:
     «відмахнувся й вимкнув». Внизу — «Машрум сховався · Повернути»;
     «На початок» теж повертає його в кут.
   • Поки МГ не в кутку, острівець (js/mg-island.js) не заговорює.
   Тексти — DATA.mgDrag (js/branches/c.js), стилі — css/branches/c-drag.css.
   ===================================================================== */

const MgDrag = {
  free: false,      // МГ уже не в кутку, а там, куди його кинули
  pos: null,        // лівий верхній кут слота 76×112 від лівого верхнього кута телефона
  /* видимий грибочок у слоті 76×112: коло ~64px, центр — 38px зліва, 40px від низу */
  slot: { w: 76, h: 112, cx: 38, cyFromBottom: 40, r: 32 },
  margin: 8,        // мінімальний відступ видимого грибочка від країв і футера
  dragStart: 6,     // скільки пікселів зрушити, щоб почалось перетягування
  flingSpeed: 1.1,  // px/мс: швидкий кидок до краю теж викидає
  footers: '.tabbar, .plp-bottom, .search-bottom, .pdp-bottom, .cart-bottom, .co-bottom, .cat-bottom, .ty-actions, .cart-pill:not([hidden])',

  init() {
    this.phone = document.querySelector('.phone');
    this.stack = document.querySelector('.fab-stack');
    this.el = this.stack.querySelector('.mg-island') || this.stack.querySelector('.ai-fab');
    if (!this.el) return;
    this.fab = this.el.matches('.ai-fab') ? this.el : this.el.querySelector('.ai-fab');
    this.fab.addEventListener('pointerdown', e => this.down(e));
    // після перетягування «клік» не відкриває чат (раніше за js/ai-chat.js і js/mg-island.js)
    document.addEventListener('click', e => {
      if (!this.suppress || !e.target.closest('.ai-fab')) return;
      e.stopPropagation();
      e.preventDefault();
    }, true);
    // на іншому екрані — інший футер: тримаємо МГ над ним
    document.addEventListener('screenchange', () => requestAnimationFrame(() => this.fit(true)));
    window.addEventListener('resize', () => this.fit(false));

    // поки МГ не в кутку, острівець мовчить
    if (typeof MgIsland !== 'undefined') {
      const speak = MgIsland.speak.bind(MgIsland);
      MgIsland.speak = key => (this.free || this.el.hidden ? undefined : speak(key));
    }
  },

  phoneRect() { return this.phone.getBoundingClientRect(); },

  /** Верхній край найвищого стікі-футера на поточному екрані (від верху телефона).
      Екран без футера (каталог) — «невидимий футер»: зона домашньої смужки iOS + 16px,
      щоб МГ і снекбар не падали в заокруглений кут */
  floor() {
    const ph = this.phoneRect();
    const css = getComputedStyle(document.documentElement);
    const safe = (parseFloat(css.getPropertyValue('--home-indicator-h')) || 20) + (parseFloat(css.getPropertyValue('--space-16')) || 16);
    let top = ph.height - safe;
    const screen = App.current;
    if (!screen) return top;
    const bars = [...screen.querySelectorAll(this.footers)];
    if (screen.classList.contains('has-keyboard')) bars.push(document.querySelector('.kb'));
    bars.forEach(b => {
      const r = b && b.getBoundingClientRect();
      if (r && r.height) top = Math.min(top, r.top - ph.top);
    });
    return top;
  },

  /** Центр видимого грибочка для позиції слота */
  center(p) { return { x: p.left + this.slot.cx, y: p.top + this.slot.h - this.slot.cyFromBottom }; },

  /** Позиція в межах екрана: не за краями, не на статус-барі й не на футері */
  clamp(p) {
    const ph = this.phoneRect(), S = this.slot, m = this.margin;
    const sb = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--statusbar-h'));
    const top = Number.isNaN(sb) ? 54 : sb; // на справжньому телефоні намальованого статус-бару немає — 0
    const minX = m + S.r - S.cx, maxX = ph.width - m - S.r - S.cx;
    const minY = top + m + S.r - (S.h - S.cyFromBottom);
    const maxY = this.floor() - m - S.r - (S.h - S.cyFromBottom);
    return {
      left: Math.min(Math.max(p.left, minX), maxX),
      top: Math.min(Math.max(p.top, minY), Math.max(minY, maxY)),
    };
  },

  place(p, animate) {
    this.pos = p;
    this.el.classList.toggle('is-settling', Boolean(animate));
    this.el.style.left = p.left + 'px';
    this.el.style.top = p.top + 'px';
  },

  fit(animate) {
    if (!this.free || this.el.hidden) return;
    const p = this.clamp(this.pos);
    if (p.left !== this.pos.left || p.top !== this.pos.top) this.place(p, animate);
  },

  /* ---------- Перетягування ---------- */
  down(e) {
    if (e.button !== 0 || this.el.hidden) return;
    e.preventDefault(); // мишею не виділяти текст під час перетягування (тап-клік лишається)
    const r = this.el.getBoundingClientRect();
    this.drag = { x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top, moving: false, samples: [] };
    // слухаємо весь документ: коли МГ відривається від кута (переноситься в DOM),
    // браузер скидає захоплення пальця — рух не має загубитись
    const id = e.pointerId;
    document.documentElement.classList.add('mg-dragging'); // без виділення тексту, поки тягнемо
    const move = ev => { if (ev.pointerId === id) this.move(ev); };
    const up = ev => {
      if (ev.pointerId !== id) return;
      document.documentElement.classList.remove('mg-dragging');
      getSelection().removeAllRanges();
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      document.removeEventListener('pointercancel', up);
      this.up(ev);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
    document.addEventListener('pointercancel', up);
  },

  move(e) {
    const d = this.drag;
    if (!d) return;
    if (!d.moving) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < this.dragStart) return;
      d.moving = true;
      this.lift();
    }
    const ph = this.phoneRect();
    this.place({ left: e.clientX - ph.left - d.dx, top: e.clientY - ph.top - d.dy }, false);
    d.samples.push({ x: e.clientX, y: e.clientY, t: e.timeStamp });
    if (d.samples.length > 6) d.samples.shift();
    this.el.classList.toggle('is-leaving', this.isOut(this.pos));
  },

  /** Відриваємо МГ від кута: тепер він живе в телефоні сам по собі, на тому ж місці */
  lift() {
    if (typeof MgIsland !== 'undefined') MgIsland.hide();
    const r = this.el.getBoundingClientRect(), ph = this.phoneRect();
    if (!this.free) {
      this.phone.append(this.el);
      this.el.classList.add('mg-free');
      this.free = true;
    }
    this.place({ left: r.left - ph.left, top: r.top - ph.top }, false);
    this.el.classList.add('is-dragging');
  },

  /** Центр видимого грибочка — за межами екрана */
  isOut(p) {
    const ph = this.phoneRect(), c = this.center(p);
    return c.x < 0 || c.y < 0 || c.x > ph.width || c.y > ph.height;
  },

  up(e) {
    if (e.type === 'pointerup') this.move(e); // відпустили не там, де був останній рух
    const d = this.drag;
    this.drag = null;
    if (!d || !d.moving) return; // просто тап — чат відкриє js/ai-chat.js
    this.suppress = true;
    setTimeout(() => { this.suppress = false; });
    this.el.classList.remove('is-dragging', 'is-leaving');

    // швидкість за останні ~100 мс руху
    const s = d.samples.filter(x => e.timeStamp - x.t < 100);
    const a = s[0], b = s[s.length - 1];
    const dt = a && b && b.t > a.t ? b.t - a.t : 0;
    const v = dt ? { x: (b.x - a.x) / dt, y: (b.y - a.y) / dt } : { x: 0, y: 0 };
    const fast = Math.hypot(v.x, v.y) > this.flingSpeed;
    // куди долетить за чверть секунди
    const ahead = { left: this.pos.left + v.x * 250, top: this.pos.top + v.y * 250 };
    if (this.isOut(this.pos) || (fast && this.isOut(ahead))) return this.dismiss(v);
    this.place(this.clamp(this.pos), true);
  },

  /* ---------- Викинули — зник ---------- */
  dismiss(v) {
    const ph = this.phoneRect(), c = this.center(this.pos);
    // напрям — за рухом пальця, а якщо стояли — до найближчого краю
    let dir = { x: v.x, y: v.y };
    if (Math.hypot(dir.x, dir.y) < 0.2) dir = { x: c.x < ph.width / 2 ? -1 : 1, y: 0 };
    const len = Math.hypot(dir.x, dir.y);
    this.el.style.setProperty('--fly-x', Math.round(dir.x / len * 240) + 'px');
    this.el.style.setProperty('--fly-y', Math.round(dir.y / len * 240) + 'px');
    this.el.classList.add('is-gone');
    setTimeout(() => {
      this.el.hidden = true;
      this.el.classList.remove('is-gone');
      this.toast();
    }, 320);
  },

  /** МГ знову в кутку, як на старті */
  restore() {
    this.hideToast();
    this.el.classList.remove('mg-free', 'is-settling', 'is-dragging', 'is-leaving');
    this.el.style.left = this.el.style.top = '';
    this.stack.append(this.el);
    this.free = false;
    this.pos = null;
    this.el.hidden = false;
    this.el.classList.add('is-back');
    setTimeout(() => this.el.classList.remove('is-back'), 450);
  },

  /** Снекбар «Машрум сховався · Повернути» з відліком секунд (як у Figma, node 6087:10273) */
  toast() {
    const T = DATA.mgDrag;
    this.hideToast();
    let left = Math.round(T.toastMs / 1000);
    const box = document.createElement('div');
    box.className = 'mg-toast';
    box.setAttribute('role', 'status');
    box.innerHTML = `
      <span class="mg-toast__text">
        <span class="mg-toast__timer" aria-hidden="true" style="--toast-ms: ${T.toastMs}ms">
          <svg viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="11.25" pathLength="100"/></svg>
          <span>${left}</span>
        </span>
        <span>${T.gone}</span>
      </span>
      <button class="mg-toast__action" type="button">${T.back}</button>`;
    box.style.bottom = Math.round(this.phoneRect().height - this.floor() + 12) + 'px';
    box.querySelector('button').addEventListener('click', () => this.restore());
    this.phone.append(box);
    this.toastEl = box;
    const timer = box.querySelector('.mg-toast__timer span');
    this.toastTimer = setInterval(() => {
      left -= 1;
      if (left <= 0) this.hideToast();
      else timer.textContent = left;
    }, 1000);
  },

  hideToast() {
    clearInterval(this.toastTimer);
    if (this.toastEl) this.toastEl.remove();
    this.toastEl = null;
  },
};

// після js/mg-island.js: острівець уже обгорнув грибочок
if (Branch.current === 'c') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => setTimeout(() => MgDrag.init())));
}
