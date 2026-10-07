/* =====================================================================
   СЦЕНАРІЙ «Передбач моє замовлення» (id 'predict'; гілка Chats, працює і в C). Обʼєднаний 2026-10-07
   із «Заміною товару в кошику»: старт — з «Передбач», заміна — глибока, із «Заміни». За правилами
   docs/mg-dialog-rules.md.
   • «Збери, як зазвичай» → одразу чернетка з історії замовлень (HISTORY): лише те, що «пора»
     (з останньої покупки минуло стільки, скільки гість зазвичай чекає), у рядку — джерело
     («щотижня», «раз на 2 тижні»), кількість — звичайна. Що ще рано — одним реченням.
   • Припущення «на тиждень, як зазвичай» (× → На тиждень / На 2 тижні): перерахунок не губить
     «не беру», заміни й додане. «Що ще я брав?» — карусель рідших покупок з «Додати» в чернетку.
   • Заміна рядка (іконка або «заміни майонез») → 2–3 варіанти з підписом, чим відрізняються, і одне
     питання «Чому міняємо X?» з причинами-чіпсами: Дорогий / Хочу легший / Без яєць / Інша марка.
     «Без яєць» — критичне обмеження до кінця розмови. «Дорого» → далі «Де ще зекономити?».
   • Заміна в справжньому кошику: іконка в рядку кошика й жовті чіпси над ним (js/scenarios/engine.js)
     → чат поверх кошика, «✓ Замінено в кошику · Скасувати» → «Повернутись у кошик».
   • «Додати в кошик» → «✓ Додано · Скасувати» і спільний наступний крок (Scenarios.nextStep).
   Демо-майонези — tools/make-demo-mayo.py. Частина товарів історії — зі сценарію «Список із фото».
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Демо-майонези (лише гілка Chats) ---------- */
  const DEMO = {
    mayoHome:  { name: 'Майонез «Домашній» 72%, 300 г', short: 'майонез «Домашній»', price: 89, img: 'home',
                 comp: 'Олія соняшникова, вода, яєчний жовток, гірчиця, цукор, сіль, оцет.', allergens: 'яйця, гірчиця' },
    mayoLight: { name: 'Майонез легкий 30%, 250 г', short: 'легкий майонез', price: 99, img: 'light',
                 comp: 'Вода, олія соняшникова, крохмаль, яєчний жовток, гірчиця, сіль, оцет.', allergens: 'яйця, гірчиця' },
    mayoVegan: { name: 'Майонез без яєць, пісний, 250 г', short: 'майонез без яєць', price: 129, img: 'vegan',
                 comp: 'Олія соняшникова, вода, білок гороху, гірчиця, сіль, лимонний сік.', allergens: 'гірчиця' },
  };
  Object.entries(DEMO).forEach(([id, d]) => {
    DATA.products[id] = { name: d.name, shortName: d.name.replace(/, \d+ г$/, ''), price: d.price, weight: d.name.match(/(\d+ г)/)[1],
                          image: `assets/images/products/demo/mayo-${d.img}.svg` };
    DATA.pdp.products[id] = {
      composition: { text: d.comp, allergens: { label: 'Алергени:', value: d.allergens } },
    };
  });

  /* ---------- Що МГ знає для замін ----------
     Для кожного товару чернетки — чим можна замінити і чим варіант відрізняється (note — до 60 символів).
     tags — причини, під які варіант підходить: cheaper (рахується з ціни), light, noEgg, brand. */
  const ALT = {
    hellmanns: [
      { id: 'mayoHome',  tags: ['brand'], same: true, note: 'Класичний, 72% — інша марка' },
      { id: 'mayoLight', tags: ['light', 'brand'], same: true, note: 'Легший: 30% жиру замість 73%' },
      { id: 'mayoVegan', tags: ['noEgg', 'brand'], same: true, note: 'Без яєць — пісний, на білку гороху' },
    ],
    water15: [
      { id: 'water15light', tags: ['brand'], same: true, note: 'Та сама вода, але слабогазована' },
      { id: 'water075',     tags: [],        note: 'Менша пляшка, 0,75 л — за літр дорожче' },
    ],
    // зворотні заміни — щоб і замінене можна було замінити ще раз
    water15light: [
      { id: 'water15', tags: ['brand'], same: true, note: 'Та сама вода, але негазована' },
      { id: 'water075', tags: [], note: 'Менша пляшка, 0,75 л — за літр дорожче' },
    ],
    mayoHome:  [{ id: 'mayoLight', tags: ['light'], same: true, note: 'Легший: 30% жиру' }, { id: 'mayoVegan', tags: ['noEgg'], same: true, note: 'Без яєць — пісний' }, { id: 'hellmanns', tags: ['brand'], same: true, note: 'Hellmann’s Original 73%' }],
    mayoLight: [{ id: 'mayoHome', tags: ['brand'], same: true, note: 'Класичний, 72%' }, { id: 'mayoVegan', tags: ['noEgg'], same: true, note: 'Без яєць — пісний' }, { id: 'hellmanns', tags: ['brand'], same: true, note: 'Hellmann’s Original 73%' }],
    mayoVegan: [{ id: 'mayoHome', tags: ['brand'], same: true, note: 'Класичний, 72%, з яйцями' }, { id: 'mayoLight', tags: ['light'], same: true, note: 'Легкий, 30%, з яйцями' }],
    milk:    [{ id: 'milk32', tags: [], note: 'Жирніше: 3,2% замість 2,5%' }],
    milk32:  [{ id: 'milk', tags: ['light'], same: true, note: 'Легше: 2,5% замість 3,2%' }],
    cottage: [{ id: 'cheese', tags: ['brand'], note: 'Твердий — до бутербродів' }, { id: 'processed', tags: ['cheaper'], note: 'Плавлений — на бутерброди' }],
    appleGolden: [
      { id: 'applesGreen', tags: ['brand'], note: 'Зелені — кисліші й хрусткіші' },
      { id: 'pears',       tags: ['brand'], note: 'Груші — солодші й мʼякші' },
    ],
    banana: [],
    tomatoes: [],
    cabbage: [],
  };
  // як гість називає товар своїми словами
  const WORDS = {
    hellmanns: ['майонез', 'hellmann', 'хелман', 'соус'],
    water15: ['вод', 'моршин'],
    banana: ['банан'],
    appleGolden: ['яблук', 'голден'],
    tomatoes: ['помідор', 'томат'],
    cabbage: ['капуст'],
    milk: ['молок'], milk32: ['молок'], bread: ['хліб', 'батон'], eggs: ['яй'], cottage: ['сир'], coffee: ['кав'],
    pistachios: ['фісташ'], oliveOil: ['олі'], grapesRed: ['виноград'],
  };
  const GROUPS = { фрукт: ['banana', 'appleGolden'], овоч: ['tomatoes', 'cabbage'] };

  const T = {
    opener: 'Збери, як зазвичай',
    draftTitle: 'Чернетка: звичайне замовлення',
    more: 'Що ще я брав?',
    howOften: { 7: 'щотижня', 14: 'раз на 2 тижні', 30: 'раз на місяць' },
    ask: 'Що не так — прибери, заміни або просто напиши.',
    addAll: 'Додати все в кошик',
    replaceSome: 'Замінити товар',
    whichOne: 'Що саме замінити?',
    reasons: { cheaper: 'Дорогий', light: 'Хочу легший', noEgg: 'Без яєць', brand: 'Інша марка' },
    whyNot: x => `Чому міняємо ${x}? Тоді підберу точніше.`,
    keep: x => `Лишити ${x}`,
    checkout: 'Оформити замовлення',
    replaceMore: 'Замінити ще щось',
  };

  const money = v => UI.money(v).replace('.00', '');
  const P = id => DATA.products[id];
  // як МГ називає товар у реченні: називний і знахідний відмінки («замінити капусту»)
  const NAMES = {
    hellmanns: ['майонез Hellmann’s'], water15: ['вода «Моршинська»', 'воду «Моршинська»'],
    banana: ['банан'], appleGolden: ['яблука Голден'], tomatoes: ['помідори'], cabbage: ['капуста', 'капусту'],
    water15light: ['слабогазована «Моршинська»', 'слабогазовану «Моршинську»'], water075: ['«Моршинська» 0,75 л'],
    applesGreen: ['зелені яблука'], pears: ['груші'],
  };
  const lcFirst = t => t.charAt(0).toLocaleLowerCase('uk-UA') + t.slice(1);
  const nameOf = id => DEMO[id] ? DEMO[id].short : (NAMES[id] || [lcFirst(P(id).shortName || P(id).name)])[0];
  const accOf = id => DEMO[id] ? DEMO[id].short : (NAMES[id] || [])[1] || nameOf(id);
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];
  const DAYS = ['день', 'дні', 'днів'];
  const WEEKSW = ['тиждень', 'тижні', 'тижнів'];
  const ago = d => (d % 7 === 0 && d >= 14 ? `${count(d / 7, WEEKSW)} тому` : `${count(d, DAYS)} тому`);
  const ID = 'predict';

  /* ---------- Історія замовлень гостя (умовна: 6 тижнів) ----------
     every — як часто бере (днів), qty — звичайна кількість, last — днів від останньої покупки */
  const WEEKS = 6;
  const HISTORY = [
    { id: 'milk',      every: 7,  qty: 2, last: 7 },
    { id: 'bread',     every: 7,  qty: 1, last: 7 },
    { id: 'banana',    every: 7,  qty: 1, last: 7 },
    { id: 'water15',   every: 7,  qty: 2, last: 7 },
    { id: 'eggs',      every: 14, qty: 1, last: 13 },
    { id: 'cottage',   every: 14, qty: 1, last: 6 },
    { id: 'hellmanns', every: 30, qty: 1, last: 27 },
    { id: 'coffee',    every: 30, qty: 1, last: 9 },
  ];
  // брав рідко — не «передбачаємо», але показуємо на «Що ще я брав?»
  const RARE = [{ id: 'pistachios', last: 35 }, { id: 'oliveOil', last: 21 }, { id: 'grapesRed', last: 28 }];
  const history = () => HISTORY.filter(h => P(h.id));
  /** «Пора» за період: до наступної звичайної покупки лишилось не більше днів, ніж у періоді */
  const due = (h, days) => h.every - h.last <= days;
  const qtyFor = (h, days) => h.qty * Math.max(1, Math.floor(days / h.every));

  /* ---------- Стан ---------- */
  let S = null;
  const fresh = () => ({
    draft: [],         // рядки чернетки: { id, qty, hint, off, offNote, added } — спільні з чатом
    swaps: {},         // заміни гостя: id з історії → на що замінив (перерахунок їх не губить)
    target: null,      // що зараз замінюємо
    reason: null,      // чому (cheaper | light | noEgg | brand)
    noEgg: false,      // критичне обмеження — діє до кінця розмови
    marks: {},         // id → 'new' у чернетці
    where: 'draft',    // що міняємо: чернетку в чаті чи справжній кошик (вхід з кошика)
    period: 'week',    // припущення: на скільки збираємо
    periodSource: 'assumption',
    inCart: false,     // чернетку вже додано в кошик
  });
  const taken = () => S.draft.filter(r => !r.off);
  const total = () => taken().reduce((s, r) => s + P(r.id).price * r.qty, 0);

  const node = (label, run) => ({ label, scenario: ID, replace: true, run });

  /* ---------- Припущення «на скільки» (рядок контексту, «×» — змінити) ----------
     Кількості в чернетці під період; позиції (і зроблені заміни, «не беру») не змінюються. */
  const PERIODS = {
    week: { days: 7,  label: 'на тиждень, як зазвичай', chip: 'На тиждень' },
    two:  { days: 14, label: 'на 2 тижні', chip: 'На 2 тижні' },
  };
  function periodCtx() {
    const p = PERIODS[S.period];
    return shown([{ type: 'period', key: 'period', label: p.label, source: S.periodSource }]);
  }
  /** Рядки чернетки з історії під період; «не беру», заміни й додане гостем лишаються */
  function build(days) {
    const old = new Map(S.draft.map(r => [r.id, r]));
    const rows = history().filter(h => due(h, days)).map(h => {
      const id = S.swaps[h.id] || h.id, o = old.get(id);
      return { id, qty: qtyFor(h, days), hint: S.swaps[h.id] ? null : T.howOften[h.every],
        ...(o && o.off ? { off: true, offNote: o.offNote } : {}),
        ...(Cart.items.has(id) ? { off: true, offNote: 'є в кошику' } : {}) };
    });
    S.draft.filter(r => r.added && !rows.some(x => x.id === r.id)).forEach(r => rows.push(r));
    S.draft = rows;
  }
  /** Що з регулярного ще рано брати — одне речення поради */
  function notYet(days) {
    const h = history().filter(x => !due(x, days)).sort((a, b) => (a.every - a.last) - (b.every - b.last))[0];
    return h ? `${cap(nameOf(h.id))} не ставлю: брав ${ago(h.last)}, а береш ${T.howOften[h.every]}.` : '';
  }
  /** Рядок контексту без того, що гість щойно сказав дослівно (S.just) — це видно в його репліці */
  const shown = ctx => ctx.filter(c => !(S.just || []).includes(c.key));
  function setPeriod(key) {
    S.period = key; S.periodSource = 'guest'; S.just = ['period'];
    build(PERIODS[key].days);
    return {
      text: key === 'two' ? `На 2 тижні: щотижневого — удвічі, плюс те, що буде пора за цей час. Тепер ${count(taken().length, GOODS)} на ${money(total())}:`
        : `На тиждень, як зазвичай: ${count(taken().length, GOODS)} на ${money(total())}:`,
      list: draftList(), context: periodCtx(),
      after: notYet(PERIODS[key].days) || null,
      chips: [node(T.more, more)],
    };
  }
  const periodChips = () => Object.entries(PERIODS).map(([k, p]) => node(p.chip, () => setPeriod(k)));

  /** Чернетка як елемент чату. rows — ті самі обʼєкти, що й S.draft: кількість і «не беру»,
      змінені в чернетці (js/branches/d.js), сценарій бачить одразу */
  function draftList() {
    S.draft.forEach(r => { r.mark = S.marks[r.id] || null; });
    return {
      title: S.inCart ? 'Кошик' : T.draftTitle,
      rows: S.draft,
      rowAction: 'Замінити',
      addLabel: 'Додати в кошик',
      inCart: S.inCart,
    };
  }

  /* ---------- Відповіді ---------- */
  function start() {
    S = fresh();
    S.just = [];
    if (!history().length) {
      // немає історії — чесно, без вигаданого «звичайного» кошика
      return {
        text: 'Чесно: замовлень у тебе ще не було, тож передбачати нема з чого. Можу зібрати кошик інакше:',
        chips: ['photo-list', 'recipe', 'event'].map(id => Scenarios.all[id] && Scenarios.all[id].opener).filter(Boolean),
      };
    }
    build(PERIODS.week.days);
    const inCartRows = S.draft.filter(r => r.offNote === 'є в кошику');
    // до дешевшої доставки близько — кажемо суму одразу (стейкхолдер просив) і даємо чіп
    const nd = nextDelivery(), near = nd && nd.left <= 300;
    return {
      text: `Зібрав, як ти зазвичай береш, — з твоїх замовлень за ${count(WEEKS, WEEKSW)}: ${count(taken().length, GOODS)} на ${money(total())}`
        + (near ? `, до доставки за ${money(nd.price)} ще ${money(nd.left)}` : '') + '.'
        + (inCartRows.length ? ` ${cap(inCartRows.map(r => nameOf(r.id)).join(', '))} вже в кошику — не рахую.` : ''),
      list: draftList(),
      context: periodCtx(),
      after: [notYet(PERIODS.week.days), T.ask].filter(Boolean).join(' '),
      chips: [node(T.more, more), near ? node('Як доставити дешевше?', deliveryTip) : null].filter(Boolean),
    };
  }

  /** «Що ще я брав?» — рідші й ще не «пора» покупки; вибір одного з кількох → карусель, «Додати» в чернетку */
  function more() {
    const days = PERIODS[S.period].days;
    const ids = [
      ...history().filter(h => !due(h, days)).map(h => ({ id: h.id, note: `${cap(T.howOften[h.every])}, останній раз ${ago(h.last)}` })),
      ...RARE.filter(x => P(x.id)).map(x => ({ id: x.id, note: `Брав один раз, ${ago(x.last)}` })),
    ].filter(x => !S.draft.some(r => r.id === x.id) && !Cart.items.has(x.id)).slice(0, 4);
    S.target = null;
    if (!ids.length) return { text: 'Більше нічого — усе, що ти брав, уже в чернетці чи в кошику.' };
    S.addMap = Object.fromEntries(ids.map(x => [x.id, true]));
    return { text: 'Ось що ти брав рідше. Додам у чернетку, якщо треба:', items: ids.map(x => ({ ...x, noAdd: true, act: 'Додати' })) };
  }

  /* ---------- Справжній кошик (вхід — іконка заміни в рядку кошика або чіп МГ над ним) ----------
     Та сама логіка заміни, але міняється рядок кошика: кількість і місце в списку зберігаються,
     «Скасувати» повертає як було, «Повернутись у кошик» закриває чат (кошик під ним). */
  const inCart = () => S.where === 'cart';
  const cartIds = () => [...Cart.items.keys()];
  const backNode = () => ({ label: 'Повернутись у кошик', scenario: ID, replace: true, back: true, run: () => null });
  /** Замінити ключ у Map кошика на тому ж місці */
  function swapInCart(from, to) {
    Cart.items = new Map([...Cart.items].map(([k, v]) => (k === from ? [to, v] : [k, v])));
    Cart.render();
  }
  function cartReplace(from, to) {
    swapInCart(from, to);
    Scenarios.cartNew.add(to);
    S.target = null;
    return {
      confirm: {
        text: `Замінено в кошику: ${nameOf(from)} → ${nameOf(to)}`,
        undo: () => { swapInCart(to, from); Scenarios.cartNew.delete(to); return { text: `Скасував: повернув ${nameOf(from)} у кошик.`, chips: [backNode()] }; },
      },
      ...(() => { const f = followUp(); return { text: `Решта кошика без змін. У кошику на ${money(Cart.total())}${f.note}.`, chips: [backNode(), f.chip].filter(Boolean) }; })(),
    };
  }
  function cartRemove(id) {
    const entries = [...Cart.items], i = entries.findIndex(([k]) => k === id);
    Cart.items.delete(id); Cart.render();
    S.target = null;
    return {
      confirm: {
        text: `Прибрано з кошика: ${nameOf(id)}`,
        undo: () => { Cart.items = new Map(entries); Cart.render(); return { text: `Скасував: ${nameOf(id)} знову в кошику.`, chips: [backNode()] }; },
      },
      text: `У кошику на ${money(Cart.total())}.`,
      chips: [backNode()],
    };
  }
  const ensure = () => { if (!S) S = fresh(); };

  /* ---------- Один суміжний крок після заміни (правило «одне рішення за раз») ----------
     Пріоритет: гість казав «дорого» → «Де ще зекономити?»; до дешевшої доставки ≤ 300 ₴ →
     «Як доставити дешевше?» (і сума — у тексті відповіді); інакше → «Замінити ще щось». */
  const pool = () => (inCart() ? [...Cart.items].map(([id, qty]) => ({ id, qty })) : taken());
  const poolTotal = () => (inCart() ? Cart.total() : total());
  /** Рівноцінні дешевші заміни в кошику / чернетці: { from, to, save } */
  function savings() { return savingsFor(pool()); }
  function savingsFor(items) {
    const noEgg = S && S.noEgg;
    return items.map(({ id, qty }) => {
      const best = (ALT[id] || []).filter(a => a.same && P(a.id).price < P(id).price && !(noEgg && id === 'hellmanns' && !a.tags.includes('noEgg')))
        .sort((a, b) => P(a.id).price - P(b.id).price)[0];
      return best && { from: id, to: best.id, save: (P(id).price - P(best.id).price) * qty };
    }).filter(Boolean);
  }
  /** Наступний поріг доставки: { price, left } або null */
  function nextDelivery() { return deliveryFor(poolTotal()); }
  const deliveryFor = t => Scenarios.deliveryFor(t);
  /** Один суміжний крок — спільна логіка Scenarios.nextStep (js/scenarios/engine.js);
      тут лише свої кроки: «Де ще зекономити?», доставка з «Додати» в чернетку, «Замінити ще щось» */
  function followUp() {
    return Scenarios.nextStep({
      scenario: ID, total: poolTotal(),
      save: S.priceMatters ? node('Де ще зекономити?', saveMore) : null,
      delivery: node('Як доставити дешевше?', deliveryTip),
      own: node(T.replaceMore, () => askWhich()),
      back: inCart() ? backNode() : null,
    });
  }

  /** «Де ще зекономити?» — лише рівноцінні заміни (менша пляшка не рахується) */
  function saveMore() {
    const list = savings();
    S.target = null;
    if (!list.length) return { text: 'Більше рівноцінних дешевших замін немає — решта вже за найкращою ціною.', chips: inCart() ? [backNode()] : [] };
    S.saveMap = Object.fromEntries(list.map(x => [x.to, x.from]));
    const sum = list.reduce((s, x) => s + x.save, 0);
    return {
      text: `Ще ${list.length === 1 ? 'одна заміна' : count(list.length, ['заміна', 'заміни', 'замін'])} — разом −${money(sum)}:`,
      items: list.map((x, i) => ({ id: x.to, note: `Замість: ${nameOf(x.from)} · −${money(x.save)}`, pick: i === 0, noAdd: true, act: 'Замінити' })),
      chips: [list.length > 1 ? node(`Замінити все (−${money(sum)})`, () => replaceMany(list)) : node(`Замінити на ${accOf(list[0].to)}`, () => replace(list[0].from, list[0].to)),
              ...(inCart() ? [backNode()] : [])],
    };
  }
  /** «Замінити все» — кілька замін одним підтвердженням; «Скасувати» повертає всі */
  function replaceMany(list) {
    const results = list.map(x => replace(x.from, x.to));
    const last = results[results.length - 1];
    const sum = list.reduce((s, x) => s + x.save, 0);
    return {
      ...last,
      confirm: {
        text: `Замінено ${inCart() ? 'в кошику' : 'в чернетці'}: ${list.map(x => `${nameOf(x.from)} → ${nameOf(x.to)}`).join(', ')} (−${money(sum)})`,
        undo: () => { let r; results.slice().reverse().forEach(x => { r = x.confirm.undo(); }); return { ...r, text: 'Скасував усі заміни.' }; },
      },
    };
  }

  const deliveryRules = () => Scenarios.deliveryRules();

  /** «Як доставити дешевше?» — факт про поріг + що часто докладають */
  function deliveryTip() {
    const nd = nextDelivery();
    S.target = null;
    if (!nd) return { text: 'Доставка вже за найнижчою ціною.', chips: inCart() ? [backNode()] : [] };
    const extra = ['pistachios', 'grapesRed', 'oliveOil'].filter(id => !pool().some(r => r.id === id));
    S.addMap = Object.fromEntries(extra.map(id => [id, true]));
    return {
      // повне правило доставки (так просив стейкхолдер) + скільки бракує до найближчого порогу
      text: `Доставка: ${deliveryRules()}.\nДо доставки за ${money(nd.price)} не вистачає ${money(nd.left)}. Ось що часто докладають до такого кошика:`,
      // у кошику — звичайний «+»; у чернетці — «Додати» в чернетку (поки нічого не в кошику)
      items: extra.map(id => (inCart() ? { id } : { id, noAdd: true, act: 'Додати' })),
      chips: inCart() ? [backNode()] : [],
    };
  }
  function addToDraft(id) {
    const h = history().find(x => x.id === id);
    S.draft.push({ id, qty: 1, added: true, hint: h ? T.howOften[h.every] : 'брав один раз' }); S.marks[id] = 'new';
    return { text: `Додав у чернетку. Тепер ${count(taken().length, GOODS)} на ${money(total())}:`, list: draftList(), chips: [followUp().chip] };
  }
  /** Вхід з рядка кошика */
  function cartEntry(id) {
    return node(`Заміни ${accOf(id)}`, () => { ensure(); return offer(id, null, 'cart'); });
  }
  /** Вхід із чіпа МГ над кошиком: що саме замінити */
  function cartAsk() {
    return node('Замінити товар', () => { ensure(); S.where = 'cart'; return askWhich(); });
  }

  /** «Замінити товар» без уточнення — одне питання: який */
  function askWhich(ids) {
    const list = Array.isArray(ids) ? ids : inCart() ? cartIds() : S.draft.map(r => r.id);
    return { text: T.whichOne, chips: list.slice(0, 6).map(id => node(cap(nameOf(id)), () => offer(id))) };
  }
  const cap = s => s.charAt(0).toLocaleUpperCase('uk-UA') + s.slice(1);

  /** Варіанти заміни: одразу показуємо, причина — одним питанням під ними */
  /** just — що гість щойно назвав (не повторюємо в рядку контексту): за замовчуванням товар, якщо
      він щойно сказав «заміни X»; «без яєць», якщо щойно обрав цю причину */
  function offer(id, reason = null, where, just) {
    if (where) S.where = where;
    S.just = just || (reason ? (reason === 'noEgg' ? ['noEgg'] : []) : ['target']);
    S.target = id; S.reason = reason;
    const base = P(id).price;
    let alts = (ALT[id] || []).filter(a => !(S.noEgg && !a.tags.includes('noEgg') && id === 'hellmanns'));
    if (reason === 'cheaper') alts = alts.filter(a => P(a.id).price < base).sort((a, b) => P(a.id).price - P(b.id).price);
    else if (reason) alts = alts.filter(a => a.tags.includes(reason));
    alts = alts.slice(0, 3);
    const ctx = shown([{ key: 'target', label: `замість: ${nameOf(id)}`, source: 'guest' },
      ...(S.noEgg ? [{ key: 'noEgg', label: 'без яєць', source: 'guest', type: 'noEgg' }] : [])]);

    if (!(ALT[id] || []).length) {
      return {
        text: inCart() ? `Чесно: замінити ${accOf(id)} поки нічим — іншого такого товару зараз немає.`
          : `Чесно: замінити ${accOf(id)} поки нічим — іншого такого товару зараз немає. Можу позначити «не беру».`,
        chips: inCart() ? [node('Прибрати з кошика', () => cartRemove(id)), backNode()]
          : [node(`Не брати ${accOf(id)}`, () => skipRow(id)), node(T.keep(accOf(id)), keep)],
      };
    }
    if (!alts.length) {
      const why = { cheaper: `дешевшого за ${money(base)}`, light: 'легшого', noEgg: 'без яєць', brand: 'іншої марки' }[reason];
      return {
        text: `${cap(why)} варіанта для «${nameOf(id)}» зараз немає.`,
        context: ctx,
        chips: [node('Показати всі варіанти', () => offer(id, null, undefined, [])), node(T.keep(accOf(id)), keep)],
      };
    }
    // підпис: чим відрізняється від поточного (ціна — завжди з даних)
    const items = alts.map((a, i) => {
      const d = P(a.id).price - base;
      const diff = d < 0 ? `на ${money(-d)} дешевше` : d > 0 ? `на ${money(d)} дорожче` : 'та сама ціна';
      return { id: a.id, note: `${a.note} · ${diff}`, pick: i === 0, noAdd: true, act: 'Замінити' };
    });
    const reasons = Object.keys(T.reasons).filter(r => r !== reason && (r === 'cheaper' ? (ALT[id] || []).some(a => P(a.id).price < base) : (ALT[id] || []).some(a => a.tags.includes(r))));
    const lead = reason ? `${{ cheaper: `Дешевше за ${accOf(id)}`, light: 'Легші', noEgg: 'Без яєць', brand: 'Інші марки' }[reason]} — ` : '';
    return {
      text: reason ? `${lead}${alts.length === 1 ? 'є такий варіант' : `ось ${count(alts.length, ['варіант', 'варіанти', 'варіантів'])}`}:` : `Чим замінити ${accOf(id)} (${money(base)})? Ось варіанти:`,
      items, context: ctx,
      // причину питаємо, лише якщо є з чого вибирати; інакше питання без відповідей
      after: reason ? `Мій вибір — ${nameOf(alts[0].id)}.` : reasons.length ? T.whyNot(accOf(id)) : null,
      chips: reason
        ? [...alts.slice(0, 2).map(a => node(`Замінити на ${accOf(a.id)}`, () => replace(id, a.id))), node(T.keep(accOf(id)), keep)]
        : [...reasons.slice(0, 3).map(r => node(T.reasons[r], () => reasonPick(id, r))), node(T.keep(accOf(id)), keep)],
    };
  }

  function reasonPick(id, r) {
    if (r === 'noEgg') S.noEgg = true; // критичне — памʼятаємо до кінця розмови
    if (r === 'cheaper') S.priceMatters = true; // гість сказав «дорого» — далі пропонуємо, де ще зекономити
    return offer(id, r);
  }

  function keep() {
    const id = S.target; S.target = null;
    if (inCart()) return { text: `Гаразд, ${accOf(id)} лишається в кошику.`, chips: [backNode()] };
    return { text: `Гаразд, лишаю ${accOf(id)}. Решта без змін.`, list: draftList(), chips: [node(T.replaceMore, askWhich)] };
  }

  /** Замінити один рядок чернетки: кількість і решта товарів не змінюються */
  function replace(from, to) {
    if (inCart()) return cartReplace(from, to);
    const row = S.draft.find(r => r.id === from);
    const was = total();
    row.id = to;
    // перерахунок за періодом не губить заміну: памʼятаємо, що з історії на що замінено
    const orig = Object.keys(S.swaps).find(k => S.swaps[k] === from) || from;
    const prevSwap = S.swaps[orig], prevHint = row.hint;
    S.swaps[orig] = to; row.hint = null;
    const prevMark = S.marks[from];
    delete S.marks[from]; S.marks[to] = 'new';
    S.target = null;
    const d = total() - was;
    return {
      confirm: {
        text: `Замінено в чернетці: ${nameOf(from)} → ${nameOf(to)}`,
        undo: () => {
          row.id = from; row.hint = prevHint; delete S.marks[to]; if (prevMark) S.marks[from] = prevMark;
          if (prevSwap) S.swaps[orig] = prevSwap; else delete S.swaps[orig];
          return { text: `Скасував: повернув ${nameOf(from)}.`, list: draftList(), chips: [node(T.replaceSome, askWhich)] };
        },
      },
      ...(() => { const f = followUp(); return {
        text: `Решта без змін. Тепер ${count(taken().length, GOODS)} на ${money(total())}${d ? ` (${d < 0 ? '−' : '+'}${money(Math.abs(d))})` : ''}${f.note}:`,
        chips: [f.chip] }; })(),
      list: draftList(),
    };
  }

  /** «Не брати» — рядок сіріє, але лишається в чернетці; повертається «+» */
  function skipRow(id) {
    const row = S.draft.find(r => r.id === id);
    if (row) row.off = true;
    S.target = null;
    return { text: `Гаразд, ${accOf(id)} не беру. Тепер ${count(taken().length, GOODS)} на ${money(total())}:`, list: draftList(), chips: [node(T.replaceMore, askWhich)] };
  }

  /** «Додати все в кошик» — лише зараз товари потрапляють у кошик */
  function addAll() {
    if (S.inCart) return { text: 'Чернетка вже в кошику.', chips: [{ label: T.checkout, go: 'cart' }] };
    const rows = taken().map(r => ({ ...r }));
    if (!rows.length) return { text: 'У чернетці нічого не обрано — поверни потрібне кнопкою «+».', list: draftList() };
    rows.forEach(r => Cart.add(r.id, r.qty));
    S.inCart = true;
    return {
      confirm: {
        text: `Додано в кошик: ${count(rows.length, GOODS)}`,
        undo: () => {
          rows.forEach(r => Cart.add(r.id, -r.qty));
          S.inCart = false;
          return { text: 'Скасував: прибрав чернетку з кошика.', list: draftList(), chips: [node(T.replaceSome, askWhich)] };
        },
      },
      list: draftList(),
      // завдання виконано — один суміжний крок (Scenarios.nextStep), уже від справжнього кошика
      ...(() => { const f = Scenarios.nextStep({ scenario: ID });
        return { text: `У кошику на ${money(Cart.total())}${f.note}.`, chips: [f.chip].filter(Boolean) }; })(),
    };
  }

  /* ---------- Своїми словами ---------- */
  const itemsIn = t => (inCart() ? cartIds() : S.draft.map(r => r.id)).filter(id => (WORDS[id] || []).some(w => t.includes(w)) || (DEMO[id] && /майонез/.test(t)));

  function route(t, last) {
    if (S && last && last.replace) {
      if (/додай все|додати все|все в кошик|беру все|ок,? додай/.test(t)) return node(t, addAll);
      if (/зекономит|ще дешевш|де дешевше/.test(t)) return node(t, saveMore);
      if (/доставк/.test(t)) return node(t, deliveryTip);
      // причина («дорого», «без яєць»…) — для названого товару або того, що зараз замінюємо
      const reason = /дорог|дешевш/.test(t) ? 'cheaper' : /легш|дієт|менше жир/.test(t) ? 'light'
        : /без яє|яйц|алерг|пісн|веган/.test(t) ? 'noEgg' : /марк|бренд|інш(ий|у) фірм/.test(t) ? 'brand' : null;
      const named = itemsIn(t);
      if (reason && (named.length === 1 || (!named.length && S.target))) {
        const id = named.length === 1 ? named[0] : S.target;
        return node(t, () => reasonPick(id, reason));
      }
      if (S.target && /лиш|залиш|не треба/.test(t)) return node(t, keep);
      // що замінити
      if (/замін|інш|не хочу|не люблю|прибер|без /.test(t) || itemsIn(t).length) {
        const group = Object.entries(GROUPS).find(([w]) => t.includes(w));
        const ids = group ? group[1].filter(id => S.draft.some(r => r.id === id)) : itemsIn(t);
        if (/прибер|прибрати|видал|не треба|не бер/.test(t) && ids.length === 1) return node(t, () => (inCart() ? cartRemove(ids[0]) : skipRow(ids[0])));
        if (ids.length === 1) return node(t, () => offer(ids[0]));
        if (ids.length > 1) return node(t, () => askWhich(ids));
        if (/замін/.test(t)) return node(t, () => askWhich());
      }
    }
    if (S && last && last.replace && !S.inCart) {
      if (/2 тижн|два тижн|двох тижн|14 дн/.test(t)) return node(t, () => setPeriod('two'));
      if (/тиждень|як зазвичай|7 днів/.test(t)) return node(t, () => setPeriod('week'));
      if (/що ще|ще щось|рідше/.test(t)) return node(t, more);
      if (/додай|візьми/.test(t)) {
        const ids = [...history().map(h => h.id), ...RARE.map(x => x.id)].filter(id => (WORDS[id] || []).some(w => t.includes(w)) && !S.draft.some(r => r.id === id && !r.off));
        if (ids.length === 1) return node(t, () => addToDraft(ids[0]));
      }
    }
    if (/збери кошик|зібрати кошик|набери кошик|як зазвичай|звичайн|передбач|як завжди|як минулого/.test(t)) return node(t, start);
    return null;
  }

  /** «Замінити» в рядку чернетки */
  function rowAction(id) {
    if (!S || S.inCart) return null;
    return node(`Заміни ${accOf(id)}`, () => offer(id, null, 'draft'));
  }

  /** Кнопка «Додати в кошик» у чернетці */
  function listAdd() {
    if (!S || S.inCart) return null;
    const n = taken().length;
    return node(n === S.draft.length ? 'Додай усе в кошик' : `Додай ${count(n, GOODS)} в кошик`, addAll);
  }

  /** «Замінити» на картці варіанта */
  function cardAction(id) {
    if (!S) return null;
    if (S.saveMap && S.saveMap[id]) { const from = S.saveMap[id]; delete S.saveMap[id]; return node(`Заміни ${accOf(from)} на ${accOf(id)}`, () => replace(from, id)); }
    if (S.addMap && S.addMap[id] && !inCart()) { delete S.addMap[id]; return node(`Додай ${nameOf(id)}`, () => addToDraft(id)); }
    if (!S.target) return null;
    const from = S.target;
    return node(`Заміни на ${accOf(id)}`, () => replace(from, id));
  }

  /** «×» у рядку контексту: «без яєць» — прибрати обмеження */
  function removeCondition(type) {
    if (!S) return null;
    if (type === 'period') {
      const label = PERIODS[S.period].label;
      return node(`Змінити «${label}»`, () => ({ text: 'Гаразд. На скільки збирати?', chips: periodChips() }));
    }
    if (type !== 'noEgg') return null;
    return node('Можна з яйцями', () => { S.noEgg = false; return S.target ? offer(S.target, null, undefined, []) : { text: 'Гаразд, без обмеження.', chips: [node(T.replaceMore, askWhich)] }; });
  }

  Scenarios.define({
    id: ID,
    opener: node(T.opener, start),
    route,
    rowAction,
    cardAction,
    listAdd,
    cartEntry,
    cartAsk,
    /* жовті чіпси над кошиком (js/branches/d.js): показуємо лише ті, на які є реальна відповідь */
    cartSavings: () => savingsFor([...Cart.items].map(([id, qty]) => ({ id, qty }))),
    cartNearDelivery: () => { const nd = deliveryFor(Cart.total()); return nd && nd.left <= 300 ? nd : null; },
    cartSave: () => node('Де зекономити?', () => { ensure(); S.where = 'cart'; S.target = null; return saveMore(); }),
    cartDelivery: () => node('Як доставити дешевше?', () => { ensure(); S.where = 'cart'; return deliveryTip(); }),
    removeCondition,
  });
})();
