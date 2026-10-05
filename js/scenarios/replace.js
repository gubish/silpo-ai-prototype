/* =====================================================================
   СЦЕНАРІЙ «Заміна товару в кошику» (гілка Chats, js/branches/d.js).
   За правилами docs/mg-dialog-rules.md. Ситуація: МГ уже зібрав кошик (як — поки не важливо),
   гість загалом згоден, але один товар хоче замінити — не збираючи все заново.
   • «Зібрати кошик» → чернетка списку (ще НЕ в кошику): рядки товар · к-сть · ціна, сума,
     у кожному рядку «Замінити». Під нею — «Додати все в кошик» / «Замінити товар».
   • «Замінити» в рядку (або «заміни майонез» словами) → одразу 3 варіанти з підписом, чим
     відрізняються від поточного; під ними одне питання «Чим не підійшов X?» з причинами-чіпсами.
     Причина звужує варіанти; «без яєць» — критичне обмеження: діє до кінця розмови.
   • «Замінити на Y» → «✓ Замінено в чернетці: X → Y · Скасувати» і оновлена чернетка,
     де новий рядок позначено «нове»; решта товарів і кількості без змін.
   • Немає чим замінити → чесно, пропозиція прибрати рядок. Незрозуміло що («заміни фрукти»)
     → одне питання з товарами-чіпсами.
   • Чернетка — компактні рядки: «− N шт +» і кнопка заміни; мінус на 1 шт (кошик) = «не беру»
     (рядок сіріє, повертається «+»). Кнопка «Додати в кошик · сума» рахує лише те, що беремо.
   • «Додати в кошик» → «✓ Додано в кошик · Скасувати» і один крок — оформити.
   Демо: 3 майонези (DEMO нижче, намальовані баночки — tools/make-demo-mayo.py, «(демо)» в назві).
   Тексти — T, заміни — ALT, ключові слова товарів — WORDS.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Демо-майонези (лише гілка Chats) ---------- */
  const DEMO = {
    mayoHome:  { name: 'Майонез «Домашній» 72%, 300 г (демо)', short: 'майонез «Домашній»', price: 89, img: 'home',
                 comp: 'Олія соняшникова, вода, яєчний жовток, гірчиця, цукор, сіль, оцет.', allergens: 'яйця, гірчиця' },
    mayoLight: { name: 'Майонез легкий 30%, 250 г (демо)', short: 'легкий майонез', price: 99, img: 'light',
                 comp: 'Вода, олія соняшникова, крохмаль, яєчний жовток, гірчиця, сіль, оцет.', allergens: 'яйця, гірчиця' },
    mayoVegan: { name: 'Майонез без яєць, пісний, 250 г (демо)', short: 'майонез без яєць', price: 129, img: 'vegan',
                 comp: 'Олія соняшникова, вода, білок гороху, гірчиця, сіль, лимонний сік.', allergens: 'гірчиця' },
  };
  Object.entries(DEMO).forEach(([id, d]) => {
    DATA.products[id] = { name: d.name, shortName: d.name.replace(/, \d+ г \(демо\)$/, ' (демо)'), price: d.price, weight: d.name.match(/(\d+ г)/)[1],
                          image: `assets/images/products/demo/mayo-${d.img}.svg` };
    DATA.pdp.products[id] = {
      description: 'Демонстраційний товар для сценарію чату: ціна, наявність і фото умовні.',
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
  };
  const GROUPS = { фрукт: ['banana', 'appleGolden'], овоч: ['tomatoes', 'cabbage'] };

  const T = {
    opener: 'Зібрати кошик',
    draftTitle: 'Чернетка кошика',
    built: (n, note) => `Зібрав кошик на кілька днів — ${n}${note}. Перевір, що все підходить:`,
    ask: 'Кількість — плюс і мінус у рядку, непотрібне — кошиком. Хочеш інше — значок заміни.',
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
  const nameOf = id => DEMO[id] ? DEMO[id].short : (NAMES[id] || [P(id).name])[0];
  const accOf = id => DEMO[id] ? DEMO[id].short : (NAMES[id] || [])[1] || nameOf(id);
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];

  /* ---------- Стан ---------- */
  let S = null;
  const fresh = () => ({
    draft: ['tomatoes', 'cabbage', 'banana', 'appleGolden', 'water15', 'hellmanns'].map(id => ({ id, qty: 1 })),
    target: null,      // що зараз замінюємо
    reason: null,      // чому (cheaper | light | noEgg | brand)
    noEgg: false,      // критичне обмеження — діє до кінця розмови
    marks: {},         // id → 'new' у чернетці
    where: 'draft',    // що міняємо: чернетку в чаті чи справжній кошик (вхід з кошика)
    period: 'days',    // припущення: на скільки збираємо
    periodSource: 'assumption',
    inCart: false,     // чернетку вже додано в кошик
  });
  const taken = () => S.draft.filter(r => !r.off);
  const total = () => taken().reduce((s, r) => s + P(r.id).price * r.qty, 0);

  const node = (label, run) => ({ label, scenario: 'replace', replace: true, run });

  /* ---------- Припущення «на скільки» (рядок контексту, «×» — змінити) ----------
     Кількості в чернетці під період; позиції (і зроблені заміни, «не беру») не змінюються. */
  const PERIODS = {
    days: { label: 'на кілька днів', chip: 'На кілька днів', qty: [1, 1, 1, 1, 1, 1] },
    week: { label: 'на тиждень', chip: 'На тиждень', qty: [2, 1, 2, 2, 3, 1] },
  };
  function periodCtx() {
    const p = PERIODS[S.period];
    return shown([{ type: 'period', key: 'period', label: S.periodSource === 'assumption' ? `${p.label}, припущення` : p.label, source: S.periodSource }]);
  }
  /** Рядок контексту без того, що гість щойно сказав дослівно (S.just) — це видно в його репліці */
  const shown = ctx => ctx.filter(c => !(S.just || []).includes(c.key));
  function setPeriod(key) {
    S.period = key; S.periodSource = 'guest'; S.just = ['period'];
    S.draft.forEach((r, i) => { r.qty = PERIODS[key].qty[i] || 1; });
    return {
      text: key === 'week' ? 'Перерахував на тиждень: більше овочів, фруктів і води. Решта без змін:' : 'Перерахував на кілька днів, по одному. Решта без змін:',
      list: draftList(), context: periodCtx(),
      chips: [node(T.replaceSome, askWhich)],
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
    // до дешевшої доставки близько — кажемо суму одразу і даємо суміжний крок
    const nd = nextDelivery(), near = nd && nd.left <= 300;
    return {
      text: T.built(`${count(S.draft.length, GOODS)} на ${money(total())}`, near ? `, до доставки за ${money(nd.price)} ще ${money(nd.left)}` : ''),
      list: draftList(),
      context: periodCtx(),
      after: T.ask,
      chips: [near ? node('Як доставити дешевше?', deliveryTip) : node(T.replaceSome, askWhich)],
    };
  }

  /* ---------- Справжній кошик (вхід — іконка заміни в рядку кошика або чіп МГ над ним) ----------
     Та сама логіка заміни, але міняється рядок кошика: кількість і місце в списку зберігаються,
     «Скасувати» повертає як було, «Повернутись у кошик» закриває чат (кошик під ним). */
  const inCart = () => S.where === 'cart';
  const cartIds = () => [...Cart.items.keys()];
  const backNode = () => ({ label: 'Повернутись у кошик', scenario: 'replace', replace: true, back: true, run: () => null });
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
      ...(() => { const f = followUp(); return { text: `Решта кошика без змін. У кошику на ${money(Cart.total())}${f.note}.`, chips: [backNode(), f.chip] }; })(),
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
  function deliveryFor(t) {
    const d = DATA.cart.delivery;
    const tier = (d.tiers || []).filter(x => x.from > t).sort((a, b) => a.from - b.from)[0];
    return tier ? { price: tier.price, left: tier.from - t } : null;
  }
  function followUp() {
    if (S.priceMatters) return { chip: node('Де ще зекономити?', saveMore), note: '' };
    const nd = nextDelivery();
    if (nd && nd.left <= 300) return { chip: node('Як доставити дешевше?', deliveryTip), note: ` — до доставки за ${money(nd.price)} ще ${money(nd.left)}` };
    return { chip: node(T.replaceMore, () => askWhich()), note: '' };
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

  /** «до 1 500 ₴ — 99 ₴, від 1 500 ₴ — 69 ₴, від 2 000 ₴ — 1 ₴» (DATA.cart.delivery) */
  function deliveryRules() {
    const d = DATA.cart.delivery, tiers = [...(d.tiers || [])].sort((a, b) => a.from - b.from);
    return [`${d.min ? `від ${money(d.min)}` : `до ${money(tiers[0].from)}`} — ${money(d.price)}`,
      ...tiers.map(t => `від ${money(t.from)} — ${money(t.price)}`)].join(', ');
  }

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
    S.draft.push({ id, qty: 1 }); S.marks[id] = 'new';
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
      after: reason ? `Мій вибір — ${nameOf(alts[0].id)}.` : T.whyNot(accOf(id)),
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
    const prevMark = S.marks[from];
    delete S.marks[from]; S.marks[to] = 'new';
    S.target = null;
    const d = total() - was;
    return {
      confirm: {
        text: `Замінено в чернетці: ${nameOf(from)} → ${nameOf(to)}`,
        undo: () => {
          row.id = from; delete S.marks[to]; if (prevMark) S.marks[from] = prevMark;
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
      text: `У кошику на ${money(Cart.total())}. Оформлюємо?`,
      list: draftList(),
      chips: [{ label: T.checkout, go: 'cart' }],
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
    if (S && last && last.replace) {
      if (/тиждень|7 днів|сім днів/.test(t)) return node(t, () => setPeriod('week'));
      if (/кілька днів|пару днів|2-3 дні/.test(t)) return node(t, () => setPeriod('days'));
    }
    if (/збери кошик|зібрати кошик|набери кошик/.test(t)) return node(t, start);
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
    id: 'replace',
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
