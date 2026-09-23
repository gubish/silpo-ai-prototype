/* =====================================================================
   ГІЛКА B — віджет сканерів на місці QR (головна).
   QR-код і сканер цін (кнопка біля пошуку, яку прибрали) — в одному віджеті.
   Тап по помаранчевій кнопці — вона стає «×», а з неї дугою вгору й уліво
   вилітають три кнопки: QR-код · Сканер цін · Вільнокаса (радіальне меню).
   Закривається тапом по «×», по затемненню, Esc або переходом на інший екран.
   Тап по пунктах поки нічого не робить (екранів сканерів у прототипі немає).
   Тексти — DATA.scanDial (js/branches/b.js), стилі — css/branches/b-scan.css.
   ===================================================================== */

if (Branch.current === 'b') {
  const ScanDial = {
    radius: 112,              // відстань кнопок від центру віджета, px
    angles: [90, 135, 180],   // вгору → по діагоналі → уліво (градуси, як на циферблаті математики)

    init() {
      const main = document.querySelector('.fab-stack .qr-fab');
      if (!main) return;
      const D = DATA.scanDial;
      this.main = main;

      // обгортка на місці QR: сама кнопка + три кнопки дуги
      const dial = document.createElement('div');
      dial.className = 'scan-dial';
      main.before(dial);
      dial.append(main);
      main.classList.add('scan-dial__main');
      main.setAttribute('aria-label', D.label);
      main.setAttribute('aria-expanded', 'false');
      main.innerHTML = `
        <img class="scan-dial__icon" src="assets/icons/scan-white.svg" alt="">
        <img class="scan-dial__close" src="assets/icons/close-white.svg" alt="">`;
      dial.insertAdjacentHTML('beforeend', D.items.map((it, i) => {
        const a = this.angles[i] * Math.PI / 180;
        const x = Math.round(Math.cos(a) * this.radius), y = Math.round(-Math.sin(a) * this.radius);
        return `
          <button class="scan-dial__item" type="button" data-scan="${it.id}" tabindex="-1"
                  style="--x:${x}px; --y:${y}px; --i:${i}">
            <span class="scan-dial__bubble"><img src="${it.icon}" alt=""></span>
            <span class="scan-dial__label">${it.label}</span>
          </button>`;
      }).join(''));
      this.dial = dial;

      // затемнення на весь телефон — під віджетом
      const scrim = document.createElement('div');
      scrim.className = 'scan-scrim';
      document.querySelector('.phone').appendChild(scrim);
      this.scrim = scrim;

      main.addEventListener('click', e => { e.stopPropagation(); this.toggle(); });
      scrim.addEventListener('click', () => this.toggle(false));
      // тап по пунктах меню поки нічого не робить — екранів сканерів у прототипі немає
      document.addEventListener('keydown', e => { if (e.key === 'Escape') this.toggle(false); });
      document.addEventListener('screenchange', () => this.toggle(false));
    },

    toggle(open = !this.dial.classList.contains('is-open')) {
      this.dial.classList.toggle('is-open', open);
      this.scrim.classList.toggle('is-open', open);
      this.main.setAttribute('aria-expanded', String(open));
      this.dial.querySelectorAll('[data-scan]').forEach(b => { b.tabIndex = open ? 0 : -1; });
    },

  };

  document.addEventListener('DOMContentLoaded', () => setTimeout(() => ScanDial.init()));
}
