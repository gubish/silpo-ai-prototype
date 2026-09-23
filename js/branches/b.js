/* =====================================================================
   ГІЛКА B — зміни даних і екранів відносно основного дизайну (A).
   Працює, лише коли в перемикачі вибрано «B». Стилі гілки — css/branches/b.css.

   data — ЛИШЕ те, що відрізняється від js/data.js, з тією самою вкладеністю.
     Об'єкти зливаються поглибше, масиви й значення замінюються цілком.
     Приклад: інший заголовок на головній і нова ціна банана —
       data: {
         home: { cinotyzhyky: { title: 'Ціни тижня' } },
         products: { banana: { price: 159 } },
       },

   screens — свій варіант цілого екрана (коли стилів і даних замало).
     Скопіюйте функцію з js/screens/<екран>.js і правте копію:
       screens: {
         home: function renderHomeB(root, param) { root.innerHTML = `…`; },
       },
   ===================================================================== */

/* Основні екрани — щоб гілка могла їх доповнити, а не переписувати */
const BaseScreens = { home: Screens.home, catalog: Screens.catalog, listing: Screens.listing, pdp: Screens.pdp, cart: Screens.cart };

/** У таб-барі екрана — Машрум замість «Покупок» (без підпису, більший).
    fab — готовий грибочок; без нього створюється новий (Rive малює js/ai-assistant.js). */
function mascotInTabbar(root, fab) {
  const i = DATA.tabbar.findIndex(t => t.id === 'purchases');
  const item = root.querySelectorAll('.tabbar__item')[i];
  if (!item) return;
  if (!fab) {
    fab = document.createElement('div');
    fab.className = 'ai-fab';
    fab.setAttribute('role', 'button');
    fab.tabIndex = 0;
    fab.setAttribute('aria-label', 'Відкрити чат з ШІ-помічником');
  }
  const slot = document.createElement('div');
  slot.className = 'tabbar__item tabbar__item--ai';
  slot.append(fab);
  item.replaceWith(slot);
  // екран перемальовано вже після старту (напр. лістинг іншої сторінки) — малюємо грибочок одразу;
  // на старті це зробить js/ai-assistant.js
  if (window.Mascot) Mascot.attach(fab);
}

