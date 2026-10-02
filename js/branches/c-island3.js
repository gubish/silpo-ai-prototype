/* =====================================================================
   ГІЛКА C — острівець III: віджет <mashrum-island> над таб-баром головної
   (vendor/mashrum-island/ — Web Component з «молочним» тілом, пропозиціями й прогресом
   на стику з таб-баром; README там же) — з анімацією оригіналу, але з нашим Rive-Машрумом.
   • Вмикається перемикачем «Острівець · I | II | III» (подія 'island-color' з js/branches/c.js);
     I і II від нього не залежать.
   • На головній наш МГ живе в обличчі віджета (атрибут face-slot: намальоване обличчя сховане,
     грибочок із кутка переїжджає в слот «face»). Віджет стартує згорнутим у «спору» в правому
     нижньому куті (start-min) — це і є «кутовий» МГ.
   • Зʼявляється лише в одному місці — тригер той самий, що в I і II (MgIsland.watchHome: банер
     після «Тільки онлайн» заїхав на екран), одразу, рідною анімацією: острів росте ліворуч, МГ їде
     з ним (таймінги звірені з демо: 0.62 с, та сама крива). Або — вмикачем «Показати острівець».
     Хрестик — згортається назад у «спору»; знову прокрутили до банера — знову розгортається.
   • Тап по МГ — завжди чат: згорнутий — звичайний, розгорнутий — сценарій острівця
     (DATA.aiChat.island.home). Розгорнутий — тап будь-де по віджету (текст, тіло, стрілка →) теж
     сценарій; лише хрестик згортає.
   • Свій тригер (MgWidget.watch): лише коли банер заїжджає знизу — прокрутка вгору не розгортає.
   • Згорнутий віджет виглядає точно як звичайний кутовий МГ (без «спори», з тінню, на тому ж місці —
     MgWidget.align), тож між головною й іншими екранами МГ не змінюється.
   • Інший екран — грибочок повертається у свій кутовий слот (там віджета немає).
   Тексти пропозицій — DATA.mgWidget.skills (js/branches/c.js), стилі — css/branches/c-island3.css.
   ===================================================================== */

