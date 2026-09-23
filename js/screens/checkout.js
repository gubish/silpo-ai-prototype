/* =====================================================================
   ЧЕКАУТ. Дані: DATA.checkout; сума — зі спільного Cart (js/app.js)
   Figma: node 5945:14277
   ===================================================================== */

Screens.checkout = function renderCheckout(root) {
  const K = DATA.checkout;
  const pressed = v => `aria-pressed="${v ? 'true' : 'false'}"`;

  root.innerHTML = `
    <header class="co-appbar">
      <button type="button" data-back aria-label="Назад до кошика"><img src="assets/icons/arrow-back.svg" alt=""></button>
      <h1>${K.title}</h1>
    </header>

    <div class="co-body">
      <section class="co-card">
        <h2 class="co-card__title">${K.methodsTitle}</h2>
        <div class="hscroll hscroll--bleed co-methods" tabindex="0">
          ${K.methods.map(m => `
            <button class="co-method" type="button" data-choice="method" ${pressed(m.selected)}>
              <span class="co-method__title">${m.title}${m.badge ? `<em class="badge-new">${m.badge}</em>` : ''}</span>
              <span class="co-method__text">${m.text}</span>
              <span class="co-method__price">${m.price}</span>
              <img src="${m.image}" alt="">
            </button>`).join('')}
        </div>
        <div class="co-days" role="tablist">
          ${K.days.map(d => `<button class="co-day" type="button" role="tab" data-choice="day" ${pressed(d.selected)}>${d.label}</button>`).join('')}
        </div>
        <div class="hscroll hscroll--bleed co-slots" tabindex="0">
          ${K.slots.map(s => `<button class="co-chip" type="button" data-choice="slot" ${pressed(s.selected)}>${s.label}</button>`).join('')}
        </div>
      </section>

      <section class="co-card">
        <div class="co-card__head">
          <h2 class="co-card__title">${K.addressTitle}</h2>
          <button class="timeslot" type="button">
            <span class="timeslot__type">
              <img src="assets/icons/scooter-outline.svg" alt="">
              <img src="assets/icons/chevron-down.svg" alt="">
            </span>
            <span class="timeslot__divider"></span>
            <span class="timeslot__time">${K.timeslot.day}<br>${K.timeslot.time}</span>
          </button>
        </div>
        <div class="co-address">
          <img src="assets/icons/pin.svg" alt="">
          <p>${K.address}</p>
          <button type="button" aria-label="Змінити адресу"><img src="assets/icons/edit.svg" alt=""></button>
        </div>
        <div class="hscroll hscroll--bleed co-types" tabindex="0">
          ${K.addressTypes.map(t => `<button class="co-chip co-chip--lg" type="button" data-choice="addrtype" ${pressed(t.selected)}><span aria-hidden="true">${t.icon}</span>${t.label}</button>`).join('')}
        </div>
        <div class="co-fields">
          ${K.fields.map(f => `<label class="field"><span>${f.label}</span><input type="text" value="${f.value}"></label>`).join('')}
        </div>
        <label class="field field--wide"><textarea rows="1" placeholder="${K.courierComment}"></textarea></label>
      </section>

      <section class="co-card">
        <div class="co-card__head">
          <h2 class="co-card__title">${K.contactTitle}</h2>
          <img src="assets/icons/info-outline.svg" alt="" class="co-icon">
        </div>
        <div class="co-box co-contact">
          <img src="assets/icons/user.svg" alt="">
          <div><strong>${K.contact.name}</strong><span>${K.contact.phone}</span></div>
          <button type="button" aria-label="Змінити контакт"><img src="assets/icons/edit.svg" alt=""></button>
        </div>
        <button class="co-box co-replace" type="button">
          <img src="assets/icons/sync.svg" alt="">
          <div><strong>${K.replacement.title}</strong><span>${K.replacement.text}<em class="badge-new">${K.replacement.badge}</em></span></div>
          <img src="assets/icons/chevron-right.svg" alt="">
        </button>
        <label class="field field--wide"><textarea rows="1" placeholder="${K.pickerComment}"></textarea></label>
      </section>

      <section class="co-card">
        <h2 class="co-card__title">${K.certificate.title}</h2>
        <p class="co-card__hint">${K.certificate.hint}</p>
        <button class="btn-outline" type="button">${K.certificate.button}<span aria-hidden="true">+</span></button>
      </section>

      <p class="co-note"><img src="assets/icons/info-outline.svg" alt="">${K.weightNote}</p>

      <details class="co-card co-total">
        <summary><span>${K.totalLabel}</span><strong data-co="payable"></strong><img src="assets/icons/chevron-down.svg" alt=""></summary>
        <dl>
          <div><dt>${DATA.cart.summary.goods}</dt><dd data-co="goods"></dd></div>
          <div><dt>${DATA.cart.summary.delivery}</dt><dd data-co="delivery"></dd></div>
          <div><dt>${DATA.cart.summary.discount}</dt><dd data-co="discount"></dd></div>
        </dl>
      </details>

      <p class="co-legal">${K.legal}</p>
      <label class="co-check">
        <input type="checkbox" checked>
        <span>${K.ageConfirm}</span>
      </label>
    </div>

    <div class="co-bottom">
      <div class="co-pay">
        <img src="assets/icons/apple-pay-card.svg" alt="">
        <div><strong>${K.payment.method}</strong><button type="button">${K.payment.change}</button></div>
        <span data-co="payable"></span>
      </div>
      <button class="co-applepay" type="button" data-go="thankyou">
        <img src="assets/icons/apple-logo-white.svg" alt="">${K.payment.button}
      </button>
    </div>`;

  // кнопка оплати активна лише з підтвердженням 18+ (якщо в кошику є такі товари)
  root.querySelector('.co-check input').addEventListener('change', Screens.checkout.update);

  // поля коментарів ростуть разом із текстом
  root.querySelectorAll('textarea').forEach(t => t.addEventListener('input', () => {
    t.style.height = 'auto';
    t.style.height = t.scrollHeight + 'px';
  }));
};

/** Суми беремо з кошика */
Screens.checkout.update = function updateCheckout() {
  const root = document.getElementById('checkout');
  if (!root || !root.firstElementChild) return;
  const set = (key, text) => root.querySelectorAll(`[data-co="${key}"]`).forEach(el => { el.textContent = text; });
  set('payable', UI.money(Cart.payable()));
  set('goods', UI.money(Cart.goodsTotal()));
  set('delivery', UI.money(Cart.deliveryPrice()));
  set('discount', '–' + UI.money(Cart.discountTotal()));

  // галочка 18+ — лише коли в кошику є товар із DATA.pdp.products[id].warning
  const adult = [...Cart.items.keys()].some(id => DATA.pdp.products[id]?.warning);
  const check = root.querySelector('.co-check');
  check.hidden = !adult;
  root.querySelector('.co-applepay').disabled = adult && !check.querySelector('input').checked;
};
