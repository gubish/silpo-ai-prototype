/* =====================================================================
   СЦЕНАРІЙ «Список покупок із фото» (гілка Chats; працює і в C). За правилами docs/mg-dialog-rules.md.
   • Гість надсилає фото рукописного списку (камера в полі вводу або старт сценарію) →
     МГ одразу показує розпізнаний список чернеткою: рядок списку → товар.
   • Невпевнений рядок позначено («сир» — який?) і стоїть першим здогадом; під списком — ОДНЕ
     питання саме про нього з чіпсами. Решта рядків не чекає відповіді.
   • Товару зі списку немає (кава Lavazza) — схожий з позначкою «замість Lavazza» і одне речення.
   • Що вже в кошику — одразу сіре «є в кошику»: не купуємо вдруге.
   • Рядок можна прибрати (мінус / кошик → «не беру»), змінити кількість або замінити (іконка →
     варіанти з «Замінити»). «Додати в кошик» → «✓ Додано · Скасувати» і один крок.
   Демо: фото — assets/images/demo/shopping-list.svg, товари — tools/make-demo-list.py.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Демо-товари ---------- */
  const DEMO = {
    milk:      { name: 'Молоко 2,5%, 900 г', short: 'молоко 2,5%', price: 42, weight: '900 г' },
    milk32:    { name: 'Молоко 3,2%, 900 г', short: 'молоко 3,2%', price: 46, weight: '900 г' },
    bread:     { name: 'Батон нарізний, 450 г', short: 'батон', price: 33, weight: '450 г' },
    eggs:      { name: 'Яйця курячі С1, 10 шт', short: 'яйця', price: 64, weight: '10 шт' },
    cheese:    { name: 'Сир твердий Гауда 45%, 200 г', short: 'твердий сир', price: 119, weight: '200 г' },
    cottage:   { name: 'Сир кисломолочний 5%, 350 г', short: 'кисломолочний сир', price: 72, weight: '350 г' },
    processed: { name: 'Сир плавлений вершковий, 90 г', short: 'плавлений сир', price: 28, weight: '90 г' },
    coffee:    { name: 'Кава мелена арабіка, 250 г', short: 'кава мелена арабіка', price: 189, weight: '250 г' },
  };
  Object.entries(DEMO).forEach(([id, d]) => {
    DATA.products[id] = { name: d.name, shortName: d.name.replace(/, [^,]+$/, ''), price: d.price, weight: d.weight,
                          image: `assets/images/products/demo/list-${id}.svg` };
    DATA.pdp.products[id] = {};
  });

  /* ---------- Що «розпізнано» на фото ----------
     line — як написано; id — товар; ask — невпевнений рядок (питаємо); missing — такого товару немає,
     підібрано схожий; qty — кількість, якщо написана (яйця 10 = одна упаковка на 10). */
  const PHOTO = 'assets/images/demo/shopping-list.svg';
  const LINES = [
    { line: 'молоко', id: 'milk' },
    { line: 'хліб', id: 'bread' },
    { line: 'яйця 10', id: 'eggs' },
    { line: 'сир', id: 'cheese', ask: true },
    { line: 'банани', id: 'banana' },
    { line: 'помідори', id: 'tomatoes' },
    { line: 'кава Lavazza', id: 'coffee', missing: 'Lavazza' },
    { line: 'майонез', id: 'hellmanns' },
  ];
  // «сир» — який: варіанти для питання і для заміни
  const CHEESE = { cheese: 'Твердий', cottage: 'Кисломолочний', processed: 'Плавлений' };
  // чим можна замінити рядок (іконка заміни); note — чим відрізняється
  const ALT = {
    milk: [{ id: 'milk32', note: 'Жирніше: 3,2% замість 2,5%' }],
    milk32: [{ id: 'milk', note: 'Легше: 2,5% замість 3,2%' }],
    cheese: [{ id: 'cottage', note: 'Кисломолочний — до сирників' }, { id: 'processed', note: 'Плавлений — на бутерброди' }],
    cottage: [{ id: 'cheese', note: 'Твердий — до бутербродів і пасти' }, { id: 'processed', note: 'Плавлений — на бутерброди' }],
    processed: [{ id: 'cheese', note: 'Твердий — Гауда' }, { id: 'cottage', note: 'Кисломолочний — до сирників' }],
  };

  const T = {
    opener: 'Ось мій список',
    title: 'Чернетка: список із фото',
    askCheese: '«Сир» — який саме? Поставив твердий, але можу інший.',
    checkout: 'Оформити замовлення',
  };

  const P = id => DATA.products[id];
  const money = v => UI.money(v).replace('.00', '');
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const nameOf = id => (DEMO[id] ? DEMO[id].short : lc(P(id).shortName || P(id).name));
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];
  const list = ids => ids.map(nameOf).reduce((s, n, i, a) => s + (i === 0 ? n : i === a.length - 1 ? ` і ${n}` : `, ${n}`), '');

  /* ---------- Стан ---------- */
  let S = null;
  const taken = () => S.rows.filter(r => !r.off);
  const total = () => taken().reduce((s, r) => s + P(r.id).price * r.qty, 0);
  const node = (label, run) => ({ label, scenario: 'photo-list', photoList: true, run });
  const askRow = () => S.rows.find(r => r.mark === 'ask');

  function draft() {
    return { title: T.title, rows: S.rows, rowAction: 'Замінити', addLabel: 'Додати в кошик', inCart: S.inCart };
  }
  const cheeseChips = () => Object.entries(CHEESE).map(([id, l]) => node(l, () => pickCheese(id)));

  /* ---------- Відповіді ---------- */
  function start() {
    S = { rows: [], inCart: false, target: null };
    S.rows = LINES.map(x => ({
      id: x.id, qty: 1, line: x.line,
      ...(x.ask ? { mark: 'ask', hint: `«${x.line}» — який?` } : {}),
      ...(x.missing ? { hint: `замість ${x.missing}` } : {}),
      ...(Cart.items.has(x.id) ? { off: true, offNote: 'є в кошику' } : {}),
    }));
    const inCart = S.rows.filter(r => r.offNote);
    const missing = LINES.find(x => x.missing);
    const lead = `Розібрав список: ${count(taken().length, GOODS)} на ${money(total())}.`
      + (inCart.length ? ` ${cap(list(inCart.map(r => r.id)))} вже в кошику — не рахую.` : '');
    return {
      text: lead,
      list: draft(),
      // порада під списком: спершу питання про невпевнений рядок (одне), відсутній товар — у тексті
      after: `${missing ? `${missing.missing} зараз немає — поставив схожу мелену арабіку. ` : ''}${T.askCheese}`,
      chips: cheeseChips(),
    };
  }
  const cap = s => s.charAt(0).toLocaleUpperCase('uk-UA') + s.slice(1);

  /** Відповідь на питання «сир — який?»: міняємо лише цей рядок */
  function pickCheese(id) {
    const row = askRow() || S.rows.find(r => CHEESE[r.id]);
    if (!row) return null;
    const was = row.id;
    row.id = id; row.mark = was === id ? null : 'new'; row.hint = null;
    return {
      text: `${was === id ? 'Лишаю' : 'Поставив'} ${nameOf(id)}. Решта списку без змін — ${count(taken().length, GOODS)} на ${money(total())}:`,
      list: draft(),
    };
  }

  /** Іконка заміни в рядку → варіанти з «Замінити» */
  function offer(id) {
    S.target = id;
    const alts = ALT[id] || [];
    const row = S.rows.find(r => r.id === id);
    if (!alts.length) {
      return {
        text: `Чесно: замінити ${nameOf(id)} поки нічим — іншого такого товару зараз немає. Можу не брати.`,
        chips: [node(`Не брати ${nameOf(id)}`, () => skip([id])), node(`Лишити ${nameOf(id)}`, () => ({ text: 'Гаразд, лишаю. Решта без змін:', list: draft() }))],
      };
    }
    return {
      text: `Чим замінити ${nameOf(id)}${row && row.line ? ` (у списку — «${row.line}»)` : ''}?`,
      items: alts.map((a, i) => {
        const d = P(a.id).price - P(id).price;
        return { id: a.id, note: `${a.note} · ${d < 0 ? `на ${money(-d)} дешевше` : d > 0 ? `на ${money(d)} дорожче` : 'та сама ціна'}`, pick: i === 0, noAdd: true, act: 'Замінити' };
      }),
      chips: [node(`Лишити ${nameOf(id)}`, () => { S.target = null; return { text: 'Гаразд, лишаю. Решта без змін:', list: draft() }; })],
    };
  }

  function replace(from, to) {
    const row = S.rows.find(r => r.id === from);
    if (!row) return null;
    const prev = { id: row.id, mark: row.mark, hint: row.hint };
    row.id = to; row.mark = 'new'; row.hint = null;
    S.target = null;
    return {
      confirm: {
        text: `Замінено в чернетці: ${nameOf(from)} → ${nameOf(to)}`,
        undo: () => { Object.assign(row, prev); return { text: `Скасував: повернув ${nameOf(from)}.`, list: draft() }; },
      },
      text: `Решта без змін — ${count(taken().length, GOODS)} на ${money(total())}:`,
      list: draft(),
    };
  }

  /** «Не треба X» словами — те саме, що прибрати рядок */
  function skip(ids) {
    ids.forEach(id => { const r = S.rows.find(x => x.id === id); if (r) { r.off = true; r.offNote = null; } });
    S.target = null;
    return { text: `Гаразд, ${list(ids)} не беру. Тепер ${count(taken().length, GOODS)} на ${money(total())}:`, list: draft() };
  }

  function addAll(rows) {
    const add = rows.filter(r => !r.off).map(r => ({ id: r.id, qty: r.qty }));
    if (!add.length) return null;
    add.forEach(r => Cart.add(r.id, r.qty));
    S.inCart = true;
    return {
      confirm: {
        text: `Додано в кошик: ${count(add.length, GOODS)} зі списку`,
        undo: () => { add.forEach(r => Cart.add(r.id, -r.qty)); S.inCart = false; return { text: 'Скасував: прибрав список із кошика.', list: draft() }; },
      },
      ...(() => { const f = Scenarios.nextStep({ scenario: 'photo-list' }); // мінімальне замовлення, доставка або «Оформити»
        return { text: `У кошику на ${money(Cart.total())}${f.note}.`, chips: [f.chip].filter(Boolean) }; })(),
    };
  }

  /* ---------- Своїми словами ---------- */
  const WORDS = {
    milk: ['молок'], milk32: ['молок'], bread: ['хліб', 'батон'], eggs: ['яй'], cheese: ['сир'], cottage: ['сир'], processed: ['сир'],
    banana: ['банан'], tomatoes: ['помідор', 'томат'], coffee: ['кав'], hellmanns: ['майонез'],
  };
  const named = t => S.rows.filter(r => (WORDS[r.id] || []).some(w => t.includes(w))).map(r => r.id);

  function route(t, last) {
    if (S && last && last.photoList) {
      if (/кисломол|творог|домашн|сирник/.test(t)) return node(t, () => pickCheese('cottage'));
      if (/плавлен/.test(t)) return node(t, () => pickCheese('processed'));
      if (/тверд|гауд|голланд|звичайн/.test(t) && /сир|тверд|гауд/.test(t)) return node(t, () => pickCheese('cheese'));
      if (/не треба|не бер|прибер|без |вже є|маю/.test(t) && named(t).length) { const ids = named(t); return node(t, () => skip(ids)); }
      if (/додай|в кошик|беру все|усе|все/.test(t)) return node(t, () => addAll(S.rows) || { text: 'У списку нічого не обрано.' });
      if (/замін|інш/.test(t) && named(t).length === 1) { const id = named(t)[0]; return node(t, () => offer(id)); }
    }
    if (/список|фото|сфотограф/.test(t)) return node(t, start);
    return null;
  }

  Scenarios.define({
    id: 'photo-list',
    opener: { ...node(T.opener, start), photo: PHOTO },
    route,
    rowAction: id => (S && !S.inCart ? node(`Заміни ${nameOf(id)}`, () => offer(id)) : null),
    cardAction: id => (S && S.target ? node(`Заміни на ${nameOf(id)}`, (from => () => replace(from, id))(S.target)) : null),
    listAdd: rows => (S && !S.inCart ? node(taken().length === rows.length ? 'Додай усе в кошик' : `Додай ${count(taken().length, GOODS)} в кошик`, () => addAll(rows)) : null),
  });
})();
