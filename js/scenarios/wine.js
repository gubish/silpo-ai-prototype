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
   • Смак простими словами (W[id].body/sweet/acid/tannin/taste): чіпси «Легше» / «Насиченіше» /
     «Солодше» — від вибору МГ, лише коли такий варіант є; «Ще не вирішив» → два описи смаку
     замість термінів; «не люблю кислинку / терпке / солодке», «люблю Prosecco» (схоже на нього),
     «не люблю Malbec» — умови; смак не сходиться зі стравою → tasteMiss (чесно + два шляхи).
   • МГ не рекламує алкоголь: знижки — лише цінник на картці, у текстах МГ їх немає.
   Демо: 7 вин (DEMO нижче) — намальовані пляшки (tools/make-demo-wines.py);
   ціни й наявність демонстраційні. Справжні в прототипі: Lail, Chablis, Vinho Verde.
   Тексти — T, що МГ знає про вина — W, порядок порад — ORDER.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Демо-вина: дані товару й картки (лише гілка D) ---------- */
  const warn = { badge: '18+', text: 'Придбати алкогольні напої можуть особи, які досягли 18 років. Надмірне споживання алкоголю шкідливе для вашого здоров\'я.' };
  const DEMO = {
    wineCabernet:  { name: 'Вино Cabernet Sauvignon червоне сухе, Чилі', price: 389, img: 'cabernet',
                     d: ['Червоне', 'Сухе', 'Чилі', 'Каберне Совіньйон', 'Помірна', '13', 'мʼясо, гриль, тверді сири'] },
    wineMalbec:    { name: 'Вино Malbec червоне сухе, Аргентина', price: 549, img: 'malbec',
                     d: ['Червоне', 'Сухе', 'Аргентина', 'Мальбек', 'Помірна', '13.5', 'стейк, баранина'] },
    winePinot:     { name: 'Вино Pinot Noir червоне сухе, Франція', price: 690, img: 'pinot',
                     d: ['Червоне', 'Сухе', 'Франція', 'Піно Нуар', 'Висока', '12.5', 'птиця, гриби, лосось'] },
    wineSauvignon: { name: 'Вино Sauvignon Blanc біле сухе, Нова Зеландія', price: 480, img: 'sauvignon',
                     d: ['Біле', 'Сухе', 'Нова Зеландія', 'Совіньйон Блан', 'Висока', '12.5', 'риба, салати, козячий сир'] },
    wineRiesling:  { name: 'Вино Riesling біле напівсухе, Німеччина', price: 420, img: 'riesling',
                     d: ['Біле', 'Напівсухе', 'Німеччина', 'Рислінг', 'Висока', '10', 'гостра й азійська кухня'] },
    wineRose:      { name: 'Вино Rosé рожеве сухе, Прованс', price: 520, img: 'rose',
                     d: ['Рожеве', 'Сухе', 'Франція', 'Гренаш, Сенсо', 'Помірна', '12.5', 'закуски, салати'] },
    wineProsecco:  { name: 'Вино ігристе Prosecco брют, Італія', price: 359, img: 'prosecco',
                     d: ['Ігристе', 'Брют', 'Італія', 'Глера', 'Висока', '11', 'закуски, сир, морепродукти'] },
  };
  const LABELS = ['Колір вина', 'Смак вина', 'Країна походження', 'Сорт винограду', 'Кислотність', '% спирту', 'Гастрономічні поєднання'];
  Object.entries(DEMO).forEach(([id, w]) => {
    DATA.products[id] = { name: w.name, kind: 'wine', price: w.price, weight: '0.75 л', image: `assets/images/products/demo/wine-${w.img}.svg` };
    DATA.pdp.products[id] = {
      details: w.d.map((value, k) => ({ label: LABELS[k], value })),
      warning: warn,
    };
  });

  /* ---------- Що МГ знає про кожне вино ----------
     color — для «хочу біле»; notes — підпис під карткою (до 60 символів) для кожної страви
     (any — у розкиді, коли страва ще невідома); available: false — немає в наявності.
     Смак (узгоджено з карткою товару: «Смак вина», «Кислотність»): body 1 легке … 5 дуже насичене,
     sweet 0 сухе / 1 з солодкістю, acid 2 помірна / 3 висока, tannin 0 … 3 (3 — помітно терпке);
     taste — смак простими словами, без винних термінів. */
  const W = {
    winePinot:     { short: 'Pinot Noir', color: 'red',
                     body: 2, sweet: 0, acid: 3, tannin: 1, taste: 'легке, ягідне, з кислинкою',
                     notes: { any: 'Якщо ще не знаєш: легке червоне, пасує до більшості страв', meat: 'Легке — до птиці, грибів, телятини', fish: 'Легке червоне, не забиває рибу', cheese: 'До мʼяких і витриманих сирів' } },
    wineMalbec:    { short: 'Malbec', color: 'red',
                     body: 4, sweet: 0, acid: 2, tannin: 2, taste: 'щільне, соковите, мʼяке',
                     notes: { any: 'До мʼяса: щільне, соковите', meat: 'Щільне, соковите — до стейка' } },
    wineCabernet:  { short: 'Cabernet Sauvignon', color: 'red',
                     body: 3, sweet: 0, acid: 2, tannin: 3, taste: 'ягідне, з помітною терпкістю',
                     notes: { any: 'Червоне на кожен день, до мʼяса', meat: 'Ягідне, середнє тіло — до гриля', cheese: 'До твердих сирів: чедер, гауда' } },
    wineLail:      { short: 'Lail Cabernet', color: 'red',
                     body: 5, sweet: 0, acid: 2, tannin: 3, taste: 'дуже насичене й терпке',
                     notes: { any: 'Насичене — на особливий вечір', meat: 'Насичене, з танінами — на особливий вечір', cheese: 'До витриманих сирів' } },
    wineSauvignon: { short: 'Sauvignon Blanc', color: 'white',
                     body: 2, sweet: 0, acid: 3, tannin: 0, taste: 'свіже, трав’янисте, з кислинкою',
                     notes: { any: 'До риби й салатів: свіже', fish: 'Свіже, з кислинкою — до риби й салатів', cheese: 'До козячого сиру' } },
    wineCasa:      { short: 'Vinho Verde', color: 'white',
                     body: 1, sweet: 0, acid: 3, tannin: 0, taste: 'дуже легке, з ледь відчутною бульбашкою',
                     notes: { any: 'Легке біле з бульбашкою', fish: 'Легше, з бульбашкою — до риби на грилі' } },
    wineRiesling:  { short: 'Riesling', color: 'white',
                     body: 2, sweet: 1, acid: 3, tannin: 0, taste: 'фруктове, з легкою солодкістю',
                     notes: { any: 'Напівсухе біле, до гострого', fish: 'Напівсухе — якщо риба гостра чи по-азійськи' } },
    winePascal:    { short: 'Chablis', color: 'white',
                     body: 3, sweet: 0, acid: 3, tannin: 0, taste: 'мінеральне, свіже, цитрусове',
                     notes: { any: 'Мінеральне біле, класика', fish: 'Мінеральне, класика до білої риби', cheese: 'До мʼяких сирів: брі, камамбер' } },
    wineProsecco:  { short: 'Prosecco', color: 'sparkling',
                     body: 1, sweet: 0, acid: 3, tannin: 0, taste: 'легке, яблучне, з бульбашкою',
                     notes: { any: 'Ігристе — до закусок, якщо ще не знаєш', fish: 'Ігристе — до морепродуктів', cheese: 'Ігристе — до сирної тарілки й закусок' } },
    wineRose:      { short: 'Rosé', color: 'rose', available: false,
                     body: 2, sweet: 0, acid: 2, tannin: 0, taste: 'легке, ягідне',
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
    // смак — простими словами; відносні слова рахуються від вибору МГ у показаній добірці
    lighter: 'Легше',
    fuller: 'Насиченіше',
    sweeter: 'Солодше',
    light: 'Легке й свіже',  // два описи замість терміна, коли гість не знає, чого хоче
    full: 'Насичене й щільне',
    askTaste: 'Або скажи, що ближче на смак.',
    avoid: { acid: 'без кислинки', tannin: 'без терпкості', sweet: 'без солодкості' },
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
    body: null,               // смак: { max?, min?, sort: 'asc'|'desc', ref? } — «легше», «насичене»
    like: null,               // «люблю Prosecco» — схоже на це вино
    sweet: null,              // true — з солодкістю
    avoid: [],                // не любить: acid | tannin | sweet
  });
  const hasTaste = st => !!(st.body || st.like || st.sweet || st.avoid.length);
  // наскільки вино схоже на інше за смаком (менше — ближче)
  const dist = (a, b) => Math.abs(W[a].body - W[b].body) + Math.abs(W[a].acid - W[b].acid)
    + Math.abs(W[a].tannin - W[b].tannin) + 2 * Math.abs(W[a].sweet - W[b].sweet) + (W[a].color === W[b].color ? 0 : 1);

  /** Вина, що проходять усі умови, у порядку для страви / кольору */
  function pool(st, { ignore = [] } = {}) {
    const order = st.dish === 'undecided' ? [...new Set([...ORDER.any, ...Object.keys(W)])]
      : st.dish ? ORDER[st.dish]
      : st.color ? ORDER[st.color] : Object.keys(W);
    const taste = !ignore.includes('taste');
    const list = order.filter(id => {
      const w = W[id];
      if (w.available === false || st.exclude.includes(id) || (taste && id === st.like)) return false;
      if (!ignore.includes('color') && st.color && w.color !== st.color) return false;
      if (!ignore.includes('price') && st.max && price(id) > st.max) return false;
      if (!ignore.includes('price') && st.below && price(id) >= st.below) return false;
      if (taste && st.body && st.body.max && w.body > st.body.max) return false;
      if (taste && st.body && st.body.min && w.body < st.body.min) return false;
      if (taste && st.sweet && !w.sweet) return false;
      if (taste && st.avoid.includes('acid') && w.acid > 2) return false;
      if (taste && st.avoid.includes('tannin') && w.tannin > 2) return false;
      if (taste && st.avoid.includes('sweet') && w.sweet) return false;
      return true;
    });
    if (taste && st.like) return list.sort((a, b) => dist(a, st.like) - dist(b, st.like));
    if (taste && st.body) return list.sort((a, b) => (st.body.sort === 'asc' ? 1 : -1) * (W[a].body - W[b].body));
    return list;
  }

  /** Добірка під поточні умови: до 3 вин з підписами, перше — вибір МГ */
  function select(st) {
    if (hasTaste(st)) {
      // смак задано — підпис каже смак, щоб варіанти відрізнялись саме ним
      return pool(st).slice(0, st.dish === 'undecided' ? 2 : 3).map((id, i) => ({ id, note: cap(W[id].taste), pick: i === 0 }));
    }
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
    return `${lead} — лишив ${names(kept)}, додав ${['', 'ще одне', 'ще два', 'ще три'][added] || `ще ${added}`}.`;
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
  function respond(lead) {
    const prev = S.shown;
    const items = select(S);
    if (!items.length) return hasTaste(S) && pool(S, { ignore: ['taste'] }).length ? tasteMiss() : noMatch();
    S.shown = items.map(i => i.id);
    const pick = items[0].id;
    const ctx = context(S);

    // страву ще не знаємо — одне питання під добіркою
    if (!S.dish) {
      return {
        text: lead ? changeLine(prev, items, lead)
          : S.color ? changeLine(prev, items, cap(T.colorCtx[S.color]))
          : prev.length ? changeLine(prev, items, 'До різних страв')
          : `Ось три варіанти до різних страв, усі до ${money(S.max)}.`,
        items, after: T.askDish, chips: dishChips(), context: ctx,
      };
    }
    if (S.dish === 'undecided') {
      if (hasTaste(S)) return {
        text: changeLine(prev, items, lead || 'Під твій смак'),
        items, context: ctx,
        after: `Мій вибір — ${W[pick].short}: ${W[pick].taste}. Або візьми пару: одне червоне й одне біле.`,
        chips: [addChip(pick), node(T.pair, () => pair()), node(T.cheaper, cheaper)],
      };
      // не знає, чого хоче — вибір між двома описами смаку, а не термінами
      return {
        text: 'Тоді те, що не сперечається зі стравою:',
        items, context: ctx,
        after: `Найнадійніше — ${W[pick].short}: ${lc(plain(W[pick].notes.any))}. ${T.askTaste}`,
        chips: [addChip(pick),
          node(T.light, () => update({ body: { max: 2, sort: 'asc' }, like: null }, { lead: T.light })),
          node(T.full, () => update({ body: { min: 3, sort: 'desc' }, like: null }, { lead: T.full })),
          node(T.pair, () => pair())],
      };
    }
    const why = hasTaste(S) ? W[pick].taste : lc(plain(W[pick].notes[S.dish] || W[pick].notes.any));
    return {
      text: changeLine(prev, items, lead || cap(T.dishCtx[S.dish])),
      items, context: ctx,
      after: items.length > 1 ? `Мій вибір — ${W[pick].short}: ${why}.` : `${W[pick].short}: ${why}.`,
      chips: [addChip(pick), node(T.cheaper, cheaper), ...tasteChips().slice(0, 1),
        ...(items.length > 1 ? [node(T.compare, compare)] : []), node(T.other, other)].slice(0, 4),
    };
  }

  /* ---------- Смак ----------
     «Легше» / «Насиченіше» — відносно вибору МГ (першого в показаній добірці);
     чіп показуємо, лише коли такий варіант справді є в умовах. */
  function lighter() {
    const ref = S.shown[0];
    return update({ body: { max: W[ref].body - 1, sort: 'desc', ref }, like: null }, { lead: `Легше за ${W[ref].short}` });
  }
  function fuller() {
    const ref = S.shown[0];
    return update({ body: { min: W[ref].body + 1, sort: 'asc', ref }, like: null }, { lead: `Насиченіше за ${W[ref].short}` });
  }
  function sweeter() {
    return update({ sweet: true, avoid: S.avoid.filter(a => a !== 'sweet') }, { lead: 'З легкою солодкістю' });
  }
  function tasteChips() {
    const ref = S.shown[0];
    if (!ref) return [];
    const can = patch => pool({ ...S, ...patch, like: null, exclude: [] }).length > 0;
    const w = W[ref];
    return [
      w.body > 1 && can({ body: { max: w.body - 1 } }) && node(T.lighter, lighter),
      w.body < 5 && can({ body: { min: w.body + 1 } }) && node(T.fuller, fuller),
      !w.sweet && !S.sweet && can({ sweet: true, avoid: S.avoid.filter(a => a !== 'sweet') }) && node(T.sweeter, sweeter),
    ].filter(Boolean);
  }
  /** Смак словами для «чесно: … немає» */
  function tasteWords(st) {
    const b = st.body;
    return [
      b && b.max && b.ref && `легшого за ${W[b.ref].short}`,
      b && b.min && b.ref && `насиченішого за ${W[b.ref].short}`,
      st.like && `схожого на ${W[st.like].short}`,
      st.sweet && 'з солодкістю',
      ...st.avoid.map(a => T.avoid[a]),
    ].filter(Boolean).join(', ');
  }

  /** Смак не сходиться зі стравою чи кольором: кажемо прямо і даємо два шляхи */
  function tasteMiss() {
    const gen = { red: 'червоного', white: 'білого', sparkling: 'ігристого' };
    const what = [S.color ? `${gen[S.color]} вина` : 'вина', S.dish && S.dish !== 'undecided' && T.dishCtx[S.dish]].filter(Boolean).join(' ');
    const tw = tasteWords(S);
    const adj = S.body && !S.body.ref ? (S.body.max ? 'легкого ' : 'насиченого ') : ''; // «легкого білого вина до риби»
    const A = pool({ ...S, exclude: [] }, { ignore: ['taste'] })[0];                        // те, що до страви, але інший смак
    const B = pool({ ...S, dish: null, color: null, exclude: [] }).find(id => id !== A);    // смак той, але інше
    const cond = S.dish && S.dish !== 'undecided' ? T.dishCtx[S.dish] : S.color ? T.colorCtx[S.color] : 'ціна';
    const items = [A && { id: A, note: `${cap(cond)}, але ${W[A].taste}` },
                   B && { id: B, note: `${cap(W[B].taste)} — ${W[B].color === 'red' ? 'червоне' : W[B].color === 'white' ? 'біле' : 'ігристе'}` }].filter(Boolean);
    S.shown = items.map(i => i.id);
    S.exclude = [];
    return {
      noMatch: true,
      text: `Чесно: ${adj}${what}${tw ? ` ${tw}` : ''} зараз немає.${items.length === 2 ? ' Є два шляхи:' : items.length ? ' Найближче — ось:' : ''}`,
      items, context: context(S),
      after: A && B ? `Що важливіше — ${cond} чи смак?` : null,
      chips: items.map(i => addChip(i.id)),
    };
  }

  /** Змінити одну умову й відповісти */
  /** said: умову назвав гість у цій репліці (чіп або текст) — у рядку контексту її не повторюємо */
  function update(patch, { said = true, lead } = {}) {
    S.just = said ? Object.keys(patch).filter(k => k !== 'maxSource' && patch[k] != null && !(k === 'max' && patch.maxSource !== 'guest')) : [];
    if (['dish', 'color', 'body', 'like', 'sweet', 'avoid'].some(k => k in patch)) S.exclude = [];
    if ('max' in patch) S.below = null;
    // «легше за X» стосується показаної добірки: нова страва чи колір — нова добірка, відносний смак знімаємо
    if (('dish' in patch || 'color' in patch) && !('body' in patch) && S.body && S.body.ref) S.body = null;
    const { skip, ...rest } = patch;
    Object.assign(S, rest);
    if (skip) S.exclude = [...new Set([...S.exclude, ...skip])]; // «не люблю Malbec»
    S.added = null;
    return respond(lead);
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
      return `${W[id].short} — ${lc(d['Колір вина'])}: ${W[id].taste}. ${d['Країна походження']}, ${money(price(id))}`;
    });
    // після порівняння найчастіше кажуть «хочу легше» — тому смакові чіпси тут першими
    return { text: lines.join('\n'), chips: [addChip(S.shown[0]), ...tasteChips(), node(T.cheaper, cheaper), node(T.other, other)].slice(0, 4) };
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
      ...afterAdd(),
    };
  }
  /** Після додавання — один суміжний крок (Scenarios.nextStep): мінімальне замовлення, доставка
      або свій — закуска до вина; докласти пропонуємо теж закуски */
  function afterAdd() {
    const f = Scenarios.nextStep({ scenario: 'wine', own: node(T.snacksYes, snacks), fill: T.snacks });
    if (f.kind === 'own') return { text: T.snacksAsk, chips: [f.chip] };
    return { text: `У кошику на ${money(Cart.total())}${f.note}.`, chips: [f.chip].filter(Boolean) };
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
      ...(() => { const f = Scenarios.nextStep({ scenario: 'wine', fill: T.snacks });
        return { text: `Решта кошика без змін. У кошику на ${money(Cart.total())}${f.note}.`, chips: [f.chip].filter(Boolean) }; })(),
    };
  }

  /* ---------- Старт ---------- */
  function start(patch = {}, lead) {
    S = fresh();
    return update(patch, { lead }); // update запамʼятовує, що гість щойно сказав (S.just)
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
  // «не люблю кислинку», «без терпкості», «не дуже солодке» — заперечення поруч зі словом
  const neg = (t, root) => new RegExp(`(^|\\s)(не|без)\\s+(\\S+\\s+){0,2}?\\S*(${root})`).test(t);
  const NAMES = [ // каберне раніше за совіньйон: «каберне совіньйон»
    ['wineLail', /лаїл|lail/], ['wineCabernet', /каберне|cabernet/], ['wineMalbec', /мальбек|malbec/],
    ['winePinot', /піно|pinot/], ['wineSauvignon', /совіньйон|sauvignon/], ['wineRiesling', /рислінг|riesling/],
    ['winePascal', /шабл|chablis/], ['wineCasa', /вінью|vinho|верде/], ['wineProsecco', /просекко|prosecco/],
    ['wineRose', /розе|рожев|rosé|rose/],
  ];
  const nameOf = t => (NAMES.find(([, re]) => re.test(t)) || [])[0];
  /** Смак своїми словами → { patch, lead }; relative — є показана добірка, «легше» рахуємо від неї */
  function tasteOf(t, relative) {
    const patch = {}, leads = [], avoid = new Set(S ? S.avoid : []);
    if (/кисл/.test(t) && neg(t, 'кисл')) { avoid.add('acid'); leads.push(T.avoid.acid); }
    if ((/терпк|в[ʼ'’]?яж|танін/.test(t) && neg(t, 'терпк|в[ʼ\'’]?яж|танін')) || /м[ʼ'’]?якш|м[ʼ'’]?яке/.test(t)) { avoid.add('tannin'); leads.push(T.avoid.tannin); }
    if (/солод|напівсух/.test(t)) {
      if (neg(t, 'солод')) { avoid.add('sweet'); patch.sweet = null; leads.push(T.avoid.sweet); }
      else { avoid.delete('sweet'); patch.sweet = true; leads.push('з легкою солодкістю'); }
    }
    if (avoid.size !== (S ? S.avoid.length : 0) || [...avoid].some(a => !(S && S.avoid.includes(a)))) patch.avoid = [...avoid];
    const ref = relative && S && S.shown[0];
    if (/легш/.test(t) && ref) { patch.body = { max: W[ref].body - 1, sort: 'desc', ref }; leads.push(`легше за ${W[ref].short}`); }
    else if (/легш|легк/.test(t) || (/свіж/.test(t) && !dishOf(t))) { patch.body = { max: 2, sort: 'asc' }; leads.push('легке й свіже'); }
    else if (/насиченіш|щільніш|потужніш|важч/.test(t) && ref) { patch.body = { min: W[ref].body + 1, sort: 'asc', ref }; leads.push(`насиченіше за ${W[ref].short}`); }
    else if (/насичен|щільн|потужн|важк/.test(t)) { patch.body = { min: 3, sort: 'desc' }; leads.push('насичене й щільне'); }
    if (patch.body) patch.like = null;
    return Object.keys(patch).length ? { patch, lead: leads.join(', ') } : null;
  }
  /** «Люблю Prosecco» → схоже на нього; «не люблю Malbec» → без нього */
  function likeOf(t) {
    const id = nameOf(t);
    if (!id) return null;
    const re = NAMES.find(([k]) => k === id)[1].source;
    if (neg(t, re)) return { patch: { skip: [id] }, lead: `Без ${W[id].short}` };
    if (/люб|подоба|сподоба|схож|як\s|типу|смакув|пив|пила|пили|кшталт/.test(t)) return { patch: { like: id, body: null }, lead: `Схоже на ${W[id].short}`, id };
    return null;
  }
  const patchOf = (t, relative) => {
    const patch = {}, dish = dishOf(t), color = colorOf(t), max = maxOf(t);
    if (dish) patch.dish = dish;
    if (color) patch.color = color;
    if (max !== undefined) Object.assign(patch, { max, maxSource: max ? 'guest' : null });
    const taste = tasteOf(t, relative);
    if (taste) Object.assign(patch, taste.patch);
    if (!Object.keys(patch).length) return null;
    const lead = taste && cap([dish && T.dishCtx[dish], taste.lead].filter(Boolean).join(', '));
    return { patch, lead };
  };
  /** Відповідь на «люблю X»; X немає в наявності — кажемо це і показуємо схоже */
  function likeAnswer(l) {
    const r = update(l.patch, { lead: l.lead });
    if (l.id && W[l.id].available === false && !r.noMatch) r.text = `${W[l.id].short} зараз немає в наявності. Найближче за смаком:`;
    return r;
  }

  function route(t, last) {
    if (last && last.wine && S) {
      const like = likeOf(t);
      if (like) return node(t, () => likeAnswer(like));
      if (/розе|рожев|rosé|rose/.test(t)) return node(t, () => ({
        text: 'Rosé зараз немає в наявності. Найближче за характером — Pinot Noir: теж легке й універсальне.',
        items: [{ id: 'winePinot', note: plain(W.winePinot.notes.any) }],
        chips: [addChip('winePinot'), node(T.other, other)],
      }));
      if (/дорог|дешевш|дешевле/.test(t)) return node(t, cheaper);
      // смак і умови — раніше за «інший»: «не терпке» містить «не те»
      if (/відрізн|різниц|порівня/.test(t)) return node(t, compare);
      const p = patchOf(t, true);
      if (p) return node(t, () => update(p.patch, { lead: p.lead }));
      if (/інш|ще варіант|не те|пробував/.test(t)) return node(t, other);
      if (/не вирішив|не знаю|ще не/.test(t)) return node(t, () => update({ dish: 'undecided' }));
    }
    if (/брав|купував|пили|замовляв|в чек/.test(t)) return null; // «яке вино я брав» — це історія покупок
    if (!/вин|шабл|chablis|каберне|мальбек|піно|просекко|совіньйон|рислінг|розе/.test(t)) return null;
    return node(t, () => {
      S = fresh();
      const like = likeOf(t), p = patchOf(t, false);
      if (like) return likeAnswer({ ...like, patch: { ...(p ? p.patch : {}), ...like.patch } });
      return update(p ? p.patch : {}, { lead: p && p.lead });
    });
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
