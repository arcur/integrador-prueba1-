// server.js

// 1. Importar Módulos
require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash'); // <-- *** 1. ADD THIS IMPORT ***

// (Importaciones de tus Routers...)

// 2. Inicializar la App
const app = express();
const port = process.env.APP_PORT || 3000;

// 3. Configuración de Middlewares (Software intermedio)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de Sesiones (PRIMERO)
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Cambiar a 'true' si usas HTTPS
}));

// Configuración de Connect-Flash (DESPUÉS de session)
app.use(flash()); // <-- *** 2. ADD THIS MIDDLEWARE INITIALIZATION ***

// Middleware para pasar datos a las vistas (DESPUÉS de flash)
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.cart = req.session.cart || null; // Pasar carrito
    // Ahora req.flash EXISTE porque app.use(flash()) ya se ejecutó
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    next();
});


// 4. Configuración del Motor de Vistas (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// 5. Configuración de Archivos Estáticos (Public)
// Aquí le decimos a Express que la carpeta 'public' contiene CSS, JS, e imágenes
app.use(express.static(path.join(__dirname, 'public')));

// 6. Rutas

// 6. Rutas

// Importaciones de las rutas
const mainRouter = require('./src/routes/main.routes');
const catalogoRouter = require('./src/routes/catalogo.routes.js');
const authRouter = require('./src/routes/auth.routes.js');
const carritoRouter = require('./src/routes/carrito.routes.js'); 
const pedidoRouter = require('./src/routes/pedido.routes.js');
const adminRouter = require('./src/routes/admin.routes.js');
const productoRouter = require('./src/routes/producto.routes.js');
// Rutas principales
app.use('/', mainRouter);

// Rutas del catálogo
app.use('/catalogo', catalogoRouter);

// Rutas de Autenticación
app.use('/', authRouter);

app.use('/carrito', carritoRouter);

// Rutas de Pedido (Checkout)
app.use('/pedido', pedidoRouter); 

// ... (app.use para main, catalogo, auth, carrito, pedido) ...

// Rutas de Producto Individual
app.use('/producto', productoRouter); // <-- AÑADE ESTA LÍNEA


// ... (resto de server.js) ...
// --- RUTAS DE ADMINISTRACIÓN ---
// Todas las rutas aquí dentro estarán prefijadas con /admin
app.use('/admin', adminRouter); // <-- AÑADE ESTA LÍNEA

// 7. Iniciar el Servidor
app.listen(port, () => {
    console.log(`🚀 Servidor TechStore corriendo en http://localhost:${port}`);
});