Branch.define('b', {
  data: {
    /* Пошук: підказки під час набору (як в Amazon) — js/branches/b-search.js */
    /* Пошук натякає, що тут можна й запитати помічника (як «Search or ask a question» в Amazon) */
    home: { searchPlaceholder: 'Шукайте або запитайте' },
    catalog: { searchPlaceholder: 'Шукайте або запитайте' },
    search: {
      placeholder: 'Шукайте або запитайте',
      /* Запит схожий на питання — його отримує Машрум: перший чип «Помічник може допомогти»
         і «Надіслати» відкривають чат МГ (js/branches/b-search.js). Питання — якщо закінчується «?»
         або починається з одного з askWords. */
      askWords: ['що', 'як', 'чим', 'чому', 'який', 'яка', 'яке', 'які', 'де', 'коли', 'скільки', 'чи',
                 'порадь', 'порадьте', 'підкажи', 'підкажіть', 'допоможи', 'допоможіть', 'хочу', 'треба', 'можна'],
      startHistory: ['яблука зелені', 'вода мінеральна'], // щоб одразу було що підтягувати з історії
      demoQuery: 'яблука', // ДЕМО: перша ж літера в порожньому полі → цей запит (null — вимкнути)
      suggest: {
        products: 3,    // скільки товарів показати
        categories: 1,  // скільки категорій
        inCategory: 'у «{category}»',
        ai: 3,          // скільки намірів від Машрума
      },
      /* «Помічник може допомогти» у пошуку (js/branches/b-mg.js): жовті чипи мовою наміру гостя,
         залежать від запиту. match — початки слів запиту. Тап — чат МГ: чип стає першою
         реплікою, МГ уточнює (answer) або одразу підбирає (items), далі — next. */
      ai: {
        intents: [
          {
            match: ['ябл'],
            chips: [
              {
                label: 'Хочу солодкі яблука',
                answer: 'Зараз підберу. Просто солодкі чи важливо ще щось — наприклад, щоб були хрумкі?',
                next: [
                  { label: 'Просто солодкі', items: ['appleGolden'], answer: 'Тоді Голден — медово-солодкі й мʼякі.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Солодкі й хрумкі', items: ['appleGolden', 'applesGreen'], answer: 'Найсолодше з хрумких — свіжий Голден. Зелені ще хрумкіші, але з кислинкою.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Для дитини' },
                ],
              },
              {
                label: 'Яблука для шарлотки',
                items: ['applesGreen'],
                answer: 'Для шарлотки беріть зелені: кислинка врівноважить солодке тісто, і в духовці вони не розваляться. На форму 24 см — 4–5 яблук.',
                next: [{ label: 'Додати в кошик', action: 'addAll' }, { label: 'Рецепт шарлотки' }],
              },
              {
                label: 'Зібрати фрукти на тиждень',
                items: ['appleGolden', 'banana', 'pears', 'grapesRed', 'persimmon'],
                countForms: ['фрукт', 'фрукти', 'фруктів'],
                answer: 'Фрукти на тиждень для двох — {count} {countWord}: яблука, банани, груші, виноград і хурма, щоб не набридало.',
                next: [{ label: 'Додати все в кошик', action: 'addAll' }, { label: 'Лише сезонні' }],
              },
            ],
          },
          {
            match: ['вин'],
            chips: [
              {
                label: 'До вечері',
                answer: 'А що на вечерю — мʼясо, риба чи щось легке?',
                next: [
                  { label: 'Мʼясо', items: ['wineLail'], answer: 'До мʼяса — червоне сухе: Lail Cabernet Sauvignon з Напи.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Риба', items: ['winePascal', 'wineCasa'], answer: 'До риби — біле: класичне шаблі або легке віно верде.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Щось легке', items: ['wineCasa'], answer: 'Тоді віно верде — легке, свіже, з ледь відчутною бульбашкою.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                ],
              },
              {
                label: 'До сиру',
                answer: 'Які сири будуть — тверді чи мʼякі?',
                next: [
                  { label: 'Тверді', items: ['wineLail'], answer: 'До твердих сирів — насичене червоне Lail.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Мʼякі', items: ['winePascal'], answer: 'До мʼяких — шаблі: свіже й мінеральне.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Сирна тарілка', items: ['wineLail', 'winePascal'], answer: 'На сирну тарілку — по пляшці червоного й білого, щоб пасувало до всього.', next: [{ label: 'Додати обидва', action: 'addAll' }] },
                ],
              },
              {
                label: 'Допоможи вибрати',
                answer: 'Для якої нагоди — вечеря вдома, подарунок чи свято?',
                next: [
                  { label: 'Вечеря вдома', items: ['wineCasa', 'winePascal'], answer: 'Для вечері вдома — щось легке й недороге: віно верде або шаблі.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Подарунок', items: ['wineLail'], answer: 'У подарунок — Lail Vineyards 2013: колекційне каберне з Напи.', next: [{ label: 'Додати в кошик', action: 'addAll' }] },
                  { label: 'Свято', items: ['punchRauschgold', 'wineCasa'], answer: 'На свято — пунш із чорницею (підігріти) і легке біле до столу.', next: [{ label: 'Додати все в кошик', action: 'addAll' }] },
                ],
              },
            ],
          },
          {
            match: ['прал', 'порош'], // таких товарів у прототипі немає — МГ лише уточнює
            chips: [
              { label: 'Для дитячих речей', answer: 'Для дитячих речей — гіпоалергенний засіб без ароматизаторів. Дитині до року чи старша?', next: [{ label: 'До року' }, { label: 'Старша' }] },
              { label: 'Для кольорового', answer: 'Для кольорового — засоби з позначкою Color: бережуть яскравість. Перете в машинці чи вручну?', next: [{ label: 'У машинці' }, { label: 'Вручну' }] },
              { label: 'Допоможи вибрати', answer: 'Що переважно перете — щоденне, дитяче чи спортивне?', next: [{ label: 'Щоденне' }, { label: 'Дитяче' }, { label: 'Спортивне' }] },
            ],
          },
        ],
        // для будь-якого іншого запиту, за яким є товари
        generic: {
          label: 'Допоможи вибрати',
          answer: 'За запитом «{query}» є {count} {countWord}. Для чого берете — підкажу, що підійде.',
          countForms: ['товар', 'товари', 'товарів'],
          next: [{ label: 'Додати все в кошик', action: 'addAll' }, { label: 'Що дешевше?' }],
        },
      },
    },

    /* «Помічник може допомогти» на екранах (js/branches/b-mg.js). opener — готовий стартовий тег
       чату для цього екрана (DATA.aiChat.screens), можна кілька назв на вибір. */
    mg: {
      title: 'Помічник може допомогти',
      home: [
        { label: 'Зібрати покупки', opener: 'Зібрати покупки' },
        { label: 'Хочу щось поїсти', opener: 'Хочу щось поїсти' },
        { label: 'Знайти вигідне', opener: 'Знайти вигідне' },
        { label: 'Подбати про себе', opener: 'Подбати про себе' },
      ],
      catalog: [
        { label: 'Зібрати на кілька днів', opener: 'Зібрати на кілька днів' },
        { label: 'Щось на вечерю', opener: 'Щось на вечерю' },
        { label: 'Мої звичні продукти', opener: 'Мої звичні продукти' },
      ],
      listing: {
        fruits: [
          {
            label: 'Допоможи вибрати',
            answer: 'Для чого берете — на перекус, до десерту чи дітям?',
            next: [
              { label: 'На перекус', items: ['banana', 'appleGolden', 'grapesRed'], answer: 'На перекус — те, що не треба чистити ножем: банани, яблука, виноград.', next: [{ label: 'Додати все в кошик', action: 'addAll' }] },
              { label: 'До десерту', items: ['mango', 'peach', 'cherimoya'], answer: 'До десерту — найароматніші: манго, персик і черімоя.', next: [{ label: 'Додати все в кошик', action: 'addAll' }] },
              { label: 'Дітям', items: ['banana', 'appleGolden', 'pears', 'persimmon'], answer: 'Дітям — мʼякі й солодкі, без кісточок: банан, яблуко, груша, хурма.', next: [{ label: 'Додати все в кошик', action: 'addAll' }] },
            ],
          },
          { label: 'Найсолодші', opener: 'Найсолодші' },
          {
            label: 'До вина',
            items: ['grapesRed', 'pears', 'persimmon'],
            answer: 'До вина — виноград, груші й хурма: солодкі, але не перебивають смак. Особливо з сиром.',
            next: [{ label: 'Додати все в кошик', action: 'addAll' }, { label: 'А вино підкажеш?' }],
          },
        ],
      },
      pdp: [
        { label: 'З чим поєднати?', opener: ['З чим поєднати', 'Для чого підходить'] },
        { label: 'Знайти схоже', opener: ['Знайти схоже', 'Схоже дешевше'] },
      ],
      cart: [
        { label: 'Чогось не вистачає?', opener: 'Чогось не вистачає?' },
        { label: 'Що з цього приготувати?', opener: 'Що з цього приготувати?' },
      ],
    },
    /* Віджет сканерів на місці QR (js/branches/b-scan.js): тап — три кнопки дугою. */
    scanDial: {
      label: 'Сканери',
      items: [
        { id: 'qr',    label: 'QR-код',     icon: 'assets/icons/qr-code.svg' },
        { id: 'price', label: 'Сканер цін', icon: 'assets/icons/barcode.svg' },
        { id: 'self',  label: 'Вільнокаса', icon: 'assets/icons/self-checkout.svg' },
      ],
    },
    /* Картка товару як у Amazon — js/branches/b-quickview.js */
    /* Чат Машрума: AI-покупки й звʼязок зі звичайним кошиком — js/branches/b-chat.js */
    aiChat: {
      shop: {
        // «Додай банан» — МГ кладе товар і лише підтверджує (кошик не пропонує)
        addWords: ['додай', 'додати', 'поклади', 'покласти', 'купи', 'купити', 'візьми', 'взяти'],
        added: 'Додав {name} — {price}.',
        addedMany: 'Додав {name} × {qty} — {price}.',
        notFound: 'Не знайшов «{query}» у «Сільпо». Спробуйте назвати інакше.',
        // завершили місію («Додати все в кошик») — тоді й лише тоді пропонуємо кошик
        missionDone: '{mission}. У кошику {cartCount} {cartWord} на {total}.',
        missionDefault: 'Наче все',
        missionNames: { // назва місії = мітка стартового тегу або текстова місія нижче
          'Зібрати покупки': 'З покупками на кілька днів наче все',
          'Зібрати фрукти на тиждень': 'З фруктами на тиждень наче все',
          'Яблука для шарлотки': 'Яблука для шарлотки є',
        },
        checkCart: 'Перевірити кошик',
        keepShopping: 'Продовжити покупки',
        keepShoppingAnswer: 'Що ще шукаємо?',
        cartWords: ['товар', 'товари', 'товарів'],
        // «Збери …» текстом: місії за ключовими словами (початки слів)
        collectWords: ['збери', 'зібрати', 'підбери', 'підібрати'],
        missions: [
          {
            keywords: ['салат', 'фрукт'],
            name: 'З фруктовим салатом наче все',
            items: [{ id: 'banana' }, { id: 'appleGolden' }, { id: 'grapesRed', badges: ['cinotyzhyky'] },
                    { id: 'mango' }, { id: 'peach', badges: ['percent'] }, { id: 'lime' }],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Фруктовий салат на чотирьох — {count} {countWord}: банан, яблуко, виноград, манго, персик і лайм для заправки. Кладу?',
            next: [{ label: 'Додати все в кошик', action: 'addAll' }, { label: 'Без манго' }, { label: 'Ще й йогурт' }],
          },
          { keywords: ['покуп', 'продукт', 'набір', 'кілька днів'], opener: 'Зібрати покупки' }, // стартовий тег головної
        ],
        // своє питання (з чату чи пошуку) — стартовий тег за ключовими словами (початки слів)
        questionRoutes: [
          { keywords: ['вечер', 'приготув', 'поїсти', 'їсти', 'обід', 'сніданок'], opener: 'Хочу щось поїсти' },
          { keywords: ['знижк', 'дешев', 'вигідн', 'акці', 'зекономит'], opener: 'Знайти вигідне' },
          { keywords: ['покуп', 'продукти на', 'на тиждень', 'на кілька днів'], opener: 'Зібрати покупки' },
        ],
        // повернулись у чат, а кошик змінили в звичайному інтерфейсі
        cartChanged: 'Бачу, кошик оновився: тепер {cartCount} {cartWord} на {total}.',
      },
    },
    quickView: {
      details: 'Усі деталі',
      addToCart: 'У кошик',
      close: 'Закрити',
      detailRows: 3, // скільки рядків «Загальної інформації» показати в картці
    },
  },
  screens: {
    /* Плаваючого грибочка в гілці B немає ніде: Машрум живе в таб-барі.
       Головна: той самий грибочок (з настроями й відкриттям чату по тапу)
       переїжджає з плаваючої кнопки в таб-бар. */
    home(root, param) {
      BaseScreens.home(root, param);
      mascotInTabbar(root, document.querySelector('.fab-stack .ai-fab'));
      root.querySelector('.home-search .round-btn')?.remove(); // без кнопки сканування штрихкоду
      // «Помічник може допомогти» — перед «Популярними категоріями»
      root.querySelector('.home-categories').insertAdjacentHTML('beforebegin', MG.block(DATA.mg.home, { row: true }));
    },

    /* Каталог: замість стікі-панелі категорій (пошук, чипси, «доставка за 1 ₴») —
       таб-бар головної з активним пунктом «Доставка» і Машрумом */
    catalog(root, param) {
      BaseScreens.catalog(root, param);
      root.querySelector('.cat-bottom')?.remove();
      // «Помічник може допомогти» — під пошуком і «Акційними пропозиціями»
      root.querySelector('.cat-top').insertAdjacentHTML('afterend', MG.block(DATA.mg.catalog, { row: true }));
      root.insertAdjacentHTML('beforeend', UI.tabbar('delivery'));
      mascotInTabbar(root);
    },

    /* Лістинг: без нижньої стікі-панелі (меню, пошук, фільтр, кнопка кошика).
       Фільтр — у правому верхньому куті поруч із сортуванням, панель «Лише акційні»
       відкривається під табами. Внизу — таб-бар з активною «Доставкою» і Машрумом.
       Вузли переносимо, а не малюємо заново, — логіка фільтрів з js/screens/listing.js працює як була. */
    listing(root, param) {
      BaseScreens.listing(root, param);
      const bottom = root.querySelector('.plp-bottom');
      root.querySelector('.plp-appbar__sort').before(root.querySelector('.plp-filter-btn'));
      root.querySelector('.plp-tabs').after(root.querySelector('.plp-filter'));
      // «Помічник може допомогти» — під табами й фільтром, над товарами
      const mgList = DATA.mg.listing[param || DATA.listing.defaultPage];
      root.querySelector('.plp-filter').insertAdjacentHTML('afterend', MG.block(mgList, { row: true }));
      bottom.remove();
      root.insertAdjacentHTML('beforeend', UI.tabbar('delivery'));
      mascotInTabbar(root);
    },

    /* Картка товару: без плаваючої плашки кошика над панеллю ціни й «У кошик».
       Таб-бару тут немає. */
    pdp(root, param) {
      BaseScreens.pdp(root, param);
      root.querySelector('.pdp-bottom .cart-pill')?.remove();
      // «Помічник може допомогти» — одразу під назвою товару
      root.querySelector('.pdp-head').insertAdjacentHTML('afterend', MG.block(DATA.mg.pdp, { row: true }));
    },

    /* Кошик: «Помічник може допомогти» над списком товарів; порожній кошик — блоку немає */
    cart: Object.assign(function (root, param) {
      BaseScreens.cart(root, param);
      root.querySelector('.cart-body').insertAdjacentHTML('afterbegin', MG.block(DATA.mg.cart, { row: true }));
    }, {
      update() {
        BaseScreens.cart.update();
        const block = document.querySelector('#cart .mg-block');
        if (block) block.hidden = !Cart.count();
      },
    }),
  },
});

