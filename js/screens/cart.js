/* =====================================================================
   КОШИК. Дані: DATA.cart; товари й кількість — зі спільного Cart (js/app.js)
   Figma: node 5945:14591
   • Список позицій і суми перемальовуються при кожній зміні кошика (update).
   ===================================================================== */

Screens.cart = function renderCart(root) {
  const C = DATA.cart;

  root.innerHTML = `
    <div class="cart-top">
      <header class="cart-appbar">
        <button class="cart-back" type="button" data-back aria-label="Назад"><img class="icon-grey" src="assets/icons/arrow-back.svg" alt=""></button>
        <h1>${C.title}</h1>
        <button class="timeslot" type="button">
          <span class="timeslot__type">
            <img src="assets/icons/scooter-outline.svg" alt="">
            <img src="assets/icons/chevron-down.svg" alt="">
          </span>
          <span class="timeslot__divider"></span>
          <span class="timeslot__time">${C.timeslot.day}<br>${C.timeslot.time}</span>
        </button>
        <button class="cart-appbar__clear" type="button" data-cart-clear aria-label="Очистити кошик">
          <img src="assets/icons/trash.svg" alt="">
        </button>
      </header>
      <label class="express cart-express">
        <img class="express__icon" src="assets/icons/express.png" alt="">
        <span class="express__text">${C.express}</span>
        <input class="switch" type="checkbox" aria-label="Експрес-доставка">
      </label>
    </div>

    <div class="cart-body">
      <section class="cart-card cart-items">
        <h2 class="cart-card__title" data-cart-heading>${C.heading}</h2>
        <div class="cart-list"></div>
        <button class="cart-more" type="button" data-go="listing">${C.addMore}<img src="assets/icons/chevron-right.svg" alt=""></button>
      </section>

      <section class="cart-card cart-empty">
        <img src="assets/icons/tab-cart.svg" alt="">
        <h2>${C.empty.title}</h2>
        <p>${C.empty.text}</p>
        <button class="btn-primary" type="button" data-go="catalog">${C.empty.button}</button>
      </section>

      <div class="cart-details">
        <section class="cart-card">
          <h2 class="cart-card__title">${C.packaging.title}</h2>
          <div class="cart-pack">
            <img src="${C.packaging.image}" alt="">
            <p>${C.packaging.text}</p>
          </div>
          <button class="btn-outline" type="button">${C.packaging.button}<span aria-hidden="true">+</span></button>
        </section>

        <section class="cart-card cart-offers">
          <div class="cart-card__head">
            <h2 class="cart-card__title">${C.offers.title}</h2>
            <span class="cart-card__link">${C.offers.count}</span>
          </div>
          <div class="hscroll hscroll--bleed cart-offers__row" tabindex="0">
            ${C.offers.items.map(o => `
              <button class="offer" type="button" aria-pressed="${o.active ? 'true' : 'false'}" data-toggle>
                <span class="offer__chip"><img src="assets/icons/eco-vr.svg" alt="">${o.chip}</span>
                <span class="offer__text">${o.text}</span>
              </button>`).join('')}
          </div>
        </section>

        <section class="cart-card">
          <h2 class="cart-card__title">${C.promo.title}</h2>
          <p class="cart-card__hint">${C.promo.hint}</p>
          <button class="btn-outline" type="button">${C.promo.button}<span aria-hidden="true">+</span></button>
        </section>

        <section class="cart-card cart-summary">
          <h2 class="cart-card__title">${C.summary.title}</h2>
          <dl>
            <div><dt>${C.summary.goods}</dt><dd data-sum="goods"></dd></div>
            <div><dt>${C.summary.delivery}</dt><dd data-sum="delivery"></dd></div>
            <div class="cart-summary__discount"><dt>${C.summary.discount}</dt><dd data-sum="discount"></dd></div>
          </dl>
          <dl class="cart-summary__total">
            <div class="cart-summary__weight"><dt>${C.summary.weight}</dt><dd data-sum="weight"></dd></div>
            <div><dt>${C.summary.total}</dt><dd data-sum="payable"></dd></div>
          </dl>
        </section>
      </div>
    </div>

    <div class="cart-bottom">
      <p class="cart-progress__hint" data-delivery-hint></p>
      <div class="cart-progress" aria-hidden="true">
        <span class="cart-progress__track"><i data-progress="0"></i><img src="assets/icons/delivery-car.png" alt=""></span>
        <span class="cart-progress__label" data-tier-label="0"></span>
        <span class="cart-progress__track"><i data-progress="1"></i></span>
        <span class="cart-progress__label" data-tier-label="1"></span>
      </div>
      <button class="btn-primary cart-checkout" type="button" data-go="checkout">
        <span>${C.checkout}</span><strong data-sum="payable"></strong>
      </button>
    </div>`;
};

