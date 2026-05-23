// ============================================
// Snacky - Pagina de invitacion
// Lee ?id=SLUG, carga invitacion desde Supabase, renderiza UI
// Mantiene compatibilidad con el formato viejo ?data=...
// ============================================
(function () {
  'use strict';

  var cfg = window.SUPABASE_CONFIG || {};
  var venue = window.SNACKY_CONFIG || {
    venueName: 'Snack Bowling',
    venueAddress: 'Avenida del Libertador 13054, Martinez',
    defaultEventDurationHours: 2
  };
  var hasSupabase = cfg.url && cfg.url.indexOf('TU-PROYECTO') === -1 &&
                    cfg.anonKey && cfg.anonKey.indexOf('TU_ANON_KEY') === -1;

  var supabase = hasSupabase
    ? window.supabase.createClient(cfg.url, cfg.anonKey)
    : null;

  // ============================================
  // CARGAR INVITACION (slug nuevo o data legacy)
  // ============================================
  var urlParams = new URLSearchParams(window.location.search);
  var slug = urlParams.get('id');
  var legacyData = urlParams.get('data');

  async function getInvitation() {
    if (slug && supabase) {
      var resp = await supabase
        .from('invitations')
        .select('*, background:background_id (name, image_url)')
        .eq('slug', slug)
        .maybeSingle();

      if (resp.error || !resp.data) {
        console.error('No se encontro la invitacion:', resp.error);
        return null;
      }

      // Incrementar contador de vistas (fire & forget — el .then() es lo que dispara el HTTP)
      supabase.rpc('increment_invitation_views', { p_slug: slug }).then(function () {});

      var inv = resp.data;
      return {
        slug: inv.slug,
        name: inv.child_name,
        birthday: inv.birthday,
        time: inv.start_time ? inv.start_time.slice(0, 5) : '00:00',
        phone: inv.phone,
        customMessage: inv.custom_message || null,
        backgroundUrl: inv.custom_photo_url || (inv.background && inv.background.image_url) || null
      };
    }

    if (legacyData) {
      try {
        var d = JSON.parse(decodeURIComponent(legacyData));
        return {
          slug: null,
          name: d.name,
          birthday: d.birthday,
          time: d.time,
          phone: d.phone,
          backgroundUrl: d.background ? '../assets/img/fondos/' + d.background + '.jpg' : null
        };
      } catch (e) {
        console.error('Error parseando datos legacy:', e);
        return null;
      }
    }

    return null;
  }

  // ============================================
  // CONFETI
  // ============================================
  function lanzarConfeti(particles) {
    if (typeof confetti !== 'function') return;
    confetti({
      particleCount: particles || 200,
      spread: 180,
      emojis: ['🎉', '❤️', '🌟', '🎈', '😊']
    });
  }

  document.addEventListener('DOMContentLoaded', function () { lanzarConfeti(500); });

  var confettiButton = document.getElementById('confettiButton');
  if (confettiButton) confettiButton.addEventListener('click', function () { lanzarConfeti(200); });

  // ============================================
  // FORMATEO DE FECHAS
  // ============================================
  function formatFriendlyDate(inputDate) {
    var date = new Date(inputDate + 'T00:00:00');
    var days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    var months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return days[date.getDay()] + ' ' + date.getDate() + ' de ' + months[date.getMonth()] + ' del ' + date.getFullYear();
  }

  function pad2(n) { return ('0' + n).slice(-2); }

  // ============================================
  // RENDER
  // ============================================
  function renderInvitation(inv) {
    document.title = 'Cumpleaños de ' + inv.name;

    // Fondo (custom photo o tematico)
    if (inv.backgroundUrl) {
      var relleno = document.querySelector('.relleno');
      if (relleno) relleno.style.backgroundImage = 'url(' + inv.backgroundUrl + ')';
    }

    // Calcular horarios
    var startDate = new Date(inv.birthday + 'T00:00:00');
    var startTime = inv.time.split(':').map(Number);
    startDate.setHours(startTime[0], startTime[1], 0, 0);
    var endDate = new Date(startDate.getTime());
    endDate.setHours(startDate.getHours() + 2);

    var formattedStart = pad2(startDate.getHours()) + ':' + pad2(startDate.getMinutes());
    var formattedEnd = pad2(endDate.getHours()) + ':' + pad2(endDate.getMinutes());
    var friendlyDate = formatFriendlyDate(inv.birthday);

    // Hero: nombre + "te invita"
    var userDataEl = document.getElementById('userData');
    if (userDataEl) {
      userDataEl.innerHTML =
        '<span class="hero-eyebrow">Te invito a mi cumple</span>' +
        '<h1 class="hero-name">' + escapeHtml(inv.name) + '</h1>' +
        '<span class="hero-emoji">🎳 🎂</span>';
    }

    // Datos del evento (cards de info)
    var dateEl = document.getElementById('invDate');
    if (dateEl) dateEl.textContent = capitalize(friendlyDate);
    var timeEl = document.getElementById('invTime');
    if (timeEl) timeEl.textContent = formattedStart + ' a ' + formattedEnd + ' hs';
    var venueEl = document.getElementById('invVenue');
    if (venueEl) {
      venueEl.innerHTML = '<strong>' + escapeHtml(venue.venueName) + '</strong><br>' +
                         escapeHtml(venue.venueAddress);
    }

    // Mensaje personalizado (si tiene)
    if (inv.customMessage) {
      var box = document.getElementById('customMessageBox');
      var text = document.getElementById('customMessageText');
      var label = document.getElementById('customMessageLabel');
      if (box && text) {
        text.textContent = inv.customMessage;
        if (label) label.textContent = 'Mensaje de ' + inv.name;
        box.hidden = false;
      }
    }

    // Countdown
    renderCountdown(startDate);

    // Link de Google Maps a la direccion del venue
    var mapsLink = document.getElementById('mapsLink');
    if (mapsLink) {
      mapsLink.href = 'https://www.google.com/maps/search/?api=1&query=' +
        encodeURIComponent(venue.venueAddress);
    }

    // Botones
    setupShareButton(inv);
    setupCalendarButton(inv, startDate, endDate);
    setupConfirmButton(inv);
  }

  function capitalize(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  function renderCountdown(startDate) {
    var today = new Date();
    var target = new Date(startDate.getTime());
    var legacyEl = document.getElementById('countdownTimer');
    var daysEl  = document.getElementById('cdDays');
    var hoursEl = document.getElementById('cdHours');
    var minsEl  = document.getElementById('cdMinutes');
    var section = document.getElementById('countdownSection');

    if (today > target) {
      if (legacyEl) legacyEl.textContent = '¡Llegó el día!';
      if (section) {
        section.innerHTML = '<h2 class="countdown-title countdown-arrived">🎉 ¡Llegó el día!</h2>';
      }
      return;
    }
    var ms = target.getTime() - today.getTime();
    var days    = Math.floor(ms / 86400000);
    var hours   = Math.floor((ms % 86400000) / 3600000);
    var minutes = Math.floor((ms % 3600000) / 60000);

    if (legacyEl) legacyEl.textContent = 'Faltan ' + days + ' días, ' + hours + ' horas, y ' + minutes + ' minutos para el cumpleaños';
    if (daysEl)  daysEl.textContent  = days;
    if (hoursEl) hoursEl.textContent = hours;
    if (minsEl)  minsEl.textContent  = minutes;
  }

  function setupShareButton(inv) {
    var btn = document.getElementById('shareButton');
    if (!btn) return;
    btn.addEventListener('click', function () {
      var url = window.location.href;
      var msg = '¡Estás invitado al cumpleaños de ' + inv.name + '! Haz clic aquí para ver los detalles: ' + url;
      window.location.href = 'whatsapp://send?text=' + encodeURIComponent(msg);
    });
  }

  function setupCalendarButton(inv, startDate, endDate) {
    var btn = document.getElementById('calendarButton');
    if (!btn) return;
    var startISO = startDate.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + '00Z';
    var endISO   = endDate.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15) + '00Z';
    var calLink = 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent('Cumpleaños de ' + inv.name) +
      '&dates=' + startISO + '/' + endISO +
      '&details=' + encodeURIComponent('Celebra el cumpleaños de ' + inv.name + ' en ' + venue.venueName + '!') +
      '&location=' + encodeURIComponent(venue.venueAddress);

    btn.innerHTML = '<i class="fa-regular fa-calendar"></i> Agregar al Calendario';
    btn.addEventListener('click', function () { window.open(calLink); });
  }

  function setupConfirmButton(inv) {
    var btn = document.getElementById('confirmButton');
    if (!btn) return;
    btn.addEventListener('click', function () { openRsvpModal(inv); });
  }

  function openRsvpModal(inv) {
    var modal = document.getElementById('rsvpModal');
    if (!modal) return;
    modal.hidden = false;
    document.getElementById('rsvpName').focus();

    var closeBtn = document.getElementById('rsvpCloseBtn');
    var form = document.getElementById('rsvpForm');

    function closeModal() {
      modal.hidden = true;
      form.reset();
    }
    closeBtn.onclick = closeModal;
    modal.onclick = function (ev) { if (ev.target === modal) closeModal(); };

    form.onsubmit = function (ev) {
      ev.preventDefault();
      var guestName = document.getElementById('rsvpName').value.trim();
      var guestsCount = parseInt(document.getElementById('rsvpGuests').value, 10) || 1;
      var customMsg = document.getElementById('rsvpMessage').value.trim();

      var phone = inv.phone;
      if (phone.startsWith('15')) phone = '11' + phone.slice(2);

      var bday = new Date(inv.birthday + 'T00:00:00');
      var daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      var personasTxt = guestsCount === 1 ? '1 persona' : guestsCount + ' personas';

      var msgLines = [
        '¡Hola! Soy ' + guestName + '.',
        'Confirmo asistencia al cumple del ' + daysOfWeek[bday.getDay()] + ' ' + bday.getDate() +
          ' a las ' + inv.time + ' en ' + venue.venueName + '.',
        'Vamos ' + personasTxt + '.'
      ];
      if (customMsg) msgLines.push('💬 ' + customMsg);

      var encoded = encodeURIComponent(msgLines.join('\n'));
      closeModal();
      window.open('whatsapp://send?phone=+54' + phone + '&text=' + encoded);
    };
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ============================================
  // CARRUSEL (sin cambios respecto a la version original)
  // ============================================
  function initCarousel() {
    var btnLeft  = document.querySelector('.btn-left');
    var btnRight = document.querySelector('.btn-right');
    var slider   = document.querySelector('#slider');
    var sections = document.querySelectorAll('.slider-section');
    if (!slider || !sections.length) return;

    var counter = 0;
    var operacion = 0;
    var widthImg = 100 / sections.length;

    function moveRight() {
      if (counter >= sections.length - 1) {
        counter = 0;
        operacion = 0;
        slider.style.transform = 'translate(-' + operacion + '%)';
        slider.style.transition = 'none';
        return;
      }
      counter++;
      operacion += widthImg;
      slider.style.transform = 'translate(-' + operacion + '%)';
      slider.style.transition = 'all ease .6s';
    }

    function moveLeft() {
      counter--;
      if (counter < 0) {
        counter = sections.length - 1;
        operacion = widthImg * (sections.length - 1);
        slider.style.transform = 'translate(-' + operacion + '%)';
        slider.style.transition = 'none';
        return;
      }
      operacion -= widthImg;
      slider.style.transform = 'translate(-' + operacion + '%)';
      slider.style.transition = 'all ease .6s';
    }

    if (btnLeft) btnLeft.addEventListener('click', moveLeft);
    if (btnRight) btnRight.addEventListener('click', moveRight);
    setInterval(moveRight, 3000);
  }

  // ============================================
  // INIT
  // ============================================
  window.addEventListener('load', async function () {
    var inv = await getInvitation();
    if (!inv) {
      document.body.innerHTML = '<div style="text-align:center;padding:60px 20px;font-family:sans-serif;">' +
        '<h2>No encontramos esta invitación</h2>' +
        '<p>El link puede haber expirado o no ser válido.</p>' +
        '<a href="index.html">Crear una nueva</a></div>';
      return;
    }
    renderInvitation(inv);
    initCarousel();
  });
})();
