/* =====================================================================
   AI-АСИСТЕНТ — Rive-грибочок Машрум Геннадійович (assets/rive/mushroom_mvp.riv)
   • Настрій = вираз обличчя + колір сяйва. Кожен настрій у .riv — дві анімації:
     face-<настрій> і face-<настрій>-gradient. Список — DATA.aiChat.moods.
   • Граємо анімації напряму, а НЕ стейт-машину (вона не вмикає кольори
     й за замовчуванням ховає персонажа).
   • Плавна зміна настрою: новий настрій малюється на новому канвасі поверх
     старого й проявляється (у самому .riv переходів між настроями немає).
   • Канвас вищий за квадрат + fit: contain + alignment: bottomCenter,
     щоб «шапка» не обрізалась у верхній точці гойдання.
   • Рантайм і .wasm вшиті локально (vendor/) — працює офлайн.
   ===================================================================== */

(function () {
  const RIVE_FILE = 'assets/rive/mushroom_mvp.riv';
  const FADE_MS = 600; // скільки проявляється новий настрій

  // приглушуємо шумне попередження рантайму про невідомі об'єкти в .riv
  const origError = console.error;
  console.error = function (msg) {
    if (typeof msg === 'string' && msg.includes('Failed to import object of type')) return;
    return origError.apply(console, arguments);
  };

  function base64ToBuffer(b64) {
    const bin = atob(b64), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  /** З сервера беремо сам .riv файл; при відкритті з диска (file://) — вшиту копію */
  let filePromise = null;
  function loadRiveFile() {
    if (!filePromise) {
      filePromise = (async () => {
        if (location.protocol !== 'file:') {
          try {
            const res = await fetch(RIVE_FILE);
            if (res.ok) return await res.arrayBuffer();
          } catch (e) { /* впадемо на вшиту копію */ }
        }
        return base64ToBuffer(window.RIVE_FILE_BASE64);
      })();
      if (window.rive) rive.RuntimeLoader.setWasmUrl(window.RIVE_WASM_URL);
    }
    return filePromise.then(b => b.slice(0)); // кожному екземпляру — своя копія
  }

  /** Грибочок у контейнері host. mood — ключ із DATA.aiChat.moods. */
  class Mushroom {
    constructor(host, { mood, sizeAnim = null } = {}) {
      this.host = host;
      this.sizeAnim = sizeAnim; // напр. 'size-icon' — кадрування для маленького аватара
      this.layers = [];
      this.token = 0;
      this.host.classList.add('mushroom');
      // контейнер показали / змінив розмір (прихований чат, поворот) — перемальовуємо
      new ResizeObserver(() => this.resize()).observe(host);
      this.set(mood, { instant: true });
    }

    async set(mood, { instant = false } = {}) {
      const M = DATA.aiChat.moods;
      if (!M[mood]) mood = DATA.aiChat.defaultMood;
      if (mood === this.mood || !window.rive) return;
      this.mood = mood;
      const token = ++this.token;

      const canvas = document.createElement('canvas');
      canvas.className = 'mushroom__layer';
      canvas.style.opacity = '0';
      this.host.appendChild(canvas);
      const buffer = await loadRiveFile();
      if (token !== this.token) { canvas.remove(); return; } // встиг змінитися знову

      const face = M[mood].face, glow = M[mood].glow || face; // glow — сяйво іншого настрою
      const animations = ['idle', 'face-' + face, 'face-' + glow + '-gradient', M[mood].blink === false ? 'no-blink' : 'blink'];
      if (this.sizeAnim) animations.push(this.sizeAnim);

      const r = new rive.Rive({
        buffer, canvas, autoplay: true, animations,
        layout: new rive.Layout({ fit: rive.Fit.Contain, alignment: rive.Alignment.BottomCenter }),
        onLoad: () => {
          r.resizeDrawingSurfaceToCanvas();
          canvas.style.transition = instant ? 'none' : `opacity ${FADE_MS}ms ease`;
          requestAnimationFrame(() => { canvas.style.opacity = '1'; });
          // старі шари прибираємо, коли новий проявився
          const old = this.layers.filter(l => l.canvas !== canvas);
          setTimeout(() => old.forEach(l => { try { l.r.cleanup(); } catch (e) {} l.canvas.remove(); }), instant ? 0 : FADE_MS + 50);
          this.layers = this.layers.filter(l => !old.includes(l));
        },
      });
      this.layers.push({ canvas, r });
    }

    resize() { this.layers.forEach(l => { try { l.r.resizeDrawingSurfaceToCanvas(); } catch (e) {} }); }
  }
  window.Mushroom = Mushroom;

  /** Грибочки-кнопки .ai-fab (плаваючий, у таб-барі гілки B — скільки є на сторінці);
      Mascot.setMood(...) — той самий настрій усім, як у чаті */
  function boot() {
    if (!window.rive) return;
    let views = [];
    window.Mascot = {
      mood: DATA.aiChat.defaultMood,
      setMood(m) {
        this.mood = m;
        this.prune();
        views.forEach(v => v.set(m));
      },
      /** Грибочок у новому контейнері (напр. таб-бар перемальованого екрана) — у поточному настрої */
      attach(host) {
        this.prune();
        if (!views.some(v => v.host === host)) views.push(new Mushroom(host, { mood: this.mood }));
      },
      /** Контейнери, яких уже немає на сторінці (екран перемалювали), — звільняємо */
      prune() {
        views = views.filter(v => {
          if (v.host.isConnected) return true;
          v.layers.forEach(l => { try { l.r.cleanup(); } catch (e) {} });
          return false;
        });
      },
    };
    document.querySelectorAll('.ai-fab').forEach(fab => Mascot.attach(fab));
  }

  if (document.readyState !== 'loading') boot();
  else document.addEventListener('DOMContentLoaded', boot);
})();
