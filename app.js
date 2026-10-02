/* app.js · GREG - Móveis · gregmoveis.com.br e /bio
 * Substitui o bloco <script> inline do fim do bio.html e do index.html.
 * Incluir antes de </body>:  <script src="/app.js" defer></script>
 * - lê gclid / fbclid / UTMs da URL e o cookie _fbp; guarda 90 dias (primeiro toque vence)
 * - ping de visita ao coletor
 * - no clique em [data-wa] ou [data-origem]: gera código #G-XXXXX, ping de evento, abre o WhatsApp com a mensagem
 * - Pixel e GA4 continuam pelo GTM (dataLayer.push click_whatsapp mantido)
 */
(function () {
  var CONFIG = {
    fone: '5565992902284',
    coletor: 'https://script.google.com/macros/s/AKfycbxCcuQC3xiDt41NSt4I2MKsRgJaigWTJQpSV6-Id4WelsrkXhjb7HmNk6N7bLlCoqum/exec',
    dias: 90,
    mensagens: {
      bio_orcamento: 'Olá! Vim pelo Instagram e quero um orçamento de móveis planejados.',
      orcamento: 'Olá! Quero um orçamento de móveis planejados.',
      visita: 'Olá! Quero agendar uma visita técnica.',
      planta: 'Olá! Vou mandar a planta do meu imóvel para orçamento.',
      fabrica: 'Olá! Quero conhecer a fábrica.',
      padrao: 'Olá! Vim pelo site da GREG - Móveis e quero um orçamento.'
    }
  };

  var CHAVE = 'greg_toque';
  function agora() { return Date.now(); }
  function ler() { try { var j = JSON.parse(localStorage.getItem(CHAVE) || 'null'); return j && j.ate > agora() ? j : null; } catch (e) { return null; } }
  function guardar(o) { try { o.ate = agora() + CONFIG.dias * 864e5; localStorage.setItem(CHAVE, JSON.stringify(o)); } catch (e) {} }
  function cookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : ''; }

  var q = new URLSearchParams(location.search);
  var toque = ler() || {};
  var novo = {
    s: q.get('utm_source') || '', m: q.get('utm_medium') || '', ca: q.get('utm_campaign') || '', co: q.get('utm_content') || '',
    g: q.get('gclid') || '', f: q.get('fbclid') || ''
  };
  var temParam = novo.s || novo.g || novo.f;
  if (temParam && !toque.s && !toque.g && !toque.f) { toque = novo; }           // primeiro toque vence
  else if (temParam && (novo.g || novo.f)) { toque.g = toque.g || novo.g; toque.f = toque.f || novo.f; } // mas guarda ids novos de clique
  if (toque.f && !toque.fbc) { toque.fbc = 'fb.1.' + agora() + '.' + toque.f; }
  toque.fbc = cookie('_fbc') || toque.fbc || '';
  toque.fbp = cookie('_fbp') || toque.fbp || '';
  toque.ref = toque.ref || document.referrer || '';
  guardar(toque);

  function ping(params) {
    if (!CONFIG.coletor || CONFIG.coletor.indexOf('COLE_AQUI') === 0) { return; }
    try {
      var o = { p: location.pathname.replace(/\/$/, '') || '/', s: toque.s, m: toque.m, ca: toque.ca, co: toque.co, g: toque.g, f: toque.f, fbc: toque.fbc, fbp: toque.fbp, ref: toque.ref, ua: navigator.userAgent };
      for (var k in params) { o[k] = params[k]; }
      var partes = [];
      for (var c in o) { if (o[c]) { partes.push(c + '=' + encodeURIComponent(o[c])); } }
      var img = new Image();
      img.src = CONFIG.coletor + '?' + partes.join('&') + '&_=' + agora();
    } catch (e) {}
  }

  function codigo() {
    var a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', s = '';
    for (var i = 0; i < 5; i++) { s += a.charAt(Math.floor(Math.random() * a.length)); }
    return 'G-' + s;
  }

  function fonte() { return toque.s || (/instagram\.com/.test(toque.ref) ? 'instagram' : /google\./.test(toque.ref) ? 'google' : 'direto'); }

  function prepararBotao(a, chave) {
    var msg = CONFIG.mensagens[chave] || CONFIG.mensagens.padrao;
    a.href = 'https://wa.me/' + CONFIG.fone + '?text=' + encodeURIComponent(msg);
    a.target = '_blank'; a.rel = 'noopener';
    a.addEventListener('click', function (ev) {
      var cod = codigo();
      var texto = msg + ' (#' + cod + ')';
      a.href = 'https://wa.me/' + CONFIG.fone + '?text=' + encodeURIComponent(texto);
      try { (window.dataLayer = window.dataLayer || []).push({ event: 'click_whatsapp', origem: chave, fonte: fonte(), codigo: cod }); } catch (e) {}
      ping({ t: 'evento', n: 'click_whatsapp', c: cod });
    });
  }

  function iniciar() {
    document.querySelectorAll('[data-wa]').forEach(function (a) { prepararBotao(a, a.getAttribute('data-wa')); });
    document.querySelectorAll('[data-origem]').forEach(function (a) { prepararBotao(a, a.getAttribute('data-origem')); });
    document.querySelectorAll('[data-link]').forEach(function (a) {
      a.addEventListener('click', function () {
        var n = a.getAttribute('data-link');
        try { (window.dataLayer = window.dataLayer || []).push({ event: 'click_link', origem: n, fonte: fonte() }); } catch (e) {}
        ping({ t: 'evento', n: /insta/.test(n) ? 'click_instagram' : /rota|mapa|chegar/.test(n) ? 'click_rota' : /google|avali/.test(n) ? 'click_google' : 'click_link' });
      });
    });
    ping({ t: 'visita' });
    var marcou = {};
    window.addEventListener('scroll', function () {
      var h = document.documentElement, pct = (h.scrollTop + window.innerHeight) / h.scrollHeight;
      if (pct > .5 && !marcou[50]) { marcou[50] = 1; ping({ t: 'evento', n: 'scroll_50' }); }
      if (pct > .9 && !marcou[90]) { marcou[90] = 1; ping({ t: 'evento', n: 'scroll_90' }); }
    }, { passive: true });
  }

  if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', iniciar); } else { iniciar(); }
})();
