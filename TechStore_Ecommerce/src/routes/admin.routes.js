// src/routes/admin.routes.js
// (Actualizado con Proveedores)

const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller.js");
const {
  isAuth,
  isAdmin,
  isMainAdmin,
} = require("../middlewares/auth.middleware.js");

// --- PROTECCIÓN DE RUTAS ---
router.use(isAuth);
router.use(isAdmin);

// Middleware para la navegación activa (¡Actualizado!)
router.use((req, res, next) => {
  const path = req.path;
  if (path.startsWith("/reportes")) {
    res.locals.currentPage = "reportes";
  } else if (path.startsWith("/pedidos")) {
    res.locals.currentPage = "pedidos";
  } else if (path.startsWith("/productos") || path.includes("/lotes")) {
    res.locals.currentPage = "productos";
  } else if (path.startsWith("/proveedores")) {
    res.locals.currentPage = "proveedores"; // ¡NUEVO!
  } else if (path.startsWith("/clientes")) {
    res.locals.currentPage = "clientes";
  } else if (path.startsWith("/gestion-admins")) {
    res.locals.currentPage = "admins";
  } else if (path.startsWith("/dashboard")) {
    res.locals.currentPage = "dashboard";
  } else if (path.startsWith("/categorias")) {
    res.locals.currentPage = "categorias"; // NUEVO
  } else if (path.startsWith("/cupones")) {
    res.locals.currentPage = "cupones"; // NUEVO
  } else {
    res.locals.currentPage = "dashboard";
  }
  next();
});

// --- RUTAS DE ADMIN ---

// Dashboard (Estadísticas)
router.get("/dashboard", adminController.mostrarDashboard);

// --- GESTIÓN DE PEDIDOS ---
router.get("/pedidos", adminController.mostrarGestionPedidos);
router.get("/pedidos/detalle/:id", adminController.mostrarDetallePedido);
router.post(
  "/pedidos/actualizar-estado/:id",
  adminController.actualizarEstadoPedido
);

// --- GESTIÓN DE PRODUCTOS (CRUD) ---
router.get("/productos", adminController.mostrarGestionProductos);
router.get("/productos/nuevo", adminController.mostrarFormularioProducto);
router.post("/productos/nuevo", adminController.crearProducto);
router.get("/productos/editar/:id", adminController.mostrarFormularioProducto);
router.post("/productos/editar/:id", adminController.actualizarProducto);
router.get("/productos/eliminar/:id", adminController.eliminarProducto);

// --- GESTIÓN DE LOTES (PEPS) ---
router.get("/productos/:id/lotes", adminController.mostrarGestionLotes);
router.get(
  "/productos/:id_producto/lotes/nuevo",
  adminController.mostrarFormularioLote
);
router.post("/productos/:id_producto/lotes/nuevo", adminController.crearLote);

// ==================================================
// --- GESTIÓN DE PROVEEDORES (¡NUEVO!) ---
// ==================================================
router.get("/proveedores", adminController.mostrarGestionProveedores);
router.get("/proveedores/nuevo", adminController.mostrarFormularioProveedor);
router.post("/proveedores/nuevo", adminController.crearProveedor);
router.get(
  "/proveedores/editar/:id",
  adminController.mostrarFormularioProveedor
);
router.post("/proveedores/editar/:id", adminController.actualizarProveedor);
router.get("/proveedores/eliminar/:id", adminController.eliminarProveedor);

// --- GESTIÓN DE CLIENTES ---
router.get("/clientes", adminController.mostrarGestionClientes);
router.post(
  "/clientes/actualizar-estado/:id",
  adminController.actualizarEstadoCliente
);

// --- GESTIÓN DE ADMINISTRADORES ---
router.get(
  "/gestion-admins",
  isMainAdmin,
  adminController.mostrarGestionAdmins
);
router.get(
  "/gestion-admins/nuevo",
  isMainAdmin,
  adminController.mostrarFormularioAdmin
);
router.post("/gestion-admins/nuevo", isMainAdmin, adminController.crearAdmin);
router.get(
  "/gestion-admins/editar/:id",
  isMainAdmin,
  adminController.mostrarFormularioAdmin
);
router.post(
  "/gestion-admins/editar/:id",
  isMainAdmin,
  adminController.actualizarAdmin
);

// --- REPORTES ---
router.get("/reportes", adminController.mostrarPaginaReportes);
router.post("/reportes/generar", adminController.generarReporte);

// ...
// --- GESTIÓN DE CATEGORÍAS ---
router.get('/categorias', adminController.mostrarGestionCategorias);
router.post('/categorias/nuevo', adminController.crearCategoria);
router.post('/categorias/editar/:id', adminController.editarCategoria);
router.get('/categorias/eliminar/:id', adminController.eliminarCategoria);

// --- GESTIÓN DE CUPONES ---
router.get('/cupones', adminController.mostrarGestionCupones);
router.post('/cupones/nuevo', adminController.crearCupon);
router.get('/cupones/eliminar/:id', adminController.eliminarCupon);

module.exports = router;


