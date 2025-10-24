// public/js/accessibility.js
// (CORREGIDO y con RANGO DE FUENTE AMPLIADO)

document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores (Verificar que coincidan con los IDs del HTML) ---
    const themeToggleButton = document.getElementById('btn-toggle-theme');
    const themeIcon = document.getElementById('theme-icon');
    const htmlElement = document.documentElement;
    
    const increaseFontButton = document.getElementById('btn-increase-font');
    const decreaseFontButton = document.getElementById('btn-decrease-font');
    const bodyElement = document.body;

    // --- LÓGICA DE TEMA OSCURO/CLARO ---
    if (themeToggleButton && themeIcon && htmlElement) {
        // Cargar tema guardado en localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        htmlElement.setAttribute('data-bs-theme', savedTheme);
        updateThemeIcon(savedTheme); // Asegura que el icono sea correcto al cargar

        themeToggleButton.addEventListener('click', () => {
            let currentTheme = htmlElement.getAttribute('data-bs-theme');
            let newTheme = currentTheme === 'light' ? 'dark' : 'light';
            
            htmlElement.setAttribute('data-bs-theme', newTheme);
            localStorage.setItem('theme', newTheme); // Guardar preferencia
            updateThemeIcon(newTheme);
        });

        function updateThemeIcon(theme) {
            if (theme === 'dark') {
                themeIcon.className = 'bi bi-sun-fill'; // Pone icono de sol
            } else {
                themeIcon.className = 'bi bi-moon-fill'; // Pone icono de luna
            }
        }
    } else {
        console.error("Error: No se encontraron los elementos para el control de tema.");
    }

    // --- LÓGICA DE TAMAÑO DE FUENTE ---
    if (increaseFontButton && decreaseFontButton && bodyElement) {
        const FONT_STEP = 1; // Incremento en píxeles
        const MIN_FONT_SIZE = 14;
        const MAX_FONT_SIZE = 24; // <-- AUMENTADO (antes 20)

        // Cargar tamaño guardado
        let currentFontSize = parseInt(localStorage.getItem('font-size') || '16'); // Default 16px
        updateFontSize(); // Aplicar tamaño al cargar

        increaseFontButton.addEventListener('click', () => {
            if (currentFontSize < MAX_FONT_SIZE) {
                currentFontSize += FONT_STEP;
                updateFontSize();
            }
        });

        decreaseFontButton.addEventListener('click', () => {
            if (currentFontSize > MIN_FONT_SIZE) {
                currentFontSize -= FONT_STEP;
                updateFontSize();
            }
        });

        function updateFontSize() {
            bodyElement.style.fontSize = `${currentFontSize}px`;
            localStorage.setItem('font-size', currentFontSize); // Guardar preferencia
        }
    } else {
        console.error("Error: No se encontraron los elementos para el control de fuente.");
    }
});