/* Chipper Moda — landing. JavaScript vanilla, sin dependencias.
   Toda la configuración vive en window.CHIPPER_CONFIG (index.html). */
(() => {
  'use strict';

  const C = window.CHIPPER_CONFIG;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const DEPARTAMENTOS = ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá',
    'Caldas', 'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía',
    'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo',
    'Quindío', 'Risaralda', 'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
    'Vaupés', 'Vichada'];

  const state = { color: C.colors[0] && C.colors[0].id, size: null, qty: 1 };

  /* ---------- Precio y variantes ---------- */
  const money = n => (n ? '$' + Math.round(n).toLocaleString('es-CO') : '$XX.XXX');
  const colorObj = () => C.colors.find(c => c.id === state.color) || C.colors[0] || {};
  const unitPrice = () => {
    const v = C.variantPrices || {};
    return v[state.color + '|' + state.size] || v[state.size] || v[state.color] || C.price || 0;
  };
  const total = () => unitPrice() * state.qty;

  /* ---------- WhatsApp (enlace simple wa.me) ---------- */
  const payNumber = method => (C.paymentDetails || {})[method] || '';
  const waLink = msg => 'https://wa.me/' + String(C.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent(msg);
  function openWA(msg) {
    const url = waLink(msg);
    const w = window.open(url, '_blank');
    if (w) w.opener = null; else location.href = url;
  }

  function orderMessage(o) {
    const lines = [
      'Hola, quiero hacer este pedido en Chipper Moda:', '',
      '• Producto: ' + C.productName,
      '• Color: ' + colorObj().name,
      '• Talla: ' + (state.size || 'Por definir'),
      '• Cantidad: ' + state.qty,
      '• Total: ' + money(total())
    ];
    if (o) {
      lines.push('', 'Pedido: ' + o.id, 'Nombre: ' + o.nombre, 'Celular: ' + o.celular,
        'Ciudad: ' + o.ciudad + ', ' + o.departamento,
        'Dirección: ' + o.direccion + (o.indicaciones ? ' (' + o.indicaciones + ')' : ''),
        'Pago: ' + o.pago + (payNumber(o.pago) ? ' (' + payNumber(o.pago) + ')' : ''));
    }
    return lines.join('\n');
  }

  /* ---------- Render de selectores (desde CONFIG) ---------- */
  function renderOptions() {
    $$('[data-options]').forEach(box => {
      const kind = box.dataset.options;
      const name = kind + (box.dataset.suffix || '');
      const items = kind === 'color' ? C.colors : C.sizes.map(s => ({ id: s, name: s }));
      box.innerHTML = items.map(it => {
        const off = kind === 'size' && (C.soldOut || []).includes(it.id);
        return kind === 'color'
          ? `<label class="opt opt--color" style="--swatch:${it.hex}" title="${it.name}"><input type="radio" name="${name}" value="${it.id}" data-kind="color" aria-label="${it.name}"><span></span></label>`
          : `<label class="opt opt--size"><input type="radio" name="${name}" value="${it.id}" data-kind="size" required${off ? ' disabled' : ''} aria-label="Talla ${it.name}${off ? ' (agotada)' : ''}"><span>${it.name}</span></label>`;
      }).join('');
    });
  }

  const setText = (sel, txt) => $$(sel).forEach(el => { el.textContent = txt; });

  // Foto por color: CONFIG.colors[i].image = 'img/archivo.webp'.
  // Un color sin foto muestra la foto principal original.
  const heroImg = $('.hero__img');
  const defaultImage = heroImg.getAttribute('src');
  let currentImage = defaultImage;
  function swapImages() {
    const c = colorObj();
    const src = c.image || defaultImage;
    if (src === currentImage) return;
    currentImage = src;
    heroImg.src = src;
    heroImg.alt = 'Leggin deportivo Chipper Moda color ' + c.name;
    $$('[data-thumb]').forEach(t => { t.src = src; });
  }
  /* ---------- Fotos "En movimiento": cada botón muestra su foto ---------- */
  const tabs = $$('[role="tab"]');
  const panelOf = tab => document.getElementById(tab.getAttribute('aria-controls'));
  function selectTab(tab) {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const p = panelOf(t);
      if (p) p.hidden = !on;
    });
  }
  // Flechas ← → entre botones (patrón accesible de pestañas)
  document.addEventListener('keydown', e => {
    const tab = e.target.closest && e.target.closest('[role="tab"]');
    if (!tab || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    const list = tabs.filter(t => !t.hidden);
    const next = list[(list.indexOf(tab) + (e.key === 'ArrowRight' ? 1 : -1) + list.length) % list.length];
    selectTab(next);
    next.focus();
  });

  // Precarga la foto cuando el dedo/cursor llega al círculo de color o al botón: el cambio se siente instantáneo
  const preloaded = new Set();
  document.addEventListener('pointerover', e => {
    if (!e.target.closest) return;
    const tab = e.target.closest('[role="tab"]');
    const img = tab && panelOf(tab) && panelOf(tab).querySelector('img');
    if (img) { img.loading = 'eager'; return; }
    const input = e.target.closest('.opt--color') && e.target.closest('.opt--color').querySelector('input');
    const c = input && C.colors.find(x => x.id === input.value);
    if (c && c.image && !preloaded.has(c.image)) { preloaded.add(c.image); new Image().src = c.image; }
  }, { passive: true });

  function sync() {
    $$('input[data-kind]').forEach(i => { i.checked = String(state[i.dataset.kind]) === i.value; });
    const unit = unitPrice();
    const cmp = C.compareAtPrice;
    setText('[data-price]', money(unit));
    setText('[data-total]', money(total()));
    setText('[data-compare]', unit ? money(cmp) : '$XX.XXX');
    setText('[data-save]', unit && cmp ? 'Ahorra ' + Math.round((1 - unit / cmp) * 100) + '%' : 'Ahorra XX%');
    $$('[data-discount]').forEach(el => { el.hidden = !!unit && !(cmp > unit); });
    setText('[data-color-name]', colorObj().name || '');
    setText('[data-size-name]', state.size ? 'Talla ' + state.size : 'Elige talla');
    setText('[data-qty-out]', state.qty);
    swapImages();
  }

  /* ---------- Tracking: se carga después del render ---------- */
  const T = C.tracking || {};
  const hasId = id => !!id && !/_ID$/.test(id);
  const EVENTS = { // [Meta, TikTok, GA4]
    ViewContent: ['ViewContent', 'ViewContent', 'view_item'],
    AddToCart: ['AddToCart', 'AddToCart', 'add_to_cart'],
    InitiateCheckout: ['InitiateCheckout', 'InitiateCheckout', 'begin_checkout'],
    Purchase: ['Purchase', 'CompletePayment', 'purchase'],
    ClickWhatsApp: ['Contact', 'Contact', 'click_whatsapp']
  };
  const pending = [];
  let trackersReady = false;

  function payload(extra) {
    const value = total(), price = unitPrice(), qty = state.qty;
    const variant = [colorObj().name, state.size].filter(Boolean).join(' / ');
    const ga = { currency: 'COP', value, items: [{ item_id: C.sku, item_name: C.productName, item_variant: variant, price, quantity: qty }] };
    if (extra.orderId) ga.transaction_id = extra.orderId;
    if (extra.source) ga.source = extra.source;
    return {
      orderId: extra.orderId,
      meta: { content_ids: [C.sku], content_type: 'product', content_name: C.productName, value, currency: 'COP', num_items: qty },
      tiktok: { contents: [{ content_id: C.sku, content_type: 'product', content_name: C.productName, quantity: qty, price }], value, currency: 'COP' },
      ga
    };
  }

  function send(name, d) {
    const [m, t, g] = EVENTS[name];
    if (window.fbq) window.fbq('track', m, d.meta, d.orderId ? { eventID: d.orderId } : undefined);
    if (window.ttq) window.ttq.track(t, d.tiktok);
    if (window.gtag) window.gtag('event', g, d.ga);
    if (C.debug) console.log('[track]', name, d);
  }

  function track(name, extra = {}) {
    const d = payload(extra); // se captura el estado del momento del evento
    trackersReady ? send(name, d) : pending.push([name, d]);
  }

  function injectScript(src) {
    const s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadTrackers() {
    if (trackersReady) return;
    trackersReady = true;

    if (hasId(T.META_PIXEL_ID)) {
      const f = window.fbq = function () { f.callMethod ? f.callMethod.apply(f, arguments) : f.queue.push(arguments); };
      if (!window._fbq) window._fbq = f;
      f.push = f; f.loaded = true; f.version = '2.0'; f.queue = [];
      f('init', T.META_PIXEL_ID);
      f('track', 'PageView');
      injectScript('https://connect.facebook.net/en_US/fbevents.js');
    }

    if (hasId(T.TIKTOK_PIXEL_ID)) {
      // Snippet oficial de TikTok (stub + carga)
      !function (w, d, t) {
        w.TiktokAnalyticsObject = t; const ttq = w[t] = w[t] || [];
        ttq.methods = ['page', 'track', 'identify', 'instances', 'debug', 'on', 'off', 'once', 'ready', 'alias', 'group', 'enableCookie', 'disableCookie', 'holdConsent', 'revokeConsent', 'grantConsent'];
        ttq.setAndDefer = function (o, e) { o[e] = function () { o.push([e].concat(Array.prototype.slice.call(arguments, 0))); }; };
        for (let i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function (id) { const e = ttq._i[id] || []; for (let n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]); return e; };
        ttq.load = function (e, n) {
          const r = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          ttq._i = ttq._i || {}; ttq._i[e] = []; ttq._i[e]._u = r;
          ttq._t = ttq._t || {}; ttq._t[e] = +new Date;
          ttq._o = ttq._o || {}; ttq._o[e] = n || {};
          const s = d.createElement('script'); s.async = true; s.src = r + '?sdkid=' + e + '&lib=' + t;
          d.head.appendChild(s);
        };
        ttq.load(T.TIKTOK_PIXEL_ID);
        ttq.page();
      }(window, document, 'ttq');
    }

    if (hasId(T.GOOGLE_ANALYTICS_ID)) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      window.gtag('config', T.GOOGLE_ANALYTICS_ID);
      injectScript('https://www.googletagmanager.com/gtag/js?id=' + T.GOOGLE_ANALYTICS_ID);
    }

    pending.splice(0).forEach(([n, d]) => send(n, d));
  }

  function scheduleTrackers() {
    const kick = () => {
      ['scroll', 'pointerdown'].forEach(ev => removeEventListener(ev, kick));
      loadTrackers();
    };
    ['scroll', 'pointerdown'].forEach(ev => addEventListener(ev, kick, { once: true, passive: true }));
    const later = () => setTimeout(() => ('requestIdleCallback' in window ? requestIdleCallback(kick, { timeout: 2000 }) : kick()), T.delayMs || 0);
    document.readyState === 'complete' ? later() : addEventListener('load', later, { once: true });
  }

  /* ---------- Compra ---------- */
  const sheet = $('#pedido');
  const form = $('#pedido-form');
  const done = $('[data-done]');
  let sheetReady = false;
  let checkoutTracked = false;

  function openSheet() {
    if (!sheetReady) {
      sheetReady = true;
      const isForm = C.checkoutMode !== 'whatsapp';
      sheet.dataset.mode = isForm ? 'form' : 'whatsapp';
      $('[data-form-only]', sheet).disabled = !isForm;
      $('#f-dep').insertAdjacentHTML('beforeend', DEPARTAMENTOS.map(d => `<option>${d}</option>`).join(''));
      const pays = C.paymentMethods || [];
      $('[data-pay]').innerHTML = pays.map(p =>
        `<label class="pay"><input type="radio" name="pago" value="${p}" required${pays.length === 1 ? ' checked' : ''}><span>${p}</span></label>`).join('');
    }
    sheet.showModal();
  }

  function startCheckout(source) {
    track('AddToCart', { source });
    // Modo WhatsApp con talla ya elegida: directo a WhatsApp, sin pasos extra
    if (C.checkoutMode === 'whatsapp' && state.size) {
      track('InitiateCheckout', { source });
      openWA(orderMessage());
      return;
    }
    openSheet();
  }

  function showDone(kind, order, msg) {
    const copy = {
      saved: ['¡Pedido recibido!', `Gracias, ${order.nombre.split(' ')[0]}. Tu número de pedido es ${order.id}. Te escribiremos por WhatsApp para confirmar el envío.`, 'Escribir por WhatsApp'],
      whatsapp: ['¡Ya casi!', 'Se abrió WhatsApp con tu pedido. Envía el mensaje para confirmarlo.', 'Abrir WhatsApp de nuevo'],
      error: ['No pudimos enviar tu pedido', 'Revisa tu conexión o envíanos el pedido por WhatsApp y lo confirmamos.', 'Enviar por WhatsApp']
    }[kind];
    setText('[data-done-title]', copy[0]);
    setText('[data-done-text]', copy[1]);
    setText('[data-done-cta]', copy[2]);
    // Datos de pago del método elegido (solo aparecen aquí, después de confirmar)
    const payBox = $('[data-done-pay]');
    const num = kind !== 'error' && payNumber(order.pago);
    const note = kind !== 'error' && (C.paymentNotes || {})[order.pago];
    payBox.hidden = !num && !note;
    payBox.innerHTML = '';
    const strong = document.createElement('strong');
    if (num) {
      payBox.append('Paga por ' + order.pago + ' al número:');
      strong.textContent = num;
      payBox.append(strong, 'Total del producto: ' + money(order.total) + ' + envío. Antes de pagar, confirma por WhatsApp el valor del envío a tu ciudad.');
    } else if (note) {
      strong.textContent = order.pago;
      payBox.append(strong, note + ' Total del producto: ' + money(order.total) + ' + envío.');
    }
    $('[data-done-wa]').href = waLink(msg);
    form.hidden = true;
    done.hidden = false;
    $('[data-done-wa]').focus();
  }

  form.addEventListener('focusin', e => {
    if (checkoutTracked || !e.target.closest('[data-form-only]')) return;
    checkoutTracked = true;
    track('InitiateCheckout', { source: 'form' });
  });

  $('#f-cel').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10); });

  /* ---------- Validación con mensajes claros (en vez del aviso del navegador) ---------- */
  const GROUP = '.field, .in, .pays, .consent';
  function errorText(el) {
    if (el.name === 'size_o') return 'Elige tu talla para continuar.';
    if (el.name === 'pago') return 'Elige cómo vas a pagar.';
    if (el.name === 'datos') return 'Acepta el tratamiento de datos para enviar tu pedido.';
    if (el.name === 'departamento') return 'Elige tu departamento.';
    if (el.name === 'celular' && el.validity.patternMismatch) return 'Escribe un celular de 10 dígitos que empiece por 3.';
    return 'Completa este dato.';
  }
  function showErrors() {
    const invalid = $$(':invalid', form).filter(el => el.matches('input, select'));
    invalid.forEach(el => {
      const g = el.closest(GROUP);
      if (!g || g.classList.contains('has-error')) return;
      g.classList.add('has-error');
      const p = document.createElement('p');
      p.className = 'field-error';
      p.setAttribute('role', 'alert');
      p.textContent = errorText(el);
      g.appendChild(p);
    });
    const first = invalid[0];
    if (first) {
      first.closest(GROUP).scrollIntoView({ block: 'center', behavior: 'smooth' });
      first.focus({ preventScroll: true });
    }
  }
  function clearError(e) {
    const g = e.target.closest && e.target.closest(GROUP);
    if (!g || !g.classList.contains('has-error') || $(':invalid', g)) return;
    g.classList.remove('has-error');
    const p = $('.field-error', g);
    if (p) p.remove();
  }
  form.addEventListener('input', clearError);
  form.addEventListener('change', clearError);

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (!form.checkValidity()) { showErrors(); return; }
    if (C.checkoutMode === 'whatsapp') {
      track('InitiateCheckout', { source: 'sheet' });
      openWA(orderMessage());
      sheet.close();
      return;
    }

    const d = Object.fromEntries(new FormData(form));
    const order = {
      id: 'CM-' + Date.now().toString(36).toUpperCase(),
      fecha: new Date().toISOString(),
      producto: C.productName, sku: C.sku,
      color: colorObj().name, talla: state.size, cantidad: state.qty,
      precioUnitario: unitPrice(), total: total(),
      nombre: d.nombre.trim(), celular: d.celular, departamento: d.departamento,
      ciudad: d.ciudad.trim(), direccion: d.direccion.trim(), indicaciones: (d.indicaciones || '').trim(), pago: d.pago
    };
    const msg = orderMessage(order);

    // Sin endpoint: el pedido se envía como mensaje de WhatsApp
    if (!C.orderEndpoint) {
      track('Purchase', { orderId: order.id });
      openWA(msg);
      showDone('whatsapp', order, msg);
      return;
    }

    const btn = $('[data-submit]');
    btn.disabled = true;
    try {
      // text/plain evita el preflight CORS (compatible con Google Apps Script)
      await fetch(C.orderEndpoint, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(order) });
      track('Purchase', { orderId: order.id });
      showDone('saved', order, msg);
    } catch (err) {
      showDone('error', order, msg);
    } finally {
      btn.disabled = false;
    }
  });

  sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
  sheet.addEventListener('close', () => {
    if (done.hidden) return;
    form.reset();
    form.hidden = false;
    done.hidden = true;
    sync();
  });

  /* ---------- Eventos (delegación: 2 listeners para toda la página) ---------- */
  document.addEventListener('change', e => {
    const k = e.target.dataset && e.target.dataset.kind;
    if (!k) return;
    state[k] = e.target.value;
    sync();
  });

  document.addEventListener('click', e => {
    const t = e.target;
    const step = t.closest('[data-qty-step]');
    if (step) {
      state.qty = Math.min(Math.max(state.qty + Number(step.dataset.qtyStep), 1), C.maxQty || 10);
      sync();
      return;
    }
    const tab = t.closest('[role="tab"]');
    if (tab) { selectTab(tab); return; }
    const buy = t.closest('[data-buy]');
    if (buy) { startCheckout(buy.dataset.source); return; }
    if (t.closest('[data-close]')) { sheet.close(); return; }
    const wa = t.closest('[data-wa]');
    if (wa) track('ClickWhatsApp', { source: wa.dataset.wa });
  });

  /* ---------- Smart CTA: el fijo se vuelve discreto si ya se ve otro botón de compra ---------- */
  function smartCta() {
    const bar = $('[data-sticky]');
    if (!bar || !('IntersectionObserver' in window)) return;
    const visible = new Set();
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => (en.isIntersecting ? visible.add(en.target) : visible.delete(en.target)));
      bar.classList.toggle('is-quiet', visible.size > 0);
    }, { threshold: 0.5 });
    $$('[data-buy]').filter(b => !bar.contains(b)).forEach(b => io.observe(b));
  }

  /* ---------- Init ---------- */
  renderOptions();
  // data-wa-msg permite un mensaje distinto por enlace (si no, usa whatsappMessage)
  $$('a[data-wa]:not([data-done-wa])').forEach(a => { a.href = waLink(a.dataset.waMsg || C.whatsappMessage); });
  sync();
  smartCta();
  track('ViewContent');
  scheduleTrackers();
})();
