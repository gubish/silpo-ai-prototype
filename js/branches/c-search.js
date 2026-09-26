/* =====================================================================
   ГІЛКА C — поле пошуку як у Яндексі: «Назад» у полі замість лінзи, поле на всю ширину,
   праворуч у полі (після хрестика) — МГ, кнопка в чат.
   • Поле порожнє — чат із привітанням головної (стартові теги головної).
   • У полі запит («яблука») — чат одразу з ним: ваша репліка — запит,
     МГ показує знайдені товари, а під ними — жовті теги-наміри для цього
     запиту («Хочу солодкі яблука», «Яблука для шарлотки»…), ті самі, що в
     підказках пошуку (DATA.search.ai, js/branches/b.js).
   • Запит-питання («Що приготувати на вечерю?») — МГ відповідає як на повідомлення.
   Закрили чат — знову пошук із тим самим запитом.
   Тексти — DATA.mgSearch (js/branches/c.js), стилі — css/branches/c.css.
   ===================================================================== */

if (Branch.current === 'c') {
  const lower = s => s.toLocaleLowerCase('uk-UA');
  const fillQuery = (text, query) => text.split('{query}').join(query);
  let last = { query: '', ids: [] }; // що знайшли під час набору (підказки пошуку)

  // запамʼятовуємо товари, які пошук знайшов за поточним запитом
  const baseSuggest = Screens.search.suggest;
  const suggest = args => {
    last = { query: args.query.trim(), ids: args.ids };
    return baseSuggest(args);
  };

  /* Екран пошуку: той самий, лише в полі праворуч (після хрестика) — МГ, як «ai» в Яндексі */
  const baseSearch = Screens.search;
  Screens.search = Object.assign(function renderSearchC(root, param) {
    baseSearch(root, param);
    root.querySelector('.search-field').insertAdjacentHTML('beforeend', `
      <button class="search-mg" type="button" aria-label="${DATA.mgSearch.label}">
        <img src="${DATA.aiChat.avatar}" alt="">
      </button>`);
    root.querySelector('.search-mg').addEventListener('click', () => openChat(root));
    // як у Яндексі: лінзи немає, стрілка «Назад» — у полі на її місці, поле на всю ширину
    const field = root.querySelector('.search-field');
    field.querySelector(':scope > img')?.remove();
    field.prepend(root.querySelector('.search-head [data-back]'));
  }, baseSearch, { suggest });

  const isQuestion = text => {
    const t = lower(text.trim());
    return t.endsWith('?') || (DATA.search.askWords || []).includes(t.split(/\s+/)[0]);
  };

  /** Теги-наміри для запиту — як у блоці «Помічник може допомогти» в підказках */
  function intentsFor(query, ids) {
    const A = DATA.search.ai;
    const q = lower(query).split(/\s+/).filter(Boolean);
    const intent = A.intents.find(i => q.some(t => i.match.some(m => t.startsWith(m) || (t.length >= 3 && m.startsWith(t)))));
    const fill = t => ({ ...t, label: fillQuery(t.label, query), answer: t.answer && fillQuery(t.answer, query) });
    if (intent) return intent.chips.slice(0, DATA.search.suggest.ai).map(fill);
    return ids.length ? [{ ...fill(A.generic), items: ids.slice(0, 8) }] : [];
  }

  function openChat(root) {
    const input = root.querySelector('.search-field input');
    const query = input.value.trim();
    // ховаємо клавіатуру, як і тап по жовтому тегу (js/branches/b-mg.js)
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (Keyboard.el.classList.contains('is-open') && Keyboard.input) Keyboard.input.dispatchEvent(new Event('blur'));
    const chat = AiChat;

    // порожнє поле — привітання головної (у пошуку своїх стартових тегів немає)
    if (!query) return chat.open();

    chat.open({ greet: false });
    chat.greetedOn = chat.contextKey();
    if (!chat.thread.some(m => m.from === 'user')) { chat.thread = []; chat.anchor = null; }
    if (isQuestion(query)) return chat.ask(query);

    const ids = last.query === query ? last.ids : [];
    const tags = chat.nodes(intentsFor(query, ids));
    if (!ids.length && !tags.length) return chat.ask(query); // нічого не знайшли — МГ відповість як на питання
    const T = DATA.mgSearch;
    chat.push('user', query);
    const items = ids.slice(0, T.maxItems).map(id => ({ id }));
    const text = fillQuery(items.length ? T.found : T.notFound, query)
      .split('{count}').join(items.length)
      .split('{countWord}').join(aiPlural(items.length, T.countForms));
    chat.reply(text, items, tags);
  }
}
