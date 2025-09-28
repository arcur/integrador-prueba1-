// Función para cargar un archivo HTML externo y meterlo en un contenedor
function loadHTML(url, elementId) {
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(data => {
            // Inserta el contenido del archivo en el elemento del DOM
            document.getElementById(elementId).innerHTML = data;
        })
        .catch(error => {
            console.error('Error al cargar el archivo HTML:', error);
            // Mostrar un mensaje de error si la carga falla
            document.getElementById(elementId).innerHTML = '<header>Error al cargar el encabezado.</header>';
        });
}