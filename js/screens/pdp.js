/* =====================================================================
   КАРТКА ТОВАРУ (PDP). Дані: DATA.pdp.products[<id>] + DATA.products[<id>]
   Figma: node 5945:14737
   • Товар задається в адресі: #pdp/banana (без неї — DATA.pdp.defaultProduct).
   • Блоки без даних (склад, 18+ тощо) просто не показуються.
   • Зверху стікі-навбар (Назад / Поділитись / Вподобати), знизу стікі-панель
     з ціною та «У кошик». Контент скролиться між ними.
   ===================================================================== */

Screens.pdp = function renderPdp(root, productId) {
  const D = DATA.pdp;
  const id = DATA.products[productId] ? productId : D.defaultProduct;
  const p = DATA.products[id];
  const info = D.products[id] || {};
  const T = D.titles;

  /** Ціна без копійок, якщо вони нульові: 18767 → «18 767 ₴» */
  const priceShort = v => UI.money(v).replace('.00', '');

  const rows = list => list.map(r => `
    <div class="pdp-row">
      <dt>${r.label}</dt>
      <dd>${r.value}${r.note ? `<span>${r.note}</span>` : ''}</dd>
    </div>`).join('');

  const accordion = (title, body) => `
    <details class="pdp-acc" open>
      <summary>${title}<img src="assets/icons/chevron-up.svg" alt=""></summary>
      ${body}
    </details>`;

  /** { kcal, protein, fat, carbs, sugar, satFat } → рядки таблиці */
  const nutritionRows = n => {
    const L = D.nutritionLabels;
    const note = (key) => n[key] ? `(${L[key]} ${n[key]})` : '';
    return [
      { label: L.kcal,    value: n.kcal + ' ккал' },
      { label: L.protein, value: n.protein },
      { label: L.fat,     value: n.fat,   note: note('satFat') },
      { label: L.carbs,   value: n.carbs, note: note('sugar') },
    ];
  };

  /** Схожі товари: з DATA.pdp.products[id].similar або з того ж лістингу */
  const similarItems = () => {
    if (info.similar) return info.similar;
    const page = Object.values(DATA.listing.pages).find(pg => pg.items.some(i => i.id === id));
    return page ? page.items.filter(i => i.id !== id).slice(0, 6) : [];
  };
  const similar = similarItems();

  const similarCard = item => {
    const s = DATA.products[item.id];
    const badges = (item.badges || []).map(b => DATA.badges[b]);
    return `
      <article class="sim-card" data-go="pdp" data-param="${item.id}">
        <div class="sim-card__media">
          <img class="sim-card__img" src="${s.image}" alt="${s.name}">
          ${badges.map(b => `<img class="sim-card__badge" src="${b.image}" alt="${b.alt}">`).join('')}
          ${UI.likeButton(item.liked)}
          ${UI.qtyControl(item.id)}
        </div>
        ${s.oldPrice ? `<div class="price-block__discount"><span class="price-old">${s.oldPrice.toFixed(2)}</span><span class="discount-tag discount-tag--yellow">−${s.discount}%</span></div>` : ''}
        <span class="price">${UI.money(s.price)}</span>
        <span class="weight">${s.weight}</span>
        <p class="sim-card__name">${s.name}</p>
        ${s.rating ? `<span class="sim-card__rating"><img src="assets/icons/star.svg" alt="">${s.rating}</span>` : ''}
      </article>`;
  };

  root.innerHTML = `
    <nav class="pdp-nav">
      <button class="pdp-nav__back" type="button" data-back aria-label="Назад"><img class="icon-grey" src="assets/icons/arrow-back.svg" alt=""></button>
      <span class="pdp-nav__spacer"></span>
      <button type="button" aria-label="Поділитись"><img src="assets/icons/share.svg" alt=""></button>
      <button class="like-btn pdp-nav__like" type="button" data-like aria-pressed="false" aria-label="Вподобати">
        <img class="like-btn__off" src="assets/icons/heart-red.svg" alt="">
        <img class="like-btn__on" src="assets/icons/heart-red-filled.svg" alt="">
      </button>
    </nav>

    <div class="pdp-gallery">
      <img src="${p.image}" alt="${p.name}">
      <span class="pdp-gallery__dots" aria-hidden="true">
        ${Array.from({ length: D.gallery }, (_, i) => `<i class="${i === 0 ? 'is-active' : ''}"></i>`).join('')}
      </span>
    </div>

    <header class="pdp-head">
      <h1 class="pdp-title">${p.name}</h1>
      <span class="pdp-stock">${D.stock}</span>
    </header>

    ${info.description ? accordion(T.description, `<div class="pdp-text"><p>${info.description}</p></div>`) : ''}
    ${info.composition ? accordion(T.composition, `
      <div class="pdp-text">
        <p>${info.composition.text}</p>
        ${info.composition.allergens ? `<p><b>${info.composition.allergens.label}</b> ${info.composition.allergens.value}</p>` : ''}
      </div>`) : ''}
    ${info.details ? accordion(T.details, `<dl class="pdp-rows">${rows(info.details)}</dl>`) : ''}
    ${info.nutrition ? accordion(T.nutrition, `<dl class="pdp-rows">${rows(nutritionRows(info.nutrition))}</dl>`) : ''}

    ${info.warning ? `
    <aside class="pdp-warning">
      <span class="pdp-warning__badge">${info.warning.badge}</span>
      <p>${info.warning.text}</p>
    </aside>` : ''}

    ${similar.length ? `
    <section class="pdp-similar">
      <div class="pdp-similar__head">
        <h2>${T.similar}</h2>
        <button type="button" data-go="listing">${D.more}</button>
      </div>
      <div class="hscroll hscroll--bleed pdp-similar__row" tabindex="0" aria-label="${T.similar}">
        ${similar.map(similarCard).join('')}
      </div>
    </section>` : ''}

    <div class="pdp-bottom">
      <!-- плашка кошика над панеллю (Figma 861:4027); видно, коли в кошику щось є -->
      <button class="cart-pill pdp-cart" type="button" data-go="cart" data-cart-visible hidden aria-label="Перейти до кошика">
        <span class="cart-pill__icon">
          <img src="assets/icons/cart-pill.svg" alt="">
          <span class="cart-pill__count" data-cart-count></span>
        </span>
        <span data-cart-total></span>
      </button>
      <div class="pdp-bottom__price">
        <strong>${priceShort(p.price)}</strong>
        <span>${p.weight}</span>
      </div>
      <!-- «У кошик» → степер «− N шт +», щойно товар у кошику (Cart.render) -->
      <div class="qty pdp-bottom__cta" data-qty="${id}">
        <button class="qty__add pdp-bottom__add" type="button" data-add="${id}">
          <img src="assets/icons/cart-plus.svg" alt="">${D.addToCart}
        </button>
        <div class="qty__stepper pdp-stepper" role="group" aria-label="Кількість">
          <button type="button" data-remove="${id}" aria-label="Зменшити"><img src="assets/icons/minus-white.svg" alt=""></button>
          <output aria-live="polite">0 шт</output>
          <button type="button" data-add="${id}" aria-label="Збільшити"><img src="assets/icons/plus-white.svg" alt=""></button>
        </div>
      </div>
    </div>`;
};
