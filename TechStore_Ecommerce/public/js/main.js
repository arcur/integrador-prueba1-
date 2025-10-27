// public/js/main.js
// (VERSIÓN FINAL COMPLETA - Incluye menú, link activo y fetch carrito con redirección)
/*
document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica Menú Responsive ---
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const navbarList = document.getElementById('navbar-list');

    if (menuToggleBtn && navbarList) {
        menuToggleBtn.addEventListener('click', function() {
            navbarList.classList.toggle('active');
            const icon = menuToggleBtn.querySelector('i');
            if (navbarList.classList.contains('active')) {
                icon.classList.remove('bi-list');
                icon.classList.add('bi-x-lg'); // Usar 'x-lg' para más visibilidad
            } else {
                icon.classList.remove('bi-x-lg');
                icon.classList.add('bi-list');
            }
        });
        // Cerrar menú si se hace clic fuera (opcional pero bueno para UX)
        document.addEventListener('click', function(event) {
            const isClickInsideNav = navbarList.contains(event.target);
            const isClickOnToggle = menuToggleBtn.contains(event.target);
            if (!isClickInsideNav && !isClickOnToggle && navbarList.classList.contains('active')) {
                navbarList.classList.remove('active');
                menuToggleBtn.querySelector('i').classList.remove('bi-x-lg');
                menuToggleBtn.querySelector('i').classList.add('bi-list');
            }
        });
    }

    // --- Lógica Link Activo en Navegación ---
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link'); // Usar selector más general

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        // Marcar como activo si la ruta coincide exactamente
        // O si es la raíz '/' y la ruta actual es '/'
        if (linkPath === currentPath || (linkPath === '/' && currentPath === '/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
        // Excepción: Si estamos en /producto/:id, resaltar /catalogo
        if (currentPath.startsWith('/producto/') && linkPath === '/catalogo') {
             link.classList.add('active');
        }
         // Asegurarse de que Inicio solo esté activo si estamos realmente en Inicio
        if (currentPath !== '/' && linkPath === '/') {
            link.classList.remove('active');
        }
    });

    // ===============================================
    // === LÓGICA PARA AÑADIR AL CARRITO (FETCH) ===
    // ===============================================
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', async function(event) {
            event.preventDefault();

            const productId = this.dataset.productId;
            const originalText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...'; // Mejor feedback

            try {
                const response = await fetch(`/carrito/api/agregar/${productId}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json' // Indicar que esperamos JSON
                    },
                });

                // --- MANEJO DE AUTENTICACIÓN ---
                if (response.status === 401 || response.status === 403) {
                    // El servidor envió "No autorizado"
                    console.warn('Usuario no autenticado, redirigiendo al login...');
                    // Construir URL con mensaje de error (codificado)
                    const loginUrl = '/login?error=' + encodeURIComponent('Debes iniciar sesión para añadir productos.');
                    window.location.href = loginUrl;
                    return; // Detener ejecución
                }
                // --- FIN MANEJO AUTENTICACIÓN ---

                // Si la respuesta no fue 401/403, intentar leerla como JSON
                const result = await response.json();

                if (response.ok && result.success) {
                    // Éxito al añadir
                    console.log('Producto añadido:', result.message);
                    const cartCounter = document.getElementById('cart-item-count');
                    if (cartCounter) {
                        cartCounter.textContent = result.cartItemCount;
                        cartCounter.style.display = result.cartItemCount > 0 ? 'inline-block' : 'none';
                    }
                    this.innerHTML = '<i class="bi bi-check-lg"></i> Añadido';
                    // (Opcional: Mostrar Toast de éxito aquí usando result.message)

                } else {
                    // Error conocido (ej: sin stock, error validación)
                    console.error('Error al añadir (respuesta API):', result.message);
                    this.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Falló'; // Indicar error
                     // (Opcional: Mostrar Toast de error aquí usando result.message)
                }

            } catch (error) {
                  // El servidor envió "No autorizado"
                    console.warn('Usuario no autenticado, redirigiendo al login...');
                    // Construir URL con mensaje de error (codificado)
                    const loginUrl = '/login?error=' + encodeURIComponent('Debes iniciar sesión para añadir productos.');
                    window.location.href = loginUrl;
                    return; // Detener ejecución

            } finally {
                 // Volver al estado original después de un tiempo,
                 // EXCEPTO si redirigimos (por eso el 'return' en 401/403)
                setTimeout(() => {
                    // Comprobar si todavía estamos deshabilitados (por si hubo error rápido)
                    if (this.disabled) {
                         this.innerHTML = originalText;
                         this.disabled = false;
                    }
                }, 2000); // 2 segundos para mostrar feedback
            }
        });
    });

    // (Opcional: Código para Toasts si lo implementas)

}); // Fin del DOMContentLoaded*/


