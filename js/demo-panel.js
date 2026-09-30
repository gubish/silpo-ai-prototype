/* =====================================================================
   Налаштування прототипу на телефоні (усі гілки).
   На десктопі перемикачі («На початок», «Дизайн A B C», «Теги», «Маленький МГ»…)
   стоять поза телефоном, а на телефоні місця для них немає. Тут:
   • «язичок» з ⚙︎ на лівому краї екрана (посередині висоти — праворуч МГ і таб-бари);
   • тап — нижня шторка «Налаштування прототипу» з тими САМИМИ перемикачами:
     вузли .restart-btn і .chips-toggle переносяться в шторку, тож усе, що додають
     на десктопі (у будь-якій гілці), саме зʼявляється й тут. Ширше за 720px — назад у body;
   • «Сховати кнопку» — язичок зникає до перезавантаження (щоб не заважав на показі).
   Тексти — DATA.demoPanel, стилі — css/demo-panel.css.
   ===================================================================== */

const DemoPanel = {
  mq: window.matchMedia('(max-width: 720px)'), // та сама межа, що ховає перемикачі в css/base.css

  init() {
    const T = DATA.demoPanel;
    this.handle = document.createElement('button');
    this.handle.className = 'demo-handle';
    this.handle.type = 'button';
    this.handle.setAttribute('aria-label', T.title);
    this.handle.innerHTML = `
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>
      </svg>`;

    this.sheet = document.createElement('div');
    this.sheet.className = 'demo-sheet';
    this.sheet.hidden = true;
    this.sheet.innerHTML = `
      <div class="demo-sheet__scrim" data-demo-close></div>
      <section class="demo-sheet__panel" role="dialog" aria-modal="true" aria-label="${T.title}">
        <span class="demo-sheet__grabber" aria-hidden="true"></span>
        <header class="demo-sheet__head">
          <h2>${T.title}</h2>
          <button class="demo-sheet__close" type="button" data-demo-close aria-label="${T.close}">
            <img src="assets/icons/close.svg" alt="">
          </button>
        </header>
        <p class="demo-sheet__note">${T.note}</p>
        <div class="demo-sheet__list"></div>
        <button class="demo-sheet__hide" type="button">${T.hide}</button>
      </section>`;
    this.list = this.sheet.querySelector('.demo-sheet__list');
    document.body.append(this.handle, this.sheet);

    this.handle.addEventListener('click', () => this.open());
    this.sheet.addEventListener('click', e => { if (e.target.closest('[data-demo-close]')) this.close(); });
    this.sheet.querySelector('.demo-sheet__hide').addEventListener('click', () => {
      this.handle.hidden = true;
      this.close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !this.sheet.hidden) this.close(); });

    // перемикачі створюють різні скрипти й у різний час — підхоплюємо й ті, що зʼявляться пізніше
    new MutationObserver(() => this.place()).observe(document.body, { childList: true });
    this.mq.addEventListener('change', () => this.place());
    this.place();
  },

  /** Телефон — перемикачі в шторці (у тому ж порядку, що й на десктопі); десктоп — назад у body */
  place() {
    const items = el => [...el.children].filter(n => n.matches('.restart-btn, .chips-toggle'));
    if (this.mq.matches) {
      const moving = items(document.body);
      if (!moving.length) return;
      // порядок як на десктопі — зверху вниз за top
      [...items(this.list), ...moving]
        .sort((a, b) => this.order(a) - this.order(b))
        .forEach(n => this.list.append(n));
    } else {
      items(this.list).forEach(n => document.body.append(n));
      this.close();
    }
  },

  /** Позиція перемикача на десктопі (його top), щоб у шторці був той самий порядок */
  order(n) {
    if (n.dataset.demoOrder == null) n.dataset.demoOrder = parseFloat(getComputedStyle(n).top) || 0;
    return Number(n.dataset.demoOrder);
  },

  open() {
    this.sheet.hidden = false;
    requestAnimationFrame(() => this.sheet.classList.add('is-open'));
  },

  close() {
    if (this.sheet.hidden) return;
    this.sheet.classList.remove('is-open');
    setTimeout(() => { this.sheet.hidden = true; }, 250);
  },
};

document.addEventListener('DOMContentLoaded', () => DemoPanel.init());
