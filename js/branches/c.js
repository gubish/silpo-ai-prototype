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

  Branch.define('c', {
    data: {
      home: { searchPlaceholder: B.home.searchPlaceholder },
      catalog: { searchPlaceholder: B.catalog.searchPlaceholder },
      search: B.search,
      mg: { title: B.mg.title, catalog: B.mg.catalog, listing: B.mg.listing, pdp: B.mg.pdp, cart: B.mg.cart },
      // питання з пошуку («Що приготувати на вечерю?») → готовий сценарій чату за ключовими словами
      aiChat: {
        shop: { questionRoutes: B.aiChat.shop.questionRoutes },
        menu: ['Історія чату', 'Налаштування помічника'], // «⋮» у чаті; другий пункт відкриває налаштування
      },
      /* Екран «Налаштування помічника» (js/branches/c-settings.js): вимикач МГ і скіни.
         Скін — CSS-фільтр для всіх МГ (у кутку, в острівці, тегах, біля пошуку, в чаті). */
      mgSettings: {
        title: 'Налаштування помічника',
        name: 'Машрум Геннадійович',
        subtitle: 'Знайомтеся: Машрум Геннадійович\u00A0— наш ШІ-помічник. Він так довго був грибом, що тепер, здається, трохи більше, ніж просто гриб.',
        showLabel: 'Показувати помічника',
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
      },
      /* Поза телефоном: перемикач «МГ у тегах» — аватарка МГ на початку рядка жовтих тегів */
      mgAvatarToggle: { label: 'МГ у тегах', on: false }, // on — стан за замовчуванням
      mgDrag: {
        gone: 'Машрум сховався',
        back: 'Повернути',
        toastMs: 5000, // скільки тримається снекбар (таймер рахує секунди назад)
      },
    },
    screens: {
      /* Каталог: без нижньої стікі-панелі (пошук, чипси категорій, «доставка за 1 ₴»);
         теги — під пошуком і «Акційними пропозиціями» */
      catalog(root, param) {
        BaseScreens.catalog(root, param);
        root.querySelector('.cat-bottom')?.remove();
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

      /* Картка товару: теги — одразу під назвою */
      pdp(root, param) {
        BaseScreens.pdp(root, param);
        root.querySelector('.pdp-head').insertAdjacentHTML('afterend', MG.block(DATA.mg.pdp, { compact: true }));
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

  if (Branch.current !== 'c') return;

  /* Поза телефоном, на місці перемикача вигляду острівця: чекбокс «МГ у тегах».
     Вимкнено — рядок тегів без аватарки МГ (css/branches/c.css, <html data-mg-avatar="off">).
     Вибір памʼятається в браузері. */
  document.addEventListener('DOMContentLoaded', () => { // після App.init — DATA вже з даними гілки
    const T = DATA.mgAvatarToggle, key = 'silpo-c-mg-avatar-v2'; // -v2: з 25.09 за замовчуванням вимкнено, старий вибір не діє
    let on = T.on;
    try { const v = localStorage.getItem(key); if (v != null) on = v === 'on'; } catch (e) { /* приватний режим */ }
    const set = v => { document.documentElement.dataset.mgAvatar = v ? 'on' : 'off'; };
    set(on);
    const box = document.createElement('label');
    box.className = 'chips-toggle mg-avatar-toggle';
    box.innerHTML = `<span class="chips-toggle__label">${T.label}</span><input class="switch" type="checkbox" ${on ? 'checked' : ''}>`;
    document.body.append(box);
    box.querySelector('input').addEventListener('change', e => {
      set(e.target.checked);
      try { localStorage.setItem(key, e.target.checked ? 'on' : 'off'); } catch (err) { /* ок */ }
    });
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
