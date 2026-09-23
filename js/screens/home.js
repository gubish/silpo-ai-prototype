/* =====================================================================
   ГОЛОВНА — розмітка екрана. Тексти/картинки беруться з DATA.home.
   Порядок блоків = порядок у Figma (node 5945:12041).
   ===================================================================== */

Screens.home = function renderHome(root) {
  const H = DATA.home;

  const deliveryBar = `
    <div class="home-delivery">
      <img class="home-delivery__icon" src="assets/icons/delivery-scooter.svg" alt="">
      <button class="home-delivery__info" type="button">
        <span class="home-delivery__line">
          <span class="home-delivery__type">${H.delivery.type}</span>
          <span class="home-delivery__dot" aria-hidden="true"></span>
          <span class="home-delivery__slot">${H.delivery.slot}</span>
        </span>
        <span class="home-delivery__address">${H.delivery.address}</span>
      </button>
      <button class="bonus-widget" type="button" aria-label="Бонуси Власний Рахунок">
        <span>${H.delivery.bonus}</span>
        <img src="assets/icons/vr-coin.svg" alt="">
      </button>
      <button class="avatar" type="button" aria-label="Профіль">
        <img src="assets/icons/profile.svg" alt="">
        ${H.delivery.notifications ? `<span class="avatar__badge">${H.delivery.notifications}</span>` : ''}
      </button>
    </div>`;

  const ecosystem = `
    <section class="home-eco">
      <div class="home-eco__services">
        ${H.ecosystem.map(s => `
          <button class="eco-service" type="button">
            <img class="eco-service__icon" src="${s.icon}" alt="">
            <span class="eco-service__label">${s.label}</span>
            ${s.badge ? `<span class="eco-service__badge">${s.badge}</span>` : ''}
          </button>`).join('')}
      </div>
      <button class="promo-510" type="button">
        <span class="promo-510__ticket">
          <span class="promo-510__text">
            <strong>${H.promo.title}</strong>
            <span>${H.promo.subtitle}</span>
          </span>
          <span class="promo-510__sticker">${H.promo.sticker}</span>
          <span class="promo-510__divider" aria-hidden="true"></span>
          <img class="promo-510__art" src="${H.promo.image}" alt="">
        </span>
        <span class="promo-510__footer">${H.promo.footer}</span>
      </button>
    </section>`;

  const search = `
    <div class="home-search">
      <button class="search-bar" type="button" data-go="search">
        <img src="assets/icons/search.svg" alt="">
        <span>${H.searchPlaceholder}</span>
      </button>
      <button class="round-btn" type="button" aria-label="Сканувати штрихкод">
        <img src="assets/icons/barcode.svg" alt="">
      </button>
    </div>`;

  const services = `
    <section class="home-services">
      <div class="home-services__row">
        ${H.services.map(s => `
          <button class="service-tile" type="button" data-go="catalog">
            <span class="service-tile__art">
              <img src="${s.image}" alt="">
              ${s.badge ? `<span class="service-tile__badge">${s.badge}</span>` : ''}
            </span>
            <span class="service-tile__title">${s.title}</span>
          </button>`).join('')}
      </div>
      <div class="home-services__row">
        ${H.quickServices.map(s => `
          <button class="quick-tile" type="button" data-go="catalog">
            <span class="quick-tile__title">${s.title}</span>
            <img class="quick-tile__art" src="${s.image}" alt="" style="--size:${s.size}px">
          </button>`).join('')}
      </div>
    </section>`;

  const C = H.categories;
  const categories = `
    <section class="home-block home-categories">
      ${UI.sectionHead({ title: C.title, go: 'catalog' })}
      <div class="hscroll hscroll--bleed category-row" tabindex="0" aria-label="${C.title}">
        <button class="category-tile category-tile--promo" type="button" data-go="catalog">
          <img src="${C.promo.image}" alt="">
          <span>${C.promo.label}</span>
        </button>
        ${C.items.map(c => `
          <button class="category-tile" type="button" data-go="catalog">
            <span class="category-tile__icon"><img src="${c.icon}" alt=""></span>
            <span>${c.label}</span>
          </button>`).join('')}
        <button class="category-tile category-tile--more" type="button" data-go="catalog">
          <span class="category-tile__icon"><img src="assets/icons/more.svg" alt=""></span>
          <span>${C.more}</span>
        </button>
      </div>
    </section>`;

  const D = H.dealOfDay, dp = DATA.products[D.product];
  const deal = `
    <section class="home-block home-deal">
      <div class="home-deal__head">
        <h2 class="home-deal__title">${D.title}</h2>
        <span class="home-deal__date">${D.date}</span>
      </div>
      <article class="deal-card" data-go="pdp" data-param="${D.product}">
        <div class="deal-card__info">
          <p class="deal-card__name">${dp.name}</p>
          ${UI.priceBlock(dp)}
        </div>
        <div class="deal-card__media">
          <img src="${dp.image}" alt="${dp.name}">
          ${UI.qtyControl(D.product)}
        </div>
      </article>
    </section>`;

  const B = H.banner;
  const banner = `
    <section class="home-banner">
      <img src="${B.image}" alt="${B.alt}">
      <span class="home-banner__dots" aria-hidden="true">
        ${Array.from({ length: B.slides }, (_, i) => `<i class="${i === 0 ? 'is-active' : ''}"></i>`).join('')}
      </span>
    </section>`;

  const O = H.myOffers;
  const myOffers = `
    <section class="card-section my-offers">
      ${UI.sectionHead(O)}
      <div class="hscroll hscroll--bleed coupon-row" tabindex="0" aria-label="${O.title}">
        ${O.coupons.map(c => `
          <article class="coupon ${c.dark ? 'coupon--dark' : ''}" style="--coupon-bg:${c.bg}">
            <img class="coupon__photo" src="${c.image}" alt="">
            <div class="coupon__percent"><span>${c.percent}</span></div>
            <div class="coupon__body">
              <p class="coupon__caption">${c.caption}</p>
              <p class="coupon__title">${c.title}</p>
            </div>
            <div class="coupon__expires"><span>${c.expires}</span></div>
          </article>`).join('')}
      </div>
    </section>`;

  const G = H.games;
  const games = `
    <section class="home-games">
      <div class="home-games__text">
        <h2 class="section-head__title">${G.title}</h2>
        <p class="section-head__subtitle">${G.subtitle}</p>
      </div>
      <div class="hscroll home-games__row" tabindex="0" aria-label="${G.title}">
        ${G.items.map(g => `<button class="game-tile" type="button"><img src="${g.image}" alt="${g.alt}"></button>`).join('')}
      </div>
    </section>`;

  const L = H.lastOrder;
  const lastOrder = `
    <section class="home-last-order">
      <h2 class="home-last-order__title"><span class="home-last-order__emoji">${L.emoji}</span> <span class="home-last-order__gradient">${L.title}</span></h2>
      <div class="last-order">
        <p class="last-order__meta">
          <span>${L.type}</span><i></i><span>${L.date}</span><i></i><span class="last-order__address">${L.address}</span>
        </p>
        <hr class="last-order__divider">
        <button class="last-order__action" type="button" data-go="cart">
          <img src="assets/icons/cart-white.svg" alt="">
          <span class="last-order__text"><b>${L.total}</b><b>${L.action}</b></span>
          <span class="last-order__thumbs">${L.thumbs.map(t => `<img src="${t}" alt="">`).join('')}</span>
        </button>
      </div>
    </section>`;

  const tabbar = UI.tabbar('home');

  root.innerHTML = `
    <div class="home">
      ${deliveryBar}
      ${ecosystem}
      ${search}
      ${services}
      ${categories}
      ${deal}
      <div class="home-stack">
        ${UI.productSection({ ...H.cinotyzhyky, go: 'listing' })}
        ${UI.productSection({ ...H.onlineOnly, go: 'listing' })}
      </div>
      ${banner}
      <div class="home-stack">
        ${UI.productSection({ ...H.reorder, go: 'listing' })}
        ${myOffers}
        ${UI.productSection({ ...H.buyBetter, go: 'listing' })}
      </div>
      ${games}
      ${lastOrder}
      <div class="home-stack home-stack--last">
        ${UI.productSection({ ...H.favorites, go: 'listing' })}
      </div>
    </div>
    ${tabbar}`;
};
