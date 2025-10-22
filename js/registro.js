document.addEventListener('DOMContentLoaded', () => {
    const formulario = document.getElementById('registroForm');
    const mensajeDiv = document.getElementById('mensajeRegistro'); // Asegúrese de agregar este div al HTML

    // Función de utilidad para mostrar mensajes al usuario
    const mostrarMensaje = (texto, tipo) => {
        // Limpia clases anteriores y asigna la nueva (compatible con Bootstrap)
        mensajeDiv.className = 'alert'; 
        mensajeDiv.classList.add(`alert-${tipo}`, 'mt-3');
        mensajeDiv.textContent = texto;
        mensajeDiv.style.display = 'block';
    };

    // Función para mostrar/ocultar la contraseña (Mantenida)
    window.togglePassword = function () {
        const passwordInput = document.getElementById("password");
        const toggleIcon = document.querySelector(".toggle-password"); 

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

    // Funciones de validación de inputs (Mantenidas)
    window.soloNumerosYLongitud = function (event, maxLength) {
        event.target.value = event.target.value.replace(/[^0-9]/g, '');
        if (event.target.value.length > maxLength) {
            event.target.value = event.target.value.slice(0, maxLength);
        }
    };

    window.soloLetrasYEspacios = function (event) {
        event.target.value = event.target.value.replace(/[^a-zA-Z\s]/g, '');
    };

    window.sinEspacios = function (event) {
        event.target.value = event.target.value.replace(/\s/g, '');
    };
    
    // =========================================================================
    // MODIFICACIÓN CLAVE: CONEXIÓN AL BACKEND Y AÑADIDO DE PRE-VALIDACIONES
    // =========================================================================

    formulario.addEventListener('submit', async (e) => {
        e.preventDefault();
        mensajeDiv.style.display = 'none'; // Ocultar mensajes anteriores

        // 1. Recolección y mapeo de datos
        const formData = new FormData(formulario);
        const data = Object.fromEntries(formData.entries());

        const usuarioParaRegistro = {
            nombre: data.nombre,
            apellidoPaterno: data.apellidoPaterno,
            apellidoMaterno: data.apellidoMaterno,
            numeroDni: data.numeroDni,
            telefono: data.telefono,
            correo: data.correo,
            nombreUsuario: data.nombreUsuario,
            password: data.password // La contraseña será encriptada en el backend
        };
        
        // *******************************************************************
        // 1.1. PRE-VALIDACIONES DEL LADO DEL CLIENTE (NUEVO)
        // Esto mejora la experiencia del usuario y reduce la carga del backend.
        // *******************************************************************

        // Validar campos obligatorios (simplemente si están vacíos)
        for (const key in usuarioParaRegistro) {
            if (usuarioParaRegistro[key] === '') {
                mostrarMensaje('Debe completar todos los campos obligatorios.', 'danger');
                return;
            }
        }
        
        // Validación de DNI (8 dígitos exactos)
        if (usuarioParaRegistro.numeroDni.length !== 8) {
            mostrarMensaje('El DNI debe tener exactamente 8 dígitos.', 'danger');
            return;
        }

        // Validación de Teléfono (9 dígitos exactos)
        if (usuarioParaRegistro.telefono.length !== 9) {
            mostrarMensaje('El Teléfono debe tener exactamente 9 dígitos.', 'danger');
            return;
        }
        
        // Validación de Contraseña (Mínimo 8 caracteres)
        if (usuarioParaRegistro.password.length < 8) {
            mostrarMensaje('La contraseña debe tener al menos 8 caracteres.', 'danger');
            return;
        }
        
        // Validación de Correo Básico (contiene @ y .)
        if (!/\S+@\S+\.\S+/.test(usuarioParaRegistro.correo)) {
            mostrarMensaje('El formato del correo electrónico no es válido.', 'danger');
            return;
        }


        // *******************************************************************
        // Nota: Asumo que su servidor Spring Boot está en 'http://localhost:8080'. 
        // Si no, ajuste la URL base según la configuración de su proyecto.
        // *******************************************************************
        const API_URL = 'http://localhost:8080/api/usuarios';

        try {
            // 2. Envío de la petición POST al endpoint de Spring Boot
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Convertimos el objeto JavaScript a JSON String para el cuerpo de la petición
                body: JSON.stringify(usuarioParaRegistro) 
            });

            // 3. Manejo de la respuesta del servidor (Lógica mantenida y mejorada para claridad)
            
            // Intentamos obtener el cuerpo de la respuesta para mensajes de error detallados
            const responseData = await response.json().catch(() => ({})); 

            if (response.ok) {
                // 3.1. ÉXITO (200, 201)
                console.log('Usuario registrado con éxito:', responseData);
                mostrarMensaje('🎉 ¡Registro exitoso! Ya puedes iniciar sesión.', 'success');
                formulario.reset(); // Limpiar el formulario
                
                // Opcional: Redirigir al login después de un breve retraso
                // setTimeout(() => { window.location.href = '/login.html'; }, 2000); 

            } else if (response.status === 400) {
                // 3.2. ERROR DE VALIDACIÓN (400 Bad Request)
                console.error('Error de validación:', responseData);
                // Si el backend envía un mensaje específico, lo usamos.
                let mensaje = responseData.message || 'Verifique los datos ingresados.';
                
                // Mejor manejo si Spring Boot devuelve errores de campo detallados
                if (responseData.errors && responseData.errors.length > 0) {
                    mensaje = responseData.errors[0].defaultMessage || mensaje;
                }
                
                mostrarMensaje(`⚠️ Error de validación: ${mensaje}`, 'danger');
            
            } else if (response.status === 409) {
                // 3.3. ERROR DE CONFLICTO (409 Conflict - Típicamente DNI o Usuario ya existe)
                mostrarMensaje(`🚨 Error: El usuario, DNI o correo electrónico ya están registrados.`, 'danger');
            
            } else {
                // 3.4. OTROS ERRORES (500 Internal Server Error, etc.)
                console.error('Error al registrar usuario:', response.status, response.statusText);
                mostrarMensaje(`❌ Error del servidor (Código ${response.status}). Intente de nuevo más tarde.`, 'danger');
            }

        } catch (error) {
            // Error de red, servidor no disponible, o bloqueo CORS.
            console.error('Error de conexión:', error);
            mostrarMensaje('⛔️ Error de conexión: Verifique que el backend esté corriendo en http://localhost:8080.', 'danger');
        }
    });
});
