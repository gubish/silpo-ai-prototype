/* =====================================================================
   СЦЕНАРІЙ «Історія покупок і чеків» (гілка Chats; працює і в C). Ситуації (cases), від найчастішої:
   «Яке вино я брав у серпні?» (знайти забуте), «Що з моїх звичних зараз по акції?», «Скільки я витратив за місяць?». За правилами docs/mg-dialog-rules.md:
   відповідь лише з чеків гостя — що, коли, скільки; період, якщо не названо, — «останні 30 днів»
   як припущення з «×» (→ 7 днів / 30 днів / 3 місяці).
   • «Скільки я витратив за місяць?» → сума, кількість чеків, доставки / магазин; чеки рядками.
   • «Коли я востаннє купував каву?» → дата, як (доставка / магазин), скільки + картка товару.
   • «Що я купую найчастіше?» → карусель з «N разів за 2 місяці» (вибір одного — «+» на картці).
   • «Повтори останнє замовлення» / «Повторити від 28 вересня» → чернетка з чека, яку можна правити.
   • Без оцінок і чутливих висновків: «я багато витрачаю?» → лише цифри, без суджень.
   Дані: RECEIPTS нижче — умовні чеки за 2 місяці, дати рахуються від сьогодні (демо не старіє).
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Чеки гостя (умовні): days — скільки днів тому; доставка щотижня + кілька покупок у магазині ---------- */
  const WEEKLY = [['milk', 2], ['bread', 1], ['banana', 2], ['water15', 4], ['tomatoes', 1], ['cheese', 2], ['grapesRed', 1]];
  const RECEIPTS = [
    ...[7, 14, 21, 28, 35, 42, 49, 56].map(d => ({
      days: d, type: 'delivery',
      items: [...WEEKLY,
        ...(d % 14 === 0 ? [['eggs', 1]] : []),
        ...(d === 28 || d === 56 ? [['coffee', 1], ['hellmanns', 1]] : []),
        ...(d === 35 ? [['pistachios', 1]] : []),
        ...(d === 56 ? [['wineMalbec', 1]] : []), ...(d === 21 ? [['wineCasa', 1]] : [])],
    })),
    { days: 3,  type: 'store', items: [['bread', 1], ['banana', 1]] },
    { days: 18, type: 'store', items: [['marshmallow', 2], ['pistachios', 1]] },
    { days: 40, type: 'store', items: [['oliveOil', 1], ['peach', 1]] },
  ].sort((a, b) => a.days - b.days);
  const MONTHS_LOC = ['січні', 'лютому', 'березні', 'квітні', 'травні', 'червні', 'липні', 'серпні', 'вересні', 'жовтні', 'листопаді', 'грудні'];
  const MONTH_STEMS = ['січн', 'лют', 'берез', 'квіт', 'травн', 'червн', 'липн', 'серпн', 'вересн', 'жовтн', 'листопад', 'грудн'];
  const monthIdx = days => { const d = new Date(); d.setDate(d.getDate() - days); return d.getMonth(); };
  const PERIODS = { 7: { label: 'за останні 7 днів', chip: '7 днів' }, 30: { label: 'за останні 30 днів', chip: '30 днів' }, 90: { label: 'за 3 місяці', chip: '3 місяці' } };

  const P = id => DATA.products[id];
  const money = v => UI.money(v).replace('.00', '');
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const WINE_SHORT = { wineMalbec: 'вино Malbec', wineCasa: 'вино Vinho Verde', winePascal: 'вино Chablis', wineLail: 'вино Lail' }; // повна назва вина задовга для чіпа
  const nameOf = id => WINE_SHORT[id] || lc(P(id).shortName || P(id).name);
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];
  const CHECKS = ['чек', 'чеки', 'чеків'];
  const TIMES = ['раз', 'рази', 'разів'];
  const MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];
  const dateOf = days => { const d = new Date(); d.setDate(d.getDate() - days); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
  const ago = d => (d === 0 ? 'сьогодні' : d === 1 ? 'вчора' : `${count(d, ['день', 'дні', 'днів'])} тому`);
  const sumOf = r => r.items.reduce((s, [id, q]) => s + (P(id) ? P(id).price * q : 0), 0);
  const how = r => (r.type === 'delivery' ? 'доставка' : 'у магазині');
  const node = (label, run) => ({ label, scenario: 'history', history: true, run });

  /* ---------- Стан ---------- */
  let S = null;
  const fresh = () => ({ period: 30, periodSource: 'assumption', rows: [], inCart: false, from: null });
  const ensure = () => { if (!S) S = fresh(); };
  const inPeriod = () => RECEIPTS.filter(r => r.days <= S.period && r.items.some(([id]) => P(id)));
  const ctx = () => (S.periodSource === 'assumption' ? [{ type: 'period', label: PERIODS[S.period].label, source: 'assumption' }] : []);
  /** Чеки рядками, коротко, щоб не переносились: «28 вересня · доставка · 1 920 ₴» */
  const lines = list => list.map(r => `${dateOf(r.days)} · ${r.type === 'delivery' ? 'доставка' : 'магазин'} · ${money(sumOf(r))}`).join('\n');
  const lastDelivery = () => RECEIPTS.find(r => r.type === 'delivery');

  /* ---------- Відповіді ---------- */
  function spent() {
    ensure();
    const list = inPeriod(), total = list.reduce((s, r) => s + sumOf(r), 0);
    const del = list.filter(r => r.type === 'delivery').length, store = list.length - del;
    const big = [...list].sort((a, b) => sumOf(b) - sumOf(a))[0];
    return {
      text: `${cap(PERIODS[S.period].label)} — ${count(list.length, CHECKS)} на ${money(total)}: `
        + `${[del && count(del, ['доставка', 'доставки', 'доставок']), store && `${store} у магазині`].filter(Boolean).join(' і ')}.`
        + (big && list.length > 1 ? ` Найбільший — ${money(sumOf(big))}, ${dateOf(big.days)}.` : '')
        // чеки рядками під підсумком (без карток — це не товари)
        + '\n\n' + lines(list.slice(0, 6)) + (list.length > 6 ? `\n…і ще ${count(list.length - 6, CHECKS)}` : ''),
      context: ctx(),
      chips: [node('Що я купую найчастіше?', frequent), node('Повтори останнє замовлення', () => repeat(lastDelivery()))],
    };
  }
  const cap = s => s.charAt(0).toLocaleUpperCase('uk-UA') + s.slice(1);

  function setPeriod(p) {
    S.period = p; S.periodSource = 'guest';
    return spent();
  }

  /** «Коли я востаннє купував X?» */
  function lastBought(id) {
    ensure();
    const r = RECEIPTS.find(x => x.items.some(([i]) => i === id));
    if (!r) return { text: `У твоїх чеках за 2 місяці ${nameOf(id)} немає — можливо, купував раніше чи з іншої картки.`, chips: [] };
    const [, q] = r.items.find(([i]) => i === id);
    const times = RECEIPTS.filter(x => x.items.some(([i]) => i === id)).length;
    return {
      text: `${cap(ago(r.days))}, ${dateOf(r.days)} — ${how(r)}: ${nameOf(id)}, ${q} шт. За 2 місяці — ${count(times, TIMES)}.`,
      items: [{ id }],
      chips: [node(`Повторити покупку від ${dateOf(r.days)}`, () => repeat(r))],
    };
  }

  const isWine = id => /^wine/.test(id);
  const freqOf = id => RECEIPTS.filter(r => r.items.some(([i]) => i === id)).length;
  const howOften = n => (n >= 6 ? 'береш щотижня' : n >= 3 ? 'береш кілька разів на місяць' : `брав ${count(n, TIMES)} за 2 місяці`);

  /** «Яке вино я брав у серпні?» — знайти забутий товар у чеках; місяць — якщо названо */
  function wine(month) {
    ensure();
    const found = RECEIPTS.filter(r => month == null || monthIdx(r.days) === month)
      .flatMap(r => r.items.filter(([id]) => isWine(id) && P(id)).map(([id, q]) => ({ id, q, r })));
    if (!found.length) {
      const any = RECEIPTS.flatMap(r => r.items.filter(([id]) => isWine(id) && P(id)).map(([id]) => ({ id, r })))[0];
      return {
        text: `У ${MONTHS_LOC[month]} вина в твоїх чеках немає.${any ? ` Останнє — ${dateOf(any.r.days)}: ${nameOf(any.id)}.` : ''}`,
        items: any ? [{ id: any.id }] : [],
      };
    }
    const f = found[0];
    if (found.length === 1) {
      return {
        text: `${cap(dateOf(f.r.days))}, ${how(f.r)}: ${nameOf(f.id)}, ${f.q} шт. Зараз — ${money(P(f.id).price)}.`,
        items: [{ id: f.id }],
        chips: [node(`Додати ${nameOf(f.id)}`, () => addOne(f.id))],
      };
    }
    return {
      text: `Вина в чеках — ${count(found.length, ['раз', 'рази', 'разів'])}. Ось які:`,
      items: found.map(x => ({ id: x.id, note: `${dateOf(x.r.days)} · ${how(x.r)}` })),
    };
  }
  function addOne(id) {
    Cart.add(id, 1);
    const f = Scenarios.nextStep({ scenario: 'history' });
    return {
      confirm: { text: `Додано: ${nameOf(id)}, 1 шт`, undo: () => { Cart.add(id, -1); return { text: `Скасував: ${nameOf(id)} прибрав з кошика.` }; } },
      text: `У кошику на ${money(Cart.total())}${f.note}.`,
      chips: [f.chip].filter(Boolean),
    };
  }

  /** «Що з моїх звичних зараз по акції?» — те, що гість бере регулярно (2+ чеки) і що зараз зі знижкою */
  function usualSale() {
    ensure();
    const ids = [...new Set(RECEIPTS.flatMap(r => r.items.map(([id]) => id)))]
      .filter(id => P(id) && P(id).oldPrice && freqOf(id) >= 2 && !isWine(id)) // алкоголь сам не пропонуємо
      .sort((a, b) => freqOf(b) - freqOf(a));
    if (!ids.length) return { text: 'З твоїх звичних зараз нічого не зі знижкою.', chips: [node('Скільки я витратив за місяць?', () => { S = fresh(); return spent(); })] };
    const off = id => P(id).discount || Math.round((1 - P(id).price / P(id).oldPrice) * 100); // знижка — як на цінникові
    return {
      text: `З того, що ти береш регулярно, зараз дешевше ${count(ids.length, GOODS)}: ${ids.map(id => `${nameOf(id)} −${off(id)}%`).join(', ')}.`,
      items: ids.map((id, i) => ({ id, note: cap(howOften(freqOf(id))), pick: i === 0 })), // знижка вже на цінникові картки
      chips: [node('Скільки я витратив за місяць?', () => { S = fresh(); return spent(); })],
    };
  }

  /** «Що я купую найчастіше?» — лише факти: що й скільки разів */
  function frequent() {
    ensure();
    const n = {};
    RECEIPTS.forEach(r => r.items.forEach(([id]) => { if (P(id)) n[id] = (n[id] || 0) + 1; }));
    const top = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 5);
    return {
      text: `Найчастіше за 2 місяці — ${nameOf(top[0][0])}: ${count(top[0][1], TIMES)}. Ось пʼятірка:`,
      items: top.map(([id, k], i) => ({ id, note: `${cap(count(k, TIMES))} за 2 місяці`, pick: i === 0 })),
      chips: [node('Повтори останнє замовлення', () => repeat(lastDelivery()))],
    };
  }

  /** Повторити чек → чернетка (не одразу в кошик): можна правити */
  function repeat(r) {
    ensure();
    S.from = r; S.inCart = false;
    S.rows = r.items.filter(([id]) => P(id)).map(([id, qty]) => ({ id, qty, ...(Cart.items.has(id) ? { off: true, offNote: 'є в кошику' } : {}) }));
    const sum = S.rows.filter(x => !x.off).reduce((s, x) => s + P(x.id).price * x.qty, 0);
    return {
      text: `Чек від ${dateOf(r.days)} (${how(r)}): ${count(S.rows.length, GOODS)}, за поточними цінами — ${money(sum)}. Що не треба — прибери:`,
      list: draft(),
    };
  }
  const draft = () => ({ title: `Чернетка: як ${dateOf(S.from.days)}`, rows: S.rows, rowAction: 'Замінити', addLabel: 'Додати в кошик', inCart: S.inCart });

  function addAll(rows) {
    const add = rows.filter(r => !r.off).map(r => ({ id: r.id, qty: r.qty }));
    if (!add.length) return null;
    add.forEach(r => Cart.add(r.id, r.qty));
    S.inCart = true;
    const f = Scenarios.nextStep({ scenario: 'history' });
    return {
      confirm: {
        text: `Додано в кошик: ${count(add.length, GOODS)} з чека від ${dateOf(S.from.days)}`,
        undo: () => { add.forEach(r => Cart.add(r.id, -r.qty)); S.inCart = false; return { text: 'Скасував: прибрав їх із кошика.', list: draft() }; },
      },
      text: `У кошику на ${money(Cart.total())}${f.note}.`,
      chips: [f.chip].filter(Boolean),
    };
  }

  /** Оцінки й висновки про гостя — не робимо: лише цифри */
  function noJudgement() {
    ensure();
    const list = inPeriod(), total = list.reduce((s, r) => s + sumOf(r), 0);
    return {
      text: `Оцінювати не буду — це твоє рішення. Цифри: ${PERIODS[S.period].label} ${money(total)}, у середньому ${money(total / Math.max(1, list.length))} за чек.`,
      chips: [node('Що я купую найчастіше?', frequent)],
    };
  }

  /* ---------- Своїми словами ---------- */
  const WORDS = {
    coffee: ['кав'], milk: ['молок'], bread: ['хліб', 'батон'], banana: ['банан'], water15: ['вод'], tomatoes: ['помідор'],
    cheese: ['сир'], grapesRed: ['виноград'], eggs: ['яйц', 'яєць'], hellmanns: ['майонез'], pistachios: ['фісташ'],
    marshmallow: ['маршмел'], oliveOil: ['олі'], peach: ['персик'],
  };
  const productOf = t => Object.keys(WORDS).find(id => WORDS[id].some(w => t.includes(w)));
  function route(t, last) {
    const inTalk = S && last && last.history;
    if (/вин/.test(t) && /брав|купував|пили|замовляв|в чек/.test(t)) {
      const m = MONTH_STEMS.findIndex(st => t.includes(st));
      return node(t, () => wine(m >= 0 ? m : null));
    }
    if (/акці|знижк|дешевш/.test(t) && /звичн|що я беру|що я купую|моїх|регулярн/.test(t)) return node(t, usualSale);
    if (/багато витрача|забагато|нормально витрача|що це каже про мене|я транжир|економн/.test(t)) return node(t, noJudgement);
    if (inTalk) {
      if (/7 дн|тиждень/.test(t)) return node(t, () => setPeriod(7));
      if (/3 місяц|три місяц|квартал/.test(t)) return node(t, () => setPeriod(90));
      if (/30 дн|місяць/.test(t)) return node(t, () => setPeriod(30));
      if (/додай|в кошик/.test(t) && S.rows.length && !S.inCart) return node(t, () => addAll(S.rows) || { text: 'У чернетці нічого не обрано.' });
    }
    if (/витрат|витрачаю|скільки .*чек|мої чеки|історі.* покуп/.test(t)) return node(t, spent);
    if (/коли .*(купув|брав|замовля)|востаннє/.test(t)) { const id = productOf(t); if (id && P(id)) return node(t, () => lastBought(id)); }
    if (/найчастіше|що я купую|що я беру/.test(t)) return node(t, frequent);
    if (/повтори|як минулого|минуле замовлення|останнє замовлення/.test(t)) return node(t, () => repeat(lastDelivery()));
    return null;
  }

  Scenarios.define({
    id: 'history',
    opener: node(`Яке вино я брав у ${MONTHS_LOC[monthIdx(56)]}?`, () => { S = fresh(); return wine(monthIdx(56)); }),
    cases: [
      { label: `Яке вино я брав у ${MONTHS_LOC[monthIdx(56)]}?`, ask: `Яке вино я брав у ${MONTHS_LOC[monthIdx(56)]}?` },
      { label: 'Що з моїх звичних зараз по акції?', ask: 'Що з моїх звичних зараз по акції?' },
      { label: 'Скільки я витратив за місяць?', ask: 'Скільки я витратив за місяць?' },
    ],
    route,
    removeCondition: type => (S && type === 'period' ? node(`Змінити «${PERIODS[S.period].label}»`, () => ({ text: 'За який період?', chips: Object.entries(PERIODS).map(([p, x]) => node(x.chip, () => setPeriod(Number(p)))) })) : null),
    rowAction: id => (S && !S.inCart ? Scenarios.swapOffer({ scenario: 'history', rows: S.rows, id, list: draft }) : null),
    cardAction: id => Scenarios.swapCard(id),
    listAdd: rows => (S && !S.inCart ? node(rows.every(r => !r.off) ? 'Додай усе в кошик' : `Додай ${count(rows.filter(r => !r.off).length, GOODS)} в кошик`, () => addAll(rows)) : null),
  });
})();
