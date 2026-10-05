/* =====================================================================
   ГІЛКА D — сценарії чату МГ.
   • Основа — уся гілка C (Branch.list.d.base = 'c'): ті самі дані, стилі й поведінка;
     тут — лише те, що відрізняється. Стилі — css/branches/d.css ([data-variant="d"]).
   • Чат — головний екран: відкритий одразу, без стрілки «Назад»; решта прототипу
     (картка товару, кошик, оформлення) — під ним і відкривається з чату, «Назад» — знову в чат.
     Прийшли на головну (напр. «На головну» після замовлення) — знову чат.
   • Механізм сценаріїв (кроки, підтвердження, чернетка, кошик) — спільний з C: js/scenarios/engine.js.
     Тут лише Chats: без привітання (демо) — відкриття, вибір у списку «Сценарії» поза телефоном
     (ще не зроблені — сірі «скоро») і «Новий чат» одразу запускають перший запит сценарію.
   ===================================================================== */

(() => {
  Branch.define('d', {
    data: {
      aiChat: {
        screens: {
          home: {
            greeting: 'Привіт! Я Машрум. Можу підібрати товар, зібрати кошик чи знайти рецепт. З чого почнемо?',
          },
        },
      },
      /* Список сценаріїв поза телефоном — у порядку задачі. Сценарій з файлом js/scenarios/<id>.js — активний,
         решта — «скоро». Новий сценарій: додати сюди рядок і файл. */
      scenarios: {
        title: 'Сценарії',
        soon: 'скоро',
        list: [
          { id: 'wine', label: 'Вибір товару з уточненням: вино' },
          { id: 'replace', label: 'Заміна товару в кошику' },
          { id: 'recipe', label: 'Рецепти й інгредієнти' },
          { id: 'photo-list', label: 'Список покупок із фото' },
          { id: 'predict', label: '«Передбач моє замовлення»' },
          { id: 'event', label: 'Кошик під подію' },
          { id: 'availability', label: 'Наявність і питання про товар' },
          { id: 'diet', label: 'Раціон і КБЖУ' },
          { id: 'history', label: 'Історія покупок і чеків' },
          { id: 'rude', label: 'Реакція на грубощі' },
          { id: 'promo', label: 'Товари по акції' },
          { id: 'budget', label: 'Підбір під бюджет' },
        ],
      },
    },
  });

  if (Branch.current !== 'd') return;
  const chat = AiChat;
  Scenarios.onStep = id => markActive(id); // крок сценарію — підсвітка в списку поза телефоном

  /* Привітання на «головній» (тобто в чаті) — теги готових сценаріїв */
  const baseOpeners = chat.screenOpeners;
  chat.screenOpeners = function () {
    return this.screenKey() === 'home' ? Scenarios.openers() : baseOpeners.call(this);
  };

  /* Без привітання (демо): «Новий чат» одразу запускає перший запит поточного сценарію */
  const baseReset = chat.reset;
  chat.reset = function () {
    this.lastNode = null;
    baseReset.call(this);
    const s = Scenarios.all[active];
    if (!s) return;
    this.thread = [];
    this.render();
    this.runNode({ ...s.opener, kind: 'node' });
  };

  /* Чат не закривається: «Назад»/Esc нічого не роблять; ховається лише під час переходу
     на картку товару чи в кошик (close({ instant: true }) з pushTo) */
  const baseClose = chat.close;
  chat.close = function (opts = {}) {
    // на головній чат — це і є застосунок; поверх кошика (картки) — закривається стрілкою «Назад»
    if (!opts.instant && (!App.current || App.current.id === 'home')) return;
    return baseClose.call(this, opts);
  };
  /* Екран під чатом — на <html data-screen>: МГ у куточку видно всюди, крім головної (там чат) */
  document.addEventListener('screenchange', e => { document.documentElement.dataset.screen = e.detail.id; });

  /* Острівець і плаваючий МГ у чаті-застосунку не потрібні */
  if (typeof MgIsland !== 'undefined') MgIsland.speak = () => {};

  /** Новий чат і одразу перший крок сценарію (зі списку поза телефоном) */
  /* Поточний сценарій: обраний у списку (памʼятається в браузері) або перший готовий */
  const SKEY = 'silpo-d-scenario';
  let active = null;
  try { active = localStorage.getItem(SKEY); } catch (e) { /* приватний режим */ }

  /** Новий чат і одразу перший запит сценарію — без привітання */
  function startScenario(id) {
    if (!Scenarios.all[id]) id = Scenarios.ready()[0] && Scenarios.ready()[0].id;
    if (!id) return;
    active = id;
    try { localStorage.setItem(SKEY, id); } catch (e) { /* без памʼяті — теж ок */ }
    if (App.current && App.current.id !== 'home') App.go('home', undefined, { record: false });
    App.history = [];
    chat.open({ instant: true, greet: false });
    chat.reset(); // reset сам запускає перший запит active
    markActive(id);
  }

  function markActive(id) {
    document.querySelectorAll('[data-scenario]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.scenario === id)));
  }

  /* Поза телефоном: список сценаріїв (на телефоні — у шторці «Налаштування прототипу») */
  function renderPanel() {
    const T = DATA.scenarios;
    const box = document.createElement('div');
    box.className = 'chips-toggle scenario-panel';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', T.title);
    box.innerHTML = `<span class="chips-toggle__label">${T.title}</span>` + T.list.map(x => {
      const ready = Boolean(Scenarios.all[x.id]);
      return `<button class="scenario-panel__item" type="button" data-scenario="${x.id}" aria-pressed="false" ${ready ? '' : 'disabled'}>
          <span>${x.label}</span>${ready ? '' : `<small>${T.soon}</small>`}
        </button>`;
    }).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-scenario]:not(:disabled)');
      if (b) startScenario(b.dataset.scenario);
    });
    document.body.appendChild(box);
  }

  document.addEventListener('DOMContentLoaded', () => { // після App.init і AiChat.init
    renderPanel();
    // відкрили посилання на картку чи кошик — чат під ними; інакше — одразу чат
    if (!App.current || App.current.id === 'home') startScenario(active);
    // повернулися на головну (не з чату) — це і є чат
    document.addEventListener('screenchange', e => {
      if (e.detail.id === 'home' && chat.el.hidden) chat.open({ instant: true, greet: false });
    });
  });
})();
