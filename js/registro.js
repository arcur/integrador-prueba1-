document.addEventListener('DOMContentLoaded', () => {
    // Función para mostrar/ocultar la contraseña
    window.togglePassword = function() {
        const passwordInput = document.getElementById("password");
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
        } else {
            passwordInput.type = "password";
        }
    };

    // 1. Función para permitir solo números (usada en DNI y Teléfono)
    window.soloNumeros = function(event) {
        // Reemplaza cualquier carácter que NO sea un dígito (0-9) por una cadena vacía
        event.target.value = event.target.value.replace(/[^0-9]/g, '');
    };

    // 2. 🚨 NUEVA FUNCIÓN: Elimina espacios en Correo, Usuario y Contraseña 🚨
    window.sinEspacios = function(event) {
        // Reemplaza todos los espacios (' ') por una cadena vacía
        event.target.value = event.target.value.replace(/\s/g, '');
    };

    const formulario = document.getElementById('registroForm');
    
    // Este código maneja el envío del formulario
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formulario);
        const data = Object.fromEntries(formData.entries());

        if (data.nombre && data.correo && data.password) {
            console.log("Formulario enviado. Datos:", data);
            alert('¡Formulario enviado con éxito!');
        } else {
            alert('Por favor, completa todos los campos requeridos.');
        }
    });
});