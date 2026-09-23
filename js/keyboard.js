/* =====================================================================
   iOS-КЛАВІАТУРА — зʼявляється, коли фокус у полі, підключеному через
   Keyboard.attach(input). Розкладка — DATA.keyboard, стилі — css/keyboard.css.
   • Клавіші друкують у поле; фізична клавіатура компʼютера теж працює.
   • Системна клавіатура телефона не зʼявляється (inputmode="none").
   • Shift діє на одну літеру; на початку поля велика літера вмикається сама.
   ===================================================================== */

const Keyboard = {
  input: null,
  shift: false,
  mode: 'letters', // або 'symbols'

  init() {
    const el = document.createElement('div');
    el.className = 'kb';
    el.setAttribute('aria-hidden', 'true');
    document.querySelector('.phone').appendChild(el);
    this.el = el;

    // тап по клавіатурі не забирає фокус із поля
    el.addEventListener('pointerdown', e => e.preventDefault());
    el.addEventListener('mousedown', e => e.preventDefault());
    el.addEventListener('click', e => {
      const key = e.target.closest('[data-key]');
      if (key) this.press(key.dataset.key);
    });
    this.render();
  },

  /** Підключити поле: фокус — клавіатура виїжджає, втрата фокусу — ховається */
  attach(input, { host } = {}) {
    input.setAttribute('inputmode', 'none');
    input.addEventListener('focus', () => {
      this.input = input;
      this.autoShift();
      this.el.classList.add('is-open');
      host && host.classList.add('has-keyboard');
      typeof placeFabs === 'function' && placeFabs(); // грибочок — над клавіатурою
    });
    input.addEventListener('blur', () => {
      this.el.classList.remove('is-open');
      host && host.classList.remove('has-keyboard');
      typeof placeFabs === 'function' && placeFabs();
    });
    input.addEventListener('input', () => { this.autoShift(); this.syncSend(); });
  },

  render() {
    const K = DATA.keyboard;
    const letter = ch => {
      const shown = this.shift ? ch.toLocaleUpperCase('uk-UA') : ch;
      return `<button class="kb__key" type="button" data-key="${shown}" tabindex="-1">${shown}</button>`;
    };
    const sym = ch => `<button class="kb__key" type="button" data-key="${ch.replace(/"/g, '&quot;')}" tabindex="-1">${ch}</button>`;
    const key = this.mode === 'letters' ? letter : sym;
    const rows = this.mode === 'letters' ? K.letters : K.symbols;

    const shiftKey = this.mode === 'letters'
      ? `<button class="kb__key kb__key--special kb__key--shift" type="button" data-key="shift" aria-pressed="${this.shift}" tabindex="-1">
           <img src="assets/icons/${this.shift ? 'kb-shift-on' : 'kb-shift'}.svg" alt="Shift">
         </button>`
      : `<button class="kb__key kb__key--special kb__key--label" type="button" tabindex="-1">#+=</button>`;
    const backspace = `<button class="kb__key kb__key--special" type="button" data-key="backspace" tabindex="-1"><img src="assets/icons/kb-backspace.svg" alt="Стерти"></button>`;

    this.el.innerHTML = `
      <div class="kb__rows">
        <div class="kb__row">${rows[0].map(key).join('')}</div>
        <div class="kb__row">${rows[1].map(key).join('')}</div>
        <div class="kb__row kb__row--3">
          ${shiftKey}
          <div class="kb__group">${rows[2].map(key).join('')}</div>
          ${backspace}
        </div>
        <div class="kb__row">
          <button class="kb__key kb__key--special kb__key--label kb__key--mode" type="button" data-key="mode" tabindex="-1">
            ${this.mode === 'letters' ? K.toSymbols : K.toLetters}
          </button>
          <button class="kb__key kb__key--special kb__key--emoji" type="button" tabindex="-1"><img src="assets/icons/kb-emoji.svg" alt="Емодзі"></button>
          <button class="kb__key kb__key--space" type="button" data-key=" " tabindex="-1">${K.space}</button>
          <button class="kb__key kb__key--special kb__key--send" type="button" data-key="enter" tabindex="-1">${K.send}</button>
        </div>
      </div>
      <div class="kb__bar">
        <img src="assets/icons/kb-globe.svg" alt="">
        <img src="assets/icons/kb-mic.svg" alt="">
      </div>`;
    this.syncSend();
  },

  press(k) {
    const input = this.input;
    if (!input) return;
    if (k === 'shift') { this.shift = !this.shift; this.render(); return; }
    if (k === 'mode') { this.mode = this.mode === 'letters' ? 'symbols' : 'letters'; this.render(); return; }
    if (k === 'enter') {
      if (input.value.trim()) input.form ? input.form.requestSubmit() : input.dispatchEvent(new Event('change'));
      return;
    }
    const start = input.selectionStart ?? input.value.length;
    const end = input.selectionEnd ?? start;
    if (k === 'backspace') {
      if (start === end && start > 0) input.setRangeText('', start - 1, end, 'end');
      else input.setRangeText('', start, end, 'end');
    } else {
      input.setRangeText(k, start, end, 'end');
      if (this.shift && this.mode === 'letters') { this.shift = false; this.render(); }
    }
    input.dispatchEvent(new Event('input', { bubbles: true }));
  },

  /** Велика літера на початку поля й після «. », «! », «? » */
  autoShift() {
    if (!this.input || this.mode !== 'letters') return;
    const before = this.input.value.slice(0, this.input.selectionStart ?? this.input.value.length);
    const want = before.trim() === '' || /[.!?]\s$/.test(before);
    if (want !== this.shift) { this.shift = want; this.render(); }
  },

  /** «Надіслати» активна, лише коли в полі є текст */
  syncSend() {
    const send = this.el.querySelector('.kb__key--send');
    if (send) send.disabled = !(this.input && this.input.value.trim());
  },
};

document.addEventListener('DOMContentLoaded', () => Keyboard.init());
