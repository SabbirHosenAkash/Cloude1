/* Sabbir Hosen Akash — site script (flat file version: no folders needed).
   Handles: header/footer, theme, animations, page rendering (services/projects/marketplace/blog/contact),
   forms (Cloudflare Worker), and live data from Supabase (falls back to data.js). */
(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {}, SEED = window.SEED || {};
  var NAME = 'Sabbir Hosen Akash', WA = CFG.WHATSAPP || '8801620302210', EMAIL = 'info.sabbirhosenakash@gmail.com';
  var root = document.documentElement; root.classList.add('js');
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var arr = function (v) { return Array.isArray(v) ? v : []; };
  var safeUrl = function (u) { return /^(https?:\/\/[^\s"'<>]+|[A-Za-z0-9_\-.\/]+\.(webp|png|jpe?g|gif|svg))$/i.test(u || '') ? u : ''; };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.getAttribute('data-page') || 'home';
  var param = function (k) { return new URLSearchParams(location.search).get(k); };

  // ---------- safe mini markdown ----------
  function md(src) {
    var lines = esc(src || '').split(/\r?\n/), out = [], list = false, para = [];
    function inline(s) { return s.replace(/!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/g, '<img loading="lazy" src="$2" alt="$1">').replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/`([^`]+)`/g, '<code>$1</code>'); }
    function flush() { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } }
    lines.forEach(function (l) {
      var m;
      if ((m = l.match(/^(#{1,3})\s+(.*)$/))) { flush(); if (list) { out.push('</ul>'); list = false; } var n = Math.min(m[1].length + 1, 4); out.push('<h' + n + '>' + inline(m[2]) + '</h' + n + '>'); }
      else if ((m = l.match(/^[-*]\s+(.*)$/))) { flush(); if (!list) { out.push('<ul>'); list = true; } out.push('<li>' + inline(m[1]) + '</li>'); }
      else if (!l.trim()) { flush(); if (list) { out.push('</ul>'); list = false; } }
      else para.push(l.trim());
    });
    flush(); if (list) out.push('</ul>'); return out.join('\n');
  }

  // ---------- theme ----------
  function applyTheme(t) { root.setAttribute('data-theme', t); var b = $('#theme-toggle'); if (b) { b.innerHTML = t === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>'; b.setAttribute('aria-label', t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'); } var m = $('meta[name="theme-color"]'); if (m) m.setAttribute('content', t === 'dark' ? '#07090b' : '#f6f8f7'); }
  var saved = null; try { saved = localStorage.getItem('theme'); } catch (e) {}
  var theme0 = saved || 'dark'; // original identity is dark; visitors can switch to light

  // ---------- header / footer ----------
  var NAV = [['index.html', 'Home', 'home'], ['services.html', 'Services', 'services'], ['projects.html', 'Projects', 'projects'], ['marketplace.html', 'Marketplace', 'marketplace'], ['blog.html', 'Blog', 'blog'], ['index.html#music', 'Music', ''], ['index.html#books', 'Books', ''], ['contact.html', 'Contact', 'contact']];
  function chrome() {
    var h = $('#site-header'), f = $('#site-footer');
    if (h) h.outerHTML = '<div id="progress"></div><a class="skip-link" href="#main">Skip to content</a><nav class="navbar" aria-label="Main"><div class="container"><a class="brand" href="index.html"><img src="favicon-32x32.png" alt="" width="34" height="34"><span>' + NAME + '</span></a><ul id="nav-links">' + NAV.map(function (n) { var key = { service: 'services', project: 'projects', product: 'marketplace', post: 'blog' }[page] || page; var cur = !!n[2] && n[2] === key; return '<li><a href="' + n[0] + '"' + (cur ? ' aria-current="page"' : '') + '>' + n[1] + '</a></li>'; }).join('') + '</ul><div class="nav-actions"><button class="icon-btn" id="theme-toggle" type="button" aria-label="Toggle theme"></button><a class="btn btn-primary btn-sm pulse" href="contact.html">Hire Me</a><button class="icon-btn menu-btn" type="button" aria-label="Menu" aria-expanded="false" aria-controls="nav-links"><i class="fas fa-bars"></i></button></div></div></nav>';
    if (f) f.outerHTML = '<footer><div class="container"><div class="footer-grid"><div><a class="brand" href="index.html"><img src="favicon-32x32.png" alt="" width="34" height="34"><span>' + NAME + '</span></a><p style="margin-top:12px">Web Developer, Digital Creator, Writer and Musician from Bangladesh. Available for international client work.</p></div><div><h4>Work</h4><a href="services.html">Services</a><a href="projects.html">Projects</a><a href="marketplace.html">Marketplace</a><a href="blog.html">Blog</a></div><div><h4>About</h4><a href="index.html#music">Music</a><a href="index.html#books">Books</a><a href="index.html#education">Education</a><a href="contact.html">Contact</a></div><div><h4>Connect</h4><a href="https://github.com/SabbirHosenAkash" rel="noopener">GitHub</a><a href="https://www.linkedin.com/in/sabbir-hosen-akash" rel="noopener">LinkedIn</a><a href="https://wa.me/' + WA + '" rel="noopener">WhatsApp</a><a href="mailto:' + EMAIL + '">Email</a></div></div><p class="copy">© ' + new Date().getFullYear() + ' ' + NAME + '. All rights reserved.</p></div></footer><button id="to-top" type="button" aria-label="Back to top"><i class="fas fa-arrow-up"></i></button><div class="install-banner" id="install-banner" role="dialog" aria-label="Install app"><span>Install Sabbir\'s app for a better experience</span><span><button class="btn btn-primary btn-sm" id="btn-install" type="button">Install</button> <button class="icon-btn" id="btn-close" type="button" aria-label="Dismiss" style="display:inline-grid;width:36px;height:36px">×</button></span></div>';
    applyTheme(theme0);
  }
  chrome();

  document.addEventListener('click', function (e) {
    if (e.target.closest('#theme-toggle')) { var n = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(n); try { localStorage.setItem('theme', n); } catch (x) {} }
    if (e.target.closest('.menu-btn')) { var open = $('#nav-links').classList.toggle('active'); $('.menu-btn').setAttribute('aria-expanded', open); }
    if (e.target.closest('#nav-links a')) $('#nav-links').classList.remove('active');
    var sk = e.target.closest('.skip-link'); if (sk) { e.preventDefault(); var mn = $('#main'); if (mn) { mn.setAttribute('tabindex', '-1'); mn.focus(); } }
    if (e.target.closest('#to-top')) window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
  var nb = $('.navbar'), pr = $('#progress'), tt = $('#to-top'), tick = false;
  function onScroll() { var y = window.scrollY, h = document.documentElement.scrollHeight - innerHeight; if (nb) nb.classList.toggle('scrolled', y > 30); if (pr) pr.style.width = (h > 0 ? y / h * 100 : 0) + '%'; if (tt) tt.classList.toggle('show', y > 600); tick = false; }
  window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(onScroll); } }, { passive: true }); onScroll();

  // ---------- reveal on scroll + 3D tilt ----------
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } }); }, { threshold: .12, rootMargin: '0px 0px -40px 0px' }) : null;
  function initReveal() { $$('.reveal:not(.in)').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); }); $$('.section-title:not(.reveal)').forEach(function (el) { el.classList.add('reveal'); if (io) io.observe(el); else el.classList.add('in'); }); }
  if (window.matchMedia && matchMedia('(hover: hover)').matches && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.card, .showcase'); if (!c || c.matches('.showcase')) return;
      var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      c.style.transform = 'perspective(800px) translateY(-6px) rotateX(' + (-y * 7).toFixed(2) + 'deg) rotateY(' + (x * 9).toFixed(2) + 'deg)';
    });
    document.addEventListener('pointerout', function (e) { var c = e.target.closest && e.target.closest('.card'); if (c && !c.contains(e.relatedTarget)) c.style.transform = ''; });
  }

  // ---------- data ----------
  function sbGet(path) {
    if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY) return Promise.resolve(null);
    return fetch(CFG.SUPABASE_URL + '/rest/v1/' + path, { headers: { apikey: CFG.SUPABASE_ANON_KEY, Authorization: 'Bearer ' + CFG.SUPABASE_ANON_KEY } }).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }
  var ORDER = { services: 'sort_order.asc', projects: 'sort_order.asc', website_products: 'sort_order.asc', blog_posts: 'published_at.desc', testimonials: 'sort_order.asc' };
  function rows(table) { return sbGet(table + '?select=*&published=eq.true&order=' + ORDER[table]).then(function (r) { return r || SEED[table] || []; }); }
  var price = function (p) { return p.price != null ? esc(p.currency || 'USD') + ' ' + Number(p.price).toLocaleString('en-US') : 'Ask for price'; };
  var img = function (u) { return safeUrl(u); };

  // ---------- meta / SEO for dynamic pages ----------
  function setMeta(o) {
    var url = location.origin + location.pathname + (o.q ? '?s=' + encodeURIComponent(o.q) : '');
    document.title = o.title;
    function m(sel, attr, val) { var el = $(sel); if (!el) { el = document.createElement(sel.indexOf('link') === 0 ? 'link' : 'meta'); var a = /\[(\w+)="([^"]+)"\]/.exec(sel); el.setAttribute(a[1], a[2]); document.head.appendChild(el); } el.setAttribute(attr, val); }
    m('meta[name="description"]', 'content', o.desc || ''); m('link[rel="canonical"]', 'href', url);
    m('meta[property="og:title"]', 'content', o.title); m('meta[property="og:description"]', 'content', o.desc || ''); m('meta[property="og:url"]', 'content', url);
    m('meta[property="og:image"]', 'content', location.origin + '/' + (img(o.image) && !/^https?:/.test(o.image) ? o.image : (/^https?:/.test(o.image || '') ? '' : 'sabbir.png'))); 
    if (/^https?:/.test(o.image || '') && img(o.image)) m('meta[property="og:image"]', 'content', o.image);
    if (o.ld) { var s = $('#ld-dyn'); if (!s) { s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'ld-dyn'; document.head.appendChild(s); } s.textContent = JSON.stringify(o.ld).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026'); }
  }
  var crumbs = function (items) { return '<p class="breadcrumb"><a href="index.html">Home</a>' + items.map(function (i) { return ' / ' + (i[0] ? '<a href="' + i[0] + '">' + esc(i[1]) + '</a>' : esc(i[1])); }).join('') + '</p>'; };
  var list = function (a) { return arr(a).length ? '<ul class="check">' + arr(a).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; };
  var tags = function (a) { return arr(a).length ? '<ul class="tags">' + arr(a).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' : ''; };
  var sec = function (t, h) { return h ? '<h2>' + t + '</h2>' + h : ''; };
  var delay = function (i) { return ' style="--d:' + Math.min(i * 0.08, 0.5).toFixed(2) + 's"'; };
  var notFound = function (what, back) { return '<section class="page-hero"><div class="container"><h1>' + what + ' not found</h1><p><a class="btn btn-primary" href="' + back + '">Go back</a></p></div></section>'; };

  var BUDGETS = '<option value="">Select budget</option><option>Under $200</option><option>$200 – $500</option><option>$500 – $1,000</option><option>$1,000 – $3,000</option><option>$3,000+</option><option>Not sure yet</option>';
  var svcOptions = function (s) { return '<option value="">Select a service</option>' + s.map(function (x) { return '<option data-slug="' + esc(x.slug) + '">' + esc(x.title) + '</option>'; }).join('') + '<option>Music / Distribution</option><option>Other</option>'; };
  function contactFormHtml(services, idp) {
    return '<form class="form-card" data-kind="contact" novalidate><div class="form-row"><div><label for="' + idp + 'name">Full name *</label><input id="' + idp + 'name" name="name" required maxlength="120" autocomplete="name"></div><div><label for="' + idp + 'email">Email *</label><input id="' + idp + 'email" name="email" type="email" required maxlength="254" autocomplete="email" inputmode="email"></div></div><div class="form-row"><div><label for="' + idp + 'country">Country</label><input id="' + idp + 'country" name="country" maxlength="80" autocomplete="country-name"></div><div><label for="' + idp + 'budget">Budget</label><select id="' + idp + 'budget" name="budget">' + BUDGETS + '</select></div></div><label for="' + idp + 'service">Service</label><select id="' + idp + 'service" name="service">' + svcOptions(services) + '</select><label for="' + idp + 'msg">Project description *</label><textarea id="' + idp + 'msg" name="message" rows="5" required minlength="5" maxlength="4000"></textarea><div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div><button type="submit" class="btn btn-primary">Send message <i class="fas fa-paper-plane"></i></button><div class="form-status" role="status" aria-live="polite"></div></form>';
  }
  var serviceCard = function (s, i) { return '<article class="card reveal"' + delay(i) + '><i class="fas ' + esc(s.icon || 'fa-code') + '" aria-hidden="true"></i><h3>' + esc(s.title) + '</h3><p>' + esc(s.summary) + '</p><a class="btn btn-outline btn-sm" href="service.html?s=' + encodeURIComponent(s.slug) + '">Details</a></article>'; };
  var projectCard = function (p, i) { return '<article class="card reveal"' + delay(i) + '>' + (img(p.cover_image) ? '<img class="card-img" loading="lazy" src="' + esc(p.cover_image) + '" alt="' + esc(p.title) + ' preview">' : '') + '<span class="pill-status">' + esc(String(p.status).replace('_', ' ')) + '</span><h3>' + esc(p.title) + '</h3><p>' + esc(p.summary) + '</p><a class="btn btn-outline btn-sm" href="project.html?s=' + encodeURIComponent(p.slug) + '">Case study</a></article>'; };
  var productCard = function (p, i) { return '<article class="card reveal"' + delay(i) + '>' + (img(p.cover_image) ? '<img class="card-img" loading="lazy" src="' + esc(p.cover_image) + '" alt="' + esc(p.name) + ' preview">' : '') + '<h3>' + esc(p.name) + '</h3><p>' + esc(p.summary) + '</p><div class="price">' + price(p) + '</div><a class="btn btn-primary btn-sm" href="product.html?s=' + encodeURIComponent(p.slug) + '">View &amp; order</a></article>'; };
  var postDate = function (p) { return new Date(p.published_at || p.created_at || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }); };
  var postCard = function (p, i) { return '<article class="card reveal"' + delay(i) + '>' + (img(p.cover_image) ? '<img class="card-img" loading="lazy" src="' + esc(p.cover_image) + '" alt="' + esc(p.title) + '">' : '') + '<div class="tags">' + arr(p.categories).map(function (c) { return '<span class="tag">' + esc(c) + '</span>'; }).join('') + '</div><h3>' + esc(p.title) + '</h3><p>' + esc(p.excerpt) + '</p><small style="color:var(--muted)">' + postDate(p) + '</small><a class="btn btn-outline btn-sm" href="post.html?s=' + encodeURIComponent(p.slug) + '">Read article</a></article>'; };
  var heroBlock = function (cr, h1, p) { return '<section class="page-hero"><div class="container">' + cr + '<h1>' + esc(h1) + '</h1>' + (p ? '<p>' + esc(p) + '</p>' : '') + '</div></section>'; };
  var wrap = function (inner) { return '<section style="padding-top:30px"><div class="container">' + inner + '</div></section>'; };
  var bcLD = function (items) { return { '@type': 'BreadcrumbList', itemListElement: items.map(function (x, i) { return { '@type': 'ListItem', position: i + 1, name: x[0], item: location.origin + '/' + x[1] }; }) }; };

  // ---------- page renderers ----------
  var view = $('#view');
  function done(html) { view.innerHTML = html; initReveal(); wireForms(); prefill(); }
  var R = {};
  R.services = function () { return rows('services').then(function (s) { setMeta({ title: 'Web Development & Digital Services | ' + NAME, desc: 'Website development, e-commerce, web apps, UI/UX, SEO, custom software and AI integration services by Sabbir Hosen Akash.' }); done(heroBlock(crumbs([[null, 'Services']]), 'Services', 'Every project starts with a free conversation. Pricing is a custom quotation based on your scope.') + wrap('<div class="grid">' + s.map(serviceCard).join('') + '</div>')); }); };
  R.service = function () { return rows('services').then(function (all) {
    var s = all.filter(function (x) { return x.slug === param('s'); })[0]; if (!s) return done(notFound('Service', 'services.html'));
    var f = arr(s.faqs);
    setMeta({ q: s.slug, title: s.seo_title || s.title + ' Services | ' + NAME, desc: s.seo_description || s.summary || s.description, ld: { '@context': 'https://schema.org', '@graph': [bcLD([['Home', 'index.html'], ['Services', 'services.html'], [s.title, 'service.html?s=' + s.slug]]), { '@type': 'Service', name: s.title, description: s.description, provider: { '@type': 'Person', name: NAME }, areaServed: 'Worldwide' }].concat(f.length ? [{ '@type': 'FAQPage', mainEntity: f.map(function (q) { return { '@type': 'Question', name: q.q, acceptedAnswer: { '@type': 'Answer', text: q.a } }; }) }] : []) } });
    done(heroBlock(crumbs([['services.html', 'Services'], [null, s.title]]), s.title, s.summary) + wrap('<div class="detail"><div class="reveal"><h2>Overview</h2><p>' + esc(s.description) + '</p>' + sec('Features &amp; benefits', list(s.features)) + sec("What's included", list(s.included)) + sec('Ideal for', tags(s.ideal_for)) + sec('Development process', arr(s.process).length ? '<ol class="steps">' + arr(s.process).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>' : '') + (f.length ? '<h2>Frequently asked questions</h2>' + f.map(function (q) { return '<details class="faq"><summary>' + esc(q.q) + '</summary><p>' + esc(q.a) + '</p></details>'; }).join('') : '') + '</div><aside class="side reveal right"><div class="card"><span class="eyebrow">Pricing</span><div class="price">' + esc(s.price_label || 'Custom quotation') + '</div><p>Tell me about your project and I will reply with a clear quotation.</p><a class="btn btn-primary" href="contact.html?service=' + encodeURIComponent(s.slug) + '">Request this service</a><a class="btn btn-outline" href="https://wa.me/' + WA + '?text=' + encodeURIComponent('Hi Sabbir, I am interested in: ' + s.title) + '" rel="noopener"><i class="fab fa-whatsapp"></i> WhatsApp</a></div></aside></div>')); }); };
  R.projects = function () { return rows('projects').then(function (p) { setMeta({ title: 'Projects & Case Studies | ' + NAME, desc: 'Selected projects and case studies by Sabbir Hosen Akash.' }); done(heroBlock(crumbs([[null, 'Projects']]), 'Projects', 'Real work only. Each project has its own case study.') + wrap(p.length ? '<div class="grid">' + p.map(projectCard).join('') + '</div>' : '<p class="empty">Projects coming soon.</p>')); }); };
  R.project = function () { return rows('projects').then(function (all) {
    var p = all.filter(function (x) { return x.slug === param('s'); })[0]; if (!p) return done(notFound('Project', 'projects.html'));
    var gal = arr(p.gallery).filter(img);
    setMeta({ q: p.slug, title: p.seo_title || p.title + ' — Case Study | ' + NAME, desc: p.seo_description || p.summary || p.overview, image: p.cover_image, ld: { '@context': 'https://schema.org', '@graph': [bcLD([['Home', 'index.html'], ['Projects', 'projects.html'], [p.title, 'project.html?s=' + p.slug]]), { '@type': 'CreativeWork', name: p.title, description: p.summary || p.overview, creator: { '@type': 'Person', name: NAME } }] } });
    done(heroBlock(crumbs([['projects.html', 'Projects'], [null, p.title]]), p.title, p.summary) + wrap('<div class="detail"><div class="reveal">' + (img(p.cover_image) ? '<img class="card-img" style="margin-bottom:24px" src="' + esc(p.cover_image) + '" alt="' + esc(p.title) + ' screenshot">' : '') + sec('Overview', p.overview ? '<p>' + esc(p.overview) + '</p>' : '') + sec('Objectives', p.objectives ? md(p.objectives) : '') + sec('My role', p.my_role ? '<p>' + esc(p.my_role) + '</p>' : '') + sec('Features', list(p.features)) + sec('Development process', p.process ? md(p.process) : '') + sec('Challenges &amp; solutions', p.challenges ? md(p.challenges) : '') + (gal.length ? '<h2>Gallery</h2><div class="gallery">' + gal.map(function (g, i) { return '<img loading="lazy" src="' + esc(g) + '" alt="' + esc(p.title) + ' screenshot ' + (i + 1) + '">'; }).join('') + '</div>' : '') + '</div><aside class="side reveal right"><div class="card"><span class="pill-status">' + esc(String(p.status).replace('_', ' ')) + '</span>' + (arr(p.technologies).length ? '<h3>Technologies</h3>' + tags(p.technologies) : '') + (safeUrl(p.live_url) ? '<a class="btn btn-primary" href="' + esc(p.live_url) + '" rel="noopener" target="_blank">Live demo <i class="fas fa-arrow-up-right-from-square"></i></a>' : '') + '<a class="btn btn-outline" href="contact.html">Start a similar project</a></div></aside></div>')); }); };
  R.marketplace = function () { return rows('website_products').then(function (p) { setMeta({ title: 'Ready-Made Website Marketplace | ' + NAME, desc: 'Ready-made websites built by Sabbir Hosen Akash. Preview, customise and send an order request.' }); done(heroBlock(crumbs([[null, 'Marketplace']]), 'Website Marketplace', 'Choose a website, tell me what you want changed, and send an order request. No online payment is taken on this site — I reply personally with a quote and payment instructions.') + wrap(p.length ? '<div class="grid">' + p.map(productCard).join('') + '</div>' : '<p class="empty">No websites listed yet. Need something specific? <a href="contact.html">Request a custom website</a>.</p>')); }); };
  R.product = function () { return rows('website_products').then(function (all) {
    var p = all.filter(function (x) { return x.slug === param('s'); })[0]; if (!p) return done(notFound('Website', 'marketplace.html'));
    var gal = arr(p.gallery).filter(img);
    setMeta({ q: p.slug, title: p.name + ' — Ready-made Website | ' + NAME, desc: p.summary || p.description, image: p.cover_image, ld: { '@context': 'https://schema.org', '@graph': [bcLD([['Home', 'index.html'], ['Marketplace', 'marketplace.html'], [p.name, 'product.html?s=' + p.slug]]), Object.assign({ '@type': 'Product', name: p.name, description: p.summary || p.description }, p.price != null ? { offers: { '@type': 'Offer', price: String(p.price), priceCurrency: p.currency || 'USD', availability: 'https://schema.org/InStock' } } : {})] } });
    done(heroBlock(crumbs([['marketplace.html', 'Marketplace'], [null, p.name]]), p.name, p.summary) + wrap('<div class="detail"><div class="reveal">' + (img(p.cover_image) ? '<img class="card-img" style="margin-bottom:24px" src="' + esc(p.cover_image) + '" alt="' + esc(p.name) + ' preview">' : '') + '<h2>Description</h2><p>' + esc(p.description) + '</p>' + sec('Features', list(p.features)) + sec('Technology stack', tags(p.tech_stack)) + sec('Customisation options', p.customization_options ? md(p.customization_options) : '') + (gal.length ? '<h2>Gallery</h2><div class="gallery">' + gal.map(function (g, i) { return '<img loading="lazy" src="' + esc(g) + '" alt="' + esc(p.name) + ' screenshot ' + (i + 1) + '">'; }).join('') + '</div>' : '') +
      '<h2 id="order">Order request</h2><p>This sends a request to me — no payment is taken here.</p><form class="form-card" data-kind="order" novalidate><input type="hidden" name="product_id" value="' + esc(p.id || '') + '"><input type="hidden" name="product_name" value="' + esc(p.name) + '"><div class="form-row"><div><label for="o-name">Full name *</label><input id="o-name" name="name" required maxlength="120" autocomplete="name"></div><div><label for="o-email">Email *</label><input id="o-email" name="email" type="email" required maxlength="254" autocomplete="email" inputmode="email"></div></div><div class="form-row"><div><label for="o-country">Country</label><input id="o-country" name="country" maxlength="80" autocomplete="country-name"></div><div><label for="o-budget">Budget</label><select id="o-budget" name="budget">' + BUDGETS + '</select></div></div><label for="o-req">Your requirements *</label><textarea id="o-req" name="requirements" rows="5" required minlength="5" maxlength="4000" placeholder="Business name, changes you need, domain, deadline…"></textarea><div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div><button class="btn btn-primary" type="submit">Send order request <i class="fas fa-paper-plane"></i></button><div class="form-status" role="status" aria-live="polite"></div></form></div><aside class="side reveal right"><div class="card"><div class="price">' + price(p) + '</div>' + (safeUrl(p.demo_url) ? '<a class="btn btn-outline" href="' + esc(p.demo_url) + '" target="_blank" rel="noopener">Live demo <i class="fas fa-arrow-up-right-from-square"></i></a>' : '') + '<a class="btn btn-primary" href="#order">Request this website</a></div></aside></div>')); }); };
  R.blog = function () { return rows('blog_posts').then(function (p) { setMeta({ title: 'Blog — Web Development, SEO & AI | ' + NAME, desc: 'Articles on web development, SEO, AI, programming and digital business by Sabbir Hosen Akash.' }); done(heroBlock(crumbs([[null, 'Blog']]), 'Blog', 'Web development, technology, AI, programming, SEO, digital business and personal experiences.') + wrap(p.length ? '<div class="grid">' + p.map(postCard).join('') + '</div>' : '<p class="empty">The first articles are on their way.</p>')); }); };
  R.post = function () { return rows('blog_posts').then(function (all) {
    var p = all.filter(function (x) { return x.slug === param('s'); })[0]; if (!p) return done(notFound('Article', 'blog.html'));
    var share = location.origin + location.pathname + '?s=' + encodeURIComponent(p.slug);
    setMeta({ q: p.slug, title: p.seo_title || p.title + ' | ' + NAME, desc: p.seo_description || p.excerpt || '', image: p.cover_image, ld: { '@context': 'https://schema.org', '@graph': [bcLD([['Home', 'index.html'], ['Blog', 'blog.html'], [p.title, 'post.html?s=' + p.slug]]), { '@type': 'Article', headline: p.title, description: p.seo_description || p.excerpt || '', datePublished: p.published_at || p.created_at, dateModified: p.updated_at || p.published_at || p.created_at, author: { '@type': 'Person', name: p.author || NAME }, mainEntityOfPage: share, keywords: arr(p.tags).join(', ') }] } });
    done('<section class="page-hero"><div class="container">' + crumbs([['blog.html', 'Blog'], [null, p.title]]) + '<h1>' + esc(p.title) + '</h1><p>By ' + esc(p.author || NAME) + ' · ' + postDate(p) + '</p></div></section><article style="padding:20px 0 80px"><div class="container prose reveal">' + (img(p.cover_image) ? '<img class="card-img" style="margin-bottom:26px" src="' + esc(p.cover_image) + '" alt="' + esc(p.title) + '">' : '') + '<div class="tags" style="margin-bottom:18px">' + arr(p.categories).concat(arr(p.tags)).map(function (c) { return '<span class="tag">' + esc(c) + '</span>'; }).join('') + '</div>' + md(p.content) + '<p style="margin-top:30px"><a class="btn btn-outline btn-sm" href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(share) + '&text=' + encodeURIComponent(p.title) + '" rel="noopener" target="_blank"><i class="fab fa-x-twitter"></i> Share</a> <a class="btn btn-outline btn-sm" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(share) + '" rel="noopener" target="_blank"><i class="fab fa-facebook-f"></i> Share</a></p></div></article>'); }); };
  R.contact = function () { return rows('services').then(function (s) { setMeta({ title: 'Contact & Hire Me | ' + NAME, desc: 'Start a project with Sabbir Hosen Akash. Send a project inquiry, message on WhatsApp or email.' }); done(heroBlock(crumbs([[null, 'Contact']]), 'Hire Me / Contact', 'Send your project details. I read every message personally.') + wrap('<div class="contact-layout"><div class="reveal">' + contactFormHtml(s, 'c-') + '</div><div class="contact-details card reveal right"><h3>Direct contact</h3><p><i class="fab fa-whatsapp"></i><a href="https://wa.me/' + WA + '" rel="noopener">+' + WA + '</a></p><p><i class="fas fa-envelope"></i><a href="mailto:' + EMAIL + '">' + EMAIL + '</a></p><p><i class="fas fa-map-marker-alt"></i>Sandwip, Chittagong, Bangladesh</p><a class="btn btn-outline" href="https://wa.me/' + WA + '" rel="noopener"><i class="fab fa-whatsapp"></i> Chat on WhatsApp</a></div></div>')); }); };

  // ---------- home ----------
  function home() {
    rows('services').then(function (s) { var g = $('#services-grid'); if (g) { g.innerHTML = s.map(serviceCard).join(''); } var sel = $('#h-service'); if (sel) sel.innerHTML = svcOptions(s); initReveal(); });
    rows('projects').then(function (p) { var g = $('#project-cards'); if (g) g.innerHTML = p.slice(0, 3).map(projectCard).join(''); initReveal(); });
    rows('website_products').then(function (p) { var g = $('#products-teaser'); if (g) g.innerHTML = p.length ? '<div class="grid">' + p.slice(0, 3).map(productCard).join('') + '</div>' : '<p class="empty">New ready-made websites are coming soon. Tell me what you need and I will build it for you.</p>'; initReveal(); });
    sbGet('testimonials?select=client_name,client_role,country,quote&published=eq.true&order=sort_order.asc&limit=6').then(function (t) { if (!t || !t.length) return; $('#testimonials-grid').innerHTML = t.map(function (x, i) { return '<figure class="card reveal"' + delay(i) + '><i class="fas fa-quote-left"></i><blockquote class="quote">' + esc(x.quote) + '</blockquote><figcaption class="quote-by">— ' + esc(x.client_name) + (x.client_role ? ', ' + esc(x.client_role) : '') + (x.country ? ' (' + esc(x.country) + ')' : '') + '</figcaption></figure>'; }).join(''); $('#testimonials').hidden = false; initReveal(); });
    sbGet('blog_posts?select=slug,title,excerpt,cover_image,categories,published_at&published=eq.true&order=published_at.desc&limit=3').then(function (p) { if (!p || !p.length) return; $('#latest-posts').innerHTML = p.map(postCard).join(''); $('#blog').hidden = false; initReveal(); });
    // typing effect
    var words = ['Web Developer', 'Digital Creator', 'Bangladeshi Musician', 'Creative Writer', 'SEO Expert'], el = $('#typing-effect');
    if (el) { if (reduce) el.textContent = words[0]; else { var wi = 0, ci = 0, del = false; (function t() { var w = words[wi]; el.textContent = w.substring(0, del ? --ci : ++ci); var d = del ? 60 : 110; if (!del && ci === w.length) { del = true; d = 1800; } else if (del && ci === 0) { del = false; wi = (wi + 1) % words.length; d = 400; } setTimeout(t, d); })(); } }
    // skills
    var fills = $$('.fill'), sio = new IntersectionObserver(function (en) { en.forEach(function (x) { if (x.isIntersecting) { x.target.style.width = x.target.style.getPropertyValue('--w'); sio.unobserve(x.target); } }); }, { threshold: .4 }); fills.forEach(function (f) { sio.observe(f); });
    var cv = $('#cv-btn'); if (cv) ['CV.pdf', 'CV.png'].reduce(function (p, f) { return p.then(function (found) { return found || fetch(f, { method: 'HEAD' }).then(function (r) { return r.ok ? f : null; }).catch(function () { return null; }); }); }, Promise.resolve(null)).then(function (f) { if (f) { cv.href = f; cv.hidden = false; } });
    window.addEventListener('load', function () {
      if (window.Swiper && $('.project-slider')) new Swiper('.project-slider', { loop: true, autoplay: { delay: 3200, disableOnInteraction: false }, pagination: { el: '.swiper-pagination', clickable: true }, effect: 'coverflow', grabCursor: true, centeredSlides: true, slidesPerView: 'auto', coverflowEffect: { rotate: 40, stretch: 0, depth: 100, modifier: 1, slideShadows: true } });
      if (window.particlesJS && $('#particles-js') && !reduce) particlesJS('particles-js', { particles: { number: { value: innerWidth < 700 ? 30 : 60, density: { enable: true, value_area: 800 } }, color: { value: '#00ff88' }, shape: { type: 'circle' }, opacity: { value: .45, random: true }, size: { value: 3, random: true }, line_linked: { enable: true, distance: 150, color: '#00ff88', opacity: .18, width: 1 }, move: { enable: true, speed: 2 } }, interactivity: { detect_on: 'canvas', events: { onhover: { enable: true, mode: 'grab' }, onclick: { enable: false } } }, retina_detect: true });
    });
    initReveal(); wireForms(); prefill();
  }

  // ---------- forms ----------
  function wireForms() {
    $$('form[data-kind]:not([data-wired])').forEach(function (form) {
      form.setAttribute('data-wired', '1');
      var kind = form.dataset.kind, status = $('.form-status', form), btn = $('button[type=submit]', form);
      form.addEventListener('submit', function (e) {
        e.preventDefault(); if (!form.checkValidity()) { form.reportValidity(); return; }
        var data = {}; new FormData(form).forEach(function (v, k) { data[k] = v; });
        btn.disabled = true; var label = btn.innerHTML; btn.textContent = 'Sending…'; status.className = 'form-status'; status.textContent = '';
        var req;
        if (CFG.API_URL) req = fetch(CFG.API_URL.replace(/\/$/, '') + '/api/' + (kind === 'order' ? 'order' : 'contact'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw new Error(j.error || 'Request failed'); return j; }); });
        else if (kind === 'contact') { var fd = new FormData(form); fd.delete('website'); req = fetch('https://formsubmit.co/ajax/' + EMAIL, { method: 'POST', body: fd, headers: { Accept: 'application/json' } }).then(function (r) { if (!r.ok) throw new Error('Request failed'); return r.json(); }); }
        else req = Promise.reject(new Error('Order system is not connected yet. Please contact me on WhatsApp or email.'));
        req.then(function (j) { status.className = 'form-status ok'; status.textContent = '✔ Sent successfully' + (j && j.id ? ' (Ref: ' + j.id + ')' : '') + '. I will reply soon.'; form.reset(); })
          .catch(function (err) { status.className = 'form-status err'; status.textContent = '✖ ' + (err.message || 'Something went wrong') + ' — you can also email ' + EMAIL; })
          .then(function () { btn.disabled = false; btn.innerHTML = label; });
      });
    });
  }
  function prefill() { var s = param('service'); $$('select[name=service]').forEach(function (sel) { if (s) $$('option', sel).forEach(function (o) { if (o.dataset.slug === s) sel.value = o.value; }); }); }

  // ---------- misc ----------
  function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3500); }
  window.addEventListener('online', function () { toast('আপনি এখন অনলাইনে আছেন!'); }); window.addEventListener('offline', function () { toast('আপনার ইন্টারনেট সংযোগ বিচ্ছিন্ন হয়েছে।'); });
  if (CFG.GA_MEASUREMENT_ID) { var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(CFG.GA_MEASUREMENT_ID); document.head.appendChild(g); window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); }; gtag('js', new Date()); gtag('config', CFG.GA_MEASUREMENT_ID); }
  var dp, banner = $('#install-banner');
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); dp = e; setTimeout(function () { if (banner) banner.style.display = 'flex'; }, 8000); });
  if (banner) { $('#btn-install').addEventListener('click', function () { if (dp) { dp.prompt(); dp.userChoice.then(function () { banner.style.display = 'none'; dp = null; }); } }); $('#btn-close').addEventListener('click', function () { banner.style.display = 'none'; }); }
  if ('serviceWorker' in navigator) window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });

  if (page === 'home') home(); else if (R[page] && view) R[page]().catch(function (e) { console.error(e); view.innerHTML = '<p class="empty">Could not load this page. Please refresh.</p>'; });
  else initReveal();
})();
