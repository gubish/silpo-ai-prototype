/*!
 * <mashrum-island> — віджет чат-бота Машрума для прототипу Сільпо.
 * Один файл без залежностей (Web Component + Shadow DOM). Шрифт Onest підтягується з Google Fonts.
 *
 * Використання:
 *   <script src="mashrum-island.js"></script>
 *   <mashrum-island></mashrum-island>          // ставиться впритул над навбаром, висота 85px
 *
 * Події (bubbles, composed):
 *   mashrum-cta       — тап по стрілці. detail: { index, mode, text, skill }.
 *                       event.preventDefault() вимикає вбудоване демо «думаю → готово».
 *   mashrum-collapse  — віджет згорнувся в кружечок (хрестик або тап по обличчю)
 *   mashrum-expand    — віджет розгорнувся
 *
 * Методи: el.next(), el.goTo(i), el.tap(), el.collapse(), el.expand(), el.toggle(), el.pause(), el.resume()
 * Дані:   el.skills = [{ t, think, done, cta, doneCta, pal:[4 hex] }, ...]   // задати ДО вставки в DOM
 *
 * Зміни для прототипу Сільпо (гілка C, js/branches/c-island3.js):
 *   face-slot — замість намальованого обличчя свій Машрум у слоті «face» (<div slot="face">…</div>);
 *               тап по ньому віджет сам не згортає/розгортає — це вирішує прототип;
 *   start-min — стартує одразу згорнутим у «спору», без анімації;
 *   el.isMin() — чи згорнутий зараз; атрибут min на елементі — те саме, для CSS;
 *   hide-eyebrow — без підпису «Машрум може»;
 *   two-lines — повідомлення завжди у два рядки (розрив — між словами, де половини найрівніші;
 *               або свій — «\n» у тексті).
 */
