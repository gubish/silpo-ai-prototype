/* =====================================================================
   ПОДЯКА. Дані: DATA.thankyou; сума — зі спільного Cart (js/app.js)
   Figma: node 5945:14543
   ===================================================================== */

Screens.thankyou = function renderThankyou(root) {
  const T = DATA.thankyou;

  root.innerHTML = `
    <div class="ty-hero"><img src="${T.image}" alt=""></div>
    <section class="ty-sheet">
      <h1 class="ty-title">${T.title}</h1>
      <dl class="ty-rows">
        ${T.rows.map(r => `
          <div class="ty-row">
            <span class="ty-row__icon"><img src="${r.icon}" alt=""></span>
            <div>
              <dt>${r.label}</dt>
              <dd ${r.value === '{total}' ? 'data-ty-total' : ''}>${r.value}</dd>
              ${r.note ? `<p class="ty-row__note">${r.note}</p>` : ''}
            </div>
          </div>`).join('')}
      </dl>
      <div class="ty-actions">
        <button class="btn-primary" type="button" data-go="home"><img src="assets/icons/basket-white.svg" alt="">${T.primary}</button>
        <button class="ty-ghost" type="button" data-go="home">${T.secondary}</button>
      </div>
    </section>`;
};

Screens.thankyou.update = function updateThankyou() {
  const el = document.querySelector('#thankyou [data-ty-total]');
  if (el) el.textContent = UI.money(Cart.payable());
};
