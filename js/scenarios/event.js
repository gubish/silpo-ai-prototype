/* =====================================================================
   СЦЕНАРІЙ «Кошик під подію» (гілка Chats; працює і в C). За правилами docs/mg-dialog-rules.md.
   • «Збери кошик на вечірку» → одразу чернетка з явними припущеннями МГ у рядку припущень:
     «на 6 людей» (× → На 4 / 6 / 10) і «фуршет» (× → Фуршет / Солодкий стіл). Кількості — під людей.
   • Одне питання — лише критичне: «Будуть діти або хтось з алергією?» з чіпсами.
     Діти → додаємо дитяче (позначка «для дітей»). Алергія → «На що?» → прибираємо за складом
     і маркуванням, разом із «може містити сліди»; рядок сіріє з причиною. Критичне діє до кінця
     розмови: нові люди чи формат — той самий фільтр. МГ не дає медичних порад, лише склад.
   • Алкоголь МГ сам не пропонує (правило «Чого МГ ніколи не робить»).
   • «Додати в кошик» → «✓ Додано · Скасувати» і спільний наступний крок.
   Дані: набори SETS і склад ALLERGENS нижче; частина товарів — зі сценаріїв «Рецепти» і «Список із фото».
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Нові товари ---------- */
  const NEW = {
    juice:  { name: 'Сік яблучний, 1 л', short: 'сік', price: 59, weight: '1 л', comp: 'Яблучний сік відновлений.', allergens: 'не містить' },
    crisps: { name: 'Чипси картопляні з сіллю, 150 г', short: 'чипси', price: 54, weight: '150 г', comp: 'Картопля, олія соняшникова, сіль.', allergens: 'може містити сліди горіхів і глютену' },
  };
  Object.entries(NEW).forEach(([id, d]) => {
    DATA.products[id] = { name: d.name, shortName: d.name.replace(/, [^,]+$/, ''), price: d.price, weight: d.weight,
                          image: `assets/images/products/demo/list-${id}.svg` };
    DATA.pdp.products[id] = { composition: { text: d.comp, allergens: { label: 'Алергени:', value: d.allergens } } };
  });

  /* ---------- Склад: що містить (contains) і «може містити сліди» (trace) ----------
     Для критичних обмежень рахуються обидва. Немає в мапі — алергенів за маркуванням немає. */
  const ALLERGENS = {
    pistachios: { contains: ['nuts'] },
    walnuts:    { contains: ['nuts'] },
    crisps:     { trace: ['nuts', 'gluten'] },
    cheese:     { contains: ['lactose'] },
    blueCheese: { contains: ['lactose'] },
    bread:      { contains: ['gluten'] },
    bakoma:     { trace: ['soy'] },
  };
  const ALLERGY = {
    nuts:    { chip: 'Горіхи', word: 'горіхи', acc: 'горіхи', gen: 'горіхів' },
    lactose: { chip: 'Лактоза', word: 'лактоза', acc: 'лактозу', gen: 'лактози' },
    gluten:  { chip: 'Глютен', word: 'глютен', acc: 'глютен', gen: 'глютену' },
  };

  /* ---------- Набори на 6 людей (q) ---------- */
  const BASE = 6;
  const SETS = {
    buffet: {
      label: 'фуршет', gen: 'фуршету', chip: 'Фуршет',
      rows: [
        { id: 'cheese', q: 2 }, { id: 'olives', q: 1 }, { id: 'grapesRed', q: 2 }, { id: 'pistachios', q: 1 },
        { id: 'crisps', q: 2 }, { id: 'bread', q: 1 }, { id: 'water15', q: 3 }, { id: 'juice', q: 2 },
      ],
    },
    sweet: {
      label: 'солодкий стіл', gen: 'солодкого столу', chip: 'Солодкий стіл',
      rows: [
        { id: 'marshmallow', q: 2 }, { id: 'bakoma', q: 3 }, { id: 'grapes', q: 2 }, { id: 'banana', q: 2 },
        { id: 'appleGolden', q: 2 }, { id: 'juice', q: 2 }, { id: 'water15', q: 2 },
      ],
    },
  };
  const KIDS = [{ id: 'juice', q: 1 }, { id: 'marshmallow', q: 1 }, { id: 'banana', q: 1 }];
  const PEOPLE = [4, 6, 10];

  const T = {
    opener: 'Збери кошик на вечірку',
    title: 'Чернетка: на вечірку',
    ask: 'Будуть діти або хтось з алергією? Від цього залежить, що прибрати.',
    kidsHint: 'для дітей',
  };

  const P = id => DATA.products[id];
  const money = v => UI.money(v).replace('.00', '');
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const nameOf = id => (NEW[id] ? NEW[id].short : lc(P(id).shortName || P(id).name));
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const GOODS = ['товар', 'товари', 'товарів'];
  const PEOPLEW = ['людину', 'людей', 'людей'];
  const list = ids => ids.map(nameOf).reduce((s, n, i, a) => s + (i === 0 ? n : i === a.length - 1 ? ` і ${n}` : `, ${n}`), '');

  /* ---------- Стан ---------- */
  let S = null;
  const taken = () => S.rows.filter(r => !r.off);
  const total = () => taken().reduce((s, r) => s + P(r.id).price * r.qty, 0);
  const node = (label, run) => ({ label, scenario: 'event', event: true, run });
  const scale = q => Math.max(1, Math.round(q * S.people / BASE));

  /** Причина, чому товар не можна при алергії: «містить горіхи» / «можуть бути сліди горіхів» */
  const hits = (id, k) => { const a = ALLERGENS[id] || {}; return (a.contains || []).includes(k) || (a.trace || []).includes(k); };
  function blocked(id) {
    const a = ALLERGENS[id] || {};
    for (const k of S.allergy) {
      if ((a.contains || []).includes(k)) return `містить ${ALLERGY[k].acc}`;
      if ((a.trace || []).includes(k)) return `можуть бути сліди ${ALLERGY[k].gen}`;
    }
    return null;
  }

  /** Рядки під формат, людей, дітей і алергії; «не беру» гостя лишається */
  function build() {
    const old = new Map((S.rows || []).map(r => [r.id, r]));
    const rows = [];
    const put = (x, extra = {}) => {
      const id = S.swaps[x.id] || x.id; // заміну гостя не губимо при перерахунку
      const have = rows.find(r => r.id === id);
      if (have) { have.qty += scale(x.q); return; }
      rows.push({ id, qty: scale(x.q), ...extra, ...(S.swaps[x.id] ? { mark: 'new', hint: null } : {}) });
    };
    SETS[S.format].rows.forEach(x => put(x));
    if (S.kids) KIDS.forEach(x => put(x, { hint: T.kidsHint }));
    rows.forEach(r => {
      const why = blocked(r.id);
      const o = old.get(r.id);
      if (why) Object.assign(r, { off: true, offNote: why, lock: true }); // алерген не повертаємо «+»: критичне
      else if (Cart.items.has(r.id)) Object.assign(r, { off: true, offNote: 'є в кошику' });
      else if (o && o.off && !o.offNote) r.off = true; // гість сам сказав «не беру»
    });
    S.rows = rows;
  }

  function ctx() {
    const c = [];
    if (S.peopleSource === 'assumption') c.push({ type: 'people', label: `на ${count(S.people, PEOPLEW)}`, source: 'assumption' });
    if (S.formatSource === 'assumption') c.push({ type: 'format', label: SETS[S.format].label, source: 'assumption' });
    return c;
  }
  const draft = () => ({ title: T.title, rows: S.rows, rowAction: 'Замінити', addLabel: 'Додати в кошик', inCart: S.inCart });
  const askChips = () => [
    node('Ні, все як є', () => { S.asked = true; return { text: 'Тоді лишаю як є.', list: draft(), context: ctx() }; }),
    node('Будуть діти', kids),
    node('Є алергія', () => ({ text: 'На що алергія? Прибиру за складом і маркуванням.', chips: allergyChips() })),
  ];
  const allergyChips = () => Object.entries(ALLERGY).filter(([k]) => !S.allergy.includes(k)).map(([k, a]) => node(a.chip, () => allergy(k)));
  /** Питання про критичне — доки гість на нього не відповів */
  const askAfter = () => (S.asked ? null : T.ask);
  const nextChips = () => (S.asked ? [] : askChips());

  /* ---------- Відповіді ---------- */
  function start(patch = {}) {
    S = { rows: [], people: BASE, peopleSource: 'assumption', format: 'buffet', formatSource: 'assumption',
          kids: false, allergy: [], asked: false, inCart: false, swaps: {}, ...patch };
    build();
    return {
      text: `Зібрав ${SETS[S.format].label} на ${count(S.people, PEOPLEW)}: ${count(taken().length, GOODS)} на ${money(total())}.`,
      list: draft(), context: ctx(), after: askAfter(), chips: nextChips(),
    };
  }

  /** Відповідь після зміни: що змінилось — у першому реченні, решта як була */
  const reply = lead => ({ text: `${lead} Тепер ${count(taken().length, GOODS)} на ${money(total())}:`, list: draft(), context: ctx(), after: askAfter(), chips: nextChips() });

  function setPeople(n) {
    S.people = n; S.peopleSource = 'guest';
    build();
    return reply(`Перерахував на ${count(n, PEOPLEW)}.`);
  }
  function setFormat(f) {
    S.format = f; S.formatSource = 'guest';
    build();
    return reply(`Зібрав ${SETS[f].label} замість ${SETS[f === 'buffet' ? 'sweet' : 'buffet'].gen}.`);
  }
  function kids() {
    S.kids = true; S.asked = true;
    build();
    const added = KIDS.map(x => x.id).filter(id => !blocked(id));
    return reply(`Додав для дітей ${list(added)}.`);
  }
  /** Алергія — критичне обмеження: прибираємо за складом, діє до кінця розмови */
  function allergy(k) {
    S.allergy.push(k); S.asked = true;
    build();
    const off = S.rows.filter(r => r.offNote && r.offNote !== 'є в кошику');
    const names = S.rows.filter(r => hits(r.id, k)).map(r => r.id);
    return {
      text: names.length
        ? `Прибрав, де в складі чи маркуванні є ${ALLERGY[k].word}, — ${list(names)}. Тепер ${count(taken().length, GOODS)} на ${money(total())}:`
        : `У чернетці немає нічого, де за складом є ${ALLERGY[k].word}, — лишаю як є: ${count(taken().length, GOODS)} на ${money(total())}.`,
      list: draft(), context: ctx(),
      after: off.length ? 'Позначку «може містити сліди» теж рахую. Склад кожного товару — на картці.' : null,
      chips: [node('Ще алергія', () => ({ text: 'На що ще?', chips: allergyChips() }))].filter(() => allergyChips().length),
    };
  }

  function skip(ids) {
    ids.forEach(id => { const r = S.rows.find(x => x.id === id); if (r) { r.off = true; r.offNote = null; } });
    return reply(`Гаразд, ${list(ids)} не беру.`);
  }

  function addAll(rows) {
    const add = rows.filter(r => !r.off).map(r => ({ id: r.id, qty: r.qty }));
    if (!add.length) return null;
    add.forEach(r => Cart.add(r.id, r.qty));
    S.inCart = true;
    const f = Scenarios.nextStep({ scenario: 'event' });
    return {
      confirm: {
        text: `Додано в кошик: ${count(add.length, GOODS)} на вечірку`,
        undo: () => { add.forEach(r => Cart.add(r.id, -r.qty)); S.inCart = false; return { text: 'Скасував: прибрав їх із кошика.', list: draft() }; },
      },
      text: `У кошику на ${money(Cart.total())}${f.note}.`,
      chips: [f.chip].filter(Boolean),
    };
  }

  /* ---------- Своїми словами ---------- */
  const WORDS = {
    cheese: ['сир'], olives: ['маслин', 'оливк'], grapesRed: ['виноград'], grapes: ['виноград'], pistachios: ['фісташ'],
    crisps: ['чипс'], bread: ['хліб', 'батон'], water15: ['вод'], juice: ['сік', 'соку'], marshmallow: ['маршмел'],
    bakoma: ['десерт', 'bakoma'], banana: ['банан'], appleGolden: ['яблук'],
  };
  const named = t => S.rows.filter(r => (WORDS[r.id] || []).some(w => t.includes(w))).map(r => r.id);
  const numOf = t => { const m = t.match(/(\d+)\s*(люд|осіб|гост|чолов|друз|персон)|(?:нас|буде|на)\s+(\d+)/); return m ? Number(m[1] || m[3]) : null; };

  function route(t, last) {
    if (S && last && last.event && !S.inCart) {
      if (/горіх|арахіс/.test(t) && /алерг|без|не мож/.test(t)) return node(t, () => allergy('nuts'));
      if (/лактоз|молок/.test(t) && /алерг|без|не мож|непереносим/.test(t)) return node(t, () => allergy('lactose'));
      if (/глютен/.test(t)) return node(t, () => allergy('gluten'));
      if (/алерг/.test(t)) return node(t, () => ({ text: 'На що алергія? Прибиру за складом і маркуванням.', chips: allergyChips() }));
      if (/діт|дитин|малеч/.test(t) && !/без діт|не буде діт/.test(t)) return node(t, kids);
      if (/солодк|десерт|чаю/.test(t)) return node(t, () => setFormat('sweet'));
      if (/фуршет|закуск/.test(t)) return node(t, () => setFormat('buffet'));
      const n = numOf(t);
      if (n && n > 1 && n <= 30) return node(t, () => setPeople(n));
      if (/не треба|не бер|прибер|без /.test(t) && named(t).length) { const ids = named(t); return node(t, () => skip(ids)); }
      if (/додай все|в кошик|беру все/.test(t)) return node(t, () => addAll(S.rows) || { text: 'У чернетці нічого не обрано.' });
      if (/^(ні|нема|ні, все|все ок)/.test(t)) return node(t, () => { S.asked = true; return { text: 'Тоді лишаю як є.', list: draft(), context: ctx() }; });
    }
    if (/вечірк|свято|день народж|гост|пікнік|подію|на компанію/.test(t)) {
      return node(t, () => {
        const n = numOf(t);
        return start(n ? { people: n, peopleSource: 'guest' } : {});
      });
    }
    return null;
  }

  Scenarios.define({
    id: 'event',
    opener: node(T.opener, () => start()),
    route,
    removeCondition: type => {
      if (!S) return null;
      if (type === 'people') return node(`Змінити «на ${count(S.people, PEOPLEW)}»`, () => ({ text: 'Скільки буде людей?', chips: PEOPLE.map(n => node(`${n}`, () => setPeople(n))) }));
      if (type === 'format') return node(`Змінити «${SETS[S.format].label}»`, () => ({ text: 'Який формат?', chips: Object.entries(SETS).map(([k, s]) => node(s.chip, () => setFormat(k))) }));
      return null;
    },
    // спільна заміна рядка; при алергії не пропонуємо те, що її містить
    rowAction: id => (S && !S.inCart ? Scenarios.swapOffer({ scenario: 'event', rows: S.rows, id, list: draft, allow: x => !blocked(x),
      onSwap: (from, to) => { const orig = Object.keys(S.swaps).find(k => S.swaps[k] === from) || from; if (to) S.swaps[orig] = to; else delete S.swaps[orig]; } }) : null),
    cardAction: id => Scenarios.swapCard(id),
    listAdd: rows => (S && !S.inCart ? node(taken().length === rows.length ? 'Додай усе в кошик' : `Додай ${count(taken().length, GOODS)} в кошик`, () => addAll(rows)) : null),
  });
})();
