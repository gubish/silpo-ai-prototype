/* =====================================================================
   ГІЛКА B — «Помічник може допомогти»: жовтий брендований чип = дія через Машрума.
   Сталий патерн для всього продукту (пошук, лістинг, картка товару, кошик…):
   блок із назвою «Помічник може допомогти» і аватаром (один раз) + жовті чипи мовою
   наміру гостя («Хочу солодкі яблука»), а не назвами AI-функцій.
   Тап по чипу — чат МГ; вибраний намір стає першою реплікою розмови,
   а МГ його уточнює або одразу підбирає товари.
   Звичайні фільтри, навігація й стандартні дії цього стилю НЕ використовують.

   Намір (intent):
     { label, answer, items?, next?, countForms? } — власний сценарій;
     { label, opener: 'З чим поєднати' | [...] }   — готовий стартовий тег чату
                                                    для поточного екрана (DATA.aiChat.screens);
     { label, ask: true }                          — своє питання гостя (з пошуку) — як повідомлення в чаті.
   Розмітка:  MG.block(intents, { row: true }) — row: чипи в рядок зі скролом (екрани),
              без row — з переносом (пошук). Стилі — css/branches/b-mg.css.
   ===================================================================== */

const MG = {
  blocks: {},   // намір за номером блоку й чипа (розмітку перемальовують — номери свіжі)
  seq: 0,

  block(intents, { row = false, title = DATA.mg.title } = {}) {
    if (!intents || !intents.length) return '';
    const id = ++this.seq;
    this.blocks[id] = intents;
    return `
      <section class="mg-block ${row ? 'mg-block--row' : ''}" aria-label="${title}">
        <div class="mg-block__head">
          <img class="mg-block__avatar" src="${DATA.aiChat.avatar}" alt="">
          <span>${title}</span>
        </div>
        <div class="mg-chips ${row ? 'hscroll' : ''}">
          ${intents.map((t, i) => `<button class="mg-chip" type="button" data-mg="${id}:${i}">${t.label}</button>`).join('')}
        </div>
      </section>`;
  },

  /** Відкрити чат МГ із наміром */
  start(t) {
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // ховає клавіатуру
    if (Keyboard.el.classList.contains('is-open') && Keyboard.input) Keyboard.input.dispatchEvent(new Event('blur'));
    const chat = AiChat;
    // з пошуку — під чатом одразу екран, з якого пошук викликали:
    // закрили чат — повернулись туди, а не в пошук
    if (App.current && App.current.id === 'search') App.back();
    chat.open({ greet: false });
    chat.greetedOn = chat.contextKey(); // уже в розмові — вітатися не треба
    // розмова ще не почалась — без привітання, одразу з наміру гостя
    if (!chat.thread.some(m => m.from === 'user')) { chat.thread = []; chat.anchor = null; }
    if (t.ask) return chat.ask(t.label); // своє питання гостя — МГ відповідає як на повідомлення в чаті
    let o = t;
    if (t.opener) { // готовий сценарій чату для цього екрана
      const all = chat.screenOpeners();
      const found = [].concat(t.opener).map(l => all.find(x => x.label === l)).find(Boolean);
      if (found) o = { ...found, label: t.label };
    }
    chat.runScenario(o);
  },
};

if (Branch.current === 'b') {
  document.addEventListener('click', e => {
    const chip = e.target.closest('[data-mg]');
    if (!chip) return;
    e.stopPropagation();
    const [b, i] = chip.dataset.mg.split(':');
    const t = MG.blocks[b] && MG.blocks[b][i];
    if (t) MG.start(t);
  });
  // рядки чипів на екранах тягнуться мишею — як усі .hscroll (App.renderScreen)
}
