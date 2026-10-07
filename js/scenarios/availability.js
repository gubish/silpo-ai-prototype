/* =====================================================================
   СЦЕНАРІЙ «Наявність і питання про товар» (гілка Chats; працює і в C). За правилами docs/mg-dialog-rules.md:
   пряма відповідь з даних у першому реченні, під нею — одна картка товару; питань від МГ немає.
   • Є / немає: «Є майонез без яєць?» → «Так, є: … 129 ₴» + картка. Немає в каталозі («А лимони є?») —
     чесно і найближча заміна з поясненням схожості.
   • Склад, алергени, веганське: лише зі складу й маркування картки товару («Чи є лактоза в Bakoma?»,
     «Маршмелоу підходить веганам?» — ні, у складі желатин).
   • КБЖУ: «Скільки калорій у банані?» → з харчової цінності на 100 г.
   • Походження: з опису товару («Звідки банани?» → з Еквадору).
   • Даних немає («Банани органічні?») — кажемо прямо, не вгадуємо, і що знаємо натомість.
   • «Він», «а в ньому» — про останній товар, про який говорили (контекст «Показане»).
   • Дії: «Додати X» (підтвердження + спільний наступний крок) · «Схоже» (карусель з різницею) · картка → деталі.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  /* ---------- Як гість називає товари каталогу ---------- */
  const WORDS = {
    mayoVegan: ['майонез без яє', 'пісний майонез', 'веганський майонез'],
    hellmanns: ['hellmann', 'хелман', 'майонез'],
    bakoma: ['bakoma', 'бакома', 'рослинний десерт'],
    marshmallow: ['маршмел'], pistachios: ['фісташ'], oliveOil: ['оливкова олія', 'олія'],
    banana: ['банан'], appleGolden: ['яблук'], pears: ['груш'], peach: ['персик'], watermelon: ['кавун'],
    melon: ['дин'], lime: ['лайм'], mango: ['манго'], pineapple: ['ананас'], grapes: ['виноград'], persimmon: ['хурм'],
  };
  // чого в каталозі немає → найближче і чим схоже
  const MISSING = {
    'лимон': { name: 'Лимонів', id: 'lime', why: 'сік так само кислий — до чаю, лимонаду й заправки' },
    'апельсин': { name: 'Апельсинів', id: 'mango', why: 'теж соковитий і солодкий, для перекусу' },
    'полуниц': { name: 'Полуниці', id: 'grapes', why: 'з ягідного — виноград, солодкий' },
  };
  // «Схоже» — чим відрізняється від показаного
  const SIMILAR = {
    mayoVegan: [{ id: 'mayoLight', note: 'Легкий, 30% жиру — але з яйцями' }, { id: 'mayoHome', note: 'Класичний, 72% — з яйцями' }],
    hellmanns: [{ id: 'mayoHome', note: 'Класичний, 72% — дешевший' }, { id: 'mayoVegan', note: 'Без яєць, пісний' }],
    banana: [{ id: 'mango', note: 'Теж солодкий і мʼякий, екзотичніший' }, { id: 'pears', note: 'Мʼякі й соковиті, менше калорій' }],
    bakoma: [{ id: 'marshmallow', note: 'Солодке до кави — але з желатином' }],
    marshmallow: [{ id: 'bakoma', note: 'Рослинний десерт — без желатину й молока' }],
    lime: [{ id: 'applesGreen', note: 'Зелені яблука — кислинка, але не цитрус' }],
  };

  const P = id => DATA.products[id];
  const D = id => DATA.pdp.products[id] || {};
  const money = v => UI.money(v).replace('.00', '');
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const nameOf = id => lc(P(id).shortName || P(id).name);
  const node = (label, run) => ({ label, scenario: 'availability', availability: true, run });

  let last = null; // останній товар, про який говорили («а в ньому?»)
  const asked = new Map(); // товар → про що вже питали (наступні питання-чіпси не повторюють сказане)

  /* ---------- Наступні питання: 1–2 чіпси під відповіддю ----------
     Під категорію товару і лише ті, на які в даних є відповідь (без «даних немає» на чіп). */
  const Q = {
    composition: { label: 'Що в складі?',      has: id => !!D(id).composition, run: id => composition(id) },
    taste:       { label: 'Який на смак?',      has: id => !!tasteLine(id),     run: id => taste(id) },
    calories:    { label: 'Скільки калорій?',   has: id => !!D(id).nutrition,   run: id => calories(id) },
    origin:      { label: 'Звідки привезли?',   has: id => !!originOf(id),      run: id => origin(id) },
    vegan:       { label: 'Підходить веганам?', has: id => !!D(id).composition, run: id => vegan(id) },
  };
  // що найчастіше питають далі — за групою товару, у порядку ймовірності
  function group(id) {
    if (P(id).kind === 'fruit') return ['calories', 'origin', 'taste'];
    if (/^mayo|hellmanns|oliveOil/.test(id)) return ['composition', 'taste', 'calories'];
    if (/bakoma|marshmallow/.test(id)) return ['vegan', 'calories', 'composition'];
    return ['composition', 'calories', 'taste'];
  }

  /** Картка під відповіддю + «Додати», 1–2 наступні питання, «Схоже» (разом до 4 чіпсів) */
  function answer(id, text, kind) {
    last = id;
    if (!asked.has(id)) asked.set(id, new Set());
    if (kind) asked.get(id).add(kind);
    const sim = (SIMILAR[id] || []).filter(x => P(x.id));
    const next = group(id).filter(k => !asked.get(id).has(k) && Q[k].has(id)).slice(0, 2)
      .map(k => node(Q[k].label, () => Q[k].run(id)));
    return {
      text,
      items: [{ id }],
      chips: [node(Cart.items.has(id) ? `Ще ${nameOf(id)}` : `Додати ${nameOf(id)}`, () => add(id)),
              ...next, sim.length ? node('Схоже', () => similar(id)) : null].filter(Boolean).slice(0, 4),
    };
  }
  /** Смак — речення з опису товару, де йдеться про смак */
  function tasteLine(id) {
    const d = D(id).description || '';
    return d.split(/(?<=\.)\s+/).find(x => /смак|солодк|кисл|ніжн|насичен|аромат|хрустк|соковит|мʼяк/.test(x.toLocaleLowerCase('uk-UA'))) || null;
  }
  function taste(id) {
    const line = tasteLine(id);
    if (!line) return noData(id, 'про смак', 'taste');
    return answer(id, `За описом: ${lc(line.replace(/\.$/, ''))}.`, 'taste');
  }
  const originOf = id => ((D(id).description || '').match(/з ([А-ЯІЇЄҐ][а-яіїєґʼ']+)/) || [])[1];
  const price = id => `${money(P(id).price)}${P(id).oldPrice ? ` замість ${money(P(id).oldPrice)}` : ''}`;

  /* ---------- Відповіді за типом питання ---------- */
  function availability(id) {
    const extra = id === 'mayoVegan' ? ' Яєць у складі немає — він на білку гороху.' : '';
    return answer(id, `Так, є: ${nameOf(id)}, ${price(id)} за ${P(id).weight}.${extra}`, 'avail');
  }
  function missing(m) {
    last = m.id;
    return {
      text: `${m.name} зараз немає. Найближче — ${nameOf(m.id)}: ${m.why}.`,
      items: [{ id: m.id, note: `Замість: ${m.name.toLocaleLowerCase('uk-UA')}` }],
      chips: [node(`Додати ${nameOf(m.id)}`, () => add(m.id))],
    };
  }
  function calories(id) {
    const n = D(id).nutrition;
    if (!n) return noData(id, 'про харчову цінність', 'calories');
    return answer(id, `${n.kcal} ккал на 100 г${n.sugar ? `, з них цукру ${n.sugar.replace('.', ',')}` : ''} — так указано на картці.`, 'calories');
  }
  function composition(id) {
    const c = D(id).composition;
    if (!c) return noData(id, 'про склад', 'composition');
    return answer(id, `Склад: ${lc(c.text)} Алергени: ${c.allergens.value}.`, 'composition');
  }
  // що шукати у складі й маркуванні
  const ALLERGEN = {
    lactose: { re: /молок|лактоз|вершк/, no: /не містить молока/, word: 'лактози', nom: 'лактоза', q: /лактоз|молок/ },
    eggs:    { re: /яйц|яєчн|жовток/, word: 'яєць', nom: 'яйця', q: /яйц|яєць/ },
    gluten:  { re: /глютен|пшениц|борошн/, word: 'глютену', nom: 'глютен', q: /глютен/ },
    nuts:    { re: /горіх|арахіс/, word: 'горіхів', nom: 'горіхи', q: /горіх|арахіс/ },
  };
  function allergen(id, key) {
    const c = D(id).composition;
    if (!c) return noData(id, 'про склад', 'composition');
    const a = ALLERGEN[key], all = `${c.text} ${c.allergens.value}`.toLocaleLowerCase('uk-UA');
    const trace = all.match(/може містити[^;.]*/);
    const has = a.no && a.no.test(all) ? false : a.re.test(c.text.toLocaleLowerCase('uk-UA') + ' ' + c.allergens.value.replace(/може містити[^;.]*/, '').toLocaleLowerCase('uk-UA'));
    const traceHit = trace && a.re.test(trace[0]);
    return answer(id, has ? `Так, ${a.nom} у складі є. Маркування: ${c.allergens.value}.`
      : `Ні, ${a.word} у складі немає${traceHit ? `, але маркування каже: «${trace[0]}»` : trace ? `. На маркуванні: «${trace[0]}»` : ''}.`, 'allergen');
  }
  function vegan(id) {
    const c = D(id).composition;
    if (!c) return noData(id, 'про склад', 'composition');
    const t = c.text.toLocaleLowerCase('uk-UA');
    const animal = (t.match(/желатин|молок|вершк|яйц|яєчн|жовток|мед\b|кармін/g) || []);
    return answer(id, animal.length
      ? `Ні: у складі ${[...new Set(animal)].join(', ')} — це тваринного походження.`
      : `За складом — так, тваринних інгредієнтів немає. Окремого маркування «веган» у даних немає.`, 'vegan');
  }
  function origin(id) {
    const m = originOf(id);
    if (!m) return noData(id, 'про країну походження', 'origin');
    return answer(id, `З ${m} — так указано в описі товару.`, 'origin');
  }
  /** Даних немає — прямо, не вгадуємо; і що знаємо натомість */
  function noData(id, what, kind) {
    const known = D(id).nutrition ? 'калорійність' : D(id).composition ? 'склад' : D(id).description ? 'опис' : null;
    return answer(id, `У даних товару нічого немає ${what} — не вгадуватиму.${known ? ` Можу сказати ${known}.` : ''}`, kind);
  }

  function similar(id) {
    const list = (SIMILAR[id] || []).filter(x => P(x.id));
    return { text: `Схоже на ${nameOf(id)}:`, items: list.map((x, i) => ({ id: x.id, note: x.note, pick: i === 0 })) };
  }

  function add(id) {
    Cart.add(id, 1);
    const f = Scenarios.nextStep({ scenario: 'availability' });
    return {
      confirm: { text: `Додано: ${nameOf(id)}, 1 шт`, undo: () => { Cart.add(id, -1); return { text: `Скасував: ${nameOf(id)} прибрав з кошика.` }; } },
      text: `У кошику на ${money(Cart.total())}${f.note}.`,
      chips: [f.chip].filter(Boolean),
    };
  }

  /* ---------- Своїми словами ---------- */
  const productOf = t => Object.keys(WORDS).filter(id => P(id)).find(id => WORDS[id].some(w => t.includes(w)));
  const missingOf = t => Object.keys(MISSING).find(w => t.includes(w));

  function route(t, lastNode) {
    const inTalk = lastNode && lastNode.availability;
    const named = productOf(t), miss = missingOf(t);
    const id = named || (!miss && inTalk && /(^|\s)(він|вона|воно|вони|ньому|ній|них|його|її|їх)(\s|\?|$)|^а /.test(t) ? last : null);
    const isQ = /\?|^(є|чи|а |скільки|звідки|що в|який|яка|які)|продаєте|маєте|є в наявн/.test(t);
    if (!isQ && !inTalk) return null;
    if (miss && !named) return node(t, () => missing(MISSING[miss]));
    if (!id) return null;
    if (/калор|ккал|кбжу|цукр/.test(t)) return node(t, () => calories(id));
    if (/веган|рослинн|пісн/.test(t) && !/майонез без/.test(t) && id !== 'mayoVegan') return node(t, () => vegan(id));
    for (const k of Object.keys(ALLERGEN)) if (ALLERGEN[k].q.test(t) && !(k === 'eggs' && id === 'mayoVegan' && /є майонез/.test(t))) return node(t, () => allergen(id, k));
    if (/склад|що в |з чого/.test(t)) return node(t, () => composition(id));
    if (/смак|на смак|смачн/.test(t)) return node(t, () => taste(id));
    if (/звідки|країн|походж|де вирощ/.test(t)) return node(t, () => origin(id));
    if (/органіч|еко|гмо|фермер|халял|кошер|сезонн/.test(t)) {
      const what = /гмо/.test(t) ? 'про ГМО' : /халял|кошер/.test(t) ? 'про сертифікацію' : /сезон/.test(t) ? 'про сезон' : 'про органічність';
      return node(t, () => noData(id, what));
    }
    if (/^є|чи є|є в наявн|продаєте|маєте|^а /.test(t)) return node(t, () => availability(id));
    return null;
  }

  Scenarios.define({
    id: 'availability',
    opener: node('Є майонез без яєць?', () => availability('mayoVegan')),
    route,
  });
})();
