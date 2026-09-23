/* =====================================================================
   UI — дрібні HTML-компоненти, з яких складаються екрани.
   Тексти сюди НЕ пишемо — вони в js/data.js.
   ===================================================================== */

/** Реєстр екранів: кожен файл js/screens/*.js додає сюди функцію рендеру */
window.Screens = {};

const UI = {
  /** 7658.92 → «7 658.92 ₴» (формат як у Figma) */
  money(value) {
    const [int, dec] = Number(value).toFixed(2).split('.');
    return int.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0') + '.' + dec + ' ₴';
  },

  /** Заголовок секції: іконка + назва + підзаголовок + кнопка «›» */
  sectionHead({ title, subtitle, icon, go }) {
    return `
      <div class="section-head">
        ${icon ? `<img class="section-head__icon" src="${icon}" alt="">` : ''}
        <div class="section-head__text">
          <h2 class="section-head__title">${title}</h2>
          ${subtitle ? `<p class="section-head__subtitle">${subtitle}</p>` : ''}
        </div>
        <button class="more-btn" type="button" aria-label="Дивитись всі: ${title}" ${go ? `data-go="${go}"` : ''}>
          <img src="assets/icons/chevron-right.svg" alt="">
        </button>
      </div>`;
  },

  /** Блок ціни: стара ціна + тег знижки, ціна, вага (або бонус замість знижки) */
  priceBlock(p) {
    const discount = p.oldPrice
      ? `<div class="price-block__discount">
           <span class="price-old">${p.oldPrice.toFixed(2)}</span>
           <span class="discount-tag">−${p.discount}%</span>
         </div>`
      : '';
    const bonus = p.bonus
      ? `<span class="bonus-chip">${p.bonus}<img src="assets/icons/vr-coin.svg" alt="балів"></span>`
      : '';
    return `
      <div class="price-block">
        ${discount}${bonus}
        <span class="price">${UI.money(p.price)}</span>
        <span class="weight">${p.weight}</span>
      </div>`;
  },

  /** «+» у білій рамці, після додавання — синій степер «− N шт +» */
  qtyControl(id) {
    return `
      <div class="qty" data-qty="${id}">
        <button class="qty__add" type="button" data-add="${id}" aria-label="Додати в кошик">
          <img src="assets/icons/plus.svg" alt="">
        </button>
        <div class="qty__stepper" role="group" aria-label="Кількість">
          <button type="button" data-remove="${id}" aria-label="Зменшити">−</button>
          <output aria-live="polite">0 шт</output>
          <button type="button" data-add="${id}" aria-label="Збільшити">+</button>
        </div>
      </div>`;
  },

  likeButton(liked) {
    return `
      <button class="like-btn" type="button" data-like aria-pressed="${liked ? 'true' : 'false'}" aria-label="Улюблене">
        <img class="like-btn__off" src="assets/icons/heart.svg" alt="">
        <img class="like-btn__on" src="assets/icons/heart-filled.svg" alt="">
      </button>`;
  },

  /** Маленька картка товару (96px) для каруселей головної */
  productCard(item) {
    const p = DATA.products[item.id];
    const badge = item.badge && DATA.badges[item.badge];
    return `
      <article class="product-card" data-go="pdp" data-param="${item.id}">
        <div class="product-card__media">
          <img class="product-card__img" src="${p.image}" alt="${p.name}">
          ${badge ? `<img class="product-card__badge" src="${badge.image}" alt="${badge.alt}">` : ''}
          ${UI.likeButton(item.liked)}
          ${UI.qtyControl(item.id)}
        </div>
        <div class="product-card__content">
          ${UI.priceBlock(p)}
          <p class="product-card__name">${p.name}</p>
        </div>
      </article>`;
  },

  /** Картка товару з лістингу (PLP). Використовується в лістингу й у чаті ШІ.
      data-name / data-sale / data-tag — для фільтрів лістингу. */
  plpCard(item) {
    const p = DATA.products[item.id];
    const badges = (item.badges || []).map(b => DATA.badges[b]);
    return `
      <article class="plp-card" data-go="pdp" data-param="${item.id}"
               data-name="${p.name.toLocaleLowerCase('uk-UA')}" data-sale="${p.oldPrice ? 'true' : 'false'}" data-tag="${item.tag || p.tag || ''}">
        <div class="plp-card__media">
          <img class="plp-card__img" src="${p.image}" alt="${p.name}">
          <div class="plp-card__badges">${badges.map(b => `<img src="${b.image}" alt="${b.alt}">`).join('')}</div>
          ${UI.likeButton(item.liked)}
          ${UI.qtyControl(item.id)}
        </div>
        <div class="plp-card__content">
          ${UI.priceBlock(p)}
          <p class="plp-card__name">${p.name}</p>
        </div>
      </article>`;
  },

  /** Нижній таб-бар (DATA.tabbar). active — id пункту, що підсвічений синім */
  tabbar(active) {
    return `
      <nav class="tabbar" aria-label="Головне меню">
        ${DATA.tabbar.map(t => `
          <button class="tabbar__item ${t.id === active ? 'is-active' : ''}" type="button" ${t.go ? `data-go="${t.go}"` : ''}>
            <img class="tabbar__icon" src="${t.id === active && t.iconActive ? t.iconActive : t.icon}" alt="">
            <span class="tabbar__label" ${t.id === 'cart' ? 'data-cart-label' : ''}>${t.label}</span>
            ${t.id === 'cart' ? '<span class="tabbar__count" data-cart-count hidden></span>' : ''}
          </button>`).join('')}
      </nav>`;
  },

  /** Біла секція з каруселлю товарів */
  productSection(section, extraClass = '') {
    return `
      <section class="card-section ${extraClass}">
        ${UI.sectionHead(section)}
        <div class="hscroll hscroll--bleed product-row" tabindex="0" aria-label="${section.title}">
          ${section.items.map(UI.productCard).join('')}
        </div>
      </section>`;
  },
};
