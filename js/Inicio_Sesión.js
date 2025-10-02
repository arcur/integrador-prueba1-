document.addEventListener('DOMContentLoaded', () => {
    // 🚨 Credenciales de Acceso Rápido (Solo para pruebas de desarrollo)
    const USERNAME_TEST = 'demo';
    const PASSWORD_TEST = '12345';
    const EMAIL_TEST = 'demo@techstore.com';
    
    // Referencias a elementos del DOM
    const formulario = document.getElementById('loginForm');
    const passwordInput = document.getElementById("password"); 
    const toggleIcon = document.querySelector(".toggle-password");
    const messageBox = document.getElementById('message-box'); 

    // Función para mostrar/ocultar la contraseña
    window.togglePassword = function () {
        if (!passwordInput || !toggleIcon) return;
        
        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleIcon.classList.remove("fa-eye-slash");
            toggleIcon.classList.add("fa-eye");
        } else {
            passwordInput.type = "password";
            toggleIcon.classList.remove("fa-eye");
            toggleIcon.classList.add("fa-eye-slash");
        }
    };
    
    // Función auxiliar para mostrar mensajes
    function showMessage(msg, isSuccess) {
        if (!messageBox) return;
        messageBox.textContent = msg;
        messageBox.style.backgroundColor = isSuccess ? '#d4edda' : '#f8d7da'; 
        messageBox.style.color = isSuccess ? '#155724' : '#721c24';
        messageBox.style.border = isSuccess ? '1px solid #c3e6cb' : '1px solid #f5c6cb';
        messageBox.style.padding = '10px';
        messageBox.style.marginTop = '15px';
        messageBox.style.borderRadius = '5px';
    }

    // Manejador del envío del formulario
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            showMessage('', true); // Limpiar mensaje anterior

            const formData = new FormData(formulario);
            // Asegúrese que sus inputs tienen name="usuario" y name="password" 
            const inputUserOrEmail = formData.get('usuario')?.trim() || '';
            const inputPassword = formData.get('password') || '';
            
            if (!inputUserOrEmail || !inputPassword) {
                showMessage('Por favor, completa ambos campos.', false);
                return;
            }

            // Lógica de autenticación simple (demo / 12345)
            const isAuthSuccess = 
                (inputUserOrEmail === USERNAME_TEST || inputUserOrEmail === EMAIL_TEST) && 
                (inputPassword === PASSWORD_TEST);

            if (isAuthSuccess) {
                
                // Simulación de sesión exitosa
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', USERNAME_TEST);

                showMessage(`¡Bienvenido, ${USERNAME_TEST}! Redirigiendo...`, true);
                
                // 🚀 CORRECCIÓN CLAVE: Usamos una ruta absoluta para ir directamente al index.html en la raíz del servidor.
                setTimeout(() => {
                    // Esta línea encontrará index.html en 127.0.0.1:5500/index.html
                    const basePath = window.location.origin;
                    window.location.href = `${basePath}/index.html`; 
                }, 1000); 

            } else {
                // Credenciales incorrectas
                showMessage('Usuario o Contraseña incorrectos. Usa demo / 12345.', false);
            }
        });
    } else {
        console.error("El formulario con ID 'loginForm' no se encontró.");
    }
});