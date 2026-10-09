/* =====================================================================
   СЦЕНАРІЙ «Рецепти й інгредієнти» (гілка Chats; працює і в C). За правилами docs/mg-dialog-rules.md.
   • Рецепти справжні — з розділу silpo.ua/recipes (у партнерстві з shuba.life); кроки скорочені своїми
     словами, «Повний рецепт на silpo.ua» — посилання в шапці.
   • «Що приготувати на вечерю?» → одразу один рецепт: назва, час, порції, кроки (згорнуті)
     і інгредієнти чернеткою-списком — набір беруть цілком (правило «Форма результату»).
   • Припущення МГ — у рядку припущень з «×»: «на 3 порції, як у рецепті» (× → «На скільки порцій?»)
     і «олія, сіль і спеції є вдома» (× → додає їх у список). Порції перераховують кількості,
     а позначене «вже маю» лишається.
   • «Вже маю» — мінус на 1 шт: рядок сіріє («вже маю»), повертається «+»; кнопка рахує лише решту.
     Що вже лежить у кошику — одразу сіре «є в кошику»: не пропонуємо купити вдруге.
   • Чого немає в магазині — заміна з позначкою в рядку («замість свіжого») і одним реченням у пораді.
   • «Інший рецепт» — наступний, без уже показаних; рецепти скінчились — чесно і два шляхи.
   • «Додати в кошик» → «✓ Додано · Скасувати» і один крок. Вхід із кошика (жовтий чіп
     «Що з цього приготувати?») — рецепт із того, що вже в кошику, чат поверх кошика.
   Демо: інгредієнти (DEMO нижче, намальовані — tools/make-demo-recipe.py); ціни умовні.
   Тексти — T, рецепти — R.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Демо-інгредієнти ---------- */
  const DEMO = {
    spaghetti:   { name: 'Спагеті з твердих сортів пшениці, 500 г', short: 'спагеті', price: 64, weight: '500 г' },
    spaghettiGf: { name: 'Спагеті без глютену, 400 г', short: 'спагеті без глютену', price: 98, weight: '400 г' },
    tomatoesCan: { name: 'Томати у власному соку, 400 г', short: 'томати у власному соку', price: 58, weight: '400 г' },
    anchovies:   { name: 'Анчоуси в олії, 50 г', short: 'анчоуси', price: 119, weight: '50 г' },
    garlic:      { name: 'Часник, 100 г', short: 'часник', price: 29, weight: '100 г' },
    olives:      { name: 'Маслини чорні без кісточок, 300 г', short: 'маслини', price: 79, weight: '300 г' },
    capers:      { name: 'Каперси мариновані, 100 г', short: 'каперси', price: 89, weight: '100 г' },
    parsley:     { name: 'Петрушка, пучок 30 г', short: 'петрушка', price: 22, weight: '30 г' },
    oregano:     { name: 'Орегано сушене, 10 г', short: 'орегано', price: 35, weight: '10 г' },
    salt:        { name: 'Сіль кухонна, 1 кг', short: 'сіль', price: 18, weight: '1 кг' },
    saladLeaves: { name: 'Салат листовий, 100 г', short: 'листя салату', price: 45, weight: '100 г' },
    rucola:      { name: 'Рукола, 100 г', short: 'рукола', price: 55, weight: '100 г' },
    walnuts:     { name: 'Волоські горіхи очищені, 100 г', short: 'волоські горіхи', price: 69, weight: '100 г' },
    blueCheese:  { name: 'Сир з блакитною пліснявою, 100 г', short: 'сир з блакитною пліснявою', price: 129, weight: '100 г' },
    vinegar:     { name: 'Оцет яблучний 6%, 500 мл', short: 'оцет', price: 32, weight: '500 мл' },
    sugar:       { name: 'Цукор білий, 1 кг', short: 'цукор', price: 39, weight: '1 кг' },
    mint:        { name: 'Мʼята, пучок 20 г', short: 'мʼята', price: 25, weight: '20 г' },
  };
  Object.entries(DEMO).forEach(([id, d]) => {
    DATA.products[id] = { name: d.name, shortName: d.name.replace(/, [^,]+$/, ''), price: d.price, weight: d.weight,
                          image: `assets/images/products/demo/recipe-${id}.svg` };
    DATA.pdp.products[id] = {};
  });

  /* ---------- Рецепти — справжні, з розділу silpo.ua/recipes (кроки скорочені своїми словами) ----------
     portions — варіанти порцій, перший — як у рецепті (припущення МГ); q — кількість упаковок під кожен;
     hint — позначка в рядку (заміна того, чого немає); pantry — що зазвичай є вдома (припущення, «×» додає);
     missing / note — одне речення поради. */
  const R = {
    pasta: {
      title: 'Паста путанеска', time: 20, dinner: true, url: 'https://silpo.ua/recipes/pasta-putaneska',
      portions: [3, 6],
      steps: [
        'Відвари спагеті в підсоленій воді до al dente — на 2 хв менше, ніж на упаковці.',
        'Подрібни часник, анчоуси й чилі, обсмаж на олії 2–3 хв, поки анчоуси не розійдуться.',
        'Додай каперси й маслини на 1 хв, потім томати й орегано — туши 10–15 хв.',
        'Перемішай спагеті із соусом, прогрій 1 хв і посип петрушкою.',
      ],
      rows: [
        { id: 'spaghetti', q: [1, 1] }, { id: 'tomatoesCan', q: [1, 2] }, { id: 'anchovies', q: [1, 1] }, { id: 'garlic', q: [1, 1] },
        { id: 'olives', q: [1, 1] }, { id: 'capers', q: [1, 1] }, { id: 'parsley', q: [1, 1] },
      ],
      pantry: ['oliveOil', 'salt', 'oregano'], pantryLabel: 'олія, сіль і спеції є вдома',
    },
    salad: {
      title: 'Салат з грушею, горіхами та блакитним сиром', time: 20, dinner: true, url: 'https://silpo.ua/recipes/salat-z-grusheyu-gorixamy-ta-blakytnym-syrom',
      portions: [6, 3],
      steps: [
        'Струсни в банці олію, оцет, цукор, сіль і перець — це заправка.',
        'Помий листя салату й руколу, груші наріж тонкими скибками.',
        'Порви листя в салатницю, додай руколу, груші, горіхи й шматочки сиру.',
        'Полий заправкою й перемішай.',
      ],
      rows: [
        { id: 'pears', q: [2, 1] }, { id: 'saladLeaves', q: [1, 1] }, { id: 'rucola', q: [1, 1] }, { id: 'walnuts', q: [1, 1] }, { id: 'blueCheese', q: [1, 1] },
      ],
      pantry: ['oliveOil', 'vinegar', 'sugar', 'salt'], pantryLabel: 'олія, оцет, цукор і спеції є вдома',
    },
    sorbet: {
      title: 'Виноградний сорбет', time: 10, dessert: true, url: 'https://silpo.ua/recipes/vynogradnyj-sorbet',
      portions: [2, 4],
      steps: [
        'Виноград заздалегідь заморозь; перед готуванням дай йому постояти 3–5 хв.',
        'Збий у блендері виноград з мʼятою, 2 ст. л. соку й цукром до густої маси.',
        'Розклади по мисках, прикрась мʼятою й кількома виноградинами.',
      ],
      rows: [
        { id: 'grapes', q: [3, 6] }, { id: 'mint', q: [1, 1] }, { id: 'lime', q: [1, 1], hint: 'замість лимона' },
      ],
      pantry: ['sugar'], pantryLabel: 'цукор є вдома',
      missing: 'Лимона зараз немає — поклав лайм, сік дасть ту саму кислинку.',
      note: 'Виноград треба заморозити заздалегідь.',
    },
  };
  const DINNER = ['pasta', 'salad'];

  /* ---------- Заміна інгредієнта: як вона змінить страву ----------
     alt — чим замінити і що станеться зі стравою (підпис на картці). Пропонуємо лише те, що пасує саме
     до цієї страви. without — доброї заміни немає: чесно, і що зробити без нього (опційно — більше іншого). */
  const SWAP = {
    pasta: {
      spaghetti:   { alt: [{ id: 'spaghettiGf', note: 'Без глютену — варити на 2 хв менше' }] },
      tomatoesCan: { alt: [{ id: 'tomatoes', note: 'Свіжі помідори — соус легший, тушкувати довше' }] },
      anchovies:   { gen: 'анчоусів', without: 'Без анчоусів теж можна — соус буде менш солоний. Покладу більше каперсів.', more: 'capers' },
      olives:      { gen: 'маслин', without: 'Маслини можна не класти — соус буде простіший, але теж смачний.' },
      capers:      { gen: 'каперсів', without: 'Без каперсів соус менш пікантний — можна покласти більше маслин.', more: 'olives' },
      parsley:     { gen: 'петрушки', without: 'Петрушка — лише для подачі, можна й без неї.' },
      garlic:      { gen: 'часнику', without: 'Без часнику соус втратить аромат — краще лишити.' },
    },
    salad: {
      blueCheese:  { alt: [{ id: 'cheese', note: 'Гауда — мʼякший смак, без пікантності' }] },
      walnuts:     { alt: [{ id: 'pistachios', note: 'Фісташки солоні — у заправку менше солі' }] },
      pears:       { alt: [{ id: 'appleGolden', note: 'Яблуко — кисліше й хрусткіше за грушу' }] },
      rucola:      { gen: 'руколи', without: 'Руколу можна замінити листям салату — покладу більше, смак буде мʼякшим.', more: 'saladLeaves' },
      saladLeaves: { gen: 'листя салату', without: 'Без листя салату — тоді більше руколи, буде гостріше.', more: 'rucola' },
    },
    sorbet: {
      grapes:      { alt: [{ id: 'grapesRed', note: 'РедГлоб — менш солодкий, сорбет свіжіший' }] },
      mint:        { gen: 'мʼяти', without: 'Мʼята — для свіжості, без неї теж смачно.' },
      lime:        { gen: 'лайма', without: 'Без кислого соку сорбет вийде приторним — лайм краще лишити.' },
    },
  };

  const T = {
    opener: 'Що приготувати на вечерю?',
    other: 'Інший рецепт',
    sweet: 'Щось солодке',
    portionsAsk: 'На скільки порцій?',
    have: 'Що вже є вдома — прибери зі списку або просто напиши.',
    checkout: 'Оформити замовлення',
  };

  const P = id => DATA.products[id];
  const money = v => UI.money(v).replace('.00', '');
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const nameOf = id => (DEMO[id] ? DEMO[id].short : lc(P(id).shortName || P(id).name));
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];
  const STEPS = ['крок', 'кроки', 'кроків'];
  const PORT = ['порція', 'порції', 'порцій'];
  const cap = s => s.charAt(0).toLocaleUpperCase('uk-UA') + s.slice(1);
  const list = ids => ids.map(nameOf).reduce((s, n, i, a) => s + (i === 0 ? n : i === a.length - 1 ? ` і ${n}` : `, ${n}`), '');

  /* ---------- Стан ---------- */
  let S = null;
  const fresh = () => ({
    recipe: null,          // ключ R
    rows: [],              // рядки чернетки: { id, qty, off, offNote, hint, mark } — спільні з чатом
    portions: null, portionsSource: 'assumption',
    pantryHome: true,      // припущення: олія й сіль є вдома
    shown: [],             // уже показані рецепти
    where: 'chat',         // chat | cart (вхід із кошика, чат поверх)
    inCart: false,
    swaps: {},             // заміни гостя в цьому рецепті: інгредієнт → чим замінив (порції не гублять)
    extra: {},             // «покладу більше X» замість прибраного інгредієнта
  });
  const taken = () => S.rows.filter(r => !r.off);
  const total = () => taken().reduce((s, r) => s + P(r.id).price * r.qty, 0);
  const node = (label, run) => ({ label, scenario: 'recipe', recipe: true, run });
  const pIdx = () => Math.max(0, R[S.recipe].portions.indexOf(S.portions));

  /** Рядки рецепта під порції; що вже в кошику — одразу «є в кошику» */
  function buildRows(key) {
    const r = R[key];
    // порції: як у рецепті, доки гість не сказав своє; сказав — беремо найближчий варіант рецепта
    if (S.portionsSource === 'assumption' || !r.portions.includes(S.portions)) {
      S.portions = S.portionsSource === 'guest' ? [...r.portions].sort((a, b) => Math.abs(a - S.portions) - Math.abs(b - S.portions))[0] : r.portions[0];
    }
    S.swaps = {}; S.extra = {}; // новий рецепт — нові заміни
    S.rows = r.rows.map(x => ({ id: x.id, qty: x.q[pIdx()], hint: x.hint || null,
      ...(Cart.items.has(x.id) ? { off: true, offNote: 'є в кошику' } : {}) }));
    if (!S.pantryHome) r.pantry.forEach(id => S.rows.push({ id, qty: 1, mark: 'new' }));
  }

  function ctx() {
    const c = [];
    if (S.portionsSource === 'assumption') c.push({ type: 'portions', label: `на ${count(S.portions, PORT)}, як у рецепті`, source: 'assumption' });
    if (S.pantryHome && R[S.recipe].pantry.length) c.push({ type: 'pantry', label: R[S.recipe].pantryLabel, source: 'assumption' });
    return c;
  }

  function draft() {
    const r = R[S.recipe];
    return {
      title: r.title,
      recipe: { meta: `${r.time} хв · ${count(S.portions, PORT)}`, steps: r.steps, stepsLabel: `Як готувати · ${count(r.steps.length, STEPS)}`,
                url: r.url, urlLabel: 'Повний рецепт на silpo.ua' },
      rows: S.rows, offLabel: 'вже маю', rowAction: 'Замінити',
      addLabel: 'Додати в кошик', inCart: S.inCart,
    };
  }

  const backNode = () => ({ label: 'Повернутись у кошик', scenario: 'recipe', recipe: true, back: true, run: () => null });
  const inCartRows = () => S.rows.filter(r => r.offNote === 'є в кошику');

  /** Відповідь з рецептом. lead — перше речення */
  function show(key, lead) {
    S.recipe = key;
    if (!S.shown.includes(key)) S.shown.push(key);
    buildRows(key);
    const r = R[key], have = inCartRows();
    // усе вже в кошику — купувати нічого: рецепт без кнопки «Додати»
    if (!taken().length) return {
      text: `У кошику вже є все для страви «${r.title}». Ось рецепт:`,
      list: { ...draft(), addLabel: null }, context: ctx().filter(c => c.type !== 'portions'),
      chips: S.where === 'cart' ? [backNode()] : nextChips(),
    };
    // що вже в кошику — кажемо одним реченням (якщо не сказали у вступі)
    const advice = [r.missing, r.note, have.length && !lead ? `${cap(list(have.map(x => x.id)))} вже є в кошику — не рахую.` : '', T.have]
      .filter(Boolean).slice(0, 2).join(' ');
    return {
      text: lead || `${r.title} — ${r.time} хвилин. Ось що купити:`,
      list: draft(), context: ctx(), after: advice,
      chips: S.where === 'cart' ? [backNode()] : nextChips(),
    };
  }
  /** Чіпси під рецептом: інший рецепт, якщо ще є; інакше — солодке */
  function nextChips() {
    const left = (R[S.recipe].dessert ? [] : DINNER).filter(k => !S.shown.includes(k));
    return [left.length ? node(T.other, other) : null, !R[S.recipe].dessert && !S.shown.includes('sorbet') ? node(T.sweet, sweet) : null].filter(Boolean);
  }

  /* ---------- Відповіді ---------- */
  function start() {
    S = fresh();
    return show('pasta');
  }

  function other() {
    const next = DINNER.find(k => !S.shown.includes(k));
    if (!next) {
      return {
        text: 'Чесно: інших рецептів на вечерю поки немає. Можу повернути пасту або запропонувати щось солодке.',
        chips: [node('Повернути пасту', () => show('pasta', 'Повертаю пасту — список той самий:')), node(T.sweet, sweet)],
      };
    }
    return show(next, `Тоді ${lc(R[next].title)} — ${R[next].time} хвилин:`);
  }
  function sweet() { return show('sorbet', `На солодке — ${lc(R.sorbet.title)}, ${R.sorbet.time} хвилин:`); }

  /** Порції: кількості перераховуємо, «вже маю» і позначки лишаються */
  function setPortions(n) {
    if (!R[S.recipe].portions.includes(n)) return { text: `Цей рецепт — на ${R[S.recipe].portions.join(' або ')} порції. ${T.portionsAsk}`, chips: portionChips() };
    S.portions = n; S.portionsSource = 'guest';
    const r = R[S.recipe];
    S.rows.forEach(row => { const x = r.rows.find(y => y.id === row.id || S.swaps[y.id] === row.id); if (x) row.qty = x.q[pIdx()] + (S.extra[row.id] || 0); });
    return {
      text: `Перерахував на ${count(n, PORT)}. Решта без змін — тепер ${money(total())}:`,
      list: draft(), context: ctx(),
      chips: S.where === 'cart' ? [backNode()] : nextChips(),
    };
  }
  const portionChips = () => [...R[S.recipe].portions].sort((a, b) => a - b).map(n => node(`На ${n}`, () => setPortions(n)));

  /** «×» на «олія й сіль є вдома» — додаємо їх у список */
  function addPantry() {
    S.pantryHome = false;
    const add = R[S.recipe].pantry.filter(id => !S.rows.some(r => r.id === id));
    add.forEach(id => S.rows.push({ id, qty: 1, mark: 'new', ...(Cart.items.has(id) ? { off: true, offNote: 'є в кошику' } : {}) }));
    return {
      text: `Додав ${list(add)}. Тепер ${money(total())}:`,
      list: draft(), context: ctx(),
      chips: S.where === 'cart' ? [backNode()] : nextChips(),
    };
  }

  /** Який інгредієнт рецепта стоїть у рядку (з урахуванням замін) */
  const orig = id => Object.keys(S.swaps).find(k => S.swaps[k] === id) || id;
  /** Без інгредієнта: рядок «не беру»; more — чого покласти більше замість нього */
  function without(id, more, gen) {
    const r = S.rows.find(x => x.id === id);
    if (r) { r.off = true; r.offNote = 'не кладу'; }
    const m = more && S.rows.find(x => x.id === more && !x.off);
    if (m) { m.qty += 1; m.mark = 'new'; S.extra[more] = (S.extra[more] || 0) + 1; } // порції не гублять «більше»
    return {
      text: `Гаразд, без ${gen}${m ? `, а ${nameOf(more)} — на одну більше` : ''}. Тепер ${money(total())}:`,
      list: draft(), context: ctx(),
    };
  }

  /** «Вже маю X» словами — те саме, що прибрати рядок (кошик у рядку) */
  function haveRows(ids) {
    ids.forEach(id => { const r = S.rows.find(x => x.id === id); if (r) { r.off = true; r.offNote = null; } });
    return {
      text: `Гаразд, ${list(ids)} не купуємо. Тепер ${count(taken().length, GOODS)} на ${money(total())}:`,
      list: draft(), context: ctx(),
      chips: S.where === 'cart' ? [backNode()] : nextChips(),
    };
  }

  /** «Додати в кошик» — лише те, що беремо */
  function addAll(rows) {
    const add = rows.filter(r => !r.off).map(r => ({ id: r.id, qty: r.qty }));
    if (!add.length) return null;
    add.forEach(r => Cart.add(r.id, r.qty));
    S.inCart = true;
    const where = S.where;
    return {
      confirm: {
        text: `Додано в кошик: ${count(add.length, GOODS)} для «${R[S.recipe].title}»`,
        undo: () => {
          add.forEach(r => Cart.add(r.id, -r.qty));
          S.inCart = false;
          return { text: 'Скасував: прибрав інгредієнти з кошика.', list: draft(), chips: where === 'cart' ? [backNode()] : nextChips() };
        },
      },
      ...(() => {
        // один суміжний крок (Scenarios.nextStep): мінімальне замовлення, доставка або свій — «Щось солодке»
        const own = !R[S.recipe].dessert && !S.shown.includes('sorbet') ? node(T.sweet, sweet) : null;
        const f = Scenarios.nextStep({ scenario: 'recipe', own, back: where === 'cart' ? backNode() : null });
        return { text: `У кошику на ${money(Cart.total())}${f.note}. Смачного!`, chips: [where === 'cart' ? backNode() : null, f.chip].filter(Boolean) };
      })(),
    };
  }

  /* ---------- Вхід із кошика: що приготувати з того, що вже є ---------- */
  function cartEntry() {
    return node('Що з цього приготувати?', () => {
      S = fresh(); S.where = 'cart';
      // рецепт, у якому найбільше з кошика
      const best = Object.keys(R).map(k => [k, R[k].rows.filter(x => Cart.items.has(x.id)).length])
        .sort((a, b) => b[1] - a[1])[0];
      if (!best || !best[1]) {
        return { text: 'Чесно: з того, що в кошику, рецепта поки немає. Можу запропонувати страву на вечерю.', chips: [node('Так, давай', () => { S.where = 'cart'; return show('pasta'); }), backNode()] };
      }
      const key = best[0];
      const have = R[key].rows.filter(x => Cart.items.has(x.id)).map(x => x.id);
      S.recipe = key;
      return show(key, `З того, що в кошику, — ${lc(R[key].title)}: ${list(have)} вже є. Докупити:`);
    });
  }

  /* ---------- Своїми словами ---------- */
  const WORDS = {
    spaghetti: ['спагет', 'макарон'], tomatoesCan: ['томат', 'помідор'], anchovies: ['анчоус'], garlic: ['часник'],
    olives: ['маслин', 'оливк'], capers: ['каперс'], parsley: ['петрушк'], oregano: ['орегано', 'спеці'],
    pears: ['груш'], saladLeaves: ['листя', 'салат'], rucola: ['рукол'], walnuts: ['горіх'], blueCheese: ['сир'],
    vinegar: ['оцет', 'оцту'], sugar: ['цукор', 'цукру'], grapes: ['виноград'], mint: ['мʼят', "м'ят", 'мят'], lime: ['лайм'],
    oliveOil: ['олі'], salt: ['сіль', 'солі'],
  };
  const named = t => S.rows.filter(r => (WORDS[r.id] || []).some(w => t.includes(w))).map(r => r.id);

  function route(t, last) {
    if (S && last && last.recipe) {
      const n = t.match(/(?:на|для)\s+(\d+)/);
      if (n && (/порці|люд|осіб|чолов|гост/.test(t) || /^на \d+$/.test(t))) {
        const v = Number(n[1]);
        return node(t, () => setPortions(v));
      }
      if (/(^|\s)є(\s|$)|вже|маю|вдома|не треба|не купу/.test(t) && named(t).length) { const ids = named(t); return node(t, () => haveRows(ids)); }
      if (/солодк|десерт/.test(t)) return node(t, sweet);
      if (/інш|ще рецепт|не хочу|не то/.test(t)) return node(t, other);
      if (/додай|в кошик|беру/.test(t)) return node(t, () => addAll(S.rows) || { text: 'Усе позначено «вже маю» — купувати нічого.' });
    }
    if (/що приготувати|рецепт|що зготувати|приготувати на вечер|щось поїсти|що поїсти|хочу їсти/.test(t)) return node(t, start);
    return null;
  }

  /** «×» у рядку припущень */
  function removeCondition(type) {
    if (!S) return null;
    if (type === 'portions') return node(`Змінити «на ${count(S.portions, PORT)}»`, () => ({ text: T.portionsAsk, chips: portionChips() }));
    if (type === 'pantry') return node(`Ні, ${R[S.recipe].pantryLabel.replace(' є вдома', '')} треба купити`, addPantry);
    return null;
  }

  /** Кнопка «Додати в кошик» у чернетці */
  function listAdd(rows) {
    if (!S || S.inCart) return null;
    const n = rows.filter(r => !r.off).length;
    return node(n === rows.length ? 'Додай усе в кошик' : `Додай ${count(n, GOODS)} в кошик`, () => addAll(rows));
  }

  Scenarios.define({
    id: 'recipe',
    opener: node(T.opener, start),
    route,
    removeCondition,
    listAdd,
    cartRecipe: cartEntry,
    // заміна інгредієнта — спільна (Scenarios.swapOffer), але варіанти й підписи — під страву
    rowAction: id => (S && !S.inCart ? Scenarios.swapOffer({
      scenario: 'recipe', rows: S.rows, id, list: draft,
      alts: x => ((SWAP[S.recipe] || {})[orig(x)] || {}).alt || [],
      none: (x, step) => {
        const w = (SWAP[S.recipe] || {})[orig(x)];
        if (!w || !w.without) return null;
        return { text: w.without, chips: [step(`Без ${w.gen}`, () => without(x, w.more, w.gen))] };
      },
      onSwap: (from, to) => { const o = orig(from); if (to) S.swaps[o] = to; else delete S.swaps[o]; },
    }) : null),
    cardAction: id => Scenarios.swapCard(id),
    // жовтий чіп «Що з цього приготувати?» — лише коли в кошику є інгредієнт якогось рецепта
    cartMatch: () => Object.values(R).some(r => r.rows.some(x => Cart.items.has(x.id))),
  });
})();
