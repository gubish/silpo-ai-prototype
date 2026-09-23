/* =====================================================================
   ПОШУК (#search). Дані: DATA.search + DATA.products
   Figma: файл «Пошук та Фільтри», nodes 6005:20229 (історія), 6005:20461 (видача);
   порожній стан і список категорій — за скрінами з проду.
   • Три стани: підказки (історії ще немає) → історія → результати.
   • Поки набираємо — під полем лише відповідні запити з історії та категорії
     («Ябл» → «Яблука» в історії й «Фрукти, овочі»). Товари — лише після
     «Надіслати»/Enter або тапу по підказці, історії чи категорії; тоді ж
     запит потрапляє в історію.
   • Історія живе, доки не натиснули «На початок».
   ===================================================================== */

Screens.search = function renderSearch(root) {
  const S = DATA.search;
  const lower = s => s.toLocaleLowerCase('uk-UA');
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  const words = s => lower(s).split(/[^a-zа-яіїєґʼ’'0-9]+/i).filter(Boolean);
  let history = [...(S.startHistory || [])];
  let submitted = null; // запит, за яким показано товари (після «Надіслати»)

  root.innerHTML = `
    <header class="search-head">
      <button class="search-head__icon" type="button" data-back aria-label="Назад">
        <img class="icon-grey" src="assets/icons/arrow-back.svg" alt="">
      </button>
      <form class="search-field" role="search">
        <img src="assets/icons/search.svg" alt="">
        <input type="search" placeholder="${S.placeholder}" aria-label="${S.placeholder}" enterkeyhint="search" autocomplete="off">
        <button class="search-field__clear" type="button" aria-label="Стерти запит" hidden>
          <img src="assets/icons/circle-cancel.svg" alt="">
        </button>
      </form>
      <button class="search-head__icon search-head__filter" type="button" aria-label="Фільтри">
        <img src="assets/icons/filter-sort.svg" alt="">
      </button>
    </header>
    <div class="search-body"></div>
    <div class="search-bottom">
      <!-- плашка кошика (як на PDP) — видно, коли в кошику щось є -->
      <button class="cart-pill" type="button" data-go="cart" data-cart-visible hidden aria-label="Перейти до кошика">
        <span class="cart-pill__icon">
          <img src="assets/icons/cart-pill.svg" alt="">
          <span class="cart-pill__count" data-cart-count></span>
        </span>
        <span data-cart-total></span>
      </button>
    </div>`;

  const form = root.querySelector('.search-field');
  const input = form.querySelector('input');
  const clearBtn = form.querySelector('.search-field__clear');
  const body = root.querySelector('.search-body');
  Keyboard.attach(input, { host: root });

  /* ---------- Пошук ---------- */
  /** Чи підходить слово назви до слова запиту: «яблуко» ≈ «Яблука», «банани» ≈ «Банан» */
  const wordMatch = (nameWord, q) => {
    if (nameWord.startsWith(q)) return true;
    const stem = q.length > 4 ? q.slice(0, -2) : q.length > 3 ? q.slice(0, -1) : q;
    return nameWord.startsWith(stem) && nameWord.length <= q.length + 3;
  };
  const nameMatches = (name, qWords) => {
    const nw = words(name);
    return qWords.every(q => nw.some(w => wordMatch(w, q)));
  };
  const catMatches = (cat, qWords) =>
    qWords.some(q => (cat.keywords || []).some(k => q.startsWith(k) || (q.length >= 3 && k.startsWith(q))));

  /** Товари категорії: items + усі товари kind + (rule: 'sale') усі акційні */
  const catProducts = cat => {
    const ids = new Set(cat.items || []);
    Object.entries(DATA.products).forEach(([id, p]) => {
      if (cat.kind && p.kind === cat.kind) ids.add(id);
      if (cat.rule === 'sale' && p.oldPrice) ids.add(id);
    });
    return [...ids];
  };

  function find(query) {
    const q = words(query);
    if (!q.length) return { cats: [], ids: [] };
    const byName = Object.keys(DATA.products).filter(id => nameMatches(DATA.products[id].name, q));
    const cats = S.categories.filter(c => catMatches(c, q));
    const byCat = cats.flatMap(catProducts).filter(id => !byName.includes(id));
    // спершу точні збіги першого слова («Вино…»), далі — будь-якого слова,
    // наприкінці — лише за початком слова («вино» → «Виноград»)
    const close = (w, x) => w === x || (wordMatch(w, x) && w.length <= x.length + 3);
    const rank = id => {
      const nw = words(DATA.products[id].name);
      return close(nw[0], q[0]) ? 0 : nw.some(w => close(w, q[0])) ? 1 : 2;
    };
    byName.sort((a, b) => rank(a) - rank(b));
    return { cats, ids: [...byName, ...new Set(byCat)] };
  }

  /** Назва товару з жирними словами, що збіглися із запитом (як у Figma) */
  function highlight(name, query) {
    const q = words(query);
    return name.replace(/[^\s«»"(),]+/g, w => (q.some(x => wordMatch(lower(w), x)) ? `<b>${w}</b>` : w));
  }

  /* ---------- Розмітка станів ---------- */
  const chip = text => `<button class="search-chip" type="button" data-search-query="${text}">${text}</button>`;
  const catRow = (c, i) => `
    <button class="search-cat" type="button" data-search-cat="${i}">
      <img src="${c.icon}" alt="">
      <span>${c.label}</span>
      <img class="search-cat__chevron icon-grey" src="assets/icons/chevron-right.svg" alt="">
    </button>`;
  const catChip = c => `
    <button class="search-cat-chip" type="button" data-search-cat="${S.categories.indexOf(c)}">
      <img src="${c.icon}" alt="">${c.label}
    </button>`;
  const title = (text, extra = '') => `<div class="search-title"><h2>${text}</h2>${extra}</div>`;

  const productRow = (id, query) => {
    const p = DATA.products[id];
    return `
      <article class="search-row" data-go="pdp" data-param="${id}">
        <img class="search-row__img" src="${p.image}" alt="">
        <div class="search-row__info">
          <p class="search-row__name">${highlight(p.name, query)}</p>
          <span class="search-row__weight">${p.weight}</span>
          <div class="search-row__price">
            ${p.oldPrice ? `<span class="price-old">${p.oldPrice.toFixed(2)}</span><span class="discount-tag">−${p.discount}%</span>` : ''}
            <strong>${UI.money(p.price)}</strong>
          </div>
        </div>
        <button class="like-btn search-row__like" type="button" data-like aria-pressed="false" aria-label="Улюблене">
          <img class="like-btn__off" src="assets/icons/heart-red.svg" alt="">
          <img class="like-btn__on" src="assets/icons/heart-red-filled.svg" alt="">
        </button>
        ${UI.qtyControl(id)}
      </article>`;
  };

  const categoriesBlock = () => `
    <section class="search-section">
      ${title(S.categoriesTitle)}
      <div class="search-cats">${S.categories.map(catRow).join('')}</div>
    </section>`;

  /** Історія пошуку (вся або лише ті запити, що підходять до набраного) */
  const historyBlock = list => `
    <section class="search-section">
      ${title(S.historyTitle, `<button class="search-title__action" type="button" data-search-clear>${S.clear}</button>`)}
      <ul class="search-history">
        ${list.map(esc).map(h => `
          <li>
            <button class="search-history__item" type="button" data-search-query="${h}">
              <img src="assets/icons/time-history.svg" alt="">${h}
            </button>
            <button class="search-history__remove" type="button" data-search-remove="${h}" aria-label="Прибрати «${h}» з історії">
              <img src="assets/icons/circle-cancel.svg" alt="">
            </button>
          </li>`).join('')}
      </ul>
    </section>`;

  /** Категорії, що підходять до набраного: за keywords або за своїми товарами
      («Яблука» → «Фрукти, овочі»). Добірки за правилом (rule) — лише за keywords. */
  const catsFor = q => S.categories.filter(c => catMatches(c, q)
    || (!c.rule && catProducts(c).some(id => nameMatches(DATA.products[id].name, q))));

  function render() {
    const query = input.value.trim();
    clearBtn.hidden = !input.value;
    const showResults = Boolean(query) && submitted === query;
    root.classList.toggle('has-query', showResults);

    if (!query) {
      /* стан 1–2: підказки або історія + усі категорії */
      body.innerHTML = (history.length
        ? historyBlock(history)
        : `<section class="search-section">
             ${title(S.suggestionsTitle)}
             <div class="search-chips">${S.suggestions.map(chip).join('')}</div>
           </section>`)
        + categoriesBlock();
    } else if (!showResults) {
      /* набираємо: лише відповідні запити з історії й категорії, товари — після «Надіслати» */
      const q = words(query);
      const hist = history.filter(h => nameMatches(h, q));
      const cats = catsFor(q);
      // гілка дизайну може показати свої підказки (Screens.search.suggest — js/branches/b-search.js)
      const custom = Screens.search.suggest && Screens.search.suggest({ query, q, hist, cats, ids: find(query).ids, esc, wordMatch });
      if (custom != null) body.innerHTML = custom;
      else body.innerHTML = (hist.length ? historyBlock(hist) : '')
        + (cats.length ? `
          <section class="search-section">
            ${title(S.categoriesTitle)}
            <div class="search-cats">${cats.map(c => catRow(c, S.categories.indexOf(c))).join('')}</div>
          </section>` : '')
        + (hist.length || cats.length ? '' : `
          <section class="search-section">
            <p class="search-empty">${S.submitHint.replace('{query}', esc(query))}</p>
          </section>`);
    } else {
      /* стан 3: видача */
      const { ids } = find(query);
      const cats = catsFor(words(query));
      body.innerHTML = `
        ${cats.length ? `
        <section class="search-section">
          ${title(S.categoriesTitle)}
          <div class="hscroll hscroll--bleed search-cat-chips" tabindex="0">${cats.map(catChip).join('')}</div>
        </section>` : ''}
        ${ids.length ? `
        <section class="search-section">
          ${title(S.productsTitle)}
          <div class="search-results">${ids.map(id => productRow(id, query)).join('')}</div>
        </section>` : `
        <section class="search-section">
          <p class="search-empty">${S.empty.replace('{query}', esc(query))}</p>
          <div class="search-chips">${S.suggestions.map(chip).join('')}</div>
        </section>`}`;
      body.querySelectorAll('.hscroll').forEach(enableDragScroll);
    }
    Cart.render();
  }

  /* ---------- Історія ---------- */
  function remember(query) {
    query = query.trim();
    if (!query) return;
    history = [query, ...history.filter(h => lower(h) !== lower(query))].slice(0, S.historyMax);
  }
  /** Показати видачу за запитом (Enter, «Надіслати», тап по підказці, історії, категорії) */
  function runQuery(query) {
    query = query.trim();
    input.value = query;
    submitted = query;
    remember(query);
    input.blur();
    render();
    root.scrollTop = 0;
  }

  /* ---------- Події ---------- */
  // набираємо — видача ховається, замість неї підказки з історії й категорії
  input.addEventListener('input', () => { submitted = null; render(); });
  // «Надіслати» на iOS-клавіатурі або Enter — показати товари
  form.addEventListener('submit', e => { e.preventDefault(); if (input.value.trim()) runQuery(input.value); });
  clearBtn.addEventListener('mousedown', e => e.preventDefault()); // фокус лишається в полі
  clearBtn.addEventListener('click', () => { input.value = ''; submitted = null; render(); input.focus(); });
  root.addEventListener('scroll', () => { if (document.activeElement === input) input.blur(); }, { passive: true });

  body.addEventListener('click', e => {
    const q = e.target.closest('[data-search-query]');
    if (q) { runQuery(q.dataset.searchQuery); return; }
    const rm = e.target.closest('[data-search-remove]');
    if (rm) { history = history.filter(h => h !== rm.dataset.searchRemove); render(); return; }
    if (e.target.closest('[data-search-clear]')) { history = []; render(); return; }
    const cat = e.target.closest('[data-search-cat]');
    if (cat) {
      const c = S.categories[cat.dataset.searchCat];
      if (c.go) { remember(input.value); App.go(c.go, c.param); } else runQuery(c.label);
      return;
    }
    // відкрили товар із видачі — запит іде в історію (сам перехід робить app.js)
    if (e.target.closest('.search-row') && !e.target.closest('[data-add], [data-remove], [data-like]')) remember(input.value);
  });

  /* Щоразу, як пошук відкривають заново (не «Назад» із товару чи кошика), —
     порожнє поле з клавіатурою, як у застосунку */
  let prevScreen = null;
  document.addEventListener('screenchange', e => {
    const id = e.detail.id;
    if (id === 'search' && !['pdp', 'cart'].includes(prevScreen)) {
      input.value = '';
      submitted = null;
      render();
      setTimeout(() => input.focus({ preventScroll: true }), 50);
    }
    if (id !== 'search' && document.activeElement === input) input.blur();
    prevScreen = id;
  });

  render();
};
