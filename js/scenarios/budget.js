/* =====================================================================
   СЦЕНАРІЙ «Кошик під бюджет» (гілка Chats; працює і в C). За правилами docs/mg-dialog-rules.md.
   • «Збери продукти на тиждень до 1 000 ₴» → одразу чернетка в межах суми; залишок — у заголовку
     чернетки і змінюється разом зі степером («лишається 82 ₴» / «понад бюджет на 30 ₴»).
   • Вкладаємось чесно і видно як: спершу прибираємо зайве (каву), далі рівноцінні дешевші заміни
     (філе → стегна), далі менше штук і решту. Що змінили — одним реченням у вступі.
   • Припущення МГ у рядку з «×»: «на 1 людину», «на тиждень» (якщо не сказано), «доставка понад суму»
     (× → доставку рахуємо в бюджет). Сума менша за мінімальне замовлення — чесно: самовивіз, 0 ₴.
   • Не сказано, на що бюджет («Маю 500 ₴, що купити?») — одне питання з чіпсами і «Не знаю».
   • Навіть найнеобхідніше не вміщається — кажемо, скільки бракує, і два шляхи: підняти суму або менше днів.
   • «Дешевше» — наступна рівноцінна заміна; «Що не вмістилось?» — картки з «Додати» в чернетку.
   • Після «Додати в кошик» спільний крок не штовхає за бюджет: доплата до доставки — лише якщо вміщається.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Нові товари: дешевші рівноцінні заміни ---------- */
  const NEW = {
    chickenThigh: { name: 'Стегна курячі охолоджені, 1 кг', price: 149, weight: '1 кг', comp: 'Стегна курчат-бройлерів охолоджені.', allergens: 'не містить' },
    cheeseBasic:  { name: 'Сир твердий Російський 50%, 200 г', price: 89, weight: '200 г', comp: 'Молоко нормалізоване, закваска, сіль, фермент.', allergens: 'молоко (лактоза)' },
    pasta:        { name: 'Макарони ріжки, 500 г', price: 39, weight: '500 г', comp: 'Борошно пшеничне, вода.', allergens: 'глютен' },
    buckwheat:    { name: 'Крупа гречана ядриця, 1 кг', price: 52, weight: '1 кг', comp: 'Гречка ядриця.', allergens: 'не містить' },
  };
  Object.entries(NEW).forEach(([id, d]) => {
    DATA.products[id] = { name: d.name, shortName: d.name.replace(/, [^,]+$/, ''), price: d.price, weight: d.weight,
                          image: `assets/images/products/demo/list-${id}.svg` };
    DATA.pdp.products[id] = { composition: { text: d.comp, allergens: { label: 'Алергени:', value: d.allergens } } };
  });
  // заміна рядка в будь-якій чернетці тепер знає й ці пари
  const A = Scenarios.alts;
  Object.assign(A, {
    chicken:      [{ id: 'chickenThigh', note: 'Стегна — дешевші, мʼясо соковитіше' }],
    chickenThigh: [{ id: 'chicken', note: 'Філе — пісніше, без кісток' }],
    spaghetti:    [{ id: 'pasta', note: 'Ріжки — та сама пшениця, 500 г' }],
    pasta:        [{ id: 'spaghetti', note: 'Спагеті — з твердих сортів' }],
    buckwheat:    [{ id: 'lentils', note: 'Сочевиця — більше білка' }],
    cheeseBasic:  [{ id: 'cheese', note: 'Гауда — мʼякша, 45%' }],
  });
  A.cheese = [{ id: 'cheeseBasic', note: 'Російський — дешевший, той самий обʼєм' }, ...(A.cheese || [])];

  /* ---------- Набори ----------
     q — на base людей і тиждень (flat — не залежить від людей: кава, часник).
     ops — як вкладаємось, по черзі, доки сума не влізе: drop — не брати, swap — рівноцінна дешевша
     заміна (CHEAP), less — удвічі менше штук. Що лишилось після всіх ops — найнеобхідніше. */
  const CHEAP = { chicken: 'chickenThigh', cheese: 'cheeseBasic', spaghetti: 'pasta' };
  const SETS = {
    week: {
      acc: 'продукти', nom: 'продукти', fits: 'вміщаються', base: 1, period: true,
      rows: [
        { id: 'milk', q: 2 }, { id: 'eggs', q: 1 }, { id: 'bread', q: 2 }, { id: 'cottage', q: 1 },
        { id: 'cheese', q: 1 }, { id: 'chicken', q: 1 }, { id: 'spaghetti', q: 1 }, { id: 'buckwheat', q: 1 },
        { id: 'tomatoesCan', q: 1 }, { id: 'saladLeaves', q: 1 }, { id: 'garlic', q: 1, flat: true },
        { id: 'yogurtGreek', q: 2 }, { id: 'coffee', q: 1, flat: true },
      ],
      ops: ['drop:coffee', 'swap:chicken', 'swap:cheese', 'swap:spaghetti', 'less:yogurtGreek', 'drop:saladLeaves',
            'drop:yogurtGreek', 'less:bread', 'drop:cheese', 'less:milk', 'drop:cottage'],
    },
    dinner: {
      acc: 'вечерю', nom: 'вечеря', fits: 'вміщається', base: 2, period: false,
      rows: [
        { id: 'chicken', q: 1 }, { id: 'spaghetti', q: 1 }, { id: 'tomatoesCan', q: 1 }, { id: 'garlic', q: 1, flat: true },
        { id: 'cheese', q: 1 }, { id: 'saladLeaves', q: 1 }, { id: 'juice', q: 1 },
      ],
      ops: ['drop:juice', 'swap:chicken', 'swap:cheese', 'swap:spaghetti', 'drop:saladLeaves', 'drop:cheese'],
    },
  };
  const PEOPLE = [1, 2, 3, 4];
  const DAYS = [3, 7, 14];

  /* Назви в тексті: NOM — «не вмістилось: кава», ACC — «замінив гауду на російський сир» */
  const NOM = { coffee: 'кава', yogurtGreek: 'йогурт', saladLeaves: 'салат', cheese: 'твердий сир', cottage: 'кисломолочний сир',
                juice: 'сік', bread: 'батон', milk: 'молоко', chicken: 'філе', chickenThigh: 'стегна', spaghetti: 'спагеті', pasta: 'ріжки',
                cheeseBasic: 'російський сир', eggs: 'яйця', buckwheat: 'гречка', tomatoesCan: 'томати', garlic: 'часник' };
  const ACC = { ...NOM, cheese: 'гауду', buckwheat: 'гречку', coffee: 'каву' };
  const GEN = { chicken: 'філе', cheese: 'гауди', spaghetti: 'спагеті' };

  const P = id => DATA.products[id];
  const money = v => UI.money(v).replace('.00', '');
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];
  const PEOPLEW = ['людину', 'людей', 'людей'];
  const DAYW = ['день', 'дні', 'днів'];
  const join = a => a.reduce((s, n, i) => s + (i === 0 ? n : i === a.length - 1 ? ` і ${n}` : `, ${n}`), '');
  const periodLabel = d => (d === 7 ? 'на тиждень' : d === 14 ? 'на 2 тижні' : `на ${count(d, DAYW)}`);
  const D = () => DATA.cart.delivery || {};
  /** Ціна доставки для суми товарів (пороги з DATA.cart.delivery) */
  const shipFor = t => ((D().tiers || []).filter(x => x.from <= t).sort((a, b) => b.from - a.from)[0] || D()).price || 0;
  const roundUp = (v, k = 50) => Math.ceil(v / k) * k;

  /* ---------- Стан ---------- */
  let S = null;
  const taken = () => S.rows.filter(r => !r.off);
  const sumOf = rows => rows.reduce((s, r) => s + P(r.id).price * (r.qty || 1), 0);
  const total = () => sumOf(taken());
  const node = (label, run) => ({ label, scenario: 'budget', budget: true, run });
  /** На товари: бюджет мінус доставка, якщо гість сказав рахувати її в суму */
  const goodsBudget = () => (S.shipIn ? S.budget - shipFor(S.budget - (D().price || 0)) : S.budget);

  /** Рядки набору з урахуванням людей, днів, ops і рішень гостя */
  function rowsFor(ops) {
    const set = SETS[S.set];
    const k = S.people / set.base, days = set.period ? S.days / 7 : 1;
    const rows = set.rows.map(x => ({ id: x.id, qty: Math.max(1, Math.round(x.q * (x.flat ? 1 : k) * days)) }));
    ops.forEach(op => {
      const [type, id] = op.split(':');
      const r = rows.find(x => x.id === id || x.from === id);
      if (!r) return;
      if (type === 'drop' && !S.keep.has(id)) r.drop = true; // гість повернув «що не вмістилось» — лишаємо
      if (type === 'swap') Object.assign(r, { from: id, id: CHEAP[id], hint: `замість ${GEN[id]}` });
      if (type === 'less') r.qty = Math.max(1, Math.ceil(r.qty / 2));
    });
    return rows;
  }
  /** ops, з якими набір влазить у суму; null — не влазить навіть найнеобхідніше */
  function fit() {
    const ops = [];
    // що вже в кошику, не рахуємо: у чернетці воно сіре «є в кошику»
    const sum = () => sumOf(rowsFor(ops).filter(r => !r.drop && !Cart.items.has(r.id)));
    for (const op of SETS[S.set].ops) {
      if (sum() <= goodsBudget()) break;
      ops.push(op);
    }
    return sum() <= goodsBudget() ? ops : null;
  }
  /** Скільки коштує найнеобхідніше (усі ops) — для «не вміщається» */
  const minimum = () => sumOf(rowsFor(SETS[S.set].ops).filter(r => !r.drop && !Cart.items.has(r.id)));

  /** Перебудувати чернетку з S.ops; гість сам сказав «не беру» чи замінив — не губимо */
  function build() {
    const old = new Map((S.rows || []).map(r => [r.from || r.id, r]));
    S.rows = rowsFor(S.ops).filter(r => !r.drop).map(r => {
      const key = r.from || r.id;
      const swap = S.swaps[key];
      const row = { id: swap || r.id, qty: r.qty, ...(swap ? { mark: 'new' } : r.hint ? { hint: r.hint } : {}) };
      if (key !== row.id) row.from = key;
      const o = old.get(key);
      if (Cart.items.has(row.id)) Object.assign(row, { off: true, offNote: 'є в кошику' });
      else if (o && o.off && !o.offNote) row.off = true;
      return row;
    });
  }
  const dropped = () => S.ops.filter(op => op.startsWith('drop:')).map(op => op.slice(5)).filter(id => !S.keep.has(id));

  /** Що змінили, щоб вкластися: «замінив філе на стегна; не вмістилось: кава» */
  function trimNote() {
    const swaps = S.ops.filter(op => op.startsWith('swap:')).map(op => op.slice(5));
    const less = S.ops.filter(op => op.startsWith('less:')).map(op => op.slice(5)).filter(id => !dropped().includes(id));
    const parts = [], out = dropped();
    // коротко: що саме замінили — видно в рядках («замість філе»), що не вмістилось — у «Що не вмістилось?»
    if (swaps.length === 1) parts.push(`замінив ${ACC[swaps[0]]} на ${ACC[CHEAP[swaps[0]]]}`);
    if (swaps.length > 1) parts.push(`${count(swaps.length, GOODS)} замінив на дешевші`);
    if (less.length) parts.push(`${join(less.map(id => NOM[id]))} — менше штук`);
    if (out.length && out.length <= 2) parts.push(`не вмістилось: ${join(out.map(id => NOM[id]))}`);
    if (out.length > 2) parts.push(`не вмістилось ще ${count(out.length, GOODS)}`);
    return parts.length ? ` Щоб вкластися, ${parts.join('; ')}.` : '';
  }

  /** Рядок припущень МГ */
  function ctx() {
    const c = [];
    if (S.peopleSource === 'assumption') c.push({ type: 'people', label: `на ${count(S.people, PEOPLEW)}`, source: 'assumption' });
    if (SETS[S.set].period && S.daysSource === 'assumption') c.push({ type: 'days', label: periodLabel(S.days), source: 'assumption' });
    if (!S.shipIn && !S.pickup) c.push({ type: 'ship', label: 'доставка понад суму', source: 'assumption' });
    return c;
  }
  /** Залишок у заголовку чернетки: рахується від того, що беремо, і змінюється зі степером */
  const badgeFor = budget => sum => (sum <= budget ? `лишається ${money(budget - sum)}` : `понад бюджет на ${money(sum - budget)}`);
  const draft = () => ({ title: `Чернетка: до ${money(S.budget)}`, badge: badgeFor(goodsBudget()), rows: S.rows,
                         rowAction: 'Замінити', addLabel: 'Додати в кошик', inCart: S.inCart });

  /** Мінімальне замовлення на доставку більше за суму — чесно: самовивіз безкоштовний */
  const pickupNote = () => {
    const min = D().min;
    S.pickup = Boolean(min && goodsBudget() < min);
    return S.pickup ? `Доставка — від ${money(min)}, тож у ${money(S.budget)} — самовивіз з магазину, він безкоштовний.` : null;
  };
  /** Дешевше: наступна рівноцінна заміна, якої ще немає */
  const nextSwap = () => SETS[S.set].ops.find(op => op.startsWith('swap:') && !S.ops.includes(op) && !S.swaps[op.slice(5)]);
  function chips() {
    if (S.inCart) return [];
    return [
      nextSwap() && node('Дешевше', cheaper),
      dropped().length && node('Що не вмістилось?', showDropped),
    ].filter(Boolean);
  }

  /* ---------- Відповіді ---------- */
  /** Зібрати під суму; patch — що відомо зі слів гостя */
  /** Зібрати під суму; patch — що відомо зі слів гостя */
  function start(patch = {}) {
    S = { set: 'week', budget: 1000, people: 1, peopleSource: 'assumption', days: 7, daysSource: 'assumption',
          shipIn: false, pickup: false, ops: [], keep: new Set(), swaps: {}, rows: [], inCart: false, ...patch };
    return compose(`Зібрав ${what()} у ${money(S.budget)}`);
  }
  /** «продукти на тиждень» / «вечерю на 2 людей» — для вступу */
  const what = (form = 'acc') => `${SETS[S.set][form]}${SETS[S.set].period ? ` ${periodLabel(S.days)}` : ''}`;
  /** Підібрати ops під суму і відповісти; не вміщається — стан «немає відповідних» */
  function compose(lead) {
    const ops = fit();
    if (!ops) return noFit();
    S.ops = ops;
    build();
    const left = goodsBudget() - total();
    const after = pickupNote(); // до ctx(): самовивіз прибирає припущення про доставку
    return {
      text: `${lead}: ${count(taken().length, GOODS)} на ${money(total())}, лишається ${money(left)}.${trimNote()}`,
      list: draft(), context: ctx(), after, chips: chips(),
    };
  }
  /** Навіть найнеобхідніше не вміщається: скільки бракує і два шляхи — більше грошей або менше днів (людей).
      Шлях застосовує ту саму спробу (нових людей, дні) разом зі своєю зміною */
  function noFit() {
    const need = minimum(), set = SETS[S.set], tried = { ...S };
    const up = roundUp(need + (S.shipIn ? shipFor(need) : 0));
    const via = (label, patch, lead) => node(label, () => { Object.assign(S, tried, patch, { keep: new Set() }); return compose(lead()); });
    let other = null;
    const paths = [via(`Підняти до ${money(up)}`, { budget: up }, () => `Зібрав ${what()} у ${money(up)}`)];
    if (set.period) {
      const d = [5, 4, 3, 2].find(x => { S.days = x; return minimum() <= goodsBudget(); });
      S.days = tried.days;
      if (d) other = 'на менше днів';
      if (d) paths.push(via(`На ${count(d, DAYW)}`, { days: d, daysSource: 'guest' }, () => `Зібрав ${what()} у ${money(S.budget)}`));
    }
    if (paths.length < 2 && S.people > 1) {
      const n = S.people - 1;
      other = 'на менше людей';
      paths.push(via(`На ${count(n, PEOPLEW)}`, { people: n, peopleSource: 'guest' }, () => `Перерахував на ${count(n, PEOPLEW)}`));
    }
    return {
      noFit: true,
      // без чернетки: «after» показується лише під результатом, тож шляхи — у тому ж повідомленні
      text: `У ${money(S.budget)} ${what('nom')} на ${count(S.people, PEOPLEW)} не ${set.fits}: навіть найнеобхідніше — ${money(need)}. Можу зібрати на більшу суму${other ? ` або ${other}` : ''}.`,
      chips: paths,
    };
  }
  /** Нова сума / люди / дні — перебираємо під неї. Не вміщається — чернетка лишається як була,
      а МГ каже, яку умову не виконати (шляхи вже враховують нову) */
  function change(patch, lead) {
    const prev = { ...S };
    Object.assign(S, patch, { keep: new Set() });
    const r = compose(typeof lead === 'function' ? lead() : lead);
    if (r.noFit) Object.assign(S, prev);
    return r;
  }
  const setBudget = v => change({ budget: v }, `Перерахував на ${money(v)}`);
  const setPeople = n => change({ people: n, peopleSource: 'guest' }, `Перерахував на ${count(n, PEOPLEW)}`);
  const setDays = d => change({ days: d, daysSource: 'guest' }, `Перерахував ${periodLabel(d)}`);
  const shipInside = () => change({ shipIn: true }, () => `Рахую доставку в суму — на товари ${money(goodsBudget())}`);

  /** «Дешевше» — одна рівноцінна заміна; решта як була */
  function cheaper() {
    const op = nextSwap();
    if (!op) {
      return { text: 'Рівноцінних дешевших замін більше немає. Можу прибрати щось — напиши, що не треба.', chips: [] };
    }
    const id = op.slice(5);
    const before = total();
    S.ops = [...S.ops, op];
    build();
    return {
      text: `Замінив ${ACC[id]} на ${ACC[CHEAP[id]]} — на ${money(before - total())} дешевше, решта без змін. Лишається ${money(goodsBudget() - total())}:`,
      list: draft(), context: ctx(), chips: chips(),
    };
  }
  /** Що не вмістилось — картки з «Додати» в чернетку (не в кошик: набір ще в чернетці) */
  function showDropped() {
    const left = goodsBudget() - total();
    return {
      text: 'Ось що не вмістилось. Додам у чернетку, якщо треба:',
      items: dropped().map(id => {
        const r = rowsFor([]).find(x => x.id === id), price = P(id).price * r.qty;
        return { id, noAdd: true, act: 'Додати', note: price <= left ? `${money(price)} — вміщається в залишок` : `${money(price)} — понад бюджет на ${money(price - left)}` };
      }),
    };
  }
  /** Гість повертає те, що не вмістилось: лише цей рядок, решта без змін (навіть якщо понад суму) */
  function keep(id) {
    S.keep.add(id);
    build();
    const left = goodsBudget() - total();
    return {
      text: `Додав ${ACC[id]} в чернетку — ${left >= 0 ? `лишається ${money(left)}` : `тепер понад бюджет на ${money(-left)}. Можна прибрати щось інше`}.`,
      list: draft(), context: ctx(), chips: chips(),
    };
  }

  function skip(ids) {
    ids.forEach(id => { const r = S.rows.find(x => x.id === id); if (r) { r.off = true; r.offNote = null; } });
    return { text: `Гаразд, ${join(ids.map(id => ACC[id] || P(id).shortName))} не беру. Лишається ${money(goodsBudget() - total())}:`, list: draft(), context: ctx(), chips: chips() };
  }

  /** Додати в кошик. Після — спільний крок, але не за бюджет: доплата до доставки — лише якщо вміщається */
  function addAll(rows) {
    const add = rows.filter(r => !r.off).map(r => ({ id: r.id, qty: r.qty }));
    if (!add.length) return null;
    add.forEach(r => Cart.add(r.id, r.qty));
    S.inCart = true;
    const sum = sumOf(add), left = goodsBudget() - sum;
    let f = Scenarios.nextStep({ scenario: 'budget' });
    if (f.kind === 'min' || (f.kind === 'delivery' && !(Scenarios.deliveryFor(Cart.total())?.left <= left))) f = { note: '', chip: { label: 'Оформити замовлення', go: 'cart' } };
    return {
      confirm: {
        text: `Додано в кошик: ${count(add.length, GOODS)} на ${money(sum)}`,
        undo: () => { add.forEach(r => Cart.add(r.id, -r.qty)); S.inCart = false; return { text: 'Скасував: прибрав їх із кошика.', list: draft(), chips: chips() }; },
      },
      text: `${left >= 0 ? `У межах бюджету, лишається ${money(left)}` : `Понад бюджет на ${money(-left)}`}${f.note}.${S.pickup ? ' На оформленні обери самовивіз.' : ''}`,
      chips: [f.chip].filter(Boolean),
    };
  }

  /** Не сказано, на що бюджет — одне питання; «Не знаю» — продукти на тиждень як припущення */
  function askPurpose(budget) {
    return {
      text: `На що ${money(budget)}? Від цього залежить, що брати.`,
      chips: [
        node('Продукти на тиждень', () => start({ budget, daysSource: 'guest' })),
        node('Вечеря на сьогодні', () => start({ budget, set: 'dinner', people: 2 })),
        node('Не знаю', () => start({ budget })),
      ],
    };
  }

  /* ---------- Своїми словами ---------- */
  const WORDS = {
    milk: ['молок'], eggs: ['яйц', 'яєць'], bread: ['хліб', 'батон'], cottage: ['кисломолоч'], cheese: ['гауд', 'сир'], cheeseBasic: ['сир'],
    chicken: ['філе', 'курк', 'курят'], chickenThigh: ['стегн', 'курк', 'курят'], spaghetti: ['спагеті', 'макарон'], pasta: ['ріжк', 'макарон'],
    buckwheat: ['греч'], tomatoesCan: ['томат', 'помідор'], saladLeaves: ['салат'], garlic: ['часник'], yogurtGreek: ['йогурт'],
    coffee: ['кав'], juice: ['сік', 'соку'],
  };
  const named = t => S.rows.filter(r => !r.off && (WORDS[r.id] || []).some(w => t.includes(w))).map(r => r.id);
  /** «1 000», «1000 грн», «500₴» → число; «10 днів», «3 людей» — не сума */
  const sumIn = t => {
    for (const m of t.matchAll(/(\d{1,3}(?:[\s ]\d{3})+|\d+)(?!\d)\s*(дн|день|тиж|люд|осіб|особ|шт)?/g)) {
      if (!m[2]) return Number(m[1].replace(/\D/g, ''));
    }
    return null;
  };
  const WORDN = { одн: 1, двох: 2, двоє: 2, трьох: 3, троє: 3, чотирьох: 4, четверо: 4, пʼятьох: 5, "п'ятьох": 5 };
  const peopleIn = t => {
    const m = t.match(/(\d+)\s*(люд|осіб|особ|чолов)/) || t.match(/на (\d+) (?!грн|₴|дн|день)/);
    if (m && Number(m[1]) < 10) return Number(m[1]);
    const w = Object.keys(WORDN).find(k => new RegExp(`(на|нас) ${k}`).test(t));
    return w ? WORDN[w] : (/на себе|для себе/.test(t) ? 1 : null);
  };
  const daysIn = t => (/два тижні|2 тижні/.test(t) ? 14 : /тиждень|тижня/.test(t) ? 7 : (t.match(/(\d+)\s*(дн|день)/) || [])[1] ? Number(t.match(/(\d+)\s*(дн|день)/)[1]) : null);
  const BUDGET = /бюджет|вклас|в межах|у межах|до \d|за \d|маю \d|є \d|\d+\s*(₴|грн|гривень)/;

  function route(t, last) {
    if (S && last && last.budget && !last.budgetAsk && !S.inCart) {
      if (/доставк/.test(t) && /(в|у) (сум|бюджет)|з доставкою|разом/.test(t)) return node(t, shipInside);
      if (/дешевш|дорого|ще менше/.test(t)) return node(t, cheaper);
      if (/не вміст|що ще|що лишилось/.test(t)) return node(t, showDropped);
      if (/не треба|не бер|прибер|без /.test(t) && named(t).length) { const ids = named(t); return node(t, () => skip(ids)); }
      // «салат не треба», а він і так не вмістився
      const out = dropped().filter(id => (WORDS[id] || []).some(w => t.includes(w)));
      if (/не треба|не бер|прибер|без /.test(t) && out.length) {
        return node(t, () => ({ text: `Цього й так немає в чернетці — ${join(out.map(id => NOM[id]))} не вмістилось. Решта без змін.`, chips: chips() }));
      }
      if (/додай все|в кошик|беру все/.test(t)) return node(t, () => addAll(S.rows) || { text: 'У чернетці нічого не обрано.' });
      // нові люди, дні й сума — разом, однією відповіддю («на 10 днів за 1500»)
      const n = peopleIn(t), d = daysIn(t), v = sumIn(t);
      const patch = {}, said = [];
      if (n && n !== S.people) { Object.assign(patch, { people: n, peopleSource: 'guest' }); said.push(`на ${count(n, PEOPLEW)}`); }
      if (d && SETS[S.set].period && d !== S.days) { Object.assign(patch, { days: d, daysSource: 'guest' }); said.push(periodLabel(d)); }
      if (v && v >= 100 && v !== S.budget) { patch.budget = v; said.push(`на ${money(v)}`); }
      if (said.length) return node(t, () => change(patch, `Перерахував ${join(said).replace(/ на /g, ' ')}`));
    }
    // відповідь на «На що бюджет?» своїми словами
    if (last && last.budgetAsk) {
      const v = last.budgetAsk;
      if (/вечер|сьогодні/.test(t)) return node(t, () => start({ budget: v, set: 'dinner', people: 2 }));
      if (/тижд|продукт|їж/.test(t)) return node(t, () => start({ budget: v, daysSource: 'guest' }));
      if (/не знаю|будь-що|що завгодно/.test(t)) return node(t, () => start({ budget: v }));
    }
    const v = sumIn(t);
    if (v && v >= 100 && BUDGET.test(t) && !/вино|витрат|брав|купував/.test(t)) {
      const patch = { budget: v };
      const n = peopleIn(t), d = daysIn(t);
      if (n) Object.assign(patch, { people: n, peopleSource: 'guest' });
      if (/вечер/.test(t)) return node(t, () => start({ ...patch, set: 'dinner', people: n || 2 }));
      if (d || /продукт|їж|покупк|кошик/.test(t)) return node(t, () => start({ ...patch, ...(d ? { days: d, daysSource: 'guest' } : {}) }));
      return { ...node(t, () => askPurpose(v)), budgetAsk: v };
    }
    return null;
  }

  Scenarios.define({
    id: 'budget',
    opener: node('Збери продукти на тиждень до 1 000 ₴', () => start({ daysSource: 'guest' })),
    cases: [
      { label: 'Сума й мета відомі', ask: 'Збери продукти на тиждень до 1 000 ₴' },
      { label: 'Не сказано, на що', ask: 'Маю 500 ₴, що купити?' },
      { label: 'Не вміщається', ask: 'Збери продукти на тиждень на трьох за 600 ₴' },
    ],
    route,
    removeCondition: type => {
      if (!S) return null;
      if (type === 'people') return node(`Змінити «на ${count(S.people, PEOPLEW)}»`, () => ({ text: 'На скільки людей?', chips: PEOPLE.filter(n => n !== S.people).map(n => node(`На ${count(n, PEOPLEW)}`, () => setPeople(n))) }));
      if (type === 'days') return node(`Змінити «${periodLabel(S.days)}»`, () => ({ text: 'На скільки днів?', chips: DAYS.filter(d => d !== S.days).map(d => node(periodLabel(d).replace(/^на/, 'На'), () => setDays(d))) }));
      if (type === 'ship') return node('Доставку теж у суму', shipInside);
      return null;
    },
    // заміна рядка — лише на те, що вміщається в залишок
    rowAction: id => (S && !S.inCart ? Scenarios.swapOffer({ scenario: 'budget', rows: S.rows, id, list: draft,
      allow: x => P(x).price - P(id).price <= goodsBudget() - total(),
      onSwap: (from, to) => { const r = S.rows.find(x => x.id === (to || from)); const key = (r && r.from) || from; if (to) S.swaps[key] = to; else delete S.swaps[key]; } }) : null),
    cardAction: id => Scenarios.swapCard(id) || (S && !S.inCart && dropped().includes(id) ? node(`Додай ${ACC[id]}`, () => keep(id)) : null),
    listAdd: rows => { const n = rows.filter(r => !r.off).length; return S && !S.inCart && n ? node(n === rows.length ? 'Додай усе в кошик' : `Додай ${count(n, GOODS)} в кошик`, () => addAll(rows)) : null; },
  });
})();
