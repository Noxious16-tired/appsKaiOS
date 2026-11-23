/* Mesin aturan catur (ES5). Papan: indeks 0 = a1 ... 63 = h8. Bidak: huruf besar = putih, kecil = hitam. */
var Chess = (function () {
  var START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  var KN = [], KG = [], RAYS = [];
  (function () {
    var KJ = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
    for (var sq = 0; sq < 64; sq++) {
      var f = sq & 7, r = sq >> 3, i, j;
      KN[sq] = []; KG[sq] = []; RAYS[sq] = [];
      for (i = 0; i < 8; i++) {
        var nf = f + KJ[i][0], nr = r + KJ[i][1];
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) { KN[sq].push(nr * 8 + nf); }
        nf = f + DIRS[i][0]; nr = r + DIRS[i][1];
        if (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) { KG[sq].push(nr * 8 + nf); }
        var ray = [];
        nf = f + DIRS[i][0]; nr = r + DIRS[i][1];
        while (nf >= 0 && nf < 8 && nr >= 0 && nr < 8) { ray.push(nr * 8 + nf); nf += DIRS[i][0]; nr += DIRS[i][1]; }
        RAYS[sq].push(ray);
      }
    }
  })();

  function sqOf(n) { return (n.charCodeAt(1) - 49) * 8 + (n.charCodeAt(0) - 97); }
  function sqName(i) { return String.fromCharCode(97 + (i & 7)) + (1 + (i >> 3)); }
  function colorOf(p) { return p === '' ? '' : (p < 'a' ? 'w' : 'b'); }

  function fromFen(fen) {
    var parts = fen.split(' '), b = [], i, j;
    for (i = 0; i < 64; i++) { b.push(''); }
    var rows = parts[0].split('/');
    for (i = 0; i < 8; i++) {
      var rank = 7 - i, f = 0, row = rows[i];
      for (j = 0; j < row.length; j++) {
        var ch = row.charAt(j);
        if (ch >= '1' && ch <= '8') { f += parseInt(ch, 10); } else { b[rank * 8 + f] = ch; f++; }
      }
    }
    return {
      b: b, t: parts[1] || 'w', c: (parts[2] && parts[2] !== '-') ? parts[2] : '',
      ep: (parts[3] && parts[3] !== '-') ? sqOf(parts[3]) : -1,
      hm: parseInt(parts[4] || '0', 10), fm: parseInt(parts[5] || '1', 10)
    };
  }
  function start() { return fromFen(START); }

  function attacked(b, sq, by) {
    var f = sq & 7, r = sq >> 3, i, j, p, ray;
    var w = by === 'w';
    if (w) {
      if (r > 0) {
        if (f > 0 && b[sq - 9] === 'P') { return true; }
        if (f < 7 && b[sq - 7] === 'P') { return true; }
      }
    } else if (r < 7) {
      if (f > 0 && b[sq + 7] === 'p') { return true; }
      if (f < 7 && b[sq + 9] === 'p') { return true; }
    }
    var N = w ? 'N' : 'n', K = w ? 'K' : 'k', B = w ? 'B' : 'b', R = w ? 'R' : 'r', Q = w ? 'Q' : 'q';
    var kn = KN[sq];
    for (i = 0; i < kn.length; i++) { if (b[kn[i]] === N) { return true; } }
    var kg = KG[sq];
    for (i = 0; i < kg.length; i++) { if (b[kg[i]] === K) { return true; } }
    for (i = 0; i < 8; i++) {
      ray = RAYS[sq][i];
      for (j = 0; j < ray.length; j++) {
        p = b[ray[j]];
        if (p !== '') {
          if (p === Q || (i < 4 ? p === R : p === B)) { return true; }
          break;
        }
      }
    }
    return false;
  }

  function kingSq(b, c) {
    var k = c === 'w' ? 'K' : 'k';
    for (var i = 0; i < 64; i++) { if (b[i] === k) { return i; } }
    return -1;
  }

  function addPawn(list, f, t, x, fl, promoRank) {
    if ((t >> 3) === promoRank) {
      list.push({ f: f, t: t, p: 'q', x: x, fl: fl });
      list.push({ f: f, t: t, p: 'r', x: x, fl: fl });
      list.push({ f: f, t: t, p: 'b', x: x, fl: fl });
      list.push({ f: f, t: t, p: 'n', x: x, fl: fl });
    } else { list.push({ f: f, t: t, p: '', x: x, fl: fl }); }
  }

  /* langkah pseudo-legal; capsOnly = hanya penangkapan (untuk quiescence) */
  function pseudo(s, capsOnly) {
    var b = s.b, list = [], white = s.t === 'w', sq, i, j, p, t, q, ray, kn;
    for (sq = 0; sq < 64; sq++) {
      p = b[sq];
      if (p === '' || (p < 'a') !== white) { continue; }
      var u = p.toUpperCase(), f = sq & 7, r = sq >> 3;
      if (u === 'P') {
        var dir = white ? 1 : -1, promo = white ? 7 : 0, startR = white ? 1 : 6;
        t = sq + 8 * dir;
        if (b[t] === '' && (!capsOnly || (t >> 3) === promo)) {
          addPawn(list, sq, t, '', '', promo);
          if (!capsOnly && r === startR && b[t + 8 * dir] === '') { list.push({ f: sq, t: t + 8 * dir, p: '', x: '', fl: 'dp' }); }
        }
        for (i = -1; i <= 1; i += 2) {
          if (f + i < 0 || f + i > 7) { continue; }
          t = (r + dir) * 8 + f + i;
          q = b[t];
          if (q !== '' && (q < 'a') !== white) { addPawn(list, sq, t, q, '', promo); }
          else if (t === s.ep && q === '') { list.push({ f: sq, t: t, p: '', x: white ? 'p' : 'P', fl: 'ep' }); }
        }
      } else if (u === 'N' || u === 'K') {
        kn = u === 'N' ? KN[sq] : KG[sq];
        for (i = 0; i < kn.length; i++) {
          t = kn[i]; q = b[t];
          if (q === '') { if (!capsOnly) { list.push({ f: sq, t: t, p: '', x: '', fl: '' }); } }
          else if ((q < 'a') !== white) { list.push({ f: sq, t: t, p: '', x: q, fl: '' }); }
        }
        if (u === 'K' && !capsOnly) {
          var en = white ? 'b' : 'w', home = white ? 4 : 60, ks = white ? 'K' : 'k', qs = white ? 'Q' : 'q', rk = white ? 'R' : 'r';
          if (sq === home && s.c.length > 0) {
            if (s.c.indexOf(ks) >= 0 && b[home + 1] === '' && b[home + 2] === '' && b[home + 3] === rk &&
                !attacked(b, home, en) && !attacked(b, home + 1, en) && !attacked(b, home + 2, en)) {
              list.push({ f: sq, t: home + 2, p: '', x: '', fl: 'ck' });
            }
            if (s.c.indexOf(qs) >= 0 && b[home - 1] === '' && b[home - 2] === '' && b[home - 3] === '' && b[home - 4] === rk &&
                !attacked(b, home, en) && !attacked(b, home - 1, en) && !attacked(b, home - 2, en)) {
              list.push({ f: sq, t: home - 2, p: '', x: '', fl: 'cq' });
            }
          }
        }
      } else {
        var from = u === 'B' ? 4 : 0, to = u === 'R' ? 4 : 8;
        for (i = from; i < to; i++) {
          ray = RAYS[sq][i];
          for (j = 0; j < ray.length; j++) {
            t = ray[j]; q = b[t];
            if (q === '') { if (!capsOnly) { list.push({ f: sq, t: t, p: '', x: '', fl: '' }); } }
            else {
              if ((q < 'a') !== white) { list.push({ f: sq, t: t, p: '', x: q, fl: '' }); }
              break;
            }
          }
        }
      }
    }
    return list;
  }

  function make(s, m) {
    var b = s.b.slice(), p = b[m.f], white = p < 'a', c = s.c;
    b[m.t] = m.p ? (white ? m.p.toUpperCase() : m.p) : p;
    b[m.f] = '';
    if (m.fl === 'ep') { b[white ? m.t - 8 : m.t + 8] = ''; }
    else if (m.fl === 'ck') { b[m.t - 1] = b[m.t + 1]; b[m.t + 1] = ''; }
    else if (m.fl === 'cq') { b[m.t + 1] = b[m.t - 2]; b[m.t - 2] = ''; }
    if (c.length > 0) {
      if (p === 'K') { c = c.replace('K', '').replace('Q', ''); }
      else if (p === 'k') { c = c.replace('k', '').replace('q', ''); }
      if (m.f === 0 || m.t === 0) { c = c.replace('Q', ''); }
      if (m.f === 7 || m.t === 7) { c = c.replace('K', ''); }
      if (m.f === 56 || m.t === 56) { c = c.replace('q', ''); }
      if (m.f === 63 || m.t === 63) { c = c.replace('k', ''); }
    }
    return {
      b: b, t: white ? 'b' : 'w', c: c, ep: m.fl === 'dp' ? (m.f + m.t) >> 1 : -1,
      hm: (p === 'P' || p === 'p' || m.x !== '') ? 0 : s.hm + 1, fm: white ? s.fm : s.fm + 1
    };
  }

  function inCheck(s) {
    var k = kingSq(s.b, s.t);
    return k >= 0 && attacked(s.b, k, s.t === 'w' ? 'b' : 'w');
  }

  function legal(s) {
    var ps = pseudo(s, false), out = [], me = s.t, en = me === 'w' ? 'b' : 'w';
    for (var i = 0; i < ps.length; i++) {
      var ns = make(s, ps[i]), k = kingSq(ns.b, me);
      if (k >= 0 && !attacked(ns.b, k, en)) { out.push(ps[i]); }
    }
    return out;
  }

  function key(s) {
    var k = '';
    for (var i = 0; i < 64; i++) { k += s.b[i] === '' ? '.' : s.b[i]; }
    return k + s.t + s.c + s.ep;
  }

  function insufficient(b) {
    var minors = 0, bishopsLight = 0, bishopsDark = 0, knights = 0;
    for (var i = 0; i < 64; i++) {
      var p = b[i];
      if (p === '' || p === 'K' || p === 'k') { continue; }
      var u = p.toUpperCase();
      if (u === 'P' || u === 'R' || u === 'Q') { return false; }
      minors++;
      if (u === 'N') { knights++; }
      else if ((((i >> 3) + (i & 7)) & 1) === 0) { bishopsDark++; } else { bishopsLight++; }
    }
    if (minors <= 1) { return true; }
    if (knights === 0 && (bishopsLight === 0 || bishopsDark === 0)) { return true; }
    return false;
  }

  /* hist = daftar key posisi (termasuk posisi sekarang). Kembalikan null bila game berlanjut. */
  function status(s, hist, moves) {
    var lm = moves || legal(s);
    if (lm.length === 0) {
      if (inCheck(s)) { return { kind: 'mate', winner: s.t === 'w' ? 'b' : 'w' }; }
      return { kind: 'stalemate', winner: '' };
    }
    if (insufficient(s.b)) { return { kind: 'insufficient', winner: '' }; }
    if (s.hm >= 100) { return { kind: 'fifty', winner: '' }; }
    if (hist) {
      var k = hist[hist.length - 1], n = 0;
      for (var i = 0; i < hist.length; i++) { if (hist[i] === k) { n++; } }
      if (n >= 3) { return { kind: 'repetition', winner: '' }; }
    }
    return null;
  }

  function uci(m) { return sqName(m.f) + sqName(m.t) + m.p; }
  function findUci(list, u) {
    var f = sqOf(u.substr(0, 2)), t = sqOf(u.substr(2, 2)), p = u.length > 4 ? u.charAt(4) : '';
    for (var i = 0; i < list.length; i++) {
      var m = list[i];
      if (m.f === f && m.t === t && m.p === p) { return m; }
    }
    return null;
  }

  function san(s, m, list) {
    var b = s.b, p = b[m.f], u = p.toUpperCase(), out = '', i;
    if (m.fl === 'ck') { out = 'O-O'; }
    else if (m.fl === 'cq') { out = 'O-O-O'; }
    else {
      var cap = m.x !== '';
      if (u === 'P') {
        if (cap) { out += sqName(m.f).charAt(0) + 'x'; }
        out += sqName(m.t);
        if (m.p) { out += '=' + m.p.toUpperCase(); }
      } else {
        out += u;
        var amb = false, sameFile = false, sameRank = false;
        for (i = 0; i < list.length; i++) {
          var o = list[i];
          if (o !== m && o.t === m.t && b[o.f] === p) {
            amb = true;
            if ((o.f & 7) === (m.f & 7)) { sameFile = true; }
            if ((o.f >> 3) === (m.f >> 3)) { sameRank = true; }
          }
        }
        if (amb) {
          if (!sameFile) { out += sqName(m.f).charAt(0); }
          else if (!sameRank) { out += sqName(m.f).charAt(1); }
          else { out += sqName(m.f); }
        }
        if (cap) { out += 'x'; }
        out += sqName(m.t);
      }
    }
    var ns = make(s, m);
    if (inCheck(ns)) { out += legal(ns).length === 0 ? '#' : '+'; }
    return out;
  }

  function perft(s, d) {
    if (d === 0) { return 1; }
    var l = legal(s), n = 0;
    if (d === 1) { return l.length; }
    for (var i = 0; i < l.length; i++) { n += perft(make(s, l[i]), d - 1); }
    return n;
  }

  return {
    START: START, fromFen: fromFen, start: start, pseudo: pseudo, make: make, legal: legal, inCheck: inCheck,
    attacked: attacked, kingSq: kingSq, key: key, status: status, uci: uci, findUci: findUci, san: san,
    sqOf: sqOf, sqName: sqName, colorOf: colorOf, perft: perft
  };
})();
if (typeof module !== 'undefined') { module.exports = Chess; }
