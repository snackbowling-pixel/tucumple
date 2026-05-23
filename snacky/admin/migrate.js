// ============================================
// Snacky - Migracion de imagenes legacy a Storage
// ============================================
(function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG;
  var supabase = window.supabase.createClient(cfg.url, cfg.anonKey);

  var startBtn = document.getElementById('startBtn');
  var statsBar = document.getElementById('statsBar');
  var progressList = document.getElementById('progressList');
  var loginRequired = document.getElementById('loginRequired');

  var stats = { total: 0, success: 0, skip: 0, error: 0 };

  function updateStats() {
    document.getElementById('statTotal').textContent = stats.total;
    document.getElementById('statSuccess').textContent = stats.success;
    document.getElementById('statSkip').textContent = stats.skip;
    document.getElementById('statError').textContent = stats.error;
  }

  function addLogItem(name, status, info) {
    var icons = {
      pending: 'fa-clock',
      running: 'fa-spinner fa-spin',
      success: 'fa-check',
      skip:    'fa-forward',
      error:   'fa-xmark'
    };
    var item = document.createElement('div');
    item.className = 'progress-item';
    item.innerHTML =
      '<span class="progress-icon ' + status + '"><i class="fa-solid ' + icons[status] + '"></i></span>' +
      '<span>' + escapeHtml(name) + '</span>' +
      (info ? '<span class="progress-info">' + escapeHtml(info) + '</span>' : '');
    progressList.appendChild(item);
    progressList.scrollTop = progressList.scrollHeight;
    return item;
  }

  function updateLogItem(item, status, info) {
    var icons = {
      pending: 'fa-clock',
      running: 'fa-spinner fa-spin',
      success: 'fa-check',
      skip:    'fa-forward',
      error:   'fa-xmark'
    };
    var iconEl = item.querySelector('.progress-icon');
    iconEl.className = 'progress-icon ' + status;
    iconEl.innerHTML = '<i class="fa-solid ' + icons[status] + '"></i>';
    if (info) {
      var infoEl = item.querySelector('.progress-info');
      if (infoEl) infoEl.textContent = info;
      else {
        var span = document.createElement('span');
        span.className = 'progress-info';
        span.textContent = info;
        item.appendChild(span);
      }
    }
  }

  async function migrateOne(bg) {
    var item = addLogItem(bg.name + ' (' + bg.category + ')', 'running', 'descargando…');

    try {
      // 1) Si ya esta migrado, saltear
      if (!bg.storage_path || bg.storage_path.indexOf('legacy/') !== 0) {
        stats.skip++;
        updateLogItem(item, 'skip', 'ya migrado');
        return;
      }

      // 2) Descargar imagen original
      var resp = await fetch(bg.image_url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      var blob = await resp.blob();
      var file = new File([blob], bg.storage_path.split('/').pop(), { type: blob.type });

      // 3) Comprimir a WebP
      updateLogItem(item, 'running', 'comprimiendo a WebP…');
      var result = await ImageUtils.compressToWebP(file, {
        maxWidth: 1920, maxHeight: 1920, quality: 0.85
      });

      // 4) Subir a Storage
      updateLogItem(item, 'running',
        'subiendo (' + ImageUtils.formatBytes(result.originalSize) +
        ' → ' + ImageUtils.formatBytes(result.finalSize) + ')…');
      var fileName = ImageUtils.uniqueFileName(bg.name, 'webp');
      var newPath = 'fondos/' + fileName;

      var up = await supabase.storage.from('background-images').upload(newPath, result.blob, {
        contentType: 'image/webp',
        cacheControl: '31536000'
      });
      if (up.error) throw up.error;

      // 5) Obtener URL publica + actualizar DB
      var pub = supabase.storage.from('background-images').getPublicUrl(newPath);
      var upd = await supabase.from('backgrounds').update({
        image_url: pub.data.publicUrl,
        storage_path: newPath
      }).eq('id', bg.id);
      if (upd.error) throw upd.error;

      stats.success++;
      updateLogItem(item, 'success',
        ImageUtils.formatBytes(result.originalSize) + ' → ' + ImageUtils.formatBytes(result.finalSize));
    } catch (err) {
      stats.error++;
      updateLogItem(item, 'error', err.message || 'error desconocido');
      console.error('Error migrando ' + bg.name + ':', err);
    } finally {
      updateStats();
    }
  }

  async function checkAuth() {
    var resp = await supabase.auth.getSession();
    return !!(resp.data && resp.data.session);
  }

  startBtn.addEventListener('click', async function () {
    var authed = await checkAuth();
    if (!authed) {
      loginRequired.hidden = false;
      return;
    }
    loginRequired.hidden = true;
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Migrando…';

    statsBar.hidden = false;
    progressList.hidden = false;
    progressList.innerHTML = '';
    stats = { total: 0, success: 0, skip: 0, error: 0 };
    updateStats();

    var resp = await supabase
      .from('backgrounds')
      .select('id, name, category, image_url, storage_path')
      .order('category')
      .order('order_index');

    if (resp.error) {
      alert('Error cargando fondos: ' + resp.error.message);
      startBtn.disabled = false;
      return;
    }

    stats.total = resp.data.length;
    updateStats();

    // Procesar de a uno (no en paralelo, para no saturar)
    for (var i = 0; i < resp.data.length; i++) {
      await migrateOne(resp.data[i]);
    }

    startBtn.disabled = false;
    startBtn.innerHTML = '<i class="fa-solid fa-check"></i> Migración completada';
  });

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
})();
