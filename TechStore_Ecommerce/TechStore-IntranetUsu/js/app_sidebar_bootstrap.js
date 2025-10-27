// js/app_sidebar_bootstrap.js

document.addEventListener("DOMContentLoaded", function() {
    
    // --- Lógica del Tema (Claro/Oscuro) ---
    const themeToggle = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-bs-theme', savedTheme);
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'light';
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', function() {
            if (this.checked) {
                htmlElement.setAttribute('data-bs-theme', 'light');
                localStorage.setItem('theme', 'light');
            } else {
                htmlElement.setAttribute('data-bs-theme', 'dark');
                localStorage.setItem('theme', 'dark');
            }
        });
    }

    // --- Cargar Sidebar y Marcar Enlace Activo ---
    fetch("sidebar.html")
        .then(response => response.ok ? response.text() : Promise.reject('No se pudo cargar el sidebar.'))
        .then(data => {
            const placeholder = document.getElementById("sidebar-placeholder");
            if (placeholder) {
                placeholder.innerHTML = data;
                
                // Marcar enlace activo
                const currentPage = window.location.pathname.split("/").pop() || "intranet_usu.html";
                const sidebarLinks = placeholder.querySelectorAll(".nav-link");
                
                sidebarLinks.forEach(link => {
                    if (link.getAttribute("href") === currentPage) {
                        link.classList.add("active");
                    }
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar el sidebar:", error);
            const placeholder = document.getElementById("sidebar-placeholder");
            if (placeholder) {
                placeholder.innerHTML = "<p class='text-danger p-3'>Error al cargar menú.</p>";
            }
        });
});