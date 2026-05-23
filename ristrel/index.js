// // Función para cargar el formulario
// function cargarFormulario() {
//   var xhr = new XMLHttpRequest();
//   xhr.onreadystatechange = function() {
//     if (xhr.readyState === XMLHttpRequest.DONE) {
//       if (xhr.status === 200) {
//         document.getElementById('formulario-container').innerHTML = xhr.responseText;
//       } else {
//         console.error('Error al cargar el formulario:', xhr.status);
//       }
//     }
// padding: 10px 20px;
//   };
//   xhr.open('GET', '../formulario.html', true); // Ruta al formulario en la carpeta /tucumple/
//   xhr.send();
// }

// // Cargar el formulario cuando se cargue la página
// window.onload = cargarFormulario;

document.getElementById('userForm').addEventListener('submit', function(event) {
  event.preventDefault();
  var name = document.getElementById('name').value;
  var birthday = document.getElementById('birthday').value;
  var time = document.getElementById('time').value;
  var time2 = document.getElementById('time2').value;
  var phone = document.getElementById('phone').value; 
  var selectedBackground = document.getElementById('background').value;

  // Verificar si el número de teléfono está vacío o no cumple con el formato deseado
  var phonePattern = /^\d{10}$/; // Patrón para un número de teléfono de 10 dígitos
  if (!phone || !phonePattern.test(phone)) {
    alert('Por favor, ingrese un número de teléfono válido.');
    return;
  }

  // Si el número de teléfono es válido, continuar con el procesamiento del formulario
  var userData = {
      name: name,
      birthday: birthday,
      time: time,
      time2: time2,
      phone: phone, 
      background: selectedBackground
  };

  var encodedUserData = encodeURIComponent(JSON.stringify(userData));
  var pageURLWithData = "inv.html?data=" + encodedUserData;
  window.location.href = pageURLWithData;
});

// Restringir la selección de fecha a fechas futuras
var today = new Date().toISOString().split('T')[0];
document.getElementById('birthday').setAttribute('min', today);

document.getElementById('background').addEventListener('change', function() {
  var selectedBackground = this.value;
  var rellenoElement = document.querySelector('.relleno');
  rellenoElement.style.backgroundImage = `url(../../assets/img/fondos2/${selectedBackground}.jpg)`;
});

