/* =====================================================================
   ЛІСТИНГ (PLP). Дані: DATA.listing.pages[<сторінка>] + DATA.products
   Figma: node 5945:14519
   • Сторінка задається в адресі: #listing/fruits (без неї — DATA.listing.defaultPage).
   • Стікі лише верхній хедер; чипси-таби скролляться разом із товарами.
   ===================================================================== */

Screens.listing = function renderListing(root, pageId) {
  const L = DATA.listing;
  const page = L.pages[pageId] || L.pages[L.defaultPage];

  const card = UI.plpCard;

  root.innerHTML = `
    <header class="plp-appbar">
      <button class="plp-appbar__back" type="button" data-go="${page.back || 'catalog'}" aria-label="Назад до каталогу">
        <img src="assets/icons/arrow-back.svg" alt="">
      </button>
      <h1 class="plp-appbar__title">${page.title}</h1>
      <button class="plp-appbar__sort" type="button" aria-label="Сортування">
        <img src="assets/icons/sort.svg" alt="">
      </button>
    </header>

    <div class="hscroll plp-tabs" tabindex="0" role="tablist" aria-label="Підкатегорії">
      ${page.tabs.map((t, i) => `<button class="plp-tab ${i === 0 ? 'is-active' : ''}" type="button" role="tab" data-tab="${i === 0 ? '' : t}">${t}</button>`).join('')}
    </div>

    <div class="plp-grid">${page.items.map(card).join('')}</div>
    <p class="plp-empty" hidden>${L.empty}</p>

    <div class="plp-bottom">
      <div class="plp-bottom__search">
        <button class="plp-icon-btn" type="button" data-go="catalog" aria-label="Меню каталогу">
          <img src="assets/icons/burger.svg" alt="">
        </button>
        <label class="search-bar plp-search">
          <img src="assets/icons/search.svg" alt="">
          <input type="search" placeholder="${L.searchPlaceholder}" aria-label="Пошук товарів">
        </label>
        <button class="plp-icon-btn plp-filter-btn" type="button" aria-label="Фільтри" aria-expanded="false">
          <img src="assets/icons/filter.svg" alt="">
        </button>
      </div>
      <label class="plp-filter" hidden>
        <input class="switch" type="checkbox"> ${L.saleOnlyLabel}
      </label>
      <button class="basket-btn" type="button" data-go="cart" data-cart-visible hidden>
        <span class="basket-btn__main">
          <span class="basket-btn__icon">
            <img src="assets/icons/cart-white-outline.svg" alt="">
            <span class="basket-btn__count" data-cart-count hidden></span>
          </span>
          <span class="basket-btn__label">${L.basket.label}</span>
          <span class="basket-btn__total" data-cart-total></span>
        </span>
        <span class="basket-btn__delivery">${L.basket.delivery}</span>
      </button>
    </div>`;

  /* ---------- Фільтрація: таб + пошук + «лише акційні» ---------- */
  const input = root.querySelector('.plp-search input');
  const saleOnly = root.querySelector('.plp-filter input');
  const filterPanel = root.querySelector('.plp-filter');
  const filterBtn = root.querySelector('.plp-filter-btn');
  let tab = '';

  function applyFilter() {
    const q = input.value.trim().toLocaleLowerCase('uk-UA');
    let visible = 0;
    root.querySelectorAll('.plp-card').forEach(c => {
      const show = c.dataset.name.includes(q)
        && (!saleOnly.checked || c.dataset.sale === 'true')
        && (!tab || c.dataset.tag === tab);
      c.hidden = !show;
      if (show) visible++;
    });
    root.querySelector('.plp-empty').hidden = visible > 0;
  }

  input.addEventListener('input', applyFilter);
  saleOnly.addEventListener('change', applyFilter);
  filterBtn.addEventListener('click', () => {
    filterPanel.hidden = !filterPanel.hidden;
    filterBtn.setAttribute('aria-expanded', String(!filterPanel.hidden));
  });
  root.querySelectorAll('.plp-tab').forEach(btn => btn.addEventListener('click', () => {
    root.querySelectorAll('.plp-tab').forEach(b => b.classList.toggle('is-active', b === btn));
    tab = btn.dataset.tab;
    applyFilter();
  }));
};
