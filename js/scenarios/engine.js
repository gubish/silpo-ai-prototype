/* =====================================================================
   СЦЕНАРІЇ ЧАТУ МГ — спільний механізм для гілок C і Chats (D), за правилами
   docs/mg-dialog-rules.md. Сценарії — окремі файли js/scenarios/<id>.js: Scenarios.define({...}).
   • Крок сценарію { label, run }: слова гостя → [«✓ … · Скасувати»] → відповідь МГ
     (картки з підписом «чому цей», чернетка-список, рядок припущень МГ з «×», один суміжний крок).
   • Своє питання: спершу кожен сценарій пробує його розпізнати (route), далі — як раніше.
   • Кошик: іконка заміни з проду в рядку → чат поверх кошика; жовті чіпси МГ — лише ті,
     на які є реальна відповідь (Де зекономити? / Як доставити дешевше? / Що з цього приготувати?).
   • Гілка C (не Chats): «Зібрати покупки» в привітанні й тап по острівцю «Давай зберу тобі кошик?»
     запускають сценарій «Зібрати кошик» — чернетку-список замість каруселі.
   Особливості Chats (чат — головний екран, список сценаріїв, без привітання) — js/branches/d.js.
   ===================================================================== */

/** Реєстр сценаріїв чату (гілки C і Chats). Опис сценарію (js/scenarios/<id>.js):
    { id, opener: { label, answer, next, ... } — перший крок (тег у привітанні),
      кожен крок сценарію має scenario: '<id>' (підсвітка в списку);
      route(text, last) — своє питання гостя → крок сценарію або null;
                          last — останній крок, на який відповідав МГ (щоб розуміти відповідь
                          на уточнення: «до 700» після питання про бюджет) } */
const Scenarios = {
  all: {},
  onStep: null,       // (id) => …: кожен крок сценарію (Chats підсвічує сценарій у списку)
  cartNew: new Set(), // товари, які МГ щойно поставив у кошик замість інших — «нове» в рядку кошика
  define(s) { this.all[s.id] = s; },
  ready() { return DATA.scenarios.list.filter(x => this.all[x.id]); },
  /** Перші кроки готових сценаріїв — теги в привітанні */
  openers() { return this.ready().map(x => ({ ...this.all[x.id].opener, kind: 'node' })); },
};

