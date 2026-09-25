/* =====================================================================
   «ВІДКРИЙТЕ ЯК ЗАСТОСУНОК» — підказка на телефоні.
   QR-код на десктопі веде на онлайн-версію з ?from=qr. Відкрили так у браузері
   (а не з іконки на початковому екрані) — знизу аркуш із трьома кроками, як
   додати прототип на початковий екран: тоді він запускається без адресного рядка.
   «Зрозуміло» — ховає й прибирає from=qr з адреси (іконка збережеться без нього).
   Тексти — DATA.install (js/data.js), стилі — css/install-hint.css.
   ===================================================================== */

const InstallHint = {
  init() {
    const url = new URL(location.href);
    const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
    const phone = matchMedia('(max-width: 440px)').matches;
    if (url.searchParams.get('from') !== 'qr' || standalone || !phone) return;

    const T = DATA.install;
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const steps = ios ? T.ios : T.other;
    const box = document.createElement('div');
    box.className = 'install-hint';
    box.innerHTML = `
      <div class="install-hint__sheet" role="dialog" aria-modal="true" aria-labelledby="install-hint-title">
        <h2 class="install-hint__title" id="install-hint-title">${T.title}</h2>
        <p class="install-hint__text">${T.text}</p>
        <ol class="install-hint__steps">
          ${steps.map((s, i) => `
            <li><span class="install-hint__num">${i + 1}</span><img src="${s.icon}" alt=""><span>${s.text}</span></li>`).join('')}
        </ol>
        <button class="install-hint__ok" type="button">${T.ok}</button>
      </div>`;
    document.querySelector('.phone').append(box);
    box.querySelector('.install-hint__ok').addEventListener('click', () => {
      box.remove();
      url.searchParams.delete('from');
      history.replaceState(null, '', url.href);
    });
  },
};

document.addEventListener('DOMContentLoaded', () => InstallHint.init());
