/* =====================================================================
   СЦЕНАРІЙ «Знайти у застосунку» (гілка Chats; працює і в C). За правилами docs/mg-dialog-rules.md.
   Гість питає, де щось у застосунку чи як це зробити: «Як змінити адресу доставки?», «Де ввести промокод?».
   • Пряма відповідь у першому реченні: де це і як воно називається на екрані (назви — з DATA, як на екрані).
   • Один чіп «Відкрити …»: веде на екран і прокручує до потрібного блоку; «Назад» — знову в розмову.
     Пряма команда («відкрий кошик») — відкриваємо одразу, без зайвого кроку.
   • Такого в застосунку немає — чесно, і що є натомість: промокоду немає → сертифікат.
   • Не знаємо, де це, — не вгадуємо: найближчі місця чіпсами або людина з підтримки.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats

  const K = () => DATA.checkout;
  const method = t => K().methods.find(m => m.title === t) || {};
  const node = (label, run) => ({ label, scenario: 'app-search', appSearch: true, run });
  /** Чіп-перехід: екран + до чого на ньому прокрутити ({ sel, has } — блок, у тексті якого є has) */
  const open = (label, go, spot, param) => ({ label, go, param, spot: spot && { screen: go, ...spot } });
  const CO = has => ({ sel: '.co-card', has });

  /* ---------- Місця в застосунку ----------
     words — як гість про це питає; answer() — пряма відповідь з даних; chip — куди веде. */
  const PLACES = [
    {
      id: 'address', words: [/адрес/, /куди (доставити|привезти)/, /квартир|поверх|підʼїзд|під'їзд/],
      answer: () => `Адресу міняєш на оформленні — у блоці «${K().addressTitle}», олівцем біля адреси. Там же поверх, підʼїзд і квартира.`,
      chip: () => open('Відкрити оформлення', 'checkout', CO(K().addressTitle)),
    },
    {
      id: 'pickup', words: [/самовивіз|забрати .*сам|сам(а|ому|остійно)? забрати|забрати (в|у|з) магазин/],
      answer: () => `Так, самовивіз з магазину — ${method('Самовивіз').price}. Обирається першим кроком оформлення, у «${K().methodsTitle}».`,
      chip: () => open('Відкрити оформлення', 'checkout', CO(K().methodsTitle)),
    },
    {
      id: 'express', words: [/експрес|швидше привез|якнайшвидше|за годину/],
      answer: () => `Є «Експрес» — ${lc(method('Експрес').text)}. Обирається першим кроком оформлення, у «${K().methodsTitle}».`,
      chip: () => open('Відкрити оформлення', 'checkout', CO(K().methodsTitle)),
    },
    {
      id: 'slot', words: [/час доставки|змінити час|на завтра|інш(ий|у) (день|час)|слот/],
      answer: () => `День і час обираєш на оформленні, одразу під способом доставки: ${K().days.map(d => d.label.toLocaleLowerCase('uk-UA')).slice(0, 2).join(', ')} чи інший день, далі — проміжок часу.`,
      chip: () => open('Відкрити оформлення', 'checkout', CO(K().methodsTitle)),
    },
    {
      id: 'promo', words: [/промокод|промо-код|купон|знижков(ий|ого) код/],
      answer: () => `Поля для промокоду на оформленні немає. Є ${lc(K().certificate.title)} — додаєш його перед оплатою, один на замовлення.`,
      chip: () => open('Показати сертифікат', 'checkout', CO(K().certificate.title)),
    },
    {
      id: 'certificate', words: [/сертифікат|подарунков(а|у) карт/],
      answer: () => `${K().certificate.title} додаєш на оформленні, перед оплатою. ${K().certificate.hint.replace('Можете', 'Можна').replace('Сума', 'сума')}`,
      chip: () => open('Показати сертифікат', 'checkout', CO(K().certificate.title)),
    },
    {
      id: 'replace', words: [/не буде (потрібн|товар)|немає товар.*замін|чим замінять|якщо (чогось|товару) не буде/],
      answer: () => `Це налаштовуєш на оформленні: «${K().replacement.title}». Зараз там — «${K().replacement.text}».`,
      chip: () => open('Відкрити оформлення', 'checkout', { sel: '.co-replace' }),
    },
    {
      id: 'payment', words: [/оплат|карт(у|ку) (змінити|поміняти)|apple pay|google pay|платіж/],
      answer: () => `Спосіб оплати видно внизу оформлення, біля кнопки оплати: зараз — ${K().payment.method}. Поміняти — «${K().payment.change}».`,
      chip: () => open('Відкрити оформлення', 'checkout', { sel: '.co-bottom' }),
    },
    {
      id: 'catalog', words: [/каталог|категорі|розділ(и)? товар|де (фрукт|овоч|сир|мʼяс|м'яс)/],
      answer: () => `Усі товари — у каталозі, за розділами: ${DATA.catalog.sections.slice(0, 3).map(s => s.title.replace('‘', 'ʼ').split(',')[0].toLocaleLowerCase('uk-UA')).join(', ')} та інші.`,
      chip: () => open('Відкрити каталог', 'catalog'),
    },
    {
      id: 'cart', words: [/кошик/],
      answer: () => (Cart.count() ? `Кошик — значок унизу чату, там ${count(Cart.count(), ['товар', 'товари', 'товарів'])} на ${money(Cart.total())}.` : 'Кошик зараз порожній. Щойно щось додаси — унизу чату зʼявиться плашка кошика.'),
      chip: () => (Cart.count() ? open('Відкрити кошик', 'cart') : null),
    },
  ];
  const lc = s => s.charAt(0).toLocaleLowerCase('uk-UA') + s.slice(1);
  const money = v => UI.money(v).replace('.00', '');
  const count = (n, forms) => `${n} ${aiPlural(n, forms)}`;
  const hit = (p, t) => p.words.some(re => re.test(t));

  /** Пряма відповідь і один чіп-перехід */
  function answer(p) {
    const chip = p.chip && p.chip();
    return { text: p.answer(), chips: chip ? [chip] : [] };
  }
  /** «Відкрий кошик» — дія, яку просили: відкриваємо одразу; МГ лише каже, що відкрив */
  function goNow(p) {
    const chip = p.chip && p.chip();
    if (!chip) return answer(p);
    setTimeout(() => AiChat.runNode(chip), DATA.aiChat.replyDelay + 400);
    return { text: `Відкриваю. Повернутись у розмову — стрілкою «Назад».` };
  }
  /** Не знаємо, де це, — не вгадуємо: найближчі місця і людина з підтримки */
  function unknown() {
    return {
      text: 'Не знаю, де це в застосунку, — не вгадуватиму. Можу показати оформлення чи каталог або дати контакти підтримки.',
      chips: [open('Відкрити оформлення', 'checkout'), open('Відкрити каталог', 'catalog'), node('Написати в підтримку', () => ({ text: Scenarios.supportText(), card: Scenarios.supportCard() }))],
    };
  }

  // \b у JS не бачить меж кириличних слів — тому (\s|,|$)
  const ASK = /^(де|як|куди|чи можна|можна|а де|а як)(\s|,|$)|у застосунку|в застосунку|в додатку|у додатку|знайти|знайду|поміняти|змінити/;
  const DO = /^(відкрий|покажи|перейди|відкрити|веди)/;

  function route(t) {
    const p = PLACES.find(x => hit(x, t));
    if (p && DO.test(t)) return node(t, () => goNow(p));
    if (p && (ASK.test(t) || /\?$/.test(t))) return node(t, () => answer(p));
    // явно про застосунок, але такого місця не знаємо
    if (/(у|в) (застосунку|додатку)|де (тут|в меню|налаштуванн)|налаштуванн/.test(t)) return node(t, unknown);
    return null;
  }

  Scenarios.define({
    id: 'app-search',
    opener: node('Як змінити адресу доставки?', () => answer(PLACES[0])),
    cases: [
      { label: 'Як змінити адресу?', ask: 'Як змінити адресу доставки?' },
      { label: 'Такого немає: промокод', ask: 'Де ввести промокод?' },
      { label: 'Пряма команда', ask: 'Відкрий каталог' },
      { label: 'Не знає, де це', ask: 'Де в застосунку налаштування сповіщень?' },
    ],
    route,
  });
})();