/** Перемальовує список і суми — викликається при кожній зміні кошика */
Screens.cart.update = function updateCart() {
  const root = document.getElementById('cart');
  if (!root || !root.firstElementChild) return;
  const C = DATA.cart;
  const count = Cart.count();
  const empty = count === 0;

  root.querySelector('.cart-items').hidden = empty;
  root.querySelector('.cart-details').hidden = empty;
  root.querySelector('.cart-bottom').hidden = empty;
  root.querySelector('.cart-empty').hidden = !empty;

  root.querySelector('[data-cart-heading]').textContent = `${C.heading}: ${count} ${plural(count)}`;

  // список позицій
  root.querySelector('.cart-list').innerHTML = [...Cart.items].map(([id, qty]) => {
    const p = DATA.products[id];
    return `
      <article class="cart-row">
        <img class="cart-row__img" src="${p.image}" alt="" data-go="pdp" data-param="${id}">
        <div class="cart-row__body">
          <div class="cart-row__top">
            <div class="cart-row__info">
              <p class="cart-row__name">${p.shortName || p.name}</p>
              <span class="cart-row__unit">${C.unit}</span>
            </div>
            <button class="cart-row__icon" type="button" aria-label="Коментар"><img src="assets/icons/comment.svg" alt=""></button>
            <button class="like-btn cart-row__icon" type="button" data-like aria-pressed="false" aria-label="Улюблене">
              <img class="like-btn__off" src="assets/icons/heart-red.svg" alt="">
              <img class="like-btn__on" src="assets/icons/heart-red-filled.svg" alt="">
            </button>
          </div>
          <div class="cart-row__bottom">
            <div class="cart-row__price">
              ${p.oldPrice ? `<span class="price-block__discount"><span class="price-old">${(p.oldPrice * qty).toFixed(2)}</span><span class="discount-tag discount-tag--orange">−${p.discount}%</span></span>` : ''}
              <strong>${UI.money(p.price * qty)}</strong>
            </div>
            <div class="cart-stepper">
              ${qty === 1
                ? `<button type="button" data-remove-all="${id}" aria-label="Видалити"><img src="assets/icons/trash-white.svg" alt=""></button>`
                : `<button type="button" data-remove="${id}" aria-label="Зменшити"><img src="assets/icons/minus-white.svg" alt=""></button>`}
              <output>${qty} ${C.unit}</output>
              <button type="button" data-add="${id}" aria-label="Збільшити"><img src="assets/icons/plus-white.svg" alt=""></button>
            </div>
          </div>
        </div>
      </article>`;
  }).join('');

  // суми
  const set = (key, text) => root.querySelectorAll(`[data-sum="${key}"]`).forEach(el => { el.textContent = text; });
  set('goods', UI.money(Cart.goodsTotal()));
  set('delivery', UI.money(Cart.deliveryPrice()));
  set('discount', '–' + UI.money(Cart.discountTotal()));
  set('weight', Cart.weightKg().toFixed(2) + ' кг');
  set('payable', UI.money(Cart.payable()));
  root.querySelector('.cart-summary__discount').hidden = Cart.discountTotal() <= 0;

  // прогрес до дешевшої доставки
  const d = C.delivery, total = Cart.total();
  const next = d.tiers.find(t => total < t.from);
  const hint = next
    ? d.hint.replace('{left}', UI.money(next.from - total)).replace('{price}', UI.money(next.price).replace('.00', ''))
    : d.done.replace('{price}', UI.money(Cart.deliveryPrice()).replace('.00', ''));
  root.querySelector('[data-delivery-hint]').textContent = hint;
  d.tiers.forEach((t, i) => {
    const from = i ? d.tiers[i - 1].from : 0;
    const part = Math.min(1, Math.max(0, (total - from) / (t.from - from)));
    const bar = root.querySelector(`[data-progress="${i}"]`);
    bar.style.width = (part * 100) + '%';
    bar.parentElement.style.setProperty('--p', part);
    root.querySelector(`[data-tier-label="${i}"]`).textContent = UI.money(t.price).replace('.00', '');
  });
};

/** 1 товар, 2 товари, 5 товарів */
function plural(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'товар';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'товари';
  return 'товарів';
}
