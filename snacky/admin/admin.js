// ============================================
// Snacky Admin - Gestion de fondos
// ============================================
(function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG || {};
  var credentialsMissing = !cfg.url || cfg.url.indexOf('TU-PROYECTO') !== -1 ||
                           !cfg.anonKey || cfg.anonKey.indexOf('TU_ANON_KEY') !== -1;

  if (credentialsMissing) {
    console.warn('[admin] Configurá tus credenciales de Supabase en snacky/js/supabase-config.js');
    showCredentialsBanner();
  }

  var supabase = window.supabase.createClient(
    cfg.url || 'https://placeholder.supabase.co',
    cfg.anonKey || 'placeholder'
  );

  function showCredentialsBanner() {
    var banner = document.createElement('div');
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#fef3c7;color:#92400e;padding:10px 16px;text-align:center;font-size:0.9rem;border-bottom:1px solid #fbbf24;';
    banner.innerHTML = '⚠️ Configurá tus credenciales de Supabase en <code>snacky/js/supabase-config.js</code> para que funcione el admin.';
    document.body.appendChild(banner);
  }

  // Referencias a elementos
  var loginView    = document.getElementById('loginView');
  var adminView    = document.getElementById('adminView');
  var loginForm    = document.getElementById('loginForm');
  var loginError   = document.getElementById('loginError');
  var loginBtn     = document.getElementById('loginBtn');
  var logoutBtn    = document.getElementById('logoutBtn');
  var userEmail    = document.getElementById('userEmail');

  var uploadForm   = document.getElementById('uploadForm');
  var uploadBtn    = document.getElementById('uploadBtn');
  var uploadStatus = document.getElementById('uploadStatus');
  var bgFileInput  = document.getElementById('bgFile');
  var uploadPreview= document.getElementById('uploadPreview');
  var previewImg   = document.getElementById('previewImg');
  var previewInfo  = document.getElementById('previewInfo');
  var bgCategorySelect = document.getElementById('bgCategorySelect');
  var bgCategoryNew    = document.getElementById('bgCategoryNew');

  var grid         = document.getElementById('backgroundsGrid');
  var bgCount      = document.getElementById('bgCount');
  var emptyState   = document.getElementById('emptyState');
  var searchInput  = document.getElementById('searchInput');
  var filterCategory = document.getElementById('filterCategory');

  var editModal    = document.getElementById('editModal');
  var editForm     = document.getElementById('editForm');
  var cancelEditBtn= document.getElementById('cancelEditBtn');

  var toastEl      = document.getElementById('toast');

  var allBackgrounds = [];

  // ============================================
  // AUTH
  // ============================================
  async function checkSession() {
    var resp = await supabase.auth.getSession();
    var session = resp.data && resp.data.session;
    if (session) {
      showAdmin(session.user);
    } else {
      showLogin();
    }
  }

  function showLogin() {
    loginView.hidden = false;
    adminView.hidden = true;
  }

  function showAdmin(user) {
    loginView.hidden = true;
    adminView.hidden = false;
    userEmail.textContent = user.email;
    loadBackgrounds();
    loadMetrics();
    cleanupExpiredPhotos();
  }

  // ============================================
  // CLEANUP: borra fotos personales vencidas
  // Corre cada vez que el admin loguea. Complemento al cron SQL
  // (el cron no puede borrar de Storage por permisos de Supabase).
  // ============================================
  async function cleanupExpiredPhotos() {
    try {
      var resp = await supabase
        .from('invitations')
        .select('id, slug, custom_photo_path')
        .lt('expires_at', new Date().toISOString())
        .not('custom_photo_path', 'is', null);

      if (resp.error || !resp.data || !resp.data.length) return;

      var paths = resp.data.map(function (i) { return i.custom_photo_path; });
      var ids   = resp.data.map(function (i) { return i.id; });

      // Borrar del Storage
      var del = await supabase.storage.from('user-photos').remove(paths);
      if (del.error) {
        console.warn('Error borrando fotos vencidas:', del.error.message);
        return;
      }

      // Limpiar campos en la DB
      await supabase.from('invitations')
        .update({ custom_photo_path: null, custom_photo_url: null })
        .in('id', ids);

      console.log('[cleanup] ' + paths.length + ' foto(s) vencida(s) borrada(s) del storage');
    } catch (e) {
      console.warn('Error en cleanup:', e);
    }
  }

  // ============================================
  // METRICAS
  // ============================================
  async function loadMetrics() {
    var resp = await supabase
      .from('invitations')
      .select('id, child_name, birthday, views_count, custom_photo_url, background_id, created_at, background:background_id (name, category)')
      .order('created_at', { ascending: false });

    if (resp.error) {
      console.warn('No se pudieron cargar metricas:', resp.error);
      return;
    }
    var inv = resp.data || [];
    var sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);

    var totalViews = inv.reduce(function (s, i) { return s + (i.views_count || 0); }, 0);
    var customPhotoCount = inv.filter(function (i) { return !!i.custom_photo_url; }).length;
    var weekCount = inv.filter(function (i) { return new Date(i.created_at) >= sevenAgo; }).length;

    document.getElementById('metricTotal').textContent = inv.length;
    document.getElementById('metricWeek').textContent = weekCount;
    document.getElementById('metricViews').textContent = totalViews;
    document.getElementById('metricCustomPhoto').textContent = customPhotoCount;

    // Top fondos
    var bgCounts = {};
    inv.forEach(function (i) {
      if (i.background && i.background.name) {
        var key = i.background.name + ' · ' + i.background.category;
        bgCounts[key] = (bgCounts[key] || 0) + 1;
      }
    });
    var top = Object.keys(bgCounts)
      .map(function (k) { return { name: k, count: bgCounts[k] }; })
      .sort(function (a, b) { return b.count - a.count; })
      .slice(0, 5);

    var topEl = document.getElementById('topBackgrounds');
    if (!top.length) {
      topEl.innerHTML = '<li class="muted">No hay datos todavía</li>';
    } else {
      topEl.innerHTML = top.map(function (t) {
        return '<li><span>' + escapeHtml(t.name) + '</span><span class="count">' + t.count + '</span></li>';
      }).join('');
    }

    // Ultimas invitaciones
    var recentEl = document.getElementById('recentInvitations');
    if (!inv.length) {
      recentEl.innerHTML = '<li class="muted">No hay invitaciones todavía</li>';
    } else {
      var dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      var monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      recentEl.innerHTML = inv.slice(0, 8).map(function (i) {
        var bday = new Date(i.birthday + 'T00:00:00');
        var dayLabel = dayNames[bday.getDay()] + ' ' + bday.getDate() + ' ' + monthNames[bday.getMonth()];
        var time = i.start_time ? i.start_time.slice(0, 5) : '--:--';
        return '<li class="recent-item">' +
          '<div class="recent-main">' +
            '<span class="recent-name">' + escapeHtml(i.child_name) + '</span>' +
            '<span class="recent-views">👁 ' + (i.views_count || 0) + '</span>' +
          '</div>' +
          '<div class="recent-sub">' +
            '<span><i class="fa-regular fa-calendar"></i> ' + dayLabel + '</span>' +
            '<span><i class="fa-regular fa-clock"></i> ' + time + '</span>' +
          '</div>' +
        '</li>';
      }).join('');
    }
  }

  // ============================================
  // RESET DE INVITACIONES
  // ============================================
  async function resetInvitations() {
    var first = confirm(
      '¿Borrar TODAS las invitaciones?\n\n' +
      'Esto borra invitaciones, RSVPs y fotos custom de la base de datos. ' +
      'Los fondos temáticos del admin NO se tocan.\n\n' +
      'Esta acción no se puede deshacer.'
    );
    if (!first) return;

    var confirmText = prompt('Para confirmar, escribí: RESET');
    if (confirmText !== 'RESET') {
      if (confirmText !== null) alert('Cancelado. Tenés que escribir RESET exacto.');
      return;
    }

    try {
      // 1) Primero borrar fotos custom del storage
      var photos = await supabase
        .from('invitations')
        .select('custom_photo_path')
        .not('custom_photo_path', 'is', null);
      if (photos.data && photos.data.length) {
        var paths = photos.data.map(function (p) { return p.custom_photo_path; });
        await supabase.storage.from('user-photos').remove(paths);
      }

      // 2) Borrar todas las invitaciones (rsvp se borran en cascada)
      var del = await supabase.from('invitations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (del.error) throw del.error;

      showToast('✅ Métricas reseteadas');
      loadMetrics();
    } catch (err) {
      console.error(err);
      alert('Error al resetear: ' + (err.message || 'desconocido'));
    }
  }

  loginForm.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    loginError.hidden = true;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Ingresando…';

    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    try {
      var resp = await supabase.auth.signInWithPassword({ email: email, password: password });
      if (resp.error) throw resp.error;
      showAdmin(resp.data.user);
    } catch (err) {
      loginError.textContent = err.message || 'Credenciales inválidas';
      loginError.hidden = false;
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Ingresar';
    }
  });

  logoutBtn.addEventListener('click', async function () {
    await supabase.auth.signOut();
    showLogin();
  });

  var resetBtn = document.getElementById('resetMetricsBtn');
  if (resetBtn) resetBtn.addEventListener('click', resetInvitations);

  // ============================================
  // PREVIEW del archivo seleccionado
  // ============================================
  bgFileInput.addEventListener('change', function () {
    var file = bgFileInput.files && bgFileInput.files[0];
    if (!file) {
      uploadPreview.hidden = true;
      return;
    }
    var url = URL.createObjectURL(file);
    previewImg.src = url;
    previewInfo.textContent = file.name + ' · ' + ImageUtils.formatBytes(file.size);
    uploadPreview.hidden = false;
  });

  // ============================================
  // UPLOAD por URL (descarga via CORS proxy)
  // ============================================
  var bgUrlInput = document.getElementById('bgUrl');
  var bgUrlBtn   = document.getElementById('bgUrlBtn');
  var bgUrlSearch = document.getElementById('bgUrlSearch');

  // Link rápido para buscar en Google Images usando el nombre como query
  function updateSearchLink() {
    var name = (document.getElementById('bgName').value || '').trim();
    if (bgUrlSearch) {
      bgUrlSearch.href = name
        ? 'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(name + ' fondo HD')
        : 'https://www.google.com/imghp';
    }
  }
  document.getElementById('bgName').addEventListener('input', updateSearchLink);
  updateSearchLink();

  if (bgUrlBtn) bgUrlBtn.addEventListener('click', async function () {
    var url = (bgUrlInput.value || '').trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      alert('La URL tiene que empezar con http:// o https://');
      return;
    }

    bgUrlBtn.disabled = true;
    var originalText = bgUrlBtn.innerHTML;
    bgUrlBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Bajando…';

    try {
      // Intentar fetch directo primero. Si falla por CORS, usar proxy publico.
      var blob = null;
      try {
        var direct = await fetch(url, { mode: 'cors' });
        if (direct.ok) blob = await direct.blob();
      } catch (e) { /* fallthrough al proxy */ }

      if (!blob) {
        // Proxy publico (corsproxy.io). Para producción podés migrar a un
        // Cloudflare Worker propio si querés evitar dependencia externa.
        var proxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
        var resp = await fetch(proxyUrl);
        if (!resp.ok) throw new Error('No se pudo descargar (HTTP ' + resp.status + ')');
        blob = await resp.blob();
      }

      if (!blob || !blob.type.startsWith('image/')) {
        throw new Error('La URL no es una imagen');
      }

      // Crear un File desde el blob para usar el flujo existente
      var fileName = url.split('/').pop().split('?')[0] || 'image';
      var file = new File([blob], fileName, { type: blob.type });

      // Setear el input file con DataTransfer asi el submit funciona igual
      var dt = new DataTransfer();
      dt.items.add(file);
      bgFileInput.files = dt.files;
      bgFileInput.dispatchEvent(new Event('change'));

      bgUrlInput.value = '';
    } catch (err) {
      console.error(err);
      alert('Error: ' + err.message + '\n\nTip: si el sitio bloquea descargas, abrí la imagen en una pestaña nueva (botón derecho → "Abrir imagen en pestaña nueva"), copiá esa URL y probá de nuevo.');
    } finally {
      bgUrlBtn.disabled = false;
      bgUrlBtn.innerHTML = originalText;
    }
  });

  // ============================================
  // SUBIR NUEVO FONDO
  // ============================================
  // Mostrar/ocultar el input para nueva categoria
  bgCategorySelect.addEventListener('change', function () {
    if (bgCategorySelect.value === '__new__') {
      bgCategoryNew.hidden = false;
      bgCategoryNew.required = true;
      bgCategoryNew.focus();
    } else {
      bgCategoryNew.hidden = true;
      bgCategoryNew.required = false;
      bgCategoryNew.value = '';
    }
  });

  uploadForm.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var name = document.getElementById('bgName').value.trim();
    var category;
    if (bgCategorySelect.value === '__new__') {
      category = bgCategoryNew.value.trim();
    } else {
      category = bgCategorySelect.value.trim();
    }
    var file = bgFileInput.files && bgFileInput.files[0];

    if (!name || !category || !file) return;

    uploadBtn.disabled = true;
    setStatus('Comprimiendo imagen…', 'info');

    try {
      // 1) Comprimir a WebP
      var result = await ImageUtils.compressToWebP(file, {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85
      });

      setStatus(
        'Subiendo (' + ImageUtils.formatBytes(result.originalSize) +
        ' → ' + ImageUtils.formatBytes(result.finalSize) + ')…',
        'info'
      );

      // 2) Subir a Storage
      var fileName = ImageUtils.uniqueFileName(name, 'webp');
      var path = 'fondos/' + fileName;

      var uploadResp = await supabase.storage
        .from('background-images')
        .upload(path, result.blob, {
          contentType: 'image/webp',
          cacheControl: '31536000'
        });

      if (uploadResp.error) throw uploadResp.error;

      // 3) Obtener URL publica
      var pub = supabase.storage.from('background-images').getPublicUrl(path);
      var publicUrl = pub.data.publicUrl;

      // 4) Calcular order_index (al final de la categoria)
      var maxOrder = allBackgrounds
        .filter(function (b) { return b.category === category; })
        .reduce(function (m, b) { return Math.max(m, b.order_index || 0); }, 0);

      // 5) Insertar registro
      var insertResp = await supabase.from('backgrounds').insert({
        name: name,
        category: category,
        image_url: publicUrl,
        storage_path: path,
        order_index: maxOrder + 1,
        active: true
      });

      if (insertResp.error) throw insertResp.error;

      setStatus('✅ Fondo subido correctamente', 'success');
      uploadForm.reset();
      uploadPreview.hidden = true;
      bgCategoryNew.hidden = true;
      bgCategoryNew.required = false;
      loadBackgrounds();
      showToast('Fondo "' + name + '" agregado');
    } catch (err) {
      console.error(err);
      setStatus('❌ Error: ' + (err.message || 'no se pudo subir'), 'error');
    } finally {
      uploadBtn.disabled = false;
    }
  });

  function setStatus(msg, type) {
    uploadStatus.textContent = msg;
    uploadStatus.className = 'status-msg status-' + (type || 'info');
    uploadStatus.hidden = false;
  }

  // ============================================
  // CARGAR LISTA DE FONDOS
  // ============================================
  async function loadBackgrounds() {
    var resp = await supabase
      .from('backgrounds')
      .select('*')
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (resp.error) {
      console.error(resp.error);
      showToast('Error cargando fondos: ' + resp.error.message, 'error');
      return;
    }

    allBackgrounds = resp.data || [];
    updateCategoryDatalist();
    renderGrid();
  }

  function updateCategoryDatalist() {
    var categories = Array.from(
      new Set(allBackgrounds.map(function (b) { return b.category; }).filter(Boolean))
    ).sort();

    // Select de categorias en el form de upload
    var currentUploadCat = bgCategorySelect.value;
    bgCategorySelect.innerHTML =
      '<option value="" disabled' + (currentUploadCat ? '' : ' selected') + '>Elegí una categoría…</option>' +
      categories.map(function (c) {
        var sel = c === currentUploadCat ? ' selected' : '';
        return '<option value="' + escapeHtml(c) + '"' + sel + '>' + escapeHtml(c) + '</option>';
      }).join('') +
      '<option value="__new__">➕ Crear nueva categoría</option>';

    // Filtro de categorias en la grilla
    var currentFilter = filterCategory.value;
    filterCategory.innerHTML = '<option value="">Todas las categorías</option>' +
      categories.map(function (c) {
        var sel = c === currentFilter ? ' selected' : '';
        return '<option value="' + escapeHtml(c) + '"' + sel + '>' + escapeHtml(c) + '</option>';
      }).join('');
  }

  function renderGrid() {
    var search = (searchInput.value || '').toLowerCase().trim();
    var filter = filterCategory.value;

    var filtered = allBackgrounds.filter(function (b) {
      if (filter && b.category !== filter) return false;
      if (search && b.name.toLowerCase().indexOf(search) === -1) return false;
      return true;
    });

    bgCount.textContent = filtered.length;
    emptyState.hidden = filtered.length > 0;

    grid.innerHTML = filtered.map(function (b) {
      var dim = b.active ? '' : ' bg-inactive';
      return '' +
        '<div class="bg-card' + dim + '" data-id="' + b.id + '">' +
          '<div class="bg-thumb" style="background-image:url(' + escapeAttr(b.image_url) + ')"></div>' +
          '<div class="bg-info">' +
            '<div class="bg-name">' + escapeHtml(b.name) + '</div>' +
            '<div class="bg-category">' + escapeHtml(b.category || '—') + '</div>' +
            (b.active ? '' : '<span class="bg-badge">Inactivo</span>') +
          '</div>' +
          '<div class="bg-actions">' +
            '<button class="btn-icon" data-action="edit"   title="Editar"><i class="fa-solid fa-pen"></i></button>' +
            '<button class="btn-icon" data-action="toggle" title="' + (b.active ? 'Desactivar' : 'Activar') + '">' +
              '<i class="fa-solid fa-' + (b.active ? 'eye-slash' : 'eye') + '"></i></button>' +
            '<button class="btn-icon btn-danger" data-action="delete" title="Eliminar"><i class="fa-solid fa-trash"></i></button>' +
          '</div>' +
        '</div>';
    }).join('');
  }

  searchInput.addEventListener('input', renderGrid);
  filterCategory.addEventListener('change', renderGrid);

  // ============================================
  // ACCIONES SOBRE FONDOS (delegacion de eventos)
  // ============================================
  grid.addEventListener('click', async function (ev) {
    var btn = ev.target.closest('button[data-action]');
    if (!btn) return;
    var card = btn.closest('.bg-card');
    var id = card && card.dataset.id;
    if (!id) return;

    var bg = allBackgrounds.find(function (b) { return b.id === id; });
    if (!bg) return;

    var action = btn.dataset.action;
    if (action === 'edit') {
      openEditModal(bg);
    } else if (action === 'toggle') {
      await toggleActive(bg);
    } else if (action === 'delete') {
      await deleteBackground(bg);
    }
  });

  function openEditModal(bg) {
    document.getElementById('editId').value = bg.id;
    document.getElementById('editName').value = bg.name;

    // Poblar select de categorias del modal con las disponibles
    var categories = Array.from(
      new Set(allBackgrounds.map(function (b) { return b.category; }).filter(Boolean))
    ).sort();
    var editSelect = document.getElementById('editCategorySelect');
    editSelect.innerHTML = categories.map(function (c) {
      var sel = c === bg.category ? ' selected' : '';
      return '<option value="' + escapeHtml(c) + '"' + sel + '>' + escapeHtml(c) + '</option>';
    }).join('') + '<option value="__new__">➕ Crear nueva categoría</option>';

    document.getElementById('editCategoryNew').hidden = true;
    document.getElementById('editCategoryNew').value = '';
    document.getElementById('editActive').checked = !!bg.active;
    editModal.hidden = false;
  }

  // Mostrar input para nueva categoria al elegir esa opcion en el modal
  document.getElementById('editCategorySelect').addEventListener('change', function () {
    var newInput = document.getElementById('editCategoryNew');
    if (this.value === '__new__') {
      newInput.hidden = false;
      newInput.required = true;
      newInput.focus();
    } else {
      newInput.hidden = true;
      newInput.required = false;
      newInput.value = '';
    }
  });

  cancelEditBtn.addEventListener('click', function () { editModal.hidden = true; });
  editModal.addEventListener('click', function (ev) {
    if (ev.target === editModal) editModal.hidden = true;
  });

  editForm.addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var id = document.getElementById('editId').value;
    var name = document.getElementById('editName').value.trim();
    var editSelect = document.getElementById('editCategorySelect');
    var category = editSelect.value === '__new__'
      ? document.getElementById('editCategoryNew').value.trim()
      : editSelect.value.trim();
    var active = document.getElementById('editActive').checked;

    var resp = await supabase.from('backgrounds').update({
      name: name, category: category, active: active
    }).eq('id', id);

    if (resp.error) {
      showToast('Error: ' + resp.error.message, 'error');
      return;
    }
    editModal.hidden = true;
    showToast('Fondo actualizado');
    loadBackgrounds();
  });

  async function toggleActive(bg) {
    var resp = await supabase.from('backgrounds').update({ active: !bg.active }).eq('id', bg.id);
    if (resp.error) {
      showToast('Error: ' + resp.error.message, 'error');
      return;
    }
    showToast('Fondo ' + (bg.active ? 'desactivado' : 'activado'));
    loadBackgrounds();
  }

  async function deleteBackground(bg) {
    if (!confirm('¿Eliminar el fondo "' + bg.name + '"? Esta acción no se puede deshacer.')) return;

    // Borrar de Storage solo si el path apunta a nuestro bucket (no a legacy/)
    if (bg.storage_path && bg.storage_path.indexOf('legacy/') !== 0) {
      var delStorage = await supabase.storage.from('background-images').remove([bg.storage_path]);
      if (delStorage.error) console.warn('No se pudo borrar de storage:', delStorage.error.message);
    }

    var resp = await supabase.from('backgrounds').delete().eq('id', bg.id);
    if (resp.error) {
      showToast('Error: ' + resp.error.message, 'error');
      return;
    }
    showToast('Fondo eliminado');
    loadBackgrounds();
  }

  // ============================================
  // TOAST + helpers
  // ============================================
  var toastTimer;
  function showToast(msg, type) {
    toastEl.textContent = msg;
    toastEl.className = 'toast toast-' + (type || 'success');
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.hidden = true; }, 3000);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ============================================
  // INIT
  // ============================================
  checkSession();
})();
