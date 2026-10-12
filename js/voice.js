/* =====================================================================
   ГОЛОС У ЧАТІ МГ (гілки C і Chats). Правила — docs/mg-dialog-rules.md, розділ «Голос».
   • Поле вводу, поки порожнє: мікрофон (голосове повідомлення) і кругла кнопка «Розмова голосом».
     З текстом — як раніше: фотоапарат і «Надіслати».
   • Голосове повідомлення: запис у полі (час, хвиля, «×» скасувати, «↑» надіслати) → у чаті бульбашка
     з хвилею й прослуховуванням, під нею розшифровка — що почув МГ. МГ відповідає текстом, як завжди.
   • Розмова голосом (voice mode): на весь чат — великий живий МГ і стан «Слухаю / Думаю / Говорю»,
     субтитри, результат компактно знизу (картки, чернетка), чіпси — можна сказати або тапнути.
     МГ озвучує суть і питання; переліки й ціни — на екрані. Уся розмова лишається в чаті.
   • Розпізнавання — справжнє (Web Speech API, українська). Немає мікрофона чи підтримки — демо:
     МГ «чує» підказку сценарію (тап по ній), прототип не ламається.
   ===================================================================== */

(() => {
  if (!Branch.is('c')) return; // гілки C і Chats
  const chat = AiChat;
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  // немає розпізнавання, мікрофон заборонили або ?voice=demo (показ без мікрофона) — демо
  let demo = !SR || /[?&]voice=demo\b/.test(location.search);
  const LANG = 'uk-UA';
  const T = {
    mic: 'Записати голосове',
    mode: 'Розмова голосом',
    hold: 'Говори — я слухаю',
    noHear: 'Не розчув — спробуй ще раз',
    listening: 'Слухаю…',
    thinking: 'Думаю…',
    speaking: 'Говорю…',
    muted: 'Мікрофон вимкнено',
    demoNote: 'Мікрофон недоступний — тапни, що сказати',
    sayHint: 'Скажи або тапни:',
    tapHint: 'Тапни, що сказати:',
    noVoice: 'Голос МГ у цьому браузері недоступний — лише субтитри',
    end: 'Завершити',
    openChat: 'Відкрити в чаті',
  };
  const ICON = {
    mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><rect x="8.5" y="2.5" width="7" height="12.5" rx="3.5"/><path d="M5 11.5a7 7 0 0 0 14 0M12 18.5V22"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 10v4M8 7v10M12 4v16M16 8v8M20 10.5v3"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1.2"/><rect x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  };
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ---------- Мікрофон: потік, рівень гучності, запис ---------- */
  let stream = null, analyser = null, levelBuf = null;
  async function micStream() {
    if (stream) return stream;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no-mic');
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      levelBuf = new Uint8Array(analyser.fftSize);
      ctx.createMediaStreamSource(stream).connect(analyser);
    } catch (e) { analyser = null; }
    return stream;
  }
  /** Гучність 0…1 (без мікрофона — легке «дихання» для демо) */
  function level() {
    if (!analyser) return 0.25 + 0.2 * Math.abs(Math.sin(Date.now() / 260));
    analyser.getByteTimeDomainData(levelBuf);
    let peak = 0;
    for (let i = 0; i < levelBuf.length; i++) peak = Math.max(peak, Math.abs(levelBuf[i] - 128));
    return Math.min(1, peak / 64);
  }
  function stopStream() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null; analyser = null;
  }

  /** Розпізнавання: onText(текст, остаточний?) ; повертає stop() */
  function recognize({ continuous, onText, onEnd, onDeny }) {
    const r = new SR();
    r.lang = LANG; r.interimResults = true; r.continuous = continuous; r.maxAlternatives = 1;
    let final = '', interim = '';
    r.onresult = e => {
      interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      onText((final + interim).trim(), false);
    };
    r.onerror = e => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'audio-capture') { demo = true; onDeny && onDeny(); } };
    r.onend = () => onEnd && onEnd((final + interim).trim());
    try { r.start(); } catch (e) { demo = true; onDeny && onDeny(); }
    return { stop: () => { try { r.stop(); } catch (e) {} }, abort: () => { r.onend = null; try { r.abort(); } catch (e) {} } };
  }

  /* ---------- Що «скаже» гість у демо: підказка сценарію ---------- */
  function lastTags() {
    const m = [...chat.thread].reverse().find(x => x.from === 'bot' && !x.typing && x.tags && x.tags.length);
    return m ? m.tags : [];
  }
  function opener() {
    if (typeof Scenarios === 'undefined') return null;
    let id = null;
    try { id = localStorage.getItem('silpo-d-scenario'); } catch (e) { /* без памʼяті */ }
    const s = (id && Scenarios.all[id]) || Scenarios.all[(Scenarios.ready()[0] || {}).id];
    return s && s.opener ? { ...s.opener, kind: 'node' } : null;
  }
  /** Хід гостя: { text, run } — run() відправляє в чат (як тап по чіпу або своє питання) */
  function demoTurn() {
    const tags = lastTags().filter(t => chat.isLive(t) && !t.go && !t.back);
    if (tags.length) return { text: tags[0].label, run: () => chat.runTag(tags[0], lastTags()) };
    const o = opener();
    return o ? { text: o.label, run: () => chat.runTag(o, [o]) } : null;
  }
  const askTurn = text => ({ text, run: () => chat.ask(text) });

  /* Репліка гостя голосом — позначка на повідомленні (бульбашка з хвилею або «сказав голосом») */
  const basePush = chat.push.bind(chat);
  chat.push = function (from, text) {
    if (from === 'user' && this.voiceNext) {
      const voice = this.voiceNext;
      this.voiceNext = null;
      text = String(text).trim();
      if (!text) return;
      this.anchor = null;
      this.thread.push({ from, text, voice });
      this.render();
      return;
    }
    return basePush(from, text);
  };

  /** Бульбашка голосового: ▶ · хвиля · тривалість (розшифровка — звичайною бульбашкою під нею) */
  chat.voiceHtml = function (m, i) {
    const v = m.voice;
    return `<div class="ai-voice-msg" data-voice-msg="${i}" style="--p:0">
      <button class="ai-voice-msg__play" type="button" data-voice-play="${i}" aria-label="Прослухати голосове">${ICON.play}</button>
      <span class="ai-voice-msg__wave">${v.bars.map((h, k) => `<i style="height:${h}%" data-k="${k}"></i>`).join('')}</span>
      <span class="ai-voice-msg__time">${fmt(v.dur)}</span>
    </div>`;
  };
  /** Прослуховування: справжній запис, якщо є; у демо — лише прогрес хвилі */
  let playing = null;
  function play(i) {
    const m = chat.thread[i], el = chat.threadEl.querySelector(`[data-voice-msg="${i}"]`);
    if (!m || !el) return;
    if (playing) { playing.stop(); if (playing.i === i) { playing = null; return; } }
    const btn = el.querySelector('[data-voice-play]');
    const audio = m.voice.url ? new Audio(m.voice.url) : null;
    const t0 = Date.now(), dur = m.voice.dur * 1000;
    btn.innerHTML = ICON.pause;
    let raf = 0;
    const tick = () => {
      const p = audio && audio.duration && isFinite(audio.duration) ? audio.currentTime / audio.duration : (Date.now() - t0) / dur;
      el.style.setProperty('--p', Math.min(1, p));
      el.querySelectorAll('i').forEach((b, k, all) => b.classList.toggle('is-on', k / all.length < p));
      if (p >= 1) return stop();
      raf = requestAnimationFrame(tick);
    };
    const stop = () => { cancelAnimationFrame(raf); if (audio) audio.pause(); btn.innerHTML = ICON.play; el.querySelectorAll('i').forEach(b => b.classList.remove('is-on')); playing = null; };
    if (audio) audio.play().catch(() => {});
    playing = { i, stop };
    tick();
  }

  /* ---------- Поле вводу: мікрофон, «Розмова голосом», запис ---------- */
  let rec = null; // поточний запис голосового
  function setupComposer() {
    const field = chat.field;
    field.insertAdjacentHTML('beforeend', `
      <button class="ai-field__mic" type="button" aria-label="${T.mic}">${ICON.mic}</button>
      <button class="ai-field__voice" type="button" aria-label="${T.mode}">${ICON.wave}</button>
      <div class="ai-rec" hidden>
        <button class="ai-rec__cancel" type="button" aria-label="Скасувати запис">${ICON.close}</button>
        <span class="ai-rec__dot" aria-hidden="true"></span>
        <span class="ai-rec__time">0:00</span>
        <span class="ai-rec__wave" aria-hidden="true"></span>
        <span class="ai-rec__hint"></span>
        <button class="ai-rec__send" type="button" aria-label="Надіслати голосове">${ICON.up}</button>
      </div>`);
    field.querySelector('.ai-field__mic').addEventListener('click', startRec);
    field.querySelector('.ai-field__voice').addEventListener('click', openMode);
    field.querySelector('.ai-rec__cancel').addEventListener('click', () => endRec(false));
    field.querySelector('.ai-rec__send').addEventListener('click', () => endRec(true));
    chat.threadEl.addEventListener('click', e => {
      const b = e.target.closest('[data-voice-play]');
      if (b) { e.stopPropagation(); play(Number(b.dataset.voicePlay)); }
    });
  }

  async function startRec() {
    if (rec) return;
    const field = chat.field, box = field.querySelector('.ai-rec');
    rec = { t0: Date.now(), bars: [], text: '', chunks: [], url: null, sr: null, mr: null };
    field.classList.add('is-recording');
    box.hidden = false;
    box.querySelector('.ai-rec__hint').textContent = demo ? '' : T.hold;
    const wave = box.querySelector('.ai-rec__wave');
    wave.innerHTML = '';
    const cur = rec;
    // таймер і «жива» хвиля — одразу, навіть поки браузер питає дозвіл на мікрофон
    cur.timer = setInterval(() => {
      if (!rec) return;
      const lv = level();
      rec.bars.push(lv);
      box.querySelector('.ai-rec__time').textContent = fmt((Date.now() - rec.t0) / 1000);
      wave.innerHTML = rec.bars.slice(-26).map(v => `<i style="height:${Math.round(18 + v * 82)}%"></i>`).join('');
      if (Date.now() - rec.t0 > 60000) endRec(true); // хвилина — і досить
    }, 110);
    if (demo) return;
    try {
      const s = await micStream();
      if (rec !== cur) return; // запис уже скасували чи надіслали
      if (window.MediaRecorder) {
        cur.mr = new MediaRecorder(s);
        cur.mr.ondataavailable = e => e.data.size && cur.chunks.push(e.data);
        cur.mr.start();
      }
      cur.sr = recognize({ continuous: true, onText: t => { cur.text = t; if (rec === cur) box.querySelector('.ai-rec__hint').textContent = t || T.hold; } });
    } catch (e) { demo = true; if (rec === cur) box.querySelector('.ai-rec__hint').textContent = ''; }
  }

  /** Кінець запису: send — надіслати (розшифровка → МГ), інакше скасувати */
  function endRec(send) {
    if (!rec) return;
    const r = rec; rec = null;
    clearInterval(r.timer);
    const field = chat.field;
    field.classList.remove('is-recording');
    field.querySelector('.ai-rec').hidden = true;
    const dur = Math.max(1, Math.round((Date.now() - r.t0) / 1000));
    // хвиля бульбашки — 28 стовпчиків з рівнів запису
    const src = r.bars.length ? r.bars : [0.3];
    const bars = Array.from({ length: 28 }, (_, k) => Math.round(20 + 80 * src[Math.floor(k * src.length / 28)]));
    const finish = (text, url) => {
      stopStream();
      if (!send) return;
      const t = text ? askTurn(text) : demo ? demoTurn() : null;
      if (!t) { flash(T.noHear); return; }
      chat.voiceNext = { dur, bars, url };
      t.run();
      chat.voiceNext = null;
    };
    if (r.mr && r.mr.state !== 'inactive') {
      r.mr.onstop = () => { const url = r.chunks.length ? URL.createObjectURL(new Blob(r.chunks, { type: r.mr.mimeType })) : null; waitText(r, t => finish(t, url)); };
      r.mr.stop();
    } else waitText(r, t => finish(t, null));
  }
  /** Дочекатися остаточного тексту розпізнавання (до 1,2 с після «стоп») */
  function waitText(r, done) {
    if (!r.sr) return done(r.text);
    let fired = false;
    const go = () => { if (!fired) { fired = true; done(r.text); } };
    r.sr.stop();
    setTimeout(go, 1200);
    const t0 = r.text;
    const iv = setInterval(() => { if (r.text !== t0) { clearInterval(iv); setTimeout(go, 150); } }, 100);
    setTimeout(() => clearInterval(iv), 1300);
  }
  /** Коротка підказка на місці поля («Не розчув…») */
  function flash(text) {
    const input = chat.input, ph = input.placeholder;
    input.placeholder = text;
    setTimeout(() => { input.placeholder = ph; }, 2500);
  }

  /* ---------- Розмова голосом ---------- */
  let V = null; // { el, mg, state, muted, sr, raf }
  function ukVoice() {
    const s = window.speechSynthesis;
    return s && s.getVoices().find(v => /^uk/i.test(v.lang));
  }
  if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = () => { if (V) note(); };

  function openMode() {
    if (V) return;
    const el = document.createElement('div');
    el.className = 'ai-voice';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', T.mode);
    el.innerHTML = `
      <div class="ai-voice__top">
        <button class="ai-voice__close" type="button" aria-label="${T.end}">${ICON.close}</button>
        <span class="ai-voice__state" aria-live="polite"></span>
      </div>
      <p class="ai-voice__note"></p>
      <div class="ai-voice__stage"><span class="ai-voice__ring"></span><span class="ai-voice__ring ai-voice__ring--2"></span><div class="ai-voice__mg"></div></div>
      <p class="ai-voice__guest"></p>
      <p class="ai-voice__say"></p>
      <div class="ai-voice__result"></div>
      <div class="ai-voice__chips"></div>
      <div class="ai-voice__controls">
        <button class="ai-voice__mute" type="button" aria-pressed="false" aria-label="Вимкнути мікрофон">${ICON.mic}</button>
        <button class="ai-voice__end" type="button">${T.end}</button>
      </div>`;
    chat.el.appendChild(el);
    V = { el, state: null, muted: false, sr: null, token: 0 };
    V.mg = window.Mushroom ? new Mushroom(el.querySelector('.ai-voice__mg'), { mood: 'happy' }) : null;
    el.querySelector('.ai-voice__close').addEventListener('click', closeMode);
    el.querySelector('.ai-voice__end').addEventListener('click', closeMode);
    el.querySelector('.ai-voice__mute').addEventListener('click', toggleMute);
    el.querySelector('.ai-voice__chips').addEventListener('click', e => {
      const b = e.target.closest('[data-vchip]');
      if (!b) return;
      const tags = lastTags(), t = tags[Number(b.dataset.vchip)];
      if (!t) return;
      if (t.go || t.back) { closeMode(); chat.runTag(t, tags); return; } // перехід на екран — уже не голосом
      turn({ text: t.label, run: () => chat.runTag(t, tags) });
    });
    el.querySelector('.ai-voice__result').addEventListener('click', e => { if (e.target.closest('[data-vopen]')) closeMode(); });
    // рівень мікрофона → кільця навколо МГ
    const loop = () => {
      if (!V) return;
      const lv = V.state === 'listening' && !V.muted ? level() : V.state === 'speaking' ? 0.35 + 0.25 * Math.abs(Math.sin(Date.now() / 180)) : 0.1;
      el.style.setProperty('--lvl', lv.toFixed(3));
      V.raf = requestAnimationFrame(loop);
    };
    loop();
    note();
    // уже є відповідь МГ — показуємо її й одразу слухаємо; розмова порожня — слухаємо
    const msgs = lastBotTurn();
    if (msgs.length) present(msgs, false);
    if (!demo) micStream().catch(() => { demo = true; note(); }).finally(listen); else listen();
  }

  function closeMode() {
    if (!V) return;
    V.token++;
    if (V.sr) V.sr.abort();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    cancelAnimationFrame(V.raf);
    V.el.remove();
    V = null;
    stopStream();
    chat.setMood(DATA.aiChat.defaultMood);
    chat.render();
    chat.scrollToEnd(false);
  }

  function note() {
    if (!V) return;
    V.el.querySelector('.ai-voice__note').textContent = demo ? T.demoNote : (window.speechSynthesis && !ukVoice() ? T.noVoice : '');
  }
  function setState(s) {
    V.state = s;
    V.el.dataset.state = s;
    V.el.querySelector('.ai-voice__state').textContent = V.muted && s === 'listening' ? T.muted : T[s];
    if (V.mg) V.mg.set(s === 'thinking' ? 'thinking' : 'happy');
    chat.setMood(s === 'thinking' ? 'thinking' : DATA.aiChat.defaultMood);
  }

  /** Слухати гостя: справжнє розпізнавання або демо (тап по підказці) */
  function listen() {
    if (!V) return;
    setState('listening');
    V.el.querySelector('.ai-voice__guest').textContent = '';
    if (demo || V.muted) return; // демо: гість тапає підказку; вимкнений мікрофон — чекаємо
    const token = V.token;
    let heard = '';
    V.sr = recognize({
      continuous: false,
      onText: t => { heard = t; if (V) V.el.querySelector('.ai-voice__guest').textContent = t; },
      onEnd: t => {
        if (!V || token !== V.token || V.state !== 'listening') return;
        V.sr = null;
        const text = (t || heard).trim();
        if (text) turn(askTurn(text));
        else setTimeout(listen, 200); // тиша — слухаємо далі
      },
      onDeny: () => { note(); renderChips(); },
    });
  }
  function toggleMute() {
    V.muted = !V.muted;
    const b = V.el.querySelector('.ai-voice__mute');
    b.setAttribute('aria-pressed', String(V.muted));
    b.setAttribute('aria-label', V.muted ? 'Увімкнути мікрофон' : 'Вимкнути мікрофон');
    if (V.muted && V.sr) { V.sr.abort(); V.sr = null; }
    if (V.state === 'listening') listen();
  }

  /** Хід гостя → чат → відповідь МГ (екран + голос) → знову слухаємо */
  function turn(t) {
    if (!V || !t) return;
    const token = ++V.token;
    if (V.sr) { V.sr.abort(); V.sr = null; }
    V.el.querySelector('.ai-voice__guest').textContent = t.text;
    V.el.querySelector('.ai-voice__chips').innerHTML = '';
    setState('thinking');
    const start = chat.thread.length;
    chat.voiceNext = { mode: true };
    t.run();
    chat.voiceNext = null;
    const t0 = Date.now();
    const iv = setInterval(() => {
      if (!V || token !== V.token) return clearInterval(iv);
      const busy = chat.thread.some(m => m.typing);
      const got = chat.thread.slice(start).filter(m => m.from === 'bot');
      if ((!busy && got.length) || Date.now() - t0 > 8000) {
        clearInterval(iv);
        present(got, true);
      }
    }, 120);
  }
  /** Останній хід МГ у чаті (для відкриття voice mode посеред розмови) */
  function lastBotTurn() {
    const i = chat.thread.map(m => m.from).lastIndexOf('user');
    return chat.thread.slice(i + 1).filter(m => m.from === 'bot' && !m.typing);
  }

  /** Показати відповідь МГ і (якщо speak) озвучити суть і питання */
  function present(msgs, speak) {
    if (!V) return;
    const texts = msgs.filter(m => m.text && !m.kind && !m.typing).map(m => m.text);
    const confirm = msgs.find(m => m.kind === 'confirm');
    const shown = [confirm ? `✓ ${confirm.text}` : '', ...texts].filter(Boolean).join('\n');
    V.el.querySelector('.ai-voice__say').textContent = shown;
    // результат — компактно: картки або чернетка
    const cards = msgs.find(m => m.products), list = msgs.find(m => m.kind === 'list'), card = msgs.find(m => m.kind === 'card');
    const P = id => DATA.products[id];
    V.el.querySelector('.ai-voice__result').innerHTML = cards ? `
      <div class="ai-voice__cards">${cards.products.map(p => `<div class="ai-voice__card"><img src="${P(p.id).image}" alt=""><b>${UI.money(P(p.id).price).replace('.00', '')}</b><span>${esc(P(p.id).shortName || P(p.id).name)}</span></div>`).join('')}</div>`
      : list ? `<button class="ai-voice__list" type="button" data-vopen><b>${esc(list.title)}</b><span>${list.rows.filter(r => !r.off).length} з ${list.rows.length} · ${UI.money(list.rows.filter(r => !r.off).reduce((s, r) => s + P(r.id).price * (r.qty || 1), 0))}</span><em>${T.openChat}</em></button>`
      : card ? `<button class="ai-voice__list" type="button" data-vopen><b>Контакти підтримки</b><em>${T.openChat}</em></button>` : '';
    renderChips();
    if (!speak) return;
    const token = V.token;
    say(speech(confirm, texts), () => { if (V && token === V.token) listen(); });
  }
  /** Що казати вголос: підтвердження, перше речення, питання з кінця — без переліків */
  function speech(confirm, texts) {
    const first = (texts[0] || '').split('\n')[0];
    const lead = (first.match(/^[^.!?]*[.!?]/) || [first])[0];
    const q = texts.length > 1 && /\?\s*$/.test(texts[texts.length - 1]) ? texts[texts.length - 1] : '';
    return [confirm ? 'Готово.' : '', lead, q].filter(Boolean).join(' ').replace(/₴/g, 'гривень').replace(/[«»]/g, '');
  }
  function say(text, done) {
    if (!V) return;
    setState('speaking');
    const s = window.speechSynthesis, v = ukVoice();
    if (!s || !v || !text) { setTimeout(done, Math.min(5000, 900 + text.length * 40)); return; }
    s.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = 1.05;
    u.onend = done; u.onerror = done;
    s.speak(u);
  }
  function renderChips() {
    if (!V) return;
    const tags = lastTags();
    const live = tags.some(t => chat.isLive(t));
    V.el.querySelector('.ai-voice__chips').innerHTML = live ? `
      <span>${demo ? T.tapHint : T.sayHint}</span>
      <div>${tags.map((t, k) => (chat.isLive(t) ? `<button class="mg-chip" type="button" data-vchip="${k}">${esc(t.label)}</button>` : '')).join('')}</div>`
      : demo && !chat.thread.some(m => m.from === 'user') && demoTurn() ? `<div><button class="mg-chip" type="button" data-vstart>${esc(demoTurn().text)}</button></div>` : '';
    const st = V.el.querySelector('[data-vstart]');
    if (st) st.addEventListener('click', () => turn(demoTurn()));
  }

  document.addEventListener('DOMContentLoaded', () => { if (chat.field) setupComposer(); });
})();
