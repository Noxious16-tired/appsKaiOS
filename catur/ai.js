/* Bot catur offline: alpha-beta + quiescence, tabel posisi sederhana. */
var AI = (function () {
  var C = (typeof Chess !== 'undefined') ? Chess : require('./chess.js');
  var VAL = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
  var MATE = 30000;
  var PST = {
    p: [0,0,0,0,0,0,0,0, 50,50,50,50,50,50,50,50, 10,10,20,30,30,20,10,10, 5,5,10,25,25,10,5,5, 0,0,0,20,20,0,0,0, 5,-5,-10,0,0,-10,-5,5, 5,10,10,-20,-20,10,10,5, 0,0,0,0,0,0,0,0],
    n: [-50,-40,-30,-30,-30,-30,-40,-50, -40,-20,0,0,0,0,-20,-40, -30,0,10,15,15,10,0,-30, -30,5,15,20,20,15,5,-30, -30,0,15,20,20,15,0,-30, -30,5,10,15,15,10,5,-30, -40,-20,0,5,5,0,-20,-40, -50,-40,-30,-30,-30,-30,-40,-50],
    b: [-20,-10,-10,-10,-10,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,10,10,5,0,-10, -10,5,5,10,10,5,5,-10, -10,0,10,10,10,10,0,-10, -10,10,10,10,10,10,10,-10, -10,5,0,0,0,0,5,-10, -20,-10,-10,-10,-10,-10,-10,-20],
    r: [0,0,0,0,0,0,0,0, 5,10,10,10,10,10,10,5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, -5,0,0,0,0,0,0,-5, 0,0,0,5,5,0,0,0],
    q: [-20,-10,-10,-5,-5,-10,-10,-20, -10,0,0,0,0,0,0,-10, -10,0,5,5,5,5,0,-10, -5,0,5,5,5,5,0,-5, 0,0,5,5,5,5,0,-5, -10,5,5,5,5,5,0,-10, -10,0,5,0,0,0,0,-10, -20,-10,-10,-5,-5,-10,-10,-20],
    k: [-30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -30,-40,-40,-50,-50,-40,-40,-30, -20,-30,-30,-40,-40,-30,-30,-20, -10,-20,-20,-20,-20,-20,-20,-10, 20,20,0,0,0,0,20,20, 20,30,10,0,0,10,30,20],
    e: [-50,-40,-30,-20,-20,-30,-40,-50, -30,-20,-10,0,0,-10,-20,-30, -30,-10,20,30,30,20,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,30,40,40,30,-10,-30, -30,-10,20,30,30,20,-10,-30, -30,-30,0,0,0,0,-30,-30, -50,-30,-30,-30,-30,-30,-30,-50]
  };

  function evaluate(s) {
    var b = s.b, i, p, sc = 0, queens = 0;
    for (i = 0; i < 64; i++) { if (b[i] === 'Q' || b[i] === 'q') { queens++; } }
    for (i = 0; i < 64; i++) {
      p = b[i];
      if (p === '') { continue; }
      var white = p < 'a', u = p.toLowerCase();
      var tbl = (u === 'k' && queens === 0) ? PST.e : PST[u];
      var v = VAL[u] + tbl[white ? (7 - (i >> 3)) * 8 + (i & 7) : i];
      sc += white ? v : -v;
    }
    return s.t === 'w' ? sc : -sc;
  }

  function orderScore(m) {
    var sc = 0;
    if (m.x !== '') { sc = 10 * VAL[m.x.toLowerCase()] + 5; }
    if (m.p) { sc += VAL[m.p] ; }
    return sc;
  }
  function sortMoves(list) {
    for (var i = 0; i < list.length; i++) { list[i].o = orderScore(list[i]); }
    list.sort(function (a, b) { return b.o - a.o; });
  }
  function hasKingCapture(list) {
    for (var i = 0; i < list.length; i++) { if (list[i].x === 'k' || list[i].x === 'K') { return true; } }
    return false;
  }

  function quiesce(s, alpha, beta, ply, qd, ctx) {
    ctx.nodes++;
    if ((ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) { ctx.stop = true; }
    if (ctx.stop) { return 0; }
    var stand = evaluate(s);
    if (qd <= 0) { return stand; }
    if (stand >= beta) { return stand; }
    if (stand > alpha) { alpha = stand; }
    var list = C.pseudo(s, true);
    if (hasKingCapture(list)) { return MATE - ply; }
    sortMoves(list);
    for (var i = 0; i < list.length; i++) {
      var sc = -quiesce(C.make(s, list[i]), -beta, -alpha, ply + 1, qd - 1, ctx);
      if (ctx.stop) { return 0; }
      if (sc >= beta) { return sc; }
      if (sc > alpha) { alpha = sc; }
    }
    return alpha;
  }

  function search(s, depth, alpha, beta, ply, ctx) {
    if (depth <= 0) { return quiesce(s, alpha, beta, ply, 4, ctx); }
    ctx.nodes++;
    if ((ctx.nodes & 1023) === 0 && Date.now() > ctx.deadline) { ctx.stop = true; }
    if (ctx.stop) { return 0; }
    var list = C.pseudo(s, false);
    if (hasKingCapture(list)) { return MATE - ply; }
    sortMoves(list);
    var best = -MATE;
    for (var i = 0; i < list.length; i++) {
      var sc = -search(C.make(s, list[i]), depth - 1, -beta, -alpha, ply + 1, ctx);
      if (ctx.stop) { return 0; }
      if (sc > best) { best = sc; }
      if (sc > alpha) { alpha = sc; }
      if (alpha >= beta) { break; }
    }
    if (best < -(MATE - 200) && !C.inCheck(s)) { return 0; }   // pat, bukan skakmat
    return best;
  }

  /* level: 1..4. hist = key posisi sebelumnya (untuk menghindari remis berulang saat unggul). */
  var LEVELS = {
    1: { depth: 1, ms: 300, noise: 160 },
    2: { depth: 2, ms: 800, noise: 40 },
    3: { depth: 3, ms: 2000, noise: 10 },
    4: { depth: 6, ms: 4000, noise: 0 }
  };

  function choose(s, level, hist) {
    var cfg = LEVELS[level] || LEVELS[2];
    var moves = C.legal(s);
    if (moves.length === 0) { return null; }
    if (moves.length === 1) { return moves[0]; }
    sortMoves(moves);
    var ctx = { nodes: 0, stop: false, deadline: Date.now() + cfg.ms };
    var scores = [], d, i, best = null;
    for (i = 0; i < moves.length; i++) { scores.push(0); }
    for (d = 1; d <= cfg.depth; d++) {
      var cur = [], alpha = -MATE, beta = MATE, done = true;
      for (i = 0; i < moves.length; i++) {
        var ns = C.make(s, moves[i]), sc;
        var rep = 0;
        if (hist) {
          var k = C.key(ns);
          for (var h = 0; h < hist.length; h++) { if (hist[h] === k) { rep++; } }
        }
        if (rep >= 2 || ns.hm >= 100) { sc = 0; }
        else { sc = -search(ns, d - 1, -MATE, MATE, 1, ctx); }
        if (ctx.stop) { done = false; break; }
        cur.push(sc);
      }
      if (!done && d > 1) { break; }
      if (!done) { for (i = 0; i < moves.length; i++) { cur.push(0); } }
      scores = cur;
      // urutkan ulang: skor terbaik dulu untuk iterasi berikutnya
      var idx = [];
      for (i = 0; i < moves.length; i++) { idx.push(i); }
      idx.sort(function (a, b) { return scores[b] - scores[a]; });
      var nm = [], ns2 = [];
      for (i = 0; i < idx.length; i++) { nm.push(moves[idx[i]]); ns2.push(scores[idx[i]]); }
      moves = nm; scores = ns2;
      if (scores[0] > MATE - 100) { break; }
      if (done && Date.now() > ctx.deadline) { break; }
    }
    var bestScore = -Infinity;
    for (i = 0; i < moves.length; i++) {
      var v = scores[i] + (cfg.noise ? Math.random() * cfg.noise : 0);
      if (v > bestScore) { bestScore = v; best = moves[i]; }
    }
    return best;
  }

  return { choose: choose, evaluate: evaluate, LEVELS: LEVELS };
})();
if (typeof module !== 'undefined') { module.exports = AI; }
