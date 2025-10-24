// src/middlewares/auth.middleware.js
// (ACTUALIZADO para manejar API requests)

const middleware = {};

/**
 * Middleware para verificar si un usuario ha iniciado sesión.
 * - Para páginas normales: Redirige al login.
 * - Para rutas API (/api/...): Envía error 401.
 */
middleware.isAuth = (req, res, next) => {
    if (req.session.user) {
        // Usuario logueado, continuar
        return next();
    }

    // --- Usuario NO logueado ---
    // Verificar si es una solicitud API
    if (req.originalUrl.startsWith('/api/') || (req.headers.accept && req.headers.accept.includes('application/json'))) {
        // Es una API request, devolver error 401 (No Autorizado)
         // console.log('API access denied - sending 401'); // Log para depurar
         return res.status(401).json({ success: false, message: 'Autenticación requerida.' });
    } else {
        // Es una página normal, redirigir al login con mensaje flash
        // console.log('Page access denied - redirecting to login'); // Log para depurar
        req.flash('error_msg', 'Debes iniciar sesión para ver esta página.');
        return res.redirect('/login');
    }
};

/**
 * Middleware para verificar si el usuario es Admin o MainAdmin.
 * (Sin cambios)
 */
middleware.isAdmin = (req, res, next) => {
    if (!req.session.user) { return res.redirect('/login?error=Acceso denegado.'); }
    const { rol } = req.session.user;
    if (rol === 'Admin' || rol === 'MainAdmin') { return next(); }
    res.redirect('/');
};

/**
 * Middleware para verificar si el usuario es SOLO MainAdmin.
 * (Sin cambios)
 */
middleware.isMainAdmin = (req, res, next) => {
    if (req.session.user.rol === 'MainAdmin') { return next(); }
    req.flash('error_msg', 'No tienes permisos para acceder a esta sección.'); // Usar flash
    res.redirect('/admin/dashboard');
};

module.exports = middleware;