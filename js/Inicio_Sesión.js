document.addEventListener('DOMContentLoaded', () => {
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
        // Estilos para los mensajes (puedes personalizarlos)
        messageBox.style.backgroundColor = isSuccess ? 'rgba(40, 167, 69, 0.2)' : 'rgba(220, 53, 69, 0.2)';
        messageBox.style.color = isSuccess ? '#28a745' : '#dc3545';
        messageBox.style.border = isSuccess ? '1px solid #28a745' : '1px solid #dc3545';
        messageBox.style.padding = '10px';
        messageBox.style.marginTop = '15px';
        messageBox.style.borderRadius = '5px';
        messageBox.style.textAlign = 'center';
    }

    // Manejador del envío del formulario
    if (formulario) {
        formulario.addEventListener('submit', async (e) => {
            e.preventDefault();
            showMessage('', true); // Limpiar mensaje anterior

            const formData = new FormData(formulario);
            // Tu formulario usa 'usuario', pero Spring Security espera 'username'
            const inputUserOrEmail = formData.get('usuario')?.trim() || '';
            const inputPassword = formData.get('password') || '';

            if (!inputUserOrEmail || !inputPassword) {
                showMessage('Por favor, completa ambos campos.', false);
                return;
            }

            // --- LÓGICA DE LOGIN CON EL BACKEND ---

            // Spring Security (formLogin) NO usa JSON. 
            // Usa 'application/x-www-form-urlencoded', así que creamos el body manualmente.
            const body = new URLSearchParams();
            body.append('username', inputUserOrEmail); // Mapeamos 'usuario' a 'username'
            body.append('password', inputPassword);

            // Este es el endpoint de login por defecto de Spring Security
            const API_URL = 'http://localhost:8080/login'; 

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: body,
                    // TRUCO IMPORTANTE:
                    // Por defecto, Spring Security REDIRIGE (302) si el login falla.
                    // 'redirect: manual' nos permite capturar ese fallo.
                    redirect: 'manual' 
                });

                // Si 'response.type' es 'opaqueredirect', significa que falló
                // y Spring intentó redirigir a /login?error.
                if (response.type === 'opaqueredirect' || response.status === 302) {
                    showMessage('Usuario o Contraseña incorrectos.', false);
                }
                // Si la respuesta es 200 OK, el login fue exitoso.
                else if (response.ok) {
                    // ¡Éxito! El backend ya creó la sesión (cookie JSESSIONID).
                    showMessage('¡Bienvenido! Redirigiendo...', true);

                    // Redirigir al index.html
                    setTimeout(() => {
                        // Usamos window.location.origin para ir a la raíz
                        const basePath = window.location.origin; 
                        window.location.href = `${basePath}/index.html`; // Asumiendo que index.html está en la raíz
                    }, 1000);

                } else {
                    // Otro error inesperado
                    showMessage(`Error: ${response.status} ${response.statusText}`, false);
                }

            } catch (error) {
                // Error de red (el backend está caído)
                console.error('Error de conexión:', error);
                showMessage('Error de conexión. Verifique que el backend esté corriendo.', false);
            }
        });
    } else {
        console.error("El formulario con ID 'loginForm' no se encontró.");
    }
});
