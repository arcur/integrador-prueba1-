// src/controllers/admin.controller.js
// (VERSIÓN FINAL COMPLETA - Incluye TODO hasta Proveedores)

const Pedido = require('../models/pedido.model');
const Producto = require('../models/producto.model');
const Lote = require('../models/lote.model.js');
const Usuario = require('../models/usuario.model.js');
const Reporte = require('../models/reporte.model.js');
const Proveedor = require('../models/proveedor.model.js'); // Importamos Proveedor
const bcrypt = require('bcryptjs');
const Papa = require('papaparse');
const { format } = require('date-fns');

const adminController = {};

// --- DASHBOARD ---
adminController.mostrarDashboard = async (req, res) => {
    try {
        const [stats, topProductos, ventasDiarias] = await Promise.all([
            Reporte.getEstadisticasPrincipales(),
            Reporte.getTopProductos(),
            Reporte.getVentasUltimos7Dias()
        ]);

        const labelsGrafico = [];
        const dataGrafico = [];
        for (let i = 6; i >= 0; i--) {
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - i);
            const diaString = fecha.toISOString().split('T')[0];
            labelsGrafico.push(`${fecha.getDate()}/${fecha.getMonth() + 1}`);
            const ventaDia = ventasDiarias.find(v => v.dia.toISOString().split('T')[0] === diaString);
            dataGrafico.push(ventaDia ? ventaDia.total_dia : 0);
        }

        res.render('admin/dashboard', {
            title: 'Dashboard - Estadísticas',
            error: req.query.error || null,
            stats: stats,
            topProductos: topProductos,
            grafico: { labels: labelsGrafico, data: dataGrafico }
        });
    } catch (error) {
        console.error('Error al mostrar el dashboard:', error);
        res.status(500).send('Error interno del servidor al cargar dashboard.'); // Mensaje más específico
    }
};

