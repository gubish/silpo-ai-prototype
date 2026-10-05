/* =====================================================================
   ГІЛКА C — демо-збірка з двох перших гілок.
   • База — гілка A: Машрум у правому нижньому куті з острівцем (js/mg-island.js),
     без таб-бару на каталозі й лістингу, звичайна картка товару й чат.
   • Пошук — із гілки B: підказки під час набору, «Шукайте або запитайте»,
     питання замість запиту відкриває чат МГ (js/branches/b-search.js).
   • Жовті теги «Помічник може допомогти» (js/branches/b-mg.js) — ЛИШЕ на
     каталозі, лістингу (PLP), картці товару (PDP) і в кошику; в один рядок:
     маленький МГ зліва + теги, без заголовка (MG.block(..., { compact: true })).
   Тексти пошуку й тегів беремо з гілки B (js/branches/b.js), щоб правити в одному місці.
   Своїх стилів гілка не має: пошук і теги стилізують css/branches/b-search.css і b-mg.css.
   ===================================================================== */

(() => {
  const B = Branch.overrides.b.data;

  /** Маленький МГ праворуч у полі пошуку (головна, каталог): тап по ньому — чат,
      по решті поля — як і раніше, екран пошуку. Видно, коли ввімкнено «МГ у пошуку»
      (css/branches/c.css). Поле — кнопка, тож МГ — span із role="button". */
  function mgInSearchBar(root) {
    const bar = root.querySelector('.search-bar[data-go="search"]');
    if (!bar) return;
    bar.insertAdjacentHTML('beforeend', `
      <span class="search-bar__mg" role="button" tabindex="0" aria-label="${DATA.mgSearch.label}">
        <img src="${DATA.aiChat.avatar}" alt="">
      </span>`);
    const mg = bar.querySelector('.search-bar__mg');
    const open = e => { e.stopPropagation(); e.preventDefault(); AiChat.open(); }; // не пускаємо до data-go
    mg.addEventListener('click', open);
    mg.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') open(e); });
  }

  /** Група товару для питання категорії (DATA.mgCategory) */
  const categoryOf = id => {
    const kind = (DATA.products[id] || {}).kind;
    if (kind === 'wine') return 'wine';
    if (id.startsWith('water')) return 'water';
    if (kind === 'fruit' || id === 'tomatoes' || id === 'cabbage') return 'fresh';
    return 'grocery';
  };

  /** Тег категорії з відповіддю, зібраною з картки товару */
  function categoryTag(id) {
    const C = DATA.mgCategory[categoryOf(id)];
    const info = DATA.pdp.products[id] || {};
    const detail = label => ((info.details || []).find(r => r.label === label) || {}).value;
    const lc = t => t.charAt(0).toLocaleLowerCase('uk-UA') + t.slice(1);
    let answer;
    if (C.from === 'nutrition') {
      const n = info.nutrition || {};
      answer = C.answer.replace(/\{(\w+)\}/g, (m, k) => n[k] || '—');
    } else {
      const value = detail(C.from === 'storage' ? 'Умови зберігання' : 'Гастрономічні поєднання');
      if (!value) return null;
      // «від 0 до +4 °C» → підказка «тобто в холодильнику»; «від +13 до +16 °C» → «не в холодильнику»
      const t = [...value.matchAll(/[+-]?\d+/g)].map(Number);
      const hint = /холодильн/.test(value) || t.length < 2 ? ''
        : t[1] <= 6 ? C.fridge : t[0] >= 7 && t[1] <= 16 ? C.cool : '';
      answer = C.answer.replace('{value}', lc(value)).replace('{hint}', hint || '');
    }
    return { label: C.label, answer };
  }

  /** Стартові теги картки: питання товару → питання категорії → «Знайти схоже» (з базового набору).
      Наступні кроки кожного тегу — два інші, тож мертвих тегів немає. */
  function pdpOpeners(id) {
    id = DATA.products[id] ? id : DATA.pdp.defaultProduct; // екран малюється й без товару (на старті)
    const base = DATA.aiChat.screens.pdp.byKind;
    const similar = (base[(DATA.products[id] || {}).kind] || base.default).find(o => o.similar);
    const own = DATA.mgProduct[id];
    const list = [own, categoryTag(id), similar].filter(Boolean);
    // після відповіді — ще не поставлені теги з цих трьох (далі — менше, аж до жодного)
    const chain = (o, used) => ({ ...o, next: list.filter(x => !used.includes(x)).map(x => chain(x, [...used, x])) });
    return list.map(o => chain(o, [o]));
  }

  Branch.define('c', {
    data: {
      /* Правила доставки (кошик, оформлення, пояснення МГ): мінімальне замовлення 800 ₴,
         доставка 99 ₴, від 1 500 ₴ — 69 ₴, від 2 000 ₴ — 1 ₴ */
      cart: { delivery: { min: 800, price: 99, tiers: [{ from: 1500, price: 69 }, { from: 2000, price: 1 }] } },
      /* пошук натякає, що можна й запитати МГ — на «ти», коротко */
      home: { searchPlaceholder: 'Шукай або запитай' },
      catalog: { searchPlaceholder: 'Шукай або запитай' },
      search: { ...B.search, placeholder: 'Шукай або запитай' },
      mg: { title: B.mg.title, catalog: B.mg.catalog, listing: B.mg.listing, pdp: B.mg.pdp, cart: B.mg.cart },
      // питання з пошуку («Що приготувати на вечерю?») → готовий сценарій чату за ключовими словами
      aiChat: {
        shop: { questionRoutes: B.aiChat.shop.questionRoutes },
        menu: ['Історія чату', 'Налаштування помічника'], // «⋮» у чаті; другий пункт відкриває налаштування
        /* Острівець на головній (js/mg-island.js): без «Вперше тут?» — пропозиція для всіх.
           answer — коротко над товарами; after — друга бульбашка МГ під товарами, перед тегами:
           сума, правило доставки й скільки докласти — там, де людина вирішує (над товарами губилось).
           Суми й пороги — з DATA.cart.delivery ({sumRound} {deliveryHere} {left} {next} {bestFrom} {best}; є ще {deliveryList} {min}). */
        island: {
          fabContinues: true, // тап по МГ, поки острівець відкритий, — продовження звернення, а не привітання
          home: {
            text: 'Пссс, зібрати вам кошик?',
            reply: {
              answer: 'Ось, зібрав дещо на кілька днів',
              items: [{ id: 'tomatoes', badges: ['cinotyzhyky', 'percent'] }, { id: 'cabbage' }, { id: 'banana' },
                      { id: 'appleGolden' }, { id: 'water15', badges: ['myOffer'] }, { id: 'hellmanns' }],
              after: 'Такс, порахуємо.\nЗа все виходить {sumRound}, доставка — {deliveryHere}.\nАле я б докинув ще щось на {left} — тоді доставка буде за {next}.\nА для кошиків від {bestFrom} доставка взагалі за {best}. Ні на що не натякаю 👀',
              next: [
                { label: 'Покласти все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                  answer: 'Поклав {count} {countWord}. У кошику на {total}.',
                  next: [
                    { label: 'Додати ще щось', items: ['pistachios', 'grapesRed', 'oliveOil'],
                      countForms: ['товар', 'товари', 'товарів'],
                      answer: 'До такого кошика часто беруть ще це. Будь-що з них — і доставка подешевшає.',
                      next: [{ label: 'Оформити замовлення', go: 'cart' }] },
                    { label: 'Оформити замовлення', go: 'cart' },
                  ] },
                { label: 'Як доставити дешевше?', items: ['pistachios', 'grapesRed', 'oliveOil'],
                  answer: 'Ось що часто докладають до такого кошика — будь-що з цього, і доставка подешевшає. А самовивіз — узагалі безкоштовно.',
                  next: [{ label: 'Покласти набір у кошик', action: 'addItems',
                           items: ['tomatoes', 'cabbage', 'banana', 'appleGolden', 'water15', 'hellmanns'],
                           countForms: ['товар', 'товари', 'товарів'],
                           answer: 'Поклав {count} {countWord}. У кошику на {total} — докладай плюсиком, що сподобалось вище.',
                           next: [{ label: 'Оформити замовлення', go: 'cart' }] }] },
                { label: 'Інший набір', items: ['appleGolden', 'banana', 'pears', 'grapesRed', 'persimmon'],
                  countForms: ['фрукт', 'фрукти', 'фруктів'],
                  answer: 'Тоді фрукти на тиждень — {count} {countWord}, щоб не набридало.',
                  next: [{ label: 'Покласти все в кошик', action: 'addAll', countForms: ['товар', 'товари', 'товарів'],
                           answer: 'Поклав {count} {countWord}. У кошику на {total}.',
                           next: [{ label: 'Оформити замовлення', go: 'cart' }] }] },
              ],
            },
          },
        },
      },
      /* Екран «Налаштування помічника» (js/branches/c-settings.js): вимикач МГ і скіни.
         Скін — CSS-фільтр для всіх МГ (у кутку, в острівці, тегах, біля пошуку, в чаті). */
      mgSettings: {
        title: 'Налаштування помічника',
        name: 'Машрум Геннадійович',
        subtitle: 'Знайомтеся: Машрум Геннадійович\u00A0— наш ШІ-помічник. Він так довго був грибом, що тепер, здається, трохи більше, ніж просто гриб.',
        showLabel: 'Показувати помічника',
        bigToggle: 'Великий МГ', // той самий вимикач поза телефоном (під «Маленький МГ»)
        showHint: 'Кнопка МГ у кутку екрана. Змахнули його за край — він вимикається; увімкніть тут, щоб повернути.',
        skinsTitle: 'Помічник',
        lockedHint: 'Скоро', // підпис на закритих
        /* Вибір персонажа, як у ChatGPT. Поки доступний лише МГ; решта — заготовка для демо:
           сірі, напівпрозорі, не обираються (locked). image — картинка персонажа
           (assets/images/skins/: Microsoft Fluent Emoji, ліцензія MIT — див. LICENSE.txt там же). */
        skins: [
          { id: 'classic', label: 'Машрум', desc: 'Той самий МГ', filter: 'none' },
          { id: 'owl', label: 'Совеня', desc: 'Пильнує знижки навіть уночі', image: 'assets/images/skins/owl.png', locked: true },
          { id: 'fire', label: 'Вогник', desc: 'Гаряча енергія для швидких покупок', image: 'assets/images/skins/fire.png', locked: true },
          { id: 'droplet', label: 'Крапля', desc: 'Спокій для неквапливих покупок', image: 'assets/images/skins/droplet.png', locked: true },
          { id: 'seedling', label: 'Паросток', desc: 'Зелені ідеї для корисного кошика', image: 'assets/images/skins/seedling.png', locked: true },
          { id: 'robot', label: 'Робот', desc: 'Точний, як список покупок', image: 'assets/images/skins/robot.png', locked: true },
          { id: 'fox', label: 'Лис', desc: 'Хитро знаходить найкращу ціну', image: 'assets/images/skins/fox.png', locked: true },
          { id: 'avocado', label: 'Авокадо', desc: 'Корисна порада на щодень', image: 'assets/images/skins/avocado.png', locked: true },
          { id: 'mushroom', label: 'Грибочок', desc: 'Добрий гриб — для тих, кому МГ суворий', image: 'assets/images/skins/mushroom.png', locked: true },
        ],
      },
      /* Картка товару: теги під конкретний товар — те, що люди справді питають про нього
         (замість загального «Чи підійде мені»). Порядок тегів: питання товару → питання
         категорії (DATA.mgCategory) → «Знайти схоже». Ті самі теги — жовті під назвою
         й стартові в чаті. Відповіді — лише з того, що є на картці (сорт, склад, зберігання). */
      mgProduct: {
        hellmanns: { label: 'Можна з ним запікати?', answer: 'Так, Hellmann’s Original тримає запікання — не розшаровується, як легкі майонези. Жирність 73%, тож багато не треба. Відкритий — у холодильнику до 3 місяців.' },
        pistachios: { label: 'Дуже солоні?', answer: 'Легко солоні: до пива саме те, а в салаті чи пасті краще менше солити саму страву. Смажені, і білка чимало — 21 г на 100 г.' },
        oliveOil: { label: 'На ній можна смажити?', answer: 'Так, Pure — якраз для смаження й запікання: це суміш рафінованої олії й першого віджиму, вона не горить так швидко. Для салатів теж підійде, смак мʼякий.' },
        marshmallow: { label: 'Можна підсмажити на вогні?', answer: 'Так, на шпажці над вогнем чи грилем — 10–20 секунд, і зверху карамельна скоринка. Ще кидайте в какао. Але це солодощі: 58 г цукру на 100 г.' },
        bakoma: { label: 'Справді без молока?', answer: 'Так, основа кокосова — без молока й лактози, підійде веганам. Смак — солона карамель. Зберігати в холодильнику, +2…+6 °C.' },
        water075: { label: 'Можна пити щодня?', answer: 'Так, «Моршинська» — з низькою мінералізацією, мʼяка на смак, для щоденного пиття всією родиною. Ця пляшка 0,75 л — зручно взяти з собою.' },
        water15: { label: 'Велика пляшка вигідніша?', answer: 'Так: у пляшці 1,5 л літр виходить близько 21 ₴, а в 0,75 л — близько 33 ₴. Вода та сама, негазована.' },
        water15light: { label: 'Сильно газована?', answer: 'Ні, слабогазована — легкі бульбашки, не «колеться». Компроміс, якщо негазована здається пласкою, а газована — занадто.' },
        pineapple: { label: 'Як його почистити?', answer: 'Зріжте верх і низ, поставте ананас вертикально й зрізайте шкірку смугами згори донизу. Тверду серцевину виріжте. Сорт MD2 уже стиглий — дозрівати не треба.' },
        applesGreen: { label: 'Для шарлотки підійдуть?', answer: 'Так, Гренні Сміт — класика для шарлотки: кислинка врівноважує солодке тісто, а шматочки не розварюються в кашу.' },
        pears: { label: 'Вони вже мʼякі?', answer: 'Конференс стиглий, коли біля хвостика мʼякоть ледь піддається натиску. Тверді дозріють за 2–3 дні при кімнатній температурі — потім у холодильник.' },
        tomatoes: { label: 'Для салату підійдуть?', answer: 'Так, Рожевий гігант мʼясистий і солодкуватий, соку дає мало — салат не «пливе». Лише не тримайте їх у холодильнику: помідори там втрачають смак.' },
        cabbage: { label: 'Не гірчить?', answer: 'Ні, рання білоголова — ніжна й солодкувата, без гіркоти. Найкраща для салату з огірком і кропом.' },
        grapes: { label: 'Його треба мити?', answer: 'Так, перед їжею — під проточною водою, не замочуючи. Шкірка тонка, тож мийте обережно й незадовго до того, як їсти: мокрий виноград швидко псується.' },
        appleGolden: { label: 'Солодкі чи кислі?', answer: 'Солодкі: Голден Делішес — медово-солодкий, майже без кислинки. Хочеться з кислинкою — беріть зелені Гренні Сміт.' },
        banana: { label: 'Дозріють удома?', answer: 'Так, зеленуваті дозрівають за 2–3 дні при кімнатній температурі, а поруч з яблуками — ще швидше. Холодильник банани не люблять: шкірка чорніє.' },
        peach: { label: 'Як зрозуміти, що стиглий?', answer: 'Стиглий персик пахне і біля хвостика ледь піддається натиску. Твердий — покладіть на день-два в паперовий пакет при кімнатній температурі.' },
        watermelon: { label: 'Як вибрати смачний?', answer: 'Дзвінкий звук на постук, суха плодоніжка і жовта пляма з боку, де він лежав на землі. Вогник — ранній сорт: невеликий, солодкий, з дрібним насінням.' },
        melon: { label: 'Солодка чи ні?', answer: 'Солодка: у Валенсії 7,9 г цукру на 100 г і медовий аромат. Стиглу видно по запаху біля хвостика й трохи мʼякій шкірці з протилежного боку.' },
        lime: { label: 'Скільки з нього соку?', answer: 'З одного лайма — 1–2 столові ложки соку. Щоб вичавити більше, покатайте його по столу перед тим, як різати. Шкірка тонка — цедра теж згодиться.' },
        grapesRed: { label: 'Він з кісточками?', answer: 'Так, Ред Глоб — сорт із кісточками, зате ягоди великі й хрусткі. Для сирної тарілки це не заважає, а дітям краще без кісточок — глянь схожі.' },
        mango: { label: 'Як його різати?', answer: 'Розріжте вздовж з обох боків пласкої кісточки, на половинках зробіть ножем сітку до шкірки й виверніть — кубики зрізаються легко. Кент без волокон, тож це просто.' },
        persimmon: { label: 'Не вʼяже?', answer: 'Ні, Королек не терпкий, навіть трохи твердий. Найсмачніший, коли мʼякоть стає желейною: дозріє за кілька днів у кімнаті.' },
        cherimoya: { label: 'Як це їсти?', answer: 'Розріжте навпіл і їжте ложкою, як ківі. Чорне насіння не їжте. Стигла черімоя мʼяка на дотик, як авокадо, а на смак — банан, ананас і полуниця разом.' },
        wineLail: { label: 'Сухе чи солодке?', answer: 'Сухе червоне: фруктово-ягідні й пряні ноти, помірна кислотність. Подавайте трохи прохолодним, +16…+18 °C.' },
        winePascal: { label: 'Яке воно на смак?', answer: 'Сухе біле шаблі: свіже, мінеральне, з цитрусом і зеленим яблуком, кислотність висока. Охолодіть до +10…+12 °C.' },
        punchRauschgold: { label: 'Як його підігріти?', answer: 'У каструлі на слабкому вогні до 60–70 °C — не кипʼятіть, інакше зникне аромат. Можна додати скибочку апельсина й паличку кориці.' },
        wineCasa: { label: 'Воно газоване?', answer: 'Ледь-ледь: у віно верде легка природна бульбашка, не як у шампанського. Сухе, легке, 11%. Подавайте добре охолодженим, +8…+10 °C.' },
      },
      /* Питання категорії — другий тег; відповідь складається з картки товару (js/branches/c.js, pdpOpeners):
         storage — «Умови зберігання», pairing — «Гастрономічні поєднання», nutrition — склад на 100 г */
      mgCategory: {
        fresh: { label: 'Як зберігати?', from: 'storage', answer: 'Найкраще зберігати {value}{hint}.',
                 fridge: ', тобто в холодильнику', cool: ' — у прохолодному місці, а не в холодильнику' },
        wine: { label: 'До чого пасує?', from: 'pairing', answer: 'Найкраще пасує: {value}.' },
        grocery: { label: 'Що по складу?', from: 'nutrition',
                   answer: 'На 100 г: {kcal} ккал, білки {protein}, жири {fat}, вуглеводи {carbs}, з них цукор {sugar}.' },
        water: { label: 'Як зберігати?', from: 'storage', answer: 'Найкраще зберігати {value}{hint}.', fridge: '', cool: '' },
      },
      /* Машрума можна перетягнути, а викинути за екран — сховати (js/branches/c-drag.js) */
      /* МГ праворуч від поля пошуку — кнопка в чат (js/branches/c-search.js).
         found — відповідь, коли за запитом є товари; notFound — лише теги-наміри.
         {query} — запит, {count} {countWord} — скільки товарів показали. */
      mgSearch: {
        label: 'Запитати помічника',
        found: 'Ось що є за запитом «{query}» — {count} {countWord}. Підкажу, що обрати:',
        notFound: 'За запитом «{query}» підкажу, що обрати:',
        countForms: ['товар', 'товари', 'товарів'],
        maxItems: 8, // скільки карток показати в чаті
        missChip: 'Запитати МГ про «{query}»', // жовтий тег під «нічого не знайшли»
        missing: '«{query}» у демо ще не завезли 🙂 Тут поки фрукти, вода й кілька дрібниць — із ними допоможу:',
      },
      /* Поза телефоном: перемикач «Маленький МГ» — аватарка МГ на початку рядка жовтих тегів */
      mgAvatarToggle: { label: 'Маленький МГ', on: false }, // on — стан за замовчуванням
      /* Поза телефоном: «МГ у пошуку» — маленький МГ у полях пошуку (головна, каталог, екран пошуку) */
      mgSearchToggle: { label: 'МГ у пошуку', on: true },
      /* Поза телефоном (і в шторці на телефоні), останнім: «Острівець» — показати / сховати острівець
         просто зараз (для демо, без прокрутки до банера). Стоїть як є: відкрили на скролі — вмикається сам */
      islandToggle: { label: 'Показати острівець' },
      /* Поза телефоном: вигляд острівця — I жовта клякса, II фіолетова «хмаринка» (css/branches/c-island.css) */
      /* Острівець III — віджет над таб-баром головної (js/branches/c-island3.js, vendor/mashrum-island/).
         skills — пропозиції, що змінюються кожні 7 с: t — текст, cta — підпис стрілки для скрінрідера,
         pal — 4 світлі близькі кольори (основний, другий, туман, серпанок). Поки одна пропозиція. */
      mgWidget: {
        skills: [
          { t: 'Пссс, зібрати вам кошик?', cta: 'Зібрати кошик',
            think: 'Добираю продукти', done: 'Кошик зібрано', doneCta: 'Відкрити кошик',
            pal: ['#FFE14A', '#D2F53A', '#FFF08A', '#F3FF9E'] },
        ],
      },
      islandColorToggle: { label: 'Острівець', options: { yellow: 'I', purple: 'II', iii: 'III' }, value: 'yellow' },
      mgDrag: {
        gone: 'Машрум сховався',
        back: 'Повернути',
        toastMs: 5000, // скільки тримається снекбар (таймер рахує секунди назад)
      },
    },
    screens: {
      /* Головна: у полі пошуку праворуч — маленький МГ (тап — чат) */
      home(root, param) {
        BaseScreens.home(root, param);
        mgInSearchBar(root);
      },

      /* Каталог: без нижньої стікі-панелі (пошук, чипси категорій, «доставка за 1 ₴»);
         теги — під пошуком і «Акційними пропозиціями»; у полі пошуку — маленький МГ */
      catalog(root, param) {
        BaseScreens.catalog(root, param);
        mgInSearchBar(root);
        root.querySelector('.cat-bottom')?.remove();
        // добірки («Тільки онлайн», «Святку з Jacobs») — з продакшену, у демо нікуди не ведуть:
        // не натискаються й не підсвічуються (css/branches/c.css)
        root.querySelectorAll('.cat-chips .choice-chip').forEach(b => { b.removeAttribute('data-toggle'); b.removeAttribute('aria-pressed'); });
        root.querySelector('.cat-top').insertAdjacentHTML('afterend', MG.block(DATA.mg.catalog, { compact: true }));
      },

      /* Лістинг: хедер як у застосунку — сірий, стікі разом із чипсами, при прокрутці мутне скло;
         товари — на білому «аркуші», теги МГ — угорі аркуша; пошук унизу веде на екран пошуку. Вузли переносимо, а не малюємо
         заново, — фільтри з js/screens/listing.js працюють як були. Стилі — css/branches/c.css */
      listing(root, param) {
        BaseScreens.listing(root, param);
        const head = document.createElement('div');
        head.className = 'plp-head';
        root.querySelector('.plp-appbar').before(head);
        head.append(root.querySelector('.plp-appbar'), root.querySelector('.plp-tabs'));
        const sheet = document.createElement('div');
        sheet.className = 'plp-sheet';
        head.after(sheet);
        sheet.append(root.querySelector('.plp-grid'), root.querySelector('.plp-empty'));
        const list = DATA.mg.listing[param || DATA.listing.defaultPage];
        sheet.insertAdjacentHTML('afterbegin', MG.block(list, { compact: true }));
        // без кнопки меню каталогу — пошук на всю ширину
        root.querySelector('.plp-bottom__search .plp-icon-btn[data-go="catalog"]')?.remove();
        // пошук у нижній панелі — той самий, що на головній: той самий текст і тап веде на екран пошуку
        root.querySelector('.plp-search').outerHTML = `
          <button class="search-bar plp-search" type="button" data-go="search">
            <img src="assets/icons/search.svg" alt="">
            <span>${DATA.home.searchPlaceholder}</span>
          </button>`;
        // прокрутили — хедер стає склом (екран перемальовується, тож слухач — один раз)
        if (!root.dataset.plpHead) {
          root.dataset.plpHead = '1';
          root.addEventListener('scroll', () => {
            root.querySelector('.plp-head')?.classList.toggle('is-scrolled', root.scrollTop > 0);
          }, { passive: true });
        }
      },

      /* Картка товару: теги — одразу під назвою; ті самі, що стартові в чаті (pdpOpeners) */
      pdp(root, param) {
        BaseScreens.pdp(root, param);
        const tags = pdpOpeners(param).map(o => ({ label: o.label, opener: o.label }));
        root.querySelector('.pdp-head').insertAdjacentHTML('afterend', MG.block(tags, { compact: true }));
      },

      /* Кошик: теги над списком товарів; порожній кошик — блоку немає */
      cart: Object.assign(function (root, param) {
        BaseScreens.cart(root, param);
        root.querySelector('.cart-body').insertAdjacentHTML('afterbegin', MG.block(DATA.mg.cart, { compact: true }));
      }, {
        update() {
          BaseScreens.cart.update();
          const block = document.querySelector('#cart .mg-block');
          if (block) block.hidden = !Cart.count();
        },
      }),
    },
  });

  if (!Branch.is('c')) return;

  /* Картка товару, чат: стартові теги — під конкретний товар (pdpOpeners, DATA.mgProduct),
     а не загальне «Чи підійде мені» (МГ ще нічого не знає про гостя — звучало дивно) */
  const baseOpeners = AiChat.screenOpeners;
  AiChat.screenOpeners = function () {
    return this.screenKey() === 'pdp' ? pdpOpeners(App.params.pdp) : baseOpeners.call(this);
  };

  /* Поза телефоном, на місці перемикача вигляду острівця: чекбокс «Маленький МГ».
     Вимкнено — рядок тегів без аватарки МГ (css/branches/c.css, <html data-mg-avatar="off">).
     Або великий МГ, або маленький: змахнули чи вимкнули великого (подія mg-enabled з
     js/branches/c-drag.js) — «Маленький МГ» вмикається сам; повернули великого — вимикається.
     Вручну тумблер перемикається як і раніше. Вибір памʼятається в браузері. */
  document.addEventListener('DOMContentLoaded', () => { // після App.init — DATA вже з даними гілки
    const T = DATA.mgAvatarToggle, key = 'silpo-c-mg-avatar-v2'; // -v2: з 25.09 за замовчуванням вимкнено, старий вибір не діє
    let on = T.on;
    try {
      const v = localStorage.getItem(key);
      if (v != null) on = v === 'on';
      if (localStorage.getItem('silpo-c-mg-enabled') === 'off') on = true; // великого немає — маленький у тегах
    } catch (e) { /* приватний режим */ }
    const box = document.createElement('label');
    box.className = 'chips-toggle mg-avatar-toggle';
    box.innerHTML = `<span class="chips-toggle__label">${T.label}</span><input class="switch" type="checkbox">`;
    document.body.append(box);
    const input = box.querySelector('input');
    const set = v => {
      document.documentElement.dataset.mgAvatar = v ? 'on' : 'off';
      input.checked = v;
      try { localStorage.setItem(key, v ? 'on' : 'off'); } catch (e) { /* ок */ }
    };
    set(on);
    input.addEventListener('change', () => set(input.checked));
    document.addEventListener('mg-enabled', e => set(!e.detail.on)); // або великий, або маленький
  });

  /* Поза телефоном, під «Великий МГ»: «МГ у пошуку» — окремо від «Маленького МГ».
     Вимкнено — у полях пошуку МГ немає (<html data-mg-search="off">, css/branches/c.css). Памʼятається. */
  document.addEventListener('DOMContentLoaded', () => {
    const T = DATA.mgSearchToggle, key = 'silpo-c-mg-search';
    let on = T.on;
    try { const v = localStorage.getItem(key); if (v != null) on = v === 'on'; } catch (e) { /* приватний режим */ }
    const box = document.createElement('label');
    box.className = 'chips-toggle mg-search-toggle';
    box.innerHTML = `<span class="chips-toggle__label">${T.label}</span><input class="switch" type="checkbox">`;
    document.body.append(box);
    const input = box.querySelector('input');
    const set = v => {
      document.documentElement.dataset.mgSearch = v ? 'on' : 'off';
      input.checked = v;
      try { localStorage.setItem(key, v ? 'on' : 'off'); } catch (e) { /* ок */ }
    };
    set(on);
    input.addEventListener('change', () => set(input.checked));
  });

  /* Поза телефоном, останнім (під «Острівець · I | II | III»): «Показати острівець» — вмикач = острівець
     відкритий. Увімкнули — МГ заговорює на головній (I, II — острівець; III — віджет розгортається);
     вимкнули — ховається (III — згортається у «спору»). Острівець відкрився чи закрився сам
     (прокрутка, хрестик, чат) — вмикач підлаштовується. Не памʼятається: це дія, а не налаштування. */
  document.addEventListener('DOMContentLoaded', () => {
    const T = DATA.islandToggle;
    const box = document.createElement('label');
    box.className = 'chips-toggle island-on-toggle';
    box.innerHTML = `<span class="chips-toggle__label">${T.label}</span><input class="switch" type="checkbox">`;
    document.body.append(box);
    const input = box.querySelector('input');
    const iii = () => document.documentElement.dataset.islandColor === 'iii';
    const widget = () => (window.MgWidget && MgWidget.el) || null;
    const isOpen = () => (iii() ? Boolean(widget() && !MgWidget.isMin()) : (typeof MgIsland !== 'undefined' && MgIsland.root && MgIsland.isOpen()));
    const sync = () => { input.checked = isOpen(); };
    input.addEventListener('change', () => {
      if (input.checked) {
        const speak = () => MgIsland.speak('home', { force: true }); // force — для острівця III (js/branches/c-island3.js)
        if (App.current && App.current.id === 'home') speak();
        else { App.go('home'); setTimeout(speak, 350); }
      } else if (iii()) widget()?.collapse();
      else MgIsland.hide();
      setTimeout(sync, 1000); // не відкрилось (напр. МГ перетягнутий) — вмикач назад
    });
    // острівець відкрився / закрився сам (MgIsland.init — пізніше, у js/mg-island.js)
    setTimeout(() => setTimeout(() => setTimeout(() => {
      const root = typeof MgIsland !== 'undefined' && MgIsland.root;
      if (root) new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
    })));
    ['mashrum-expand', 'mashrum-collapse', 'island-color', 'screenchange'].forEach(ev => document.addEventListener(ev, () => setTimeout(sync, 50)));
  });

  /* Поза телефоном, під «МГ у пошуку»: «Острівець · I | II | III» (жовта клякса, фіолетова хмаринка, віджет над таб-баром) — вигляд острівця
     (<html data-island-color="purple">, css/branches/c-island.css). Памʼятається в браузері. */
  document.addEventListener('DOMContentLoaded', () => {
    const T = DATA.islandColorToggle, key = 'silpo-c-island-color';
    let value = T.value;
    try { const v = localStorage.getItem(key); if (v in T.options) value = v; } catch (e) { /* приватний режим */ }
    const box = document.createElement('div');
    box.className = 'chips-toggle island-color-toggle';
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', 'Колір острівця');
    box.innerHTML = `<span class="chips-toggle__label">${T.label}</span>`
      + Object.entries(T.options).map(([k, label]) =>
        `<button class="chips-toggle__btn" type="button" data-island-color-btn="${k}" aria-pressed="false">${label}</button>`).join('');
    document.body.append(box);
    const set = v => {
      document.documentElement.dataset.islandColor = v;
      box.querySelectorAll('[data-island-color-btn]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.islandColorBtn === v)));
      try { localStorage.setItem(key, v); } catch (e) { /* ок */ }
      document.dispatchEvent(new CustomEvent('island-color', { detail: { value: v } })); // III — js/branches/c-island3.js
    };
    set(value);
    box.addEventListener('click', e => { const b = e.target.closest('[data-island-color-btn]'); if (b) set(b.dataset.islandColorBtn); });
  });

  /* Чат — як у гілці A, лише своє питання з пошуку спершу шукає готовий сценарій
     (у B це робить js/branches/b-chat.js разом з іншими змінами чату) */
  const chat = AiChat;
  const baseAsk = chat.ask.bind(chat);
  chat.ask = function (text) {
    const t = text.trim().toLocaleLowerCase('uk-UA');
    const route = (DATA.aiChat.shop.questionRoutes || []).find(r => r.keywords.some(k => t.includes(k)));
    const home = (DATA.aiChat.screens.home || {}).openers || [];
    const opener = route && [...home, ...DATA.aiChat.openers]
      .map(o => (typeof o === 'string' ? DATA.aiChat.openers.find(x => x.id === o) : o))
      .find(o => o && o.label === route.opener);
    if (opener) return this.runScenario({ ...opener, label: text.trim() });
    return baseAsk(text);
  };
})();
