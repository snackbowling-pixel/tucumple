
function shortenURL(longURL, callback) {
  // Construir la URL para la solicitud a la API de TinyURL
  const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(longURL)}`;

  // Realizar la solicitud a la API de TinyURL
  fetch(apiUrl)
    .then(response => {
      if (response.ok) {
        return response.text();
      } else {
        throw new Error('Error al acortar la URL');
      }
    })
    .then(shortURL => {
      callback(shortURL);
    })
    .catch(error => {
      console.error('Error al acortar la URL:', error);
      callback(null);
    });
}

// Define una función para lanzar confeti automáticamente con más confeti
function lanzarConfetiAutomatico() {
  // Configura las opciones de la animación
  const opcionesConfeti = {
    emojis: ['🎉', '❤️', '🌟', '🎈', '😊'], // Ingresa otros emojis aquí
    particleCount: 500, // Aumenta la cantidad de confeti
    spread: 180, // Aumenta el rango de dispersión
    //colors: ['#ff0000', '#00ff00', '#0000ff'] // Personaliza los colores del confeti
  };

  // Llama a la función confetti() con las opciones configuradas
  confetti(opcionesConfeti);
}

// Agrega un event listener para cuando el documento esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
  // Llama a la función para lanzar confeti automáticamente
  lanzarConfetiAutomatico();
});

// Obtener el botón de lanzar confeti por su ID
var confettiButton = document.getElementById('confettiButton');

// Agregar un event listener para el clic en el botón
confettiButton.addEventListener('click', function() {
  // Llamar a la función para lanzar confeti
  lanzarConfeti();
});

// Función para lanzar confeti
function lanzarConfeti() {
  // Configurar las opciones de la animación de confeti
  const opcionesConfeti = {
    emojis: ['🎉', '❤️', '🌟', '🎈', '😊'], // Ingresa otros emojis aquí
    particleCount: 200, // Aumenta la cantidad de confeti
    spread: 180, // Aumenta el rango de dispersión
    //colors: ['#ff0000', '#00ff00', '#0000ff'] // Personaliza los colores del confeti
  };

  // Llamar a la función confetti() con las opciones configuradas
  confetti(opcionesConfeti);
}

window.onload = function() {
// Función para formatear la fecha
function formatDate(date) {
  var months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  var monthIndex = date.getMonth();
  var day = date.getDate()+1;
  var year = date.getFullYear();

  return day + ' de ' + months[monthIndex] + ' de ' + year;
}

// Obtener los parámetros de la URL
var urlParams = new URLSearchParams(window.location.search);
var userDataString = urlParams.get('data');

// Decodificar los datos del usuario
var userData = JSON.parse(decodeURIComponent(userDataString));

document.title = "Evento de " + userData.name;

// Formatear la fecha de inicio y fin
var startDate = new Date(userData.birthday);
var endDate = new Date(userData.birthday);
startDate.setHours(parseInt(userData.time.split(':')[0]), parseInt(userData.time.split(':')[1]));
endDate.setHours(parseInt(userData.time2.split(':')[0]), parseInt(userData.time2.split(':')[1]));

// Formatear las horas
var formattedStartTime = ('0' + startDate.getHours()).slice(-2) + ':' + ('0' + startDate.getMinutes()).slice(-2);
var formattedEndTime = ('0' + endDate.getHours()).slice(-2) + ':' + ('0' + endDate.getMinutes()).slice(-2);

function formatFriendlyDate(inputDate) {
  // Creación de la fecha con el formato adecuado
  let date = new Date(inputDate + 'T00:00:00');
  
  // Arrays para nombres de días de la semana y meses
  const daysOfWeek = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const monthsOfYear = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  // Obtener el día de la semana, día del mes y mes
  let dayOfWeek = daysOfWeek[date.getDay()];
  let day = date.getDate();
  let month = monthsOfYear[date.getMonth()];
  let year = date.getFullYear();

  // Devolver la fecha en formato amigable
  return `${dayOfWeek} ${day} de ${month} del ${year}`;
}
console.log(userData.time2)
// Formatear la fecha de cumpleaños
var formattedBirthday = formatFriendlyDate(userData.birthday);



      var userData = JSON.parse(decodeURIComponent(userDataString));

      // Obtener el nombre del fondo seleccionado por el usuario
      var selectedBackground = userData.background;

      console.log(selectedBackground);

// Mostrar los datos en la página
var userDataElement = document.getElementById('userData');
userDataElement.innerHTML = "<h3>" + userData.name + "</h3>" +
                          "<h4><strong>¡Te ha invitado a su " + selectedBackground + "!</strong></h4>" +
                          "<h5>Te espero el día <strong>" + formattedBirthday + "</strong> de " + formattedStartTime + " hasta " + formattedEndTime + " en: </h5>";


                          

  // Calcular el tiempo restante hasta el cumpleaños
  var today = new Date();
  var yaPaso = false;
  startDate.setFullYear(today.getFullYear()); // Asegurarse de que el año del cumpleaños sea el mismo que el año actual
  if (today > startDate) {
    startDate.setFullYear(today.getFullYear() + 1); // Si ya pasó el cumpleaños,

    startDate.setFullYear(today.getFullYear() + 1); // Si ya pasó el cumpleaños, ajustar al próximo año
    yaPaso = true;
  }

  var timeLeft = startDate.getTime() - today.getTime();
  var daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  var hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  
  // Mostrar el contador
  if(yaPaso == false){
    var countdownElement = document.getElementById('countdownTimer');
    countdownElement.textContent = "Faltan " + (daysLeft+1) + " días, " + hoursLeft + " horas, y " + minutesLeft + " minutos para el evento";
  } else {
    var countdownElement = document.getElementById('countdownTimer');
    countdownElement.textContent = "¡Llego el Día!";
  }

// Botón para compartir por WhatsApp
var shareButton = document.getElementById('shareButton');
shareButton.addEventListener('click', function() {
    // Obtener la URL base de la página actual
    var baseURL = window.location.href.split('?')[0];
    
    // Codificar los datos del usuario
    var encodedUserData = encodeURIComponent(JSON.stringify(userData));
    
    // Generar la URL completa con los datos codificados
    var completeURL = baseURL + '?data=' + encodedUserData;

    // Acortar la URL utilizando TinyURL
    shortenURL(completeURL, function(shortenedURL) {
      if (shortenedURL) {
        // Generar el enlace compartido por WhatsApp con la URL acortada
        var whatsappMessage = "¡Estás invitado al evento de " + userData.name + "! Haz clic aquí para ver los detalles: " + shortenedURL;
        var encodedWhatsAppMessage = encodeURIComponent(whatsappMessage);
        var whatsappURL = "whatsapp://send?text=" + encodedWhatsAppMessage;
        
        // Intentar abrir la aplicación WhatsApp
        window.location.href = whatsappURL;
      } else {
        // Si hay un error al acortar la URL, simplemente compartir la URL completa
        var whatsappMessage = "¡Estás invitado al evento de " + userData.name + "! Haz clic aquí para ver los detalles: " + completeURL;
        var encodedWhatsAppMessage = encodeURIComponent(whatsappMessage);
        var whatsappURL = "whatsapp://send?text=" + encodedWhatsAppMessage;
        
        // Intentar abrir la aplicación WhatsApp
        window.location.href = whatsappURL;
      }
    });
});

  // Crear la URL para agregar el evento al calendario de Google
  const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Evento de ' + userData.name)}&dates=${startDate.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15)}00Z/${endDate.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15)}00Z&details=${encodeURIComponent('Celebra el evento de ' + userData.name + '!')}&location=${encodeURIComponent('Avenida del Libertador 13054, Martinez')}`;

  // Crear la URL para agregar el evento al calendario de iOS
  const iOSCalendarLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent('Evento de ' + userData.name)}&dates=${startDate.toISOString().replace(/[-:]/g, '').slice(0, 15)}00Z/${endDate.toISOString().replace(/[-:]/g, '').slice(0, 15)}00Z&details=${encodeURIComponent('Celebra el evento de ' + userData.name + '!')}&location=${encodeURIComponent('Avenida del Libertador 13054, Martinez')}`;

  // Crear el botón y agregar el enlace al calendario
  const addButtonToCalendar = () => {
    const calendarButton = document.getElementById('calendarButton');
    calendarButton.innerHTML = '<i class="fa-regular fa-calendar"></i> Agregar al Calendario';
    calendarButton.addEventListener('click', () => {
      // Detectar si el navegador es iOS
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      // Abrir la URL correspondiente al calendario
      if (isIOS) {
        window.open(iOSCalendarLink);
      } else {
        window.open(googleCalendarLink);
      }
    });
  };

  // Llamar a la función para crear el botón y agregar el enlace al calendario
  addButtonToCalendar();

}

// Función para formatear la fecha
function formatDate(date) {
  var day = ('0' + (date.getDate() + 1)).slice(-2); // Sumar 1 día para corregir el problema
  var month = ('0' + (date.getMonth() + 1)).slice(-2);
  var year = date.getFullYear();
  return day + '/' + month + '/' + year;
}

// Extraer los datos de la URL
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const rawData = urlParams.get('data');

if (rawData) {
  try {
    const userData = JSON.parse(decodeURIComponent(rawData));
    // console.log(userData); // Verificar los datos en la consola

    // Obtener la fecha de cumpleaños del usuario
    const birthdayDate = new Date(userData.birthday);

    const startDate = new Date(birthdayDate.getTime()); // Crear una nueva fecha basada en la fecha de cumpleaños
    startDate.setDate(startDate.getDate() + 1); // Agregar un día
    
    const startTime = userData.time.split(':').map(Number); // Obtener la hora de inicio del evento
    startDate.setHours(startTime[0], startTime[1], 0, 0); // Establecer la hora de inicio
    
    const endTime = userData.time2.split(':').map(Number); // Obtener la hora de fin del evento
    startDate.setHours(endTime[0], endTime[1], 0, 0); // Establecer la hora de inicio
    
    

// Crear la URL para agregar el evento al calendario de Google
const googleCalendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('Evento de ' + userData.name)}&dates=${startDate.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15)}00Z/${endDate.toISOString().replace(/-|:|\.\d+/g, '').slice(0, 15)}00Z&details=${encodeURIComponent('Celebra el evento de ' + userData.name + '!')}&location=${encodeURIComponent('Avenida del Libertador 13054, Martinez')}`;