// --- GESTIÓN DE PEDIDOS ---
adminController.mostrarGestionPedidos = async (req, res) => {
    try {
        const pedidos = await Pedido.getAll();
        res.render('admin/gestion_pedidos', {
            title: 'Gestión de Pedidos',
            pedidos: pedidos,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error al mostrar gestión de pedidos:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.mostrarDetallePedido = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Pedido.getDetalleById(id);
        if (!data) {
            return res.redirect('/admin/pedidos?error=Pedido no encontrado.');
        }
        res.render('admin/detalle_pedido', {
            title: `Detalle del Pedido #${id}`,
            pedido: data.pedido,
            detalles: data.detalles
        });
    } catch (error) {
        console.error('Error al mostrar detalle de pedido:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.actualizarEstadoPedido = async (req, res) => {
    const { id } = req.params;
    const { nuevo_estado } = req.body;
    const estadosValidos = ['Pagado', 'Enviado', 'Cancelado', 'Pendiente'];
    if (!estadosValidos.includes(nuevo_estado)) {
        return res.redirect('/admin/pedidos?error=Estado no válido.');
    }
    try {
        await Pedido.updateStatus(id, nuevo_estado);
        res.redirect('/admin/pedidos?success=Estado del pedido actualizado.');
    } catch (error) {
        console.error('Error al actualizar estado de pedido:', error);
        res.redirect('/admin/pedidos?error=Error al actualizar el estado.');
    }
};

// --- GESTIÓN DE PRODUCTOS ---
// --- GESTIÓN DE PRODUCTOS ---
adminController.mostrarGestionProductos = async (req, res) => {
    try {
        // 1. Obtener TODOS los productos (sin filtrar, para los conteos)
        const todosLosProductos = await Producto.getAllForAdmin();

        // 2. Calcular los conteos para las alertas
        const productosSinStock = todosLosProductos.filter(p => p.stock == 0).length;
        const productosBajoStock = todosLosProductos.filter(p => p.stock > 0 && p.stock <= 10).length;

        // 3. Obtener los filtros del query string (para la tabla)
        const { filtro_stock, stock_min, stock_max } = req.query;

        // 4. Filtrar la lista de productos que se va a MOSTRAR
        let productosMostrados = todosLosProductos;

        if (filtro_stock === 'sin_stock') {
            productosMostrados = todosLosProductos.filter(p => p.stock == 0);
        } else if (filtro_stock === 'bajo_stock') {
            productosMostrados = todosLosProductos.filter(p => p.stock > 0 && p.stock <= 10);
        } else if (filtro_stock === 'sobre_stock') {
            // Asumimos 'sobrestock' > 50 unidades (puedes cambiar este valor)
            productosMostrados = todosLosProductos.filter(p => p.stock > 50);
        } else if (filtro_stock === 'rango' && stock_min && stock_max) {
            productosMostrados = todosLosProductos.filter(p => 
                p.stock >= parseInt(stock_min) && p.stock <= parseInt(stock_max)
            );
        }

        // 5. Renderizar la vista
        res.render('admin/gestion_productos', {
            title: 'Gestión de Productos',
            productos: productosMostrados, // <-- Lista filtrada
            
            // Pasamos los nuevos conteos para las alertas
            conteoSinStock: productosSinStock,
            conteoBajoStock: productosBajoStock,

            // Pasamos los filtros actuales para rellenar el formulario
            filtrosActuales: req.query, 
            
            success: req.query.success,
            error: req.query.error,

            // La alerta de 'stockBajo' original ya no la usamos
            stockBajo: [] // Pasamos un array vacío por si acaso
        });
    } catch (error) {
        console.error('Error al mostrar gestión de productos:', error);
        res.status(500).send('Error interno del servidor');
    }
};

adminController.mostrarFormularioProducto = async (req, res) => {
    const { id } = req.params;
    const isEditing = !!id;
    try {
        const [categorias, producto] = await Promise.all([
            Producto.getAllCategories(),
            isEditing ? Producto.getById(id) : null
        ]);
        if (isEditing && !producto) {
            return res.redirect('/admin/productos?error=Producto no encontrado.');
        }
        res.render('admin/form_producto', {
            title: isEditing ? 'Editar Producto' : 'Nuevo Producto',
            producto: producto,
            categorias: categorias,
            isEditing: isEditing,
            error: null
        });
    } catch (error) {
        console.error('Error al mostrar formulario de producto:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.crearProducto = async (req, res) => {
    try {
        const newProductId = await Producto.create(req.body);
        res.redirect(`/admin/productos/${newProductId}/lotes/nuevo?new=true`);
    } catch (error) {
        console.error('Error al crear producto:', error);
        const [categorias] = await Promise.all([ Producto.getAllCategories() ]);
        res.render('admin/form_producto', {
            title: 'Nuevo Producto',
            producto: req.body,
            categorias: categorias,
            isEditing: false,
            error: 'Error al crear el producto. Verifique los datos.'
        });
    }
};
adminController.actualizarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await Producto.update(id, req.body);
        res.redirect('/admin/productos?success=Producto actualizado exitosamente.');
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        const [categorias] = await Promise.all([ Producto.getAllCategories() ]);
        res.render('admin/form_producto', {
            title: 'Editar Producto',
            producto: req.body,
            categorias: categorias,
            isEditing: true,
            error: 'Error al actualizar el producto.'
        });
    }
};
adminController.eliminarProducto = async (req, res) => {
    const { id } = req.params;
    try {
        await Producto.delete(id);
        res.redirect('/admin/productos?success=Producto eliminado exitosamente.');
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        res.redirect(`/admin/productos?error=${encodeURIComponent(error.message)}`);
    }
};

// --- GESTIÓN DE LOTES ---
adminController.mostrarGestionLotes = async (req, res) => {
    const { id } = req.params;
    try {
        const [producto, lotes] = await Promise.all([
            Producto.getById(id),
            Lote.getByProductoId(id)
        ]);
        if (!producto) {
            return res.redirect('/admin/productos?error=Producto no encontrado.');
        }
        res.render('admin/gestion_lotes', {
            title: `Gestión de Lotes`,
            producto: producto,
            lotes: lotes,
            success: req.query.success
        });
    } catch (error) {
        console.error('Error al mostrar lotes:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.mostrarFormularioLote = async (req, res) => {
    const { id_producto } = req.params;
    try {
        const [producto, proveedores] = await Promise.all([
            Producto.getById(id_producto),
            Producto.getAllProviders() // Necesitamos proveedores aquí
        ]);
        if (!producto) {
            return res.redirect('/admin/productos?error=Producto no encontrado.');
        }
        res.render('admin/form_lote', {
            title: 'Añadir Nuevo Lote',
            producto: producto,
            proveedores: proveedores,
            error: null,
            isNewProduct: req.query.new === 'true'
        });
    } catch (error) {
        console.error('Error al mostrar formulario de lote:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.crearLote = async (req, res) => {
    const { id_producto } = req.params;
    try {
        // Validación básica
        if (!req.body.cantidad_recibida || req.body.cantidad_recibida <= 0 || !req.body.precio_compra || req.body.precio_compra <= 0) {
             throw new Error("Cantidad y Precio de Compra deben ser mayores a 0.");
        }
        await Lote.create(id_producto, req.body);
        res.redirect(`/admin/productos/${id_producto}/lotes?success=Lote añadido exitosamente.`);
    } catch (error) {
        console.error('Error al crear lote:', error);
        const [producto, proveedores] = await Promise.all([
            Producto.getById(id_producto),
            Producto.getAllProviders()
        ]);
        res.render('admin/form_lote', {
            title: 'Añadir Nuevo Lote',
            producto: producto,
            proveedores: proveedores,
            error: `Error al guardar el lote: ${error.message}`,
            isNewProduct: false
        });
    }
};

// --- GESTIÓN DE PROVEEDORES ---
adminController.mostrarGestionProveedores = async (req, res) => {
    try {
        const proveedores = await Proveedor.getAll();
        res.render('admin/gestion_proveedores', {
            title: 'Gestión de Proveedores',
            proveedores: proveedores,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error al mostrar gestión de proveedores:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.mostrarFormularioProveedor = async (req, res) => {
    const { id } = req.params;
    const isEditing = !!id;
    try {
        let proveedor = null;
        if (isEditing) {
            proveedor = await Proveedor.getById(id);
            if (!proveedor) {
                return res.redirect('/admin/proveedores?error=Proveedor no encontrado.');
            }
        }
        res.render('admin/form_proveedor', {
            title: isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor',
            proveedor: proveedor,
            isEditing: isEditing,
            errors: []
        });
    } catch (error) {
        console.error('Error al mostrar formulario de proveedor:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.crearProveedor = async (req, res) => {
    const errors = [];
    if (!req.body.nombre_proveedor) { errors.push("El nombre del proveedor es obligatorio."); }
    if (req.body.ruc && !/^[0-9]{11}$/.test(req.body.ruc)) { errors.push("El RUC debe tener 11 dígitos."); }

    if (errors.length > 0) {
        return res.render('admin/form_proveedor', { title: 'Nuevo Proveedor', proveedor: req.body, isEditing: false, errors: errors });
    }
    try {
        await Proveedor.create(req.body);
        res.redirect('/admin/proveedores?success=Proveedor creado exitosamente.');
    } catch (error) {
        console.error('Error al crear proveedor:', error);
        let errorMsg = 'Error al crear el proveedor.';
        if (error.code === 'ER_DUP_ENTRY') { errorMsg = 'El RUC ingresado ya existe.'; }
        res.render('admin/form_proveedor', { title: 'Nuevo Proveedor', proveedor: req.body, isEditing: false, errors: [errorMsg] });
    }
};
adminController.actualizarProveedor = async (req, res) => {
    const { id } = req.params;
    const errors = [];
    if (!req.body.nombre_proveedor) { errors.push("El nombre del proveedor es obligatorio."); }
     if (req.body.ruc && !/^[0-9]{11}$/.test(req.body.ruc)) { errors.push("El RUC debe tener 11 dígitos."); }

    if (errors.length > 0) {
         const proveedorOriginal = await Proveedor.getById(id);
         return res.render('admin/form_proveedor', { title: 'Editar Proveedor', proveedor: { ...proveedorOriginal, ...req.body }, isEditing: true, errors: errors });
    }
    try {
        await Proveedor.update(id, req.body);
        res.redirect('/admin/proveedores?success=Proveedor actualizado exitosamente.');
    } catch (error) {
        console.error('Error al actualizar proveedor:', error);
        let errorMsg = 'Error al actualizar el proveedor.';
         if (error.code === 'ER_DUP_ENTRY') { errorMsg = 'El RUC ingresado ya existe para otro proveedor.'; }
        const proveedorOriginal = await Proveedor.getById(id);
        res.render('admin/form_proveedor', { title: 'Editar Proveedor', proveedor: proveedorOriginal, isEditing: true, errors: [errorMsg] });
    }
};
adminController.eliminarProveedor = async (req, res) => {
    const { id } = req.params;
    try {
        await Proveedor.delete(id);
        res.redirect('/admin/proveedores?success=Proveedor eliminado exitosamente.');
    } catch (error) {
        console.error('Error al eliminar proveedor:', error);
        res.redirect('/admin/proveedores?error=Error al eliminar el proveedor.');
    }
};

// --- GESTIÓN DE CLIENTES ---
adminController.mostrarGestionClientes = async (req, res) => {
    try {
        const [clientes, states] = await Promise.all([
            Usuario.getAllClients(),
            Usuario.getAllStates()
        ]);
        res.render('admin/gestion_clientes', {
            title: 'Gestión de Clientes',
            clientes: clientes,
            states: states,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error al mostrar gestión de clientes:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.actualizarEstadoCliente = async (req, res) => {
    const { id } = req.params;
    const { id_estado } = req.body;
    try {
        await Usuario.updateState(id, id_estado);
        res.redirect('/admin/clientes?success=Estado del cliente actualizado.');
    } catch (error) {
        console.error('Error al actualizar estado de cliente:', error);
        res.redirect('/admin/clientes?error=Error al actualizar el estado.');
    }
};

// --- GESTIÓN DE ADMINISTRADORES ---
adminController.mostrarGestionAdmins = async (req, res) => {
    try {
        const admins = await Usuario.getAllAdmins();
        res.render('admin/gestion_admins', {
            title: 'Gestión de Administradores',
            admins: admins,
            success: req.query.success,
            error: req.query.error
        });
    } catch (error) {
        console.error('Error al mostrar gestión de admins:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.mostrarFormularioAdmin = async (req, res) => {
    const { id } = req.params;
    const isEditing = !!id;
    try {
        const [roles, states, admin] = await Promise.all([
            Usuario.getAdminRoles(),
            Usuario.getAllStates(),
            isEditing ? Usuario.getById(id) : null
        ]);
        if (isEditing && !admin) {
            return res.redirect('/admin/gestion-admins?error=Administrador no encontrado.');
        }
        res.render('admin/form_admin', {
            title: isEditing ? 'Editar Administrador' : 'Nuevo Administrador',
            admin: admin,
            roles: roles,
            states: states,
            isEditing: isEditing,
            errors: []
        });
    } catch (error) {
        console.error('Error al mostrar formulario de admin:', error);
        res.status(500).send('Error interno del servidor');
    }
};
adminController.crearAdmin = async (req, res) => {
    const { contraseña, numero_dni } = req.body;
    const errors = [];
    if (!contraseña || contraseña.length < 6) { errors.push('La contraseña debe tener al menos 6 caracteres.'); }
    if (!/^[0-9]{8}$/.test(numero_dni)) { errors.push('El DNI debe tener 8 números.'); }
    // Añadir validación de correo y usuario si es necesario
    if (errors.length > 0) {
        const [roles, states] = await Promise.all([ Usuario.getAdminRoles(), Usuario.getAllStates() ]);
        return res.render('admin/form_admin', { title: 'Nuevo Administrador', admin: req.body, roles: roles, states: states, isEditing: false, errors: errors });
    }
    try {
        await Usuario.createAdmin(req.body);
        res.redirect('/admin/gestion-admins?success=Administrador creado exitosamente.');
    } catch (error) {
        console.error('Error al crear admin:', error);
        let errorMsg = 'Error al crear el administrador.';
        if (error.code === 'ER_DUP_ENTRY') { errorMsg = 'El DNI, correo o nombre de usuario ya existen.'; }
        const [roles, states] = await Promise.all([ Usuario.getAdminRoles(), Usuario.getAllStates() ]);
        res.render('admin/form_admin', { title: 'Nuevo Administrador', admin: req.body, roles: roles, states: states, isEditing: false, errors: [errorMsg] });
    }
};
adminController.actualizarAdmin = async (req, res) => {
    const { id } = req.params;
    if (id == req.session.user.id_usuario && (req.body.id_estado == 2 || req.body.id_rol != 3)) {
         return res.redirect(`/admin/gestion-admins?error=No puedes cambiar tu propio estado o rol.`);
     }
    try {
        await Usuario.updateAdmin(id, req.body);
        res.redirect('/admin/gestion-admins?success=Administrador actualizado exitosamente.');
    } catch (error) {
        console.error('Error al actualizar admin:', error);
        const [roles, states, admin] = await Promise.all([ Usuario.getAdminRoles(), Usuario.getAllStates(), Usuario.getById(id) ]);
        res.render('admin/form_admin', { title: 'Editar Administrador', admin: admin, roles: roles, states: states, isEditing: true, errors: ['Error al actualizar.'] });
    }
};

// --- REPORTES ---
adminController.mostrarPaginaReportes = (req, res) => {
    res.render('admin/reportes', {
        title: 'Generar Reportes',
        error: req.query.error || null
    });
};
adminController.generarReporte = async (req, res) => {
    const { tipoReporte, fechaInicio, fechaFin } = req.body;
    try {
        let data;
        let filename = `reporte_${tipoReporte}`;
        const timestamp = format(new Date(), 'yyyyMMdd_HHmmss');

        if (tipoReporte === 'inventario') {
            data = await Reporte.getInventarioCompleto();
            filename = `reporte_inventario_${timestamp}.csv`;
        } else if (tipoReporte === 'ventas') {
            if (!fechaInicio || !fechaFin) {
                return res.redirect('/admin/reportes?error=Debe seleccionar fecha de inicio y fin para el reporte de ventas.');
            }
            data = await Reporte.getVentasPorFechas(fechaInicio, fechaFin);
            filename = `reporte_ventas_${fechaInicio}_a_${fechaFin}_${timestamp}.csv`;
        } else {
            return res.redirect('/admin/reportes?error=Tipo de reporte no válido.');
        }

        if (!data || data.length === 0) {
            return res.redirect('/admin/reportes?error=No se encontraron datos para generar el reporte seleccionado.');
        }

        const csv = Papa.unparse(data);

        res.setHeader('Content-Type', 'text/csv; charset=utf-8'); // Añadir charset=utf-8
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`); // Usar comillas por si hay espacios
        
        // BOM (Byte Order Mark) para Excel en español
        const bom = '\ufeff'; 
        res.status(200).send(bom + csv);


    } catch (error) {
        console.error('Error al generar reporte:', error);
        res.redirect('/admin/reportes?error=Ocurrió un error al generar el reporte.');
    }
};


module.exports = adminController;