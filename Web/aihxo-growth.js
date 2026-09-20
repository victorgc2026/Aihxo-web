(() => {
  'use strict';

  const once = new Set();

  function text(el) {
    return (el?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120);
  }

  function productContext(el) {
    const card = el?.closest?.('.product');
    if (!card) return {};
    const name = text(card.querySelector('h3')) || 'Producto AIHXO';
    const price = Number(card.dataset.orderPrice || 0);
    return {
      item_name: name,
      value: Number.isFinite(price) ? price : undefined,
      currency: 'EUR'
    };
  }

  function cleanParams(params = {}) {
    return Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
  }

  function track(name, params = {}) {
    const payload = cleanParams({
      ...params,
      page_path: location.pathname,
      page_title: document.title
    });

    if (typeof window.gtag === 'function') {
      window.gtag('event', name, payload);
    }

    window.dispatchEvent(new CustomEvent('aihxo:analytics', {
      detail: { name, params: payload }
    }));
  }

  window.aihxoTrack = track;

  // Guarda la procedencia de la visita durante la sesión para poder atribuir pedidos.
  try {
    const qs = new URLSearchParams(location.search);
    const source = {
      utm_source: qs.get('utm_source'),
      utm_medium: qs.get('utm_medium'),
      utm_campaign: qs.get('utm_campaign'),
      utm_content: qs.get('utm_content'),
      referrer: document.referrer || ''
    };
    const hasCampaign = Object.values(source).some(Boolean);
    if (hasCampaign && !sessionStorage.getItem('aihxo_traffic_source')) {
      sessionStorage.setItem('aihxo_traffic_source', JSON.stringify(source));
    }
  } catch (_) {}

  document.addEventListener('click', (event) => {
    const el = event.target.closest('a,button,summary');
    if (!el) return;

    const href = el.getAttribute('href') || '';

    if (/wa\.me|whatsapp/i.test(href)) {
      track('contact_whatsapp', { link_text: text(el), ...productContext(el) });
      return;
    }

    if (/instagram\.com/i.test(href)) {
      track('social_click', { social_network: 'instagram', link_text: text(el) });
      return;
    }

    if (/tiktok\.com/i.test(href)) {
      track('social_click', { social_network: 'tiktok', link_text: text(el) });
      return;
    }

    if (href.startsWith('mailto:')) {
      track('contact_email', { link_text: text(el) });
      return;
    }

    if (el.id === 'openPersonalCatalog') {
      track('personalization_start', { source: 'home' });
      return;
    }

    if (el.id === 'collectionToggle') {
      track('collection_expand', { label: text(el) });
      return;
    }

    if (el.matches('[data-collection-filter]')) {
      track('collection_filter', { filter: el.dataset.collectionFilter });
      return;
    }

    if (el.matches('[data-personal-filter]')) {
      track('personalization_filter', { filter: el.dataset.personalFilter });
      return;
    }

    if (el.matches('[data-opcion-diseno]')) {
      track('select_item_option', {
        option_type: el.dataset.opcionDiseno,
        option_value: text(el),
        ...productContext(el)
      });
      return;
    }

    const onclick = el.getAttribute('onclick') || '';

    if (/comprarDisenoPropio/.test(onclick)) {
      track('begin_checkout', { checkout_type: 'design', ...productContext(el) });
      return;
    }

    if (/pedirProductoPersonalizado/.test(onclick)) {
      track('begin_checkout', { checkout_type: 'custom', ...productContext(el) });
      return;
    }

    if (/elegirImpresionProducto/.test(onclick)) {
      track('personalization_print_option', {
        option: onclick.includes('(2)') ? '2_prints' : '1_print',
        ...productContext(el)
      });
      return;
    }

    if (/confirmarPedidoConCupon/.test(onclick)) {
      track('checkout_to_whatsapp', { method: 'whatsapp' });
      return;
    }

    if (/aplicarCuponAIHXO/.test(onclick)) {
      track('coupon_attempt');
      return;
    }

    if (el.tagName === 'SUMMARY' && el.closest('.aihxo-product-details')) {
      track('view_item_detail', productContext(el));
    }
  }, true);

  // Mide qué bloques de la portada llegan realmente a verse.
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.35) return;
        const id = entry.target.id;
        if (!id || once.has(id)) return;
        once.add(id);
        track('view_section', { section: id });
        observer.unobserve(entry.target);
      });
    }, { threshold: [0.35] });

    ['coleccion', 'personaliza', 'catalogo', 'x-memories', 'contacto'].forEach((id) => {
      const node = document.getElementById(id);
      if (node) observer.observe(node);
    });
  }

  // Integración preparada para Microsoft Clarity.
  // Al definir window.AIHXO_CLARITY_ID con el ID del proyecto, se activa sin más cambios.
  if (window.AIHXO_CLARITY_ID) {
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, 'clarity', 'script', window.AIHXO_CLARITY_ID);
  }
})();