/* =====================================================================
   КАТАЛОГ — розмітка екрана. Тексти/картинки беруться з DATA.catalog.
   Figma: node 5945:14370
   ===================================================================== */

Screens.catalog = function renderCatalog(root) {
  const C = DATA.catalog;

  /** Назва плитки: кожен рядок (через \n) — окрема біла плашка */
  const tileLabel = text => text.split('\n').map(line => `<span>${line}</span>`).join('');

  const tile = t => `
    <button class="cat-tile" type="button" data-go="${t.go || 'listing'}" data-param="${t.category || DATA.listing.defaultPage}">
      <span class="cat-tile__label">${tileLabel(t.label)}</span>
      <img class="cat-tile__img" src="${t.image}" alt="">
    </button>`;

  const section = s => `
    <section class="cat-section" id="cat-${s.id}" style="--tile-bg:${s.color}">
      ${UI.sectionHead({ title: s.title, go: 'listing' })}
      <div class="cat-grid">${s.tiles.map(tile).join('')}</div>
    </section>`;

  const [first, ...rest] = C.sections;

  root.innerHTML = `
    <header class="cat-appbar">
      <button class="cat-appbar__back" type="button" data-go="home" aria-label="Назад">
        <img src="assets/icons/arrow-back.svg" alt="">
      </button>
      <img class="cat-appbar__logo" src="assets/icons/silpo-logo.svg" alt="Сільпо">
    </header>

    <div class="cat-delivery">
      <div class="cat-delivery__row">
        <div class="cat-delivery__address">
          <strong>${C.address}</strong>
          <span>${C.city}</span>
        </div>
        <button class="timeslot" type="button">
          <span class="timeslot__type">
            <img src="assets/icons/scooter-outline.svg" alt="">
            <img src="assets/icons/chevron-down.svg" alt="">
          </span>
          <span class="timeslot__divider"></span>
          <span class="timeslot__time">${C.timeslot.day}<br>${C.timeslot.time}</span>
        </button>
      </div>
      <label class="express">
        <img class="express__icon" src="assets/icons/express.png" alt="">
        <span class="express__text">${C.express}</span>
        <input class="switch" type="checkbox" aria-label="Експрес-доставка">
      </label>
    </div>

    <div class="cat-sheets">
      <div class="cat-sheet">
        <div class="cat-top">
          <button class="search-bar" type="button" data-go="search">
            <img src="assets/icons/search.svg" alt="">
            <span>${C.searchPlaceholder}</span>
          </button>
          <button class="cat-promo" type="button" data-go="listing">
            <span class="cat-promo__title">${C.promo.title}</span>
            <img class="cat-promo__badges" src="${C.promo.badges}" alt="">
            <img class="cat-promo__arrow" src="assets/icons/arrow-right-small.svg" alt="">
          </button>
        </div>
        <div class="hscroll cat-chips" tabindex="0" aria-label="Добірки">
          ${C.chips.map(c => `<button class="choice-chip" type="button" aria-pressed="false" data-toggle>${c}</button>`).join('')}
        </div>
        ${section(first)}
      </div>
      ${rest.map(s => `<div class="cat-sheet">${section(s)}</div>`).join('')}
    </div>

    <nav class="cat-bottom" aria-label="Категорії">
      <span class="cat-bottom__grabber" aria-hidden="true"></span>
      <div class="hscroll cat-bottom__row" tabindex="0">
        <button class="cat-bottom__search" type="button" data-go="search" aria-label="Пошук"><img src="assets/icons/search.svg" alt=""></button>
        ${C.bottomCategories.map((c, i) => `
          <button class="cat-pill ${i === 0 ? 'is-active' : ''}" type="button" ${c.section ? `data-scroll-to="cat-${c.section}"` : 'data-go="listing"'}>
            <img class="cat-pill__icon" src="${c.icon}" alt="">
            ${c.label}
          </button>`).join('')}
      </div>
      <p class="cat-bottom__hint">
        <img src="assets/icons/delivery-car.png" alt="">
        <span>${C.deliveryHint}</span>
        <img src="assets/icons/info.png" alt="">
      </p>
    </nav>`;
};
