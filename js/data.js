/* =====================================================================
   DATA — УСІ ТЕКСТИ, ЦІНИ Й КАРТИНКИ ПРОТОТИПУ.
   Правте тут: назви, ціни, підписи, шляхи до картинок.
   • Ціни — числа в гривнях (напр. 159 або 44.99); формат «159.00 ₴» додається автоматично.
   • Картинки — шлях від index.html; щоб замінити, просто покладіть новий
     файл з тією ж назвою в assets/… або змініть шлях тут.
   • id товару (ключ у products) використовується в секціях і кошику.
   ===================================================================== */

window.DATA = {

  /* ---------------- Статус-бар ---------------- */
  statusBar: { time: '9:41' },

  /* ---------------- «Відкрийте як застосунок» (js/install-hint.js) ----------------
     Показується на телефоні, коли прототип відкрили QR-кодом (?from=qr) у браузері,
     а не з іконки на початковому екрані. ios — iPhone (Safari), other — Android (Chrome). */
  install: {
    title: 'Відкрийте як застосунок',
    text: 'Без адресного рядка й панелей браузера — на весь екран.',
    ios: [
      { icon: 'assets/icons/share.svg', text: 'Натисніть «Поділитися» — у Safari внизу або в меню «•••»' },
      { icon: 'assets/icons/add-square.svg', text: 'Виберіть «На початковий екран», потім «Додати»' },
      { icon: 'assets/images/app-icon.png', text: 'Запускайте прототип з іконки Машрума' },
    ],
    other: [
      { icon: 'assets/icons/more.svg', text: 'Відкрийте меню браузера — три крапки вгорі праворуч' },
      { icon: 'assets/icons/add-square.svg', text: 'Виберіть «Додати на головний екран» або «Установити застосунок»' },
      { icon: 'assets/images/app-icon.png', text: 'Запускайте прототип з іконки Машрума' },
    ],
    ok: 'Зрозуміло',
  },

  /* ---------------- Товари ---------------- */
  products: {
    hellmanns: {
      name: 'Майонез Hellmann’s Original 73% с/б',
      price: 159.00, oldPrice: 199.00, discount: 15, weight: '250 г',
      image: 'assets/images/products/mayonnaise-hellmanns.png',
    },
    pistachios: {
      name: 'Фісташки смажені солоні',
      price: 144.00, oldPrice: 179.00, discount: 15, weight: '250 г',
      image: 'assets/images/products/pistachios.png',
    },
    oliveOil: {
      name: 'Олія оливкова «Премія»® Pure суміш',
      price: 199.00, oldPrice: 249.00, discount: 10, weight: '250 г',
      image: 'assets/images/products/olive-oil-premia.png',
    },
    marshmallow: {
      name: 'Маршмелоу асорті',
      price: 44.99, oldPrice: 59.99, discount: 15, weight: '250 г',
      image: 'assets/images/products/marshmallow.png',
    },
    bakoma: {
      name: 'Десерт Bakoma Ave Vege на рослинній основі зі смаком солоної карамелі',
      price: 35.99, oldPrice: 39.99, discount: 10, weight: '150 г',
      image: 'assets/images/products/deal-of-day.png',
    },
    water075: {
      name: 'Вода мінеральна «Моршинська» негазована',
      price: 24.99, bonus: '+5', weight: '0,75 л',
      image: 'assets/images/products/water-morshynska-075.png',
    },
    water15: {
      name: 'Вода мінеральна «Моршинська» негазована',
      price: 30.99, bonus: '+6.2', weight: '1,5 л',
      image: 'assets/images/products/water-morshynska-15.png',
    },
    water15light: {
      name: 'Вода мінеральна «Моршинська» слабогазована',
      price: 30.99, bonus: '+6.2', weight: '1,5 л',
      image: 'assets/images/products/water-morshynska-15-light.png',
    },
    /* --- Лістинг «Фрукти, овочі» --- */
    pineapple: {
      name: 'Ананас', kind: 'fruit', price: 422.90, oldPrice: 798.25, discount: 30, weight: '100 г',
      image: 'assets/images/products/pineapple.jpg', tag: 'Фрукти',
    },
    applesGreen: {
      name: 'Яблука зелені', kind: 'fruit', price: 422.90, oldPrice: 798.25, discount: 30, weight: '100 г',
      image: 'assets/images/products/apples-green.png', tag: 'Фрукти',
    },
    pears: {
      name: 'Груші', kind: 'fruit', price: 422.90, weight: '100 г',
      image: 'assets/images/products/pears.png', tag: 'Фрукти',
    },
    tomatoes: {
      name: 'Помідори', price: 422.90, oldPrice: 798.25, discount: 30, weight: '100 г',
      image: 'assets/images/products/tomatoes.png', tag: 'Салат',
    },
    cabbage: {
      name: 'Капуста рання', price: 422.90, weight: '100 г',
      image: 'assets/images/products/cabbage.png', tag: 'Салат',
    },
    grapes: {
      name: 'Виноград фіолетовий', kind: 'fruit', price: 422.90, oldPrice: 798.25, discount: 30, weight: '100 г',
      image: 'assets/images/products/grapes-purple.png', tag: 'Фрукти',
    },
    /* --- Лістинг «Фрукти» (Figma: Велнес → Category, node 5725:2791) --- */
    appleGolden: {
      name: 'Яблуко Голден', kind: 'fruit', price: 190.00, weight: '85 г', rating: '4.8',
      image: 'assets/images/products/apple-golden.png',
    },
    banana: {
      name: 'Банан', kind: 'fruit', price: 170.00, weight: '100 г', rating: '4.8',
      image: 'assets/images/products/banana.png',
    },
    peach: {
      name: 'Персик', kind: 'fruit', price: 138.00, oldPrice: 200.90, discount: 20, weight: '280 г', rating: '4.8',
      image: 'assets/images/products/peach.png',
    },
    watermelon: {
      name: 'Кавун Вогник', kind: 'fruit', price: 244.00, weight: '100 г', rating: '4.8',
      image: 'assets/images/products/watermelon.png',
    },
    melon: {
      name: 'Диня Валенсія', kind: 'fruit', price: 190.00, oldPrice: 220.90, discount: 20, weight: '85 г', rating: '4.8',
      image: 'assets/images/products/melon.png',
    },
    lime: {
      name: 'Лайм', kind: 'fruit', price: 170.00, weight: '100 г', rating: '4.8',
      image: 'assets/images/products/lime.png',
    },
    grapesRed: {
      name: 'Виноград РедГлоб', kind: 'fruit', price: 138.00, weight: '280 г', rating: '4.8',
      image: 'assets/images/products/grapes-red-globe.png',
    },
    mango: {
      name: 'Манго Еліт', kind: 'fruit', price: 264.00, weight: '100 г', rating: '4.8',
      image: 'assets/images/products/mango.png',
    },
    persimmon: {
      name: 'Хурма Азербайджан', kind: 'fruit', price: 194.00, weight: '100 г', rating: '4.8',
      image: 'assets/images/products/persimmon.png',
    },
    cherimoya: {
      name: 'Черімоя', kind: 'fruit', price: 244.00, oldPrice: 340.90, discount: 20, weight: '100 г', rating: '4.8',
      image: 'assets/images/products/cherimoya.png',
    },
    /* --- Картка товару (PDP) і «Схожі товари» --- */
    wineLail: {
      name: 'Вино Lail Vineyards Napa Valley Cabernet Sauvignon Cuvee 2013, 15,9%, 0,75 л', kind: 'wine',
      shortName: 'Вино Lail Vineyards Napa Valley Cabernet Sauvignon Cuvee 2013',
      chatName: 'вина Lail Vineyards', // як Машрум називає товар у реченні
      price: 18767, weight: '0.75 л',
      image: 'assets/images/products/wine-lail-vineyards.png',
    },
    winePascal: {
      name: 'Вино Pascal Bouchard Chablis Le Classique', kind: 'wine',
      price: 949.60, oldPrice: 1490.00, discount: 25, weight: '0.75 л', rating: '4.8',
      image: 'assets/images/products/wine-pascal-bouchard.png',
    },
    punchRauschgold: {
      name: 'Вино плодове Rauschgold Engel Gluhpunsch Heidelbeere Пунш з чорницею', kind: 'wine',
      price: 199.90, oldPrice: 220.90, discount: 15, weight: '0.75 л', rating: '5.0',
      image: 'assets/images/products/punch-rauschgold.png',
    },
    wineCasa: {
      name: 'Вино Casa de Vilacetinho Vihno Verde Gr Eschola 2017', kind: 'wine',
      price: 437.50, weight: '0.75 л', rating: '4.9',
      image: 'assets/images/products/wine-casa-vilacetinho.png',
    },
  },

  /* Бейджі в лівому верхньому куті фото товару */
  badges: {
    cinotyzhyky: { image: 'assets/icons/badge-cinotyzhyky.svg', alt: 'Цінотижики' },
    klatsni:     { image: 'assets/icons/badge-klatsni.svg',     alt: 'Клацні знижки' },
    myOffer:     { image: 'assets/icons/section-my-offers.svg', alt: 'Моя пропозиція' },
    percent:     { image: 'assets/icons/badge-percent.svg',     alt: 'Знижка' },
  },

  /* ---------------- Нижній таб-бар ---------------- */
  tabbar: [
    // icon — сіра іконка; iconActive — синя, для активної вкладки
    { id: 'home',      label: 'Головна',    icon: 'assets/icons/tab-home.svg', iconActive: 'assets/icons/tab-home-active.svg', go: 'home' },
    { id: 'delivery',  label: 'Доставка',   icon: 'assets/icons/tab-delivery.svg', iconActive: 'assets/icons/tab-delivery-active.svg', go: 'catalog' },
    { id: 'cart',      label: 'Кошик',      icon: 'assets/icons/tab-cart.svg',      go: 'cart' },
    { id: 'store',     label: 'В магазині', icon: 'assets/icons/tab-store.svg' },
    { id: 'purchases', label: 'Покупки',    icon: 'assets/icons/tab-purchases.svg' },
  ],

  /* =================================================================
     ГОЛОВНА
     ================================================================= */
  home: {
    delivery: {
      type: 'Доставка',
      slot: 'з <b>12:00</b> до 13:30',
      address: 'Вул. Рея Бредбері, 5/15. Київ',
      bonus: '123.00',
      notifications: 3,
    },

    ecosystem: [
      { label: 'Власний Рахунок',    icon: 'assets/icons/eco-vr.svg' },
      { label: 'Мої пропозиції',     icon: 'assets/icons/eco-offers.svg', badge: '45' },
      { label: 'Колесо фортуни',     icon: 'assets/icons/eco-fortune.svg' },
      { label: 'Підписка «Плюхс»',   icon: 'assets/icons/eco-pluhs.svg' },
    ],

    promo: {
      title: 'Оберіть 5 із 10 пропозицій',
      subtitle: 'Спеціальна добірка для вас',
      sticker: '-10%',
      image: 'assets/images/home/promo-5-of-10.png',
      footer: 'Оновлення щосереди',
    },

    searchPlaceholder: 'Пошук в «Сільпо»',

    services: [
      { title: 'З «Сільпо» поруч',       badge: '7 000 товарів',  image: 'assets/images/home/service-delivery.png' },
      { title: 'З найбільшого «Сільпо»', badge: '50 000 товарів', image: 'assets/images/home/service-darkhub.png' },
      { title: '«Сільпо» самовивіз',                              image: 'assets/images/home/service-pickup.png' },
    ],
    quickServices: [
      { title: 'Доставка за 30 хв',     image: 'assets/images/home/service-loko.svg',        size: 40 },
      { title: 'Доставка з ресторанів', image: 'assets/images/home/service-restaurants.png', size: 48 },
    ],

    categories: {
      title: 'Популярні категорії',
      promo: { label: 'Акційні пропозиції', image: 'assets/images/categories/promo-offers.png' },
      items: [
        { label: 'Фрукти, овочі',               icon: 'assets/images/categories/fruits-vegetables.svg' },
        { label: 'М’ясо',                       icon: 'assets/images/categories/meat.svg' },
        { label: 'Молочні продукти та яйця',    icon: 'assets/images/categories/dairy-eggs.svg' },
        { label: 'Хліб та випічка',             icon: 'assets/images/categories/bread.svg' },
        { label: 'Ковбаси і м’ясні делікатеси', icon: 'assets/images/categories/sausages.svg' },
        { label: 'Заморожена продукція',        icon: 'assets/images/categories/frozen.svg' },
      ],
      more: 'Дивитись всі',
    },

    dealOfDay: { title: 'Товар дня', date: 'Ср 27 лист.', product: 'bakoma' },

    cinotyzhyky: {
      title: 'Цінотижики',
      subtitle: 'Вони з’являються щотижня у четвер',
      icon: 'assets/icons/section-cinotyzhyky.svg',
      items: [
        { id: 'hellmanns' },
        { id: 'pistachios', liked: true },
        { id: 'oliveOil' },
        { id: 'marshmallow' },
      ],
    },

    onlineOnly: {
      title: 'Тільки онлайн',
      subtitle: 'Вони з’являються щотижня у четвер',
      icon: 'assets/icons/section-online.svg',
      items: [
        { id: 'hellmanns' },
        { id: 'pistachios', liked: true },
        { id: 'oliveOil' },
        { id: 'marshmallow' },
      ],
    },

    banner: {
      image: 'assets/images/banners/delivery-or-pickup.png',
      alt: 'Спробуйте доставку або самовивіз — Власний Рахунок',
      slides: 4,
    },

    reorder: {
      title: 'Замов знову',
      icon: 'assets/icons/section-reorder.svg',
      items: [
        { id: 'hellmanns',   badge: 'cinotyzhyky' },
        { id: 'pistachios',  badge: 'klatsni', liked: true },
        { id: 'oliveOil',    badge: 'cinotyzhyky' },
        { id: 'marshmallow', badge: 'klatsni' },
      ],
    },

    myOffers: {
      title: 'Мої пропозиції',
      icon: 'assets/icons/section-my-offers.svg',
      coupons: [
        { percent: '20%', caption: 'повертаємо балобонусами', title: 'Свіжі банани з Еквадору', expires: 'Діє 7 днів', bg: '#e1888f', image: 'assets/images/banners/coupon-avocado.png' },
        { percent: '20%', caption: 'повертаємо балобонусами', title: 'Свіжі банани з Еквадору', expires: 'Діє 7 днів', bg: '#e1d6ba', image: 'assets/images/banners/coupon-eggs.png' },
        { percent: '20%', caption: 'повертаємо балобонусами', title: 'Свіжі банани з Еквадору', expires: 'Діє 7 днів', bg: '#f6e9cf', image: 'assets/images/banners/coupon-ezoo.jpg', dark: true },
      ],
    },

    buyBetter: {
      title: 'Купуйте вигідніше',
      subtitle: 'Товари, на які діють ваші пропозиції',
      items: [
        { id: 'water075',     badge: 'myOffer' },
        { id: 'water15',      badge: 'myOffer' },
        { id: 'water15light', badge: 'myOffer' },
      ],
    },

    games: {
      title: 'Ігри з нагородами',
      subtitle: 'Грайте та більше вигоди вигравайте!',
      items: [
        { image: 'assets/images/banners/game-polyubichcha.png', alt: 'Полюбичча — Зазирнути' },
        { image: 'assets/images/banners/game-paket.png',        alt: 'Пакет' },
      ],
    },

    lastOrder: {
      emoji: '🤗',
      title: 'Попереднє замовлення – топчик!',
      type: 'Доставка',
      date: '17 жовтня 2024, 19:35',
      address: 'Вул. Рея Бредбері, 5/15',
      total: '946.00 ₴',
      action: 'Додати в кошик знову',
      thumbs: [
        'assets/images/products/thumb-baguette.png',
        'assets/images/products/thumb-wine.png',
        'assets/images/products/thumb-bananas.png',
      ],
    },

    favorites: {
      title: 'Улюблене',
      icon: 'assets/icons/section-favorites.svg',
      items: [
        { id: 'hellmanns',   badge: 'cinotyzhyky' },
        { id: 'pistachios',  badge: 'klatsni', liked: true },
        { id: 'oliveOil',    badge: 'cinotyzhyky' },
        { id: 'marshmallow', badge: 'klatsni' },
      ],
    },
  },

  /* =================================================================
     КАТАЛОГ
     • У назвах плиток «\n» = перенесення рядка (кожен рядок — окрема біла плашка).
     ================================================================= */
  catalog: {
    address: 'вул Миколи Миклухи, 1Г',
    city: 'Київ',
    timeslot: { day: 'Сьогодні', time: '00:00 – 00:00' },
    express: 'Прискорити доставку за ХХ ₴. Привеземо <em>до YY хв</em>.',
    searchPlaceholder: 'Пошук в «Сільпо»',
    promo: { title: 'Акційні пропозиції', badges: 'assets/images/catalog/promo-badges.png' },
    chips: ['Тільки онлайн', 'Піца, бургери та суші', 'Святку з Jacobs'],

    sections: [
      {
        id: 'fruits', title: 'Фрукти, овочі, соління', color: '#ebf6d8',
        tiles: [
          { label: 'Фрукти',                        image: 'assets/images/catalog/fruits.png', go: 'listing' },
          { label: 'Овочі',                         image: 'assets/images/catalog/vegetables.png', go: 'listing' },
          { label: 'Соління\nмариновані\nстрави',   image: 'assets/images/catalog/pickles.png', go: 'listing' },
          { label: 'Салати',                        image: 'assets/images/catalog/vegetables.png', go: 'listing' },
          { label: 'Зелень',                        image: 'assets/images/catalog/greens.png', go: 'listing' },
          { label: 'Горіхи, гриби,\nсушені фрукти', image: 'assets/images/catalog/nuts-mushrooms-dried.png', go: 'listing' },
          { label: 'Фруктові\nделікатеси',          image: 'assets/images/catalog/fruit-delicacies.png', go: 'listing' },
          { label: 'Свіжі гриби',                   image: 'assets/images/catalog/fresh-mushrooms.png', go: 'listing' },
        ],
      },
      {
        id: 'meat', title: 'М‘ясо, риба, птиця', color: '#fcdada',
        tiles: [
          { label: 'Заморожена риба,\nморепродукти і\nмолюски',  image: 'assets/images/catalog/frozen-fish.png', go: 'listing' },
          { label: 'Приготовлена риба\nта морепродукти',        image: 'assets/images/catalog/cooked-fish.png', go: 'listing' },
          { label: 'Жива та охолоджена\nриба та\nморепродукти', image: 'assets/images/catalog/chilled-fish.png', go: 'listing' },
          { label: 'Свіже м’ясо',                               image: 'assets/images/catalog/fresh-meat.png', go: 'listing' },
        ],
      },
      {
        id: 'cheese', title: 'Сири', color: '#fff4c3',
        tiles: [
          { label: 'Сири м’які',     image: 'assets/images/catalog/soft-cheese.png', go: 'listing' },
          { label: 'Сири плавлені',  image: 'assets/images/catalog/processed-cheese.png', go: 'listing' },
          { label: 'Сири розсільні', image: 'assets/images/catalog/brine-cheese.png', go: 'listing' },
          { label: 'Сири плавлені',  image: 'assets/images/catalog/hard-cheese.png', go: 'listing' },
        ],
      },
    ],

    /* Нижня панель: швидкий перехід між категоріями */
    bottomCategories: [
      { label: 'Фрукти, овочі',         icon: 'assets/images/categories/fruits-vegetables.svg', section: 'fruits' },
      { label: 'М’ясо, риба, птиця',    icon: 'assets/images/categories/meat.svg',              section: 'meat' },
      { label: 'М’ясо-ковбасні вироби', icon: 'assets/images/categories/sausages.svg' },
      { label: 'Сири',                  icon: 'assets/images/categories/dairy-eggs.svg',        section: 'cheese' },
      { label: 'Хліб та випічка',       icon: 'assets/images/categories/bread.svg' },
      { label: 'Молочні продукти',      icon: 'assets/images/categories/dairy-eggs.svg' },
    ],
    deliveryHint: 'Хочеш доставку за 1 ₴? За деталями сюди 👉',
  },

  /* =================================================================
     ПОШУК (#search) — відкривається з пошуку на головній і в каталозі.
     Стани: 1) історії ще немає — «Можливо, ви шукаєте?» + категорії;
            2) історія є — «Історія пошуку» + категорії;
            набираємо — відповідні запити з історії + відповідні категорії;
            3) натиснули «Надіслати» — категорії-чипси + список товарів.
     • suggestions — чипси «Можливо, ви шукаєте?» (тап = пошук цього слова).
     • startHistory — що лежить в історії при відкритті прототипу (порожньо = стан 1).
     • categories — список категорій. Товари категорії:
         items — список id; rule: 'sale' — усі акційні; kind — усі товари цього типу.
         keywords — слова, за якими категорія знаходиться в пошуку (початки слів).
         go/param — куди веде тап; без go тап показує товари категорії тут же.
     • Пошук іде по назвах товарів (DATA.products): «яблуко» знайде «Яблука»,
       «банани» — «Банан» (порівнюються початки слів).
     ================================================================= */
  search: {
    placeholder: 'Пошук в «Сільпо»',
    suggestionsTitle: 'Можливо, ви шукаєте? 🔎',
    suggestions: ['Банани', 'Яблука', 'Вода', 'Вино', 'Виноград', 'Манго', 'Помідори', 'Фісташки', 'Майонез', 'Олія', 'Кавун'],
    historyTitle: 'Історія пошуку 👀',
    clear: 'Очистити',
    historyMax: 6,
    startHistory: [],
    categoriesTitle: 'Категорії',
    productsTitle: 'Товари',
    submitHint: 'Натисніть «Надіслати», щоб знайти «{query}»', // поки набираємо, а підказок немає
    empty: 'За запитом «{query}» нічого не знайшли. Спробуйте інакше або подивіться, що є:',
    categories: [
      { label: 'Добрі промо',                  icon: 'assets/icons/search/promo.svg',   rule: 'sale', keywords: ['промо', 'акці', 'знижк'] },
      { label: 'Фрукти, овочі',                icon: 'assets/icons/search/fruits.svg',  kind: 'fruit', items: ['tomatoes', 'cabbage'],
        keywords: ['фрукт', 'овоч', 'ягод'], go: 'listing', param: 'fruits' },
      { label: 'М’ясо',                        icon: 'assets/icons/search/meat.svg',    keywords: ['мʼяс', 'м’яс', 'мяс', 'курк', 'свин', 'ялов'], go: 'listing', param: 'fruits' },
      { label: 'Риба',                         icon: 'assets/icons/search/fish.svg',    keywords: ['риб', 'лосос', 'оселед'], go: 'listing', param: 'fruits' },
      { label: 'Ковбаси і м’ясні делікатеси',  icon: 'assets/icons/search/sausage.svg', keywords: ['ковбас', 'сосис', 'шинк'], go: 'listing', param: 'fruits' },
      { label: 'Сири',                         icon: 'assets/icons/search/cheese.svg',  keywords: ['сир'], go: 'listing', param: 'fruits' },
      { label: 'Хліб та випічка',              icon: 'assets/icons/search/bread.svg',   keywords: ['хліб', 'батон', 'багет', 'випіч', 'булк'], go: 'listing', param: 'fruits' },
      { label: 'Готові страви і кулінарія',    icon: 'assets/icons/search/ready.svg',   keywords: ['готов', 'кулінар', 'піц', 'салат'], go: 'listing', param: 'fruits' },
      { label: 'Молочні продукти та яйця',     icon: 'assets/icons/search/dairy.svg',   keywords: ['молок', 'кефір', 'йогурт', 'сметан', 'масло', 'яйц', 'вершк'], go: 'listing', param: 'fruits' },
      { label: 'Вода та напої',                icon: 'assets/icons/search/drinks.svg',  items: ['water075', 'water15', 'water15light'], keywords: ['вод', 'напо', 'мінерал', 'сік'] },
      { label: 'Бакалія, соуси й олія',        icon: 'assets/icons/search/grocery.svg', items: ['oliveOil', 'hellmanns'], keywords: ['бакал', 'соус', 'олі', 'майонез'] },
      { label: 'Солодощі та снеки',            icon: 'assets/icons/search/sweets.svg',  items: ['marshmallow', 'bakoma', 'pistachios'], keywords: ['солод', 'снек', 'десерт', 'горіх', 'цукерк'] },
      { label: 'Вино та алкоголь',             icon: 'assets/icons/search/wine.svg',    kind: 'wine', keywords: ['вин', 'алког', 'пунш'] },
    ],
  },

  /* =================================================================
     ЛІСТИНГ (PLP)
     • pages — сторінки лістингу. Для прототипу є лише «Фрукти»: усе з каталогу
       веде на defaultPage. Нова сторінка = новий ключ у pages + category у плитці каталогу.
     • tabs — чипси-фільтри; «tag» товару має збігатися з назвою чипса.
       tag можна задати прямо в items (має пріоритет) або в products.
     • Адреса сторінки: index.html#listing/fruits
     ================================================================= */
  listing: {
    defaultPage: 'fruits', // сюди веде весь каталог
    pages: {
      fruits: {
        title: 'Фрукти',
        chatTitle: 'фруктів', // як Машрум називає категорію в реченні: «серед фруктів»
        back: 'catalog',
        tabs: ['Всі', 'Екзотичні', 'Яблука, груші', 'Баштанні', 'Кісточкові', 'Виноград', 'Цитрусові'],
        items: [
          { id: 'banana',      tag: 'Екзотичні' },
          { id: 'appleGolden', tag: 'Яблука, груші', liked: true },
          { id: 'peach',       tag: 'Кісточкові', badges: ['percent'] },
          { id: 'watermelon',  tag: 'Баштанні' },
          { id: 'melon',       tag: 'Баштанні', badges: ['percent'] },
          { id: 'lime',        tag: 'Цитрусові' },
          { id: 'grapesRed',   tag: 'Виноград', badges: ['cinotyzhyky'] },
          { id: 'mango',       tag: 'Екзотичні' },
          { id: 'persimmon',   tag: 'Екзотичні', liked: true },
          { id: 'cherimoya',   tag: 'Екзотичні', badges: ['percent'] },
          { id: 'pineapple',   tag: 'Екзотичні', badges: ['cinotyzhyky', 'percent'] },
          { id: 'pears',       tag: 'Яблука, груші' },
        ],
      },
    },
    searchPlaceholder: 'Пошук в «Сільпо»',
    saleOnlyLabel: 'Лише акційні товари',
    empty: 'Нічого не знайдено. Спробуйте інший запит.',
    basket: { label: 'Кошик', delivery: 'Доставимо за XX ₴' },
  },

  /* =================================================================
     КАРТКА ТОВАРУ (PDP)
     • Картка відкривається для будь-якого товару: index.html#pdp/banana
     • products — вміст картки для кожного товару (ключ = id з products вище).
       Будь-який блок можна пропустити — він просто не показується.
         description — абзац «Опис»
         composition — { text, allergens: { label, value } } — блок «Склад»
         details     — рядки «Загальна інформація»
         nutrition   — { kcal, protein, fat, carbs, sugar, satFat } на 100 г
         warning     — плашка 18+ (для алкоголю)
         similar     — «Схожі товари»; якщо не задано — товари з того ж лістингу
     ================================================================= */
  pdp: {
    defaultProduct: 'wineLail',
    stock: 'Лишилось: 1000 шт',
    gallery: 5, // кількість крапок під фото
    titles: {
      description: 'Опис',
      composition: 'Склад',
      details: 'Загальна інформація',
      nutrition: 'Харчова цінність на 100 г',
      similar: 'Схожі товари',
    },
    nutritionLabels: { kcal: 'Калорійність', protein: 'Білки', fat: 'Жири', carbs: 'Вуглеводи', sugar: 'з них цукри', satFat: 'з них насичені' },
    more: 'Дивитись всі',
    addToCart: 'У кошик',

    products: {
      wineLail: {
        composition: {
          text: 'Вино Lail Vineyards (Лейл Віньярдс) Napa Valley Cabernet Sauvignon Cuve 2013 виготовлено з добірних сортів винограду: Каберне Совіньйон',
          allergens: { label: 'Алергени:', value: 'діоксид сірки' },
        },
        details: [
          { label: 'Торгова марка',           value: 'Chateau Tertre' },
          { label: 'Країна походження',       value: 'Франція' },
          { label: 'Колір вина',              value: 'Червоне' },
          { label: 'Смак вина',               value: 'Сухе' },
          { label: 'Сорт винограду',          value: 'Каберне Совіньйон, Мерло, Каберне Фран' },
          { label: 'Тон букета',              value: 'Фруктові, ягідні, пряні' },
          { label: 'Регіон походження вина',  value: 'Bordeaux' },
          { label: 'Кислотність',             value: 'Помірна' },
          { label: '% спирту',                value: '13' },
          { label: 'Гастрономічні поєднання', value: 'м\'ясо, м\'ясні закуски, тверді сири' },
        ],
        nutrition: { kcal: '87', protein: '9.5 г', fat: '15.5 г', satFat: '4.8 г', carbs: '4.1 г', sugar: '2.2 г' },
        warning: { badge: '18+', text: 'Придбати алкогольні напої можуть особи, які досягли 18 років. Надмірне споживання алкоголю шкідливе для вашого здоров\'я.' },
        similar: [
          { id: 'winePascal',      badges: ['cinotyzhyky'] },
          { id: 'punchRauschgold', badges: ['cinotyzhyky'] },
          { id: 'wineCasa' },
        ],
      },

      winePascal: {
        description: 'Класичне шаблі з Бургундії: свіже, мінеральне, з нотами цитрусових і зеленого яблука. До устриць, риби й мʼяких сирів.',
        composition: {
          text: 'Вино біле сухе, виготовлене з винограду сорту Шардоне.',
          allergens: { label: 'Алергени:', value: 'діоксид сірки' },
        },
        details: [
          { label: 'Торгова марка',           value: 'Pascal Bouchard' },
          { label: 'Країна походження',       value: 'Франція' },
          { label: 'Колір вина',              value: 'Біле' },
          { label: 'Смак вина',               value: 'Сухе' },
          { label: 'Сорт винограду',          value: 'Шардоне' },
          { label: 'Тон букета',              value: 'Цитрусові, мінеральні, квіткові' },
          { label: 'Регіон походження вина',  value: 'Chablis, Burgundy' },
          { label: 'Кислотність',             value: 'Висока' },
          { label: '% спирту',                value: '12.5' },
          { label: 'Гастрономічні поєднання', value: 'риба, морепродукти, мʼякі сири' },
        ],
        nutrition: { kcal: '82', protein: '0.1 г', fat: '0 г', carbs: '2.6 г', sugar: '0.9 г' },
        warning: { badge: '18+', text: 'Придбати алкогольні напої можуть особи, які досягли 18 років. Надмірне споживання алкоголю шкідливе для вашого здоров\'я.' },
        similar: [
          { id: 'wineCasa' },
          { id: 'wineLail' },
          { id: 'punchRauschgold', badges: ['cinotyzhyky'] },
        ],
      },
      punchRauschgold: {
        description: 'Зимовий пунш на основі плодового вина з чорницею та прянощами. Підігрійте до 70 °C — і глінтвейн готовий.',
        composition: {
          text: 'Вино плодове з чорниці, цукор, натуральні ароматизатори (кориця, гвоздика, цитрусові), регулятор кислотності: лимонна кислота.',
          allergens: { label: 'Алергени:', value: 'діоксид сірки' },
        },
        details: [
          { label: 'Торгова марка',           value: 'Rauschgold Engel' },
          { label: 'Країна походження',       value: 'Німеччина' },
          { label: 'Колір вина',              value: 'Червоне' },
          { label: 'Смак вина',               value: 'Солодке' },
          { label: 'Основа',                  value: 'Плодове вино з чорниці' },
          { label: 'Тон букета',              value: 'Ягідні, пряні' },
          { label: '% спирту',                value: '8' },
          { label: 'Як подавати',             value: 'Гарячим, 60–70 °C' },
          { label: 'Гастрономічні поєднання', value: 'випічка, пряники, горіхи' },
        ],
        nutrition: { kcal: '140', protein: '0 г', fat: '0 г', carbs: '18 г', sugar: '17 г' },
        warning: { badge: '18+', text: 'Придбати алкогольні напої можуть особи, які досягли 18 років. Надмірне споживання алкоголю шкідливе для вашого здоров\'я.' },
        similar: [
          { id: 'wineCasa' },
          { id: 'winePascal', badges: ['cinotyzhyky'] },
          { id: 'wineLail' },
        ],
      },
      wineCasa: {
        description: 'Легке португальське віно верде з ледь відчутною бульбашкою, зеленим яблуком і лаймом у смаку. Добре охолодженим — у спеку.',
        composition: {
          text: 'Вино біле сухе, виготовлене з винограду сортів Лоурейру, Трайжадура та Алваріньйо.',
          allergens: { label: 'Алергени:', value: 'діоксид сірки' },
        },
        details: [
          { label: 'Торгова марка',           value: 'Casa de Vilacetinho' },
          { label: 'Країна походження',       value: 'Португалія' },
          { label: 'Колір вина',              value: 'Біле' },
          { label: 'Смак вина',               value: 'Сухе' },
          { label: 'Сорт винограду',          value: 'Лоурейру, Трайжадура, Алваріньйо' },
          { label: 'Тон букета',              value: 'Фруктові, цитрусові' },
          { label: 'Регіон походження вина',  value: 'Vinho Verde' },
          { label: 'Кислотність',             value: 'Висока' },
          { label: '% спирту',                value: '11' },
          { label: 'Гастрономічні поєднання', value: 'салати, риба, морепродукти' },
        ],
        nutrition: { kcal: '70', protein: '0.1 г', fat: '0 г', carbs: '2.4 г', sugar: '1.5 г' },
        warning: { badge: '18+', text: 'Придбати алкогольні напої можуть особи, які досягли 18 років. Надмірне споживання алкоголю шкідливе для вашого здоров\'я.' },
        similar: [
          { id: 'winePascal', badges: ['cinotyzhyky'] },
          { id: 'punchRauschgold', badges: ['cinotyzhyky'] },
          { id: 'wineLail' },
        ],
      },

      /* --- Фрукти --- */
      banana: {
        description: 'Стиглі банани з Еквадору з ніжною солодкою мʼякоттю. Смачні самі по собі, у смузі, вівсянці чи випічці.',
        details: [
          { label: 'Країна походження', value: 'Еквадор' },
          { label: 'Сорт', value: 'Кавендіш' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від +13 до +16 °C' },
        ],
        nutrition: { kcal: '89', protein: '1.1 г', fat: '0.3 г', carbs: '22.8 г', sugar: '12.2 г' },
      },
      appleGolden: {
        description: 'Хрусткі жовті яблука з медово-солодким смаком і легким ароматом. Підходять для перекусу, салатів і запікання.',
        details: [
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Сорт', value: 'Голден Делішес' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від 0 до +4 °C' },
        ],
        nutrition: { kcal: '52', protein: '0.3 г', fat: '0.2 г', carbs: '13.8 г', sugar: '10.4 г' },
      },
      peach: {
        description: 'Соковиті персики з оксамитовою шкіркою та насиченим ароматом. Найсмачніші, коли мʼякоть ледь піддається натиску.',
        details: [
          { label: 'Країна походження', value: 'Іспанія' },
          { label: 'Сорт', value: 'Жовтий персик' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від 0 до +4 °C' },
        ],
        nutrition: { kcal: '39', protein: '0.9 г', fat: '0.3 г', carbs: '9.5 г', sugar: '8.4 г' },
      },
      watermelon: {
        description: 'Кавун сорту Вогник із соковитою червоною мʼякоттю та дрібним насінням. Освіжає в спеку.',
        details: [
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Сорт', value: 'Вогник' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'До +20 °C, розрізаний — у холодильнику' },
        ],
        nutrition: { kcal: '30', protein: '0.6 г', fat: '0.2 г', carbs: '7.6 г', sugar: '6.2 г' },
      },
      melon: {
        description: 'Жовта диня Валенсія з кремовою соковитою мʼякоттю та медовим ароматом. Смакує з прошуто чи в десертах.',
        details: [
          { label: 'Країна походження', value: 'Іспанія' },
          { label: 'Сорт', value: 'Валенсія' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від +7 до +10 °C' },
        ],
        nutrition: { kcal: '34', protein: '0.8 г', fat: '0.2 г', carbs: '8.2 г', sugar: '7.9 г' },
      },
      lime: {
        description: 'Ароматний лайм із тонкою шкіркою та кислуватим соком. Для лимонадів, коктейлів, соусів і азійських страв.',
        details: [
          { label: 'Країна походження', value: 'Мексика' },
          { label: 'Сорт', value: 'Перський лайм' },
          { label: 'Смак', value: 'Кислий' },
          { label: 'Умови зберігання', value: 'Від +8 до +10 °C' },
        ],
        nutrition: { kcal: '30', protein: '0.7 г', fat: '0.2 г', carbs: '10.5 г', sugar: '1.7 г' },
      },
      grapesRed: {
        description: 'Великий рожево-червоний виноград РедГлоб із хрусткою мʼякоттю. Прикрасить сирну тарілку та фруктовий салат.',
        details: [
          { label: 'Країна походження', value: 'Італія' },
          { label: 'Сорт', value: 'Ред Глоб' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від 0 до +2 °C' },
        ],
        nutrition: { kcal: '69', protein: '0.7 г', fat: '0.2 г', carbs: '18.1 г', sugar: '15.5 г' },
      },
      mango: {
        description: 'Стигле манго з яскравою соковитою мʼякоттю без волокон. Ідеальне для смузі, салатів і сальси.',
        details: [
          { label: 'Країна походження', value: 'Перу' },
          { label: 'Сорт', value: 'Кент' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від +10 до +13 °C' },
        ],
        nutrition: { kcal: '60', protein: '0.8 г', fat: '0.4 г', carbs: '15.0 г', sugar: '13.7 г' },
      },
      persimmon: {
        description: 'Азербайджанська хурма з мʼякою желейною мʼякоттю. Солодка, без терпкості — достатньо дозріти при кімнатній температурі.',
        details: [
          { label: 'Країна походження', value: 'Азербайджан' },
          { label: 'Сорт', value: 'Королек' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від 0 до +2 °C' },
        ],
        nutrition: { kcal: '70', protein: '0.6 г', fat: '0.2 г', carbs: '18.6 г', sugar: '12.5 г' },
      },
      cherimoya: {
        description: 'Екзотична черімоя з кремовою мʼякоттю — на смак нагадує поєднання банана, ананаса та полуниці. Їжте ложкою, насіння не вживайте.',
        details: [
          { label: 'Країна походження', value: 'Іспанія' },
          { label: 'Сорт', value: 'Фіно де Жете' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від +8 до +12 °C' },
        ],
        nutrition: { kcal: '75', protein: '1.6 г', fat: '0.7 г', carbs: '17.7 г', sugar: '12.9 г' },
      },
      pineapple: {
        description: 'Солодкий ананас із соковитою золотистою мʼякоттю та яскравим тропічним ароматом.',
        details: [
          { label: 'Країна походження', value: 'Коста-Рика' },
          { label: 'Сорт', value: 'Голден Світ (MD2)' },
          { label: 'Смак', value: 'Кисло-солодкий' },
          { label: 'Умови зберігання', value: 'Від +7 до +10 °C' },
        ],
        nutrition: { kcal: '50', protein: '0.5 г', fat: '0.1 г', carbs: '13.1 г', sugar: '9.9 г' },
      },
      pears: {
        description: 'Соковиті груші з ніжною маслянистою мʼякоттю. Смачні свіжими, із сиром або запеченими з медом.',
        details: [
          { label: 'Країна походження', value: 'Бельгія' },
          { label: 'Сорт', value: 'Конференс' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від 0 до +4 °C' },
        ],
        nutrition: { kcal: '57', protein: '0.4 г', fat: '0.1 г', carbs: '15.2 г', sugar: '9.8 г' },
      },
      applesGreen: {
        description: 'Хрусткі зелені яблука з освіжаючою кислинкою. Для перекусу, салатів, шарлотки й дитячого пюре.',
        details: [
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Сорт', value: 'Гренні Сміт' },
          { label: 'Смак', value: 'Кисло-солодкий' },
          { label: 'Умови зберігання', value: 'Від 0 до +4 °C' },
        ],
        nutrition: { kcal: '48', protein: '0.4 г', fat: '0.2 г', carbs: '11.4 г', sugar: '9.6 г' },
        similar: [{ id: 'appleGolden', liked: true }, { id: 'pears' }, { id: 'peach', badges: ['percent'] }, { id: 'banana' }],
      },
      grapes: {
        description: 'Фіолетовий виноград із тонкою шкіркою та насиченим ягідним смаком. До сиру, у фруктовий салат або просто так.',
        details: [
          { label: 'Країна походження', value: 'Молдова' },
          { label: 'Сорт', value: 'Молдова' },
          { label: 'Смак', value: 'Солодкий' },
          { label: 'Умови зберігання', value: 'Від 0 до +2 °C' },
        ],
        nutrition: { kcal: '67', protein: '0.6 г', fat: '0.2 г', carbs: '17.2 г', sugar: '16.0 г' },
        similar: [{ id: 'grapesRed', badges: ['cinotyzhyky'] }, { id: 'persimmon', liked: true }, { id: 'cherimoya', badges: ['percent'] }, { id: 'mango' }],
      },

      /* --- Овочі --- */
      tomatoes: {
        description: 'Мʼясисті червоні помідори з насиченим смаком і ароматом. Для салатів, бутербродів, соусів і запікання.',
        details: [
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Сорт', value: 'Рожевий гігант' },
          { label: 'Смак', value: 'Солодкуватий' },
          { label: 'Умови зберігання', value: 'Від +10 до +15 °C, не в холодильнику' },
        ],
        nutrition: { kcal: '20', protein: '0.9 г', fat: '0.2 г', carbs: '3.9 г', sugar: '2.6 г' },
        similar: [{ id: 'cabbage' }, { id: 'oliveOil', badges: ['cinotyzhyky'] }, { id: 'hellmanns' }],
      },
      cabbage: {
        description: 'Молода капуста з ніжним хрустким листям без гіркоти. Для салату з огірком і кропом, тушкування та борщу.',
        details: [
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Сорт', value: 'Рання білоголова' },
          { label: 'Смак', value: 'Соковитий, солодкуватий' },
          { label: 'Умови зберігання', value: 'Від 0 до +4 °C' },
        ],
        nutrition: { kcal: '27', protein: '1.8 г', fat: '0.1 г', carbs: '4.7 г', sugar: '4.0 г' },
        similar: [{ id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'oliveOil', badges: ['cinotyzhyky'] }, { id: 'hellmanns' }],
      },

      /* --- Товари з головної --- */
      hellmanns: {
        description: 'Класичний майонез із насиченим вершковим смаком. Для салатів, соусів, бутербродів і запікання.',
        composition: {
          text: 'Олія соняшникова рафінована дезодорована, вода, жовток яєчний, оцет спиртовий, цукор, сіль, сік лимонний концентрований, антиоксидант ЕДТА кальцію-динатрію, ароматизатори натуральні, екстракт паприки.',
          allergens: { label: 'Алергени:', value: 'яйця, може містити гірчицю' },
        },
        details: [
          { label: 'Торгова марка', value: 'Hellmann’s' },
          { label: 'Країна походження', value: 'Польща' },
          { label: 'Жирність', value: '73%' },
          { label: 'Тип упаковки', value: 'Скляна банка' },
          { label: 'Умови зберігання', value: 'Від 0 до +25 °C, після відкриття — у холодильнику до 3 міс.' },
        ],
        nutrition: { kcal: '667', protein: '1.1 г', fat: '73 г', satFat: '5.6 г', carbs: '1.3 г', sugar: '1.2 г' },
        similar: [{ id: 'oliveOil', badges: ['cinotyzhyky'] }, { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'pistachios', badges: ['klatsni'] }],
      },
      pistachios: {
        description: 'Великі обсмажені фісташки з легкою солоністю. До пива, у салат, пасту чи просто на перекус.',
        composition: {
          text: 'Фісташки обсмажені, сіль кухонна.',
          allergens: { label: 'Алергени:', value: 'горіхи; може містити сліди арахісу та кунжуту' },
        },
        details: [
          { label: 'Торгова марка', value: 'Сільпо' },
          { label: 'Країна походження', value: 'США' },
          { label: 'Обробка', value: 'Смажені, солоні' },
          { label: 'Тип упаковки', value: 'Дой-пак' },
          { label: 'Умови зберігання', value: 'У сухому місці, до +25 °C' },
        ],
        nutrition: { kcal: '594', protein: '21 г', fat: '48.5 г', satFat: '5.9 г', carbs: '14.5 г', sugar: '7.7 г' },
        similar: [{ id: 'marshmallow', badges: ['klatsni'] }, { id: 'bakoma' }, { id: 'hellmanns', badges: ['cinotyzhyky'] }, { id: 'water075', badges: ['myOffer'] }],
      },
      oliveOil: {
        description: 'Оливкова олія Pure — суміш рафінованої та олії першого віджиму. Мʼякий смак, підходить для смаження, запікання й салатів.',
        composition: {
          text: 'Олія оливкова рафінована, олія оливкова першого холодного віджиму Extra Virgin.',
        },
        details: [
          { label: 'Торгова марка', value: '«Премія»®' },
          { label: 'Країна походження', value: 'Іспанія' },
          { label: 'Тип олії', value: 'Pure (суміш)' },
          { label: 'Тип упаковки', value: 'Скляна пляшка' },
          { label: 'Умови зберігання', value: 'У темному місці, від +5 до +25 °C' },
        ],
        nutrition: { kcal: '899', protein: '0 г', fat: '99.9 г', satFat: '14 г', carbs: '0 г', sugar: '0 г' },
        similar: [{ id: 'hellmanns', badges: ['cinotyzhyky'] }, { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'pistachios', badges: ['klatsni'] }],
      },
      marshmallow: {
        description: 'Легкі повітряні маршмелоу чотирьох кольорів. До какао й кави, на гриль або для прикрашання десертів.',
        composition: {
          text: 'Цукор, сироп глюкозний, вода, желатин, декстроза, ароматизатори, барвники: кармін, куркумін, мідні комплекси хлорофілів.',
          allergens: { label: 'Алергени:', value: 'не містить' },
        },
        details: [
          { label: 'Торгова марка', value: 'Сільпо' },
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Смак', value: 'Асорті: ваніль, полуниця, лимон, яблуко' },
          { label: 'Тип упаковки', value: 'Пакет' },
          { label: 'Умови зберігання', value: 'У сухому місці, від +15 до +21 °C' },
        ],
        nutrition: { kcal: '322', protein: '3.5 г', fat: '0.1 г', satFat: '0 г', carbs: '77 г', sugar: '58 г' },
        similar: [{ id: 'bakoma' }, { id: 'pistachios', badges: ['klatsni'] }, { id: 'cherimoya', badges: ['percent'] }, { id: 'water075', badges: ['myOffer'] }],
      },
      bakoma: {
        description: 'Рослинний десерт на кокосовій основі зі смаком солоної карамелі. Без молока й лактози — підійде веганам.',
        composition: {
          text: 'Вода, крохмаль модифікований, цукор, кокосова олія, карамель (цукор, сіль), загусник: карагінан, ароматизатор, сіль, кальцію фосфат, вітаміни B12 і D.',
          allergens: { label: 'Алергени:', value: 'не містить молока; може містити сліди сої' },
        },
        details: [
          { label: 'Торгова марка', value: 'Bakoma Ave Vege' },
          { label: 'Країна походження', value: 'Польща' },
          { label: 'Смак', value: 'Солона карамель' },
          { label: 'Особливості', value: 'Веганський, без лактози' },
          { label: 'Умови зберігання', value: 'Від +2 до +6 °C' },
        ],
        nutrition: { kcal: '121', protein: '0.3 г', fat: '4.2 г', satFat: '3.9 г', carbs: '20.2 г', sugar: '12.8 г' },
        similar: [{ id: 'marshmallow', badges: ['klatsni'] }, { id: 'pistachios', badges: ['klatsni'] }, { id: 'banana' }, { id: 'mango' }],
      },
      water075: {
        description: 'Лікувально-столова мінеральна вода з Карпат із низькою мінералізацією. Мʼякий смак, щодня й для всієї родини.',
        composition: {
          text: 'Вода мінеральна природна лікувально-столова маломінералізована сульфатно-хлоридна кальцієво-натрієво-магнієва. Мінералізація 0,1–0,3 г/дм³.',
        },
        details: [
          { label: 'Торгова марка', value: '«Моршинська»' },
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Газованість', value: 'Негазована' },
          { label: 'Тип упаковки', value: 'ПЕТ-пляшка' },
          { label: 'Умови зберігання', value: 'У темному місці, від +5 до +20 °C' },
        ],
        nutrition: { kcal: '0', protein: '0 г', fat: '0 г', carbs: '0 г' },
        similar: [{ id: 'water15', badges: ['myOffer'] }, { id: 'water15light', badges: ['myOffer'] }, { id: 'lime' }],
      },
      water15: {
        description: 'Лікувально-столова мінеральна вода з Карпат із низькою мінералізацією. Велика пляшка — для дому й родини.',
        composition: {
          text: 'Вода мінеральна природна лікувально-столова маломінералізована сульфатно-хлоридна кальцієво-натрієво-магнієва. Мінералізація 0,1–0,3 г/дм³.',
        },
        details: [
          { label: 'Торгова марка', value: '«Моршинська»' },
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Газованість', value: 'Негазована' },
          { label: 'Тип упаковки', value: 'ПЕТ-пляшка' },
          { label: 'Умови зберігання', value: 'У темному місці, від +5 до +20 °C' },
        ],
        nutrition: { kcal: '0', protein: '0 г', fat: '0 г', carbs: '0 г' },
        similar: [{ id: 'water075', badges: ['myOffer'] }, { id: 'water15light', badges: ['myOffer'] }, { id: 'lime' }],
      },
      water15light: {
        description: 'Мінеральна вода з Карпат із легкими бульбашками. Освіжає, але не «колеться» — компроміс між газованою й негазованою.',
        composition: {
          text: 'Вода мінеральна природна лікувально-столова маломінералізована сульфатно-хлоридна кальцієво-натрієво-магнієва, діоксид вуглецю. Мінералізація 0,1–0,3 г/дм³.',
        },
        details: [
          { label: 'Торгова марка', value: '«Моршинська»' },
          { label: 'Країна походження', value: 'Україна' },
          { label: 'Газованість', value: 'Слабогазована' },
          { label: 'Тип упаковки', value: 'ПЕТ-пляшка' },
          { label: 'Умови зберігання', value: 'У темному місці, від +5 до +20 °C' },
        ],
        nutrition: { kcal: '0', protein: '0 г', fat: '0 г', carbs: '0 г' },
        similar: [{ id: 'water15', badges: ['myOffer'] }, { id: 'water075', badges: ['myOffer'] }, { id: 'lime' }],
      },
    },
  },

  /* =================================================================
     КОШИК
     • startItems — що лежить у кошику при відкритті прототипу,
       напр. { wineLail: 1, applesGreen: 2 }. Порожньо = кошик пустий.
     • delivery — вартість доставки залежно від суми замовлення.
     ================================================================= */
  cart: {
    title: 'Кошик',
    timeslot: { day: 'Сьогодні', time: '12:30 – 14:00' },
    express: 'Прискорити доставку за ХХ ₴. Привеземо <em>до YY хв</em>.',
    heading: 'Ваше замовлення',
    unit: 'шт',
    addMore: 'Додати ще товарів',
    empty: { title: 'Кошик порожній', text: 'Додайте товари з каталогу — вони з’являться тут.', button: 'Перейти до каталогу' },
    startItems: {},

    packaging: {
      title: 'Пакування',
      text: 'Зберемо ваше замовлення в <b>фірмові пакети «Сільпо»</b>. Для вагових товарів візьмемо мінімум біопакетиків.',
      image: 'assets/images/banners/packaging.png',
      button: 'Обрати інше пакування',
    },
    offers: {
      title: 'Пропозиції для вас',
      count: '7 шт',
      items: [
        { chip: '×15 бонусів', text: 'Кулінарія, випічка, торти, кава, чай -30%. Кулінарія, випічка, торти,', active: true },
        { chip: '−30%',        text: 'Кулінарія, випічка, торти, кава, чай -30%. Кулінарія, випічка, торти,' },
        { chip: '×10 бонусів', text: 'Фрукти та овочі: подвійні бонуси на всі позиції категорії' },
      ],
    },
    promo: {
      title: 'Промокод',
      hint: 'До замовлення можна додати лише один промокод',
      button: 'Додати промокод',
    },
    summary: {
      title: 'Сума замовлення',
      goods: 'Товари',
      delivery: 'Доставка',
      discount: 'Сума знижки',
      weight: 'Загальна вага',
      total: 'До оплати',
    },
    delivery: {
      price: 49,                                   // базова вартість
      tiers: [ { from: 1000, price: 19 }, { from: 1500, price: 1 } ],
      hint: 'Замовте ще на {left} – доставимо за {price}',
      done: 'Доставимо за {price} 🎉',
    },
    checkout: 'Оформити',
  },

  /* =================================================================
     ЧЕКАУТ
     • selected: true — що вибрано за замовчуванням.
     ================================================================= */
  checkout: {
    title: 'Оформлення замовлення',
    methodsTitle: 'Як бажаєте отримати замовлення?',
    methods: [
      { title: 'Експрес',   badge: 'НОВЕ', text: 'Доставимо за 60-80 хв', price: '+ XX ₴', image: 'assets/icons/express.png' },
      { title: 'Планова',   text: 'На зручний день та час', price: 'XX ₴', image: 'assets/images/home/service-delivery.png', selected: true },
      { title: 'Самовивіз', text: 'Забирайте в магазині', price: '0 ₴', image: 'assets/images/home/service-pickup.png' },
    ],
    days: [ { label: 'Сьогодні', selected: true }, { label: 'Завтра' }, { label: 'Пт, 9 червня' } ],
    slots: [ { label: 'з 12:30 до 14:30', selected: true }, { label: 'з 14:30 до 16:30' }, { label: 'з 16:30 до 18:30' }, { label: 'з 18:30 до 20:30' } ],

    addressTitle: 'Куди доставити?',
    timeslot: { day: 'Сьогодні', time: '12:30 – 14:00' },
    address: 'вул Миколи Миклухи-Маклая Нечуя-Левицького 1',
    addressTypes: [
      { icon: '🏢', label: 'Квартира', selected: true },
      { icon: '💼', label: 'Офіс' },
      { icon: '🏡', label: 'Приватний будинок' },
      { icon: '📍', label: 'Точна на карті' },
    ],
    fields: [ { label: 'Поверх', value: '12' }, { label: 'Під’їзд', value: '7' }, { label: 'Квартира', value: '107' } ],
    courierComment: 'Коментар для кур’єра',

    contactTitle: 'Для зв’язку та уточнень',
    contact: { name: 'Стефанія', phone: '+380 (050) 908 07 70' },
    replacement: { title: 'Що робити, якщо не буде потрібних товарів?', text: 'Пишіть мені у чаті застосунку', badge: 'НОВЕ' },
    pickerComment: 'Коментар для збиральника',

    certificate: {
      title: 'Сертифікат «Сільпо»',
      hint: 'Можете додати тільки один сертифікат. Сума замовлення має бути більшою або дорівнювати його номіналу.',
      button: 'Додати сертифікат',
    },
    weightNote: 'Старанно збираємо вагові товари як в замовленні. ⚖️ Та іноді важко знайти ідеальну вагу, тому кінцева сума може змінитися.',
    totalLabel: 'До оплати',
    legal: 'Продовжуючи, ви підтверджуєте, що ознайомились та погоджуєтесь з <a href="#">правилами</a>, а також даєте згоду на обробку персональних даних.',
    ageConfirm: 'У замовленні є товари з віковими обмеженнями. Я підтверджую, що мені виповнилось 18 років',
    payment: { method: 'Apple Pay', change: 'Змінити', button: 'Pay' },
  },

  /* =================================================================
     ПОДЯКА
     • {total} підставиться сумою замовлення з кошика.
     ================================================================= */
  thankyou: {
    image: 'assets/images/banners/thank-you-banana.png',
    title: 'Ваше замовлення прийнято! 🎉',
    rows: [
      { icon: 'assets/icons/time.svg',         label: 'Час доставки',        value: '10 лютого, 17:00–19:00' },
      { icon: 'assets/icons/home-outline.svg', label: 'Адреса доставки',     value: 'вул. Раїси Окіпної, 18, м.Київ<br>підʼїзд 1, поверх 1, квартира 1' },
      { icon: 'assets/icons/card.svg',         label: 'Орієнтовна вартість', value: '{total}', note: 'Точну суму буде списано, коли зберемо замовлення. Платіж на 0.00 UAH – це просто перевірка картки.' },
    ],
    primary: 'Переглянути замовлення',
    secondary: 'На головну',
  },

  /* =================================================================
     ЧАТ ШІ-ПОМІЧНИКА (відкривається тапом по грибочку на головній)
     • openers — стартові теги під привітанням. Тап: тег іде в чат як ваше
       повідомлення, помічник відповідає answer, під відповіддю — картки товарів.
         listing      — сторінка лістингу (DATA.listing.pages), з якої беруться
                        бейджі товарів і добірки тегів followUps (необовʼязково);
         items        — які товари показати: id або { id, badges, liked };
         showProducts — true: усі товари лістингу listing;
         next         — теги наступного кроку під відповіддю: { label, answer, items, next };
                        тег без answer показується неактивним (сценарій ще не зроблено);
                        action: 'addAll' — кладе в кошик товари з карток над відповіддю,
                        {total} у відповіді — сума кошика.
       Будь-яка відповідь закінчується тегами; на своє питання — fallback + стартові теги.
       Екран під чатом не змінюється — після закриття чату ви там, звідки його відкрили.
         label / items можуть залежати від пори року: { winter, spring, summer, autumn }.
       {count} — скільки карток, {countWord} — слово з countForms у потрібній формі
       (1 товар / 2 товари / 5 товарів).
     • followUps — теги під картками. Тап: добірка з того ж лістингу, відповідь
       і нові картки, під ними — решта тегів. Добірка задається:
         ids: [...]           — вручну, у потрібному порядку;
         rule: 'sale'         — усі товари зі знижкою;
         rule: 'lowSugar'     — цукор ≤ maxSugar г на 100 г, від найменшого.
     • season — пора року для сезонних тегів: null = за поточним місяцем,
       або 'winter' / 'spring' / 'summer' / 'autumn', щоб показати конкретну.
     • mood — настрій Машрума у відповіді (ключ із moods нижче), напр. mood: 'grumpy'.
     • fallback — відповідь на будь-яке інше повідомлення.
     ================================================================= */
  aiChat: {
    title: 'Помічник',                // заголовок чату
    botName: 'Машрум Геннадійович',   // підпис біля аватара в повідомленнях
    menu: ['Історія чату', 'Налаштування'], // пункти меню «⋮» у шапці (поки без дій)
    avatar: 'assets/images/ai/mascot.png',
    // «ваше звичне» тут перегукується з тегом «Мої звичні продукти»
    greeting: 'О. Прокинувся. Що сьогодні підберемо: продукти на кілька днів, готове з ресторану чи ваше звичне? Можу й чимось сезонним спокусити. Поки грибниця не покликала назад.',
    placeholder: 'Запитайте що завгодно…',
    season: null,
    /* Настрої Машрума: вираз обличчя + колір сяйва (анімації face-<face> і
       face-<face>-gradient у assets/rive/mushroom_mvp.riv). glow — взяти сяйво іншого
       настрою замість власного. Настрій відповіді —
       поле mood у тегах / кроках; без нього — defaultMood. */
    moods: {
      happy:    { face: 'happie' },                  // жовтий, задоволений
      thinking: { face: 'thinking' },                // жовто-зелений, думає («друкує…»)
      // сонний: заплющені очі, але жовте сяйво — синьо-фіолетове з файлу на 32px брудне
      // (темний центр, лінії обличчя губляться). Коли в .riv буде чистий блакитний — прибрати glow.
      sleepy:   { face: 'sleeping', glow: 'happie', blink: false },
      grumpy:   { face: 'mad' },                     // червоно-помаранчевий, буркотливий
    },
    defaultMood: 'happy',
    greetingMood: 'sleepy', // «О. Прокинувся»: спершу сонний…
    wakeDelay: 1400,        // …за стільки мс прокидається (defaultMood)
    typingMood: 'thinking',
    fallbackMood: 'grumpy', // відповідь на своє питання
    // дизайн тегів: 'v1' — світні капсули, 'v2' — «безформенне» світіння (css/ai-chips-v*.css)
    chipsVersion: 'v1',

    /* Острівець: Машрум сам звертається до гостя (js/mg-island.js, гілка A).
       Грибочок відкочується вліво в білу «пігулку» з текстом; хрестик — на його місці.
       Тригер для тесту: на головній проскролили «Тільки онлайн» і зʼявився банер за ним
       (repeat: true — щоразу при прокрутці до нього; false — раз за сесію). Тап по тексту — чат, МГ продовжує. */
    island: {
      theme: 'light', glass: false, // вигляд за замовчуванням: light / dark + скло (перемикач «Острівець» поза телефоном)
      repeat: true, // ДЕМО: звернення щоразу, як банер знову заїжджає на екран (false — раз за сесію)
      home: {
        text: 'Вперше тут? Зберу кошик і поясню доставку',
        reply: {
          /* {sum} — сума набору, {deliveryRules} — правила з DATA.cart.delivery,
             {deliveryHere} — скільки коштуватиме доставка саме цього набору */
          answer: 'Ось базовий кошик на кілька днів — {count} {countWord} на {sum}. Доставка залежить від суми: {deliveryRules}. З цим набором — {deliveryHere}.',
          countForms: ['товар', 'товари', 'товарів'],
          items: [{ id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'banana' },
                  { id: 'appleGolden' }, { id: 'water15', badges: ['myOffer'] }, { id: 'hellmanns' }],
          next: [
            { label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
              answer: 'Поклав {count} {countWord}. У кошику на {total} — далі можна оформлювати.', next: [{ label: 'Оформити замовлення' }] },
            { label: 'Як доставити дешевше',
              answer: 'Від 1 500 ₴ доставка коштує 1 ₴ — докладіть щось на тиждень наперед. А самовивіз із магазину взагалі безкоштовний.',
              next: [{ label: 'Докласти до 1 500 ₴' }, { label: 'Де найближчий магазин' }] },
            { label: 'Змінити набір' },
          ],
        },
      },
    },
    openers: [
      {
        // змінюється залежно від пори року
        id: 'seasonal',
        label: {
          winter: 'Сезонні цитрусові та екзотика',
          spring: 'Весняні вітаміни',
          summer: 'Сезонні фрукти та ягоди',
          autumn: 'Сезонні фрукти та ягоди',
        },
        listing: 'fruits',
        items: {
          winter: ['lime', 'persimmon', 'pineapple', 'banana', 'mango'],
          spring: ['appleGolden', 'pears', 'lime', 'banana', 'pineapple'],
          summer: ['peach', 'watermelon', 'melon', 'grapesRed', 'appleGolden'],
          autumn: ['watermelon', 'melon', 'grapesRed', 'appleGolden', 'pears', 'persimmon'],
        },
        countForms: ['фрукт', 'фрукти', 'фруктів'],
        answer: 'Сезон — єдине, чому я досі довіряю. Відібрав {count} {countWord}, що саме зараз при силі. Беріть, поки не минуло.',
        // теги під картками: уточнюють добірку з лістингу «Фрукти»
        followUps: [
          {
            label: 'Мінімум цукру',
            rule: 'lowSugar', maxSugar: 9, // г цукру на 100 г, з DATA.pdp.products; від найменшого
            answer: 'Менше цукру… Розумно, я й сам солодким не зловживаю. Ось {count} {countWord}, де його найменше, — лайм попереду всіх.',
          },
          {
            label: 'Популярні',
            ids: ['banana', 'appleGolden', 'grapesRed', 'mango', 'pineapple'],
            answer: 'Те, що гості беруть найчастіше: {count} {countWord}. Натовп рідко помиляється, хоч я натовпів і не люблю.',
          },
          {
            label: 'Акційні',
            rule: 'sale', // товари зі старою ціною (oldPrice)
            answer: 'Акції. Вигода — єдине, що мене ще тішить. {count} {countWord} зі знижкою — беріть, поки ціни не схаменулися.',
          },
        ],
      },
      {
        id: 'fewDays',
        label: 'Продукти на кілька днів',
        items: [
          { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' },
          { id: 'applesGreen', badges: ['cinotyzhyky'] }, { id: 'banana' }, { id: 'pears' },
          { id: 'water15', badges: ['myOffer'] }, { id: 'oliveOil', badges: ['cinotyzhyky'] },
          { id: 'hellmanns' }, { id: 'bakoma' }, { id: 'pistachios', badges: ['klatsni'] },
        ],
        countForms: ['товар', 'товари', 'товарів'],
        answer: 'На кілька днів — це по-дорослому. Зібрав {count} {countWord}: овочі, фрукти, вода й дещо до чаю. Решту докинете самі, я не всевидющий.',
        next: [
          {
            label: 'На 3 дні для двох',
            items: ['tomatoes', 'cabbage', 'banana', 'pears', 'water15', 'bakoma'],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Двоє, три дні. Урізав до {count} {countWord} — без надлишків, але й голодними не лишитеся.',
            next: [{ label: 'Додати все в кошик' }, { label: 'Без солодкого' }, { label: 'Ще й на сніданки' }],
          },
          {
            label: 'Бюджетніше',
            items: [
              { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'applesGreen', badges: ['cinotyzhyky'] },
              { id: 'oliveOil', badges: ['cinotyzhyky'] }, { id: 'hellmanns' }, { id: 'pistachios', badges: ['klatsni'] },
            ],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Економія — мудрість старих грибів. Лишив {count} {countWord} зі знижкою, решта почекає.',
            next: [{ label: 'Ще дешевше' }, { label: 'Лише Цінотижики' }, { label: 'Додати все в кошик' }],
          },
          {
            label: 'Додати все в кошик', action: 'addAll', // кладе в кошик товари з карток над відповіддю
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Поклав {count} {countWord}. У кошику тепер на {total}. Далі — самі, я своє зробив.',
            next: [{ label: 'Оформити замовлення' }, { label: 'Додати ще щось' }, { label: 'Змінити кількість' }],
          },
        ],
      },
      {
        id: 'restaurant',
        label: 'Готове з ресторану',
        mood: 'grumpy',
        answer: 'Готове з ресторану — то вже не моя грибниця, там свої кухарі. Гляньте «Доставку з ресторанів» на головній: привезуть гарячим. А до столу я вам щось підберу, тільки скажіть.',
        next: [
          {
            label: 'Щось на обід',
            answer: 'Обід… Люди завжди поспішають його зʼїсти. Швидше за все привезуть піцу чи суші — за 30–40 хвилин. Що до смаку?',
            next: [{ label: 'Піца' }, { label: 'Суші' }, { label: 'Бургери' }],
          },
          {
            label: 'На вечір для компанії',
            answer: 'Компанія — це серйозно. Беріть сети: вигідніше й на всіх вистачить. Скільки вас буде?',
            next: [{ label: 'На двох' }, { label: 'На 4–6 людей' }, { label: 'Щось легке' }],
          },
          {
            label: 'Приготую сам',
            items: ['tomatoes', 'cabbage', 'oliveOil', 'hellmanns'],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Сам? Поважаю. Ось {count} {countWord} на простий салат — навіть гриб упорався б.',
            next: [{ label: 'Рецепт салату' }, { label: 'Додати все в кошик' }, { label: 'Щось гаряче' }],
          },
        ],
      },
      {
        id: 'usual',
        label: 'Мої звичні продукти',
        // ті самі товари, що в блоці «Замов знову» на головній (DATA.home.reorder)
        items: [
          { id: 'hellmanns', badges: ['cinotyzhyky'] },
          { id: 'pistachios', badges: ['klatsni'], liked: true },
          { id: 'oliveOil', badges: ['cinotyzhyky'] },
          { id: 'marshmallow', badges: ['klatsni'] },
        ],
        countForms: ['товар', 'товари', 'товарів'],
        answer: 'Ваше звичне я памʼятаю — грибниця нічого не забуває. Ось {count} {countWord}, які ви берете найчастіше. Повторимо?',
        next: [
          {
            label: 'Додати все в кошик', action: 'addAll', // кладе в кошик товари з карток над відповіддю
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Повторив: {count} {countWord} у кошику, разом на {total}. Звички — це добре, вони не підводять.',
            next: [{ label: 'Оформити замовлення' }, { label: 'Додати ще щось' }, { label: 'Змінити кількість' }],
          },
          {
            label: 'Що нового до звичного',
            items: [{ id: 'bakoma' }, { id: 'water075', badges: ['myOffer'] }, { id: 'water15light', badges: ['myOffer'] }],
            countForms: ['новинку', 'новинки', 'новинок'],
            answer: 'Нове до старого… Ризиковано, але спробуймо. Ось {count} {countWord}, що пасують до вашого звичного.',
            next: [{ label: 'Додати в кошик' }, { label: 'Показати ще' }, { label: 'Лише зі знижкою' }],
          },
          {
            label: 'Щось зі знижкою',
            items: [{ id: 'hellmanns', badges: ['cinotyzhyky'] }, { id: 'marshmallow', badges: ['klatsni'] }, { id: 'bakoma' }, { id: 'oliveOil', badges: ['cinotyzhyky'] }],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Ваше звичне, та дешевше — улюблене поєднання. {count} {countWord} зараз зі знижкою.',
            next: [{ label: 'Додати все в кошик' }, { label: 'Ще знижки' }, { label: 'Мої пропозиції' }],
          },
        ],
      },
    ],

    /* Привітання й теги залежно від екрана, з якого відкрили чат (контекст → намір).
       Що далі користувач у воронці, то менше загальних питань:
         головна  → намір  («що робимо?»)
         каталог  → задача («що збираємо?»)
         лістинг  → вибір  (теги залежать від категорії: byPage)
         картка   → розуміння (теги залежать від типу товару: byKind)
         кошик    → завершення (перевірити набір)
         чекаут   → підтримка (нічого не продаємо)
       Тег може бути id спільного тегу з openers вище або власним описом; тег без
       answer показується неактивним. Підстановки: {product}, {category},
       {count}/{countWord}, {total}, {discount}, {kcal}/{sugar}/{country}, {cartList}.
       Правила добірок (rule): sale, lowSugar, sweetest, maxPrice, notInCart, cheaper;
       pool — свій список товарів, listing — з якої сторінки лістингу брати. */
    screens: {
      /* ---- Головна: що взагалі робимо ----
         Перший тег одразу показує товари; чипси під ними звужують добірку. ---- */
      home: {
        greeting: 'О. Прокинувся. Що сьогодні робимо? Можу зібрати покупки, знайти щось готове, допомогти зекономити або підказати щось для себе.',
        openers: [
          {
            label: 'Зібрати покупки',
            items: [
              { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'banana' },
              { id: 'appleGolden' }, { id: 'water15', badges: ['myOffer'] }, { id: 'hellmanns' },
            ],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Ось базовий набір на двох на кілька днів — {count} {countWord}: овочі, фрукти, вода й дещо до столу. Уточнимо?',
            next: [
              { label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                answer: 'Поклав {count} {countWord}. У кошику на {total}.',
                next: [{ label: 'Оформити замовлення' }, { label: 'Додати ще' }, { label: 'Прибрати зайве' }] },
              { label: 'На сімʼю, на тиждень',
                items: [
                  { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'banana' }, { id: 'appleGolden' },
                  { id: 'pears' }, { id: 'water15', badges: ['myOffer'] }, { id: 'oliveOil', badges: ['cinotyzhyky'] },
                  { id: 'hellmanns' }, { id: 'bakoma' }, { id: 'pistachios', badges: ['klatsni'] },
                ],
                countForms: ['товар', 'товари', 'товарів'],
                answer: 'На сімʼю й на тиждень — {count} {countWord}: більше овочів, фруктів і запас води.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }, { label: 'Прибрати зайве' }] },
                       { label: 'Без солодкого' }, { label: 'Ще й сніданки' }] },
              { label: 'Тільки необхідне',
                items: [{ id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'banana' }, { id: 'water15', badges: ['myOffer'] }, { id: 'hellmanns' }],
                countForms: ['товар', 'товари', 'товарів'],
                answer: 'Коротко: {count} {countWord} — без них зазвичай не обходиться.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'Ще коротше' }, { label: 'Додати фрукти' }] },
              'usual',
            ],
          },
          {
            label: 'Хочу щось поїсти',
            items: ['tomatoes', 'cabbage', 'oliveOil', 'hellmanns', 'pistachios'],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Найшвидше — салат: {count} {countWord} і десять хвилин. Або привезти готове.',
            next: [
              { label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }, { label: 'Ще ідеї' }] },
              { label: 'Щось солодке',
                items: [{ id: 'marshmallow', badges: ['klatsni'] }, { id: 'bakoma' }, { id: 'pistachios', badges: ['klatsni'] }, { id: 'cherimoya', badges: ['percent'] }],
                countForms: ['варіант', 'варіанти', 'варіантів'],
                answer: 'До чаю: {count} {countWord}.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'Без цукру' }, { label: 'Щось із фруктів' }] },
              { label: 'Готове з ресторану', mood: 'grumpy',
                answer: 'Ресторанне привозять окремо — гляньте «Доставку з ресторанів» на головній. Я по продуктах.',
                next: [{ label: 'Піца' }, { label: 'Суші' }, { label: 'Бургери' }] },
            ],
          },
          {
            label: 'Знайти вигідне',
            rule: 'sale', listing: 'fruits',
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Зараз зі знижкою: {count} {countWord}. Є ще «Цінотижики» й ваші персональні пропозиції.',
            next: [
              { label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }, { label: 'Прибрати зайве' }] },
              { label: 'До 200 ₴', listing: 'fruits', rule: 'maxPrice', maxPrice: 200,
                countForms: ['товар', 'товари', 'товарів'],
                answer: 'До 200 ₴ — {count} {countWord}.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'До 150 ₴' }, { label: 'Лише Цінотижики' }] },
              { label: 'Мої пропозиції',
                items: [{ id: 'water075', badges: ['myOffer'] }, { id: 'water15', badges: ['myOffer'] }, { id: 'water15light', badges: ['myOffer'] }],
                countForms: ['товар', 'товари', 'товарів'],
                answer: 'Персонально для вас: {count} {countWord} з підвищеними бонусами.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'Ще пропозиції' }, { label: 'Умови' }] },
            ],
          },
          {
            label: 'Подбати про себе',
            listing: 'fruits', rule: 'lowSugar', maxSugar: 9,
            countForms: ['фрукт', 'фрукти', 'фруктів'],
            answer: 'Почнімо з простого — найменше цукру: {count} {countWord}. Далі уточнимо, що саме важливо.',
            next: [
              { label: 'Більше вітамінів', listing: 'fruits', ids: ['persimmon', 'lime', 'appleGolden', 'grapesRed'],
                countForms: ['фрукт', 'фрукти', 'фруктів'],
                answer: 'Найбільше вітаміну C тут: {count} {countWord}.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'Лише сезонне' }, { label: 'Щось легке' }] },
              { label: 'Легка вечеря',
                items: ['tomatoes', 'cabbage', 'oliveOil', 'lime'],
                countForms: ['товар', 'товари', 'товарів'],
                answer: 'Легка вечеря: {count} {countWord} — салат без нічого зайвого.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'Ще легше' }, { label: 'Додати білок' }] },
              { label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
            ],
          },
        ],
      },

      /* ---- Каталог: що збираємо (теж одразу з товарами) ---- */
      catalog: {
        greeting: 'Що шукаємо? Можу провести по категоріях або одразу зібрати продукти під вашу задачу.',
        openers: [
          {
            label: 'Зібрати на кілька днів',
            items: [
              { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'banana' },
              { id: 'appleGolden' }, { id: 'water15', badges: ['myOffer'] }, { id: 'hellmanns' },
            ],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Набір на двох на кілька днів — {count} {countWord}. Уточнимо?',
            next: [
              { label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }, { label: 'Прибрати зайве' }] },
              { label: 'На сімʼю, на тиждень',
                items: [
                  { id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'banana' }, { id: 'appleGolden' },
                  { id: 'pears' }, { id: 'water15', badges: ['myOffer'] }, { id: 'oliveOil', badges: ['cinotyzhyky'] },
                  { id: 'hellmanns' }, { id: 'bakoma' }, { id: 'pistachios', badges: ['klatsni'] },
                ],
                countForms: ['товар', 'товари', 'товарів'],
                answer: 'На тиждень і на сімʼю — {count} {countWord}.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'Без солодкого' }, { label: 'Ще й сніданки' }] },
              { label: 'Тільки необхідне',
                items: [{ id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'banana' }, { id: 'water15', badges: ['myOffer'] }, { id: 'hellmanns' }],
                countForms: ['товар', 'товари', 'товарів'],
                answer: 'Коротко: {count} {countWord}.',
                next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                         answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                       { label: 'Ще коротше' }, { label: 'Додати фрукти' }] },
            ],
          },
          {
            label: 'Щось на вечерю',
            items: ['tomatoes', 'cabbage', 'oliveOil', 'hellmanns', 'pistachios'],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'На вечерю: {count} {countWord} — салат і щось до нього.',
            next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                     answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                   { label: 'Щось ситніше' }, { label: 'Швидше 15 хвилин' }],
          },
          'usual',
          {
            label: 'Знайти конкретний товар',
            listing: 'fruits', rule: 'sale',
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Напишіть назву — знайду. А поки покажу, що зараз розбирають: {count} {countWord}.',
            next: [{ label: 'Фрукти', listing: 'fruits', rule: 'all', take: 6, countForms: ['фрукт', 'фрукти', 'фруктів'],
                     answer: 'Фрукти: {count} {countWord} з полиці.',
                     next: [{ label: 'Овочі' }, { label: 'Молочне' }, { label: 'Додати все в кошик', action: 'addAll',
                              countForms: ['товар', 'товари', 'товарів'], answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] }] },
                   { label: 'Овочі' }, { label: 'Молочне' }],
          },
        ],
      },

      /* ---- Лістинг: вибір усередині категорії (свій набір на кожну) ---- */
      listing: {
        greeting: 'Бачу, ми серед {category}. Що підбираємо?',
        byPage: {
          fruits: [
            'seasonal',
            {
              label: 'Найсолодші', listing: 'fruits', rule: 'sweetest', take: 4,
              countForms: ['фрукт', 'фрукти', 'фруктів'],
              answer: 'Найсолодші зараз: {count} {countWord}, попереду виноград і хурма.',
              next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                       answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                     { label: 'Без кісточок' }, { label: 'Щось кисліше' }],
            },
            {
              label: 'Дітям', listing: 'fruits', ids: ['banana', 'appleGolden', 'pears', 'persimmon'],
              countForms: ['фрукт', 'фрукти', 'фруктів'],
              answer: 'Дітям зазвичай беруть це: {count} {countWord} — мʼякі, без кислоти й зайвої мороки.',
              next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                       answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] },
                     { label: 'Без алергенів' }, { label: 'Порізати зручно' }],
            },
            {
              label: 'До 200 ₴', listing: 'fruits', rule: 'maxPrice', maxPrice: 200,
              countForms: ['фрукт', 'фрукти', 'фруктів'],
              answer: 'До 200 ₴ — {count} {countWord}. Вибір невеликий, зате гаманець цілий.',
              next: [{ label: 'До 150 ₴' }, { label: 'Лише акційні' }, { label: 'Додати все в кошик', action: 'addAll',
                       countForms: ['товар', 'товари', 'товарів'], answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] }],
            },
          ],
        },
      },

      /* ---- Картка товару: чи підходить (теги залежать від типу товару) ---- */
      pdp: {
        greeting: 'Бачу, придивляєтесь до {product}. Що про нього підказати?',
        byKind: {
          fruit: [
            {
              label: 'Чи підійде мені',
              answer: '{product}: {kcal} ккал на 100 г, цукру {sugar}. Походження — {country}. Якщо стежите за цукром — тримайте це на оці.',
              next: [{ label: 'А склад?' }, { label: 'Кому не варто' }, { label: 'Як зберігати' }],
            },
            {
              label: 'З чим поєднати',
              answer: 'Найпростіше — з йогуртом чи сиром на сніданок, у салат із зеленню або просто так. Нічого вигадувати не треба.',
              next: [{ label: 'Рецепт салату' }, { label: 'Що до сніданку' }, { label: 'До вина' }],
            },
            {
              label: 'Знайти схоже', similar: true,
              countForms: ['варіант', 'варіанти', 'варіантів'],
              answer: 'Схоже з цієї ж полиці: {count} {countWord}.',
              next: [{ label: 'Дешевше' }, { label: 'Солодше' }, { label: 'Додати все в кошик', action: 'addAll',
                       countForms: ['товар', 'товари', 'товарів'], answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] }],
            },
            {
              label: 'Є краща альтернатива?', listing: 'fruits', rule: 'cheaper', take: 4,
              countForms: ['варіант', 'варіанти', 'варіантів'],
              answer: 'Зі знижкою зараз {count} {countWord} — смак схожий, ціна приємніша.',
              next: [{ label: 'Порівняти склад' }, { label: 'Лишуся з цим' }, { label: 'Додати все в кошик', action: 'addAll',
                       countForms: ['товар', 'товари', 'товарів'], answer: 'Поклав {count} {countWord}, на {total}.', next: [{ label: 'Оформити замовлення' }] }],
            },
          ],
          wine: [
            {
              label: 'З чим поєднати',
              answer: 'До такого вина беруть тверді сири, мʼясні закуски або просто виноград. Нічого складного.',
              next: [{ label: 'Підбери сир' }, { label: 'Підбери закуски' }, { label: 'До десерту' }],
            },
            {
              label: 'Який смак',
              answer: 'Сухе, з фруктовими й пряними тонами, помірна кислотність. Якщо любите мʼякіше — беріть молодше.',
              next: [{ label: 'Солодше' }, { label: 'Легше' }, { label: 'Міцніше' }],
            },
            {
              label: 'Схоже дешевше', similar: true,
              countForms: ['варіант', 'варіанти', 'варіантів'],
              answer: 'Ось {count} {countWord} поруч на полиці — дешевші, але з тієї ж компанії.',
              next: [{ label: 'Ще дешевше' }, { label: 'Порівняти' }, { label: 'Лишуся з цим' }],
            },
          ],
          default: [
            {
              label: 'Для чого підходить',
              answer: 'Найчастіше беруть до щоденного столу: у салат, на бутерброд або до гарніру.',
              next: [{ label: 'Як використовувати' }, { label: 'Скільки зберігати' }, { label: 'Чи є аналоги' }],
            },
            {
              label: 'Знайти схоже', similar: true,
              countForms: ['варіант', 'варіанти', 'варіантів'],
              answer: 'Схоже з цієї ж полиці: {count} {countWord}.',
              next: [{ label: 'Дешевше' }, { label: 'Більша упаковка' }, { label: 'Лишуся з цим' }],
            },
            { label: 'Є краща альтернатива?' },
          ],
        },
      },

      /* ---- Кошик: перевірити набір перед оформленням ---- */
      cart: {
        greeting: 'Бачу ваш кошик: {count} {countWord} на {total}. Перевірити перед оформленням?',
        greetingForms: ['товар', 'товари', 'товарів'],
        openers: [
          {
            label: 'Чогось не вистачає?',
            rule: 'notInCart', take: 4,
            pool: ['water15', 'hellmanns', 'bakoma', 'appleGolden', 'oliveOil'],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'У кошику {cartList}. До такого набору зазвичай бракує ось цього — {count} {countWord}.',
            next: [{ label: 'Додати все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                     answer: 'Поклав {count} {countWord}. Разом на {total}.', next: [{ label: 'Оформити замовлення' }] },
                   { label: 'Нічого не треба' }, { label: 'Ще ідеї' }],
          },
          {
            label: 'Що з цього приготувати?',
            answer: 'З того, що є ({cartList}), виходить простий салат і сніданок на завтра. Як треба — підкажу рецепт.',
            next: [{ label: 'Рецепт салату' }, { label: 'Щось гаряче' }, { label: 'Чого бракує для рецепта' }],
          },
          {
            label: 'Можна дешевше?',
            rule: 'cheaper', listing: 'fruits', take: 4,
            countForms: ['варіант', 'варіанти', 'варіантів'],
            answer: 'Знижки вже збили {discount}. Можна ще: {count} {countWord} зі знижкою замість дорожчих.',
            next: [{ label: 'Замінити' }, { label: 'Лишити як є' }, { label: 'Промокод' }],
          },
          {
            label: 'Додати мої звичні', action: 'addItems',
            items: ['hellmanns', 'pistachios', 'oliveOil', 'marshmallow'],
            countForms: ['товар', 'товари', 'товарів'],
            answer: 'Додав ваше звичне: {count} {countWord}. Разом у кошику на {total}.',
            next: [{ label: 'Оформити замовлення' }, { label: 'Прибрати зайве' }, { label: 'Що нового' }],
          },
        ],
      },

      /* ---- Чекаут: нічого не продаємо, лише знімаємо запитання ---- */
      checkout: {
        greeting: 'Майже готово. Якщо щось незрозуміло з доставкою чи замовленням — я тут.',
        openers: [
          {
            label: 'Коли привезуть?',
            answer: 'Обраний час — «Сьогодні, 12:30–14:30». Експрес привозить за 60–80 хвилин, але дорожче.',
            next: [{ label: 'Хочу швидше' }, { label: 'Інший день' }, { label: 'Хто привезе' }],
          },
          {
            label: 'Змінити доставку',
            answer: 'Спосіб і час міняються тут же, у блоці «Як бажаєте отримати замовлення?»: планова, експрес або самовивіз.',
            next: [{ label: 'Самовивіз' }, { label: 'Інша адреса' }, { label: 'Інший час' }],
          },
          {
            label: 'Що з пакуванням?',
            answer: 'Зберемо у фірмові пакети, для вагового — мінімум біопакетиків. Інший варіант можна обрати в кошику.',
            next: [{ label: 'Без пакетів' }, { label: 'Окремо крихке' }, { label: 'Хай буде так' }],
          },
        ],
      },
    },

    fallback: 'Хм. Над цим грибниця ще міркує. Спробуйте щось із підказок — там я певніший.',
    replyDelay: 900, // мс, скільки помічник «друкує» відповідь
  },

  /* =================================================================
     iOS-КЛАВІАТУРА (зʼявляється при тапі в поле вводу чату)
     • letters / symbols — ряди клавіш; останній ряд літер обрамлюють
       Shift і «стерти» автоматично.
     • send — підпис синьої клавіші «Ввід».
     ================================================================= */
  keyboard: {
    letters: [
      ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ї'],
      ['ф', 'і', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'є'],
      ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю'],
    ],
    symbols: [
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
      ['-', '/', ':', ';', '(', ')', '₴', '&', '@', '"'],
      ['.', ',', '?', '!', '\''],
    ],
    toSymbols: '123',
    toLetters: 'АБВ',
    space: 'пробіл',
    send: 'Надіслати',
  },
};
