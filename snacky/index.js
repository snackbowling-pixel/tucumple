// ============================================
// Snacky - Formulario publico
// Carga fondos desde Supabase, maneja subida de foto personal,
// guarda la invitacion y redirige a inv.html?id=SLUG
// ============================================
(function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG || {};
  var hasSupabase = cfg.url && cfg.url.indexOf('TU-PROYECTO') === -1 &&
                    cfg.anonKey && cfg.anonKey.indexOf('TU_ANON_KEY') === -1;

  var supabase = hasSupabase
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  // Referencias DOM
  var form        = document.getElementById('userForm');
  var bgSelect    = document.getElementById('background');
  var bgPreview   = document.getElementById('bgPreview');
  var bgPreviewImg= document.getElementById('bgPreviewImg');
  var photoInput  = document.getElementById('customPhoto');
  var photoPreview= document.getElementById('customPhotoPreview');
  var photoImg    = document.getElementById('customPhotoImg');
  var removePhotoBtn = document.getElementById('removeCustomPhoto');
  var submitBtn   = document.getElementById('submitBtn');
  var statusEl    = document.getElementById('formStatus');

  // ============================================
  // FEATURE FLAGS
  // ============================================
  var features = (window.SNACKY_CONFIG && window.SNACKY_CONFIG.features) || {};
  var allowCustomPhoto = features.allowCustomPhoto !== false; // default true

  if (!allowCustomPhoto) {
    // Ocultar la seccion de foto custom + el hint del select
    var photoDropzone = document.getElementById('fileDropzone');
    var photoGroup = photoInput ? photoInput.closest('.form-group') : null;
    if (photoGroup) photoGroup.hidden = true;
    // Tambien sacar el hint "Opcional si subis foto propia abajo" del select
    var bgHint = bgSelect ? bgSelect.parentNode.querySelector('.hint') : null;
    if (bgHint) bgHint.hidden = true;
    // Y hacer el select obligatorio
    if (bgSelect) bgSelect.required = true;
  }

  // Restringir fecha a futuro
  document.getElementById('birthday').setAttribute('min', new Date().toISOString().split('T')[0]);

  // ============================================
  // CARGAR FONDOS desde Supabase
  // ============================================
  var backgroundsById = {};

  async function loadBackgrounds() {
    if (!supabase) {
      bgSelect.innerHTML = '<option value="" disabled selected>⚠️ Supabase no configurado</option>';
      return;
    }

    var resp = await supabase
      .from('backgrounds')
      .select('id, name, category, image_url')
      .eq('active', true)
      .order('category', { ascending: true })
      .order('order_index', { ascending: true });

    if (resp.error) {
      console.error('Error cargando fondos:', resp.error);
      bgSelect.innerHTML = '<option value="" disabled selected>Error cargando temáticas</option>';
      return;
    }

    var bgs = resp.data || [];
    bgs.forEach(function (b) { backgroundsById[b.id] = b; });

    // Agrupar por categoria
    var grouped = {};
    bgs.forEach(function (b) {
      var cat = b.category || 'Otros';
      (grouped[cat] = grouped[cat] || []).push(b);
    });

    var html = '<option value="" disabled selected hidden>Elige la temática</option>';
    Object.keys(grouped).sort().forEach(function (cat) {
      html += '<optgroup label="' + escapeHtml(cat) + '">';
      grouped[cat].forEach(function (b) {
        html += '<option value="' + b.id + '">' + escapeHtml(b.name) + '</option>';
      });
      html += '</optgroup>';
    });
    bgSelect.innerHTML = html;
  }

  // Preview del fondo seleccionado
  bgSelect.addEventListener('change', function () {
    var bg = backgroundsById[bgSelect.value];
    if (bg) {
      bgPreviewImg.src = bg.image_url;
      bgPreview.hidden = false;
    } else {
      bgPreview.hidden = true;
    }
  });

  // ============================================
  // FOTO PERSONAL
  // ============================================
  var customPhotoFile = null;     // archivo original
  var customPhotoBlob = null;     // WebP comprimido listo para subir
  var customPhotoLocalUrl = null; // ObjectURL para preview

  // Contador de caracteres del mensaje
  var msgInput = document.getElementById('customMessage');
  var msgCounter = document.getElementById('msgCounter');
  if (msgInput && msgCounter) {
    msgInput.addEventListener('input', function () {
      msgCounter.textContent = msgInput.value.length;
    });
  }

  // File dropzone visual feedback
  var dropzone = document.getElementById('fileDropzone');
  function setDropzoneSelected(hasFile, fileName) {
    if (!dropzone) return;
    if (hasFile) {
      dropzone.classList.add('has-file');
    } else {
      dropzone.classList.remove('has-file');
    }
  }

  photoInput.addEventListener('change', async function () {
    var file = photoInput.files && photoInput.files[0];
    if (!file) return;

    // Maximo 10MB original (luego comprimimos)
    if (file.size > 10 * 1024 * 1024) {
      alert('La imagen es demasiado grande (máximo 10MB). Probá con una más chica.');
      photoInput.value = '';
      return;
    }

    customPhotoFile = file;
    showStatus('Procesando imagen…', 'info');

    try {
      var result = await ImageUtils.compressToWebP(file, {
        maxWidth: 1200, maxHeight: 1200, quality: 0.8
      });
      customPhotoBlob = result.blob;

      if (customPhotoLocalUrl) URL.revokeObjectURL(customPhotoLocalUrl);
      customPhotoLocalUrl = URL.createObjectURL(customPhotoBlob);
      photoImg.src = customPhotoLocalUrl;
      photoPreview.hidden = false;
      setDropzoneSelected(true);

      hideStatus();
    } catch (err) {
      console.error(err);
      alert('No se pudo procesar la imagen. Probá con otra.');
      customPhotoFile = null;
      customPhotoBlob = null;
      photoInput.value = '';
    }
  });

  removePhotoBtn.addEventListener('click', function () {
    customPhotoFile = null;
    customPhotoBlob = null;
    if (customPhotoLocalUrl) {
      URL.revokeObjectURL(customPhotoLocalUrl);
      customPhotoLocalUrl = null;
    }
    photoInput.value = '';
    photoPreview.hidden = true;
    setDropzoneSelected(false);
  });

  // ============================================
  // SUBMIT
  // ============================================
  form.addEventListener('submit', async function (ev) {
    ev.preventDefault();

    var name = document.getElementById('name').value.trim();
    var birthday = document.getElementById('birthday').value;
    var time = document.getElementById('time').value;
    var phone = document.getElementById('phone').value.trim();
    var bgId = bgSelect.value;
    var customMessage = document.getElementById('customMessage').value.trim();

    if (!/^\d{10}$/.test(phone)) {
      alert('Por favor, ingresá un número de teléfono válido (10 dígitos, sin 0 ni 15).');
      return;
    }

    if (!bgId && !customPhotoBlob) {
      alert('Elegí una temática o subí una foto propia para tu invitación.');
      return;
    }

    if (!supabase) {
      alert('Supabase no está configurado. Editá snacky/js/supabase-config.js con tus credenciales.');
      return;
    }

    submitBtn.disabled = true;
    var submitLabel = submitBtn.querySelector('.submit-label');
    var submitLoading = submitBtn.querySelector('.submit-loading');
    if (submitLabel && submitLoading) {
      submitLabel.hidden = true;
      submitLoading.hidden = false;
    }
    showStatus('Generando invitación…', 'info');

    try {
      // 1) Generar slug unico (RPC)
      var slugResp = await supabase.rpc('generate_invitation_slug');
      if (slugResp.error) throw slugResp.error;
      var slug = slugResp.data;

      // 2) Subir foto personal si existe
      var customPhotoUrl = null;
      var customPhotoPath = null;
      if (customPhotoBlob) {
        showStatus('Subiendo foto…', 'info');
        var fileName = ImageUtils.uniqueFileName('inv-' + slug, 'webp');
        var path = 'invitaciones/' + fileName;
        var up = await supabase.storage
          .from('user-photos')
          .upload(path, customPhotoBlob, {
            contentType: 'image/webp',
            cacheControl: '3600'
          });
        if (up.error) throw up.error;
        var pub = supabase.storage.from('user-photos').getPublicUrl(path);
        customPhotoUrl = pub.data.publicUrl;
        customPhotoPath = path;
      }

      // 3) Calcular expires_at = cumple + 3 dias (para borrar foto)
      var bdayDate = new Date(birthday + 'T00:00:00');
      bdayDate.setDate(bdayDate.getDate() + 3);
      var expiresAt = bdayDate.toISOString();

      // 4) Insertar invitacion
      showStatus('Guardando invitación…', 'info');
      var insert = await supabase.from('invitations').insert({
        slug: slug,
        child_name: name,
        birthday: birthday,
        start_time: time,
        phone: phone,
        background_id: bgId || null,
        custom_photo_url: customPhotoUrl,
        custom_photo_path: customPhotoPath,
        custom_message: customMessage || null,
        expires_at: expiresAt
      });
      if (insert.error) throw insert.error;

      // 5) Redirigir
      window.location.href = 'inv.html?id=' + encodeURIComponent(slug);
    } catch (err) {
      console.error(err);
      showStatus('❌ Error: ' + (err.message || 'no se pudo guardar'), 'error');
      submitBtn.disabled = false;
      if (submitLabel && submitLoading) {
        submitLabel.hidden = false;
        submitLoading.hidden = true;
      }
    }
  });

  // ============================================
  // helpers
  // ============================================
  function showStatus(msg, type) {
    statusEl.textContent = msg;
    statusEl.className = 'status-msg status-' + (type || 'info');
    statusEl.hidden = false;
  }
  function hideStatus() { statusEl.hidden = true; }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // INIT
  loadBackgrounds();
})();
