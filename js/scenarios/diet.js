/* =====================================================================
   СЦЕНАРІЙ «Раціон і КБЖУ» (гілка Chats; працює і в C). За правилами docs/mg-dialog-rules.md.
   Ситуації (cases — підпункти в списку сценаріїв), від найчастішої:
   • «Який перекус з найбільшим білком?» — карусель за білком на 100 г, на картці ще «₴ за 10 г білка».
   • «Де найдешевший білок?» — ті самі товари за ціною 10 г білка (з ціни й харчової цінності).
   • «Легкий перекус до 150 ккал» — найлегші на 100 г.
   • «Чим замінити майонез, щоб легше?» — варіанти з різницею в ккал.
   • «Допоможи з раціоном на тиждень» — набір на тиждень (нижче), рідша ситуація.
   • Мета невідома («Допоможи з раціоном на тиждень») → ОДНЕ ключове питання: Більше білка /
     Менше калорій / Є обмеження за здоровʼям (правило «Корисний результат за наміром»: мета — до плану).
   • Мета відома → одразу чернетка на тиждень. У рядку — цифра з харчової цінності товару
     («23 г білка на 100 г»), у вступі — підсумок, порахований з даних (білок за тиждень і на день,
     середня калорійність). Жодних «норм» і порад — лише цифри.
   • Здоровʼя, вагітність, діагноз → чесно: план — з лікарем; МГ може прибрати продукти за складом
     (без лактози / глютену) — критичне обмеження, рядок сірий з причиною, без «+».
   • Припущення «на 1 людину» (× → На 1 / На 2). Заміна рядка — з різницею в білку чи калоріях.
   • «Додати набір» → «✓ Додано · Скасувати» і спільний наступний крок.
   Дані: харчова цінність на 100 г (NUTRITION, демо) і вага упаковки в грамах (GRAMS).
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Нові товари ---------- */
  const NEW = {
    chicken:     { name: 'Філе куряче охолоджене, 1 кг', short: 'куряче філе', price: 239, weight: '1 кг', comp: 'Філе курчати-бройлера охолоджене.', allergens: 'не містить' },
    tuna:        { name: 'Тунець у власному соку, 150 г', short: 'тунець', price: 89, weight: '150 г', comp: 'Тунець, вода, сіль.', allergens: 'риба' },
    lentils:     { name: 'Сочевиця червона, 500 г', short: 'сочевиця', price: 62, weight: '500 г', comp: 'Сочевиця червона.', allergens: 'може містити сліди глютену' },
    yogurtGreek: { name: 'Йогурт грецький 2%, 300 г', short: 'грецький йогурт', price: 58, weight: '300 г', comp: 'Молоко нормалізоване, закваска.', allergens: 'молоко (лактоза)' },
  };
  /* Харчова цінність на 100 г (демо) — для нових і для товарів з інших сценаріїв, де її ще немає */
  const NUTRITION = {
    chicken:     { kcal: '113', protein: '23.6 г', fat: '1.9 г', carbs: '0 г' },
    tuna:        { kcal: '116', protein: '25.5 г', fat: '0.8 г', carbs: '0 г' },
    lentils:     { kcal: '352', protein: '24 г', fat: '1.1 г', carbs: '60 г' },
    yogurtGreek: { kcal: '73', protein: '10 г', fat: '2 г', carbs: '3.6 г' },
    eggs:        { kcal: '155', protein: '12.6 г', fat: '10.6 г', carbs: '1.1 г' },
    cottage:     { kcal: '121', protein: '17 г', fat: '5 г', carbs: '1.8 г' },
    cheese:      { kcal: '356', protein: '25 г', fat: '27 г', carbs: '2.2 г' },
    milk:        { kcal: '52', protein: '2.8 г', fat: '2.5 г', carbs: '4.7 г' },
  };
  Object.entries(NEW).forEach(([id, d]) => {
    DATA.products[id] = { name: d.name, shortName: d.name.replace(/, [^,]+$/, ''), price: d.price, weight: d.weight,
                          image: `assets/images/products/demo/list-${id}.svg` };
    DATA.pdp.products[id] = { composition: { text: d.comp, allergens: { label: 'Алергени:', value: d.allergens } } };
  });
  Object.entries(NUTRITION).forEach(([id, n]) => {
    if (!DATA.products[id]) return;
    DATA.pdp.products[id] = DATA.pdp.products[id] || {};
    if (!DATA.pdp.products[id].nutrition) DATA.pdp.products[id].nutrition = n;
  });
  // склад для критичних фільтрів (товари з інших сценаріїв)
  const CONTAINS = { eggs: [], cottage: ['lactose'], cheese: ['lactose'], milk: ['lactose'], yogurtGreek: ['lactose'], lentils: ['gluten*'], tuna: [] };
  // вага упаковки, г (10 яєць ≈ 600 г)
  const GRAMS = { chicken: 1000, tuna: 150, pistachios: 250, lentils: 500, yogurtGreek: 300, eggs: 600, cottage: 350, cheese: 200, milk: 900,
                  appleGolden: 1000, pears: 1000, peach: 1000, watermelon: 2000, grapes: 500 };

  /* ---------- Набори на тиждень на 1 людину ---------- */
  const SETS = {
    protein: {
      title: 'Чернетка: більше білка на тиждень', metric: 'protein',
      rows: [{ id: 'chicken', q: 1 }, { id: 'eggs', q: 1 }, { id: 'cottage', q: 2 }, { id: 'yogurtGreek', q: 2 }, { id: 'tuna', q: 2 }, { id: 'lentils', q: 1 }],
    },
    light: {
      title: 'Чернетка: легше на тиждень', metric: 'kcal',
      rows: [{ id: 'yogurtGreek', q: 3 }, { id: 'appleGolden', q: 1 }, { id: 'pears', q: 1 }, { id: 'peach', q: 1 }, { id: 'watermelon', q: 1 }, { id: 'tuna', q: 2 }],
    },
  };
  const SWAP = {
    cottage:     [{ id: 'yogurtGreek', note: 'Менше калорій, але й білка менше' }],
    yogurtGreek: [{ id: 'cottage', note: 'Більше білка, трохи калорійніше' }],
    tuna:        [{ id: 'chicken', note: 'Схоже за білком, але сире — треба готувати' }],
    eggs:        [{ id: 'cottage', note: 'Схоже за білком, без готування' }],
    appleGolden: [{ id: 'applesGreen', note: 'Зелені — трохи менше цукру' }],
    pears:       [{ id: 'peach', note: 'Персик — менше калорій' }, { id: 'applesGreen', note: 'Зелені яблука — хрусткі, менше цукру' }],
  };

  /* ---------- Вибір за цифрою ---------- */
  // перекуси без готування; для «найдешевшого білка» — і те, що треба готувати (з позначкою)
  const SNACKS = ['tuna', 'pistachios', 'cheese', 'cottage', 'yogurtGreek', 'eggs'];
  const COOK = { chicken: 'треба готувати', lentils: 'треба варити', eggs: 'треба варити' };
  const LIGHT = ['watermelon', 'melon', 'peach', 'appleGolden', 'pears', 'grapes', 'yogurtGreek', 'banana'];
  const IN = { hellmanns: 'Hellmann’s', mayoHome: '«Домашньому»', cheese: 'твердому сирі', cottage: 'кисломолочному сирі' }; // «замість 667 у …»
  const LIGHTER = { hellmanns: ['mayoLight', 'mayoVegan', 'mayoHome'], mayoHome: ['mayoLight', 'mayoVegan'], cheese: ['cottage'], cottage: ['yogurtGreek'] };
  const has = id => P(id) && num(N(id).protein) > 0;
  const per10 = id => P(id).price / (num(N(id).protein) * (GRAMS[id] || 100) / 100) * 10; // ₴ за 10 г білка
  const uah = v => `${v.toFixed(1).replace('.', ',')} ₴`;
  const g = v => `${String(num(v)).replace('.', ',')} г`;

  /** «Який перекус з найбільшим білком?» — вибір одного з кількох → карусель, «+» на картці */
  function proteinPick() {
    const list = SNACKS.filter(has).sort((a, b) => num(N(b).protein) - num(N(a).protein)).slice(0, 5);
    const top = list[0];
    return {
      text: `Найбільше білка — ${nameOf(top)}: ${g(N(top).protein)} на 100 г. Ось пʼять перекусів без готування, від більшого:`,
      items: list.map((id, i) => ({ id, note: `${g(N(id).protein)} білка на 100 г · ${uah(per10(id))} за 10 г`, pick: i === 0 })),
      chips: [node('А де найдешевший білок?', cheapProtein)],
    };
  }
  /** «Де найдешевший білок?» — ціна 10 г білка, з готуванням чесно позначено */
  function cheapProtein() {
    const list = [...SNACKS, 'chicken', 'lentils'].filter((id, i, a) => has(id) && a.indexOf(id) === i && GRAMS[id])
      .sort((a, b) => per10(a) - per10(b)).slice(0, 5);
    const top = list[0], ready = list.find(id => !COOK[id]);
    return {
      text: `Найдешевший білок — ${nameOf(top)}: ${uah(per10(top))} за 10 г${COOK[top] ? `, але ${COOK[top]}` : ''}.`
        + (ready && ready !== top ? ` З готового — ${nameOf(ready)}, ${uah(per10(ready))}.` : ''),
      items: list.map((id, i) => ({ id, note: `${uah(per10(id))} за 10 г білка${COOK[id] ? ` · ${COOK[id]}` : ''}`, pick: i === 0 })),
      // наступний крок — з цієї ж відповіді, а не інша ситуація зі списку
      chips: [node('Збери білкове на тиждень', () => { S = S || { goal: null, rows: [], people: 1, peopleSource: 'assumption', avoid: [], swaps: {}, inCart: false }; return plan('protein'); })],
    };
  }
  /** «Легкий перекус до N ккал» — на 100 г, найлегші першими */
  function light(limit) {
    const list = LIGHT.filter(id => P(id) && N(id).kcal && num(N(id).kcal) <= limit).sort((a, b) => num(N(a).kcal) - num(N(b).kcal)).slice(0, 5);
    if (!list.length) return { text: `До ${limit} ккал на 100 г зараз нічого не знайшов.` };
    return {
      text: `Найлегше — ${nameOf(list[0])}: ${N(list[0]).kcal} ккал на 100 г. Усі ці — до ${limit} ккал на 100 г:`,
      items: list.map((id, i) => ({ id, note: `${N(id).kcal} ккал на 100 г${num(N(id).protein) >= 5 ? ` · ${g(N(id).protein)} білка` : ''}`, pick: i === 0 })),
      chips: [node('Збери легке на тиждень', () => { S = S || { goal: null, rows: [], people: 1, peopleSource: 'assumption', avoid: [], swaps: {}, inCart: false }; return plan('light'); })],
    };
  }
  /** «Чим замінити X, щоб легше?» — варіанти з різницею в ккал */
  function lighter(id) {
    const base = num(N(id).kcal);
    const list = (LIGHTER[id] || []).filter(x => P(x) && N(x).kcal && base - num(N(x).kcal) >= 50) // різниця на 7 ккал — не «легше».sort((a, b) => num(N(a).kcal) - num(N(b).kcal));
    if (!base || !list.length) return { text: `Легшої заміни для ${nameOf(id)} у даних не знайшов.` };
    return {
      text: `Найлегше — ${nameOf(list[0])}: ${N(list[0]).kcal} ккал на 100 г замість ${base} у ${IN[id] || nameOf(id)}.`,
      items: list.map((x, i) => ({ id: x, note: `${N(x).kcal} ккал на 100 г — на ${Math.round(base - num(N(x).kcal))} менше`, pick: i === 0 })),
      chips: [node('Збери легке на тиждень', () => { S = S || { goal: null, rows: [], people: 1, peopleSource: 'assumption', avoid: [], swaps: {}, inCart: false }; return plan('light'); })],
    };
  }

  const T = {
    opener: 'Допоможи з раціоном на тиждень',
    ask: 'Яка мета? Від неї залежать цифри.',
    goals: { protein: 'Більше білка', light: 'Менше калорій', health: 'Є обмеження за здоровʼям' },
  };

  const P = id => DATA.products[id];
  const N = id => (DATA.pdp.products[id] || {}).nutrition || {};
  const num = v => parseFloat(String(v || '0').replace(',', '.')) || 0;
  const money = v => UI.money(v).replace('.00', '');
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const nameOf = id => (NEW[id] ? NEW[id].short : lc(P(id).shortName || P(id).name));
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];
  const fmt = v => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const node = (label, run) => ({ label, scenario: 'diet', diet: true, run });

  /* ---------- Стан ---------- */
  let S = null;
  const taken = () => S.rows.filter(r => !r.off);
  const total = () => taken().reduce((s, r) => s + P(r.id).price * r.qty, 0);
  /** Білок за тиждень, г — з харчової цінності × вага упаковки */
  const protein = rows => rows.reduce((s, r) => s + num(N(r.id).protein) * (GRAMS[r.id] || 0) / 100 * r.qty, 0);
  /** Середня калорійність набору, ккал на 100 г (зважена за вагою) */
  const avgKcal = rows => {
    const g = rows.reduce((s, r) => s + (GRAMS[r.id] || 0) * r.qty, 0);
    return g ? rows.reduce((s, r) => s + num(N(r.id).kcal) * (GRAMS[r.id] || 0) * r.qty, 0) / g : 0;
  };
  const hint = id => (S.goal === 'protein' ? `${num(N(id).protein).toString().replace('.', ',')} г білка на 100 г` : `${N(id).kcal} ккал на 100 г`);
  const blocked = id => S.avoid.find(a => (CONTAINS[id] || []).includes(a) || (CONTAINS[id] || []).includes(`${a}*`));
  const AVOID = { lactose: { chip: 'Без лактози', off: 'містить лактозу', trace: 'містить лактозу' }, gluten: { chip: 'Без глютену', off: 'містить глютен', trace: 'можуть бути сліди глютену' } };

  function build() {
    const set = SETS[S.goal];
    S.rows = set.rows.map(x => {
      const id = S.swaps[x.id] || x.id, a = blocked(id);
      const row = { id, qty: x.q * S.people, hint: hint(id), ...(S.swaps[x.id] ? { mark: 'new' } : {}) };
      if (a) Object.assign(row, { off: true, offNote: (CONTAINS[id] || []).includes(a) ? AVOID[a].off : AVOID[a].trace, lock: true });
      else if (Cart.items.has(id)) Object.assign(row, { off: true, offNote: 'є в кошику' });
      return row;
    });
  }
  const ctx = () => (S.peopleSource === 'assumption' ? [{ type: 'people', label: 'на 1 людину', source: 'assumption' }] : []);
  const draft = () => ({ title: SETS[S.goal].title, rows: S.rows, rowAction: 'Замінити', addLabel: 'Додати в кошик', inCart: S.inCart });
  /** Підсумок з даних: білок за тиждень і на день / середня калорійність */
  function summary() {
    const on = taken();
    if (S.goal === 'protein') {
      const p = protein(on), day = p / 7 / S.people;
      return `≈ ${fmt(p)} г білка за тиждень — близько ${fmt(day)} г на день${S.people > 1 ? ' на людину' : ''}`;
    }
    return `у середньому ${fmt(avgKcal(on))} ккал на 100 г`;
  }

  /* ---------- Відповіді ---------- */
  function start(goal) {
    S = { goal: null, rows: [], people: 1, peopleSource: 'assumption', avoid: [], swaps: {}, inCart: false };
    if (!goal) return { text: T.ask, chips: goalChips() }; // мета — до плану (правила)
    return plan(goal);
  }
  const goalChips = () => Object.entries(T.goals).map(([k, l]) => node(l, () => (k === 'health' ? health() : plan(k))));

  function plan(goal) {
    S.goal = goal; S.swaps = {};
    build();
    return {
      text: `Зібрав ${goal === 'protein' ? 'білкове' : 'легке'} на тиждень: ${count(taken().length, GOODS)} на ${money(total())}, ${summary()}. Цифри — з харчової цінності товарів.`,
      list: draft(), context: ctx(),
      chips: [node(goal === 'protein' ? T.goals.light : T.goals.protein, () => plan(goal === 'protein' ? 'light' : 'protein'))],
    };
  }

  /** Здоровʼя, вагітність, діагноз — без медичних порад; лише фільтр за складом */
  function health() {
    return {
      text: 'Тоді раціон краще погодити з лікарем чи дієтологом — медичних порад не даю. Можу зібрати продукти й прибрати те, чого треба уникати, за складом:',
      chips: Object.entries(AVOID).map(([k, a]) => node(a.chip, () => { S.avoid.push(k); return plan(S.goal || 'protein'); })),
    };
  }

  function setPeople(n) {
    S.people = n; S.peopleSource = 'guest';
    build();
    return { text: `Перерахував на ${count(n, ['людину', 'людей', 'людей'])}: ${summary()}. Тепер ${money(total())}:`, list: draft(), context: ctx() };
  }

  function addAll(rows) {
    const add = rows.filter(r => !r.off).map(r => ({ id: r.id, qty: r.qty }));
    if (!add.length) return null;
    add.forEach(r => Cart.add(r.id, r.qty));
    S.inCart = true;
    const f = Scenarios.nextStep({ scenario: 'diet' });
    return {
      confirm: {
        text: `Додано в кошик: ${count(add.length, GOODS)} на тиждень`,
        undo: () => { add.forEach(r => Cart.add(r.id, -r.qty)); S.inCart = false; return { text: 'Скасував: прибрав їх із кошика.', list: draft() }; },
      },
      text: `У кошику на ${money(Cart.total())}${f.note}.`,
      chips: [f.chip].filter(Boolean),
    };
  }

  /* ---------- Своїми словами ---------- */
  function route(t, last) {
    // вибір за цифрою — працює й без розмови про раціон
    if (/білк|білок|протеїн/.test(t) && /дешев|ціна|вигідн|₴/.test(t)) return node(t, () => { S = S || { goal: null, rows: [], people: 1, peopleSource: 'assumption', avoid: [], swaps: {}, inCart: false }; return cheapProtein(); });
    if (/білк|білок|протеїн/.test(t) && /перекус|найбільш|більше всього|багат/.test(t) && !/раціон|тиждень/.test(t)) return node(t, proteinPick);
    if (/легк|ккал|калор/.test(t) && /перекус/.test(t)) { const m = t.match(/(\d{2,3})\s*ккал/); return node(t, () => light(m ? Number(m[1]) : 150)); }
    if (/замін|замість/.test(t) && /легш|калор|ккал/.test(t)) {
      const id = /майонез/.test(t) ? 'hellmanns' : /твердий сир|гауд/.test(t) ? 'cheese' : /сир/.test(t) ? 'cottage' : null;
      if (id) return node(t, () => lighter(id));
    }
    if (S && last && last.diet && !S.inCart) {
      if (/вагітн|годую|діабет|тиск|нирк|печінк|гастрит|виразк|лікар|дієтолог|хвороб|діагноз/.test(t)) return node(t, health);
      if (/лактоз|молочн/.test(t) && /без|не можна|не їм|непереносим/.test(t)) return node(t, () => { S.avoid.push('lactose'); return plan(S.goal || 'protein'); });
      if (/глютен/.test(t)) return node(t, () => { S.avoid.push('gluten'); return plan(S.goal || 'protein'); });
      if (/білк|протеїн|мʼяз|м'яз|набра/.test(t)) return node(t, () => plan('protein'));
      if (/калор|схудн|легш|скинути|дефіцит/.test(t)) return node(t, () => plan('light'));
      const n = t.match(/(?:на|нас)\s+(\d+)|(\d+)\s*(люд|осіб)/);
      if (n && S.goal) { const v = Number(n[1] || n[2]); if (v >= 1 && v <= 6) return node(t, () => setPeople(v)); }
      if (/додай|в кошик/.test(t) && S.goal) return node(t, () => addAll(S.rows) || { text: 'У чернетці нічого не обрано.' });
    }
    if (/раціон|кбжу|білк|протеїн|калорі|схудн|харчуван/.test(t) && !/скільки калорій у|калорій у|калорій в /.test(t)) {
      return node(t, () => start(/білк|протеїн|набра/.test(t) ? 'protein' : /схудн|калорі|легш/.test(t) ? 'light' : null));
    }
    return null;
  }

  Scenarios.define({
    id: 'diet',
    opener: node('Який перекус з найбільшим білком?', proteinPick),
    cases: [
      { label: 'Найбільше білка в перекусі', ask: 'Який перекус з найбільшим білком?' },
      { label: 'Найдешевший білок', ask: 'Де найдешевший білок?' },
      { label: 'Легкий перекус до 150 ккал', ask: 'Що взяти на легкий перекус до 150 ккал?' },
      { label: 'Чим замінити майонез, щоб легше', ask: 'Чим замінити майонез, щоб було менше калорій?' },
      { label: 'Раціон на тиждень', ask: 'Допоможи з раціоном на тиждень' },
    ],
    route,
    removeCondition: type => (S && type === 'people' ? node('Змінити «на 1 людину»', () => ({ text: 'На скількох рахувати?', chips: [1, 2, 3].map(n => node(`На ${n}`, () => setPeople(n))) })) : null),
    rowAction: id => (S && !S.inCart ? Scenarios.swapOffer({
      scenario: 'diet', rows: S.rows, id, list: draft,
      alts: x => (SWAP[x] || []).map(a => ({ id: a.id, note: `${a.note} · ${hint(a.id)}` })),
      allow: x => !blocked(x),
      onSwap: (from, to) => {
        const o = Object.keys(S.swaps).find(k => S.swaps[k] === from) || from;
        if (to) S.swaps[o] = to; else delete S.swaps[o];
        const r = to && S.rows.find(x => x.id === to); if (r) r.hint = hint(to); // цифра нового товару
      },
    }) : null),
    cardAction: id => Scenarios.swapCard(id),
    listAdd: rows => (S && !S.inCart ? node(taken().length === rows.length ? 'Додай усе в кошик' : `Додай ${count(taken().length, GOODS)} в кошик`, () => addAll(rows)) : null),
  });
})();
