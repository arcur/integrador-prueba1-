// public/js/cuenta.js
// Adaptado de app_sidebar_bootstrap.js

document.addEventListener("DOMContentLoaded", function() {

    // --- Lógica del Tema (Claro/Oscuro) ---
    const themeToggle = document.getElementById('theme-toggle');
    const themeLabel = document.getElementById('theme-label'); // Label para cambiar texto
    const htmlElement = document.documentElement;

    // Función para actualizar icono/texto del botón
    function updateThemeUI(theme) {
        if (theme === 'dark') {
            htmlElement.setAttribute('data-bs-theme', 'dark');
            if(themeLabel) themeLabel.textContent = '☀️ Modo Claro';
            if(themeToggle) themeToggle.checked = false; // Desmarcar si es oscuro
        } else {
            htmlElement.setAttribute('data-bs-theme', 'light');
            if(themeLabel) themeLabel.textContent = '🌙 Modo Oscuro';
            if(themeToggle) themeToggle.checked = true; // Marcar si es claro
        }
    }

    // Cargar tema guardado en localStorage o usar 'light' por defecto
    const savedTheme = localStorage.getItem('theme') || 'light';
    updateThemeUI(savedTheme); // Aplicar tema al cargar

    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            const newTheme = this.checked ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme); // Guardar preferencia
            updateThemeUI(newTheme);
        });
    }

    // --- Marcar Enlace Activo en Sidebar (Simplificado) ---
    // La variable 'currentPage' ya la pasamos desde EJS al sidebar partial
    // y el sidebar partial usa esa variable para añadir la clase 'active'.
    // No necesitamos JS adicional aquí para marcar el enlace activo.

    // --- Eliminar Lógica de Carga del Sidebar ---
    // Ya no hacemos fetch("sidebar.html") porque el sidebar se incluye con EJS.

});

