/* =====================================================================
   СЦЕНАРІЇ ЧАТУ МГ — спільний механізм для гілок C і Chats (D), за правилами
   docs/mg-dialog-rules.md. Сценарії — окремі файли js/scenarios/<id>.js: Scenarios.define({...}).
   • Крок сценарію { label, run }: слова гостя → [«✓ … · Скасувати»] → відповідь МГ
     (картки з підписом «чому цей», чернетка-список, рядок припущень МГ з «×», один суміжний крок).
   • Своє питання: спершу кожен сценарій пробує його розпізнати (route), далі — як раніше.
   • Кошик: іконка заміни з проду в рядку → чат поверх кошика; жовті чіпси МГ — лише ті,
     на які є реальна відповідь (Де зекономити? / Як доставити дешевше? / Що з цього приготувати?).
   • Гілка C (не Chats): «Зібрати покупки» в привітанні й тап по острівцю «Давай зберу тобі кошик?»
     запускають сценарій «Зібрати кошик» — чернетку-список замість каруселі.
   Особливості Chats (чат — головний екран, список сценаріїв, без привітання) — js/branches/d.js.
   ===================================================================== */

/** Реєстр сценаріїв чату (гілки C і Chats). Опис сценарію (js/scenarios/<id>.js):
    { id, opener: { label, answer, next, ... } — перший крок (тег у привітанні),
      кожен крок сценарію має scenario: '<id>' (підсвітка в списку);
      route(text, last) — своє питання гостя → крок сценарію або null;
                          last — останній крок, на який відповідав МГ (щоб розуміти відповідь
                          на уточнення: «до 700» після питання про бюджет) } */
const Scenarios = {
  all: {},
  onStep: null,       // (id) => …: кожен крок сценарію (Chats підсвічує сценарій у списку)
  cartNew: new Set(), // товари, які МГ щойно поставив у кошик замість інших — «нове» в рядку кошика
  define(s) { this.all[s.id] = s; },
  ready() { return DATA.scenarios.list.filter(x => this.all[x.id]); },
  /** Перші кроки готових сценаріїв — теги в привітанні */
  openers() { return this.ready().map(x => ({ ...this.all[x.id].opener, kind: 'node' })); },
};

