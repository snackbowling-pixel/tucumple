// Define las variables importantes
const nombreEvento = "¡Snack Bowling!";
const direccion = "Avenida del Libertador 13054, Martinez";
const enlaceMaps = "https://www.google.com/maps/dir//Av.+del+Libertador+13054,+Mart%C3%ADnez,+Provincia+de+Buenos+Aires/@-34.4906768,-58.5679107,12z/data=!4m8!4m7!1m0!1m5!1m1!1s0x95bcb174c35f254f:0x4265a336265d66ed!2m2!1d-58.4852119!2d-34.4905805?entry=ttu";



document.getElementById('nombreEvento').textContent = nombreEvento;
document.getElementById('direccion').textContent = direccion;
document.querySelector('.maps.boton').href = enlaceMaps;