(() => {
  if (customElements.get('mashrum-island')) return;

  // Onest from Google Fonts (once per document)
  if (!document.querySelector('link[data-mashrum-font]')) {
    const l = document.createElement('link');
    l.rel = 'stylesheet'; l.dataset.mashrumFont = '';
    l.href = 'https://fonts.googleapis.com/css2?family=Onest:wght@400..700&display=swap'; // [прототип Сільпо] увесь діапазон — для проміжної товщини
    document.head.appendChild(l);
  }

  const CSS = `
:host{
  display:block;position:relative;height:85px;
  --ink:#131410;
  --f-ui:"Onest", "Helvetica Neue", Arial, sans-serif;
  --ease-out:cubic-bezier(.2,.7,.2,1);
  --ease-morph:cubic-bezier(.32,.86,.18,1);
  font-family:var(--f-ui);color:var(--ink);
  -webkit-tap-highlight-color:transparent;
}
*{box-sizing:border-box}
button{font:inherit}
/* ---------- the island ---------- */
/* The widget is docked: its body is clipped flat by the progress rail and sits right on the app bar */
.bottomstack{position:absolute;left:0;right:0;bottom:0;display:flex;flex-direction:column}
.dock{position:relative;margin:0 10px;height:85px;display:flex;justify-content:flex-end;align-items:flex-end;pointer-events:none;clip-path:inset(-300px -40px 0 -40px)}
/* Progress: not a line but an amorphous blurred colour field growing along the seam; clipped clean at the app bar */
.rail{position:absolute;left:0;right:0;top:47px;height:38px;z-index:5;pointer-events:none;transition:opacity .4s ease;overflow:hidden;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent);mask-image:linear-gradient(90deg,transparent,#000 14%,#000 86%,transparent)}
.rail canvas{position:absolute;left:0;top:0;width:100%;height:50px;filter:blur(6px) saturate(1.15)}
.bottomstack.quiet .rail{opacity:0}
.glow{position:absolute;left:0;top:0;width:220px;height:160px;margin:-32px 0 0 -110px;border-radius:50%;
  background:radial-gradient(closest-side,var(--glow,rgba(188,233,0,.55)),transparent);filter:blur(18px);opacity:.75;transition:background 1.2s ease;pointer-events:none}
/* No box: the body is a drifting field of milky blobs drawn on canvas; edges are feathered, never stroked */
.island{position:relative;pointer-events:auto;width:100%;height:82px;display:flex;align-items:center;gap:11px;padding:0 6px 0 14px}
.island::before{content:"";position:absolute;inset:-22px -14px 0;pointer-events:none;
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent),linear-gradient(180deg,transparent,#000 35%,#000);
  -webkit-mask-composite:source-in;mask-image:linear-gradient(90deg,transparent,#000 22%,#000 78%,transparent),linear-gradient(180deg,transparent,#000 35%,#000);mask-composite:intersect}
.island::before{backdrop-filter:blur(14px) saturate(1.3);-webkit-backdrop-filter:blur(14px) saturate(1.3)}
.island.min::before{inset:-14px -14px 0}
.island canvas{position:absolute;inset:-34px -30px;width:calc(100% + 60px);height:calc(100% + 68px);pointer-events:none}
#spores{filter:blur(7px)}

.face{position:relative;isolation:isolate;flex:none;width:54px;height:56px;border:0;padding:0;background:none;cursor:pointer;border-radius:50%;animation:bob 6.5s ease-in-out infinite}
.face svg{width:100%;height:100%;overflow:visible}
.face:focus-visible,.cta:focus-visible{outline:2px solid var(--ink);outline-offset:3px}
@keyframes bob{0%,100%{transform:translateY(0) rotate(0)}50%{transform:translateY(-1.5px) rotate(-1.5deg)}}
.eye{transform-box:fill-box;transform-origin:50% 55%;transition:transform .09s ease-in}
.eye.shut{transform:scaleY(.08)}
.pupils{transition:transform .5s var(--ease-out)}
.brow{transform-box:fill-box;transform-origin:20% 100%;transition:transform .5s var(--ease-out)}
.hat{transform-box:fill-box;transform-origin:30% 100%;transition:transform .8s var(--ease-out)}
.island.thinking .brow{transform:translateY(-2.2px) rotate(-4deg)}
.island.thinking .hat{transform:rotate(-5deg) translateY(-1px)}

.copy{position:relative;flex:1;min-width:0;display:flex;flex-direction:column;gap:5px;transition:opacity .22s ease}
.eyebrow{display:flex;align-items:center;font:500 12px/1 var(--f-ui);letter-spacing:-.005em}
#eb{color:rgba(19,20,16,.42);mix-blend-mode:multiply}
.eyebrow{position:relative}
#eb{transition:opacity .25s ease,filter .25s ease}
#eb.swap{opacity:0;filter:blur(3px)}

.headline{margin:0;min-height:38px;font:500 14.5px/19px var(--f-ui);letter-spacing:-.008em;color:var(--ink);text-wrap:balance}
.headline .w{display:inline-block;white-space:nowrap}
.headline .c{display:inline-block;opacity:0;filter:blur(8px);transform:translateY(.42em);
  transition:opacity .55s var(--ease-out),filter .7s var(--ease-out),transform .7s var(--ease-out);transition-delay:calc(var(--i) * 16ms)}
.headline.in .c{opacity:1;filter:blur(0);transform:none}
.headline.out{transition:opacity .28s ease,filter .28s ease,transform .28s ease;opacity:0;filter:blur(6px);transform:translateY(-5px)}
.headline.out .c{transition-delay:0s}

.actions{position:relative;z-index:1;flex:none;display:flex;align-items:center;gap:2px;transition:opacity .22s ease}
.cta{position:relative;flex:none;width:46px;height:46px;border:0;border-radius:50%;color:var(--ink);cursor:pointer;
  background:none;
  display:grid;place-items:center;transition:transform .18s ease,background .3s ease}
.cta:active{transform:scale(.94)}
.cta{isolation:isolate}
.cta svg{display:block;width:24px;height:24px;overflow:visible}
.cta.nudge .arrow{animation:nudge .95s var(--ease-out) 1}
@keyframes nudge{0%{transform:translateX(0)}28%{transform:translateX(6px)}55%{transform:translateX(-2px)}78%{transform:translateX(1.5px)}100%{transform:translateX(0)}}
.cta.busy .arrow{animation:busy .9s ease-in-out infinite}
@keyframes busy{0%,100%{transform:translateX(-2px);opacity:.55}50%{transform:translateX(3px);opacity:1}}
.close{flex:none;width:40px;height:40px;border:0;border-radius:50%;background:transparent;color:#3a3c33;cursor:pointer;display:grid;place-items:center;transition:background .2s,color .2s}
.close:hover{background:rgba(19,20,16,.06);color:var(--ink)}
.close:focus-visible{outline:2px solid var(--ink);outline-offset:1px}
.close svg{display:block;width:24px;height:24px}

/* collapsed — the island shrinks into a spore */
.island.fading .copy,.island.fading .actions{opacity:0;pointer-events:none}
.island.min{width:76px;height:76px;padding:0 9px;margin:0 6px 18px 0}
.island canvas,.island::before{transition:opacity .35s ease}
.island.min canvas,.island.min::before{opacity:0}
.dock.free{clip-path:none}
/* collapsed: Mashrum as the round spore from the original artwork, never clipped */
.orb{position:absolute;inset:-20px -19px;border-radius:50%;pointer-events:none;z-index:-1;opacity:0;transform:scale(.55);
  background:radial-gradient(closest-side,var(--c0,#BCE900) 0 20%,var(--c1h,rgba(255,218,0,.5)) 66%,rgba(255,255,255,0) 100%);
  transition:opacity .45s ease,transform .7s var(--ease-morph)}
.island.min .orb{opacity:1;transform:scale(1);animation:orb 6s ease-in-out .7s infinite}
@keyframes orb{50%{transform:scale(1.05)}}
.island.min .copy,.island.min .actions{display:none}
.island{transition:width .62s var(--ease-morph),height .62s var(--ease-morph),padding .62s var(--ease-morph),margin .62s var(--ease-morph),opacity .55s ease,filter .7s ease,transform .7s var(--ease-out)}

/* [face-slot] (прототип Сільпо): замість намальованого обличчя — свій Машрум, вставлений як <… slot="face"> */
:host([face-slot]) .face > svg,:host([face-slot]) .orb{display:none}
/* [hide-eyebrow] (прототип Сільпо): без підпису «Машрум може» — лише повідомлення */
:host([hide-eyebrow]) .eyebrow{display:none}
/* [face-slot] (прототип Сільпо): повідомлення трохи правіше від Машрума й трохи жирніше */
:host([face-slot]) .copy{margin-left:10px}
:host([face-slot]) .headline{font-weight:560}
/* [face-slot] згорнутий: без світіння — свій Машрум у кутку виглядає як звичайний (прототип Сільпо) */
.glow{transition:background 1.2s ease,opacity .45s ease}
:host([face-slot][min]) .glow{opacity:0}
/* [face-slot]: розгорнутий віджет у прототипі весь клікабельний (тап — чат), крім хрестика */
:host([face-slot]:not([min])) .island{cursor:pointer}
@media (prefers-reduced-motion: reduce){
  .face{animation:none}
  .headline .c{filter:none;transform:none;transition:opacity .4s ease;transition-delay:0s}
  .island,.cta{transition-duration:.01s}
  .cta .arrow,.cta.nudge .arrow,.cta{animation:none}
}
`;

  const HTML = `<div class="bottomstack" id="stack">
  <div class="rail" aria-hidden="true"><canvas id="prog"></canvas></div>
<div class="dock" id="dock">
  <div class="glow" id="glow"></div>
  <div class="island" id="island" role="region" aria-label="Машрум Геннадійович, чат-бот">
    <canvas id="spores" aria-hidden="true"></canvas>
    <button class="face" id="face" aria-label="Згорнути або розгорнути Машрума">
      <span class="orb" aria-hidden="true"></span>
      <svg viewBox="34 6 64 66" aria-hidden="true">
        <defs>
          <linearGradient id="hatG" x1="69.82" y1="2.9" x2="66.75" y2="28.55" gradientUnits="userSpaceOnUse">
            <stop stop-color="#8354B4"/><stop offset="1" stop-color="#FF00CD" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path class="hat" d="M88.3044 33.1939C88.3044 33.1939 93.2485 33.2906 94.3243 29.507C95.3035 26.0618 94.7958 23.5354 90.8792 21.3957C86.9626 19.2561 89.7791 12.6439 82.768 9.7185C72.2391 5.31837 62.1333 11.9306 56.2705 12.7768C49.8033 13.7197 42.4416 13.3208 40.3503 17.866C38.5612 21.7705 44.9801 22.4474 48.6307 23.1364C53.5627 24.0552 63.5114 24.9618 68.6247 25.3849C77.8843 26.1464 83.6141 27.3794 88.3769 27.8025C88.123 29.2047 88.2923 33.1939 88.2923 33.1939H88.3044Z" fill="url(#hatG)"/>
        <g fill="none" stroke="#000" stroke-width="1.344" stroke-linecap="round" stroke-linejoin="round">
          <path class="brow" d="M79.3353 41.947C76.7847 37.8732 67.3559 37.8732 64.5635 40.6777"/>
          <path d="M52.2693 55.002C52.2693 55.002 54.9408 54.0471 55.7991 54.2647"/>
          <path d="M62.351 54.2041C62.351 54.2041 66.9445 55.5338 68.1292 56.5371C70.3413 58.4108 71.949 60.357 71.949 62.4604"/>
          <path d="M40.3145 47.6406C40.3145 47.6406 42.2848 49.2967 46.7454 48.7286"/>
          <path d="M39.9154 36.9784C41.0638 33.5333 44.509 30.1607 49.2838 31.442C54.5059 32.8443 54.8686 40.1697 54.4092 42.805C53.9499 45.4402 53.2609 47.1326 55.0499 49.2964C56.839 51.4601 55.6906 54.7723 55.9444 57.19C56.1983 59.6076 59.6434 59.9945 60.5259 57.6977C61.4083 55.4009 64.0919 48.148 64.0919 48.148C64.0919 48.148 67.5371 52.3547 71.9855 51.2063"/>
          <path d="M69.0845 59.015C68.2746 62.2667 65.9295 62.3393 62.3997 63.2217C60.9612 63.5843 59.8612 65.4822 58.193 65.5185C56.7545 65.5547 55.0984 63.4997 53.9863 63.2217C50.6499 62.3997 48.5587 61.348 48.2686 58.2051"/>
          <path d="M49.6099 56.3916C49.6099 56.3916 46.9868 58.0477 44.9076 61.5291"/>
          <path id="mouth" d="M54.1795 69.9423C54.1795 69.9423 59.5346 66.7631 63.3545 69.0477"/>
        </g>
        <g class="eye" id="eyeL">
          <path d="M54.0104 41.9699C54.0104 41.9699 52.862 38.7907 48.2806 38.9116C43.6991 39.0324 42.0431 42.7315 40.6408 42.9853C41.9101 43.3721 43.4453 45.6568 47.2652 45.5359C51.0851 45.415 52.2334 44.3875 52.2334 44.3875C52.2334 44.3875 54.0588 44.6414 54.0225 41.9699H54.0104Z" fill="#fff"/>
          <path d="M54.0104 41.9696C54.0104 41.9696 52.862 38.4036 48.2806 38.5245C43.6991 38.6454 42.0431 42.7312 40.6408 42.9851C41.9101 43.3719 44.086 45.2818 47.9059 45.1488C51.7257 45.0159 52.2335 44.3873 52.2335 44.3873" fill="none" stroke="#000" stroke-width="1.344" stroke-linecap="round" stroke-linejoin="round"/>
          <circle class="pupils" cx="48.45" cy="43" r="1.64"/>
        </g>
        <g class="eye" id="eyeR">
          <path d="M73.6902 47.2051C72.9287 47.3018 71.9858 47.5315 71.0308 47.3985C65.5065 46.6248 65.0955 44.1347 63.8504 43.7599C65.2164 43.9171 67.4406 40.6895 71.8286 41.717C76.2167 42.7445 76.5914 46.1897 78.1629 46.7457C77.5826 46.927 76.6397 46.5644 75.6727 46.9512" fill="#fff"/>
          <path d="M73.6056 47.193C72.844 47.2897 72.01 47.2776 71.055 47.1446C65.5307 46.371 65.1076 44.1347 63.8504 43.7599C65.2164 43.9171 66.9329 41.1972 71.3088 42.2247C75.6848 43.2522 76.5914 46.1897 78.1629 46.7578C77.5826 46.9391 76.4705 46.5644 75.5035 46.9512" fill="none" stroke="#000" stroke-width="1.344" stroke-linecap="round" stroke-linejoin="round"/>
          <circle class="pupils" cx="70.8" cy="45.26" r="1.64"/>
        </g>
      </svg>
      <slot name="face"></slot>
    </button>
    <div class="copy">
      <div class="eyebrow"><span id="eb">Машрум може</span></div>
      <p class="headline" id="hl" aria-live="polite"></p>
    </div>
    <div class="actions">
      <button class="cta" id="cta" aria-label="Застосувати">
        <svg class="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/></svg>
      </button>
      <button class="close" id="close" aria-label="Згорнути Машрума">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>
      </button>
    </div>
  </div>
</div>
</div>
`;

  class MashrumIsland extends HTMLElement {
    set skills(v) { this._skills = Array.isArray(v) ? v : null; }
    get skills() { return this._skills; }
    connectedCallback() {
      if (this._started) return;
      this._started = true;
      const root = this.shadowRoot || this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style>` + HTML;
      init(this, root);
    }
    disconnectedCallback() { if (this._stop) this._stop(); this._started = false; }
  }

  function init(host, root) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const DWELL = 7000, THINK = 2600, DONE = 6000;

    // Each skill has its own clean, light, analogous palette: [core, edge, mist, haze].
    // No complementary pairs inside one palette, so overlaps never go muddy.
    const DEFAULT_SKILLS = [
      { t:'Зберу кошик на борщ за хвилину', cta:'Зібрати', think:'Добираю буряк і сметанку', done:'14 товарів уже в кошику', doneCta:'Відкрити кошик',
        pal:['#FF6AD5','#C9A2FF','#FF9EC4','#FFC6F0'], name:'Фуксія' },
      { t:'Знайду знижки на твоє звичне', cta:'Знайти знижки', think:'Перебираю твої покупки', done:'9 знижок на твоє звичне', doneCta:'Дивитись знижки',
        pal:['#FFE14A','#D2F53A','#FFF08A','#F3FF9E'], name:'Лимон' },
      { t:'Що зварити з того, що вдома?', cta:'Спитати', think:'Зазираю в холодильник', done:'3 страви на вечір без магазину', doneCta:'Обрати страву',
        pal:['#BCE900','#5EF0A8','#9BFFD9','#E2FF7A'], name:'Лайм і м’ята' },
      { t:'Порівняю склад двох йогуртів', cta:'Порівняти', think:'Читаю дрібний шрифт', done:'У першому на 4 г менше цукру', doneCta:'Деталі',
        pal:['#B49BFF','#8EC0FF','#86F2F0','#DCCBFF'], name:'Бузок і лід' },
      { t:'Нагадаю про каву, поки є запас', cta:'Нагадати', think:'Рахую твої ранки', done:'Нагадаю в четвер о 9:00', doneCta:'Гаразд',
        pal:['#FF9E9E','#FFB8E2','#FFD08A','#FFE0F0'], name:'Персик' },
    ];

    const skills = (host._skills && host._skills.length) ? host._skills : DEFAULT_SKILLS;
    const $ = id => root.getElementById(id);
    const island = $('island'), hl = $('hl'), eb = $('eb'), cta = $('cta'),
          glow = $('glow'), face = $('face'), dock = $('dock'), closeBtn = $('close');
    const pupils = [...root.querySelectorAll('.pupils')];

    let idx = 0, mode = 'rotate', paused = false, minimized = false, closed = false, timer = 0, alive = true;
    // [start-min]: згорнутий уже з першого кадру (до завантаження шрифту), без анімації
    if (host.hasAttribute('start-min')) { minimized = true; host.setAttribute('min', ''); island.classList.add('fading', 'min'); dock.classList.add('free'); }
    let phaseStart = performance.now(), phaseLen = DWELL, pausedAt = 0;

    /* ---------- colour ---------- */
    function hexToHsl(hex){
      const n = parseInt(hex.slice(1), 16); let r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
      const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
      if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
        h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
      return [h, s, l];
    }
    const hsla = (c, a) => `hsla(${c[0].toFixed(1)},${(c[1] * 100).toFixed(1)}%,${(c[2] * 100).toFixed(1)}%,${a})`;
    const deep = c => [c[0], Math.min(1, c[1] * 1.05), Math.min(c[2], .56)];
    let pal = skills[0].pal.map(hexToHsl), palTarget = pal.map(c => c.slice());
    function lerpPal(k){
      pal = pal.map((c, i) => {
        const t = palTarget[i]; let dh = ((t[0] - c[0] + 540) % 360) - 180; // shortest way round the hue wheel
        return [(c[0] + dh * k + 360) % 360, c[1] + (t[1] - c[1]) * k, c[2] + (t[2] - c[2]) * k];
      });
    }

    /* ---------- typography ---------- */
    // [two-lines] (прототип Сільпо): текст завжди у два рядки — розрив між словами там, де половини найрівніші
    function twoLines(text){
      const w = text.trim().split(/\s+/);
      if (w.length < 2) return text;
      let best = 1, diff = Infinity;
      for (let k = 1; k < w.length; k++) {
        const d = Math.abs(w.slice(0, k).join(' ').length - w.slice(k).join(' ').length);
        if (d < diff) { diff = d; best = k; }
      }
      return w.slice(0, best).join(' ') + '\n' + w.slice(best).join(' ');
    }
    function build(text){
      let i = 0; hl.textContent = '';
      const label = text;
      if (host.hasAttribute('two-lines') && !text.includes('\n')) text = twoLines(text);
      text.split(/(\s+)/).forEach(tok => {
        if (!tok) return;
        if (/\n/.test(tok)) { hl.appendChild(document.createElement('br')); return; } // явний розрив рядка
        if (/^\s+$/.test(tok)) { hl.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span'); w.className = 'w';
        [...tok].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; c.style.setProperty('--i', i++); w.appendChild(c); });
        hl.appendChild(w);
      });
      hl.setAttribute('aria-label', label);
    }
    function setHeadline(text){
      if (!hl.childNodes.length) { build(text); requestAnimationFrame(() => requestAnimationFrame(() => hl.classList.add('in'))); return; }
      hl.classList.add('out');
      setTimeout(() => { hl.classList.remove('in', 'out'); build(text); void hl.offsetWidth; requestAnimationFrame(() => hl.classList.add('in')); }, reduce ? 120 : 290);
    }
    function setEyebrow(text){
      if (eb.textContent === text) return;
      eb.classList.add('swap');
      setTimeout(() => { eb.textContent = text; eb.classList.remove('swap'); }, 250);
    }
    function nudge(label){ cta.setAttribute('aria-label', label); cta.classList.remove('nudge'); void cta.offsetWidth; cta.classList.add('nudge'); }

    /* ---------- character ---------- */
    function look(dx, dy){ pupils.forEach(p => p.style.transform = `translate(${dx}px, ${dy}px)`); }
    function blink(){
      const eyes = [$('eyeL'), $('eyeR')];
      eyes.forEach(e => e.classList.add('shut'));
      setTimeout(() => eyes.forEach(e => e.classList.remove('shut')), 110);
      if (Math.random() < .25) setTimeout(() => { eyes.forEach(e => e.classList.add('shut')); setTimeout(() => eyes.forEach(e => e.classList.remove('shut')), 100); }, 260);
      setTimeout(blink, 3000 + Math.random() * 4000);
    }
    if (!reduce) setTimeout(blink, 2200);
    function glance(){ look(1.1, .2); setTimeout(() => look(0, 0), 1600); }

    /* ---------- flow ---------- */
    function restartPhase(ms){ clearTimeout(timer); phaseStart = performance.now(); phaseLen = ms; if (!paused) timer = setTimeout(next, ms); }
    function next(){
      if (skills.length < 2 && mode === 'rotate') return; // [прототип Сільпо] одна пропозиція — не «крутимо» її сама в себе
      if (mode === 'rotate' || mode === 'done') show(idx + 1);
    }

    function show(i){
      idx = (i + skills.length) % skills.length;
      const s = skills[idx];
      mode = 'rotate';
      island.classList.remove('thinking'); cta.classList.remove('busy');
      setEyebrow('Машрум може');
      setHeadline(s.t);
      nudge(s.cta);
      palTarget = s.pal.map(hexToHsl);
      bloom(0, 1);
      glance();
      restartPhase(DWELL);
    }

    function tap(){
      if (minimized || closed) return;
      const s = skills[idx];
      // Hand the tap to the prototype first: e.g. open the chat with the field prefilled from detail.text.
      // Call event.preventDefault() to skip the built-in "thinking → done" demo.
      const ev = new CustomEvent('mashrum-cta', { bubbles: true, composed: true, cancelable: true,
        detail: { index: idx, mode, text: mode === 'done' ? s.done : s.t, skill: s } });
      if (!host.dispatchEvent(ev)) return;
      if (mode === 'done') { show(idx + 1); return; }
      if (mode !== 'rotate') return;
      mode = 'think';
      island.classList.add('thinking'); cta.classList.add('busy'); cta.classList.remove('nudge');
      cta.setAttribute('aria-label', 'Машрум думає');
      setEyebrow('Проростаю…');
      setHeadline(s.think);
      look(-.6, -.9);
      restartPhase(THINK); clearTimeout(timer);
      timer = setTimeout(() => {
        mode = 'done';
        island.classList.remove('thinking'); cta.classList.remove('busy');
        setEyebrow('Прєісполнився');
        setHeadline(s.done);
        nudge(s.doneCta);
        bloom(1, 1.25);
        look(1.1, .2); setTimeout(() => look(0, 0), 1400);
        restartPhase(DONE);
      }, THINK);
    }

    function setMin(on){
      if (closed) return;
      minimized = on;
      host.toggleAttribute('min', on); // [прототип Сільпо] стан — і назовні, для стилів свого обличчя (слот «face»)
      host.dispatchEvent(new CustomEvent(on ? 'mashrum-collapse' : 'mashrum-expand', { bubbles: true, composed: true }));
      if (on) { clearTimeout(timer); island.classList.add('fading'); setTimeout(() => { island.classList.add('min'); dock.classList.add('free'); }, 200); }
      else { island.classList.remove('min'); setTimeout(() => dock.classList.remove('free'), 300); setTimeout(() => {
        // [прототип Сільпо] старий текст не показуємо, щоб він не зникав і не зʼявлявся знову — одразу проявляємо новий по літерах
        hl.textContent = ''; hl.classList.remove('in', 'out');
        island.classList.remove('fading'); show(skills.length > 1 ? idx + 1 : idx);
      }, 420); }
    }

    cta.addEventListener('click', tap);
    closeBtn.addEventListener('click', () => setMin(true)); // the cross collapses Mashrum into the round spore
    face.addEventListener('click', () => { if (!host.hasAttribute('face-slot')) setMin(!minimized); }); // [face-slot]: тап по своєму Машруму обробляє прототип
    host.isMin = () => minimized;
    // Public API on the element
    host.next = () => { if (minimized) setMin(false); else show(idx + 1); };
    host.tap = () => { if (minimized) setMin(false); else tap(); };
    host.collapse = () => setMin(true);
    host.expand = () => setMin(false);
    host.toggle = () => setMin(!minimized);
    host.pause = () => { if (paused) return; paused = true; clearTimeout(timer); pausedAt = performance.now(); };
    host.resume = () => {
      if (!paused) return; paused = false;
      const left = Math.max(400, phaseLen - (pausedAt - phaseStart));
      phaseStart = performance.now() - (phaseLen - left);
      timer = setTimeout(() => show(idx + 1), left);
    };
    host.goTo = i => { if (!minimized) show(i); };

    /* ---------- canvases ---------- */
    const cv = $('spores'), ctx = cv.getContext('2d');
    let W = 0, H = 0; const dpr = Math.min(2, devicePixelRatio || 1);
    function resize(){
      const r = cv.getBoundingClientRect();
      if (Math.abs(r.width - W) < .5 && Math.abs(r.height - H) < .5) return;
      W = r.width; H = r.height;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    }

    // Milky body: overlapping soft blobs, so the widget has no edge of its own.
    const body = [
      { fx:.05, fy:.6,  r:.95, ax:.02, ay:.10, p:.3 },
      { fx:.27, fy:.6, r:1.05, ax:.03, ay:.12, p:1.9 },
      { fx:.5,  fy:.62, r:1.1, ax:.03, ay:.10, p:3.7 },
      { fx:.73, fy:.6, r:1.05, ax:.03, ay:.12, p:5.1 },
      { fx:.98, fy:.6,  r:1.0, ax:.02, ay:.10, p:2.6 },
      { fx:.18, fy:.05, r:.55, ax:.06, ay:.22, p:.9, wisp:true },
      { fx:.62, fy:.98, r:.6,  ax:.08, ay:.2,  p:4.2, wisp:true },
      { fx:.86, fy:.08, r:.5,  ax:.05, ay:.25, p:2.2, wisp:true },
    ];
    // Ambient spores, painted only inside the body. c = palette indexes.
    const spores = [
      { face:true, r:1.0, c:[0,1], a:.9,  sx:.21, sy:.17, ax:10, ay:6, p:0, d:.09 },
      { fx:.24, fy:.8,  r:.8,  c:[1,2], a:.6,  sx:.13, sy:.19, ax:.08, ay:.25, p:1.7, d:.07 },
      { fx:.14, fy:.06, r:.55, c:[2,3], a:.5,  sx:.17, sy:.11, ax:.06, ay:.2,  p:3.1, d:.11 },
      { fx:.6,  fy:.92, r:.75, c:[3,1], a:.32, sx:.07, sy:.12, ax:.18, ay:.2,  p:4.4, d:.06 },
      { fx:.94, fy:.2,  r:.65, c:[2,0], a:.24, sx:.09, sy:.08, ax:.06, ay:.3,  p:2.2, d:.08 },
    ];
    const blooms = [];
    function bloom(ci, strength){ if (!reduce) blooms.push({ t0: performance.now(), ci, s: strength || 1 }); }

    function blob(c, x, y, r, stops, sx, sy, rot){
      c.save(); c.translate(x, y); c.rotate(rot || 0); c.scale(sx, sy);
      const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.fill(); c.restore();
    }
    const sporeStops = (c1, c2, a) => [[0, hsla(c1, a)], [.2, hsla(c1, a)], [.66, hsla(c2, a * .5)], [1, hsla(c2, 0)]];

    // Progress field: overlapping soft blobs along the seam, coloured by the step palette.
    // Blobs near the front are small and swell as the fill passes them, so it grows rather than slides.
    const pc = $('prog'), pctx = pc.getContext('2d');
    let PW = 0, PH = 0, shown = 0;
    function mixPal(u, P){
      P = P || pal; // u in [0,3): walk the palette as a loop
      const i = Math.floor(u) % 3, k = u - Math.floor(u), a = P[i], b = P[(i + 1) % 3];
      const dh = ((b[0] - a[0] + 540) % 360) - 180;
      return [(a[0] + dh * k + 360) % 360, a[1] + (b[1] - a[1]) * k, Math.min(.68, a[2] + (b[2] - a[2]) * k)];
    }
    // When a step ends, the old field doesn't retract: its tail runs off to the right while the new one sprouts on the left.
    const exits = [];
    // One continuous shape: a soft-topped band along the seam with tapered ends, filled with the step palette.
    function drawField(tailX, headX, alphaMul, t, P){
      const seam = 38, len = headX - tailX;
      if (len < 2) return;
      const taper = Math.min(56, len * .5), pts = [];
      for (let x = tailX; x <= headX + .1; x += 5) {
        const a = Math.min(1, (x - tailX) / taper), b = Math.min(1, (headX - x) / taper);
        const k = Math.sqrt(Math.max(0, Math.min(a, b))); // rounded ends
        const h = (12 + 2.5 * Math.sin(t * .5 + x * .022) + 1.5 * Math.sin(t * .8 + x * .05)) * k;
        pts.push([x, seam - h]);
      }
      pctx.beginPath(); pctx.moveTo(tailX, seam + 12);
      pts.forEach(([x, y]) => pctx.lineTo(x, y));
      pctx.lineTo(headX, seam + 12); pctx.closePath();
      const g = pctx.createLinearGradient(tailX, 0, headX, 0);
      for (let i = 0; i <= 5; i++) g.addColorStop(i / 5, hsla(mixPal(((tailX + len * i / 5) / PW * 2.2 + t * .04) % 3 + 3, P), .85 * alphaMul));
      pctx.fillStyle = g; pctx.fill();
    }
    // Progress timeline per step: during the first SWAP ms the new field shoots to 50% while the previous step's
    // field runs off to the right just ahead of it; the remaining 50% then grows with the step's time.
    const SWAP = 1100;
    let lastPhase = -1, lastHead = 0;
    const easeIO = p => p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
    function drawProgress(prog, t){
      const now = performance.now();
      const r = pc.getBoundingClientRect();
      if (Math.abs(r.width - PW) > .5 || Math.abs(r.height - PH) > .5) { PW = r.width; PH = r.height; pc.width = Math.round(PW * dpr); pc.height = Math.round(PH * dpr); }
      pctx.setTransform(dpr, 0, 0, dpr, 0, 0); pctx.clearRect(0, 0, PW, PH);
      if (minimized || closed) { exits.length = 0; lastHead = 0; lastPhase = phaseStart; return; }
      if (phaseStart !== lastPhase) {
        if (lastPhase >= 0 && lastHead > .02) exits.push({ t0: phaseStart, head: lastHead, P: pal.map(c => c.slice()) });
        lastPhase = phaseStart;
      }
      const el = paused ? pausedAt - phaseStart : now - phaseStart;
      const e = easeIO(Math.min(1, Math.max(0, el / SWAP)));
      const head = el < SWAP ? .5 * e : .5 + .5 * Math.min(1, (el - SWAP) / Math.max(1, phaseLen - SWAP));
      lastHead = head;
      for (let i = exits.length - 1; i >= 0; i--) {
        const ex = exits[i], p = Math.min(1, (now - ex.t0) / SWAP);
        if (p >= 1) { exits.splice(i, 1); continue; }
        const k = easeIO(p), oldHead = ex.head * PW + k * 70;
        const newHead = .5 * PW * k;
        drawField(newHead + k * (ex.head * PW + 70 - .5 * PW), oldHead, 1, t, ex.P);
      }
      drawField(-70, head * PW, 1, t);
    }

    let clock = 0, last = performance.now(), energy = 0;
    const K = .64; // where the blurred body visibly ends, as a share of a blob's radius
    function frame(now){
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      resize();
      energy += ((island.classList.contains('thinking') ? 1 : 0) - energy) * Math.min(1, dt * 2.2);
      clock += dt * (reduce ? .35 : 1) * (1 + 2 * energy);
      lerpPal(Math.min(1, dt * 2.6));
      const t = clock;

      const cr = cv.getBoundingClientRect(), ir = island.getBoundingClientRect(), fr = face.getBoundingClientRect(), dr = dock.getBoundingClientRect();
      const ix = ir.left - cr.left, iy = ir.top - cr.top, iw = ir.width, ih = ir.height;
      const fx = fr.left - cr.left + fr.width / 2, fy = fr.top - cr.top + fr.height / 2;
      glow.style.transform = `translate(${fr.left - dr.left + fr.width / 2}px, ${fr.top - dr.top + fr.height / 2}px)`;
      glow.style.setProperty('--glow', hsla(pal[0], .4));

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);

      // 1. body
      const core = [];
      body.forEach(b => {
        const x = ix + (b.fx + Math.sin(t * .11 + b.p) * b.ax) * iw;
        const y = iy + (b.fy + Math.cos(t * .13 + b.p) * b.ay) * ih;
        const r = ih * b.r * 1.18 * (1 + .08 * Math.sin(t * .19 + b.p * 2));
        const sx = (b.wisp ? 1.7 : 1.25) + .15 * Math.sin(t * .17 + b.p), sy = (b.wisp ? .9 : .8) + .1 * Math.cos(t * .15 + b.p);
        const a = b.wisp ? .78 : .98;
        blob(ctx, x, y, r, [[0, `rgba(255,255,255,${a})`], [.6, `rgba(255,255,255,${a * .95})`], [1, 'rgba(255,255,255,0)']],
          sx, sy, Math.sin(t * .05 + b.p) * (b.wisp ? .3 : .08));
        if (!b.wisp) core.push({ x, y, rx: r * sx * K, ry: r * sy * K });
      });

      // 2. colour lives only inside the body
      ctx.globalCompositeOperation = 'source-atop';
      spores.forEach(b => {
        const x = b.face ? fx + Math.sin(t * b.sx + b.p) * b.ax : ix + (b.fx + Math.sin(t * b.sx + b.p) * b.ax) * iw;
        const y = b.face ? fy + Math.cos(t * b.sy + b.p) * b.ay : iy + (b.fy + Math.cos(t * b.sy + b.p) * b.ay) * ih;
        const r = Math.max(ih, 60) * b.r * (1 + .14 * Math.sin(t * .23 + b.p) + .25 * energy);
        const sx = 1 + .22 * Math.sin(t * b.d * 2.1 + b.p), sy = 1 + .22 * Math.cos(t * b.d * 1.7 + b.p * 1.3);
        blob(ctx, x, y, r, sporeStops(pal[b.c[0]], pal[b.c[1]], Math.min(1, b.a * (1 + .4 * energy))), sx * (b.face ? 1 : 1.6), sy, Math.sin(t * .05 + b.p) * .6);
      });
      // CTA spore: same living, deforming radial as the one under the face, but two colours only and centred on the icon
      {
        const qr = cta.getBoundingClientRect();
        if (qr.width) {
          const qx = qr.left - cr.left + qr.width / 2 + Math.sin(t * .31) * 1.5, qy = qr.top - cr.top + qr.height / 2 + Math.cos(t * .27) * 1.5;
          const rr = 36 * (1 + .1 * Math.sin(t * .42) + .15 * energy);
          blob(ctx, qx, qy, rr, sporeStops(pal[0], pal[1], .95), 1 + .16 * Math.sin(t * .23), 1 + .16 * Math.cos(t * .19 + 1), Math.sin(t * .07) * .8);
        }
      }
      if (energy > .5 && !reduce && (!frame.lastEmit || now - frame.lastEmit > 900)) { frame.lastEmit = now; bloom((Math.random() * 3) | 0, .7); }
      for (let i = blooms.length - 1; i >= 0; i--) {
        const b = blooms[i], p = (now - b.t0) / 2600;
        if (p >= 1) { blooms.splice(i, 1); continue; }
        const e = 1 - Math.pow(1 - p, 3);
        const c1 = pal[b.ci], c2 = pal[(b.ci + 2) % 4];
        blob(ctx, fx + e * iw * .25, fy, 12 + e * iw * .95 * b.s, sporeStops(c1, c2, Math.pow(1 - p, 1.6) * .45), 1.25, .9, 0);
      }
      ctx.globalCompositeOperation = 'source-over';

      // 3. progress rail (straight, full width) + CTA colours follow the live palette
      const el = paused ? pausedAt - phaseStart : now - phaseStart;
      const prog = Math.min(1, Math.max(0, el / phaseLen));
      drawProgress(prog, t);
      const ds = $('stack').style; // vars live on the stack so both the widget and the rail inherit them
      for (let k = 0; k < 3; k++) {
        ds.setProperty('--c' + k, hsla(pal[k], 1)); ds.setProperty('--d' + k, hsla(deep(pal[k]), 1));
        ds.setProperty('--c1h', hsla(pal[1], .5));
        ds.setProperty('--r' + k, hsla([pal[k][0], Math.min(1, pal[k][1] * 1.08), Math.min(pal[k][2], .66)], 1));
      }
      ds.setProperty('--cx', (50 + 3.5 * Math.sin(t * .5)).toFixed(1) + '%');
      ds.setProperty('--cy', (50 + 3.5 * Math.cos(t * .37)).toFixed(1) + '%');
      $('stack').classList.toggle('quiet', minimized || closed);
      if (alive && host.isConnected) requestAnimationFrame(frame);
    }

    host._stop = () => { alive = false; clearTimeout(timer); };
    // [start-min] (прототип Сільпо): стартує одразу згорнутим у «спору», без анімації
    const start = () => {
      show(0);
      if (host.hasAttribute('start-min')) clearTimeout(timer); // згорнутий — пропозиції не крутяться
      requestAnimationFrame(frame);
    };
    (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(start);
  }

  customElements.define('mashrum-island', MashrumIsland);
})();
