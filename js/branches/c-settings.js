/* =====================================================================
   ГІЛКА C — екран «Налаштування помічника» (#mg-settings).
   • Вимикач «Показувати помічника»: вимкнули — МГ у кутку зникає; увімкнули — повертається.
     Той самий стан, що й «змахнули за край» (js/branches/c-drag.js), памʼятається в браузері.
   • Вибір персонажа (як у ChatGPT): поки доступний лише МГ, інші — заготовка для демо,
     сірі й не обираються (locked у DATA.mgSettings.skins). Доступний скін — CSS-фільтр для всіх МГ
     (<html style="--mg-skin: …">, css/branches/c-settings.css). Памʼятається в браузері.
   • Великий МГ вимкнений (змахнули чи вимикачем) — маленький МГ зʼявляється в рядках тегів.
   • Відкривається з меню «⋮» у чаті («Налаштування помічника») і з кнопки профілю на головній.
   Тексти й скіни — DATA.mgSettings (js/branches/c.js).
   ===================================================================== */

if (Branch.current === 'c') {
  const skinKey = 'silpo-c-mg-skin';

  // екран — ще до App.init, щоб роутер його знав (#mg-settings)
  document.querySelector('main').insertAdjacentHTML('beforeend',
    '<section class="screen" id="mg-settings" aria-label="Налаштування помічника"></section>');

  const MgSettings = {
    skin() {
      let id = 'classic';
      try { id = localStorage.getItem(skinKey) || id; } catch (e) { /* приватний режим */ }
      return DATA.mgSettings.skins.find(s => s.id === id && !s.locked) || DATA.mgSettings.skins[0];
    },
    applySkin(skin, remember) {
      document.documentElement.style.setProperty('--mg-skin', skin.filter);
      if (remember) try { localStorage.setItem(skinKey, skin.id); } catch (e) { /* ок */ }
      document.querySelectorAll('[data-mg-skin]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.mgSkin === skin.id)));
    },
    /** Стан вимикача — як є зараз (МГ могли змахнути, поки екран був закритий) */
    sync() {
      const input = document.querySelector('#mg-settings .mgs-show input');
      if (input && typeof MgDrag !== 'undefined') input.checked = MgDrag.isEnabled();
    },
  };

  Screens['mg-settings'] = function renderMgSettings(root) {
    const T = DATA.mgSettings;
    const current = MgSettings.skin();
    root.innerHTML = `
      <header class="mgs-head">
        <button class="mgs-head__back" type="button" data-back aria-label="Назад">
          <img class="icon-grey" src="assets/icons/arrow-back.svg" alt="">
        </button>
        <h1 class="mgs-head__title">${T.title}</h1>
      </header>
      <div class="mgs-body">
        <section class="mgs-card mgs-hero">
          <img class="mgs-hero__mg" src="${DATA.aiChat.avatar}" alt="">
          <div class="mgs-hero__text"><b>${T.name}</b><span>${T.subtitle}</span></div>
        </section>
        <section class="mgs-card">
          <label class="mgs-row mgs-show">
            <span class="mgs-row__text"><b>${T.showLabel}</b><small>${T.showHint}</small></span>
            <input class="switch" type="checkbox">
          </label>
        </section>
        <section class="mgs-card">
          <h2 class="mgs-card__title">${T.skinsTitle}</h2>
          <div class="mgs-skins">
            ${T.skins.map(s => `
              <button class="mgs-skin" type="button" data-mg-skin="${s.id}"
                      ${s.locked ? `aria-disabled="true" title="${T.lockedHint}"` : `aria-pressed="${s.id === current.id}"`}>
                <img src="${s.image || DATA.aiChat.avatar}" alt=""${s.image ? '' : ` style="filter: ${s.filter}"`}>
                <b>${s.label}</b>
                <span>${s.locked ? T.lockedHint : s.desc}</span>
              </button>`).join('')}
          </div>
        </section>
      </div>`;
    MgSettings.sync();
    root.querySelector('.mgs-show input').addEventListener('change', e => MgDrag.setEnabled(e.target.checked));
    root.querySelector('.mgs-skins').addEventListener('click', e => {
      const b = e.target.closest('[data-mg-skin]:not([aria-disabled="true"])'); // закриті не обираються
      if (b) MgSettings.applySkin(T.skins.find(s => s.id === b.dataset.mgSkin), true);
    });
  };

  /** Великий МГ вимкнений — позначка на <html>: тоді маленький МГ зʼявляється в рядках тегів
      (навіть коли «МГ у тегах» вимкнено; css/branches/c.css) */
  const markCorner = on => { document.documentElement.dataset.mgCorner = on ? 'on' : 'off'; };

  document.addEventListener('DOMContentLoaded', () => { // після App.init
    MgSettings.applySkin(MgSettings.skin(), false);
    markCorner(MgDrag.isEnabled());
  });
  // відкрили екран — вимикач показує, чи МГ зараз увімкнений
  document.addEventListener('screenchange', e => { if (e.detail.id === 'mg-settings') MgSettings.sync(); });
  document.addEventListener('mg-enabled', e => { MgSettings.sync(); markCorner(e.detail.on); });

  // як сюди потрапити: «⋮» → «Налаштування помічника» в чаті; кнопка профілю на головній
  document.addEventListener('click', e => {
    const item = e.target.closest('.ai-menu__item');
    if (item && item.textContent.trim() === DATA.aiChat.menu[1]) {
      setTimeout(() => AiChat.pushTo('mg-settings'), 0); // меню закривається js/ai-chat.js; «Назад» — знову в чат
      return;
    }
    if (e.target.closest('#home .avatar')) App.go('mg-settings');
  });
}
