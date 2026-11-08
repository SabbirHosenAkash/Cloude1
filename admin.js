(function () {
  'use strict';
  var CFG = window.SITE_CONFIG || {};
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var show = function (id, v) { $(id).hidden = !v; };
  var slugify = function (s) { return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); };
  var sb, me;

  if (!CFG.SUPABASE_URL || !CFG.SUPABASE_ANON_KEY || !window.supabase) { show('#notconfigured', true); return; }
  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

  // ----- entity definitions (drive the generic CRUD UI) -----
  var STATUS_P = ['planned', 'in_progress', 'completed', 'paused'];
  var ENT = {
    projects: { label: 'Projects', icon: 'fa-diagram-project', table: 'projects', cols: ['title', 'status', 'published'], order: 'sort_order', fields: [
      ['title', 'Title', 'text', 1], ['slug', 'URL slug (a-z, 0-9, -)', 'slug', 1], ['summary', 'Short summary', 'textarea'], ['overview', 'Overview', 'textarea'], ['objectives', 'Objectives (markdown)', 'textarea'], ['my_role', 'My role', 'text'],
      ['technologies', 'Technologies (comma separated)', 'array'], ['features', 'Features (one per line)', 'lines'], ['process', 'Development process (markdown)', 'textarea'], ['challenges', 'Challenges & solutions (markdown)', 'textarea'],
      ['live_url', 'Live demo URL', 'text'], ['cover_image', 'Cover image', 'image'], ['gallery', 'Gallery images (one URL per line)', 'lines'], ['status', 'Status', ['select', STATUS_P]],
      ['seo_title', 'SEO title', 'text'], ['seo_description', 'SEO description', 'textarea'], ['sort_order', 'Sort order', 'number'], ['published', 'Published', 'bool']] },
    services: { label: 'Services', icon: 'fa-briefcase', table: 'services', cols: ['title', 'price_label', 'published'], order: 'sort_order', fields: [
      ['title', 'Title', 'text', 1], ['slug', 'URL slug', 'slug', 1], ['icon', 'Font Awesome icon (e.g. fa-code)', 'text'], ['summary', 'Short summary', 'textarea'], ['description', 'Description', 'textarea'], ['features', 'Features (one per line)', 'lines'], ['included', "What's included (one per line)", 'lines'], ['ideal_for', 'Ideal customers (one per line)', 'lines'], ['process', 'Process steps (one per line)', 'lines'],
      ['faqs', 'FAQs (JSON: [{"q":"..","a":".."}])', 'json'], ['price_label', 'Pricing label', 'text'], ['seo_title', 'SEO title', 'text'], ['seo_description', 'SEO description', 'textarea'], ['sort_order', 'Sort order', 'number'], ['published', 'Published', 'bool']] },
    website_products: { label: 'Marketplace', icon: 'fa-store', table: 'website_products', cols: ['name', 'price', 'published'], order: 'sort_order', fields: [
      ['name', 'Website name', 'text', 1], ['slug', 'URL slug', 'slug', 1], ['summary', 'Short summary', 'textarea'], ['description', 'Description', 'textarea'], ['features', 'Features (one per line)', 'lines'], ['tech_stack', 'Tech stack (comma separated)', 'array'],
      ['price', 'Price', 'number'], ['currency', 'Currency', 'text'], ['customization_options', 'Customisation options (markdown)', 'textarea'], ['demo_url', 'Live demo URL', 'text'], ['cover_image', 'Cover image', 'image'], ['gallery', 'Preview images (one URL per line)', 'lines'], ['sort_order', 'Sort order', 'number'], ['published', 'Published', 'bool']] },
    blog_posts: { label: 'Blog', icon: 'fa-pen-nib', table: 'blog_posts', cols: ['title', 'published', 'published_at'], order: 'created_at', desc: true, fields: [
      ['title', 'Title', 'text', 1], ['slug', 'URL slug', 'slug', 1], ['excerpt', 'Excerpt', 'textarea'], ['content', 'Content (markdown: # headings, **bold**, - lists, [text](url), ![alt](url))', 'textarea', 1], ['cover_image', 'Cover image', 'image'], ['author', 'Author', 'text'],
      ['categories', 'Categories (comma separated)', 'array'], ['tags', 'Tags (comma separated)', 'array'], ['seo_title', 'SEO title', 'text'], ['seo_description', 'SEO description', 'textarea'], ['published', 'Published', 'bool']] },
    testimonials: { label: 'Testimonials', icon: 'fa-quote-left', table: 'testimonials', cols: ['client_name', 'country', 'published'], order: 'sort_order', fields: [
      ['client_name', 'Client name', 'text', 1], ['client_role', 'Role / company', 'text'], ['country', 'Country', 'text'], ['quote', 'Quote (real, approved testimonials only)', 'textarea', 1], ['rating', 'Rating 1-5', 'number'], ['sort_order', 'Sort order', 'number'], ['published', 'Published', 'bool']] },
  };
  var NAV = [['overview', 'Overview', 'fa-gauge'], ['projects'], ['services'], ['website_products'], ['orders', 'Orders', 'fa-cart-shopping'], ['messages', 'Messages', 'fa-inbox'], ['blog_posts'], ['testimonials'], ['media', 'Media Library', 'fa-images'], ['seo', 'SEO', 'fa-magnifying-glass-chart'], ['settings', 'Settings', 'fa-gear'], ['profile', 'Profile & Logs', 'fa-user-shield']];

  function toast(m) { var t = document.createElement('div'); t.className = 'toast'; t.textContent = m; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3000); }
  function fail(e) { console.error(e); toast('Error: ' + (e && e.message ? e.message : e)); }
  function token() { return sb.auth.getSession().then(function (r) { return r.data.session && r.data.session.access_token; }); }
  function api(path, opts) { if (!CFG.API_URL) return Promise.reject(new Error('API_URL not set in config.js')); return token().then(function (t) { return fetch(CFG.API_URL.replace(/\/$/, '') + path, Object.assign({ method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t } }, opts || {})); }); }
  function log(action, entity, id, details) { if (CFG.API_URL) api('/api/admin/log', { body: JSON.stringify({ action: action, entity: entity, entity_id: id, details: details }) }).catch(function () {}); else sb.from('admin_activity_logs').insert({ admin_id: me.id, admin_email: me.email, action: action, entity: entity, entity_id: id ? String(id) : null, details: details || null }).then(function () {}); }
  function modal(html) { $('#modal-body').innerHTML = html; show('#modal', true); }
  function closeModal() { show('#modal', false); $('#modal-body').innerHTML = ''; }
  function confirmBox(msg) { return window.confirm(msg); }

  // ----- auth -----
  function boot() {
    sb.auth.getSession().then(function (r) { if (r.data.session) return enter(r.data.session.user); show('#login', true); });
  }
  function enter(user) {
    return sb.from('admins').select('user_id').eq('user_id', user.id).maybeSingle().then(function (r) {
      if (r.error || !r.data) { sb.auth.signOut(); show('#login', true); $('#login-status').className = 'form-status err'; $('#login-status').textContent = 'This account is not an authorized administrator.'; return; }
      me = user; show('#login', false); show('#app', true); $('#a-user').textContent = user.email; renderNav(); go('overview'); log('login', 'auth', user.id);
    });
  }
  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault(); var st = $('#login-status'); st.className = 'form-status'; st.textContent = 'Signing in…';
    sb.auth.signInWithPassword({ email: $('#l-email').value.trim(), password: $('#l-pass').value }).then(function (r) { if (r.error) { st.className = 'form-status err'; st.textContent = 'Invalid email or password.'; return; } $('#l-pass').value = ''; return enter(r.data.user); });
  });

  // ----- nav -----
  function renderNav() { $('#a-nav').innerHTML = NAV.map(function (n) { var e = ENT[n[0]]; return '<button data-go="' + n[0] + '"><i class="fas ' + (e ? e.icon : n[2]) + '"></i>' + esc(e ? e.label : n[1]) + '</button>'; }).join('') + '<button data-go="logout"><i class="fas fa-right-from-bracket"></i>Sign out</button>'; }
  var current = 'overview';
  function go(v) {
    if (v === 'logout') { log('logout', 'auth', me.id); sb.auth.signOut().then(function () { location.reload(); }); return; }
    current = v; $('#a-nav').classList.remove('open');
    Array.prototype.forEach.call(document.querySelectorAll('#a-nav button'), function (b) { b.classList.toggle('on', b.dataset.go === v); });
    var m = $('#a-main'); m.innerHTML = '<p>Loading…</p>';
    (ENT[v] ? viewEntity(v) : { overview: viewOverview, orders: viewOrders, messages: viewMessages, media: viewMedia, seo: viewSeo, settings: viewSettings, profile: viewProfile }[v]())
      .catch(fail);
  }
  document.addEventListener('click', function (e) {
    var g = e.target.closest('[data-go]'); if (g) go(g.dataset.go);
    if (e.target.closest('#a-menu')) $('#a-nav').classList.toggle('open');
    if (e.target.id === 'modal' || e.target.closest('[data-close]')) closeModal();
  });

  // ----- overview -----
  function count(t, f) { var q = sb.from(t).select('id', { count: 'exact', head: true }); if (f) q = f(q); return q.then(function (r) { return r.count || 0; }); }
  function viewOverview() {
    return Promise.all([count('projects'), count('services'), count('website_products'), count('blog_posts'), count('orders', function (q) { return q.eq('status', 'new'); }), count('contact_messages', function (q) { return q.eq('status', 'new'); }), count('contact_messages', function (q) { return q.eq('telegram_status', 'failed'); })]).then(function (c) {
      var k = function (n, v) { return '<div class="kpi"><b>' + v + '</b>' + n + '</div>'; };
      $('#a-main').innerHTML = '<h1>Dashboard</h1><div class="cards4">' + k('New messages', c[5]) + k('New orders', c[4]) + k('Projects', c[0]) + k('Services', c[1]) + k('Marketplace items', c[2]) + k('Blog posts', c[3]) + k('Telegram failures (messages)', c[6]) + '</div><p class="hint">Everything you save here appears on the public website immediately — there is nothing else to publish.</p>';
    });
  }

  // ----- generic entity CRUD -----
  function cell(v) { if (typeof v === 'boolean') return '<span class="badge ' + (v ? 'ok' : '') + '">' + (v ? 'Published' : 'Draft') + '</span>'; if (v == null) return '—'; return esc(String(v).slice(0, 80)); }
  function viewEntity(key) {
    var E = ENT[key];
    var q = sb.from(E.table).select('*').order(E.order, { ascending: !E.desc });
    return q.then(function (r) {
      if (r.error) throw r.error; var rows = r.data || [];
      $('#a-main').innerHTML = '<h1>' + esc(E.label) + '<button class="btn btn-primary btn-sm" data-new="' + key + '"><i class="fas fa-plus"></i> Add new</button></h1><div class="tbl-wrap"><table><thead><tr>' + E.cols.map(function (c) { return '<th>' + esc(c.replace(/_/g, ' ')) + '</th>'; }).join('') + '<th></th></tr></thead><tbody>' + (rows.map(function (row) { return '<tr>' + E.cols.map(function (c) { return '<td>' + cell(row[c]) + '</td>'; }).join('') + '<td><div class="row-actions"><button class="btn btn-outline btn-sm" data-edit="' + key + ':' + row.id + '">Edit</button><button class="btn btn-outline btn-sm" data-toggle="' + key + ':' + row.id + '">' + (row.published ? 'Unpublish' : 'Publish') + '</button><button class="btn btn-outline btn-sm" data-del="' + key + ':' + row.id + '">Delete</button></div></td></tr>'; }).join('') || '<tr><td colspan="' + (E.cols.length + 1) + '">Nothing here yet.</td></tr>') + '</tbody></table></div>';
      $('#a-main')._rows = rows;
    });
  }
  function fieldHtml(f, val) {
    var k = f[0], label = f[1], t = f[2], req = f[3] ? ' required' : '', id = 'f-' + k;
    var L = '<label for="' + id + '">' + esc(label) + (f[3] ? ' *' : '') + '</label>';
    if (t === 'text' || t === 'slug') return L + '<input id="' + id + '" name="' + k + '" value="' + esc(val == null ? '' : val) + '"' + req + (t === 'slug' ? ' pattern="[a-z0-9-]+"' : '') + '>';
    if (t === 'number') return L + '<input id="' + id + '" name="' + k + '" type="number" step="any" value="' + esc(val == null ? '' : val) + '">';
    if (t === 'textarea') return L + '<textarea id="' + id + '" name="' + k + '" rows="' + (k === 'content' ? 14 : 4) + '"' + req + '>' + esc(val == null ? '' : val) + '</textarea>';
    if (t === 'array') return L + '<input id="' + id + '" name="' + k + '" value="' + esc((val || []).join(', ')) + '">';
    if (t === 'lines') return L + '<textarea id="' + id + '" name="' + k + '" rows="4">' + esc((val || []).join('\n')) + '</textarea>';
    if (t === 'json') return L + '<textarea class="code" id="' + id + '" name="' + k + '" rows="5">' + esc(JSON.stringify(val || [], null, 1)) + '</textarea>';
    if (t === 'bool') return '<label style="display:flex;gap:10px;align-items:center;margin-bottom:16px"><input style="width:auto;margin:0" type="checkbox" name="' + k + '"' + (val ? ' checked' : '') + '> ' + esc(label) + '</label>';
    if (t === 'image') return L + '<input id="' + id + '" name="' + k + '" value="' + esc(val || '') + '" placeholder="https://… or upload below"><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" data-upload="' + k + '"><p class="hint">Max 5 MB. Uploads go to Supabase Storage.</p>';
    if (t[0] === 'select') return L + '<select id="' + id + '" name="' + k + '">' + t[1].map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>';
    return '';
  }
  function openForm(key, row) {
    var E = ENT[key]; row = row || {};
    modal('<h2 style="margin-bottom:14px">' + (row.id ? 'Edit' : 'Add') + ' ' + esc(E.label.replace(/s$/, '')) + '</h2><form id="ent-form" data-key="' + key + '" data-id="' + (row.id || '') + '">' + E.fields.map(function (f) { return fieldHtml(f, row[f[0]] != null ? row[f[0]] : (f[0] === 'published' ? false : f[0] === 'author' ? 'Sabbir Hosen Akash' : f[0] === 'currency' ? 'USD' : f[0] === 'status' ? 'in_progress' : null)); }).join('') + '<div style="display:flex;gap:10px"><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-outline" type="button" data-close>Cancel</button></div><div class="form-status" id="ent-status" role="alert"></div></form>');
    var f = $('#ent-form'); var title = f.querySelector('[name=title],[name=name]'); var slug = f.querySelector('[name=slug]');
    if (title && slug && !row.id) title.addEventListener('input', function () { slug.value = slugify(title.value); });
  }
  function collect(form, E) {
    var o = {};
    E.fields.forEach(function (f) {
      var el = form.elements[f[0]], t = f[2]; if (!el) return; var v = el.type === 'checkbox' ? el.checked : el.value.trim();
      if (t === 'array') v = v ? v.split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
      else if (t === 'lines') v = v ? v.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean) : [];
      else if (t === 'number') v = v === '' ? null : Number(v);
      else if (t === 'json') { try { v = v ? JSON.parse(v) : []; } catch (e) { throw new Error(f[1].split(' (')[0] + ': invalid JSON'); } }
      else if (t !== 'bool' && v === '') v = f[3] ? v : null;
      if (f[0] === 'sort_order' && v == null) v = 0;
      o[f[0]] = v;
    });
    if (E.table === 'blog_posts' && o.published) o.published_at = new Date().toISOString();
    return o;
  }
  document.addEventListener('submit', function (e) {
    if (e.target.id !== 'ent-form') return; e.preventDefault();
    var form = e.target, key = form.dataset.key, id = form.dataset.id, E = ENT[key], st = $('#ent-status');
    var data; try { data = collect(form, E); } catch (x) { st.className = 'form-status err'; st.textContent = x.message; return; }
    if (E.table === 'blog_posts' && id) { var old = ($('#a-main')._rows || []).find(function (r) { return r.id === id; }); if (old && old.published && old.published_at && data.published) data.published_at = old.published_at; }
    var q = id ? sb.from(E.table).update(data).eq('id', id).select('id') : sb.from(E.table).insert(data).select('id');
    q.then(function (r) { if (r.error) { st.className = 'form-status err'; st.textContent = r.error.message.indexOf('duplicate') >= 0 ? 'That URL slug is already used.' : r.error.message; return; } log(id ? 'update' : 'create', E.table, r.data && r.data[0] && r.data[0].id, { title: data.title || data.name || data.client_name }); closeModal(); toast('Saved'); go(current); });
  });
  document.addEventListener('click', function (e) {
    var b;
    if ((b = e.target.closest('[data-new]'))) openForm(b.dataset.new);
    if ((b = e.target.closest('[data-edit]'))) { var p = b.dataset.edit.split(':'); openForm(p[0], ($('#a-main')._rows || []).find(function (r) { return r.id === p[1]; })); }
    if ((b = e.target.closest('[data-toggle]'))) { var t = b.dataset.toggle.split(':'), E = ENT[t[0]], row = ($('#a-main')._rows || []).find(function (r) { return r.id === t[1]; }); var patch = { published: !row.published }; if (E.table === 'blog_posts' && patch.published) patch.published_at = new Date().toISOString(); sb.from(E.table).update(patch).eq('id', t[1]).then(function (r) { if (r.error) return fail(r.error); log(patch.published ? 'publish' : 'unpublish', E.table, t[1]); go(current); }); }
    if ((b = e.target.closest('[data-del]'))) { var d = b.dataset.del.split(':'), Ed = ENT[d[0]]; if (!confirmBox('Delete this item permanently? This cannot be undone.')) return; sb.from(Ed.table).delete().eq('id', d[1]).then(function (r) { if (r.error) return fail(r.error); log('delete', Ed.table, d[1]); toast('Deleted'); go(current); }); }
  });

  // ----- image upload -----
  function upload(file) {
    if (!file) return Promise.reject(new Error('No file'));
    if (file.size > 5 * 1024 * 1024) return Promise.reject(new Error('File is larger than 5 MB'));
    var ext = (file.name.split('.').pop() || 'png').toLowerCase().replace(/[^a-z0-9]/g, ''); var path = new Date().getFullYear() + '/' + Date.now() + '-' + slugify(file.name.replace(/\.[^.]+$/, '')) + '.' + ext;
    return sb.storage.from('media').upload(path, file, { contentType: file.type, upsert: false }).then(function (r) { if (r.error) throw r.error; log('upload', 'media', path); return sb.storage.from('media').getPublicUrl(path).data.publicUrl; });
  }
  document.addEventListener('change', function (e) {
    var u = e.target.closest('[data-upload]'); if (!u || !u.files[0]) return;
    upload(u.files[0]).then(function (url) { var inp = $('#ent-form [name=' + u.dataset.upload + ']'); inp.value = url; toast('Uploaded'); }).catch(fail);
  });

  // ----- orders & messages -----
  function inbox(table, title, statuses, bodyKey, extraCols) {
    return sb.from(table).select('*').order('created_at', { ascending: false }).limit(200).then(function (r) {
      if (r.error) throw r.error; var rows = r.data || []; $('#a-main')._rows = rows;
      $('#a-main').innerHTML = '<h1>' + title + '</h1><div class="tbl-wrap"><table><thead><tr><th>Date</th><th>Name</th><th>Email</th>' + extraCols.map(function (c) { return '<th>' + c[1] + '</th>'; }).join('') + '<th>Status</th><th>Telegram</th><th></th></tr></thead><tbody>' + (rows.map(function (x) { return '<tr><td>' + new Date(x.created_at).toLocaleString() + '</td><td>' + esc(x.name) + '</td><td>' + esc(x.email) + '</td>' + extraCols.map(function (c) { return '<td>' + esc(x[c[0]] || '—') + '</td>'; }).join('') + '<td><span class="badge ' + (x.status === 'new' ? 'ok' : '') + '">' + esc(x.status) + '</span></td><td><span class="badge ' + (x.telegram_status === 'sent' ? 'ok' : x.telegram_status === 'failed' ? 'bad' : '') + '">' + esc(x.telegram_status) + '</span></td><td><button class="btn btn-outline btn-sm" data-open="' + table + ':' + x.id + '">Open</button></td></tr>'; }).join('') || '<tr><td colspan="9">No entries yet.</td></tr>') + '</tbody></table></div>';
    });
  }
  function viewMessages() { return inbox('contact_messages', 'Contact Messages', ['new', 'read', 'replied', 'archived', 'spam'], 'message', [['country', 'Country'], ['service', 'Service'], ['budget', 'Budget']]); }
  function viewOrders() { return inbox('orders', 'Orders (requests)', ['new', 'contacted', 'quoted', 'in_progress', 'completed', 'cancelled'], 'requirements', [['product_name', 'Website'], ['budget', 'Budget']]); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-open]'); if (!b) return; var p = b.dataset.open.split(':'), table = p[0], id = p[1];
    var x = ($('#a-main')._rows || []).find(function (r) { return r.id === id; }); var isMsg = table === 'contact_messages';
    var statuses = isMsg ? ['new', 'read', 'replied', 'archived', 'spam'] : ['new', 'contacted', 'quoted', 'in_progress', 'completed', 'cancelled'];
    if (isMsg && x.status === 'new') sb.from(table).update({ status: 'read' }).eq('id', id).then(function () {});
    modal('<h2>' + esc(x.name) + '</h2><p><a href="mailto:' + esc(x.email) + '">' + esc(x.email) + '</a> · ' + esc(x.country || '') + '</p><p class="hint">ID ' + esc(id.slice(0, 8)) + ' · ' + new Date(x.created_at).toLocaleString() + (x.product_name ? ' · ' + esc(x.product_name) : '') + (x.service ? ' · ' + esc(x.service) : '') + (x.budget ? ' · Budget ' + esc(x.budget) : '') + '</p><div class="msgbody">' + esc(isMsg ? x.message : x.requirements) + '</div>' +
      '<label for="st">Status</label><select id="st">' + statuses.map(function (s) { return '<option' + (s === (isMsg && x.status === 'new' ? 'read' : x.status) ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select>' + (isMsg ? '' : '<label for="an">Admin notes</label><textarea id="an" rows="3">' + esc(x.admin_notes || '') + '</textarea>') +
      '<div class="row-actions"><button class="btn btn-primary btn-sm" id="save-st">Save</button><a class="btn btn-outline btn-sm" href="mailto:' + esc(x.email) + '?subject=Re: your inquiry">Reply by email</a><button class="btn btn-outline btn-sm" id="resend">Resend to Telegram</button><button class="btn btn-outline btn-sm" id="del-in">Delete</button><button class="btn btn-outline btn-sm" data-close>Close</button></div>');
    $('#save-st').onclick = function () { var patch = { status: $('#st').value }; if (!isMsg) patch.admin_notes = $('#an').value; sb.from(table).update(patch).eq('id', id).then(function (r) { if (r.error) return fail(r.error); log('status', table, id, patch); closeModal(); go(current); }); };
    $('#resend').onclick = function () { api('/api/admin/resend/' + (isMsg ? 'contact' : 'order') + '/' + id).then(function (r) { toast(r.ok ? 'Sent to Telegram' : 'Telegram failed'); }).catch(fail); };
    $('#del-in').onclick = function () { if (!confirmBox('Delete permanently?')) return; sb.from(table).delete().eq('id', id).then(function (r) { if (r.error) return fail(r.error); log('delete', table, id); closeModal(); go(current); }); };
  });

  // ----- media library -----
  function viewMedia() {
    return sb.storage.from('media').list(String(new Date().getFullYear()), { limit: 200, sortBy: { column: 'created_at', order: 'desc' } }).then(function (r) {
      var files = (r.data || []).filter(function (f) { return f.name && f.id; });
      $('#a-main').innerHTML = '<h1>Media Library</h1><div class="form-card" style="margin-bottom:18px"><label for="m-file">Upload image (png, jpg, webp, gif · max 5 MB)</label><input id="m-file" type="file" accept="image/png,image/jpeg,image/webp,image/gif"><div class="form-status" id="m-status"></div></div><div class="media-grid">' + (files.map(function (f) { var p = new Date().getFullYear() + '/' + f.name; var url = sb.storage.from('media').getPublicUrl(p).data.publicUrl; return '<figure><img loading="lazy" src="' + esc(url) + '" alt=""><div>' + esc(f.name) + '</div><div class="row-actions" style="margin-top:6px"><button class="btn btn-outline btn-sm" data-copy="' + esc(url) + '">Copy URL</button><button class="btn btn-outline btn-sm" data-rmfile="' + esc(p) + '">Delete</button></div></figure>'; }).join('') || '<p class="empty">No uploads this year.</p>') + '</div>';
      $('#m-file').onchange = function () { var s = $('#m-status'); s.textContent = 'Uploading…'; upload(this.files[0]).then(function (url) { s.className = 'form-status ok'; s.textContent = 'Uploaded: ' + url; go('media'); }).catch(function (x) { s.className = 'form-status err'; s.textContent = x.message; }); };
    });
  }
  document.addEventListener('click', function (e) {
    var c = e.target.closest('[data-copy]'); if (c) { (navigator.clipboard ? navigator.clipboard.writeText(c.dataset.copy) : Promise.reject()).then(function () { toast('URL copied'); }).catch(function () { window.prompt('Copy URL', c.dataset.copy); }); }
    var d = e.target.closest('[data-rmfile]'); if (d && confirmBox('Delete this file? Pages using it will show a broken image.')) sb.storage.from('media').remove([d.dataset.rmfile]).then(function (r) { if (r.error) return fail(r.error); log('delete', 'media', d.dataset.rmfile); go('media'); });
  });

  // ----- SEO overview -----
  function viewSeo() {
    return Promise.all([sb.from('projects').select('id,title,seo_title,seo_description'), sb.from('services').select('id,title,seo_title,seo_description'), sb.from('blog_posts').select('id,title,seo_title,seo_description')]).then(function (rs) {
      var names = ['projects', 'services', 'blog_posts']; var html = '<h1>SEO Management</h1><p class="hint">Missing SEO fields fall back to auto-generated titles/descriptions. Edit an item to change them. Structured data (Article, Service, Product, Breadcrumb) is generated automatically on each page.</p>';
      rs.forEach(function (r, i) { html += '<h2 style="margin:18px 0 8px;font-size:1.1rem">' + names[i].replace('_', ' ') + '</h2><div class="tbl-wrap"><table><thead><tr><th>Title</th><th>SEO title</th><th>SEO description</th><th></th></tr></thead><tbody>' + ((r.data || []).map(function (x) { return '<tr><td>' + esc(x.title) + '</td><td>' + (x.seo_title ? esc(x.seo_title) : '<span class="badge">auto</span>') + '</td><td>' + (x.seo_description ? esc(x.seo_description.slice(0, 80)) : '<span class="badge">auto</span>') + '</td><td><button class="btn btn-outline btn-sm" data-go="' + names[i] + '">Open</button></td></tr>'; }).join('') || '<tr><td colspan="4">No items.</td></tr>') + '</tbody></table></div>'; });
      $('#a-main').innerHTML = html;
    });
  }

  // ----- settings -----
  function viewSettings() {
    return sb.from('site_settings').select('*').then(function (r) {
      var map = {}; (r.data || []).forEach(function (x) { map[x.key] = x.value; }); var pr = map['public.profile'] || {}, an = map['public.analytics'] || {};
      $('#a-main').innerHTML = '<h1>Website Settings</h1><form class="form-card" id="set-form"><h3 style="margin-bottom:12px">Public profile info</h3><div class="form-row"><div><label>Email</label><input name="email" value="' + esc(pr.email || '') + '"></div><div><label>WhatsApp number (digits only)</label><input name="whatsapp" value="' + esc(pr.whatsapp || '') + '"></div></div><label>Location</label><input name="location" value="' + esc(pr.location || '') + '"><h3 style="margin:8px 0 12px">Analytics</h3><label>Google Analytics measurement ID</label><input name="ga" placeholder="G-XXXXXXXXXX" value="' + esc(an.ga_measurement_id || '') + '"><p class="hint">For the ID to take effect on the site, also put it in config.js (GA_MEASUREMENT_ID).</p><button class="btn btn-primary" type="submit">Save settings</button></form>' +
        '<div class="form-card" style="margin-top:18px"><h3 style="margin-bottom:10px">Telegram</h3><p class="hint">The bot token lives only in Cloudflare Worker secrets. This sends a test message through the Worker.</p><button class="btn btn-outline" id="tg-test">Send Telegram test</button></div>';
      $('#set-form').onsubmit = function (ev) { ev.preventDefault(); var f = ev.target.elements; Promise.all([sb.from('site_settings').upsert({ key: 'public.profile', value: { name: 'Sabbir Hosen Akash', alias: 'Writarion', email: f.email.value.trim(), whatsapp: f.whatsapp.value.replace(/\D/g, ''), location: f.location.value.trim() } }), sb.from('site_settings').upsert({ key: 'public.analytics', value: { ga_measurement_id: f.ga.value.trim() } })]).then(function (rs) { var er = rs.find(function (x) { return x.error; }); if (er) return fail(er.error); log('update', 'site_settings', null); toast('Settings saved'); }); };
      $('#tg-test').onclick = function () { api('/api/admin/telegram-test').then(function (r) { return r.json(); }).then(function (j) { toast(j.ok ? 'Telegram test sent ✔' : 'Failed: ' + (j.error || 'check secrets')); }).catch(fail); };
    });
  }

  // ----- profile & logs -----
  function viewProfile() {
    return sb.from('admin_activity_logs').select('*').order('created_at', { ascending: false }).limit(50).then(function (r) {
      $('#a-main').innerHTML = '<h1>Admin Profile</h1><div class="form-card"><p><strong>' + esc(me.email) + '</strong></p><h3 style="margin:14px 0 10px">Change password</h3><form id="pw-form"><label for="pw1">New password (min 10 chars)</label><input id="pw1" type="password" minlength="10" required autocomplete="new-password"><button class="btn btn-primary" type="submit">Update password</button></form></div><h2 style="margin:22px 0 10px;font-size:1.1rem">Recent activity</h2><div class="tbl-wrap"><table><thead><tr><th>Time</th><th>Admin</th><th>Action</th><th>Entity</th></tr></thead><tbody>' + ((r.data || []).map(function (x) { return '<tr><td>' + new Date(x.created_at).toLocaleString() + '</td><td>' + esc(x.admin_email || '') + '</td><td>' + esc(x.action) + '</td><td>' + esc(x.entity || '') + '</td></tr>'; }).join('') || '<tr><td colspan="4">No activity.</td></tr>') + '</tbody></table></div>';
      $('#pw-form').onsubmit = function (ev) { ev.preventDefault(); sb.auth.updateUser({ password: $('#pw1').value }).then(function (x) { if (x.error) return fail(x.error); log('password_change', 'auth', me.id); toast('Password updated'); ev.target.reset(); }); };
    });
  }

  document.addEventListener('click', function (e) { if (e.target.closest('#theme-toggle')) { var r = document.documentElement; var n = r.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; r.setAttribute('data-theme', n); try { localStorage.setItem('theme', n); } catch (x) {} } });
  try { var th = localStorage.getItem('theme'); if (th) document.documentElement.setAttribute('data-theme', th); } catch (x) {}
  boot();
})();
