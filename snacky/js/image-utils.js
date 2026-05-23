// ============================================
// Utilidades de imagen: compresion + conversion a WebP
// Usado por el admin (fondos) y por el formulario publico (foto del padre)
// ============================================
(function (global) {
  'use strict';

  /**
   * Convierte un File de imagen a un Blob WebP escalado.
   *
   * @param {File} file - archivo de imagen (jpg/png/webp/heic)
   * @param {Object} options
   * @param {number} options.maxWidth - ancho maximo en px (default 1600)
   * @param {number} options.maxHeight - alto maximo en px (default 1600)
   * @param {number} options.quality - calidad WebP 0-1 (default 0.82)
   * @returns {Promise<{blob: Blob, width: number, height: number, originalSize: number, finalSize: number}>}
   */
  function compressToWebP(file, options) {
    options = options || {};
    var maxWidth = options.maxWidth || 1600;
    var maxHeight = options.maxHeight || 1600;
    var quality = options.quality != null ? options.quality : 0.82;
    var originalSize = file.size;

    return new Promise(function (resolve, reject) {
      var reader = new FileReader();

      reader.onerror = function () { reject(new Error('No se pudo leer el archivo')); };

      reader.onload = function (e) {
        var img = new Image();
        img.onerror = function () { reject(new Error('Archivo de imagen invalido')); };

        img.onload = function () {
          // Calcular dimensiones respetando aspect ratio
          var w = img.naturalWidth;
          var h = img.naturalHeight;
          var ratio = Math.min(maxWidth / w, maxHeight / h, 1);
          var targetW = Math.round(w * ratio);
          var targetH = Math.round(h * ratio);

          var canvas = document.createElement('canvas');
          canvas.width = targetW;
          canvas.height = targetH;

          var ctx = canvas.getContext('2d');
          // Mejor calidad de rescalado
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, targetW, targetH);

          canvas.toBlob(
            function (blob) {
              if (!blob) {
                reject(new Error('No se pudo convertir a WebP'));
                return;
              }
              resolve({
                blob: blob,
                width: targetW,
                height: targetH,
                originalSize: originalSize,
                finalSize: blob.size
              });
            },
            'image/webp',
            quality
          );
        };

        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Formatea un tamano en bytes a un string legible (KB / MB).
   */
  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  /**
   * Genera un nombre de archivo unico con timestamp.
   * @param {string} originalName
   * @param {string} ext - extension sin punto (default 'webp')
   */
  function uniqueFileName(originalName, ext) {
    ext = ext || 'webp';
    var safe = (originalName || 'image')
      .toLowerCase()
      .replace(/\.[a-z0-9]+$/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'image';
    var stamp = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    return safe + '-' + stamp + '.' + ext;
  }

  global.ImageUtils = {
    compressToWebP: compressToWebP,
    formatBytes: formatBytes,
    uniqueFileName: uniqueFileName
  };
})(window);
