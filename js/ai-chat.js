/* =====================================================================
   ЧАТ ШІ-ПОМІЧНИКА — мобільна версія чату з веб-«Сільпо».
   Тексти — DATA.aiChat, стилі — css/ai-chat.css.
   • Відкривається тапом по грибочку (.ai-fab), закривається стрілкою «Назад» або Esc.
   • Іконка «Новий чат» у шапці починає розмову спочатку (привітання + підказки);
     неактивна, поки розмову не почато.
   • Меню «⋮» — випадний список (Історія чату, Налаштування); пункти поки без дій.
   • Тап у поле вводу — виїжджає iOS-клавіатура (js/keyboard.js).
   • Настрій Машрума (вираз + колір) міняється по ходу розмови — setMood();
     аватар (живий Rive) і підпис — лише над останньою відповіддю, старі відповіді — без аватара;
     грибочок на головній — у тому ж настрої.
   • Плашка кошика праворуч над полем вводу — коли в кошику щось є; тап → кошик.
   • Картка товару й кошик, відкриті з чату, заїжджають справа; їхнє «Назад»
     повертає в чат (зліва, на тому ж місці розмови) — через історію App.back().
   • Привітання й стартові теги залежать від екрана, з якого відкрили чат
     (DATA.aiChat.screens): каталог, лістинг, картка товару, кошик, чекаут.
   • Тег під привітанням = готовий сценарій: тег іде в чат як питання,
     помічник відповідає й показує картки. Екран під чатом не змінюється:
     закриваєте чат — і ви там, звідки його відкрили (головна).
   • Розмова живе, поки відкрита сторінка (перезавантаження — з нуля).
   ===================================================================== */

