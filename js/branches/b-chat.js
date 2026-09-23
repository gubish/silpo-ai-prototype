/* =====================================================================
   ГІЛКА B — чат Машрума як частина застосунку, а не окремий світ.
   Тексти — DATA.aiChat.shop (js/branches/b.js).

   • Таб-бар під полем вводу: кошик на ньому живий (кількість і сума
     змінюються одразу після додавання через МГ). Поки відкрита клавіатура —
     таб-бар схований (css/branches/b.css), після «Надіслати» клавіатура ховається.
   • «Додай банан» — МГ кладе товар і лише підтверджує дію, кошик не пропонує.
   • Кошик пропонуємо, лише коли завершили shopping mission:
     «Додати все в кошик» після добірки → «…наче все. У кошику N товарів на X ₴»
     + [Перевірити кошик] [Продовжити покупки].
   • «Збери фруктовий салат» / «Збери покупки» текстом — запускає місію.
   • Кошик із чату (таб-бар або «Перевірити кошик») — звичайний екран кошика,
     «Назад» повертає в розмову. Змінили кошик вручну й повернулись — МГ це бачить.
   ===================================================================== */

if (Branch.current === 'b') {
  const chat = AiChat;
  const base = {
    ask: chat.ask.bind(chat),
    runScenario: chat.runScenario.bind(chat),
    runNode: chat.runNode.bind(chat),
    open: chat.open.bind(chat),
    close: chat.close.bind(chat),
  };
  const S = () => DATA.aiChat.shop;
  const lower = s => s.toLocaleLowerCase('uk-UA');
  const words = s => lower(s).split(/[^a-zа-яіїєґʼ’'0-9]+/i).filter(Boolean);
  const cartSig = () => JSON.stringify([...Cart.items]);
  /** «Банан» → «банан»; «Майонез Hellmann’s» → «майонез Hellmann’s» */
  const inSentence = name => name.charAt(0).toLocaleLowerCase('uk-UA') + name.slice(1);
  /** {cartCount} {cartWord} {total} {mission} … у тексті */
  const say = (text, extra = {}) => Object.entries({
    cartCount: Cart.count(),
    cartWord: aiPlural(Cart.count(), S().cartWords),
    total: UI.money(Cart.total()),
    ...extra,
  }).reduce((t, [k, v]) => t.split(`{${k}}`).join(v), text);

  /* ---------- Пошук товару за словами («банани» ≈ «Банан») ---------- */
  const wordMatch = (w, q) => {
    if (w.startsWith(q)) return true;
    const stem = q.length > 4 ? q.slice(0, -2) : q.length > 3 ? q.slice(0, -1) : q;
    return w.startsWith(stem) && w.length <= q.length + 3;
  };
  const STOP = ['в', 'у', 'до', 'кошик', 'кошика', 'мені', 'ще', 'будь', 'ласка', 'штуки', 'шт', 'кг', 'пачку', 'пляшку'];
  function findProduct(text) {
    const q = words(text).filter(w => !STOP.includes(w) && !/^\d+$/.test(w));
    if (!q.length) return null;
    const hits = Object.keys(DATA.products).filter(id => {
      const nw = words(DATA.products[id].name);
      return q.every(x => nw.some(w => wordMatch(w, x)));
    });
    // спершу ті, де запит — перше слово назви, і коротші назви
    const rank = id => {
      const nw = words(DATA.products[id].name);
      return (wordMatch(nw[0], q[0]) ? 0 : 1000) + DATA.products[id].name.length;
    };
    return hits.sort((a, b) => rank(a) - rank(b))[0] || null;
  }
  const startsWithAny = (text, list) => list.some(w => lower(text).startsWith(w + ' ') || lower(text) === w);

  /* ---------- Своє повідомлення ---------- */
  chat.ask = function (text) {
    text = text.trim();
    if (!text) return;
    this.input.blur(); // клавіатура ховається — таб-бар із кошиком знову видно
    const Sh = S();

    // «Додай банан», «Купи 2 манго»
    if (startsWithAny(text, Sh.addWords)) {
      const rest = text.replace(/^\S+\s*/, '');
      const qty = Math.max(1, parseInt((rest.match(/\b(\d+)\b/) || [])[1], 10) || 1);
      const id = findProduct(rest);
      this.push('user', text);
      if (!id) return this.reply(Sh.notFound.replace('{query}', rest));
      Cart.add(id, qty);
      const p = DATA.products[id];
      const tpl = qty > 1 ? Sh.addedMany : Sh.added;
      return this.reply(say(tpl, { name: inSentence(p.shortName || p.name), qty, price: UI.money(p.price * qty) }));
    }

    // «Збери фруктовий салат», «Збери покупки на кілька днів»
    if (startsWithAny(text, Sh.collectWords)) {
      const t = lower(text);
      const m = Sh.missions.find(x => x.keywords.some(k => t.includes(k)));
      const o = m && (m.opener ? this.screenOpenersAll().find(x => x.label === m.opener) : m);
      if (o) {
        this.runScenario({ ...o, label: text });
        this.missionName = m.name || Sh.missionNames[m.opener] || Sh.missionDefault;
        return;
      }
    }
    // питання на кшталт «Що приготувати на вечерю?» — готовий сценарій за ключовими словами
    const t = lower(text);
    const route = (Sh.questionRoutes || []).find(r => r.keywords.some(k => t.includes(k)));
    const opener = route && this.screenOpenersAll().find(x => x.label === route.opener);
    if (opener) return this.runScenario({ ...opener, label: text });
    return base.ask(text);
  };

  /** Усі стартові теги (головної й спільні) — щоб знайти місію за назвою */
  chat.screenOpenersAll = function () {
    const home = (DATA.aiChat.screens.home || {}).openers || [];
    return [...home, ...DATA.aiChat.openers].map(o => (typeof o === 'string' ? DATA.aiChat.openers.find(x => x.id === o) : o)).filter(Boolean);
  };

  /* ---------- Місія: стартовий тег задає її назву ---------- */
  chat.runScenario = function (o) {
    this.missionName = S().missionNames[o.label] || S().missionDefault;
    return base.runScenario(o);
  };

  /* ---------- Кроки сценарію ---------- */
  // крок із дією (кошик, «додати все») активний і без тексту відповіді
  const baseLive = chat.isLive.bind(chat);
  chat.isLive = t => baseLive(t) || Boolean(t.action);

  chat.runNode = function (n) {
    const Sh = S();
    // «Перевірити кошик» — звичайний кошик; «Назад» поверне в розмову
    if (n.action === 'openCart') { this.push('user', n.label); return setTimeout(() => this.pushTo('cart'), 250); }
    if (n.action === 'keepShopping') {
      this.push('user', n.label);
      return this.reply(Sh.keepShoppingAnswer, null, this.screenOpeners().map(o => ({ ...o, kind: 'opener' })));
    }
    // «Додати все в кошик» — місію завершено: підсумок і пропозиція перевірити кошик
    if (n.action === 'addAll' || n.action === 'addItems') {
      this.push('user', n.label);
      const shown = n.action === 'addItems' ? this.itemsFor(n, null) || [] : this.lastProducts();
      shown.forEach(i => Cart.add(i.id));
      const text = say(Sh.missionDone, { mission: this.missionName || Sh.missionDefault });
      this.missionName = null;
      return this.reply(text, null, [
        { label: Sh.checkCart, action: 'openCart', answer: '→', kind: 'node' },
        { label: Sh.keepShopping, action: 'keepShopping', answer: '→', kind: 'node' },
      ]);
    }
    return base.runNode(n);
  };

  /* ---------- AI ↔ GUI: той самий кошик ---------- */
  chat.close = function (opts) {
    this.cartSeen = cartSig(); // що було в кошику, коли пішли з чату
    return base.close(opts);
  };
  chat.open = function (opts) {
    base.open(opts);
    const started = this.thread.some(m => m.from === 'user');
    if (started && this.cartSeen != null && this.cartSeen !== cartSig()) {
      this.cartSeen = cartSig();
      this.reply(say(S().cartChanged));
    }
  };

  /* ---------- Таб-бар під полем вводу ---------- */
  document.addEventListener('DOMContentLoaded', () => setTimeout(() => {
    if (!chat.el) return;
    chat.el.insertAdjacentHTML('beforeend', UI.tabbar());
    const bar = chat.el.lastElementChild;
    mascotInTabbar(chat.el);
    bar.addEventListener('click', e => {
      if (e.target.closest('.ai-fab')) { e.stopPropagation(); return; } // чат уже відкритий
      const go = e.target.closest('[data-go]');
      if (!go) return;
      // кошик — поверх чату, «Назад» поверне в розмову; решта пунктів — просто перехід
      if (go.dataset.go === 'cart') { e.stopPropagation(); chat.pushTo('cart'); return; }
      chat.close(); // перехід зробить js/app.js
    });
    Cart.render(); // лічильник і сума на «Кошику»
  }));
}
