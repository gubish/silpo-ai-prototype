/* =====================================================================
   СЦЕНАРІЙ «Вибір товару з уточненням: вино» (гілка D, js/branches/d.js).
   Побудований за правилами docs/mg-dialog-rules.md — варіант «спершу товари»:
   • «Вино до вечері» → одразу розкид із 3 вин до різних страв з підписами «для чого»,
     припущення «до 700 ₴» названо вголос; під добіркою — одне питання
     «Що плануєш на вечерю?» з чіпсами Мʼясо · Риба · Сир і закуски · Ще не вирішив.
   • Кожна реакція («Риба», «дорого», «хочу біле», «інший», «до 500») додає або замінює
     ОДНУ умову; решта лишається. Оновлена добірка — нове повідомлення; що лишилось,
     а що нове — у першому реченні.
   • Рядок контексту над відповіддю: умови, які МГ врахував; «×» прибирає умову.
   • «Додати X» → підтвердження «✓ Додано · Скасувати» і один суміжний крок.
     «Дорого» після додавання — пропозиція ЗАМІНИТИ X, а не ще одне вино поруч.
   • Стани: нічого не підходить (чесно + два шляхи), товар недоступний (Rosé),
     ще не вирішив (універсальне або пара «червоне й біле»), скасування.
   • Пара «червоне й біле» — набір, тож чернетка-список (правило «Форма результату»):
     «Замінити» в рядку → карусель того ж кольору з «Замінити» на картці.
   • МГ не рекламує алкоголь: знижки — лише цінник на картці, у текстах МГ їх немає.
   Демо: 7 вин (DEMO нижче) — намальовані пляшки (tools/make-demo-wines.py), у назві «(демо)»;
   ціни й наявність демонстраційні. Справжні в прототипі: Lail, Chablis, Vinho Verde.
   Тексти — T, що МГ знає про вина — W, порядок порад — ORDER.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Демо-вина: дані товару й картки (лише гілка D) ---------- */
  const warn = { badge: '18+', text: 'Придбати алкогольні напої можуть особи, які досягли 18 років. Надмірне споживання алкоголю шкідливе для вашого здоров\'я.' };
  const DEMO = {
    wineCabernet:  { name: 'Вино Cabernet Sauvignon червоне сухе, Чилі (демо)', price: 389, img: 'cabernet',
                     d: ['Червоне', 'Сухе', 'Чилі', 'Каберне Совіньйон', 'Помірна', '13', 'мʼясо, гриль, тверді сири'] },
    wineMalbec:    { name: 'Вино Malbec червоне сухе, Аргентина (демо)', price: 549, img: 'malbec',
                     d: ['Червоне', 'Сухе', 'Аргентина', 'Мальбек', 'Помірна', '13.5', 'стейк, баранина'] },
    winePinot:     { name: 'Вино Pinot Noir червоне сухе, Франція (демо)', price: 690, img: 'pinot',
                     d: ['Червоне', 'Сухе', 'Франція', 'Піно Нуар', 'Висока', '12.5', 'птиця, гриби, лосось'] },
    wineSauvignon: { name: 'Вино Sauvignon Blanc біле сухе, Нова Зеландія (демо)', price: 480, img: 'sauvignon',
                     d: ['Біле', 'Сухе', 'Нова Зеландія', 'Совіньйон Блан', 'Висока', '12.5', 'риба, салати, козячий сир'] },
    wineRiesling:  { name: 'Вино Riesling біле напівсухе, Німеччина (демо)', price: 420, img: 'riesling',
                     d: ['Біле', 'Напівсухе', 'Німеччина', 'Рислінг', 'Висока', '10', 'гостра й азійська кухня'] },
    wineRose:      { name: 'Вино Rosé рожеве сухе, Прованс (демо)', price: 520, img: 'rose',
                     d: ['Рожеве', 'Сухе', 'Франція', 'Гренаш, Сенсо', 'Помірна', '12.5', 'закуски, салати'] },
    wineProsecco:  { name: 'Вино ігристе Prosecco брют, Італія (демо)', price: 359, img: 'prosecco',
                     d: ['Ігристе', 'Брют', 'Італія', 'Глера', 'Висока', '11', 'закуски, сир, морепродукти'] },
  };
  const LABELS = ['Колір вина', 'Смак вина', 'Країна походження', 'Сорт винограду', 'Кислотність', '% спирту', 'Гастрономічні поєднання'];
  Object.entries(DEMO).forEach(([id, w]) => {
    DATA.products[id] = { name: w.name, kind: 'wine', price: w.price, weight: '0.75 л', image: `assets/images/products/demo/wine-${w.img}.svg` };
    DATA.pdp.products[id] = {
      description: 'Демонстраційний товар для сценарію чату: ціна, наявність і фото умовні.',
      details: w.d.map((value, k) => ({ label: LABELS[k], value })),
      warning: warn,
    };
  });

  /* ---------- Що МГ знає про кожне вино ----------
     color — для «хочу біле»; notes — підпис під карткою (до 60 символів) для кожної страви
     (any — у розкиді, коли страва ще невідома); available: false — немає в наявності. */
  const W = {
    winePinot:     { short: 'Pinot Noir', color: 'red',
                     notes: { any: 'Якщо ще не знаєш: легке червоне, пасує до більшості страв', meat: 'Легке — до птиці, грибів, телятини', fish: 'Легке червоне, не забиває рибу', cheese: 'До мʼяких і витриманих сирів' } },
    wineMalbec:    { short: 'Malbec', color: 'red',
                     notes: { any: 'До мʼяса: щільне, соковите', meat: 'Щільне, соковите — до стейка' } },
    wineCabernet:  { short: 'Cabernet Sauvignon', color: 'red',
                     notes: { any: 'Червоне на кожен день, до мʼяса', meat: 'Ягідне, середнє тіло — до гриля', cheese: 'До твердих сирів: чедер, гауда' } },
    wineLail:      { short: 'Lail Cabernet', color: 'red',
                     notes: { any: 'Насичене — на особливий вечір', meat: 'Насичене, з танінами — на особливий вечір', cheese: 'До витриманих сирів' } },
    wineSauvignon: { short: 'Sauvignon Blanc', color: 'white',
                     notes: { any: 'До риби й салатів: свіже', fish: 'Свіже, з кислинкою — до риби й салатів', cheese: 'До козячого сиру' } },
    wineCasa:      { short: 'Vinho Verde', color: 'white',
                     notes: { any: 'Легке біле з бульбашкою', fish: 'Легше, з бульбашкою — до риби на грилі' } },
    wineRiesling:  { short: 'Riesling', color: 'white',
                     notes: { any: 'Напівсухе біле, до гострого', fish: 'Напівсухе — якщо риба гостра чи по-азійськи' } },
    winePascal:    { short: 'Chablis', color: 'white',
                     notes: { any: 'Мінеральне біле, класика', fish: 'Мінеральне, класика до білої риби', cheese: 'До мʼяких сирів: брі, камамбер' } },
    wineProsecco:  { short: 'Prosecco', color: 'sparkling',
                     notes: { any: 'Ігристе — до закусок, якщо ще не знаєш', fish: 'Ігристе — до морепродуктів', cheese: 'Ігристе — до сирної тарілки й закусок' } },
    wineRose:      { short: 'Rosé', color: 'rose', available: false,
                     notes: { any: 'Сухе рожеве — до закусок' } },
  };
  // що радити першим для кожної страви / кольору; перший доступний — вибір МГ
  const ORDER = {
    meat:   ['wineMalbec', 'wineCabernet', 'winePinot', 'wineLail'],
    fish:   ['wineSauvignon', 'wineCasa', 'wineRiesling', 'winePascal', 'winePinot', 'wineProsecco'],
    cheese: ['winePascal', 'wineProsecco', 'wineCabernet', 'wineSauvignon', 'winePinot', 'wineLail'],
    any:    ['winePinot', 'wineProsecco', 'wineRose'],
    red:    ['winePinot', 'wineMalbec', 'wineCabernet', 'wineLail'],
    white:  ['wineSauvignon', 'wineRiesling', 'wineCasa', 'winePascal'],
    sparkling: ['wineProsecco'],
  };

  const T = {
    opener: 'Підібрати вино до вечері',
    dishes: { meat: 'Мʼясо', fish: 'Риба', cheese: 'Сир і закуски' },
    dishCtx: { meat: 'до мʼяса', fish: 'до риби', cheese: 'до сиру й закусок' },
    colorCtx: { red: 'червоне', white: 'біле', sparkling: 'ігристе' },
    undecided: 'Ще не вирішив',
    assumeMax: 700, // припущення першої добірки: середня ціна
    askDish: 'Що плануєш на вечерю? Тоді звужу добірку.',
    add: x => `Додати ${x}`,
    cheaper: 'Дешевше',
    other: 'Інший варіант',
    compare: 'Чим вони відрізняються?',
    pair: 'Пара: червоне й біле',
    addBoth: 'Додати обидва',
    snacksAsk: 'До вина часто беруть закуску. Показати?',
    snacksYes: 'Так, покажи',
    snacks: ['pistachios', 'grapesRed', 'grapes'],
    checkout: 'Оформити замовлення',
    keep: x => `Лишити ${x}`,
  };

  const price = id => DATA.products[id].price;
  const money = v => UI.money(v).replace('.00', '');
  const names = ids => ids.map(id => W[id].short).reduce((s, n, i, a) => s + (i === 0 ? n : i === a.length - 1 ? ` і ${n}` : `, ${n}`), '');
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const cap = s => s.charAt(0).toLocaleUpperCase('uk-UA') + s.slice(1);
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const VARIANTS = ['варіант', 'варіанти', 'варіантів'];
  const plain = note => cap(note.replace(/^Якщо ще не знаєш: /, ''));

  /* ---------- Стан розмови про вино (див. «Контекст розмови» у правилах) ---------- */
  let S = null;
  const fresh = () => ({
    dish: null,               // meat | fish | cheese | 'undecided'
    color: null,              // red | white | sparkling
    max: T.assumeMax,         // верхня межа ціни
    maxSource: 'assumption',  // guest | assumption
    below: null,              // «дешевше за» (строго менше)
    exclude: [],              // «інший варіант» — уже показані
    shown: [],                // остання добірка
    added: null,              // останнє вино, додане через чат
  });

  /** Вина, що проходять усі умови, у порядку для страви / кольору */
  function pool(st, { ignore = [] } = {}) {
    const order = st.dish === 'undecided' ? ORDER.any
      : st.dish ? ORDER[st.dish]
      : st.color ? ORDER[st.color] : Object.keys(W);
    return order.filter(id => {
      const w = W[id];
      if (w.available === false || st.exclude.includes(id)) return false;
      if (!ignore.includes('color') && st.color && w.color !== st.color) return false;
      if (!ignore.includes('price') && st.max && price(id) > st.max) return false;
      if (!ignore.includes('price') && st.below && price(id) >= st.below) return false;
      return true;
    });
  }

  /** Добірка під поточні умови: до 3 вин з підписами, перше — вибір МГ */
  function select(st) {
    if (!st.dish && !st.color) {
      // розкид без страви: універсальне (вибір МГ) · до мʼяса · до риби
      const p = pool(st);
      const first = list => list.find(id => p.includes(id));
      const uni = first(ORDER.any);
      const meat = first(ORDER.meat.filter(id => id !== uni));
      const fish = first(ORDER.fish.filter(id => id !== uni && id !== meat));
      return [uni, meat, fish].filter(Boolean).map((id, i) => ({ id, note: W[id].notes.any, pick: i === 0 }));
    }
    const key = st.dish === 'undecided' ? 'any' : st.dish || 'any';
    return pool(st).slice(0, st.dish === 'undecided' ? 2 : 3)
      .map((id, i) => ({ id, note: W[id].notes[key] || W[id].notes.any, pick: i === 0 }));
  }

  /** Рядок контексту: що МГ врахував. Не повторюємо те, що гість щойно сказав дослівно (st.just) —
      це видно в його репліці; припущення МГ і його тлумачення («дорого» → «дешевше за 420 ₴») — показуємо */
  function context(st) {
    const c = [];
    if (st.dish && st.dish !== 'undecided') c.push({ type: 'dish', label: T.dishCtx[st.dish], source: 'guest' });
    if (st.color) c.push({ type: 'color', label: T.colorCtx[st.color], source: 'guest' });
    if (st.below) c.push({ type: 'below', label: `дешевше за ${money(st.below)}`, source: 'guest' });
    else if (st.max) c.push({ type: 'max', label: st.maxSource === 'assumption' ? `до ${money(st.max)}, припущення` : `до ${money(st.max)}`, source: st.maxSource });
    return c.filter(x => !(st.just || []).includes(x.type));
  }

  /** Перше речення: що лишилось із попередньої добірки, а що нове */
  function changeLine(prev, items, lead) {
    const ids = items.map(i => i.id), kept = ids.filter(id => prev.includes(id)), added = ids.length - kept.length;
    if (!kept.length) return `${lead} — ${ids.length === 1 ? 'є такий варіант' : `ось ${count(ids.length, VARIANTS)}`}:`;
    if (!added) return `${lead} — лишив ${names(kept)}.`;
    return `${lead} — лишив ${names(kept)} і додав ${['', 'ще одне', 'ще два', 'ще три'][added] || `ще ${added}`}.`;
  }

  /* ---------- Відповіді ----------
     Тег сценарію: { label, run } — d.js показує слова гостя, викликає run() і малює відповідь:
     { text, items, after, chips, context, confirm: { text, undo } } */
  const node = (label, run) => ({ label, scenario: 'wine', wine: true, run });
  const dishChips = () => [
    ...Object.entries(T.dishes).map(([k, l]) => node(l, () => update({ dish: k }))),
    node(T.undecided, () => update({ dish: 'undecided' })),
  ];

  /** Відповідь на поточні умови */
  function respond() {
    const prev = S.shown;
    const items = select(S);
    if (!items.length) return noMatch();
    S.shown = items.map(i => i.id);
    const pick = items[0].id;
    const ctx = context(S);

    // страву ще не знаємо — одне питання під добіркою
    if (!S.dish) {
      return {
        text: S.color ? changeLine(prev, items, cap(T.colorCtx[S.color]))
          : prev.length ? changeLine(prev, items, 'До різних страв')
          : `Ось три варіанти до різних страв, усі до ${money(S.max)}.`,
        items, after: T.askDish, chips: dishChips(), context: ctx,
      };
    }
    if (S.dish === 'undecided') {
      return {
        text: 'Тоді те, що не сперечається зі стравою:',
        items, context: ctx,
        after: `Найнадійніше — ${W[pick].short}: ${lc(plain(W[pick].notes.any))}. Або візьми пару: одне червоне й одне біле.`,
        chips: [addChip(pick), node(T.pair, () => pair()), node(T.cheaper, cheaper)],
      };
    }
    const why = lc(plain(W[pick].notes[S.dish] || W[pick].notes.any));
    return {
      text: changeLine(prev, items, cap(T.dishCtx[S.dish])),
      items, context: ctx,
      after: items.length > 1 ? `Мій вибір — ${W[pick].short}: ${why}.` : `${W[pick].short}: ${why}.`,
      chips: [addChip(pick), node(T.cheaper, cheaper), node(T.other, other), ...(items.length > 1 ? [node(T.compare, compare)] : [])].slice(0, 4),
    };
  }

  /** Змінити одну умову й відповісти */
  /** said: умову назвав гість у цій репліці (чіп або текст) — у рядку контексту її не повторюємо */
  function update(patch, { said = true } = {}) {
    S.just = said ? Object.keys(patch).filter(k => k !== 'maxSource' && patch[k] != null && !(k === 'max' && patch.maxSource !== 'guest')) : [];
    if ('dish' in patch || 'color' in patch) S.exclude = [];
    if ('max' in patch) S.below = null;
    Object.assign(S, patch);
    S.added = null;
    return respond();
  }

  /** «Дорого» / «Дешевше» — дешевше за найдешевше з показаного; після додавання — заміна */
  function cheaper() {
    if (S.added) return replaceOffer(S.added);
    const min = Math.min(...S.shown.map(price));
    S.below = min; S.exclude = []; S.just = []; // «дорого» → межа — це тлумачення МГ, показуємо
    const r = respond();
    if (!r.noMatch) r.text = `Дешевше за ${money(min)} — ${r.items.length === 1 ? 'є один варіант' : `ось ${count(r.items.length, VARIANTS)}`}:`;
    return r;
  }

  /** «Інший варіант» — ті самі умови, без уже показаних */
  function other() {
    S.exclude = [...new Set([...S.exclude, ...S.shown])]; S.just = [];
    S.added = null;
    const r = respond();
    if (!r.noMatch) r.text = 'З тими самими умовами є ще ось:';
    return r;
  }

  /** Нічого не підходить: кажемо, яку умову не виконати, і даємо два шляхи */
  function noMatch() {
    const gen = { red: 'червоного', white: 'білого', sparkling: 'ігристого' };
    const what = [S.color ? `${gen[S.color]} вина` : 'вина', S.dish && S.dish !== 'undecided' && T.dishCtx[S.dish]].filter(Boolean).join(' ');
    const limit = S.below ? `дешевше за ${money(S.below)}` : S.max ? `до ${money(S.max)}` : '';
    const A = pool({ ...S, exclude: [] }, { ignore: ['price'] }).sort((a, b) => price(a) - price(b))
      .find(id => !S.below || price(id) >= S.below);                                              // те саме, але дорожче
    const B = pool({ ...S, dish: null, color: null, exclude: [] }).filter(id => id !== A)
      .sort((a, b) => price(b) - price(a))[0];                                                       // у бюджеті, але інше
    const style = { red: 'червоне', white: 'біле', sparkling: 'ігристе' };
    // чим B відрізняється від побажання: колір або страва
    const differs = id => S.color && W[id].color !== S.color ? style[W[id].color]
      : S.dish && S.dish !== 'undecided' ? `не ${T.dishCtx[S.dish]}` : style[W[id].color];
    const items = [A && { id: A, note: `Те, що треба, але дорожче — ${money(price(A))}` },
                   B && { id: B, note: `У бюджеті, але ${differs(B)}` }].filter(Boolean);
    S.shown = items.map(i => i.id);
    S.exclude = [];
    return {
      noMatch: true,
      text: `Чесно: ${what} ${limit} зараз немає.${items.length === 2 ? ' Є два шляхи:' : items.length ? ' Найближче — ось:' : ''}`.replace(/\s+/g, ' '),
      items, context: context(S),
      after: A && B ? `Або доплатити й узяти ${W[A].short}, або лишитись у бюджеті з ${W[B].short}.` : null,
      chips: items.map(i => addChip(i.id)),
    };
  }

  /** «Чим вони відрізняються?» — факти з картки товару */
  function compare() {
    const info = id => Object.fromEntries((DATA.pdp.products[id]?.details || []).map(r => [r.label, r.value]));
    const lines = S.shown.map(id => {
      const d = info(id);
      return `${W[id].short} — ${lc(d['Колір вина'])} ${lc(d['Смак вина'])}, ${d['Країна походження']}, кислотність ${lc(d['Кислотність'])}, ${money(price(id))}`;
    });
    return { text: lines.join('\n'), chips: [addChip(S.shown[0]), node(T.cheaper, cheaper), node(T.other, other)] };
  }

  /* «Пара: червоне й біле» — це набір, який беруть цілком, тож за правилом «Форма результату»
     показуємо чернеткою-списком: «Замінити» в рядку → карусель варіантів того ж кольору. */
  // рядки пари — ті самі обʼєкти, що в чернетці: кількість і «не беру» правляться там (js/branches/d.js)
  const pairIds = () => S.pairRows.map(r => r.id);
  const pairSum = () => money(S.pairRows.filter(r => !r.off).reduce((s, r) => s + price(r.id) * r.qty, 0));
  const pairList = () => {
    S.pairRows.forEach(r => { r.mark = S.pairNew === r.id ? 'new' : null; });
    return { title: 'Чернетка: пара на вечір', rowAction: 'Замінити', addLabel: 'Додати в кошик', rows: S.pairRows };
  };
  const pairChips = () => {
    const cheapest = pair.cheapIds && pairIds().every(id => pair.cheapIds.includes(id));
    return cheapest ? [] : [node('Дешевша пара', () => pair(true))];
  };

  /** Пропозиція з двох; нічого не додаємо самі. cheap — найдешевші червоне й біле */
  function pair(cheap) {
    const p = pool({ ...S, dish: null, color: null, below: null, exclude: [] });
    const byPrice = list => cheap ? [...list].sort((a, b) => price(a) - price(b)) : list;
    const red = byPrice(ORDER.meat).find(id => p.includes(id));
    const white = byPrice(ORDER.fish).find(id => p.includes(id) && W[id].color === 'white');
    S.pairRows = [red, white].filter(Boolean).map(id => ({ id, qty: 1 }));
    S.pairNew = null; S.pairTarget = null;
    // найдешевша можлива пара — щоб не пропонувати «Дешевша пара», коли дешевше вже нікуди
    const cheapest = list => [...list].sort((a, b) => price(a) - price(b)).find(id => p.includes(id) && (list === ORDER.meat || W[id].color === 'white'));
    pair.cheapIds = [cheapest(ORDER.meat), cheapest(ORDER.fish)];
    S.shown = pairIds();
    return {
      text: `${cheap ? 'Найдешевша пара' : 'Червоне до мʼяса й біле до риби'} — ${pairSum()} за дві:`,
      list: pairList(),
      chips: pairChips(),
    };
  }

  /** «Замінити» в рядку пари: варіанти того ж кольору */
  function rowAction(id) {
    if (!S || !S.pairRows || !pairIds().includes(id)) return null;
    return node(`Заміни ${W[id].short}`, () => {
      S.pairTarget = id;
      const order = W[id].color === 'red' ? ORDER.red : ORDER.white;
      const alts = pool({ ...S, dish: null, color: W[id].color, below: null, exclude: pairIds() })
        .sort((a, b) => order.indexOf(a) - order.indexOf(b)).slice(0, 3);
      if (!alts.length) return { text: `Іншого ${W[id].color === 'red' ? 'червоного' : 'білого'} в цих умовах немає.`, list: pairList(), chips: pairChips() };
      return {
        text: `Чим замінити ${W[id].short} (${money(price(id))})?`,
        context: [{ label: `замість: ${W[id].short}`, source: 'guest' }],
        items: alts.map((a, i) => {
          const d = price(a) - price(id);
          return { id: a, note: `${plain(W[a].notes.any)} · ${d < 0 ? `на ${money(-d)} дешевше` : d > 0 ? `на ${money(d)} дорожче` : 'та сама ціна'}`, pick: i === 0, noAdd: true, act: 'Замінити' };
        }),
        chips: [node(`Лишити ${W[id].short}`, () => ({ text: `Гаразд, ${W[id].short} лишається.`, list: pairList(), chips: pairChips() }))],
      };
    });
  }

  /** Кнопка «Додати в кошик» у чернетці пари — лише позначені рядки */
  function listAdd(rows) {
    const on = rows.filter(r => !r.off);
    if (!on.length) return null;
    return node(on.length === rows.length ? 'Додай пару в кошик' : `Додай ${W[on[0].id].short} в кошик`, () => addMany(on));
  }

  /** «Замінити» на картці варіанта: один рядок пари, друге вино не змінюється */
  function cardAction(to) {
    const from = S && S.pairTarget;
    if (!from) return null;
    return node(`Заміни на ${W[to].short}`, () => {
      const row = S.pairRows.find(r => r.id === from), prevNew = S.pairNew;
      row.id = to; S.pairNew = to; S.pairTarget = null;
      return {
        confirm: {
          text: `Замінено в парі: ${W[from].short} → ${W[to].short}`,
          undo: () => { row.id = from; S.pairNew = prevNew; return { text: `Скасував: повернув ${W[from].short}.`, list: pairList(), chips: pairChips() }; },
        },
        text: `Друге вино без змін. Тепер ${pairSum()}:`,
        list: pairList(),
        chips: pairChips(),
      };
    });
  }

  /* ---------- Дії з кошиком: підтвердження + «Скасувати» ---------- */
  let lastResult = null; // остання відповідь-пропозиція: «Скасувати» повертає її теги

  function addChip(id) {
    return node(Cart.items.has(id) ? `Ще одну ${W[id].short}` : T.add(W[id].short), () => addMany([id]));
  }

  /** ids — масив id або рядків чернетки { id, qty } */
  function addMany(ids) {
    const back = lastResult;
    const rows = ids.map(x => (typeof x === 'string' ? { id: x, qty: 1 } : { id: x.id, qty: x.qty || 1 }));
    ids = rows.map(r => r.id);
    rows.forEach(r => Cart.add(r.id, r.qty));
    S.added = ids.length === 1 ? ids[0] : null;
    const qtyText = rows.every(r => r.qty === 1) ? (rows.length === 1 ? '1 шт' : 'по 1 шт') : rows.map(r => `${W[r.id].short} ${r.qty} шт`).join(', ');
    return {
      confirm: {
        text: rows.every(r => r.qty === 1) ? `Додано: ${names(ids)}, ${qtyText}` : `Додано: ${qtyText}`,
        undo: () => {
          rows.forEach(r => Cart.add(r.id, -r.qty));
          S.added = null;
          return { text: `Скасував: ${names(ids)} ${ids.length === 1 ? 'прибрав' : 'прибрав'} з кошика.`, chips: back && back.chips };
        },
      },
      text: T.snacksAsk,
      chips: [node(T.snacksYes, snacks), { label: T.checkout, go: 'cart' }],
    };
  }

  function snacks() {
    return { text: 'Ось що беруть до вина:', items: T.snacks.map(id => ({ id })), chips: [{ label: T.checkout, go: 'cart' }] };
  }

  /** «Дорого» після додавання: замінити саме це вино, решта кошика не змінюється */
  function replaceOffer(id) {
    const keepNode = node(T.keep(W[id].short), () => ({ text: `Гаразд, ${W[id].short} лишається.`, chips: [{ label: T.checkout, go: 'cart' }] }));
    const alt = pool({ ...S, max: null, below: price(id), exclude: [id], color: S.color || (S.dish ? null : W[id].color) }).slice(0, 2);
    if (!alt.length) return { text: `Дешевшого за ${W[id].short} з тими самими умовами немає.`, chips: [keepNode, node(T.other, other)] };
    S.shown = alt;
    const key = S.dish && S.dish !== 'undecided' ? S.dish : 'any';
    return {
      text: `Замінити ${W[id].short} у кошику на дешевше? Ось що є:`,
      items: alt.map(a => ({ id: a, note: `${plain(W[a].notes[key] || W[a].notes.any)} · ${money(price(a))}` })),
      chips: [...alt.map(a => node(`Замінити на ${W[a].short}`, () => replace(id, a))), keepNode],
    };
  }

  function replace(from, to) {
    const back = lastResult;
    Cart.add(from, -1); Cart.add(to);
    S.added = to;
    return {
      confirm: {
        text: `Замінено: ${W[from].short} → ${W[to].short}`,
        undo: () => {
          Cart.add(to, -1); Cart.add(from);
          S.added = from;
          return { text: `Скасував: повернув ${W[from].short}.`, chips: back && back.chips };
        },
      },
      text: `Решта кошика без змін. У кошику на ${money(Cart.total())}.`,
      chips: [{ label: T.checkout, go: 'cart' }],
    };
  }

  /* ---------- Старт ---------- */
  function start({ dish = null, color = null, max } = {}) {
    S = fresh();
    S.dish = dish; S.color = color;
    if (max !== undefined) Object.assign(S, { max, maxSource: max ? 'guest' : null });
    S.just = [dish && 'dish', color && 'color', max && 'max'].filter(Boolean); // щойно сказав гість
    return respond();
  }

  /* ---------- Своїми словами ---------- */
  const dishOf = t =>
    /стейк|мʼяс|м'яс|мяс|шашли|баран|ялович|гриль|курк|птиц/.test(t) ? 'meat'
    : /риб|морепрод|лосос|устриц|кревет|сьомг|форел|суші/.test(t) ? 'fish'
    : /сир|закуск|брі|камамбер|пармез|тарілк/.test(t) ? 'cheese' : null;
  const colorOf = t => /(^|\s)біл/.test(t) ? 'white' : /червон/.test(t) ? 'red' : /ігрист|просекко|шампан/.test(t) ? 'sparkling' : null;
  const maxOf = t => {
    if (/не важлив|будь-як|без різниці|байдуже|не обмеж|без обмежен/.test(t)) return null;
    const m = t.replace(/(\d)\s(?=\d{3}\b)/g, '$1').match(/(\d{3,6})/);
    return m ? Number(m[1]) : undefined;
  };
  const patchOf = t => {
    const patch = {}, dish = dishOf(t), color = colorOf(t), max = maxOf(t);
    if (dish) patch.dish = dish;
    if (color) patch.color = color;
    if (max !== undefined) Object.assign(patch, { max, maxSource: max ? 'guest' : null });
    return Object.keys(patch).length ? patch : null;
  };

  function route(t, last) {
    if (last && last.wine && S) {
      if (/розе|рожев|rosé|rose/.test(t)) return node(t, () => ({
        text: 'Rosé зараз немає в наявності. Найближче за характером — Pinot Noir: теж легке й універсальне.',
        items: [{ id: 'winePinot', note: plain(W.winePinot.notes.any) }],
        chips: [addChip('winePinot'), node(T.other, other)],
      }));
      if (/дорог|дешевш|дешевле/.test(t)) return node(t, cheaper);
      if (/інш|ще варіант|не те|пробував/.test(t)) return node(t, other);
      if (/відрізн|різниц|порівня/.test(t)) return node(t, compare);
      if (/не вирішив|не знаю|ще не/.test(t)) return node(t, () => update({ dish: 'undecided' }));
      const patch = patchOf(t);
      if (patch) return node(t, () => update(patch));
    }
    if (!/вин|шабл|chablis|каберне|мальбек|піно|просекко/.test(t)) return null;
    return node(t, () => start({ dish: dishOf(t), color: colorOf(t), max: maxOf(t) }));
  }

  /** «×» у рядку контексту: прибрати умову (страву, колір, межу ціни) */
  function removeCondition(type) {
    if (!S) return null;
    const label = { dish: T.dishCtx[S.dish], color: T.colorCtx[S.color], max: `до ${money(S.max || 0)}`, below: `дешевше за ${money(S.below || 0)}` }[type];
    const patch = { dish: { dish: null }, color: { color: null }, max: { max: null, maxSource: null }, below: { below: null } }[type];
    return node(`Без «${label}»`, () => {
      const r = update(patch, { said: false }); // гість прибрав умову — нічого нового не казав
      if (!r.noMatch) r.text = `Без «${label}» — ${r.items.length === 1 ? 'є такий варіант' : `ось ${count(r.items.length, VARIANTS)}`}:`;
      return r;
    });
  }

  Scenarios.define({
    id: 'wine',
    opener: node(T.opener, () => start()),
    route,
    removeCondition,
    rowAction,
    cardAction,
    listAdd,
    remember: r => { if (r && !r.confirm) lastResult = r; },
  });
})();
