/* =====================================================================
   ГІЛКА B — пошук: підказки під час набору, як в Amazon.
   Поки гість набирає запит (до «Надіслати»), під полем — один компактний список,
   що вміщується над клавіатурою:
     🕘 відповідні запити з історії (хрестик — прибрати)
     🖼 товари (тап — картка як у Amazon, «+» — у кошик)
     🗂 категорія: «яблука у «Фрукти, овочі»»
   Нижче, окремо від класичних результатів, — блок «Помічник може допомогти» із жовтими
   чипами-намірами для цього запиту («Хочу солодкі яблука»; js/branches/b-mg.js):
   Search знаходить те, що гість назвав; МГ допомагає отримати те, що він мав на увазі.
   Слова, що вже набрані, — звичайним шрифтом, доповнення — жирним.
   Плейсхолдер «Шукайте або запитайте»: запит-питання («Що приготувати на вечерю?») отримує
   Машрум — перший чип блоку помічника, а «Надіслати» відкриває чат МГ замість видачі.
   Дані — DATA.search.suggest / DATA.search.ai (js/branches/b.js), стилі — css/branches/b-search.css.
   ===================================================================== */

if (Branch.has('search')) { // гілки B і C
  const lower = s => s.toLocaleLowerCase('uk-UA');
  const fillQuery = (text, query) => text.split('{query}').join(query);

  /* ДЕМО: щоб не набирати, перша ж літера після відкриття пошуку підставляє
     DATA.search.demoQuery («яблука»). Стерли хрестиком — далі набирається своє. */
  document.addEventListener('input', e => {
    const input = e.target;
    const demo = DATA.search.demoQuery;
    if (!demo || !input.matches || !input.matches('#search .search-field input')) return;
    if (input.value.length === 1 && !input.dataset.prev) {
      input.value = demo;
      input.dataset.prev = demo;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }
    input.dataset.prev = input.value;
  }, true);
  // демо-запит — лише на першу літеру після відкриття пошуку; стерли хрестиком — пишіть своє (напр. питання)
  document.addEventListener('screenchange', e => {
    const input = document.querySelector('#search .search-field input');
    if (e.detail.id === 'search' && input) input.dataset.prev = '';
  });

  /** «Що приготувати на вечерю?», «порадь вино до риби» — це питання до Машрума, а не пошук */
  const isQuestion = text => {
    const t = lower(text.trim());
    if (!t) return false;
    return t.endsWith('?') || (DATA.search.askWords || []).includes(t.split(/\s+/)[0]);
  };

  /* «Надіслати» / Enter із питанням — чат МГ замість видачі (раніше за обробник у js/screens/search.js) */
  document.addEventListener('submit', e => {
    if (!e.target.matches('#search .search-field')) return;
    const input = e.target.querySelector('input');
    if (!isQuestion(input.value)) return;
    e.preventDefault();
    e.stopPropagation();
    MG.start({ label: input.value.trim(), ask: true });
  }, true);

  Screens.search.suggest = ({ query, q, hist, cats, ids, esc, wordMatch }) => {
    const S = DATA.search, Sg = S.suggest;

    /** Набране — звичайним, доповнення — жирним: «ябл» + «уко Голден» */
    const hl = text => esc(text).replace(/[^\s«»"(),.—]+/g, w => {
      const x = q.find(t => wordMatch(lower(w), t));
      if (!x) return `<b>${w}</b>`;
      let n = 0; // спільний початок: «яблука» у «Яблуко» → «Яблук» звичайним
      while (n < x.length && lower(w)[n] === x[n]) n++;
      return w.slice(0, n) + (w.slice(n) ? `<b>${w.slice(n)}</b>` : '');
    });

    // Машрум: наміри для цього запиту; для будь-якого іншого — «Допоможи вибрати»
    const A = S.ai;
    const intent = A.intents.find(i => q.some(t => i.match.some(m => t.startsWith(m) || (t.length >= 3 && m.startsWith(t)))));
    const fill = t => ({ ...t, label: fillQuery(t.label, query), answer: t.answer && fillQuery(t.answer, query) });
    let mgChips = intent ? intent.chips.slice(0, Sg.ai).map(fill)
      : ids.length ? [{ ...fill(A.generic), items: ids.slice(0, 8) }]
      : [];
    // запит — питання: першим чипом саме воно, МГ відповість у чаті
    if (isQuestion(query)) mgChips = [{ label: query, ask: true }, ...mgChips.slice(0, Sg.ai - 1)];

    const rows = [
      ...hist.map(h => `
        <li class="sg-row">
          <button class="sg-row__main" type="button" data-search-query="${esc(h)}">
            <img class="sg-row__icon" src="assets/icons/time-history.svg" alt=""><span>${hl(h)}</span>
          </button>
          <button class="sg-row__side" type="button" data-search-remove="${esc(h)}" aria-label="Прибрати з історії">
            <img src="assets/icons/circle-cancel.svg" alt="">
          </button>
        </li>`),
      ...ids.slice(0, Sg.products).map(id => {
        const p = DATA.products[id];
        return `
        <li class="sg-row" data-go="pdp" data-param="${id}">
          <span class="sg-row__main">
            <img class="sg-row__thumb" src="${p.image}" alt=""><span>${hl(p.shortName || p.name)}</span>
          </span>
          ${UI.qtyControl(id)}
        </li>`;
      }),
      ...cats.slice(0, Sg.categories).map(c => `
        <li class="sg-row">
          <button class="sg-row__main" type="button" data-search-cat="${S.categories.indexOf(c)}">
            <img class="sg-row__icon" src="${c.icon}" alt="">
            <span>${esc(query)} <span class="sg-row__hint">${Sg.inCategory.replace('{category}', c.label)}</span></span>
          </button>
        </li>`),
    ];
    if (!rows.length && !mgChips.length) return null; // нічого — основний пошук покаже «Натисніть «Надіслати»…»
    return (rows.length ? `<ul class="sg" aria-label="Підказки">${rows.join('')}</ul>` : '') + MG.block(mgChips);
  };

}