(() => {
  if (!Branch.is('c')) return; // C і Chats (D збудована на C)
  const chat = AiChat;

  /* ---------- Один суміжний крок після виконаного завдання — спільний для всіх сценаріїв ----------
     (правило «Будова відповіді», п. 6). Викликати лише після завершеного завдання: додали набір чи вино
     в кошик, замінили товар. Пріоритет:
       1. кошик менший за мінімальне замовлення → «Що докласти?» (блокер — важливіший за все);
       2. гість казав «дорого» → save (крок сценарію «Де ще зекономити?»);
       3. до дешевшої доставки ≤ 300 ₴ → «Як доставити дешевше?», сума — у тексті (note);
       4. own — суміжний крок самого сценарію (закуска до вина, «Щось солодке», «Замінити ще щось»);
       5. інакше «Оформити замовлення» (поверх кошика — нічого: там уже є «Повернутись у кошик»).
     opts: { scenario, total (типово — кошик), save, delivery (свій крок доставки, напр. у чернетку),
             own, fill (що пропонувати докласти), back (крок «Повернутись у кошик», якщо чат поверх кошика) }
     → { chip, note, kind } */
  const NEAR = 300;
  const money = v => UI.money(v).replace('.00', '');
  const delivery = () => DATA.cart.delivery || {};
  Scenarios.deliveryFor = t => {
    const tier = (delivery().tiers || []).filter(x => x.from > t).sort((a, b) => a.from - b.from)[0];
    return tier ? { price: tier.price, left: tier.from - t } : null;
  };
  /** «від 800 ₴ — 99 ₴, від 1 500 ₴ — 69 ₴, від 2 000 ₴ — 1 ₴» */
  Scenarios.deliveryRules = () => {
    const d = delivery(), tiers = [...(d.tiers || [])].sort((a, b) => a.from - b.from);
    return [`${d.min ? `від ${money(d.min)}` : `до ${money(tiers[0].from)}`} — ${money(d.price)}`,
      ...tiers.map(t => `від ${money(t.from)} — ${money(t.price)}`)].join(', ');
  };
  /** Ціна доставки для суми: найвищий поріг, якого досягли */
  const deliveryPrice = t => ((delivery().tiers || []).filter(x => x.from <= t).sort((a, b) => b.from - a.from)[0] || delivery()).price;
  const FILL = ['pistachios', 'grapesRed', 'oliveOil']; // що часто докладають, якщо сценарій не дав свого
  /** Набір, що закриває різницю до порогу, з найменшою переплатою: з товарів сценарію (fill) і типових,
      яких ще немає в кошику. Навіть усіх не вистачає — додаємо кількість найдешевшому.
      Це набір, який беруть цілком → чернетка-список */
  function fillRows(opts, need) {
    const price = id => DATA.products[id].price;
    const ids = [...new Set([...(opts.fill || []), ...FILL])].filter(id => DATA.products[id] && !Cart.items.has(id)).slice(0, 5);
    let best = null;
    for (let mask = 1; mask < 1 << ids.length; mask++) {
      const set = ids.filter((_, i) => mask & (1 << i));
      const sum = set.reduce((t, id) => t + price(id), 0);
      if (sum < need) continue;
      if (!best || sum < best.sum || (sum === best.sum && set.length < best.set.length)) best = { set, sum };
    }
    if (best) return best.set.map(id => ({ id, qty: 1 }));
    const rows = ids.map(id => ({ id, qty: 1 }));
    const cheapest = [...rows].sort((a, b) => price(a.id) - price(b.id))[0];
    const sum = () => rows.reduce((t, r) => t + price(r.id) * r.qty, 0);
    for (let k = 0; cheapest && sum() < need && k < 10; k++) cheapest.qty++;
    return rows;
  }
  /** Відповідь «Що докласти?» / «Як доставити дешевше?»: чернетка з однією кнопкою «Додати в кошик» */
  function fillStep(opts, step, need, lead, title) {
    const rows = fillRows(opts, need);
    if (!rows.length) return { text: `${lead} Усе, що зазвичай докладають, уже в кошику.`, chips: opts.back ? [opts.back] : [] };
    let done = false;
    const list = {
      title, rows, addLabel: 'Додати в кошик',
      // кнопка чернетки — тут, а не в сценарії: у вина чи рецепта свої чернетки
      onAdd: cur => (done ? null : step('Додай у кошик', () => {
        const add = cur.filter(r => !r.off).map(r => ({ id: r.id, qty: r.qty || 1 }));
        if (!add.length) return null;
        done = true;
        add.forEach(r => Cart.add(r.id, r.qty));
        const m = chat.thread.find(x => x.kind === 'list' && x.rows === cur);
        if (m) m.inCart = true;
        const f = Scenarios.nextStep({ ...opts, own: null });
        return {
          confirm: {
            text: `Додано в кошик: ${add.length === 1 ? DATA.products[add[0].id].name : `${add.length} ${aiPlural(add.length, ['товар', 'товари', 'товарів'])}`}`,
            undo: () => {
              add.forEach(r => Cart.add(r.id, -r.qty)); done = false;
              if (m) m.inCart = false;
              return { text: 'Скасував: прибрав їх із кошика.', chips: [opts.back, Scenarios.nextStep(opts).chip].filter(Boolean) };
            },
          },
          // добили до порогу — кажемо, скільки тепер коштує доставка
          text: `У кошику на ${money(Cart.total())}${f.note || `, доставка — ${money(deliveryPrice(Cart.total()))}`}.`,
          chips: [opts.back, f.chip].filter(Boolean),
        };
      })),
    };
    const sum = rows.reduce((t, r) => t + DATA.products[r.id].price * r.qty, 0);
    return { text: `${lead} Ось набір на ${money(sum)} — цього вистачить:`, list, chips: opts.back ? [opts.back] : [] };
  }
  /* ---------- Заміна рядка чернетки — спільна для сценаріїв без своєї логіки заміни ----------
     (правило «Форма результату»: «Замінити» в рядку → карусель варіантів з «Замінити»; обраний
     повертається в чернетку з «нове», кількість і решта рядків без змін; «Скасувати» повертає як було).
     ALTS — чим можна замінити товар і чим варіант відрізняється (note). Немає варіантів — чесно
     і «Не брати». Сценарій підключає: rowAction → Scenarios.swapOffer(...), cardAction → Scenarios.swapCard(id). */
  const ALTS = {
    milk:        [{ id: 'milk32', note: 'Жирніше: 3,2% замість 2,5%' }],
    milk32:      [{ id: 'milk', note: 'Легше: 2,5% замість 3,2%' }],
    water15:     [{ id: 'water15light', note: 'Та сама вода, слабогазована' }],
    water15light:[{ id: 'water15', note: 'Та сама вода, негазована' }],
    cheese:      [{ id: 'blueCheese', note: 'З блакитною пліснявою — пікантніше' }, { id: 'processed', note: 'Плавлений — мʼякший' }],
    blueCheese:  [{ id: 'cheese', note: 'Твердий Гауда — мʼякший смак' }],
    cottage:     [{ id: 'cheese', note: 'Твердий — до бутербродів' }, { id: 'processed', note: 'Плавлений — на бутерброди' }],
    processed:   [{ id: 'cheese', note: 'Твердий Гауда' }, { id: 'cottage', note: 'Кисломолочний — до сирників' }],
    grapesRed:   [{ id: 'grapes', note: 'Фіолетовий — солодший' }],
    grapes:      [{ id: 'grapesRed', note: 'РедГлоб — крупніший' }],
    pistachios:  [{ id: 'walnuts', note: 'Волоські горіхи — без солі' }],
    walnuts:     [{ id: 'pistachios', note: 'Фісташки — смажені, солоні' }],
    appleGolden: [{ id: 'applesGreen', note: 'Зелені — кисліші й хрусткіші' }, { id: 'pears', note: 'Груші — солодші' }],
    marshmallow: [{ id: 'bakoma', note: 'Рослинний десерт — без молока' }],
    bakoma:      [{ id: 'marshmallow', note: 'Маршмелоу — легше' }],
    hellmanns:   [{ id: 'mayoLight', note: 'Легкий, 30% жиру' }, { id: 'mayoHome', note: 'Класичний, 72%' }],
  };
  Scenarios.alts = ALTS; // сценарій може дописати свої пари (напр. «Кошик під бюджет»)
  const lcFirst = t => t.charAt(0).toLocaleLowerCase('uk-UA') + t.slice(1);
  const short = id => lcFirst(DATA.products[id].shortName || DATA.products[id].name);
  let swap = null; // що зараз замінюємо: { scenario, rows, from, list, allow }
  /** opts: { scenario, rows, id, list: () => чернетка для відповіді, allow: id => можна пропонувати (напр. без алергенів),
             onSwap: (from, to|null) => сценарій памʼятає заміну, щоб перерахунок чернетки її не губив,
             alts: id => свої варіанти [{ id, note }] (напр. для рецепта: як заміна змінить страву),
             none: (id, step) => своя відповідь, коли варіантів немає ({ text, chips }) або null } */
  Scenarios.swapOffer = function (opts) {
    const flag = String(opts.scenario).replace(/-(\w)/g, (_, c) => c.toUpperCase());
    const step = (label, run) => ({ label, scenario: opts.scenario, [flag]: true, run });
    const from = opts.id;
    return step(`Заміни ${short(from)}`, () => {
      const alts = ((opts.alts ? opts.alts(from) : ALTS[from]) || []).filter(a => DATA.products[a.id] && !opts.rows.some(r => r.id === a.id) && (!opts.allow || opts.allow(a.id)));
      const keep = step('Лишити як є', () => { swap = null; return { text: 'Гаразд, лишаю. Решта без змін:', list: opts.list() }; }); // без назви: «лишити рукола» — відмінок не вгадаєш
      if (!alts.length) {
        swap = null;
        const own = opts.none && opts.none(from, step);
        if (own) return { ...own, chips: [...(own.chips || []), keep] };
        return {
          text: `Чесно: замінити ${short(from)} поки нічим — іншого такого товару зараз немає. Можу не брати.`,
          chips: [step(`Не брати ${short(from)}`, () => {
            const r = opts.rows.find(x => x.id === from); if (r) { r.off = true; r.offNote = null; }
            return { text: `Гаразд, ${short(from)} не беру.`, list: opts.list() };
          }), keep],
        };
      }
      swap = { ...opts, from, step };
      const base = DATA.products[from].price;
      return {
        text: `Чим замінити ${short(from)}?`,
        items: alts.slice(0, 3).map((a, i) => {
          const d = DATA.products[a.id].price - base;
          return { id: a.id, note: `${a.note} · ${d < 0 ? `на ${money(-d)} дешевше` : d > 0 ? `на ${money(d)} дорожче` : 'та сама ціна'}`, pick: i === 0, noAdd: true, act: 'Замінити' };
        }),
        chips: [keep],
      };
    });
  };
  /** «Замінити» на картці варіанта — лише якщо зараз іде заміна в цьому сценарії */
  Scenarios.swapCard = function (to) {
    if (!swap) return null;
    const { from, rows, step } = swap;
    return step(`Заміни на ${short(to)}`, () => {
      const row = rows.find(r => r.id === from);
      if (!row) return null;
      const prev = { id: row.id, mark: row.mark, hint: row.hint };
      Object.assign(row, { id: to, mark: 'new', hint: null });
      const cur = swap; swap = null;
      if (cur.onSwap) cur.onSwap(from, to);
      const sum = rows.filter(r => !r.off).reduce((t, r) => t + DATA.products[r.id].price * (r.qty || 1), 0);
      return {
        confirm: {
          text: `Замінено в чернетці: ${short(from)} → ${short(to)}`,
          undo: () => { Object.assign(row, prev); if (cur.onSwap) cur.onSwap(from, null); return { text: `Скасував: повернув ${short(from)}.`, list: cur.list() }; },
        },
        text: `Решта без змін — тепер ${money(sum)}:`,
        list: cur.list(),
      };
    });
  };

  /* ---------- Прямий контакт підтримки (контакти — з сайту Сільпо, «Підтримка Гостей») ----------
     Показуємо, лише коли гість злий на сервіс або сам просить людину. Месенджери — першими;
     поза годинами гарячої лінії кажемо, що працює зараз. */
  const SUPPORT = { hotline: '0 800 301 707', abroad: '+38 044 496 32 38', from: 7, to: 23, hours: '07:00–23:00', email: 'program@silpo.ua' };
  Scenarios.supportOpen = (d = new Date()) => d.getHours() >= SUPPORT.from && d.getHours() < SUPPORT.to;
  Scenarios.supportCard = function () {
    const open = Scenarios.supportOpen(), tel = n => n.replace(/[^\d+]/g, '');
    const ic = n => `<img src="assets/icons/support/${n}.svg" alt="">`;
    return `<div class="ai-support" role="group" aria-label="Підтримка Гостей">
      <div class="ai-support__title">Підтримка Гостей</div>
      <div class="ai-support__msgr">
        <button type="button" class="ai-support__app">${ic('telegram')}<span>Telegram</span></button>
        <button type="button" class="ai-support__app">${ic('viber')}<span>Viber</span></button>
        <button type="button" class="ai-support__app">${ic('messenger')}<span>Messenger</span></button>
      </div>
      <a class="ai-support__row${open ? '' : ' is-closed'}" href="tel:${tel(SUPPORT.hotline)}">${ic('phone')}<span><b>${SUPPORT.hotline}</b><small>Гаряча лінія · ${SUPPORT.hours}${open ? '' : ' · зараз не працює'}</small></span></a>
      <a class="ai-support__row${open ? '' : ' is-closed'}" href="tel:${tel(SUPPORT.abroad)}">${ic('phone')}<span><b>${SUPPORT.abroad}</b><small>Для дзвінків з-за кордону</small></span></a>
      <a class="ai-support__row" href="mailto:${SUPPORT.email}">${ic('mail')}<span><b>${SUPPORT.email}</b></span></a>
    </div>`;
  };
  /** Текст до картки: з урахуванням годин роботи */
  Scenarios.supportText = () => (Scenarios.supportOpen()
    ? 'Ось як звʼязатися з людиною з підтримки — найшвидше в месенджері або гарячою лінією:'
    : `Гаряча лінія зараз не працює (${SUPPORT.hours}) — напиши в месенджер, там відповідять:`);

  /** Чіпси вітального екрана (головна гілки C): коли розмова ніби починається наново — після образи,
      флірту, «не моя тема» тощо. «Зібрати покупки» веде в «Передбач моє замовлення». */
  /** Вітальні чіпси, за якими вже є сценарій: «Зібрати покупки» → «Передбач», «Хочу щось поїсти» → рецепт
      (підпис чіпа лишається словами гостя) */
  Scenarios.toScenario = o => {
    const P = Scenarios.all.predict, R = Scenarios.all.recipe;
    if (o.label === 'Зібрати покупки' && P) return { ...P.opener };
    if (o.label === 'Хочу щось поїсти' && R) return { ...R.opener, label: o.label };
    return o;
  };
  Scenarios.welcome = function () {
    return ((DATA.aiChat.screens.home || {}).openers || [])
      .map(o => (typeof o === 'string' ? DATA.aiChat.openers.find(x => x.id === o) : o)).filter(Boolean)
      .map(Scenarios.toScenario);
  };

  /** Прокрутити екран до блоку: { screen, sel, has } — перший sel, у тексті якого є has */
  Scenarios.spot = function ({ screen, sel, has }) {
    const root = document.getElementById(screen);
    const el = root && [...root.querySelectorAll(sel)].find(e => !has || e.textContent.includes(has));
    if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  };

  Scenarios.nextStep = function (opts = {}) {
    const total = opts.total != null ? opts.total : Cart.total();
    // крок належить сценарію: його route розуміє наступну репліку (прапорець — wine / replace / photoList…)
    const flag = String(opts.scenario || '').replace(/-(\w)/g, (_, c) => c.toUpperCase());
    const step = (label, run) => ({ label, scenario: opts.scenario, [flag]: true, run });
    const min = delivery().min;
    if (min && total < min) {
      const left = min - total;
      return { kind: 'min', note: ` — до мінімального замовлення ${money(min)} бракує ${money(left)}`,
        chip: step('Що докласти?', () => fillStep(opts, step, left,
          `Мінімальне замовлення — ${money(min)}, бракує ${money(left)}.`, `Чернетка: докласти до ${money(min)}`)) };
    }
    if (opts.save) return { kind: 'save', note: '', chip: opts.save };
    const nd = Scenarios.deliveryFor(total);
    if (nd && nd.left <= NEAR) {
      return { kind: 'delivery', note: ` — до доставки за ${money(nd.price)} ще ${money(nd.left)}`,
        chip: opts.delivery || step('Як доставити дешевше?', () => fillStep(opts, step, nd.left,
          `Доставка: ${Scenarios.deliveryRules()}.\nДо доставки за ${money(nd.price)} не вистачає ${money(nd.left)}.`, `Чернетка: до доставки за ${money(nd.price)}`)) };
    }
    if (opts.own) return { kind: 'own', note: '', chip: opts.own };
    return { kind: 'checkout', note: '', chip: opts.back ? null : { label: 'Оформити замовлення', go: 'cart' } };
  };

  /* Останній крок сценарію — щоб зрозуміти відповідь гостя своїми словами */
  const baseRunNode = chat.runNode;
  chat.runNode = function (n, said) {
    if (!n.go) this.lastNode = n;
    if (n.scenario && Scenarios.onStep) Scenarios.onStep(n.scenario); // Chats: підсвітка в списку сценаріїв
    if (n.back) { // «Повернутись у кошик» — чат відкрито поверх екрана; показуємо щойно замінений рядок
      this.close();
      const row = document.querySelector('#cart .cart-row.is-new');
      if (row) setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
      return;
    }
    // перехід на екран одразу до потрібного блоку («Знайти у застосунку»): екран заїжджає — тоді прокручуємо
    if (n.go && n.spot) setTimeout(() => Scenarios.spot(n.spot), 600);
    if (n.run && !n.go) return runStep.call(this, n, said);
    return baseRunNode.call(this, n, said);
  };
  // теги привітання чат позначає як kind: 'opener' — крок із run() однаково виконуємо як крок сценарію
  const baseRunTag = chat.runTag;
  chat.runTag = function (t, all) {
    if (t.run) return this.runNode(t);
    return baseRunTag.call(this, t, all);
  };

  /** Крок сценарію з run(): слова гостя → [підтвердження дії] → відповідь МГ.
      run() повертає { text, items, after, chips, context, confirm: { text, undo } } */
  function runStep(n, said) {
    // крок із фото (напр. список покупок): гість «надсилає» фото — повідомлення-картинка
    if (n.photo && !said) { this.anchor = null; this.thread.push({ from: 'user', photo: n.photo, text: '' }); this.render(); }
    else this.push('user', said || n.label);
    const r = n.run() || {};
    Scenarios.all[n.scenario]?.remember?.(r);
    if (r.confirm) {
      // «Скасувати» діє лише до наступної дії з кошиком
      this.thread.forEach(m => { if (m.kind === 'confirm') m.undoable = false; });
      this.thread.push({ from: 'bot', kind: 'confirm', text: r.confirm.text, undo: r.confirm.undo, undoable: true });
      this.render();
    }
    // після дії першим на екрані — підтвердження, під ним відповідь МГ
    const anchor = r.confirm ? this.thread.length - 1 : null;
    if (r.list) freezeLists.call(this);
    const list = r.list && { ...r.list, scenario: n.scenario }; // чернетка списку — «Замінити» в рядку піде в цей сценарій
    // рядок контексту — лише припущення МГ: усе, що казав гість, і так видно в переписці
    const context = (r.context || []).filter(c => c.source === 'assumption');
    this.reply(r.text, r.items, this.nodes(r.chips), r.mood, { after: r.after, context, anchor, list, card: r.card });
  }

  /** Старі чернетки лишаються такими, як були: копіюємо їхні рядки (остання ділить рядки зі сценарієм) */
  function freezeLists() {
    this.thread.forEach(m => { if (m.kind === 'list') m.rows = m.rows.map(r => ({ ...r })); });
  }

  /** Перемалювати чернетку на місці (кількість, «не беру») — без нового повідомлення й без прокрутки */
  function redrawList(i) {
    const el = chat.threadEl.querySelector(`.ai-list[data-msg="${i}"]`);
    if (el) el.outerHTML = chat.listCard(chat.thread[i], Number(i), true);
  }

  /* Тапи всередині чату: «Скасувати» в підтвердженні, «×» у рядку контексту, чернетка списку */
  document.addEventListener('DOMContentLoaded', () => {
    chat.el.addEventListener('click', e => {
      const undo = e.target.closest('[data-undo]');
      if (undo) {
        const m = chat.thread[undo.dataset.undo];
        if (!m || !m.undoable) return;
        m.undoable = false;
        m.undone = true;
        const r = m.undo() || {};
        chat.session++; // відповідь, що ще «друкується», вже не актуальна
        chat.thread = chat.thread.filter(x => !x.typing);
        chat.thread.push({ from: 'bot', text: r.text, tags: r.list ? null : chat.nodes(r.chips) });
        chat.anchor = chat.thread.length - 1;
        if (r.list) { freezeLists.call(chat); chat.thread.push({ from: 'bot', kind: 'list', ...r.list, scenario: chat.lastNode && chat.lastNode.scenario, tags: chat.nodes(r.chips) }); }
        chat.render();
        return;
      }
      // чернетка: кількість і «не брати / повернути» — правка пропозиції, без нового повідомлення
      const qty = e.target.closest('[data-list-qty]');
      if (qty) {
        const m = chat.thread[qty.dataset.listMsg];
        const row = m && m.rows.find(r => r.id === qty.dataset.id);
        if (!row) return;
        const next = (row.qty || 1) + Number(qty.dataset.listQty);
        if (next < 1) row.off = true; // мінус на 1 шт (кошик) — не видаляє, а «не беру»
        else row.qty = next;
        redrawList(qty.dataset.listMsg);
        return;
      }
      const back = e.target.closest('[data-list-on]');
      if (back) {
        const m = chat.thread[back.dataset.listMsg];
        const row = m && m.rows.find(r => r.id === back.dataset.listOn);
        if (row) { row.off = false; row.qty = row.qty || 1; redrawList(back.dataset.listMsg); }
        return;
      }
      const add = e.target.closest('[data-list-add]');
      if (add) {
        const m = chat.thread[add.dataset.listAdd];
        const s = m && Scenarios.all[m.scenario];
        // своя кнопка чернетки (напр. «що докласти»), інакше — сценарію
        const step = m && m.onAdd ? m.onAdd(m.rows) : s && s.listAdd && s.listAdd(m.rows);
        if (step) chat.runNode(step);
        return;
      }
      // тап по товару в чернетці — картка товару (заїжджає справа, «Назад» — у розмову)
      const go = e.target.closest('.ai-list [data-go]');
      if (go) { e.stopPropagation(); chat.pushTo('pdp', go.dataset.param); return; }
      const cardAct = e.target.closest('[data-card-act]');
      if (cardAct) {
        const s = chat.lastNode && Scenarios.all[chat.lastNode.scenario];
        const step = s && s.cardAction && s.cardAction(cardAct.dataset.cardAct);
        if (step) chat.runNode(step);
        return;
      }
      const act = e.target.closest('[data-row-act]');
      if (act) {
        const m = chat.thread[act.dataset.listMsg];
        const s = m && Scenarios.all[m.scenario];
        const step = s && s.rowAction && s.rowAction(act.dataset.rowAct);
        if (step) chat.runNode(step);
        return;
      }
      const x = e.target.closest('[data-ctx-remove]');
      if (x) {
        const m = chat.thread[x.dataset.ctxMsg];
        const c = m && m.context[x.dataset.ctxRemove];
        const s = chat.lastNode && Scenarios.all[chat.lastNode.scenario];
        const step = c && s && s.removeCondition && s.removeCondition(c.type);
        if (step) chat.runNode(step);
      }
    });
  });
  /* Своє питання: сценарій, що його впізнав, відповідає як на тег (але в чаті — слова гостя) */
  const baseAsk = chat.ask.bind(chat);
  chat.ask = function (text) {
    if (!text.trim()) return;
    const t = text.trim().toLocaleLowerCase('uk-UA');
    for (const s of Object.values(Scenarios.all)) {
      const node = s.route && s.route(t, this.lastNode);
      if (node) return this.runNode(node, text.trim());
    }
    // Chats: «Не зрозумів» за правилами — одним реченням, на «ти», і 2–3 доречні старти
    if (Branch.current === 'd') {
      this.push('user', text);
      const starts = ['wine', 'predict', 'recipe'].map(id => Scenarios.all[id] && { ...Scenarios.all[id].opener, kind: 'node' }).filter(Boolean);
      return this.reply('Не зовсім зрозумів. Можу підібрати товар, зібрати кошик чи знайти рецепт — або напиши інакше.', null, this.nodes(starts));
    }
    return baseAsk(text);
  };

  /* Камера в полі вводу: у прототипі «фото» — готовий рукописний список (сценарій «Список із фото») */
  document.addEventListener('DOMContentLoaded', () => {
    const cam = chat.el && chat.el.querySelector('.ai-field__camera');
    if (cam) cam.addEventListener('click', () => {
      const s = Scenarios.all['photo-list'];
      if (s) chat.runNode({ ...s.opener, kind: 'node' });
    });
  });

  const baseOpen = chat.open;
  chat.open = function (opts) {
    this.el.classList.toggle('is-over', Boolean(App.current && App.current.id !== 'home'));
    return baseOpen.call(this, opts);
  };


  /** Відкрити чат поверх поточного екрана й одразу виконати крок (вхід із кошика) */
  function chatOver(step) {
    if (!step) return;
    chat.open({ greet: false });
    chat.greetedOn = chat.contextKey(); // уже в розмові — без привітання
    chat.runNode(step);
  }

  /* Кошик: іконка заміни з проду в кожному рядку → чат «Чим замінити X?»; «нове» біля заміненого */
  document.addEventListener('DOMContentLoaded', () => {
    const baseUpdate = Screens.cart.update;
    Screens.cart.update = function () {
      baseUpdate.apply(this, arguments);
      document.querySelectorAll('#cart .cart-row').forEach(row => {
        const id = row.querySelector('[data-param]')?.dataset.param;
        if (!id || row.querySelector('.cart-row__swap')) return;
        row.querySelector('.cart-row__top').insertAdjacentHTML('beforeend',
          `<button class="cart-row__swap" type="button" data-cart-swap="${id}" aria-label="Замінити з МГ: ${DATA.products[id].name}"><img src="assets/icons/change.svg" alt=""></button>`);
        if (Scenarios.cartNew.has(id)) row.classList.add('is-new');
      });
      cartChips();
    };
    Screens.cart.update();
  });
  /* Жовті чіпси МГ над кошиком — лише ті, на які МГ має реальну відповідь, не більше трьох:
     «Де зекономити?» — є рівноцінні дешевші заміни; «Як доставити дешевше?» — до порогу ≤ 300 ₴;
     «Що з цього приготувати?» — у кошику є інгредієнт рецепта. Заміна окремого товару — іконкою в рядку. */
  function cartChips() {
    const body = document.querySelector('#cart .cart-body');
    if (!body) return;
    const R = Scenarios.all.predict;
    const fresh = Scenarios.all.recipe && Scenarios.all.recipe.cartMatch(); // є інгредієнт якогось рецепта
    const intents = [
      R && R.cartSavings().length && { label: 'Де зекономити?', cartSave: true },
      R && R.cartNearDelivery() && { label: 'Як доставити дешевше?', cartDelivery: true },
      fresh && { label: 'Що з цього приготувати?', cartRecipe: true },
    ].filter(Boolean);
    const key = Cart.count() ? intents.map(t => t.label).join('|') : '';
    const old = body.querySelector('.mg-block');
    if ((old ? old.dataset.key : '') === key && (old || !key)) return; // не перемальовуємо без потреби (прокрутка чипів)
    if (old) old.remove();
    if (!key) return;
    body.insertAdjacentHTML('afterbegin', MG.block(intents, { compact: true }));
    const block = body.querySelector('.mg-block');
    block.dataset.key = key;
    block.querySelectorAll('.hscroll').forEach(enableDragScroll);
  }

  document.addEventListener('click', e => {
    const swap = e.target.closest('[data-cart-swap]');
    if (!swap) return;
    e.stopPropagation();
    chatOver(Scenarios.all.predict && Scenarios.all.predict.cartEntry(swap.dataset.cartSwap));
  }, true);
  // жовтий чіп «Замінити товар» над кошиком
  const baseMgStart = MG.start.bind(MG);
  MG.start = function (t) {
    const R = Scenarios.all.predict;
    if (t.cartReplace) return chatOver(R && R.cartAsk());
    if (t.cartSave) return chatOver(R && R.cartSave());
    if (t.cartDelivery) return chatOver(R && R.cartDelivery());
    if (t.cartRecipe) return chatOver(Scenarios.all.recipe && Scenarios.all.recipe.cartRecipe());
    return baseMgStart(t);
  };


  /* ---------- Лише гілка C: точки входу «Зібрати кошик» ведуть у сценарій із чернеткою ---------- */
  if (Branch.current === 'c') {
    // привітання на головній: «Зібрати покупки» (карусель) → «Зібрати кошик» (чернетка-список)
    const baseOpeners = chat.screenOpeners;
    chat.screenOpeners = function () {
      const list = baseOpeners.call(this);
      const R = Scenarios.all.predict;
      if (this.screenKey() !== 'home' || !R) return list;
      return list.map(Scenarios.toScenario);
    };
    // острівець «Давай зберу тобі кошик?»: тап — згода гостя, далі той самий сценарій
    if (typeof MgIsland !== 'undefined') {
      const baseActivate = MgIsland.activate.bind(MgIsland);
      MgIsland.activate = function () {
        const ctx = this.context, R = Scenarios.all.predict;
        if (!ctx || ctx !== DATA.aiChat.island.home || !R) return baseActivate();
        this.hide();
        chat.open({ greet: false });
        chat.greetedOn = chat.contextKey();
        if (!chat.thread.some(m => m.from === 'user')) chat.thread = [];
        chat.thread.push({ from: 'bot', text: ctx.text });
        chat.anchor = null;
        chat.render();
        chat.runNode(R.opener, 'Так, збери');
      };
    }
  }
})();
