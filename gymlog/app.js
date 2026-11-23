/* GymLog - pencatat latihan gym untuk KaiOS 3.0
 * Navigasi: D-pad (atas/bawah/kiri/kanan), OK (Enter), Softkey kiri/kanan, Backspace (kembali).
 * Pengujian di browser desktop: F1 = softkey kiri, F2 = softkey kanan (atau klik label di bawah layar).
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Konstanta                                                          */
  /* ------------------------------------------------------------------ */
  var KEY = 'gymlog.v1';
  var GROUPS = ['Dada', 'Punggung', 'Kaki', 'Bahu', 'Lengan', 'Core', 'Lainnya'];
  var DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  var SEED_EX = [
    ['Bench Press', 'Dada'], ['Incline Dumbbell Press', 'Dada'], ['Chest Fly', 'Dada'], ['Push Up', 'Dada'],
    ['Deadlift', 'Punggung'], ['Barbell Row', 'Punggung'], ['Lat Pulldown', 'Punggung'], ['Pull Up', 'Punggung'],
    ['Squat', 'Kaki'], ['Leg Press', 'Kaki'], ['Romanian Deadlift', 'Kaki'], ['Lunges', 'Kaki'], ['Calf Raise', 'Kaki'],
    ['Overhead Press', 'Bahu'], ['Lateral Raise', 'Bahu'], ['Face Pull', 'Bahu'],
    ['Barbell Curl', 'Lengan'], ['Hammer Curl', 'Lengan'], ['Triceps Pushdown', 'Lengan'],
    ['Crunch', 'Core'], ['Leg Raise', 'Core']
  ];
  // Sub-grup otot per grup utama
  var SUBS = {
    Dada: ['Atas', 'Tengah', 'Bawah'],
    Punggung: ['Lats', 'Traps', 'Punggung Bawah'],
    Bahu: ['Belakang (Rear)', 'Samping (Lateral)', 'Depan (Front)'],
    Lengan: ['Lengan Bawah', 'Bisep', 'Trisep'],
    Kaki: ['Betis (Calves)', 'Hamstring', 'Abductor', 'Adductor', 'Glutes', 'Quads'],
    Core: ['Abs', 'Obliques'],
    Lainnya: []
  };
  var SEED_SUB = {
    'Bench Press': 'Tengah', 'Incline Dumbbell Press': 'Atas', 'Chest Fly': 'Tengah', 'Push Up': 'Tengah',
    'Deadlift': 'Punggung Bawah', 'Barbell Row': 'Lats', 'Lat Pulldown': 'Lats', 'Pull Up': 'Lats',
    'Squat': 'Quads', 'Leg Press': 'Quads', 'Romanian Deadlift': 'Hamstring', 'Lunges': 'Quads', 'Calf Raise': 'Betis (Calves)',
    'Overhead Press': 'Depan (Front)', 'Lateral Raise': 'Samping (Lateral)', 'Face Pull': 'Belakang (Rear)',
    'Barbell Curl': 'Bisep', 'Hammer Curl': 'Bisep', 'Triceps Pushdown': 'Trisep',
    'Crunch': 'Abs', 'Leg Raise': 'Abs'
  };
  var SEED_MORE = [
    ['Incline Bench Press', 'Dada', 'Atas'], ['Low-to-High Cable Fly', 'Dada', 'Atas'],
    ['Dumbbell Bench Press', 'Dada', 'Tengah'], ['Pec Deck', 'Dada', 'Tengah'],
    ['Decline Bench Press', 'Dada', 'Bawah'], ['Chest Dip', 'Dada', 'Bawah'], ['High-to-Low Cable Fly', 'Dada', 'Bawah'],
    ['Seated Cable Row', 'Punggung', 'Lats'], ['Dumbbell Row', 'Punggung', 'Lats'],
    ['Barbell Shrug', 'Punggung', 'Traps'], ['Dumbbell Shrug', 'Punggung', 'Traps'],
    ['Back Extension', 'Punggung', 'Punggung Bawah'], ['Good Morning', 'Punggung', 'Punggung Bawah'],
    ['Reverse Fly', 'Bahu', 'Belakang (Rear)'], ['Rear Delt Fly Machine', 'Bahu', 'Belakang (Rear)'],
    ['Cable Lateral Raise', 'Bahu', 'Samping (Lateral)'], ['Upright Row', 'Bahu', 'Samping (Lateral)'],
    ['Front Raise', 'Bahu', 'Depan (Front)'], ['Dumbbell Shoulder Press', 'Bahu', 'Depan (Front)'],
    ['Wrist Curl', 'Lengan', 'Lengan Bawah'], ['Reverse Curl', 'Lengan', 'Lengan Bawah'],
    ['Preacher Curl', 'Lengan', 'Bisep'], ['Incline Dumbbell Curl', 'Lengan', 'Bisep'],
    ['Skull Crusher', 'Lengan', 'Trisep'], ['Overhead Triceps Extension', 'Lengan', 'Trisep'], ['Close Grip Bench Press', 'Lengan', 'Trisep'],
    ['Seated Calf Raise', 'Kaki', 'Betis (Calves)'], ['Leg Curl', 'Kaki', 'Hamstring'],
    ['Hip Abduction Machine', 'Kaki', 'Abductor'], ['Hip Adduction Machine', 'Kaki', 'Adductor'],
    ['Hip Thrust', 'Kaki', 'Glutes'], ['Glute Kickback', 'Kaki', 'Glutes'],
    ['Leg Extension', 'Kaki', 'Quads'], ['Bulgarian Split Squat', 'Kaki', 'Quads'],
    ['Cable Crunch', 'Core', 'Abs'], ['Hanging Knee Raise', 'Core', 'Abs'],
    ['Russian Twist', 'Core', 'Obliques'], ['Side Bend', 'Core', 'Obliques']
  ];
  function seedList() {
    return SEED_EX.map(function (x) { return [x[0], x[1], SEED_SUB[x[0]] || '']; }).concat(SEED_MORE);
  }
  function subOptsOf(g) { return ['Umum'].concat(SUBS[g] || []); }

  var SEED_TPL = [
    ['Push', ['Bench Press', 'Overhead Press', 'Incline Dumbbell Press', 'Lateral Raise', 'Triceps Pushdown']],
    ['Pull', ['Deadlift', 'Barbell Row', 'Lat Pulldown', 'Face Pull', 'Barbell Curl']],
    ['Legs', ['Squat', 'Romanian Deadlift', 'Leg Press', 'Lunges', 'Calf Raise']]
  ];

  /* ------------------------------------------------------------------ */
  /* Util                                                               */
  /* ------------------------------------------------------------------ */
  function $(id) { return document.getElementById(id); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function dstr(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function today() { return dstr(new Date()); }
  function parseD(s) { var p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fmtDate(s) {
    var d = parseD(s);
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear();
  }
  function fmtShort(s) {
    var d = parseD(s);
    var y = d.getFullYear() !== new Date().getFullYear() ? ' ' + d.getFullYear() : '';
    return DAYS[d.getDay()] + ' ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + y;
  }
  function num(n) {
    if (n == null || isNaN(n)) return '0';
    var neg = n < 0;
    n = Math.abs(Math.round(n * 10) / 10);
    var p = String(n).split('.');
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (neg ? '-' : '') + p.join(',');
  }
  function pn(v) { return parseFloat(String(v == null ? '' : v).replace(',', '.')); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function round2(v) { return Math.round(v * 100) / 100; }
  function trim(s) { return String(s).replace(/^\s+|\s+$/g, ''); }
  function timeStr(ms) {
    var s = Math.ceil(ms / 1000);
    return Math.floor(s / 60) + ':' + pad(s % 60);
  }

  /* ------------------------------------------------------------------ */
  /* Data & penyimpanan (localStorage, tanpa server, bekerja offline)   */
  /* ------------------------------------------------------------------ */
  var D = load();

  function seed() {
    var ex = seedList().map(function (x, i) { return { id: 'e' + (i + 1), n: x[0], g: x[1], s: x[2] }; });
    function idOf(n) { for (var i = 0; i < ex.length; i++) { if (ex[i].n === n) { return ex[i].id; } } }
    var tpl = SEED_TPL.map(function (t, i) { return { id: 't' + (i + 1), n: t[0], ex: t[1].map(idOf) }; });
    return { v: 2, ex: ex, tpl: tpl, ses: [], cfg: { rest: 90, step: 2.5, auto: true } };
  }
  function valid(d) {
    return !!(d && d.ex instanceof Array && d.tpl instanceof Array && d.ses instanceof Array);
  }
  // v1 -> v2: beri sub-grup pada gerakan bawaan & tambahkan gerakan bawaan baru (sekali saja)
  function migrate(d) {
    var have = {};
    d.ex.forEach(function (x) { have[String(x.n).toLowerCase()] = x; });
    seedList().forEach(function (x) {
      var cur = have[x[0].toLowerCase()];
      if (cur) { if (cur.s == null && cur.g === x[1]) { cur.s = x[2]; } }
      else { d.ex.push({ id: uid(), n: x[0], g: x[1], s: x[2] }); }
    });
    d.v = 2;
  }
  function normalize(d) {
    if (!(d.v >= 2)) { migrate(d); }
    d.ex.forEach(function (x) {
      if (typeof x.s !== 'string' || (SUBS[x.g] || []).indexOf(x.s) < 0) { x.s = ''; }
    });
    d.cfg = d.cfg || {};
    if (!(d.cfg.rest > 0)) { d.cfg.rest = 90; }
    if (!(d.cfg.step > 0)) { d.cfg.step = 2.5; }
    if (d.cfg.auto !== false) { d.cfg.auto = true; }
    var tdy = today();
    d.ses.forEach(function (s) {
      s.items = s.items || [];
      s.items.forEach(function (it) { it.s = it.s || []; });
      // sesi hari sebelumnya yang belum ditandai selesai ditutup otomatis
      if (!s.fin && s.d < tdy) { s.fin = s.lt || s.st || parseD(s.d).getTime(); }
    });
    return d;
  }
  function load() {
    try {
      var s = localStorage.getItem(KEY);
      if (s) {
        var d = JSON.parse(s);
        if (valid(d)) { return normalize(d); }
      }
    } catch (e) { /* abaikan, pakai data awal */ }
    return seed();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(D)); }
    catch (e) { toast('Gagal menyimpan data!'); }
  }

  /* ------------------------------------------------------------------ */
  /* Akses data & perhitungan                                           */
  /* ------------------------------------------------------------------ */
  function exById(id) { for (var i = 0; i < D.ex.length; i++) { if (D.ex[i].id === id) { return D.ex[i]; } } return null; }
  function exName(id) { var e = exById(id); return e ? e.n : '(dihapus)'; }
  function tplById(id) { for (var i = 0; i < D.tpl.length; i++) { if (D.tpl[i].id === id) { return D.tpl[i]; } } return null; }
  function ses(id) { for (var i = 0; i < D.ses.length; i++) { if (D.ses[i].id === id) { return D.ses[i]; } } return null; }
  function sesByDate(d) { for (var i = 0; i < D.ses.length; i++) { if (D.ses[i].d === d) { return D.ses[i]; } } return null; }
  function findItem(s, exId) { for (var i = 0; i < s.items.length; i++) { if (s.items[i].e === exId) { return s.items[i]; } } return null; }
  function sortedSes() {
    return D.ses.slice().sort(function (a, b) {
      if (a.d !== b.d) { return a.d < b.d ? 1 : -1; }
      return a.id < b.id ? 1 : -1;
    });
  }
  function itemVol(it) { var v = 0; it.s.forEach(function (x) { v += x.w * x.r; }); return v; }
  function sesVol(s) { var v = 0; s.items.forEach(function (it) { v += itemVol(it); }); return v; }
  function setCount(s) { var n = 0; s.items.forEach(function (it) { n += it.s.length; }); return n; }
  function e1rm(x) { return x.r <= 1 ? x.w : x.w * (1 + x.r / 30); }   // rumus Epley

  function prs() {
    var m = {};
    D.ses.forEach(function (s) {
      s.items.forEach(function (it) {
        var p = m[it.e];
        if (!p) { p = m[it.e] = { maxW: 0, maxWr: 0, best1: 0, b1w: 0, b1r: 0, bestV: 0, bvw: 0, bvr: 0, vol: 0, sets: 0 }; }
        it.s.forEach(function (x) {
          var v = x.w * x.r, o = e1rm(x);
          p.sets++; p.vol += v;
          if (x.w > p.maxW || (x.w === p.maxW && x.r > p.maxWr)) { p.maxW = x.w; p.maxWr = x.r; }
          if (o > p.best1) { p.best1 = o; p.b1w = x.w; p.b1r = x.r; }
          if (v > p.bestV) { p.bestV = v; p.bvw = x.w; p.bvr = x.r; }
        });
      });
    });
    return m;
  }
  function lastSet(exId) {
    var all = sortedSes();
    for (var i = 0; i < all.length; i++) {
      var it = findItem(all[i], exId);
      if (it && it.s.length) { return it.s[it.s.length - 1]; }
    }
    return null;
  }
  function isUsed(exId) {
    return D.ses.some(function (s) { return !!findItem(s, exId); });
  }
  function subIdx(x) { var i = (SUBS[x.g] || []).indexOf(x.s || ''); return i < 0 ? 99 : i; }
  function exList(gname, sname) {
    return D.ex.filter(function (x) {
      return (gname === 'Semua' || x.g === gname) && (!sname || x.s === sname);
    }).sort(function (a, b) {
      var ga = GROUPS.indexOf(a.g), gb = GROUPS.indexOf(b.g);
      if (ga !== gb) { return ga - gb; }
      var sa = subIdx(a), sb = subIdx(b);
      if (sa !== sb) { return sa - sb; }
      return a.n.toLowerCase() < b.n.toLowerCase() ? -1 : 1;
    });
  }
  // Susun baris gerakan dengan judul per sub-grup (withGroup: judul memuat nama grup)
  function exItems(list, withGroup, mk) {
    var out = [], last = null;
    list.forEach(function (x) {
      var h = '';
      if (withGroup) { h = x.g.toUpperCase() + (x.s ? ' - ' + x.s.toUpperCase() : ''); }
      else if ((SUBS[x.g] || []).length) { h = (x.s || 'Umum').toUpperCase(); }
      if (h && h !== last) { out.push({ hd: 1, t: h }); }
      last = h;
      out.push(mk(x));
    });
    return out;
  }
  function mondayOf(dt) {
    var d = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }
  function weekStats(start) {
    var a = dstr(start), e = new Date(start.getTime());
    e.setDate(e.getDate() + 6);
    var b = dstr(e), r = { n: 0, sets: 0, vol: 0, g: {}, sg: {} };
    D.ses.forEach(function (s) {
      if (s.d < a || s.d > b) { return; }
      r.n++;
      s.items.forEach(function (it) {
        var ex = exById(it.e), g = ex ? ex.g : 'Lainnya', v = itemVol(it), sk = g + '|' + ((ex && ex.s) || 'Umum');
        r.sets += it.s.length; r.vol += v; r.g[g] = (r.g[g] || 0) + v; r.sg[sk] = (r.sg[sk] || 0) + v;
      });
    });
    return r;
  }

  /* ------------------------------------------------------------------ */
  /* Timer istirahat                                                    */
  /* ------------------------------------------------------------------ */
  var T = { dur: D.cfg.rest, left: D.cfg.rest * 1000, running: false, end: 0, done: false, doneAt: 0 };

  function tStart() { T.running = true; T.done = false; T.end = Date.now() + T.left; }
  function tPause() { T.left = Math.max(0, T.end - Date.now()); T.running = false; }
  function tReset() { T.running = false; T.done = false; T.left = T.dur * 1000; }
  function tAdd(sec) {
    if (T.running) { T.end += sec * 1000; T.left = T.end - Date.now(); }
    else { T.left += sec * 1000; }
  }
  function startRest(sec) { T.dur = sec; T.left = sec * 1000; tStart(); }

  function beep() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { return; }
      var c = new AC();
      [0, 0.25, 0.5].forEach(function (t) {
        var o = c.createOscillator(), g = c.createGain();
        o.frequency.value = 880; g.gain.value = 0.25;
        o.connect(g); g.connect(c.destination);
        o.start(c.currentTime + t); o.stop(c.currentTime + t + 0.15);
      });
      setTimeout(function () { try { c.close(); } catch (e) { /* abaikan */ } }, 1500);
    } catch (e) { /* abaikan */ }
  }
  function alarm() {
    toast('Istirahat selesai!');
    try { if (navigator.vibrate) { navigator.vibrate([300, 120, 300, 120, 300]); } } catch (e) { /* abaikan */ }
    beep();
  }
  function tick() {
    if (T.running) {
      T.left = T.end - Date.now();
      if (T.left <= 0) { T.left = 0; T.running = false; T.done = true; T.doneAt = Date.now(); alarm(); }
    }
    if (T.done && Date.now() - T.doneAt > 8000) { T.done = false; }
    updateBadge();
    var e = top();
    if (e && e.d && e.d.timerView) {
      elBig.textContent = timeStr(T.left);
      elC.textContent = timerCenter();
      elSub.textContent = timerSub();
    }
  }
  function timerCenter() { return T.running ? 'JEDA' : (T.left > 0 ? 'MULAI' : 'ULANG'); }
  function timerSub() { return T.running ? 'Berjalan...' : (T.done ? 'Selesai! Lanjut set berikutnya' : '< Atur waktu >  (' + T.dur + ' dtk)'); }
  function updateBadge() {
    if (T.running || T.done) {
      elBadge.style.display = 'inline-block';
      elBadge.textContent = T.running ? 'T ' + timeStr(T.left) : 'T 0:00';
    } else {
      elBadge.style.display = 'none';
    }
  }

  /* ------------------------------------------------------------------ */
  /* Kerangka UI: tumpukan layar, render, navigasi                      */
  /* ------------------------------------------------------------------ */
  var elBack = $('back');
  elBack.addEventListener('click', function () { if (!dlg) { back(); } });
  var elTitle = $('title'), elBadge = $('badge'), elSub = $('sub'), elBig = $('big'), elList = $('list');
  var elL = $('sk-l'), elC = $('sk-c'), elR = $('sk-r'), elToast = $('toast'), elDlg = $('dlg'), elDlgMsg = $('dlgmsg');
  var stack = [];
  var dlg = null;
  var toastTimer = null;

  function top() { return stack[stack.length - 1]; }
  function go(build, st) { stack.push({ build: build, idx: 0, st: st || {}, d: null }); render(); }
  function back() {
    if (stack.length > 1) { stack.pop(); render(); }
    else { try { window.close(); } catch (e) { /* abaikan */ } }
  }
  function replace(build, st) { stack.pop(); go(build, st); }
  function popTo(n) { stack.length = n; render(); }

  function toast(msg) {
    elToast.textContent = msg;
    elToast.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { elToast.style.display = 'none'; }, 1800);
  }

  function confirmBox(msg, yes) {
    dlg = { yes: yes };
    elDlgMsg.textContent = msg;
    elDlg.style.display = 'flex';
    elL.textContent = 'Batal'; elC.textContent = 'YA'; elR.textContent = '';
  }
  function closeDlg() {
    dlg = null;
    elDlg.style.display = 'none';
    var e = top();
    if (e && e.d) { setSoft(e.d); }
  }

  function setSoft(d) {
    elL.textContent = d.left ? d.left.l : '';
    elC.textContent = d.center || '';
    elR.textContent = d.right ? d.right.l : (stack.length > 1 ? 'Kembali' : '');
  }

  function buildRow(e, it, i) {
    var d = e.d;
    var r = document.createElement('div');
    r.className = 'row' + (it.f ? ' field' : '') + (it.hd ? ' hd' : '') + (i === e.idx ? ' sel' : '');
    function add(cls, text) {
      var x = document.createElement('div');
      x.className = cls; x.textContent = text;
      r.appendChild(x);
      return x;
    }
    if (it.hd) {
      r.textContent = it.t;
      return r;
    }
    if (it.f) {
      var f = it.f;
      add('lab', f.label);
      if (f.type === 'choice') {
        var ci = e.st[f.k] || 0;
        add('val', '< ' + f.options[ci] + ' >');
      } else {
        var inp = document.createElement('input');
        inp.type = f.type === 'num' ? 'number' : 'text';
        if (f.type === 'num') { inp.setAttribute('inputmode', 'decimal'); inp.setAttribute('step', 'any'); }
        else { inp.maxLength = 30; }
        inp.value = e.st[f.k] == null ? '' : e.st[f.k];
        inp.addEventListener('input', function () {
          e.st[f.k] = inp.value;
          if (d.subFn) { elSub.textContent = d.subFn(e.st); }
        });
        r.appendChild(inp);
      }
    } else {
      add('t', it.t);
      if (it.r != null && it.r !== '') { add('r', String(it.r)); }
      if (it.s) { add('s', it.s); }
      if (it.bar != null) {
        var b = document.createElement('div');
        b.className = 'bar'; b.style.width = Math.max(2, Math.round(it.bar * 100)) + '%';
        r.appendChild(b);
      }
    }
    r.addEventListener('click', function (ev) {
      if (it.hd) { return; }
      select(e, i);
      if (!(ev.target && ev.target.tagName === 'INPUT') && !it.f) { enter(e, d, it); }
    });
    return r;
  }

  function render() {
    var e = top();
    if (!e) { return; }
    var d = e.d = e.build(e);
    var items = d.items || [];

    elTitle.textContent = d.title || '';
    elBack.style.display = stack.length > 1 ? 'inline-block' : 'none';
    elSub.textContent = d.sub || '';
    elSub.style.display = (d.sub || d.timerView) ? 'block' : 'none';
    if (d.timerView) { elSub.textContent = timerSub(); }
    elBig.style.display = d.big !== undefined ? 'block' : 'none';
    if (d.big !== undefined) { elBig.textContent = d.big; }

    if (e.idx >= items.length) { e.idx = items.length - 1; }
    if (e.idx < 0) { e.idx = 0; }
    if (items[e.idx] && items[e.idx].hd) {
      for (var k = e.idx; k < items.length; k++) { if (!items[k].hd) { e.idx = k; break; } }
    }

    elList.innerHTML = '';
    if (!items.length) {
      var em = document.createElement('div');
      em.className = 'empty'; em.textContent = d.empty || '';
      elList.appendChild(em);
    }
    items.forEach(function (it, i) { elList.appendChild(buildRow(e, it, i)); });
    setSoft(d);
    if (dlg) { elL.textContent = 'Batal'; elC.textContent = 'YA'; elR.textContent = ''; }
    focusRow(e);
    updateBadge();
  }

  function focusRow(e) {
    var d = e.d, it = d.items && d.items[e.idx], row = elList.children[e.idx];
    if (!it || !row || !d.items.length) {
      if (document.activeElement && document.activeElement.blur) { document.activeElement.blur(); }
      return;
    }
    if (it.f && it.f.type !== 'choice') {
      var inp = row.querySelector('input');
      if (inp) {
        inp.focus();
        try { var l = inp.value.length; inp.setSelectionRange(l, l); } catch (x) { /* input number */ }
      }
    } else if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    var prev = row.previousSibling, pad = prev && /(^| )hd( |$)/.test(prev.className) ? prev.offsetHeight : 0;
    var top = row.offsetTop - pad, bot = row.offsetTop + row.offsetHeight;
    if (top < elList.scrollTop) { elList.scrollTop = top; }
    else if (bot > elList.scrollTop + elList.clientHeight) { elList.scrollTop = bot - elList.clientHeight; }
  }

  function select(e, i) {
    var rows = elList.children;
    if (rows[e.idx]) { rows[e.idx].className = rows[e.idx].className.replace(' sel', ''); }
    e.idx = i;
    if (rows[i]) { rows[i].className += ' sel'; }
    focusRow(e);
  }

  function move(dir) {
    var e = top(), items = e.d.items || [], n = items.length;
    if (!n) { return; }
    var i = e.idx;
    for (var c = 0; c < n; c++) {
      i = (i + dir + n) % n;
      if (!items[i].hd) { select(e, i); return; }
    }
  }

  function enter(e, d, cur) {
    if (d.enter) { d.enter(cur, e.idx); return; }
    if (cur && cur.fn) { cur.fn(cur, e.idx); return; }
    if (cur && cur.f) { if (d.submit) { d.submit(); } else { move(1); } }
  }

  function adjust(e, f, dir) {
    if (f.type === 'choice') {
      var n = f.options.length;
      e.st[f.k] = (((e.st[f.k] || 0) + dir) % n + n) % n;
      if (f.onChange) { f.onChange(); }
    } else if (f.type === 'num') {
      var v = pn(e.st[f.k]);
      if (isNaN(v)) { v = 0; }
      e.st[f.k] = String(Math.max(0, round2(v + dir * f.step)));
    } else {
      return;
    }
    render();
  }

  function softAction(which) {
    if (dlg) {
      if (which === 'l') { closeDlg(); }
      else if (which === 'c') { var y = dlg.yes; closeDlg(); y(); }
      return;
    }
    var e = top(), d = e.d, a = which === 'l' ? d.left : d.right;
    if (which === 'c') { enter(e, d, d.items && d.items[e.idx]); return; }
    if (a && a.fn) { a.fn(d.items && d.items[e.idx], e.idx); }
    else if (which === 'r' && !a && stack.length > 1) { back(); }
  }

  document.addEventListener('keydown', function (ev) {
    var k = ev.key;
    if (dlg) {
      if (k === 'Enter') { ev.preventDefault(); softAction('c'); }
      else if (k === 'SoftLeft' || k === 'F1' || k === 'Backspace' || k === 'Escape') { ev.preventDefault(); closeDlg(); }
      else { ev.preventDefault(); }
      return;
    }
    var e = top(), d = e.d, tgt = ev.target;
    var inInput = !!(tgt && tgt.tagName === 'INPUT');
    var cur = d.items && d.items[e.idx];
    switch (k) {
      case 'SoftLeft': case 'F1': ev.preventDefault(); softAction('l'); return;
      case 'SoftRight': case 'F2': ev.preventDefault(); softAction('r'); return;
      case 'ArrowUp': ev.preventDefault(); move(-1); return;
      case 'ArrowDown': ev.preventDefault(); move(1); return;
      case 'ArrowLeft': case 'ArrowRight':
        var dir = k === 'ArrowLeft' ? -1 : 1;
        if (cur && cur.f) { ev.preventDefault(); adjust(e, cur.f, dir); }
        else if (d.onLR) { ev.preventDefault(); d.onLR(dir, e); }
        else if (dir === -1 && !inInput && stack.length > 1) { ev.preventDefault(); back(); }   // panah kiri = kembali
        return;
      case 'Enter': ev.preventDefault(); enter(e, d, cur); return;
      case 'Backspace':
        if (inInput && tgt.value !== '') { return; }   // hapus karakter seperti biasa
        ev.preventDefault(); back(); return;
      case 'Escape': case 'BrowserBack': case 'GoBack': ev.preventDefault(); back(); return;
      case '#':
        if (!inInput && d.hash) { ev.preventDefault(); go(timerBuild); }
        return;
      default:
        if (!inInput && d.onKey && d.onKey(k)) { ev.preventDefault(); return; }
        if (!inInput && d.numKeys && /^[1-9]$/.test(k)) {
          var i = parseInt(k, 10) - 1;
          if (d.items[i]) { select(e, i); enter(e, d, d.items[i]); }
        }
    }
  });

  elL.addEventListener('click', function () { softAction('l'); });
  elC.addEventListener('click', function () { softAction('c'); });
  elR.addEventListener('click', function () { softAction('r'); });

  /* ------------------------------------------------------------------ */
  /* Layar: Beranda                                                     */
  /* ------------------------------------------------------------------ */
  function homeBuild() {
    var t = today(), s = sesByDate(t);
    return {
      title: 'GymLog',
      sub: fmtDate(t) + (s ? ' | ' + num(sesVol(s)) + ' kg' : ''),
      numKeys: true, hash: true, center: 'PILIH',
      items: [
        { t: '1. ' + (s ? (s.fin ? 'Sesi Hari Ini (Selesai)' : 'Lanjut Latihan') : 'Mulai Latihan'), fn: startWorkout },
        { t: '2. Riwayat', fn: function () { go(historyBuild); } },
        { t: '3. Rekor Pribadi', fn: function () { go(recordsBuild); } },
        { t: '4. Statistik & Volume', fn: function () { go(statsBuild); } },
        { t: '5. Gerakan', fn: function () { go(exercisesBuild); } },
        { t: '6. Template', fn: function () { go(templatesBuild); } },
        { t: '7. Timer Istirahat', fn: function () { go(timerBuild); } },
        { t: '8. Lainnya', fn: function () { go(moreBuild); } }
      ]
    };
  }

  /* ------------------------------------------------------------------ */
  /* Layar: Mulai latihan & sesi                                        */
  /* ------------------------------------------------------------------ */
  function startWorkout() {
    var s = sesByDate(today());
    if (s) { go(sessionBuild(s.id)); } else { go(chooseBuild); }
  }
  function chooseBuild() {
    var items = [{ t: 'Latihan kosong', s: 'Pilih gerakan sendiri', fn: function () { createSession('', []); } }];
    D.tpl.forEach(function (t) {
      items.push({ t: t.n, s: t.ex.length + ' gerakan', fn: function () { createSession(t.n, t.ex); } });
    });
    return { title: 'Mulai Latihan', sub: fmtDate(today()), items: items, center: 'MULAI' };
  }
  function createSession(name, exIds) {
    var s = {
      id: uid(), d: today(), n: name, st: Date.now(), fin: 0,
      items: exIds.filter(exById).map(function (id) { return { e: id, s: [] }; })
    };
    D.ses.push(s);
    save();
    replace(sessionBuild(s.id));
  }

  function sessionBuild(sid) {
    return function () {
      var s = ses(sid);
      if (!s) { return { title: 'Sesi', items: [], empty: 'Sesi tidak ditemukan' }; }
      var items = s.items.map(function (it) {
        var v = itemVol(it), xe = exById(it.e);
        return {
          t: exName(it.e), r: v ? num(v) + ' kg' : '-',
          s: it.s.length + ' set' + (xe ? ' | ' + xe.g + (xe.s ? ' - ' + xe.s : '') : ''),
          fn: function () { go(itemBuild(sid, it.e)); }
        };
      });
      if (setCount(s) > 0) {
        items.push({
          t: s.fin ? '> Ringkasan sesi' : '> Selesai & Simpan Sesi',
          s: s.fin ? 'Sesi sudah disimpan' : 'Tutup sesi hari ini',
          fn: function () { go(finishBuild(sid)); }
        });
      }
      return {
        title: s.n || 'Latihan',
        sub: fmtShort(s.d) + ' | ' + num(sesVol(s)) + ' kg' + (s.fin ? ' | Selesai' : ''),
        items: items, hash: true, center: 'BUKA',
        empty: 'Belum ada gerakan.\nTekan "+Gerakan"',
        left: { l: '+Gerakan', fn: function () { pickExercise(function (id) { addItem(sid, id); }); } },
        right: { l: 'Opsi', fn: function () { go(sessOptBuild(sid)); } }
      };
    };
  }
  function addItem(sid, exId) {
    var s = ses(sid);
    if (!s) { return; }
    if (!findItem(s, exId)) { s.items.push({ e: exId, s: [] }); save(); }
    go(itemBuild(sid, exId));
  }
  function sessOptBuild(sid) {
    return function () {
      return {
        title: 'Opsi Sesi', center: 'PILIH',
        items: [
          {
            t: (ses(sid) && ses(sid).fin) ? 'Ringkasan & Catatan' : 'Selesai & Simpan Sesi',
            fn: function () {
              var s = ses(sid);
              if (!s || !setCount(s)) { toast('Catat minimal 1 set dulu'); return; }
              go(finishBuild(sid));
            }
          },
          { t: 'Timer Istirahat', fn: function () { go(timerBuild); } },
          {
            t: 'Hapus Sesi Ini', fn: function () {
              confirmBox('Hapus seluruh sesi ini?', function () {
                D.ses = D.ses.filter(function (s) { return s.id !== sid; });
                save(); popTo(1); toast('Sesi dihapus');
              });
            }
          }
        ]
      };
    };
  }

  function durStr(ms) {
    var m = Math.round(ms / 60000);
    if (m < 1) { return '< 1 mnt'; }
    return (m >= 60 ? Math.floor(m / 60) + ' jam ' : '') + (m % 60) + ' mnt';
  }
  // durasi = dari sesi dimulai sampai set terakhir dicatat
  function sesDur(s) {
    var end = s.lt || s.fin;
    return s.st && end && end > s.st ? end - s.st : 0;
  }

  function finishBuild(sid) {
    return function (e) {
      var s = ses(sid);
      if (!s) { return { title: 'Ringkasan', items: [], empty: 'Sesi tidak ditemukan' }; }
      if (!e.st.init) { e.st.init = true; e.st.note = s.note || ''; }
      var done = !!s.fin;
      var doSave = function () {
        if (!setCount(s)) { toast('Catat minimal 1 set dulu'); return; }
        s.note = trim(e.st.note);
        if (!s.fin) { s.fin = Date.now(); }
        save(); tReset(); popTo(1);
        toast(done ? 'Catatan tersimpan' : 'Sesi tersimpan!');
      };
      var dur = sesDur(s);
      return {
        title: done ? 'Ringkasan Sesi' : 'Selesai Latihan',
        sub: fmtShort(s.d) + (s.n ? ' | ' + s.n : ''),
        center: 'SIMPAN', enter: doSave,
        items: [
          { f: { k: 'note', label: 'Catatan (opsional)', type: 'text' } },
          { t: 'Durasi', r: dur ? durStr(dur) : '-' },
          { t: 'Gerakan', r: s.items.filter(function (it) { return it.s.length; }).length },
          { t: 'Total set', r: setCount(s) },
          { t: 'Volume', r: num(sesVol(s)) + ' kg' }
        ],
        left: { l: 'Batal', fn: back },
        right: { l: 'Simpan', fn: doSave }
      };
    };
  }

  function itemBuild(sid, exId) {
    return function () {
      var s = ses(sid), it = s && findItem(s, exId);
      if (!it) { return { title: 'Gerakan', items: [], empty: 'Tidak ditemukan' }; }
      var p = prs()[exId];
      var items = it.s.map(function (x, i) {
        return { t: (i + 1) + '. ' + num(x.w) + ' kg × ' + x.r, r: num(x.w * x.r), fn: function () { go(setFormBuild(sid, exId, i)); } };
      });
      return {
        title: exName(exId),
        sub: 'Volume ' + num(itemVol(it)) + ' kg' + (p && p.sets ? ' | PR ' + num(p.maxW) + ' kg' : ''),
        items: items, hash: true, center: 'EDIT',
        empty: 'Belum ada set.\nTekan "+Set"',
        left: { l: '+Set', fn: function () { go(setFormBuild(sid, exId, -1)); } },
        right: {
          l: 'Hapus', fn: function () {
            confirmBox('Hapus gerakan ini dari sesi?', function () {
              s.items = s.items.filter(function (z) { return z !== it; });
              save(); back();
            });
          }
        }
      };
    };
  }

  function setFormBuild(sid, exId, idx) {
    return function (e) {
      var s = ses(sid), it = s && findItem(s, exId);
      if (!it) { return { title: 'Set', items: [], empty: 'Tidak ditemukan' }; }
      if (!e.st.init) {
        e.st.init = true;
        var src = idx >= 0 ? it.s[idx] : (it.s.length ? it.s[it.s.length - 1] : lastSet(exId));
        e.st.w = src ? String(src.w) : '';
        e.st.r = src ? String(src.r) : '';
      }
      var sub = function (st) { return 'Volume: ' + num((pn(st.w) || 0) * (pn(st.r) || 0)) + ' kg'; };
      var doSave = function () {
        var w = pn(e.st.w), r = pn(e.st.r);
        if (isNaN(w) || w < 0) { toast('Beban tidak valid'); return; }
        if (isNaN(r) || r < 1) { toast('Repetisi minimal 1'); return; }
        var rec = { w: w, r: Math.round(r) }, msg = 'Tersimpan';
        if (idx >= 0) {
          it.s[idx] = rec;
        } else {
          var p = prs()[exId];
          if (p && p.sets && p.best1 > 0 && e1rm(rec) > p.best1) { msg = 'Tersimpan - PR baru!'; }
          it.s.push(rec);
          s.lt = Date.now();
          if (D.cfg.auto) { startRest(D.cfg.rest); }
        }
        save(); back(); toast(msg);
      };
      return {
        title: (idx >= 0 ? 'Edit Set ' + (idx + 1) : 'Set Baru') + ' - ' + exName(exId),
        sub: sub(e.st), subFn: sub, center: 'SIMPAN', submit: doSave,
        items: [
          { f: { k: 'w', label: 'Beban (kg)   kiri/kanan = ubah', type: 'num', step: D.cfg.step } },
          { f: { k: 'r', label: 'Repetisi   kiri/kanan = ubah', type: 'num', step: 1 } }
        ],
        left: { l: 'Batal', fn: back },
        right: idx >= 0 ? { l: 'Hapus', fn: function () { it.s.splice(idx, 1); save(); back(); } } : null
      };
    };
  }

  /* ------------------------------------------------------------------ */
  /* Layar: Pilih gerakan & kelola gerakan kustom                       */
  /* ------------------------------------------------------------------ */
  function groupFilter(e, dir) {
    var n = GROUPS.length + 1;
    e.st.g = (((e.st.g || 0) + dir) % n + n) % n;
    e.st.sg = 0;
    e.idx = 0;
    render();
  }
  // Filter aktif: grup (kiri/kanan) + sub-grup (tombol *)
  function filterOf(e) {
    var gi = e.st.g || 0, gname = gi ? GROUPS[gi - 1] : 'Semua', subs = gi ? (SUBS[gname] || []) : [];
    var si = subs.length ? (e.st.sg || 0) : 0;
    if (si > subs.length) { si = 0; }
    var sname = si ? subs[si - 1] : '';
    var list = exList(gname, sname);
    var label = '< ' + gname + ' >' + (subs.length ? '  [*] ' + (sname || 'Semua sub') : '') + '  (' + list.length + ')';
    return { gi: gi, gname: gname, sname: sname, list: list, label: label };
  }
  function subFilter(e) {
    var gi = e.st.g || 0, subs = gi ? (SUBS[GROUPS[gi - 1]] || []) : [];
    if (!subs.length) { toast('Pilih grup otot dulu (kiri/kanan)'); return; }
    e.st.sg = ((e.st.sg || 0) + 1) % (subs.length + 1);
    e.idx = 0;
    render();
  }
  function starKey(e) {
    return function (k) { if (k === '*') { subFilter(e); return true; } return false; };
  }
  function pickExercise(cb) {
    go(function (e) {
      var F = filterOf(e);
      return {
        title: 'Pilih Gerakan', sub: F.label, center: 'PILIH',
        empty: 'Belum ada gerakan di grup ini.\nTekan "+Baru"',
        items: exItems(F.list, !F.gi, function (x) { return { t: x.n, fn: function () { back(); cb(x.id); } }; }),
        onLR: function (dir) { groupFilter(e, dir); },
        onKey: starKey(e),
        left: {
          l: '+Baru', fn: function () {
            go(exerciseFormBuild(null, function (ne) { back(); cb(ne.id); }));
          }
        },
        right: { l: 'Batal', fn: back }
      };
    });
  }
  function exercisesBuild(e) {
    var F = filterOf(e);
    return {
      title: 'Gerakan', sub: F.label, center: 'EDIT',
      empty: 'Belum ada gerakan di grup ini.',
      items: exItems(F.list, !F.gi, function (x) {
        return { t: x.n, r: x.c ? 'kustom' : '', fn: function () { go(exerciseFormBuild(x.id, null)); } };
      }),
      onLR: function (dir) { groupFilter(e, dir); },
      onKey: starKey(e),
      left: { l: '+Baru', fn: function () { go(exerciseFormBuild(null, null)); } }
    };
  }
  function exerciseFormBuild(id, cb) {
    return function (e) {
      var ex = id ? exById(id) : null;
      if (!e.st.init) {
        e.st.init = true;
        e.st.n = ex ? ex.n : '';
        e.st.g = ex ? Math.max(0, GROUPS.indexOf(ex.g)) : 0;
        e.st.s = ex && ex.s ? Math.max(0, (SUBS[ex.g] || []).indexOf(ex.s) + 1) : 0;
      }
      var doSave = function () {
        var n = trim(e.st.n);
        if (!n) { toast('Nama wajib diisi'); return; }
        var dup = D.ex.some(function (x) { return x.id !== id && x.n.toLowerCase() === n.toLowerCase(); });
        if (dup) { toast('Nama sudah ada'); return; }
        var rec, gname = GROUPS[e.st.g], sub = e.st.s ? ((SUBS[gname] || [])[e.st.s - 1] || '') : '';
        if (ex) { ex.n = n; ex.g = gname; ex.s = sub; rec = ex; }
        else { rec = { id: uid(), n: n, g: gname, s: sub, c: 1 }; D.ex.push(rec); }
        save(); back(); toast('Tersimpan');
        if (cb) { cb(rec); }
      };
      var del = function () {
        if (isUsed(id)) { toast('Dipakai di riwayat, tidak bisa dihapus'); return; }
        confirmBox('Hapus gerakan "' + ex.n + '"?', function () {
          D.ex = D.ex.filter(function (x) { return x.id !== id; });
          D.tpl.forEach(function (t) { t.ex = t.ex.filter(function (x) { return x !== id; }); });
          save(); back(); toast('Dihapus');
        });
      };
      return {
        title: ex ? 'Edit Gerakan' : 'Gerakan Baru', center: 'SIMPAN', submit: doSave,
        items: [
          { f: { k: 'n', label: 'Nama gerakan', type: 'text' } },
          { f: { k: 'g', label: 'Grup otot   kiri/kanan = ubah', type: 'choice', options: GROUPS, onChange: function () { e.st.s = 0; } } },
          { f: { k: 's', label: 'Sub-grup   kiri/kanan = ubah', type: 'choice', options: subOptsOf(GROUPS[e.st.g]) } }
        ],
        left: { l: 'Batal', fn: back },
        right: ex ? { l: 'Hapus', fn: del } : null
      };
    };
  }

  /* ------------------------------------------------------------------ */
  /* Layar: Riwayat, Rekor, Statistik                                   */
  /* ------------------------------------------------------------------ */
  function historyBuild() {
    var items = sortedSes().map(function (s) {
      return {
        t: fmtShort(s.d) + (s.n ? ' | ' + s.n : ''),
        s: setCount(s) + ' set, ' + s.items.length + ' gerakan | ' +
          (s.fin ? (sesDur(s) ? durStr(sesDur(s)) : 'selesai') : 'belum disimpan'),
        r: num(sesVol(s)) + ' kg',
        fn: function () { go(sessionBuild(s.id)); }
      };
    });
    return { title: 'Riwayat', sub: items.length + ' sesi', items: items, empty: 'Belum ada riwayat latihan.', center: 'BUKA' };
  }

  function recordsBuild() {
    var P = prs(), items = [];
    D.ex.slice().sort(function (a, b) { return a.n.toLowerCase() < b.n.toLowerCase() ? -1 : 1; }).forEach(function (x) {
      var p = P[x.id];
      if (!p || !p.sets) { return; }
      items.push({
        t: x.n, s: num(p.maxW) + ' kg × ' + p.maxWr + '  | 1RM ~' + num(p.best1) + ' kg',
        fn: function () { go(recordDetailBuild(x.id)); }
      });
    });
    return { title: 'Rekor Pribadi', sub: items.length + ' gerakan', items: items, empty: 'Belum ada data latihan.', center: 'DETAIL' };
  }
  function recordDetailBuild(exId) {
    return function () {
      var p = prs()[exId];
      if (!p) { return { title: exName(exId), items: [], empty: 'Belum ada data.' }; }
      return {
        title: exName(exId), sub: 'Rekor pribadi',
        items: [
          { hd: 1, t: 'BEBAN TERBERAT' },
          { t: num(p.maxW) + ' kg × ' + p.maxWr, r: '' },
          { hd: 1, t: 'ESTIMASI 1RM (EPLEY)' },
          { t: num(p.best1) + ' kg', s: 'dari ' + num(p.b1w) + ' kg × ' + p.b1r },
          { hd: 1, t: 'SET VOLUME TERBESAR' },
          { t: num(p.bestV) + ' kg', s: num(p.bvw) + ' kg × ' + p.bvr },
          { hd: 1, t: 'TOTAL' },
          { t: 'Jumlah set', r: p.sets },
          { t: 'Volume', r: num(p.vol) + ' kg' }
        ]
      };
    };
  }

  function statsBuild() {
    var m = mondayOf(new Date()), pm = new Date(m.getTime());
    pm.setDate(pm.getDate() - 7);
    var a = weekStats(m), b = weekStats(pm), tot = { n: D.ses.length, sets: 0, vol: 0 };
    D.ses.forEach(function (s) { tot.sets += setCount(s); tot.vol += sesVol(s); });
    var diff = b.vol > 0 ? ((a.vol - b.vol) / b.vol * 100) : null;
    var items = [
      { hd: 1, t: 'MINGGU INI' },
      { t: 'Sesi', r: a.n },
      { t: 'Total set', r: a.sets },
      { t: 'Volume', r: num(a.vol) + ' kg' },
      { t: 'Minggu lalu', r: num(b.vol) + ' kg', s: diff === null ? 'Belum ada pembanding' : (diff >= 0 ? '+' : '') + num(diff) + '% dibanding minggu lalu' },
      { hd: 1, t: 'VOLUME PER GRUP (MINGGU INI)' }
    ];
    var maxG = 0;
    GROUPS.forEach(function (g) { if (a.g[g] > maxG) { maxG = a.g[g]; } });
    var any = false;
    GROUPS.forEach(function (g) {
      if (a.g[g] > 0) { any = true; items.push({ t: g, r: num(a.g[g]) + ' kg', bar: a.g[g] / maxG }); }
    });
    if (!any) { items.push({ t: 'Belum ada data minggu ini' }); }
    var keys = Object.keys(a.sg).filter(function (k) { return a.sg[k] > 0; })
      .sort(function (x, y) { return a.sg[y] - a.sg[x]; });
    if (keys.length) {
      items.push({ hd: 1, t: 'VOLUME PER SUB-OTOT (MINGGU INI)' });
      keys.forEach(function (k) {
        var pr = k.split('|');
        items.push({ t: pr[1], s: pr[0], r: num(a.sg[k]) + ' kg', bar: a.sg[k] / a.sg[keys[0]] });
      });
    }
    items.push({ hd: 1, t: 'SEPANJANG WAKTU' });
    items.push({ t: 'Sesi', r: tot.n });
    items.push({ t: 'Total set', r: tot.sets });
    items.push({ t: 'Volume', r: num(tot.vol) + ' kg' });
    return { title: 'Statistik & Volume', sub: 'Minggu mulai ' + fmtShort(dstr(m)), items: items };
  }

  /* ------------------------------------------------------------------ */
  /* Layar: Template latihan                                            */
  /* ------------------------------------------------------------------ */
  function templatesBuild() {
    return {
      title: 'Template', sub: D.tpl.length + ' template', center: 'EDIT',
      empty: 'Belum ada template.\nTekan "+Baru"',
      items: D.tpl.map(function (t) {
        return { id: t.id, t: t.n, r: t.ex.length, s: t.ex.map(exName).join(', '), fn: function () { go(tplEditBuild(t.id)); } };
      }),
      left: { l: '+Baru', fn: function () { go(tplEditBuild(null)); } },
      right: {
        l: 'Hapus', fn: function (it) {
          if (!it) { return; }
          confirmBox('Hapus template ini?', function () {
            D.tpl = D.tpl.filter(function (t) { return t.id !== it.id; });
            save(); render(); toast('Dihapus');
          });
        }
      }
    };
  }
  function tplEditBuild(id) {
    return function (e) {
      var t = id ? tplById(id) : null;
      if (!e.st.init) {
        e.st.init = true;
        e.st.n = t ? t.n : '';
        e.st.order = t ? t.ex.filter(exById) : [];
      }
      var items = [{ f: { k: 'n', label: 'Nama template', type: 'text' } }];
      exItems(exList('Semua'), true, function (x) {
        var on = e.st.order.indexOf(x.id) >= 0;
        return {
          t: (on ? '[x] ' : '[  ] ') + x.n,
          fn: function () {
            if (on) { e.st.order = e.st.order.filter(function (z) { return z !== x.id; }); }
            else { e.st.order.push(x.id); }
            render();
          }
        };
      }).forEach(function (it) { items.push(it); });
      var doSave = function () {
        var n = trim(e.st.n);
        if (!n) { toast('Nama wajib diisi'); return; }
        if (!e.st.order.length) { toast('Pilih minimal 1 gerakan'); return; }
        if (t) { t.n = n; t.ex = e.st.order.slice(); }
        else { D.tpl.push({ id: uid(), n: n, ex: e.st.order.slice() }); }
        save(); back(); toast('Template tersimpan');
      };
      return {
        title: t ? 'Edit Template' : 'Template Baru', sub: e.st.order.length + ' gerakan dipilih',
        center: e.idx === 0 ? 'LANJUT' : 'PILIH', items: items,
        left: { l: 'Batal', fn: back }, right: { l: 'Simpan', fn: doSave }
      };
    };
  }

  /* ------------------------------------------------------------------ */
  /* Layar: Timer istirahat                                             */
  /* ------------------------------------------------------------------ */
  function timerBuild() {
    return {
      title: 'Timer Istirahat', timerView: true, big: timeStr(T.left), center: timerCenter(), items: [],
      left: { l: 'Reset', fn: function () { tReset(); render(); } },
      right: { l: '+15 dtk', fn: function () { tAdd(15); render(); } },
      onLR: function (dir) {
        if (T.running) { return; }
        T.dur = clamp(T.dur + dir * 15, 15, 900);
        T.left = T.dur * 1000; T.done = false;
        render();
      },
      enter: function () {
        if (T.running) { tPause(); }
        else { if (T.left <= 0) { T.left = T.dur * 1000; } tStart(); }
        render();
      }
    };
  }

  /* ------------------------------------------------------------------ */
  /* Layar: Lainnya (pengaturan, backup)                                */
  /* ------------------------------------------------------------------ */
  function moreBuild() {
    return {
      title: 'Lainnya', center: 'PILIH', numKeys: true,
      items: [
        { t: '1. Pengaturan', fn: function () { go(settingsBuild); } },
        { t: '2. Ekspor Data (backup)', fn: exportData },
        { t: '3. Impor Data', fn: importData },
        { t: '4. Hapus Semua Data', fn: resetAll },
        { t: '5. Tentang', fn: function () { toast('GymLog 1.0 - data tersimpan di HP ini'); } }
      ]
    };
  }
  function settingsBuild(e) {
    if (!e.st.init) {
      e.st.init = true;
      e.st.rest = String(D.cfg.rest); e.st.step = String(D.cfg.step); e.st.auto = D.cfg.auto ? 0 : 1;
    }
    var doSave = function () {
      var rest = pn(e.st.rest), step = pn(e.st.step);
      if (isNaN(rest) || rest < 10 || rest > 900) { toast('Istirahat 10-900 detik'); return; }
      if (isNaN(step) || step <= 0 || step > 50) { toast('Kenaikan beban 0.5-50 kg'); return; }
      D.cfg.rest = Math.round(rest); D.cfg.step = step; D.cfg.auto = e.st.auto === 0;
      if (!T.running) { T.dur = D.cfg.rest; T.left = T.dur * 1000; T.done = false; }
      save(); back(); toast('Pengaturan tersimpan');
    };
    return {
      title: 'Pengaturan', center: 'SIMPAN', submit: doSave,
      items: [
        { f: { k: 'rest', label: 'Istirahat default (detik)', type: 'num', step: 15 } },
        { f: { k: 'step', label: 'Kenaikan beban per tekan (kg)', type: 'num', step: 0.5 } },
        { f: { k: 'auto', label: 'Timer otomatis setelah set', type: 'choice', options: ['Ya', 'Tidak'] } }
      ],
      left: { l: 'Batal', fn: back }
    };
  }

  var BACKUP = 'gymlog-backup.json';
  function deviceStore() {
    try { return navigator.getDeviceStorage ? navigator.getDeviceStorage('sdcard') : null; }
    catch (err) { return null; }
  }
  function exportData() {
    var json = JSON.stringify(D, null, 1), ds = deviceStore();
    if (ds) {   // KaiOS 2.5: simpan ke penyimpanan HP
      var blob = new Blob([json], { type: 'application/json' });
      var put = function () {
        var rq = ds.addNamed(blob, BACKUP);
        rq.onsuccess = function () { toast('Backup tersimpan: ' + BACKUP); };
        rq.onerror = function () { toast('Backup gagal' + (rq.error && rq.error.name ? ': ' + rq.error.name : '')); };
      };
      var del = ds.delete(BACKUP);   // timpa backup lama
      del.onsuccess = put; del.onerror = put;
      return;
    }
    try {
      var bl = new Blob([json], { type: 'application/json' });
      var url = URL.createObjectURL(bl), a = document.createElement('a');
      a.href = url; a.download = 'gymlog-backup-' + today() + '.json';
      document.body.appendChild(a); a.click();
      setTimeout(function () { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1500);
      toast('Ekspor dijalankan');
    } catch (err) { toast('Ekspor gagal'); }
  }
  function readBackup(f) {
    var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result);
        if (!valid(d)) { throw new Error('bad'); }
        confirmBox('Timpa data sekarang dengan ' + d.ses.length + ' sesi dari file?', function () {
          D = normalize(d); save(); popTo(1); toast('Impor berhasil');
        });
      } catch (err) { toast('File tidak valid'); }
    };
    r.readAsText(f);
  }
  function importData() {
    var ds = deviceStore();
    if (ds) {
      var rq = ds.get(BACKUP);
      rq.onsuccess = function () { readBackup(rq.result); };
      rq.onerror = function () { toast('File ' + BACKUP + ' tidak ditemukan'); };
      return;
    }
    var inp = document.createElement('input');
    inp.type = 'file'; inp.accept = '.json,application/json';
    inp.onchange = function () {
      var f = inp.files && inp.files[0];
      if (f) { readBackup(f); }
    };
    inp.click();
  }
  function resetAll() {
    confirmBox('Hapus SEMUA data latihan? Tidak bisa dibatalkan.', function () {
      D = seed(); save(); tReset(); popTo(1); toast('Data direset');
    });
  }

  /* ------------------------------------------------------------------ */
  /* Mulai                                                              */
  /* ------------------------------------------------------------------ */
  setInterval(tick, 250);
  go(homeBuild);

  // Dipakai oleh pengujian otomatis di Node/jsdom
  if (typeof window !== 'undefined') { window.__gymlog = { D: function () { return D; }, prs: prs, num: num }; }
})();