document.addEventListener('DOMContentLoaded', function() {
    // --- Lógica Menú Responsive ---
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    // const navbarList = document.getElementById('navbar-list'); // Ya no seleccionamos la lista UL
    const mainNavbar = document.getElementById('main-navbar'); // <-- SELECCIONAMOS EL CONTENEDOR NAV

    if (menuToggleBtn && mainNavbar) { // <-- Verificamos mainNavbar
        menuToggleBtn.addEventListener('click', function() {
            mainNavbar.classList.toggle('active'); // <-- APLICAMOS ACTIVE AL CONTENEDOR NAV

            // Cambiar icono hamburguesa a X (esto sigue igual)
            const icon = menuToggleBtn.querySelector('i');
            if (mainNavbar.classList.contains('active')) { // <-- Verificamos active en mainNavbar
                icon.classList.remove('bi-list');
                icon.classList.add('bi-x-lg'); // Usar 'x-lg' para más visibilidad
            } else {
                icon.classList.remove('bi-x-lg');
                icon.classList.add('bi-list');
            }
        });
        // Cerrar menú si se hace clic fuera
        document.addEventListener('click', function(event) {
            // Verificar si mainNavbar existe antes de acceder a .contains
             if (mainNavbar) {
                const isClickInsideNav = mainNavbar.contains(event.target);
                // Asegurarse de que menuToggleBtn exista antes de usar .contains
                const isClickOnToggle = menuToggleBtn && menuToggleBtn.contains(event.target);

                if (!isClickInsideNav && !isClickOnToggle && mainNavbar.classList.contains('active')) {
                    mainNavbar.classList.remove('active');
                    // Asegurarse de que el icono exista antes de cambiarlo
                    const icon = menuToggleBtn ? menuToggleBtn.querySelector('i') : null;
                    if (icon) {
                        icon.classList.remove('bi-x-lg');
                        icon.classList.add('bi-list');
                    }
                }
            }
        });
    } else {
        // Log si los elementos no se encuentran (ayuda a depurar si los IDs cambian)
        if (!menuToggleBtn) console.error("Elemento #menu-toggle-btn no encontrado.");
        if (!mainNavbar) console.error("Elemento #main-navbar no encontrado.");
    }

    // --- Lógica Link Activo en Navegación (sin cambios) ---
    const currentPath = window.location.pathname;
    // Seleccionar links DENTRO de #navbar-list para asegurar que son los correctos
    const navLinks = document.querySelectorAll('#navbar-list .nav-link');

    navLinks.forEach(link => {
        const linkPath = link.getAttribute('href');
        if (linkPath === currentPath || (linkPath === '/' && currentPath === '/')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
        if (currentPath.startsWith('/producto/') && linkPath === '/catalogo') {
             link.classList.add('active');
        }
        if (currentPath !== '/' && linkPath === '/') {
            link.classList.remove('active');
        }
    });

    // ===============================================
    // === LÓGICA PARA AÑADIR AL CARRITO (FETCH) ===
    // ===============================================
    document.querySelectorAll('.btn-add-to-cart').forEach(button => {
        button.addEventListener('click', async function(event) {
            event.preventDefault();
            const productId = this.dataset.productId;
            const originalText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';

            try {
                const response = await fetch(`/carrito/api/agregar/${productId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                });

                if (response.status === 401 || response.status === 403) {
                    const loginUrl = '/login?error=' + encodeURIComponent('Debes iniciar sesión para añadir productos.');
                    window.location.href = loginUrl;
                    return;
                }

                // Solo intentar parsear JSON si la respuesta NO fue 401/403
                const result = await response.json();

                if (response.ok && result.success) {
                    const cartCounter = document.getElementById('cart-item-count');
                    if (cartCounter) {
                        cartCounter.textContent = result.cartItemCount;
                        cartCounter.style.display = result.cartItemCount > 0 ? 'inline-block' : 'none';
                    }
                    this.innerHTML = '<i class="bi bi-check-lg"></i> Añadido';
                    // (Opcional: Mostrar Toast de éxito aquí usando result.message)

                } else {
                    console.error('Error al añadir (respuesta API):', result ? result.message : 'Respuesta no JSON');
                    this.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Falló';
                     // (Opcional: Mostrar Toast de error aquí)
                }

            } catch (error) {
                console.error('Error de red o parseo JSON:', error);
                this.innerHTML = '<i class="bi bi-wifi-off"></i> Error Red';
                 // (Opcional: Mostrar Toast de error de red aquí)

            } finally {
                 // Volver al estado original después de un tiempo,
                 // EXCEPTO si redirigimos (por eso el 'return' en 401/403)
                setTimeout(() => {
                    // Comprobar si todavía estamos deshabilitados (por si hubo error rápido)
                    // y si el botón todavía existe en el DOM
                    if (this && this.disabled) {
                         this.innerHTML = originalText;
                         this.disabled = false;
                    }
                }, 2000); // 2 segundos para mostrar feedback
            }
        });
    });

    // (Opcional: Código para Toasts si lo implementas)

}); // Fin del DOMContentLoaded