// Archivo: js.registro.js (Asumiendo que es para el formulario de Registro)

document.addEventListener('DOMContentLoaded', () => {
    // Función para mostrar/ocultar la contraseña (Mantenida, asumiendo que el registro también la tiene)
    window.togglePassword = function () {
        const passwordInput = document.getElementById("password");
        const toggleIcon = document.querySelector(".toggle-password"); // Asumiendo que el registro usa el mismo HTML/CSS

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            if (toggleIcon) {
                toggleIcon.classList.remove("fa-eye-slash");
                toggleIcon.classList.add("fa-eye");
            }
        } else {
            passwordInput.type = "password";
            if (toggleIcon) {
                toggleIcon.classList.remove("fa-eye");
                toggleIcon.classList.add("fa-eye-slash");
            }
        }
    };

    // 1. Función para permitir solo números y limitar longitud (DNI y Teléfono)
    // Debes llamar esta función en el input DNI con oninput="soloNumerosYLongitud(event, 8)"
    // y en el input Teléfono con oninput="soloNumerosYLongitud(event, 9)"
    window.soloNumerosYLongitud = function (event, maxLength) {
        // Reemplaza cualquier carácter que NO sea un dígito (0-9) por una cadena vacía
        event.target.value = event.target.value.replace(/[^0-9]/g, '');

        // Limita la longitud
        if (event.target.value.length > maxLength) {
            event.target.value = event.target.value.slice(0, maxLength);
        }
    };

    // 2. Función para solo permitir letras y espacios (Nombre)
    // Debes llamar esta función en el input Nombre con oninput="soloLetrasYEspacios(event)"
    window.soloLetrasYEspacios = function (event) {
        // Reemplaza cualquier carácter que NO sea una letra o espacio por una cadena vacía
        event.target.value = event.target.value.replace(/[^a-zA-Z\s]/g, '');
    };

    // 3. Función para eliminar espacios (Correo, Usuario, Contraseña)
    // Debes llamar esta función en los inputs de correo, usuario y contraseña con oninput="sinEspacios(event)"
    window.sinEspacios = function (event) {
        // Reemplaza todos los espacios (' ') por una cadena vacía
        event.target.value = event.target.value.replace(/\s/g, '');
    };

    const formulario = document.getElementById('registroForm');

    // Este código maneja el envío del formulario
    formulario.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(formulario);
        const data = Object.fromEntries(formData.entries());

        // **NOTA:** También deberías validar la longitud del DNI y Teléfono aquí antes de enviar
        // Ejemplo:
        // if (data.dni.length !== 8) { alert('DNI debe tener 8 dígitos.'); return; }
        // if (data.telefono.length !== 9) { alert('Teléfono debe tener 9 dígitos.'); return; }

        if (data.nombre && data.correo && data.password) {
            console.log("Formulario enviado. Datos:", data);
            alert('¡Formulario enviado con éxito!');
        } else {
            alert('Por favor, completa todos los campos requeridos.');
        }
    });
});
