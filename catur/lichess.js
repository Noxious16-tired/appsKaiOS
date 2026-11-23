/* Klien API Lichess (Board API). ES5, XHR; di KaiOS memakai mozSystem agar lintas-asal diizinkan. */
var Li = (function () {
  var base = 'https://lichess.org', token = '';

  function cfg(b, t) { if (b) { base = b.replace(/\/+$/, ''); } token = t || ''; }
  function enc(o) {
    var a = [];
    for (var k in o) { if (o.hasOwnProperty(k)) { a.push(encodeURIComponent(k) + '=' + encodeURIComponent(String(o[k]))); } }
    return a.join('&');
  }
  function mk(method, path, form, ndjson) {
    var x;
    try { x = new XMLHttpRequest({ mozSystem: true }); } catch (e) { x = new XMLHttpRequest(); }
    x.open(method, base + path, true);
    if (token) { x.setRequestHeader('Authorization', 'Bearer ' + token); }
    if (ndjson) { x.setRequestHeader('Accept', 'application/x-ndjson'); }
    var body = null;
    if (form) { x.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded'); body = enc(form); }
    return { x: x, body: body };
  }
  function parse(t) { try { return JSON.parse(t); } catch (e) { return null; } }
  function errText(status, text) {
    var j = parse(text);
    if (j && j.error) { return typeof j.error === 'string' ? j.error : JSON.stringify(j.error); }
    if (status === 0) { return 'Tidak ada koneksi'; }
    if (status === 401) { return 'Token ditolak (cek token & izin)'; }
    if (status === 429) { return 'Terlalu banyak permintaan, tunggu sebentar'; }
    return 'Galat ' + status;
  }

  /* permintaan biasa. cb(err, json) */
  function call(method, path, form, cb) {
    var r = mk(method, path, form, false), done = false;
    function fin(err, data) { if (done) { return; } done = true; cb(err, data); }
    r.x.onreadystatechange = function () {
      if (r.x.readyState !== 4) { return; }
      var st = r.x.status;
      if (st >= 200 && st < 300) { fin(null, parse(r.x.responseText) || {}); }
      else { fin({ status: st, msg: errText(st, r.x.responseText) }); }
    };
    r.x.onerror = function () { fin({ status: 0, msg: errText(0) }); };
    r.x.ontimeout = r.x.onerror;
    r.x.timeout = 20000;
    r.x.send(r.body);
    return { abort: function () { done = true; try { r.x.abort(); } catch (e) { } } };
  }

  /* aliran NDJSON. onLine(obj); onEnd(err|null) dipanggil sekali saat selesai/terputus. */
  function stream(method, path, form, onLine, onEnd) {
    var r = mk(method, path, form, true), pos = 0, ended = false, aborted = false;
    function pump(final) {
      var t = r.x.responseText || '';
      var nl;
      while ((nl = t.indexOf('\n', pos)) >= 0) {
        var line = t.substring(pos, nl);
        pos = nl + 1;
        if (line.replace(/\s+/g, '') !== '') {
          var j = parse(line);
          if (j && !aborted) { onLine(j); }
        }
      }
      if (final && pos < t.length) {
        var rest = t.substring(pos);
        pos = t.length;
        var j2 = parse(rest);
        if (j2 && !aborted) { onLine(j2); }
      }
    }
    function fin(err) { if (ended || aborted) { return; } ended = true; onEnd(err); }
    r.x.onprogress = function () { if (r.x.status >= 200 && r.x.status < 300) { pump(false); } };
    r.x.onreadystatechange = function () {
      if (r.x.readyState === 3 && r.x.status >= 200 && r.x.status < 300) { pump(false); }
      if (r.x.readyState !== 4) { return; }
      var st = r.x.status;
      if (st >= 200 && st < 300) { pump(true); fin(null); }
      else { fin({ status: st, msg: errText(st, r.x.responseText) }); }
    };
    r.x.onerror = function () { fin({ status: 0, msg: errText(0) }); };
    r.x.send(r.body);
    return { abort: function () { aborted = true; try { r.x.abort(); } catch (e) { } } };
  }

  return {
    cfg: cfg, call: call, stream: stream,
    account: function (cb) { return call('GET', '/api/account', null, cb); },
    playing: function (cb) { return call('GET', '/api/account/playing', null, cb); },
    events: function (onLine, onEnd) { return stream('GET', '/api/stream/event', null, onLine, onEnd); },
    seek: function (rated, onLine, onEnd) {
      return stream('POST', '/api/board/seek', { rated: rated ? 'true' : 'false', time: 10, increment: 0, variant: 'standard' }, onLine, onEnd);
    },
    challengeAi: function (level, color, cb) {
      return call('POST', '/api/challenge/ai', { level: level, 'clock.limit': 600, 'clock.increment': 0, color: color, variant: 'standard' }, cb);
    },
    game: function (id, onLine, onEnd) { return stream('GET', '/api/board/game/stream/' + id, null, onLine, onEnd); },
    move: function (id, uci, cb) { return call('POST', '/api/board/game/' + id + '/move/' + uci, null, cb); },
    resign: function (id, cb) { return call('POST', '/api/board/game/' + id + '/resign', null, cb); },
    abort: function (id, cb) { return call('POST', '/api/board/game/' + id + '/abort', null, cb); },
    draw: function (id, yes, cb) { return call('POST', '/api/board/game/' + id + '/draw/' + (yes ? 'yes' : 'no'), null, cb); }
  };
})();