if (Branch.current === 'c') {
  const MgWidget = {
    dock: null,
    el: null,

    on: () => document.documentElement.dataset.islandColor === 'iii',
    slot: () => document.querySelector('.mg-island'),

    /** Віджет на головній: є, коли увімкнено III і відкрита головна; інакше — прибраний, МГ — у кутку */
    sync() {
      const want = this.on() && App.current && App.current.id === 'home';
      if (want) this.mount(document.getElementById('home')); else this.unmount();
    },

    mount(home) {
      if (this.dock && this.dock.isConnected) return;
      const tabbar = home && home.querySelector(':scope > .tabbar');
      const slot = this.slot();
      const fab = slot && slot.querySelector(':scope > .ai-fab');
      if (!tabbar || !fab) return;
      const dock = document.createElement('div');
      dock.className = 'mi-dock';
      const el = document.createElement('mashrum-island');
      el.setAttribute('face-slot', '');
      el.setAttribute('start-min', '');
      el.setAttribute('hide-eyebrow', ''); // «Машрум може» поки сховано (не видалено — прибрати атрибут, і повернеться)
      el.setAttribute('two-lines', '');    // повідомлення завжди у два рядки
      el.skills = DATA.mgWidget.skills; // до вставки в DOM
      const face = document.createElement('div');
      face.className = 'mi-face';
      face.slot = 'face';
      el.append(face);
      el.addEventListener('mashrum-cta', e => { e.preventDefault(); this.chat(); }); // без вбудованого демо
      // розгорнутий: тап будь-де по віджету (текст, тіло, МГ) — теж чат; лише хрестик згортає
      el.addEventListener('click', e => {
        if (el.isMin()) return;
        const ids = e.composedPath().map(n => n.id);
        if (ids.includes('close') || ids.includes('cta')) return; // хрестик — згорнути; стрілка — уже mashrum-cta
        e.stopPropagation();
        this.chat();
      });
      dock.append(el);
      tabbar.before(dock);
      face.append(fab); // наш Rive-грибочок — обличчя віджета
      document.documentElement.classList.add('mi-on');
      this.dock = dock;
      this.el = el;
      this.align();
    },

    /** Згорнутий віджет = звичайний кутовий МГ до пікселя: зсув від центру обличчя віджета
        до центру грибочка в кутовому слоті (.mg-island лишається на місці, лише невидимий).
        Обличчя «гойдається» (bob) — міряємо саму кнопку без нашого зсуву */
    align() {
      const fab = this.dock && this.dock.querySelector('.ai-fab');
      const slot = this.slot();
      if (!fab || !slot || !this.isMin()) return;
      const face = this.el.shadowRoot.getElementById('face').getBoundingClientRect();
      const s = slot.getBoundingClientRect();
      fab.style.setProperty('--mi-dx', Math.round(s.left + 38 - (face.left + face.width / 2)) + 'px');
      fab.style.setProperty('--mi-dy', Math.round(s.top + 72 - (face.top + face.height / 2)) + 'px');
    },

    unmount() {
      if (!this.dock) return;
      const fab = this.dock.querySelector('.ai-fab');
      const slot = this.slot();
      if (fab && slot) slot.append(fab); // грибочок — знову останнім в острівці, як після MgIsland.init
      this.dock.remove();
      this.dock = this.el = null;
      document.documentElement.classList.remove('mi-on');
    },

    isMin() { return Boolean(this.el && this.el.isMin && this.el.isMin()); },
    expand() { if (this.isMin()) this.el.expand(); },

    /** Тригер: банер після «Тільки онлайн» заїжджає на екран ЗНИЗУ (прокрутка вниз) — одразу розгортаємось.
        Згори (прокрутка вгору) — ні: острівець має одне місце. Закрили хрестиком — наступного разу,
        як банер знову заїде знизу, — знову розгортаємось */
    watch() {
      const home = document.getElementById('home');
      if (!home) return;
      let lastY = home.scrollTop, down = true, visible = false, banner = null;
      home.addEventListener('scroll', () => { down = home.scrollTop >= lastY; lastY = home.scrollTop; }, { passive: true });
      const io = new IntersectionObserver(entries => {
        const seen = entries.some(e => e.isIntersecting);
        const cameIn = seen && !visible;
        visible = seen;
        if (!cameIn || !down || !this.on() || !App.current || App.current.id !== 'home') return;
        if (typeof AiChat !== 'undefined' && AiChat.el && !AiChat.el.hidden) return;
        this.expand();
      }, { threshold: 0.6 });
      // головну перемальовують — новий банер
      const observe = () => {
        const b = home.querySelector('.home-banner');
        if (b === banner) return;
        if (banner) io.unobserve(banner);
        banner = b; visible = false;
        if (b) io.observe(b);
      };
      observe();
      new MutationObserver(observe).observe(home, { childList: true });
    },

    /** Чат зі сценарієм острівця — так само, як тап по острівцях I і II */
    chat() {
      MgIsland.context = DATA.aiChat.island.home;
      MgIsland.activate();
    },
  };
  window.MgWidget = MgWidget;

  // тап по МГ — завжди чат: згорнутий — звичайний (js/ai-chat.js, як кутовий МГ),
  // розгорнутий — продовження звернення зі сценарієм (раніше за js/ai-chat.js), як в острівцях I і II
  document.addEventListener('click', e => {
    if (!e.target.closest('.mi-face .ai-fab') || MgWidget.isMin()) return;
    e.stopPropagation();
    MgWidget.chat();
  }, true);
  // у віджеті МГ не перетягується (js/branches/c-drag.js слухає pointerdown на самому грибочку)
  document.addEventListener('pointerdown', e => { if (e.target.closest('.mi-face')) e.stopPropagation(); }, true);

  document.addEventListener('screenchange', () => MgWidget.sync());
  // кутовий слот посунувся (плашка кошика, зміна розміру) — підрівнюємо згорнутого МГ
  window.addEventListener('resize', () => MgWidget.align());
  document.addEventListener('mashrum-collapse', () => setTimeout(() => MgWidget.align(), 700));
  document.addEventListener('DOMContentLoaded', () => {
    const stack = document.querySelector('.fab-stack');
    if (!stack) return;
    new MutationObserver(() => MgWidget.align()).observe(stack, { attributes: true, attributeFilter: ['style'] });
    stack.addEventListener('transitionend', () => MgWidget.align()); // слот їде на нове місце 0.22 с — міряємо, коли доїхав
  });
  document.addEventListener('island-color', () => MgWidget.sync());

  // після js/mg-island.js і js/branches/c-drag.js (вони теж обгортають MgIsland.speak):
  // у III на головній замість острівця — віджет розгортається
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => setTimeout(() => setTimeout(() => {
    MgWidget.sync();
    // головну перемальовують («На початок») — віджет вертається на місце
    const home = document.getElementById('home');
    if (home) new MutationObserver(() => {
      if (MgWidget.dock && !MgWidget.dock.isConnected) MgWidget.dock = MgWidget.el = null;
      MgWidget.sync();
    }).observe(home, { childList: true });
    if (typeof MgIsland === 'undefined') return;
    // в III тригер острівців (MgIsland.watchHome) не діє — у віджета свій (watch нижче);
    // { force: true } — вмикач «Показати острівець» (js/branches/c.js)
    const speak = MgIsland.speak.bind(MgIsland);
    MgIsland.speak = (key, opts) => {
      if (!MgWidget.on() || key !== 'home') return speak(key);
      if (opts && opts.force) MgWidget.expand();
    };
    MgWidget.watch();
  }))));
}