// Crear la URL para agregar el evento al calendario de iOS
const iOSCalendarLink = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodeURIComponent('Evento de ' + userData.name)}&dates=${startDate.toISOString().replace(/[-:]/g, '').slice(0, 15)}00Z/${endDate.toISOString().replace(/[-:]/g, '').slice(0, 15)}00Z&details=${encodeURIComponent('Celebra el evento de ' + userData.name + '!')}&location=${encodeURIComponent('Avenida del Libertador 13054, Martinez')}`;

// Crear el botón y agregar el enlace al calendario
const addButtonToCalendar = () => {
  const calendarButton = document.getElementById('calendarButton');
  calendarButton.innerHTML = '<i class="fa-regular fa-calendar"></i> Agregar al Calendario';
  calendarButton.addEventListener('click', () => {
    // Detectar si el navegador es iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // Abrir la URL correspondiente al calendario
    if (isIOS) {
      window.open(iOSCalendarLink);
    } else {
      window.open(googleCalendarLink);
    }
  });
};

    // Llamar a la función para crear el botón y agregar el enlace al calendario
    addButtonToCalendar();

    // Mostrar los datos en la página
    const userDataElement = document.getElementById('userData');
    userDataElement.innerHTML = `<h3>${userData.name}</h3><h4><strong>¡Te ha invitado a su evento!</strong></h4><h4>🎳​​🎂​</h4><h5>Te espero el día <strong>${formatDate(startDate)}</strong> de ${('0' + startTime[0]).slice(-2)}:${('0' + startTime[1]).slice(-2)} hasta ${('0' + endDate.getHours()).slice(-2)}:${('0' + endDate.getMinutes()).slice(-2)} en: </h5>`;

  } catch (error) {
    console.error('Error al analizar los datos JSON:', error);
  }
} else {
  console.error('No se encontraron datos en la URL');
}

// Función para acortar la URL usando TinyURL
function shortenURL(longURL, callback) {
  // Endpoint de la API de TinyURL para acortar URL
  var tinyURLAPI = 'https://tinyurl.com/api-create.php?url=' + encodeURIComponent(longURL);

  // Realizar la solicitud a la API de TinyURL
  fetch(tinyURLAPI)
    .then(response => response.text())
    .then(shortURL => {
      callback(shortURL); // Llamar al callback con la URL acortada
    })
    .catch(error => {
      console.error('Error al acortar la URL con TinyURL:', error);
      callback(null); // Llamar al callback con valor nulo en caso de error
    });
}


// FONDOS
document.addEventListener('DOMContentLoaded', function() {
  var urlParams = new URLSearchParams(window.location.search);
  var userDataString = urlParams.get('data');

  if (userDataString) {
      try {
          var userData = JSON.parse(decodeURIComponent(userDataString));

          // Obtener el nombre del fondo seleccionado por el usuario
          var selectedBackground = userData.background;

          // Cambiar el fondo en la invitación
          var rellenoElement = document.querySelector('.relleno');
          rellenoElement.style.backgroundImage = `url(../assets/img/fondos2/${selectedBackground}.jpg)`;

      } catch (error) {
          console.error('Error al analizar los datos JSON:', error);
      }
  } else {
      console.error('No se encontraron datos en la URL');
  }
});

// CARRUSEL


const btnLeft = document.querySelector(".btn-left"),
      btnRight = document.querySelector(".btn-right"),
      slider = document.querySelector("#slider"),
      sliderSection = document.querySelectorAll(".slider-section");


btnLeft.addEventListener("click", e => moveToLeft())
btnRight.addEventListener("click", e => moveToRight())

setInterval(() => {
    moveToRight()
}, 3000);


let operacion = 0,
    counter = 0,
    widthImg = 100 / sliderSection.length;

function moveToRight() {
    if (counter >= sliderSection.length-1) {
        counter = 0;
        operacion = 0;
        slider.style.transform = `translate(-${operacion}%)`;
        slider.style.transition = "none";
        return;
    } 
    counter++;
    operacion = operacion + widthImg;
    slider.style.transform = `translate(-${operacion}%)`;
    slider.style.transition = "all ease .6s"
    
}  

function moveToLeft() {
    counter--;
    if (counter < 0 ) {
        counter = sliderSection.length-1;
        operacion = widthImg * (sliderSection.length-1)
        slider.style.transform = `translate(-${operacion}%)`;
        slider.style.transition = "none";
        return;
    } 
    operacion = operacion - widthImg;
    slider.style.transform = `translate(-${operacion}%)`;
    slider.style.transition = "all ease .6s"
    
    
}   


// CONFIRMAR ASISTENCIA

document.getElementById('confirmButton').addEventListener('click', function() {
  // Obtener los parámetros de la URL
  var urlParams = new URLSearchParams(window.location.search);
  var userDataString = urlParams.get('data');
  // Decodificar los datos del usuario
  var userData = JSON.parse(decodeURIComponent(userDataString));

  var phone = userData.phone;
  var birthday = new Date(userData.birthday); // Convertir la fecha en una instancia de Date
  birthday.setDate(birthday.getDate() + 1); 
  var time = userData.time;

  // Verificar si el número de teléfono comienza con "15" y reemplazarlo por "11"
  if (phone.startsWith("15")) {
    phone = "11" + phone.slice(2);
  }

  // Obtener el nombre del día de la semana
  var daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var dayOfWeek = daysOfWeek[birthday.getDay()];

  // Formatear el mensaje con el día de la semana y la hora ingresada
  var message = encodeURIComponent("¡Nos vemos el día " + dayOfWeek + " " + birthday.getDate() + " a las " + time + " en Snack Bowling!");
  
  // Crear la URL de WhatsApp con el número de teléfono y el mensaje
  var whatsappURL = "whatsapp://send?phone=+54" + phone + "&text=" + message;
  
  // Abrir la ventana de WhatsApp
  window.open(whatsappURL);
});
