/* CaturLite - catur ringan untuk KaiOS 2.5 (ES5). Online lewat API Lichess, bot offline. */
(function () {
  'use strict';
  var C = Chess;
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) { e.className = cls; } if (text !== undefined && text !== null) { e.textContent = text; } return e; }

  // ------------------------------------------------------------------ penyimpanan
  var SKEY = 'caturlite.set', OKEY = 'caturlite.off';
  var set = { token: '', rated: true, vib: true, theme: 1, base: 'https://lichess.org' };
  function lsGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { } }
  (function () { var o = lsGet(SKEY); if (o) { for (var k in o) { if (o.hasOwnProperty(k)) { set[k] = o[k]; } } } Li.cfg(set.base, set.token); })();
  function saveSet() { lsSet(SKEY, set); Li.cfg(set.base, set.token); }

  // ------------------------------------------------------------------ util UI
  var stack = [], cur = null, modal = null, toastT = 0, G = null;
  var Net = { ev: null, seek: null, gs: null, me: null, sid: 0 };

  function vib(ms) { if (set.vib && navigator.vibrate) { try { navigator.vibrate(ms); } catch (e) { } } }
  function toast(m, ms) {
    var t = $('toast'); t.textContent = m; t.style.display = 'block';
    if (toastT) { clearTimeout(toastT); }
    toastT = setTimeout(function () { t.style.display = 'none'; toastT = 0; }, ms || 2200);
  }
  function setSoft(l, c, r) { $('sk-l').textContent = l || ''; $('sk-c').textContent = c || ''; $('sk-r').textContent = r || ''; }

  function ask(msg, yes) {
    modal = { type: 'ask', yes: yes };
    $('dlgmsg').textContent = msg; $('inp').style.display = 'none'; $('dlg').style.display = 'block';
    setSoft('Batal', 'YA', '');
  }
  function editText(label, value, cb) {
    modal = { type: 'edit', cb: cb };
    $('dlgmsg').textContent = label; var i = $('inp'); i.style.display = 'block'; i.value = value || '';
    $('dlg').style.display = 'block'; setSoft('Batal', 'OK', 'Simpan');
    setTimeout(function () { try { i.focus(); } catch (e) { } }, 50);
  }
  function closeModal() {
    modal = null; $('dlg').style.display = 'none'; $('inp').style.display = 'none'; try { $('inp').blur(); } catch (e) { }
    refreshSoft();
  }

  // ------------------------------------------------------------------ layar daftar
  function row(t, r, s, id) { return { kind: 'row', t: t, r: r, s: s, id: id }; }
  function hdrRow(t) { return { kind: 'hdr', t: t }; }
  function field(label, value, id, cho) { return { kind: cho ? 'cho' : 'fld', lab: label, t: value, id: id }; }

  function push(scr) {
    if (cur && cur.leave) { cur.leave(); }
    stack.push(scr); show(scr);
  }
  function pop() {
    if (stack.length <= 1) { return; }
    var old = stack.pop();
    if (old && old.close) { old.close(); }
    show(stack[stack.length - 1]);
  }
  function replaceAll(scrs) {
    for (var i = 0; i < stack.length; i++) { if (stack[i].close) { stack[i].close(); } }
    stack = scrs; show(stack[stack.length - 1]);
  }
  function show(scr) {
    cur = scr;
    var isG = !!scr.game;
    $('hdr').style.display = isG ? 'none' : 'block';
    $('sub').style.display = isG ? 'none' : 'block';
    $('list').style.display = isG ? 'none' : 'block';
    $('bd').style.display = isG ? 'block' : 'none';
    if (scr.enter0) { scr.enter0(); }
    if (isG) { sizeCanvas(); drawGame(); } else { scr.rebuild(); }
    refreshSoft();
  }
  function refreshSoft() {
    if (modal) { return; }
    if (cur.game) { gameSoft(); } else { setSoft(cur.lsk, cur.csk, cur.rsk === undefined ? 'Kembali' : cur.rsk); }
  }

  function makeScreen(o) {
    var s = { title: '', sub: '', rows: [], sel: 0, scroll: 0, lsk: '', csk: 'PILIH', rsk: 'Kembali', numKeys: false };
    for (var k in o) { if (o.hasOwnProperty(k)) { s[k] = o[k]; } }
    s.rebuild = function () {
      if (s.build) { s.build(); }
      fixSel(s); renderList(s);
    };
    return s;
  }
  function fixSel(s) {
    var n = s.rows.length;
    if (s.sel >= n) { s.sel = n - 1; } if (s.sel < 0) { s.sel = 0; }
    if (n && s.rows[s.sel].kind === 'hdr') {
      var i; for (i = s.sel; i < n; i++) { if (s.rows[i].kind !== 'hdr') { s.sel = i; return; } }
      for (i = s.sel; i >= 0; i--) { if (s.rows[i].kind !== 'hdr') { s.sel = i; return; } }
    }
  }
  function moveSel(s, d) {
    var n = s.rows.length; if (!n) { return; }
    var i = s.sel;
    for (var c = 0; c < n; c++) { i = (i + d + n) % n; if (s.rows[i].kind !== 'hdr') { s.sel = i; break; } }
    renderList(s);
  }
  function renderList(s) {
    $('title').textContent = s.title; $('sub').textContent = s.sub || '';
    $('back').style.display = stack.length > 1 ? 'inline-block' : 'none';
    var L = $('list'); L.innerHTML = '';
    if (!s.rows.length) { L.appendChild(el('div', 'msg', s.empty || '')); return; }
    for (var i = 0; i < s.rows.length; i++) {
      var r = s.rows[i], d;
      if (r.kind === 'hdr') { d = el('div', 'row hdrrow', r.t); }
      else if (r.kind === 'fld' || r.kind === 'cho') {
        d = el('div', 'row fld' + (i === s.sel ? ' sel' : ''));
        d.appendChild(el('div', 'lab', r.lab));
        d.appendChild(el('div', 'val', (r.kind === 'cho' ? '< ' : '') + r.t + (r.kind === 'cho' ? ' >' : '')));
      } else {
        d = el('div', 'row' + (i === s.sel ? ' sel' : ''));
        if (r.r) { d.appendChild(el('div', 'r', r.r)); }
        d.appendChild(el('div', 't', r.t));
        if (r.s) { d.appendChild(el('div', 's', r.s)); }
      }
      L.appendChild(d);
    }
    var e = L.children[s.sel];
    if (e) {
      var top = e.offsetTop, bot = top + e.offsetHeight;
      if (s.scroll > top) { s.scroll = top; }
      if (bot > s.scroll + L.clientHeight) { s.scroll = bot - L.clientHeight; }
      if (s.sel === 0 || (s.rows[0] && s.rows[0].kind === 'hdr' && s.sel === 1)) { s.scroll = 0; }
    }
    L.scrollTop = s.scroll;
  }

  // ------------------------------------------------------------------ pemetaan tombol
  function keyName(e) {
    var k = e.key, c = e.keyCode;
    if (k === 'SoftLeft' || k === 'F1' || c === 112) { return 'L'; }
    if (k === 'SoftRight' || k === 'F2' || c === 113) { return 'R'; }
    if (k === 'Enter' || k === 'Return' || c === 13) { return 'OK'; }
    if (k === 'Backspace' || k === 'Escape' || k === 'BrowserBack' || c === 8 || c === 27) { return 'BACK'; }
    if (k === 'ArrowUp' || c === 38) { return 'U'; }
    if (k === 'ArrowDown' || c === 40) { return 'D'; }
    if (k === 'ArrowLeft' || c === 37) { return 'LT'; }
    if (k === 'ArrowRight' || c === 39) { return 'RT'; }
    if (k && k.length === 1) { return k; }
    return '';
  }

  document.addEventListener('keydown', function (e) {
    var k = keyName(e);
    if (modal) {
      if (modal.type === 'edit') {
        var inp = $('inp');
        if (k === 'OK') { var v = inp.value; var cb = modal.cb; closeModal(); cb(v); e.preventDefault(); }
        else if (k === 'R') { var v2 = inp.value; var cb2 = modal.cb; closeModal(); cb2(v2); e.preventDefault(); }
        else if (k === 'L' || (k === 'BACK' && inp.value === '')) { closeModal(); e.preventDefault(); }
        return;
      }
      if (k === 'OK' || k === 'R') { var y = modal.yes; closeModal(); if (y) { y(); } }
      else if (k === 'L' || k === 'BACK') { closeModal(); }
      e.preventDefault(); return;
    }
    if (!k) { return; }
    if (k === 'BACK' || k === 'U' || k === 'D' || k === 'LT' || k === 'RT' || k === 'OK' || k === 'L' || k === 'R') { e.preventDefault(); }
    if (cur.game) { gameKey(k); return; }
    var s = cur, r = s.rows[s.sel];
    if (k === 'U') { moveSel(s, -1); }
    else if (k === 'D') { moveSel(s, 1); }
    else if (k === 'LT' || k === 'RT') { if (r && r.kind === 'cho' && s.lr) { s.lr(k === 'RT' ? 1 : -1, r); } else if (s.lrOther) { s.lrOther(k === 'RT' ? 1 : -1); } }
    else if (k === 'OK') { if (r && s.enter) { s.enter(r); } }
    else if (k === 'L') { if (s.left) { s.left(); } }
    else if (k === 'R') { if (s.right) { s.right(); } else { pop(); } }
    else if (k === 'BACK') { if (s.back) { s.back(); } else { pop(); } }
    else if (s.numKeys && k >= '1' && k <= '9') {
      for (var i = 0; i < s.rows.length; i++) { if (s.rows[i].id === parseInt(k, 10) && s.enter) { s.sel = i; s.enter(s.rows[i]); break; } }
    }
  });
  $('back').addEventListener('click', function () { if (!modal) { if (cur.game) { gameBack(); } else if (cur.back) { cur.back(); } else { pop(); } } });

  // ------------------------------------------------------------------ beranda
  var home = makeScreen({
    title: 'CaturLite', numKeys: true, rsk: 'Keluar',
    build: function () {
      var s = this, rr = [];
      rr.push(row('1. Rapid 10 menit Online', set.rated ? 'rated' : 'casual', 'Lawan manusia via Lichess', 1));
      rr.push(row('2. Lawan Bot (offline)', null, 'Tanpa internet', 2));
      rr.push(row('3. Bot Lichess (online)', null, 'Stockfish level 1-8', 3));
      if (lsGet(OKEY)) { rr.push(row('4. Lanjutkan game offline', null, 'Game yang belum selesai', 4)); }
      rr.push(row('5. Pengaturan', set.token ? 'token OK' : 'isi token', null, 5));
      rr.push(row('6. Bantuan', null, null, 6));
      s.rows = rr;
      s.sub = set.token ? 'Siap bermain online' : 'Online butuh token Lichess';
    },
    enter: function (r) {
      if (r.id === 1) { startRapid(); }
      else if (r.id === 2) { push(botSetup()); }
      else if (r.id === 3) { push(aiSetup()); }
      else if (r.id === 4) { resumeOffline(); }
      else if (r.id === 5) { push(settingsScr()); }
      else { push(helpScr()); }
    },
    right: function () { ask('Keluar dari CaturLite?', function () { try { window.close(); } catch (e) { } }); },
    back: function () { this.right(); }
  });

  var LV = ['Pemula', 'Mudah', 'Sedang', 'Kuat'];
  function botSetup() {
    var o = { lv: 1, col: 2, timed: 1 };
    return makeScreen({
      title: 'Lawan Bot', csk: 'MULAI',
      build: function () {
        this.rows = [
          field('Tingkat bot (kiri/kanan)', LV[o.lv], 'lv', true),
          field('Warna Anda', ['Putih', 'Hitam', 'Acak'][o.col], 'col', true),
          field('Waktu', o.timed ? '10 menit' : 'Tanpa batas', 'tm', true),
          row('Mulai Main', null, null, 'go')
        ];
        this.sub = 'Bot berjalan di HP, tanpa internet';
      },
      lr: function (d, r) {
        if (r.id === 'lv') { o.lv = (o.lv + d + 4) % 4; } else if (r.id === 'col') { o.col = (o.col + d + 3) % 3; } else { o.timed = 1 - o.timed; }
        this.rebuild();
      },
      enter: function () {
        var my = o.col === 0 ? 'w' : (o.col === 1 ? 'b' : (Math.random() < 0.5 ? 'w' : 'b'));
        startOffline({ my: my, level: o.lv + 1, timed: o.timed, o: { lv: o.lv, col: o.col, timed: o.timed } });
      }
    });
  }
  function aiSetup() {
    var o = { lv: 2, col: 0 };
    return makeScreen({
      title: 'Bot Lichess', csk: 'MULAI',
      build: function () {
        this.rows = [
          field('Level Stockfish 1-8 (kiri/kanan)', '' + (o.lv + 1), 'lv', true),
          field('Warna Anda', ['Acak', 'Putih', 'Hitam'][o.col], 'col', true),
          row('Mulai Main (10 menit)', null, null, 'go')
        ];
        this.sub = 'Butuh internet dan token (izin challenge)';
      },
      lr: function (d, r) { if (r.id === 'lv') { o.lv = (o.lv + d + 8) % 8; } else { o.col = (o.col + d + 3) % 3; } this.rebuild(); },
      enter: function () { startLiAi(o.lv + 1, ['random', 'white', 'black'][o.col]); }
    });
  }

  // ------------------------------------------------------------------ pengaturan & bantuan
  var THEMES = ['Cokelat', 'Hijau', 'Biru'];
  function settingsScr() {
    return makeScreen({
      title: 'Pengaturan', csk: 'UBAH',
      build: function () {
        var t = set.token;
        this.rows = [
          field('Token Lichess (OK = ketik)', t ? t.substr(0, 4) + '... (' + t.length + ' karakter)' : '(kosong)', 'tok', false),
          row('Impor token dari kartu SD', null, 'File lichess-token.txt', 'sd'),
          row('Tes koneksi & akun', null, null, 'test'),
          field('Game rapid', set.rated ? 'Rated' : 'Casual', 'rated', true),
          field('Getar', set.vib ? 'Ya' : 'Tidak', 'vib', true),
          field('Tema papan', THEMES[set.theme], 'theme', true),
          field('Server (lanjutan, OK = ubah)', set.base, 'base', false)
        ];
        this.sub = 'Token dibuat di lichess.org/account/oauth/token';
      },
      lr: function (d, r) {
        if (r.id === 'rated') { set.rated = !set.rated; } else if (r.id === 'vib') { set.vib = !set.vib; } else { set.theme = (set.theme + d + 3) % 3; }
        saveSet(); this.rebuild();
      },
      enter: function (r) {
        var s = this;
        if (r.id === 'tok') { editText('Tempel/ketik token Lichess', set.token, function (v) { set.token = v.replace(/\s+/g, ''); saveSet(); s.rebuild(); toast('Token disimpan'); }); }
        else if (r.id === 'base') { editText('Alamat server', set.base, function (v) { v = v.replace(/\s+/g, ''); if (v) { set.base = v; saveSet(); s.rebuild(); } }); }
        else if (r.id === 'sd') { importSd(function () { s.rebuild(); }); }
        else if (r.id === 'test') { testAccount(); }
        else { s.lr(1, r); }
      },
      right: function () { pop(); }
    });
  }
  function importSd(done) {
    try {
      var st = navigator.getDeviceStorage('sdcard'), rq = st.get('lichess-token.txt');
      rq.onsuccess = function () {
        var fr = new FileReader();
        fr.onload = function () { set.token = String(fr.result).replace(/\s+/g, ''); saveSet(); toast('Token diimpor (' + set.token.length + ' karakter)'); done(); };
        fr.readAsText(rq.result);
      };
      rq.onerror = function () { toast('File lichess-token.txt tidak ditemukan'); };
    } catch (e) { toast('Kartu SD tidak tersedia'); }
  }
  function testAccount() {
    if (!set.token) { toast('Token masih kosong'); return; }
    toast('Menghubungi Lichess...', 4000);
    Li.account(function (err, a) {
      if (err) { toast(err.msg, 3500); } else { toast('Masuk sebagai ' + (a.username || a.id), 3500); }
    });
  }
  function helpScr() {
    var lines = ['Atas/Bawah/Kiri/Kanan: gerakkan kursor di papan', 'OK: pilih bidak, lalu OK di petak tujuan', 'Softkey kiri: Menu game', 'Softkey kanan: Batal pilihan / Daftar langkah', 'Back/C: batal pilihan, atau buka menu', 'Online memakai server Lichess (gratis), butuh akun & token',
      'Token: lichess.org/account/oauth/token, centang Play games with the board API dan Create, accept, decline challenges', 'Rapid 10+0: cari lawan otomatis',
      'Bot offline: 4 tingkat, jalan di HP tanpa internet', 'Game offline otomatis tersimpan'];
    return makeScreen({
      title: 'Bantuan', csk: '', build: function () { this.rows = []; for (var i = 0; i < lines.length; i++) { this.rows.push(row(lines[i], null, null, i)); } }
    });
  }

  // ------------------------------------------------------------------ game: model
  function mkGame(o) {
    var g = {
      mode: o.mode, my: o.my, level: o.level || 0, timed: !!o.timed, setup: o.setup || null, gameId: o.gameId || '',
      white: o.white, black: o.black, s: C.start(), hist: [], ucis: [], sans: [], last: null, lg: null,
      flip: o.my === 'b', cx: 4, cy: 6, sel: -1, targets: [], promo: null, over: null, msg: '', thinking: false,
      clk: { w: o.timed ? 600000 : -1, b: o.timed ? 600000 : -1 }, clkAt: Date.now(), ticking: '', drawOff: { w: false, b: false }, srv: []
    };
    g.hist.push(C.key(g.s));
    return g;
  }
  function curLegal() { if (!G.lg) { G.lg = C.legal(G.s); } return G.lg; }
  function applyUci(u) {
    var lg = curLegal(), m = C.findUci(lg, u);
    if (!m) { return false; }
    G.sans.push(C.san(G.s, m, lg));
    G.s = C.make(G.s, m); G.ucis.push(u); G.hist.push(C.key(G.s)); G.last = m; G.lg = null;
    return true;
  }
  function resetPos() { G.s = C.start(); G.hist = [C.key(G.s)]; G.ucis = []; G.sans = []; G.last = null; G.lg = null; G.sel = -1; G.targets = []; }
  function rebuildMoves(list) {
    resetPos();
    for (var i = 0; i < list.length; i++) { if (!applyUci(list[i])) { break; } }
  }
  function dispClock(c) {
    if (G.clk[c] < 0) { return ''; }
    var v = G.clk[c];
    if (G.ticking === c) { v -= (Date.now() - G.clkAt); }
    if (v < 0) { v = 0; }
    var sec = Math.floor(v / 1000), m = Math.floor(sec / 60), s = sec % 60;
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  var REASON = { mate: 'Skakmat', resign: 'Menyerah', timeout: 'Waktu habis', outoftime: 'Waktu habis', stalemate: 'Pat (stalemate)', insufficient: 'Material tidak cukup', fifty: 'Aturan 50 langkah', repetition: 'Pengulangan 3 kali', draw: 'Kesepakatan remis', aborted: 'Game dibatalkan', noStart: 'Game tidak dimulai', cheat: 'Pelanggaran', variantEnd: 'Game berakhir', unknownFinish: 'Game berakhir' };
  function finish(kind, winner) {
    if (G.over) { return; }
    var title;
    if (kind === 'aborted' || kind === 'noStart') { title = 'Dibatalkan'; }
    else if (!winner) { title = 'Remis'; }
    else if (winner === G.my) { title = 'Anda menang!'; }
    else { title = G.mode === 'off' ? 'Bot menang' : 'Anda kalah'; }
    G.over = { title: title, reason: REASON[kind] || 'Game berakhir', kind: kind, winner: winner };
    G.ticking = ''; G.sel = -1; G.targets = []; G.promo = null; G.thinking = false;
    if (G.mode === 'off') { lsDel(OKEY); }
    vib(300); gameSoft(); drawGame();
  }

  // ------------------------------------------------------------------ game: offline
  function startOffline(o) {
    var botName = 'Bot ' + LV[o.level - 1];
    G = mkGame({ mode: 'off', my: o.my, level: o.level, timed: o.timed, setup: o.o,
      white: { n: o.my === 'w' ? 'Anda' : botName }, black: { n: o.my === 'b' ? 'Anda' : botName } });
    replaceAll([home, gameScreen()]);
    botTurn();
  }
  function saveOffline() {
    if (!G || G.mode !== 'off' || G.over) { return; }
    lsSet(OKEY, { ucis: G.ucis, my: G.my, level: G.level, timed: G.timed, clk: G.clk, setup: G.setup });
  }
  function resumeOffline() {
    var o = lsGet(OKEY);
    if (!o) { return; }
    var botName = 'Bot ' + LV[o.level - 1];
    G = mkGame({ mode: 'off', my: o.my, level: o.level, timed: o.timed, setup: o.setup,
      white: { n: o.my === 'w' ? 'Anda' : botName }, black: { n: o.my === 'b' ? 'Anda' : botName } });
    rebuildMoves(o.ucis);
    if (o.clk) { G.clk = o.clk; }
    G.clkAt = Date.now(); G.ticking = (G.timed && G.ucis.length >= 2) ? G.s.t : '';
    replaceAll([home, gameScreen()]);
    checkEndOffline();
    botTurn();
  }
  function checkEndOffline() {
    var st = C.status(G.s, G.hist, curLegal());
    if (st) { finish(st.kind, st.winner); return true; }
    return false;
  }
  function clockMove(mover) {
    if (!G.timed) { return; }
    var now = Date.now();
    if (G.ticking === mover) { G.clk[mover] -= (now - G.clkAt); if (G.clk[mover] < 0) { G.clk[mover] = 0; } }
    G.clkAt = now;
    G.ticking = G.ucis.length >= 2 ? G.s.t : '';
  }
  function offlineMove(u) {   // dipakai pemain & bot
    var mover = G.s.t;
    if (!applyUci(u)) { return false; }
    clockMove(mover);
    saveOffline();
    if (!checkEndOffline()) { botTurn(); }
    return true;
  }
  function botTurn() {
    if (!G || G.mode !== 'off' || G.over || G.s.t === G.my || G.thinking) { return; }
    G.thinking = true; drawGame();
    var g = G;
    setTimeout(function () {
      if (G !== g || g.over) { return; }
      var m = AI.choose(g.s, g.level, g.hist);
      g.thinking = false;
      if (!m) { checkEndOffline(); drawGame(); return; }
      offlineMove(C.uci(m));
      vib(60); gameSoft(); drawGame();
    }, 60);
  }

  // ------------------------------------------------------------------ game: online
  function cancelNet() {
    Net.sid++;
    if (Net.seek) { Net.seek.abort(); Net.seek = null; }
    if (Net.ev) { Net.ev.abort(); Net.ev = null; }
  }
  function netFail(err) {
    cancelNet();
    if (cur && cur.isSearch) { pop(); }
    toast(err && err.msg ? err.msg : 'Gagal terhubung', 3500);
  }
  function searchScreen(title, sub) {
    var s = makeScreen({
      title: title, sub: sub, csk: '', rsk: 'Batal', isSearch: true, empty: 'Menghubungi Lichess...\nMohon tunggu',
      build: function () { this.rows = []; },
      right: function () { cancelNet(); pop(); },
      back: function () { cancelNet(); pop(); }
    });
    return s;
  }
  function openEvents(sid) {
    if (Net.ev) { Net.ev.abort(); }
    Net.ev = Li.events(function (o) {
      if (sid !== Net.sid) { return; }
      if (o.type === 'gameStart' && o.game) { joinGame(o.game.gameId || o.game.id); }
    }, function (e) {
      if (sid !== Net.sid) { return; }
      setTimeout(function () { if (sid === Net.sid) { openEvents(sid); } }, 2000);
    });
  }
  function needToken() { if (!set.token) { toast('Isi token Lichess di Pengaturan'); return true; } return false; }

  function startRapid() {
    if (needToken()) { return; }
    cancelNet();
    var sid = Net.sid;
    push(searchScreen('Rapid 10+0', set.rated ? 'Mencari lawan (rated)' : 'Mencari lawan (casual)'));
    Li.account(function (err, acc) {
      if (sid !== Net.sid) { return; }
      if (err) { netFail(err); return; }
      Net.me = acc.id;
      Li.playing(function (err2, pl) {
        if (sid !== Net.sid) { return; }
        if (!err2 && pl && pl.nowPlaying && pl.nowPlaying.length) { joinGame(pl.nowPlaying[0].gameId || pl.nowPlaying[0].id); return; }
        openEvents(sid);
        Net.seek = Li.seek(set.rated, function () { }, function (e) { if (sid === Net.sid && e) { netFail(e); } });
      });
    });
  }
  function startLiAi(level, color) {
    if (needToken()) { return; }
    cancelNet();
    var sid = Net.sid;
    push(searchScreen('Bot Lichess', 'Membuat game vs Stockfish ' + level));
    Li.account(function (err, acc) {
      if (sid !== Net.sid) { return; }
      if (err) { netFail(err); return; }
      Net.me = acc.id;
      openEvents(sid);
      Li.challengeAi(level, color, function (e2, g) {
        if (sid !== Net.sid) { return; }
        if (e2) { netFail(e2); return; }
        if (g && g.id) { joinGame(g.id); }
      });
    });
  }
  function joinGame(id) {
    if (!id) { return; }
    if (G && G.gameId === id && !G.over) { return; }
    cancelNet();
    if (Net.gs) { Net.gs.abort(); Net.gs = null; }
    G = mkGame({ mode: 'on', my: 'w', timed: true, gameId: id, white: { n: '...' }, black: { n: '...' } });
    G.msg = 'Memuat game...';
    replaceAll([home, gameScreen()]);
    openGameStream(id);
  }
  function openGameStream(id) {
    var g = G;
    Net.gs = Li.game(id, function (o) { if (G === g) { onGameLine(o); } }, function (e) {
      if (G !== g || g.over) { return; }
      if (e && e.status >= 400 && e.status < 500) { g.msg = e.msg; drawGame(); return; }
      g.msg = 'Menyambung ulang...'; drawGame();
      setTimeout(function () { if (G === g && !g.over) { openGameStream(id); } }, 2000);
    });
  }
  function pname(p) {
    if (!p) { return '?'; }
    if (p.aiLevel) { return 'Stockfish ' + p.aiLevel; }
    return p.name || p.id || 'Anonim';
  }
  function onGameLine(o) {
    if (o.type === 'gameFull') {
      G.white = { n: pname(o.white), r: o.white && o.white.rating };
      G.black = { n: pname(o.black), r: o.black && o.black.rating };
      if (o.black && o.black.id && o.black.id === Net.me) { G.my = 'b'; } else { G.my = 'w'; }
      G.flip = G.my === 'b'; G.cy = 6;
      if (o.initialFen && o.initialFen !== 'startpos' && o.initialFen !== C.START.split(' ')[0] + ' w KQkq - 0 1') {
        G.msg = 'Posisi awal khusus tidak didukung'; drawGame(); return;
      }
      G.msg = '';
      onState(o.state);
    } else if (o.type === 'gameState') { onState(o); }
  }
  function onState(st) {
    if (!st) { return; }
    var list = st.moves ? st.moves.split(' ') : [], i, same = list.length >= G.ucis.length;
    for (i = 0; same && i < G.ucis.length; i++) { if (G.ucis[i] !== list[i]) { same = false; } }
    var before = G.ucis.length;
    if (same) { for (i = G.ucis.length; i < list.length; i++) { applyUci(list[i]); } }
    else { rebuildMoves(list); }
    G.srv = list;
    if (G.ucis.length > before && G.s.t === G.my) { vib(80); }
    if (typeof st.wtime === 'number') { G.clk.w = st.wtime; G.clk.b = st.btime; } else { G.clk.w = G.clk.b = -1; }
    G.clkAt = Date.now();
    G.ticking = (G.ucis.length >= 2 && st.status === 'started') ? G.s.t : '';
    G.drawOff = { w: !!st.wdraw, b: !!st.bdraw };
    if (G.drawOff[G.my === 'w' ? 'b' : 'w'] && !G.over) { toast('Lawan menawarkan remis (Menu)', 3500); }
    G.sel = -1; G.targets = [];
    if (st.status && st.status !== 'started' && st.status !== 'created') {
      var k = st.status, w = st.winner === 'white' ? 'w' : (st.winner === 'black' ? 'b' : '');
      finish(k, w);
    }
    gameSoft(); drawGame();
  }
  function onlineMove(u) {
    if (!applyUci(u)) { return; }
    G.ticking = G.ucis.length >= 2 ? G.s.t : '';
    G.clkAt = Date.now();
    var g = G;
    Li.move(g.gameId, u, function (err) {
      if (G !== g || !err) { return; }
      toast(err.msg, 3000);
      rebuildMoves(g.srv); drawGame();
    });
  }

  // ------------------------------------------------------------------ game: input
  function sqAt(cx, cy) { return G.flip ? cy * 8 + (7 - cx) : (7 - cy) * 8 + cx; }
  function gameScreen() {
    return { game: true, rows: [], enter0: function () { }, close: function () { gameClose(); } };
  }
  function gameClose() {
    if (Net.gs) { Net.gs.abort(); Net.gs = null; }
    cancelNet();
    if (G && G.mode === 'off') { saveOffline(); }
    G = null;
  }
  function gameSoft() {
    if (!G || !cur || !cur.game || modal) { return; }
    if (G.over) { setSoft('Menu', 'OK', ''); }
    else if (G.promo) { setSoft('', 'PILIH', 'Batal'); }
    else { setSoft('Menu', G.sel >= 0 ? 'PINDAH' : 'PILIH', G.sel >= 0 ? 'Batal' : 'Langkah'); }
  }
  function myTurn() { return G && !G.over && G.s.t === G.my && !G.thinking && !!G.white && G.ucis.length >= 0 && !(G.mode === 'on' && G.white.n === '...'); }
  function selectAt(sq) {
    var lg = curLegal(), t = [];
    for (var i = 0; i < lg.length; i++) { if (lg[i].f === sq) { t.push(lg[i]); } }
    G.sel = sq; G.targets = t;
  }
  function gameKey(k) {
    if (!G) { return; }
    if (G.over) {
      if (k === 'OK' || k === 'L' || k === 'BACK') { pushGameMenu(); }
      else if (k === 'R') { pushMoves(); }
      return;
    }
    if (G.promo) {
      var p = G.promo;
      if (k === 'LT' || k === 'U') { p.i = (p.i + 3) % 4; } else if (k === 'RT' || k === 'D') { p.i = (p.i + 1) % 4; }
      else if (k === 'OK') { var m = p.moves[p.i]; G.promo = null; doMove(C.uci(m)); return; }
      else if (k === 'R' || k === 'BACK') { G.promo = null; }
      drawGame(); gameSoft(); return;
    }
    if (k === 'U') { if (G.cy > 0) { G.cy--; } } else if (k === 'D') { if (G.cy < 7) { G.cy++; } }
    else if (k === 'LT') { if (G.cx > 0) { G.cx--; } } else if (k === 'RT') { if (G.cx < 7) { G.cx++; } }
    else if (k === 'L') { pushGameMenu(); return; }
    else if (k === 'R') { if (G.sel >= 0) { G.sel = -1; G.targets = []; } else { pushMoves(); return; } }
    else if (k === 'BACK') { gameBack(); return; }
    else if (k === 'OK') { cellAction(); }
    else if (k === '5') { cellAction(); }
    gameSoft(); drawGame();
  }
  function gameBack() {
    if (!G) { return; }
    if (G.promo) { G.promo = null; drawGame(); return; }
    if (G.sel >= 0) { G.sel = -1; G.targets = []; gameSoft(); drawGame(); } else { pushGameMenu(); }
  }
  function cellAction() {
    if (!myTurn()) { toast(G.thinking ? 'Bot sedang berpikir...' : 'Bukan giliran Anda', 1200); return; }
    var sq = sqAt(G.cx, G.cy), p = G.s.b[sq], i;
    if (G.sel >= 0) {
      var cands = [];
      for (i = 0; i < G.targets.length; i++) { if (G.targets[i].t === sq) { cands.push(G.targets[i]); } }
      if (cands.length === 1) { doMove(C.uci(cands[0])); return; }
      if (cands.length > 1) { G.promo = { moves: cands, i: 0 }; return; }
    }
    if (p !== '' && C.colorOf(p) === G.my && sq !== G.sel) {
      selectAt(sq);
      if (G.targets.length === 0) { toast('Bidak tidak bisa bergerak', 1200); G.sel = -1; }
    } else { G.sel = -1; G.targets = []; }
  }
  function doMove(u) {
    G.sel = -1; G.targets = [];
    if (G.mode === 'off') { offlineMove(u); } else { onlineMove(u); }
    gameSoft(); drawGame();
  }

  // ------------------------------------------------------------------ menu game & daftar langkah
  function pushGameMenu() {
    var g = G;
    var s = makeScreen({
      title: 'Menu Game', csk: 'PILIH',
      build: function () {
        var r = [];
        if (!g.over) { r.push(row('Lanjutkan', null, null, 'back')); }
        if (g.mode === 'on' && !g.over) {
          if (g.drawOff[g.my === 'w' ? 'b' : 'w']) { r.push(row('Terima tawaran remis', null, null, 'drawyes')); }
          else if (g.ucis.length >= 2) { r.push(row('Tawarkan remis', null, null, 'draw')); }
        }
        r.push(row('Daftar langkah', null, g.ucis.length + ' langkah', 'moves'));
        r.push(row('Putar papan', null, null, 'flip'));
        if (g.mode === 'off' && !g.over && g.ucis.length > 0) { r.push(row('Batalkan langkah', null, null, 'undo')); }
        if (!g.over) {
          if (g.mode === 'on' && g.ucis.length < 2) { r.push(row('Batalkan game', null, null, 'abort')); }
          else { r.push(row('Menyerah', null, null, 'resign')); }
        } else { r.push(row(g.mode === 'off' ? 'Main lagi' : 'Cari lawan lagi', null, null, 'again')); }
        r.push(row('Keluar ke menu', null, g.mode === 'on' && !g.over ? 'Game online tetap berjalan' : null, 'exit'));
        this.rows = r;
      },
      enter: function (r) {
        if (G !== g) { pop(); return; }
        var id = r.id;
        if (id === 'back') { pop(); }
        else if (id === 'moves') { pushMoves(); }
        else if (id === 'flip') { g.flip = !g.flip; g.cx = 7 - g.cx; g.cy = 7 - g.cy; pop(); }
        else if (id === 'undo') {
          if (g.thinking) { toast('Tunggu bot selesai'); return; }
          var n = g.s.t === g.my ? 2 : 1, list = g.ucis.slice(0, Math.max(0, g.ucis.length - n));
          rebuildMoves(list); g.ticking = (g.timed && g.ucis.length >= 2) ? g.s.t : ''; g.clkAt = Date.now(); saveOffline(); pop(); botTurn();
        }
        else if (id === 'draw') { Li.draw(g.gameId, true, function (e) { toast(e ? e.msg : 'Tawaran remis dikirim', 2500); }); pop(); }
        else if (id === 'drawyes') { Li.draw(g.gameId, true, function (e) { if (e) { toast(e.msg, 2500); } }); pop(); }
        else if (id === 'abort') { ask('Batalkan game ini?', function () { Li.abort(g.gameId, function (e) { if (e) { toast(e.msg, 2500); } }); pop(); }); }
        else if (id === 'resign') {
          ask('Menyerah?', function () {
            if (g.mode === 'off') { finish('resign', g.my === 'w' ? 'b' : 'w'); } else { Li.resign(g.gameId, function (e) { if (e) { toast(e.msg, 2500); } }); }
            pop();
          });
        }
        else if (id === 'again') {
          if (g.mode === 'off') {
            var o = g.setup || { lv: g.level - 1, col: 2, timed: g.timed ? 1 : 0 };
            var my = o.col === 0 ? 'w' : (o.col === 1 ? 'b' : (g.my === 'w' ? 'b' : 'w'));
            startOffline({ my: my, level: g.level, timed: g.timed ? 1 : 0, o: o });
          } else { replaceAll([home]); startRapid(); }
        }
        else if (id === 'exit') { replaceAll([home]); }
      }
    });
    push(s);
  }
  function pushMoves() {
    var g = G;
    var s = makeScreen({
      title: 'Daftar Langkah', csk: '', rsk: 'Kembali', empty: 'Belum ada langkah',
      build: function () {
        var r = [];
        for (var i = 0; i < g.sans.length; i += 2) { r.push(row((i / 2 + 1) + '. ' + g.sans[i] + (g.sans[i + 1] ? '   ' + g.sans[i + 1] : ''), null, null, i)); }
        this.rows = r; this.sub = g.ucis.length + ' langkah';
        if (!this.set) { this.sel = r.length - 1; this.set = true; }
      }
    });
    push(s);
  }

  // ------------------------------------------------------------------ render papan
  var cv = $('bd'), ctx = cv.getContext('2d');
  function sizeCanvas() {
    var w = cv.clientWidth, h = cv.clientHeight;
    if (w && h && (cv.width !== w || cv.height !== h)) { cv.width = w; cv.height = h; }
  }
  window.addEventListener('resize', function () { if (cur && cur.game) { sizeCanvas(); drawGame(); } });
  var BOARD = [['#f0d9b5', '#b58863'], ['#eeeed2', '#769656'], ['#dee3e6', '#8ca2ad']];

  function poly(c, pts, x, y, s) {
    c.beginPath(); c.moveTo(x + pts[0] * s, y + pts[1] * s);
    for (var i = 2; i < pts.length; i += 2) { c.lineTo(x + pts[i] * s, y + pts[i + 1] * s); }
    c.closePath(); c.fill(); c.stroke();
  }
  function circ(c, cx, cy, r, x, y, s) { c.beginPath(); c.arc(x + cx * s, y + cy * s, r * s, 0, 6.2832); c.fill(); c.stroke(); }
  function drawPiece(c, p, x, y, s) {
    var white = p < 'a', u = p.toUpperCase();
    c.fillStyle = white ? '#fafafa' : '#1c1c1c'; c.strokeStyle = white ? '#111' : '#e8e8e8';
    c.lineWidth = Math.max(1, s / 22); c.lineJoin = 'round';
    poly(c, [.26, .86, .26, .76, .74, .76, .74, .86], x, y, s);
    if (u === 'P') { poly(c, [.36, .76, .42, .46, .58, .46, .64, .76], x, y, s); circ(c, .5, .34, .14, x, y, s); }
    else if (u === 'R') { poly(c, [.32, .76, .34, .38, .66, .38, .68, .76], x, y, s); poly(c, [.26, .38, .26, .16, .37, .16, .37, .25, .45, .25, .45, .16, .55, .16, .55, .25, .63, .25, .63, .16, .74, .16, .74, .38], x, y, s); }
    else if (u === 'N') { poly(c, [.28, .76, .30, .56, .22, .50, .44, .22, .44, .13, .52, .19, .60, .13, .64, .26, .74, .52, .72, .76], x, y, s); c.fillStyle = white ? '#111' : '#eee'; c.beginPath(); c.arc(x + .46 * s, y + .30 * s, .03 * s, 0, 6.2832); c.fill(); }
    else if (u === 'B') { poly(c, [.34, .76, .42, .44, .58, .44, .66, .76], x, y, s); c.beginPath(); c.ellipse ? c.ellipse(x + .5 * s, y + .32 * s, .12 * s, .17 * s, 0, 0, 6.2832) : c.arc(x + .5 * s, y + .32 * s, .13 * s, 0, 6.2832); c.fill(); c.stroke(); circ(c, .5, .13, .045, x, y, s); }
    else if (u === 'Q') { poly(c, [.28, .76, .22, .30, .36, .50, .5, .22, .64, .50, .78, .30, .72, .76], x, y, s); circ(c, .22, .26, .05, x, y, s); circ(c, .5, .17, .05, x, y, s); circ(c, .78, .26, .05, x, y, s); }
    else { poly(c, [.30, .76, .26, .44, .36, .36, .64, .36, .74, .44, .70, .76], x, y, s); poly(c, [.46, .10, .54, .10, .54, .17, .61, .17, .61, .25, .54, .25, .54, .36, .46, .36, .46, .25, .39, .25, .39, .17, .46, .17], x, y, s); }
  }

  function bar(c, W, y, h, name, rating, status, clock, active) {
    c.fillStyle = '#262421'; c.fillRect(0, y, W, h);
    c.fillStyle = active ? '#9c6' : '#555'; c.beginPath(); c.arc(8, y + h / 2, 4, 0, 6.2832); c.fill();
    c.font = 'bold 12px Arial'; c.textBaseline = 'middle'; c.textAlign = 'left'; c.fillStyle = '#fff';
    var nm = name || ''; if (nm.length > 12) { nm = nm.substr(0, 11) + '.'; }
    var label = nm + (rating ? ' (' + rating + ')' : '');
    c.fillText(label, 17, y + h / 2 + 1);
    if (status) {
      var lw = c.measureText(label).width;
      c.font = '11px Arial'; c.fillStyle = '#ffcc66'; c.fillText(status, 24 + lw, y + h / 2 + 1);
    }
    if (clock) {
      c.font = 'bold 13px Arial'; var cw = c.measureText(clock).width + 10;
      c.fillStyle = active ? '#629924' : '#3a3835'; c.fillRect(W - cw - 4, y + 2, cw, h - 4);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.fillText(clock, W - cw / 2 - 4, y + h / 2 + 1); c.textAlign = 'left';
    }
  }

  function drawGame() {
    if (!G || !cur || !cur.game) { return; }
    var W = cv.width, H = cv.height, c = ctx, barH = 22;
    c.fillStyle = '#161512'; c.fillRect(0, 0, W, H);
    var cell = Math.floor(Math.min(W / 8, (H - 2 * barH) / 8)), bw = cell * 8, bx = Math.floor((W - bw) / 2), by = barH + Math.floor((H - 2 * barH - bw) / 2);
    var th = BOARD[set.theme] || BOARD[1], i, j;
    var chk = C.inCheck(G.s) ? C.kingSq(G.s.b, G.s.t) : -1;
    for (j = 0; j < 8; j++) {
      for (i = 0; i < 8; i++) {
        var sq = sqAt(i, j), x = bx + i * cell, y = by + j * cell, light = (((sq >> 3) + (sq & 7)) & 1) === 1;
        c.fillStyle = light ? th[0] : th[1]; c.fillRect(x, y, cell, cell);
        if (G.last && (sq === G.last.f || sq === G.last.t)) { c.fillStyle = 'rgba(255,225,60,.5)'; c.fillRect(x, y, cell, cell); }
        if (sq === chk) { c.fillStyle = 'rgba(230,30,30,.6)'; c.fillRect(x, y, cell, cell); }
        if (sq === G.sel) { c.fillStyle = 'rgba(40,150,255,.55)'; c.fillRect(x, y, cell, cell); }
        var p = G.s.b[sq];
        if (p !== '') { drawPiece(c, p, x, y, cell); }
        c.font = '8px Arial'; c.textBaseline = 'top'; c.fillStyle = light ? th[1] : th[0];
        if (i === 0) { c.textAlign = 'left'; c.fillText('' + ((sq >> 3) + 1), x + 1, y + 1); }
        if (j === 7) { c.textAlign = 'right'; c.fillText(String.fromCharCode(97 + (sq & 7)), x + cell - 1, y + cell - 9); }
      }
    }
    c.textAlign = 'left';
    for (i = 0; i < G.targets.length; i++) {
      var t = G.targets[i].t, tx, ty, col = 0, row2 = 0;
      for (j = 0; j < 8; j++) { for (var q = 0; q < 8; q++) { if (sqAt(q, j) === t) { col = q; row2 = j; } } }
      tx = bx + col * cell; ty = by + row2 * cell;
      c.beginPath();
      if (G.targets[i].x !== '') { c.strokeStyle = 'rgba(200,30,30,.9)'; c.lineWidth = 3; c.arc(tx + cell / 2, ty + cell / 2, cell / 2 - 3, 0, 6.2832); c.stroke(); }
      else { c.fillStyle = 'rgba(30,110,30,.75)'; c.arc(tx + cell / 2, ty + cell / 2, cell / 7, 0, 6.2832); c.fill(); }
    }
    if (!G.over && !G.promo) {
      c.strokeStyle = '#00e5ff'; c.lineWidth = 2; c.strokeRect(bx + G.cx * cell + 1, by + G.cy * cell + 1, cell - 2, cell - 2);
    }
    var opp = G.my === 'w' ? 'b' : 'w', od = opp === 'w' ? G.white : G.black, md = G.my === 'w' ? G.white : G.black;
    var status = G.msg || '';
    if (!status && !G.over) {
      if (G.thinking) { status = 'berpikir...'; }
      else if (G.s.t === G.my) { status = C.inCheck(G.s) ? 'SKAK! Giliran Anda' : 'Giliran Anda'; }
      else { status = C.inCheck(G.s) ? 'Skak!' : ''; }
    }
    var myActive = !G.over && G.s.t === G.my;
    bar(c, W, 0, barH, od.n, od.r, G.s.t === opp && !G.over ? (G.mode === 'on' ? '' : '') : '', G.clk[opp] >= 0 ? dispClock(opp) : '', !G.over && G.s.t === opp);
    bar(c, W, H - barH, barH, md.n, md.r, status, G.clk[G.my] >= 0 ? dispClock(G.my) : '', myActive);
    if (G.promo) { drawBox(c, W, H, 'Promosi bidak', promoLine()); }
    else if (G.over) { drawBox(c, W, H, G.over.title, G.over.reason); }
  }
  function promoLine() {
    var names = ['Menteri', 'Benteng', 'Gajah', 'Kuda'], s = '';
    for (var i = 0; i < 4; i++) { s += (i === G.promo.i ? '[' + names[i] + ']' : names[i]) + ' '; }
    return s;
  }
  function drawBox(c, W, H, a, b) {
    var w = W - 24, h = 54, x = 12, y = Math.floor(H / 2 - h / 2);
    c.fillStyle = 'rgba(0,0,0,.88)'; c.fillRect(x, y, w, h); c.strokeStyle = '#629924'; c.lineWidth = 2; c.strokeRect(x, y, w, h);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; c.font = 'bold 16px Arial'; c.fillText(a, W / 2, y + 17);
    c.font = '12px Arial'; c.fillStyle = '#ccc'; c.fillText(b, W / 2, y + 39); c.textAlign = 'left';
  }

  // jam berjalan
  setInterval(function () {
    if (!G || !cur || !cur.game || G.over) { return; }
    if (G.ticking && G.clk[G.ticking] >= 0) {
      if (G.mode === 'off' && G.clk[G.ticking] - (Date.now() - G.clkAt) <= 0) {
        G.clk[G.ticking] = 0; var loser = G.ticking; G.ticking = ''; finish('timeout', loser === 'w' ? 'b' : 'w'); return;
      }
      drawGame();
    }
  }, 250);

  // sentuh: ketuk petak
  cv.addEventListener('click', function (e) {
    if (!G || modal || G.over || G.promo) { return; }
    var r = cv.getBoundingClientRect(), W = cv.width, H = cv.height, barH = 22;
    var cell = Math.floor(Math.min(W / 8, (H - 2 * barH) / 8)), bw = cell * 8, bx = Math.floor((W - bw) / 2), by = barH + Math.floor((H - 2 * barH - bw) / 2);
    var x = (e.clientX - r.left) * W / r.width - bx, y = (e.clientY - r.top) * H / r.height - by;
    if (x < 0 || y < 0 || x >= bw || y >= bw) { return; }
    G.cx = Math.floor(x / cell); G.cy = Math.floor(y / cell);
    cellAction(); gameSoft(); drawGame();
  });

  // ------------------------------------------------------------------ mulai
  window.CaturApp = { game: function () { return G; }, net: Net, set: set, doKey: function (k) { if (cur.game) { gameKey(k); } } };
  stack = [home]; show(home);
})();