(() => {
  if (!Branch.is('c')) return; // C і Chats (D збудована на C)
  const chat = AiChat;

  /* Останній крок сценарію — щоб зрозуміти відповідь гостя своїми словами */
  const baseRunNode = chat.runNode;
  chat.runNode = function (n, said) {
    if (!n.go) this.lastNode = n;
    if (n.scenario && Scenarios.onStep) Scenarios.onStep(n.scenario); // Chats: підсвітка в списку сценаріїв
    if (n.back) { // «Повернутись у кошик» — чат відкрито поверх екрана; показуємо щойно замінений рядок
      this.close();
      const row = document.querySelector('#cart .cart-row.is-new');
      if (row) setTimeout(() => row.scrollIntoView({ behavior: 'smooth', block: 'center' }), 250);
      return;
    }
    if (n.run && !n.go) return runStep.call(this, n, said);
    return baseRunNode.call(this, n, said);
  };
  // теги привітання чат позначає як kind: 'opener' — крок із run() однаково виконуємо як крок сценарію
  const baseRunTag = chat.runTag;
  chat.runTag = function (t, all) {
    if (t.run) return this.runNode(t);
    return baseRunTag.call(this, t, all);
  };

  /** Крок сценарію з run(): слова гостя → [підтвердження дії] → відповідь МГ.
      run() повертає { text, items, after, chips, context, confirm: { text, undo } } */
  function runStep(n, said) {
    this.push('user', said || n.label);
    const r = n.run() || {};
    Scenarios.all[n.scenario]?.remember?.(r);
    if (r.confirm) {
      // «Скасувати» діє лише до наступної дії з кошиком
      this.thread.forEach(m => { if (m.kind === 'confirm') m.undoable = false; });
      this.thread.push({ from: 'bot', kind: 'confirm', text: r.confirm.text, undo: r.confirm.undo, undoable: true });
      this.render();
    }
    // після дії першим на екрані — підтвердження, під ним відповідь МГ
    const anchor = r.confirm ? this.thread.length - 1 : null;
    if (r.list) freezeLists.call(this);
    const list = r.list && { ...r.list, scenario: n.scenario }; // чернетка списку — «Замінити» в рядку піде в цей сценарій
    // рядок контексту — лише припущення МГ: усе, що казав гість, і так видно в переписці
    const context = (r.context || []).filter(c => c.source === 'assumption');
    this.reply(r.text, r.items, this.nodes(r.chips), r.mood, { after: r.after, context, anchor, list });
  }

  /** Старі чернетки лишаються такими, як були: копіюємо їхні рядки (остання ділить рядки зі сценарієм) */
  function freezeLists() {
    this.thread.forEach(m => { if (m.kind === 'list') m.rows = m.rows.map(r => ({ ...r })); });
  }

  /** Перемалювати чернетку на місці (кількість, «не беру») — без нового повідомлення й без прокрутки */
  function redrawList(i) {
    const el = chat.threadEl.querySelector(`.ai-list[data-msg="${i}"]`);
    if (el) el.outerHTML = chat.listCard(chat.thread[i], Number(i), true);
  }

  /* Тапи всередині чату: «Скасувати» в підтвердженні, «×» у рядку контексту, чернетка списку */
  document.addEventListener('DOMContentLoaded', () => {
    chat.el.addEventListener('click', e => {
      const undo = e.target.closest('[data-undo]');
      if (undo) {
        const m = chat.thread[undo.dataset.undo];
        if (!m || !m.undoable) return;
        m.undoable = false;
        m.undone = true;
        const r = m.undo() || {};
        chat.session++; // відповідь, що ще «друкується», вже не актуальна
        chat.thread = chat.thread.filter(x => !x.typing);
        chat.thread.push({ from: 'bot', text: r.text, tags: r.list ? null : chat.nodes(r.chips) });
        chat.anchor = chat.thread.length - 1;
        if (r.list) { freezeLists.call(chat); chat.thread.push({ from: 'bot', kind: 'list', ...r.list, scenario: chat.lastNode && chat.lastNode.scenario, tags: chat.nodes(r.chips) }); }
        chat.render();
        return;
      }
      // чернетка: кількість і «не брати / повернути» — правка пропозиції, без нового повідомлення
      const qty = e.target.closest('[data-list-qty]');
      if (qty) {
        const m = chat.thread[qty.dataset.listMsg];
        const row = m && m.rows.find(r => r.id === qty.dataset.id);
        if (!row) return;
        const next = (row.qty || 1) + Number(qty.dataset.listQty);
        if (next < 1) row.off = true; // мінус на 1 шт (кошик) — не видаляє, а «не беру»
        else row.qty = next;
        redrawList(qty.dataset.listMsg);
        return;
      }
      const back = e.target.closest('[data-list-on]');
      if (back) {
        const m = chat.thread[back.dataset.listMsg];
        const row = m && m.rows.find(r => r.id === back.dataset.listOn);
        if (row) { row.off = false; row.qty = row.qty || 1; redrawList(back.dataset.listMsg); }
        return;
      }
      const add = e.target.closest('[data-list-add]');
      if (add) {
        const m = chat.thread[add.dataset.listAdd];
        const s = m && Scenarios.all[m.scenario];
        const step = s && s.listAdd && s.listAdd(m.rows);
        if (step) chat.runNode(step);
        return;
      }
      // тап по товару в чернетці — картка товару (заїжджає справа, «Назад» — у розмову)
      const go = e.target.closest('.ai-list [data-go]');
      if (go) { e.stopPropagation(); chat.pushTo('pdp', go.dataset.param); return; }
      const cardAct = e.target.closest('[data-card-act]');
      if (cardAct) {
        const s = chat.lastNode && Scenarios.all[chat.lastNode.scenario];
        const step = s && s.cardAction && s.cardAction(cardAct.dataset.cardAct);
        if (step) chat.runNode(step);
        return;
      }
      const act = e.target.closest('[data-row-act]');
      if (act) {
        const m = chat.thread[act.dataset.listMsg];
        const s = m && Scenarios.all[m.scenario];
        const step = s && s.rowAction && s.rowAction(act.dataset.rowAct);
        if (step) chat.runNode(step);
        return;
      }
      const x = e.target.closest('[data-ctx-remove]');
      if (x) {
        const m = chat.thread[x.dataset.ctxMsg];
        const c = m && m.context[x.dataset.ctxRemove];
        const s = chat.lastNode && Scenarios.all[chat.lastNode.scenario];
        const step = c && s && s.removeCondition && s.removeCondition(c.type);
        if (step) chat.runNode(step);
      }
    });
  });
  /* Своє питання: сценарій, що його впізнав, відповідає як на тег (але в чаті — слова гостя) */
  const baseAsk = chat.ask.bind(chat);
  chat.ask = function (text) {
    if (!text.trim()) return;
    const t = text.trim().toLocaleLowerCase('uk-UA');
    for (const s of Object.values(Scenarios.all)) {
      const node = s.route && s.route(t, this.lastNode);
      if (node) return this.runNode(node, text.trim());
    }
    return baseAsk(text);
  };

  const baseOpen = chat.open;
  chat.open = function (opts) {
    this.el.classList.toggle('is-over', Boolean(App.current && App.current.id !== 'home'));
    return baseOpen.call(this, opts);
  };


  /** Відкрити чат поверх поточного екрана й одразу виконати крок (вхід із кошика) */
  function chatOver(step) {
    if (!step) return;
    chat.open({ greet: false });
    chat.greetedOn = chat.contextKey(); // уже в розмові — без привітання
    chat.runNode(step);
  }

  /* Кошик: іконка заміни з проду в кожному рядку → чат «Чим замінити X?»; «нове» біля заміненого */
  document.addEventListener('DOMContentLoaded', () => {
    const baseUpdate = Screens.cart.update;
    Screens.cart.update = function () {
      baseUpdate.apply(this, arguments);
      document.querySelectorAll('#cart .cart-row').forEach(row => {
        const id = row.querySelector('[data-param]')?.dataset.param;
        if (!id || row.querySelector('.cart-row__swap')) return;
        row.querySelector('.cart-row__top').insertAdjacentHTML('beforeend',
          `<button class="cart-row__swap" type="button" data-cart-swap="${id}" aria-label="Замінити з МГ: ${DATA.products[id].name}"><img src="assets/icons/change.svg" alt=""></button>`);
        if (Scenarios.cartNew.has(id)) row.classList.add('is-new');
      });
      cartChips();
    };
    Screens.cart.update();
  });
  /* Жовті чіпси МГ над кошиком — лише ті, на які МГ має реальну відповідь, не більше трьох:
     «Де зекономити?» — є рівноцінні дешевші заміни; «Як доставити дешевше?» — до порогу ≤ 300 ₴;
     «Що з цього приготувати?» — у кошику є овочі чи фрукти. Заміна окремого товару — іконкою в рядку. */
  function cartChips() {
    const body = document.querySelector('#cart .cart-body');
    if (!body) return;
    const R = Scenarios.all.replace;
    const fresh = [...Cart.items.keys()].some(id => DATA.products[id].kind === 'fruit' || ['tomatoes', 'cabbage'].includes(id));
    const intents = [
      R && R.cartSavings().length && { label: 'Де зекономити?', cartSave: true },
      R && R.cartNearDelivery() && { label: 'Як доставити дешевше?', cartDelivery: true },
      fresh && { label: 'Що з цього приготувати?', opener: 'Що з цього приготувати?' },
    ].filter(Boolean);
    const key = Cart.count() ? intents.map(t => t.label).join('|') : '';
    const old = body.querySelector('.mg-block');
    if ((old ? old.dataset.key : '') === key && (old || !key)) return; // не перемальовуємо без потреби (прокрутка чипів)
    if (old) old.remove();
    if (!key) return;
    body.insertAdjacentHTML('afterbegin', MG.block(intents, { compact: true }));
    const block = body.querySelector('.mg-block');
    block.dataset.key = key;
    block.querySelectorAll('.hscroll').forEach(enableDragScroll);
  }

  document.addEventListener('click', e => {
    const swap = e.target.closest('[data-cart-swap]');
    if (!swap) return;
    e.stopPropagation();
    chatOver(Scenarios.all.replace && Scenarios.all.replace.cartEntry(swap.dataset.cartSwap));
  }, true);
  // жовтий чіп «Замінити товар» над кошиком
  const baseMgStart = MG.start.bind(MG);
  MG.start = function (t) {
    const R = Scenarios.all.replace;
    if (t.cartReplace) return chatOver(R && R.cartAsk());
    if (t.cartSave) return chatOver(R && R.cartSave());
    if (t.cartDelivery) return chatOver(R && R.cartDelivery());
    return baseMgStart(t);
  };


  /* ---------- Лише гілка C: точки входу «Зібрати кошик» ведуть у сценарій із чернеткою ---------- */
  if (Branch.current === 'c') {
    // привітання на головній: «Зібрати покупки» (карусель) → «Зібрати кошик» (чернетка-список)
    const baseOpeners = chat.screenOpeners;
    chat.screenOpeners = function () {
      const list = baseOpeners.call(this);
      const R = Scenarios.all.replace;
      if (this.screenKey() !== 'home' || !R) return list;
      return list.map(o => (o.label === 'Зібрати покупки' ? { ...R.opener } : o));
    };
    // острівець «Давай зберу тобі кошик?»: тап — згода гостя, далі той самий сценарій
    if (typeof MgIsland !== 'undefined') {
      const baseActivate = MgIsland.activate.bind(MgIsland);
      MgIsland.activate = function () {
        const ctx = this.context, R = Scenarios.all.replace;
        if (!ctx || ctx !== DATA.aiChat.island.home || !R) return baseActivate();
        this.hide();
        chat.open({ greet: false });
        chat.greetedOn = chat.contextKey();
        if (!chat.thread.some(m => m.from === 'user')) chat.thread = [];
        chat.thread.push({ from: 'bot', text: ctx.text });
        chat.anchor = null;
        chat.render();
        chat.runNode(R.opener, 'Так, збери');
      };
    }
  }
})();