const AiChat = {
  thread: [],

  init() {
    const C = DATA.aiChat;
    this.thread = [{ from: 'bot', text: C.greeting }];

    const el = document.createElement('div');
    el.className = 'ai-chat';
    el.hidden = true;
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', C.title);
    el.innerHTML = `
      <div class="ai-chat__head">
        <button class="ai-chat__icon ai-chat__close" type="button" aria-label="Назад — закрити чат">
          <img class="icon-grey" src="assets/icons/arrow-back.svg" alt="">
        </button>
        <span class="ai-chat__title">${C.title}</span>
        <button class="ai-chat__icon ai-chat__new" type="button" aria-label="Новий чат" disabled>
          <img class="icon-grey" src="assets/icons/new-chat.svg" alt="">
        </button>
        <button class="ai-chat__icon ai-chat__more" type="button" aria-label="Меню чату" aria-haspopup="menu" aria-expanded="false">
          <img class="icon-grey" src="assets/icons/more.svg" alt="">
        </button>
        <div class="ai-menu" role="menu" hidden>
          ${C.menu.map(label => `<button class="ai-menu__item" type="button" role="menuitem">${label}</button>`).join('')}
        </div>
      </div>
      <div class="ai-chat__body">
        <div class="ai-chat__thread" aria-live="polite"></div>
        <div class="ai-chat__spacer" aria-hidden="true"></div>
      </div>
      <form class="ai-chat__composer">
        <button class="ai-chat__down" type="button" aria-label="До останнього повідомлення" hidden>
          <img src="assets/icons/arrow-down.svg" alt="">
        </button>
        <!-- плашка кошика (Figma 6058:6406): видно, коли в кошику щось є; тап → кошик -->
        <button class="cart-pill ai-cart" type="button" data-cart-visible hidden aria-label="Перейти до кошика">
          <span class="cart-pill__icon">
            <img src="assets/icons/cart-pill.svg" alt="">
            <span class="cart-pill__count" data-cart-count></span>
          </span>
          <span data-cart-total></span>
        </button>
        <!-- поле вводу: порожнє — фотоапарат + текст в один рядок;
             з текстом — текст зверху, фотоапарат і «Надіслати» внизу по кутах -->
        <div class="ai-field">
          <button class="ai-field__camera" type="button" aria-label="Додати фото">
            <img class="icon-grey" src="assets/icons/camera.svg" alt="">
          </button>
          <textarea class="ai-chat__input" rows="1" placeholder="${C.placeholder}" autocomplete="off" aria-label="Повідомлення"></textarea>
          <button class="ai-chat__send" type="submit" aria-label="Надіслати" disabled>
            <img src="assets/icons/arrow-up-white.svg" alt="">
          </button>
        </div>
      </form>`;
    document.querySelector('.phone').appendChild(el);

    this.el = el;
    // версія дизайну тегів (css/ai-chips-*.css) + перемикач під «На початок»
    this.initChipsToggle();
    // живий Машрум (Rive) — аватар останньої відповіді; решта аватарів — картинки
    this.live = document.createElement('div');
    this.live.className = 'ai-msg__avatar ai-msg__avatar--live';
    this.liveView = window.Mushroom ? new Mushroom(this.live, { mood: C.greetingMood }) : null;
    this.body = el.querySelector('.ai-chat__body');
    this.threadEl = el.querySelector('.ai-chat__thread');
    this.spacer = el.querySelector('.ai-chat__spacer');
    this.newBtn = el.querySelector('.ai-chat__new');
    this.down = el.querySelector('.ai-chat__down');
    this.input = el.querySelector('.ai-chat__input');
    this.send = el.querySelector('.ai-chat__send');

    // грибочок (.ai-fab) — плаваючий або в таб-барі; їх може бути кілька
    document.addEventListener('click', e => { if (e.target.closest('.ai-fab')) this.open(); });
    document.addEventListener('keydown', e => {
      if (e.target.closest?.('.ai-fab') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.open(); }
    });

    el.querySelector('.ai-chat__close').addEventListener('click', () => this.close());
    el.querySelector('.ai-chat__new').addEventListener('click', () => this.reset());

    // меню «⋮»: відкривається під кнопкою; закривається пунктом, тапом повз або Esc
    this.menuBtn = el.querySelector('.ai-chat__more');
    this.menu = el.querySelector('.ai-menu');
    this.menuBtn.addEventListener('click', () => this.toggleMenu(this.menu.hidden));
    this.menu.addEventListener('click', e => { if (e.target.closest('.ai-menu__item')) this.toggleMenu(false); });
    document.addEventListener('pointerdown', e => {
      if (!this.menu.hidden && !e.target.closest('.ai-menu, .ai-chat__more')) this.toggleMenu(false);
    });
    document.addEventListener('keydown', e => {
      if (e.key !== 'Escape' || el.hidden) return;
      if (!this.menu.hidden) this.toggleMenu(false); else this.close();
    });

    Keyboard.attach(this.input, { host: el }); // iOS-клавіатура при тапі в поле
    this.field = el.querySelector('.ai-field');
    this.input.addEventListener('input', () => {
      const filled = Boolean(this.input.value.trim());
      this.send.disabled = !filled;
      this.field.classList.toggle('is-filled', filled); // поле розгортається на два рядки
      this.growInput();
    });
    // Enter — надіслати, Shift+Enter — новий рядок (з клавіатури компʼютера)
    this.input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (this.input.value.trim()) this.input.form.requestSubmit();
      }
    });
    // тап будь-де в рамці поля — фокус у текст; кнопки не забирають фокус (клавіатура лишається)
    this.field.addEventListener('pointerdown', e => {
      if (e.target === this.input) return;
      e.preventDefault();
      if (!e.target.closest('button')) this.input.focus();
    });
    // фотоапарат відкриватиме поп-ап — поки без дії
    el.querySelector('.ai-field__camera').addEventListener('click', () => {});
    el.querySelector('.ai-chat__composer').addEventListener('submit', e => {
      e.preventDefault();
      this.ask(this.input.value);
      this.input.value = '';
      this.input.dispatchEvent(new Event('input')); // кнопки «Надіслати» гаснуть
    });

    // тап по картці товару в чаті: чат ховається, відкривається картка
    // («+», «−» і лайк лишаються в чаті)
    el.addEventListener('click', e => {
      const chip = e.target.closest('[data-next]');
      if (chip) {
        const all = this.thread[this.thread.length - 1].tags;
        this.runTag(all[chip.dataset.next], all);
        return;
      }
      if (e.target.closest('[data-add], [data-remove], [data-like]')) return;
      const card = e.target.closest('.ai-products [data-go]');
      if (card) {
        e.stopPropagation(); // переходимо самі, з анімацією
        this.pushTo('pdp', card.dataset.param); // «Назад» на картці поверне в чат (App.back)
      }
    });

    // стрілка ↓: видно, коли під екраном ще є розмова (прокрутили вгору,
    // виїхала клавіатура); тап — до кінця розмови
    this.down.addEventListener('pointerdown', e => e.preventDefault()); // не ховає клавіатуру
    this.down.addEventListener('click', () => this.scrollToEnd(true));
    el.querySelector('.ai-cart').addEventListener('pointerdown', e => e.preventDefault()); // не ховає клавіатуру
    el.querySelector('.ai-cart').addEventListener('click', () => this.pushTo('cart')); // «Назад» у кошику — знову в чат
    this.body.addEventListener('scroll', () => this.syncDown(), { passive: true });
    // висота стрічки змінюється (клавіатура, фото карток довантажились) — перераховуємо
    new ResizeObserver(() => this.layout()).observe(this.body);
    new ResizeObserver(() => this.layout()).observe(this.threadEl);

    this.render();
  },

  /** Поле росте разом із текстом — до --ai-input-max-h, далі прокрутка всередині */
  growInput() {
    const i = this.input;
    i.style.height = 'auto';
    const max = parseFloat(getComputedStyle(i).maxHeight) || Infinity;
    i.style.height = Math.min(i.scrollHeight, max) + 'px';
    i.style.overflowY = i.scrollHeight > max ? 'auto' : 'hidden';
    // друкуємо в кінці — тримаємо курсор на виду
    if (i.selectionEnd === i.value.length) i.scrollTop = i.scrollHeight;
  },

  /* ---------- Прокрутка ----------
     anchor — повідомлення помічника, яке має стояти першим на екрані.
     Щоб його можна було підняти догори, навіть якщо під ним мало вмісту,
     наприкінці стрічки є невидимий запас (spacer). */
  anchor: null,

  /** Відстань від верху стрічки до елемента (з урахуванням прокрутки) */
  offsetOf(node) {
    return node.getBoundingClientRect().top - this.body.getBoundingClientRect().top + this.body.scrollTop;
  },

  /** Де закінчується справжній вміст (без запасу) */
  contentEnd() {
    return this.offsetOf(this.spacer) + parseFloat(getComputedStyle(this.body).paddingBottom);
  },

  anchorTop() {
    const node = this.anchor != null && this.threadEl.querySelector(`[data-msg="${this.anchor}"]`);
    if (!node) return null;
    const msg = node.closest('.ai-msg'); // разом з аватаром над бульбашкою
    return this.offsetOf(msg) - parseFloat(getComputedStyle(this.body).paddingTop);
  },

  /** Запас під вмістом, щоб відповідь-якір могла стати першою на екрані */
  layout() {
    const top = this.anchorTop();
    // Поки нової відповіді немає (щойно надіслали питання, «друкує…»), запас
    // лишається як був: якщо прибрати його одразу, стрічка коротшає і
    // прокрутка стрибає донизу, а потім знову їде до відповіді.
    if (top != null) {
      const need = top + this.body.clientHeight - this.contentEnd();
      this.spacer.style.height = Math.max(0, Math.ceil(need)) + 'px';
    }
    this.syncDown();
  },

  syncDown() {
    const hidden = this.contentEnd() - (this.body.scrollTop + this.body.clientHeight);
    this.down.hidden = hidden < 24;
  },

  /** До кінця розмови — лише вниз: якщо кінець уже на екрані (під ним
      запас), стрічка стоїть на місці, а не відʼїжджає вгору */
  scrollToEnd(smooth) {
    const top = Math.max(0, this.contentEnd() - this.body.clientHeight);
    if (top <= this.body.scrollTop) return;
    this.body.scrollTo({ top, behavior: smooth ? 'smooth' : 'auto' });
  },

  /** Відповідь помічника — першою на екрані */
  scrollToAnchor() {
    this.layout();
    const top = this.anchorTop();
    if (top != null) this.body.scrollTo({ top, behavior: 'smooth' });
  },

  /* ---------- Перехід чат ⇄ картка товару / кошик (як push у iOS) ----------
     Туди: екран заїжджає справа поверх чату, чат трохи відʼїжджає вліво.
     Назад (App.back → returnTo): екран їде вправо, чат повертається зліва. */
  slide: { duration: 320, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },

  /** Готує екран лежати поверх чату на час анімації */
  lift(screen, on) {
    screen.style.zIndex = on ? 96 : '';          // над чатом (90) і клавіатурою (95)
    screen.style.transition = on ? 'none' : '';  // без звичайного проявлення екрана
    screen.style.boxShadow = on ? '-8px 0 24px rgba(19, 19, 30, 0.12)' : '';
  },

  animate(node, from, to) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    return node.animate([{ transform: from }, { transform: to }],
      { ...this.slide, duration: reduce ? 0 : this.slide.duration, fill: 'forwards' });
  },

  pushTo(id, param) {
    const screen = document.getElementById(id);
    this.input.blur();
    this.openedFrom = this.greetedOn; // куди повернемось — там уже вітались
    App.go(id, param, { fromChat: true }); // в історії: «прийшли з чату»
    this.lift(screen, true);
    const a = this.animate(screen, 'translateX(100%)', 'translateX(0)');
    const b = this.animate(this.el, 'translateX(0)', 'translateX(-30%)');
    a.onfinish = () => {
      this.close({ instant: true });
      a.cancel(); b.cancel();
      this.lift(screen, false);
    };
  },

  /** «Назад» на екран, відкритий із чату: екран їде вправо, чат — на місці розмови */
  returnTo(prev) {
    const screen = App.current;
    this.open({ instant: true, greet: false }); // повертаємось у ту саму розмову, без нового привітання
    this.lift(screen, true);
    const a = this.animate(screen, 'translateX(0)', 'translateX(100%)');
    const b = this.animate(this.el, 'translateX(-30%)', 'translateX(0)');
    a.onfinish = () => {
      App.go(prev.id, prev.param, { record: false }); // під чатом — екран, що був до переходу
      this.greetedOn = this.contextKey(); // цей екран уже «знайомий» — вітатися не треба
      this.open({ greet: false }); // App.go перефарбовує статус-бар — повертаємо білий
      a.cancel(); b.cancel();
      this.lift(screen, false);
    };
  },

  /** Показати / сховати без виїзду знизу (для переходів вбік) */
  setInstant(on) { this.el.classList.toggle('is-instant', on); },

  toggleMenu(open) {
    this.menu.hidden = !open;
    this.menuBtn.setAttribute('aria-expanded', String(open));
  },

  /* ---------- Версії дизайну тегів ----------
     attr — що ставимо в data-chips: v2 будується поверх v1.
     Вибір із перемикача памʼятається в браузері (переживає «На початок»). */
  chipVersions: { v1: 'v1', v2: 'v1 v2' },

  setChipsVersion(v, { remember = false } = {}) {
    if (!this.chipVersions[v]) v = 'v1';
    this.el.dataset.chips = this.chipVersions[v];
    // і на всю сторінку — для чипів МГ поза чатом (гілка B: .mg-chip, css/branches/b-mg.css)
    document.documentElement.dataset.chips = this.chipVersions[v];
    document.querySelectorAll('[data-chips-version]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.chipsVersion === v)));
    if (remember) try { localStorage.setItem('silpo-chips-version', v); } catch (e) { /* без памʼяті — теж ок */ }
  },

  initChipsToggle() {
    let saved = null;
    try { saved = localStorage.getItem('silpo-chips-version'); } catch (e) { /* приватний режим */ }
    const box = document.querySelector('.chips-toggle:not(.branch-toggle)');
    if (box) {
      box.insertAdjacentHTML('beforeend', Object.keys(this.chipVersions).map(v =>
        `<button class="chips-toggle__btn" type="button" data-chips-version="${v}" aria-pressed="false">${v}</button>`).join(''));
      box.addEventListener('click', e => {
        const b = e.target.closest('[data-chips-version]');
        if (b) this.setChipsVersion(b.dataset.chipsVersion, { remember: true });
      });
    }
    this.setChipsVersion(saved || DATA.aiChat.chipsVersion);
  },

  /* ---------- Настрій Машрума: вираз + колір (DATA.aiChat.moods) ----------
     Той самий настрій — і в аватарі в чаті, і в грибочку на головній. */
  setMood(mood) {
    this.moodChanges = (this.moodChanges || 0) + 1;
    if (this.liveView) this.liveView.set(mood);
    if (window.Mascot) Mascot.setMood(mood);
  },

  /** «О. Прокинувся»: сонний → за мить прокидається (раз на розмову) */
  wakeUp() {
    if (this.woke) return;
    this.woke = true;
    const C = DATA.aiChat, session = this.session;
    this.setMood(C.greetingMood);
    const mark = this.moodChanges;
    // прокидається, лише якщо за цей час настрій ніхто не змінив (напр. уже натиснули тег)
    setTimeout(() => { if (session === this.session && mark === this.moodChanges) this.setMood(C.defaultMood); }, C.wakeDelay);
  },

  /* ---------- Контекст: з якого екрана відкрили чат ----------
     Привітання й стартові теги беремо з DATA.aiChat.screens[<екран>]
     (немає свого — з головної). Тег може бути id спільного тегу. */
  screenKey() {
    const id = App.current ? App.current.id : 'home';
    return DATA.aiChat.screens[id] ? id : 'home';
  },

  screenData() { return DATA.aiChat.screens[this.screenKey()] || {}; },

  /** Точка входу: екран + що саме на ньому відкрито */
  contextKey() {
    const key = this.screenKey();
    if (key === 'pdp') return 'pdp:' + App.params.pdp;
    if (key === 'listing') return 'listing:' + (App.params.listing || DATA.listing.defaultPage);
    return key;
  },

  /** Привітання цього екрана як повідомлення з тегами */
  greetingMessage() {
    return {
      from: 'bot',
      text: this.greetingText(),
      tags: this.screenOpeners().map(o => ({ ...o, kind: 'opener' })),
    };
  },

  /** Стартові теги поточного екрана (id → спільний тег з DATA.aiChat.openers).
      Лістинг — свій набір на категорію (byPage), картка товару — на тип товару (byKind). */
  screenOpeners() {
    const sd = this.screenData();
    const byPage = sd.byPage && sd.byPage[App.params.listing || DATA.listing.defaultPage];
    const kind = (DATA.products[App.params.pdp] || {}).kind;
    const byKind = sd.byKind && (sd.byKind[kind] || sd.byKind.default);
    const list = byPage || byKind || sd.openers || DATA.aiChat.openers.map(o => o.id);
    return list.map(o => (typeof o === 'string' ? DATA.aiChat.openers.find(x => x.id === o) : o)).filter(Boolean);
  },

  greetingText() {
    const sd = this.screenData();
    return this.fill(sd.greeting || DATA.aiChat.greeting, Cart.count(), sd.greetingForms);
  },

  /** Новий чат: лише привітання й стартові підказки */
  reset() {
    this.session++; // відповіді, що ще «друкуються», до нового чату не потраплять
    this.thread = [this.greetingMessage()];
    this.greetedOn = this.contextKey();
    this.anchor = null;
    this.spacer.style.height = '0px';
    this.input.value = '';
    this.input.dispatchEvent(new Event('input'));
    this.render();
    this.body.scrollTop = 0;
    this.savedScroll = null;
    this.woke = false;
    if (!this.el.hidden) this.wakeUp(); // новий чат — Машрум знову «прокидається»
  },
  session: 0,

  open({ instant = false, greet = true } = {}) {
    const wasHidden = this.el.hidden;
    if (instant) this.setInstant(true);
    this.el.hidden = false;
    if (instant) requestAnimationFrame(() => this.setInstant(false));
    document.querySelector('.statusbar').style.setProperty('--statusbar-bg', 'var(--white)');
    this.layout();
    // прихований чат браузер «забуває» прокручувати — повертаємо місце, де були
    if (wasHidden && this.savedScroll != null) this.body.scrollTop = this.savedScroll;
    else if (this.anchor == null) this.scrollToEnd(false);
    // прийшли з іншої точки входу — вітається знову, у новому контексті
    if (greet && this.greetedOn !== this.contextKey()) {
      const started = this.thread.some(m => m.from === 'user');
      this.greetedOn = this.contextKey();
      if (started) {
        this.thread.push(this.greetingMessage()); // історію лишаємо
        this.anchor = this.thread.length - 1;
        this.render();
        this.scrollToAnchor();
      } else {
        this.thread = [this.greetingMessage()];
        this.anchor = null;
        this.woke = false;
        this.render();
        this.body.scrollTop = 0;
      }
    }
    this.wakeUp();
  },

  close({ instant = false } = {}) {
    this.toggleMenu(false);
    this.input.blur(); // ховає клавіатуру
    if (!this.el.hidden) this.savedScroll = this.body.scrollTop;
    if (instant) this.setInstant(true);
    this.el.hidden = true;
    if (instant) requestAnimationFrame(() => this.setInstant(false));
    // повертаємо колір статус-бару поточного екрана
    const id = App.current && App.current.id;
    document.querySelector('.statusbar').style.setProperty('--statusbar-bg', STATUSBAR_BG[id] || 'var(--white)');
  },

  render() {
    const avatar = `
      <div class="ai-msg__author">
        <img class="ai-msg__avatar" src="${DATA.aiChat.avatar}" alt="">
        <span class="ai-msg__name">${DATA.aiChat.botName}</span>
      </div>`;
    const last = this.thread.length - 1;
    // аватар і підпис — лише над останньою відповіддю помічника (або «друкує…»);
    // старі відповіді — просто бульбашки, як історія листування
    let speaking = -1;
    this.thread.forEach((m, i) => { if (m.from === 'bot' && !m.products) speaking = i; });
    // теги наступних кроків — лише під останньою відповіддю;
    // тег без відповіді показується, але неактивний (сценарій ще не зроблено)
    const tags = (m, i) => i === last && m.tags && m.tags.length ? `
      <div class="ai-followups">
        ${m.tags.map((t, k) => `<button class="ai-chip" type="button" data-next="${k}" ${this.isLive(t) ? '' : 'disabled'}>${this.seasonal(t.label)}</button>`).join('')}
      </div>` : '';
    this.threadEl.innerHTML = this.thread.map((m, i) => m.products ? `
      <div class="hscroll hscroll--bleed ai-products" tabindex="0" aria-label="Товари від помічника">
        ${m.products.map(UI.plpCard).join('')}
      </div>
      ${tags(m, i)}` : `
      <div class="ai-msg ai-msg--${m.from}">
        ${i === speaking ? avatar : ''}
        <div class="ai-bubble ${m.typing ? 'ai-bubble--typing' : ''}" data-msg="${i}">${m.typing ? '<i></i><i></i><i></i>' : ''}</div>
      </div>
      ${tags(m, i)}`).join('');
    // текст вставляємо окремо, щоб повідомлення ніколи не читалося як розмітка
    this.threadEl.querySelectorAll('.ai-bubble[data-msg]').forEach(b => {
      const m = this.thread[b.dataset.msg];
      if (!m.typing) b.textContent = m.text;
    });
    // каруселі товарів: тягнуться мишею, «+» показує кількість з кошика
    this.threadEl.querySelectorAll('.ai-products').forEach(enableDragScroll);
    // картинку в аватарі заміняємо живим Rive-Машрумом (він «переїжджає» до нової відповіді)
    const img = this.threadEl.querySelector('img.ai-msg__avatar');
    if (img && this.liveView) img.replaceWith(this.live);
    Cart.render();
    // «Новий чат» — лише коли вже є що скидати: гість щось написав або розмова вже більша
    // за саме привітання (напр. її почав сам Машрум з острівця — js/mg-island.js)
    this.newBtn.disabled = !(this.thread.some(m => m.from === 'user') || this.thread.length > 1);
    // нове питання / «друкує…» — донизу; готова відповідь — першою на екрані
    if (this.anchor != null) this.scrollToAnchor();
    else { this.layout(); this.scrollToEnd(!this.el.hidden); } // плавно, якщо чат відкритий
  },

  push(from, text) {
    text = String(text).trim();
    if (!text) return;
    if (from === 'user') this.anchor = null;
    this.thread.push({ from, text });
    this.render();
  },

  /** Відповідь помічника з паузою «друкує…»;
      products — картки під відповіддю, tags — теги наступних кроків у кінці,
      mood — настрій Машрума у відповіді (DATA.aiChat.moods) */
  reply(text, products, tags, mood) {
    const typing = { from: 'bot', typing: true };
    const session = this.session;
    this.thread.push(typing);
    this.render();
    this.setMood(DATA.aiChat.typingMood);
    setTimeout(() => {
      if (session !== this.session) return; // чат уже почали заново
      this.setMood(mood || DATA.aiChat.defaultMood);
      this.thread.splice(this.thread.indexOf(typing), 1);
      const withCards = products && products.length;
      this.thread.push({ from: 'bot', text, tags: withCards ? null : tags });
      this.anchor = this.thread.length - 1; // цю відповідь — першою на екрані
      if (withCards) this.thread.push({ from: 'bot', products, tags });
      this.render();
    }, DATA.aiChat.replyDelay);
  },

  /** Будь-яке своє питання */
  ask(text) {
    if (!text.trim()) return;
    this.push('user', text);
    // «спробуйте щось із підказок» — і стартові теги знову під рукою
    this.reply(DATA.aiChat.fallback, null, DATA.aiChat.openers.map(o => ({ ...o, kind: 'opener' })), DATA.aiChat.fallbackMood);
  },

  /** Стартовий тег: питання → відповідь і картки (екран під чатом не міняється) */
  runScenario(o) {
    this.push('user', this.seasonal(o.label));
    const page = o.listing && DATA.listing.pages[o.listing];
    const items = this.itemsFor(o, page);
    const tags = page && o.followUps
      ? o.followUps.map(f => ({ ...f, kind: 'followUp', page, countForms: f.countForms || o.countForms }))
      : this.nodes(o.next);
    this.reply(this.fill(o.answer, items ? items.length : 0, o.countForms), items, tags, o.mood);
  },

  /** Картки під відповіддю: список items, правило rule або «схоже» */
  itemsFor(o, page) {
    if (o.similar) return this.similarTo(App.params.pdp);          // «Знайти схоже» на картці товару
    if (o.rule) return this.pick(o, page);
    const list = this.seasonal(o.items);
    if (list) {
      return list.map(it => {
        const id = typeof it === 'string' ? it : it.id;
        // з лістингу беремо бейджі й лайки, якщо товар там є
        return (page && page.items.find(i => i.id === id)) || (typeof it === 'string' ? { id } : it);
      }).filter(i => DATA.products[i.id]);
    }
    return o.showProducts && page ? page.items : null;
  },

  /** Перші товари кошика словами: «манго, банан і ще 2» */
  cartList() {
    const names = [...Cart.items.keys()].map(id => (DATA.products[id].shortName || DATA.products[id].name).toLocaleLowerCase('uk-UA'));
    if (!names.length) return 'порожньо';
    const head = names.slice(0, 3).join(', ');
    return names.length > 3 ? `${head} і ще ${names.length - 3}` : head;
  },

  /** Схожі товари: з того ж лістингу, без самого товару */
  similarTo(id) {
    const page = Object.values(DATA.listing.pages).find(pg => pg.items.some(i => i.id === id));
    if (page) return page.items.filter(i => i.id !== id).slice(0, 6);
    const info = DATA.pdp.products[id];
    return info && info.similar ? info.similar : [];
  },

  /** { winter, spring, summer, autumn } → значення поточної пори року */
  seasonal(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
    const m = new Date().getMonth();
    const auto = m === 11 || m < 2 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
    return value[DATA.aiChat.season || auto];
  },

  /** {count} / {countWord} у тексті відповіді */
  fill(text, count, forms) {
    const p = DATA.products[App.params.pdp] || {};            // відкритий товар
    const info = (DATA.pdp.products[App.params.pdp] || {});    // його картка
    const page = DATA.listing.pages[App.params.listing] || DATA.listing.pages[DATA.listing.defaultPage];
    const country = (info.details || []).find(r => r.label === 'Країна походження');
    return text
      .replace('{count}', count)
      .replace('{countWord}', forms ? aiPlural(count, forms) : '')
      .replace('{total}', UI.money(Cart.total()))
      .replace('{discount}', UI.money(Cart.discountTotal()))
      .replace('{product}', p.chatName || p.shortName || p.name || 'цей товар')
      .replace('{category}', page.chatTitle || page.title)
      .replace('{kcal}', (info.nutrition || {}).kcal || '—')
      .replace('{sugar}', (info.nutrition || {}).sugar || '—')
      .replace('{country}', country ? country.value : '—')
      .replace('{cartList}', this.cartList());
  },

  /* ---------- Теги наступних кроків ----------
     kind: 'opener'   — стартовий тег (після відповіді на своє питання);
           'followUp' — уточнення добірки фруктів (флоу «Сезонні фрукти»);
           'node'     — крок сценарію з DATA.aiChat.openers[…].next. */
  isLive(t) { return t.kind !== 'node' || Boolean(t.answer); },

  /** Теги наступного кроку; рядок — id спільного тегу з DATA.aiChat.openers */
  nodes(list) {
    return (list || []).map(n => {
      const node = typeof n === 'string' ? DATA.aiChat.openers.find(o => o.id === n) : n;
      return node ? { ...node, kind: 'node' } : null;
    }).filter(Boolean);
  },

  runTag(t, all) {
    if (!this.isLive(t)) return;
    if (t.kind === 'opener') this.runScenario(t);
    else if (t.kind === 'followUp') this.runFollowUp(t, all);
    else this.runNode(t);
  },

  /** Крок сценарію: відповідь, картки (або дія) і теги наступного кроку */
  runNode(n) {
    this.push('user', n.label);
    let items = null, count = 0;
    if (n.action === 'addAll' || n.action === 'addItems') {
      // addAll — товари з останніх карток у розмові; addItems — власні items тегу
      const shown = n.action === 'addItems' ? this.itemsFor(n, null) || [] : this.lastProducts();
      shown.forEach(i => Cart.add(i.id));
      count = shown.length;
    } else {
      items = this.itemsFor(n, null);
      count = items ? items.length : 0;
    }
    this.reply(this.fill(n.answer, count, n.countForms), items, this.nodes(n.next), n.mood);
  },

  lastProducts() {
    for (let i = this.thread.length - 1; i >= 0; i--) if (this.thread[i].products) return this.thread[i].products;
    return [];
  },

  /** Тег під картками: уточнена добірка + відповідь + решта тегів */
  runFollowUp(f, all) {
    const items = this.pick(f);
    this.push('user', f.label);
    this.reply(this.fill(f.answer, items.length, f.countForms), items, all.filter(x => x !== f), f.mood);
  },

  /** Товари лістингу за правилом тегу */
  /** Добірка за правилом. pool — свій список id, інакше товари лістингу page.
      sale — зі знижкою; lowSugar / sweetest — за цукром; maxPrice — до суми;
      notInCart — те, чого ще немає в кошику; cheaper — зі знижкою й не в кошику. */
  pick(f, page) {
    const listing = f.page || page || DATA.listing.pages[f.listing] || {};
    const items = f.pool ? f.pool.map(id => (listing.items || []).find(i => i.id === id) || { id })
                         : (listing.items || []);
    const sugar = i => parseFloat((DATA.pdp.products[i.id]?.nutrition?.sugar) ?? NaN);
    const inCart = i => Cart.items.has(i.id);
    const take = list => list.slice(0, f.take || 6);
    if (f.ids) return f.ids.map(id => items.find(i => i.id === id) || { id }).filter(i => DATA.products[i.id]);
    if (f.rule === 'sale') return take(items.filter(i => DATA.products[i.id].oldPrice));
    if (f.rule === 'lowSugar') return take(items.filter(i => sugar(i) <= f.maxSugar).sort((a, b) => sugar(a) - sugar(b)));
    if (f.rule === 'sweetest') return take(items.filter(i => !isNaN(sugar(i))).sort((a, b) => sugar(b) - sugar(a)));
    if (f.rule === 'maxPrice') return take(items.filter(i => DATA.products[i.id].price <= f.maxPrice));
    if (f.rule === 'notInCart') return take(items.filter(i => !inCart(i)));
    if (f.rule === 'cheaper') return take(items.filter(i => DATA.products[i.id].oldPrice && !inCart(i)));
    return take(items);
  },
};

/** 1 фрукт / 2 фрукти / 5 фруктів */
function aiPlural(n, [one, few, many]) {
  const t = n % 10, h = n % 100;
  if (t === 1 && h !== 11) return one;
  if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return few;
  return many;
}

document.addEventListener('DOMContentLoaded', () => AiChat.init());
