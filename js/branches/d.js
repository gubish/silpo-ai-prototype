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
          { id: 'predict', label: '«Передбач моє замовлення» і заміна' },
          { id: 'recipe', label: 'Рецепти й інгредієнти' },
          { id: 'photo-list', label: 'Список покупок із фото' },
          { id: 'event', label: 'Кошик під подію' },
          { id: 'budget', label: 'Кошик під бюджет' },
          { id: 'availability', label: 'Наявність і питання про товар' },
          { id: 'diet', label: 'Раціон і КБЖУ' },
          { id: 'history', label: 'Історія покупок і чеків' },
          { id: 'app-search', label: 'Знайти у застосунку' },
          { id: 'rude', label: 'Балачки й грубощі' },
        ],
      },
    },
  });

  if (Branch.current !== 'd') return;
  const chat = AiChat;
  // крок сценарію — підсвітка в списку поза телефоном. Розмова перейшла в інший сценарій (чіп «Хочу щось поїсти»
  // з «Балачок» → рецепт) — список не чіпаємо: лишається обраний сценарій і його розгорнуті ситуації
  Scenarios.onStep = id => { if (id === active) markActive(id); };

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
    // ситуація зі списку (підпункт сценарію) — починаємо з репліки гостя, інакше — з першого запиту
    // «Новий чат» посеред ситуації — знову з її репліки (activeAsk), а не з першого запиту сценарію
    const t = pendingAsk || activeAsk;
    pendingAsk = null;
    if (t) { prefill(activeBefore); this.ask(t); return; } // як завжди — прокрутка до відповіді МГ
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
  let pendingAsk = null; // репліка гостя, з якої почати (ситуація сценарію в списку)
  let activeCase = null;
  let activeAsk = null;  // репліка поточної ситуації — з неї ж починає «Новий чат»
  let activeBefore = []; // репліки гостя, що вже є в історії чату до неї (ситуація { before: [...] })
  function startScenario(id, ask, caseIdx, before) {
    pendingAsk = ask || null;
    activeAsk = ask || null;
    activeBefore = ask ? before || [] : [];
    activeCase = ask ? caseIdx : null;
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

  /** Історія чату до ситуації (напр. перша образа й відповідь МГ перед повторною): репліки гостя
      і відповіді сценаріїв — одразу, без «друкує…» і без чіпсів під ними */
  function prefill(texts) {
    texts.forEach(text => {
      const t = text.toLocaleLowerCase('uk-UA');
      const s = Object.values(Scenarios.all).find(x => x.route && x.route(t, chat.lastNode));
      const n = s && s.route(t, chat.lastNode);
      chat.thread.push({ from: 'user', text });
      const r = (n && n.run && n.run()) || {};
      if (r.text) chat.thread.push({ from: 'bot', text: r.text });
      if (n) chat.lastNode = n;
    });
    if (texts.length) chat.render();
  }

  function markActive(id) {
    document.querySelectorAll('.scenario-panel__item[data-scenario]').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.scenario === id && activeCase == null)));
    document.querySelectorAll('.scenario-panel__case').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.scenario === id && Number(b.dataset.case) === activeCase)));
    document.querySelectorAll('.scenario-panel__cases').forEach(c => c.classList.toggle('is-open', c.dataset.of === id));
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
      // ситуації сценарію (Scenarios.define({ cases: [{ label, ask, before? }] })) — підпункти; тап починає з репліки гостя
      // (before — репліки, що вже є в історії чату перед нею)
      const cases = ready ? (Scenarios.all[x.id].cases || []) : [];
      return `<button class="scenario-panel__item" type="button" data-scenario="${x.id}" aria-pressed="false" ${ready ? '' : 'disabled'}>
          <span>${x.label}</span>${ready ? '' : `<small>${T.soon}</small>`}
        </button>${cases.length ? `<div class="scenario-panel__cases" data-of="${x.id}">${cases.map((c, i) =>
          `<button class="scenario-panel__case" type="button" data-scenario="${x.id}" data-case="${i}" aria-pressed="false">${c.label}</button>`).join('')}</div>` : ''}`;
    }).join('');
    box.addEventListener('click', e => {
      const b = e.target.closest('[data-scenario]:not(:disabled)');
      if (!b) return;
      const c = b.dataset.case != null ? Scenarios.all[b.dataset.scenario].cases[Number(b.dataset.case)] : null;
      startScenario(b.dataset.scenario, c && c.ask, c ? Number(b.dataset.case) : null, c && c.before);
    });
    document.body.appendChild(box);
  }

  /* Над QR-кодом — посилання для розробників: правила МГ, інструкція для LLM і що ще передати */
  function renderDevCard() {
    const base = 'https://github.com/gubish/silpo-ai-prototype/blob/main/docs/';
    const box = document.createElement('nav');
    box.className = 'dev-card';
    box.setAttribute('aria-label', 'Для розробників');
    box.innerHTML = `<b>Для розробників</b>
      <a href="${base}mg-dialog-rules.md" target="_blank" rel="noopener">Правила МГ</a>
      <a href="${base}mg-dialog-rules.md#інструкція-для-моделі" target="_blank" rel="noopener">Інструкція для LLM</a>
      <a href="${base}for-developers.md" target="_blank" rel="noopener">Що ще передати</a>`;
    document.body.appendChild(box);
    // стоїть одразу над карткою QR (її висота залежить від підпису)
    const place = () => { const qr = document.querySelector('.qr-card'); if (qr) box.style.bottom = `${24 + qr.offsetHeight + 12}px`; };
    place();
    window.addEventListener('resize', place);
  }

  document.addEventListener('DOMContentLoaded', () => { // після App.init і AiChat.init
    renderPanel();
    renderDevCard();
    // відкрили посилання на картку чи кошик — чат під ними; інакше — одразу чат
    if (!App.current || App.current.id === 'home') startScenario(active);
    // повернулися на головну (не з чату) — це і є чат
    document.addEventListener('screenchange', e => {
      if (e.detail.id === 'home' && chat.el.hidden) chat.open({ instant: true, greet: false });
    });
  });
})();
