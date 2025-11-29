// src/controllers/intranet.controller.js

// 1. Importamos los Modelos que SÍ tenemos
const Pedido = require("../models/pedido.model");
const Usuario = require("../models/usuario.model");
const Favorito = require("../models/favorito.model");
const Tarjeta = require("../models/tarjeta.model");
const bcrypt = require("bcryptjs"); // <-- ¡Importa bcrypt!
const Direccion = require('../models/direccion.model'); // <-- AÑADIR

const intranetController = {};

// Esta función es la que se encarga de renderizar la página
// y pasarle los datos dinámicos (como 'user')
const renderIntranetView = async (
  req,
  res,
  viewName,
  title,
  pageKey,
  data = {}
) => {
  try {
    const id_usuario = req.session.user.id_usuario;

    const datosUsuario = await Usuario.getById(id_usuario);

    res.render(viewName, {
      title: `${title} - Mi Cuenta`,
      user: req.session.user,
      datosUsuario: datosUsuario,
      currentPage: pageKey, // <-- ¡AQUÍ ESTÁ LA MAGIA!
      ...data,
    });
  } catch (error) {
    console.error(`Error al renderizar la vista ${viewName}:`, error);
    req.flash("error_msg", "Error al cargar la página.");
    res.redirect("/");
  }
};


// (GET /intranet/dashboard)
intranetController.mostrarDashboard = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;

        // 1. Ejecutamos todas las consultas en paralelo para ser eficientes
        const [pedidos, favoritos, tarjetas] = await Promise.all([
            Pedido.findByUsuarioId(id_usuario),
            Favorito.findByUsuarioId(id_usuario),
            Tarjeta.findByUsuarioId(id_usuario)
        ]);

        // 2. Procesar Datos de Pedidos
        const ultimoPedido = pedidos.length > 0 ? pedidos[0] : null; // El primero es el más reciente
        const totalPedidos = pedidos.length;
        
        // Calcular total gastado (Solo sumamos pedidos pagados o enviados para ser realistas)
        const totalGastado = pedidos
            .filter(p => ['Pagado', 'Enviado', 'Entregado'].includes(p.estado))
            .reduce((acc, curr) => acc + parseFloat(curr.total), 0);

        // 3. Procesar Datos de Favoritos (Tomamos los 2 más recientes)
        const favoritosRecientes = favoritos.slice(0, 2);

        // 4. Procesar Tarjeta (Tomamos la primera, que por query es la predeterminada)
        const tarjetaPrincipal = tarjetas.length > 0 ? tarjetas[0] : null;

        // 5. Renderizar con datos reales
        renderIntranetView(req, res, 'intranet_dashboard', 'Dashboard', 'dashboard', {
            resumen: {
                ultimoPedido,
                totalPedidos,
                totalGastado,
                favoritosRecientes,
                tarjetaPrincipal
            }
        });

    } catch (error) {
        console.error('Error al cargar dashboard:', error);
        // Si falla algo, mostramos el dashboard vacío pero funcional para no bloquear al usuario
        renderIntranetView(req, res, 'intranet_dashboard', 'Dashboard', 'dashboard', {
            resumen: { 
                ultimoPedido: null, totalPedidos: 0, totalGastado: 0, 
                favoritosRecientes: [], tarjetaPrincipal: null 
            }
        });
    }
};

// (GET /intranet/mis-pedidos)
intranetController.mostrarMisPedidos = async (req, res) => {
  // ¡Usamos la nueva función!
  const misPedidos = await Pedido.findByUsuarioId(req.session.user.id_usuario);

  renderIntranetView(
    req,
    res,
    "intranet_mis_pedidos",
    "Mis Pedidos",
    "pedidos",
    {
      pedidos: misPedidos, // <-- ¡Ahora pasamos los datos reales!
    }
  );
};

// (GET /intranet/configuracion)
intranetController.mostrarConfiguracion = async (req, res) => {
    try {
        // Buscamos las direcciones reales
        const direcciones = await Direccion.findByUsuarioId(req.session.user.id_usuario);

        renderIntranetView(req, res, 'intranet_configuracion', 'Configuración', 'configuracion', {
            direcciones: direcciones // <-- Pasamos las direcciones a la vista
        });
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al cargar configuraciones.');
        res.redirect('/intranet/dashboard');
    }
};

// (GET /intranet/mis-favoritos)
intranetController.mostrarMisFavoritos = async (req, res) => {
  // ¡Usamos la nueva función!
  const misFavoritos = await Favorito.findByUsuarioId(
    req.session.user.id_usuario
  );

  renderIntranetView(
    req,
    res,
    "intranet_mis_favoritos",
    "Mis Favoritos",
    "favoritos",
    {
      favoritos: misFavoritos, // <-- ¡Pasamos los datos reales!
    }
  );
};

// (GET /intranet/mis-tarjetas)
intranetController.mostrarMisTarjetas = async (req, res) => {
  // ¡Usamos la nueva función!
  const misTarjetas = await Tarjeta.findByUsuarioId(
    req.session.user.id_usuario
  );

  renderIntranetView(
    req,
    res,
    "intranet_mis_tarjetas",
    "Mis Tarjetas",
    "tarjetas",
    {
      tarjetas: misTarjetas, // <-- ¡Pasamos los datos reales!
    }
  );
};

// (POST /intranet/configuracion/actualizar-datos)
intranetController.actualizarDatos = async (req, res) => {
  try {
    const id_usuario = req.session.user.id_usuario;
    // Obtenemos solo los campos que permitimos cambiar
    const { nombre, apellido_paterno, apellido_materno, telefono } = req.body;

    // (Aquí iría la validación de datos, similar a como hiciste en el registro)

    // Llamamos a una nueva función en el modelo
    await Usuario.updateProfileData(id_usuario, {
      nombre,
      apellido_paterno,
      apellido_materno,
      telefono,
    });

    req.flash("success_msg", "Datos actualizados correctamente.");
    res.redirect("/intranet/configuracion");
  } catch (error) {
    console.error("Error al actualizar datos:", error);
    req.flash("error_msg", "Error al actualizar los datos.");
    res.redirect("/intranet/configuracion");
  }
};

// (POST /intranet/configuracion/cambiar-password)
intranetController.cambiarPassword = async (req, res) => {
  try {
    const id_usuario = req.session.user.id_usuario;
    const { passCurrent, passNew, passConfirm } = req.body;

    // 1. Validar que la nueva contraseña coincida
    if (passNew !== passConfirm) {
      req.flash("error_msg", "Las nuevas contraseñas no coinciden.");
      return res.redirect("/intranet/configuracion");
    }
    if (passNew.length < 6) {
      req.flash(
        "error_msg",
        "La nueva contraseña debe tener al menos 6 caracteres."
      );
      return res.redirect("/intranet/configuracion");
    }

    // 2. Obtener el usuario (para la contraseña actual)
    const usuario = await Usuario.getById(id_usuario);

    // 3. Validar contraseña actual
    const isMatch = await bcrypt.compare(passCurrent, usuario.contraseña);
    if (!isMatch) {
      req.flash("error_msg", "La contraseña actual es incorrecta.");
      return res.redirect("/intranet/configuracion");
    }

    // 4. Encriptar y guardar nueva contraseña
    await Usuario.updatePassword(id_usuario, passNew); // Necesitamos crear esta función

    req.flash("success_msg", "Contraseña cambiada exitosamente.");
    res.redirect("/intranet/configuracion");
  } catch (error) {
    console.error("Error al cambiar contraseña:", error);
    req.flash("error_msg", "Error al cambiar la contraseña.");
    res.redirect("/intranet/configuracion");
  }
};

// (GET /intranet/mis-pedidos/:id)
intranetController.mostrarDetallePedido = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.session.user.id_usuario;

   
    // 1. Buscamos el pedido
    const data = await Pedido.getDetalleById(id);
    const datosUsuario = await Usuario.getById(id_usuario);

    // 3. ¡Seguridad! Verificar que el pedido sea del usuario
    if (!data) {
      console.error("DEBUG: ¡Error! No se encontró el pedido (data es null).");
      req.flash("error_msg", "Pedido no encontrado.");
      return res.redirect("/intranet/mis_pedidos");
    }

    console.log("ID del Dueño (Pedido BD):", data.pedido.id_usuario);

    if (data.pedido.id_usuario !== id_usuario) {
      console.error("DEBUG: ¡Error de Seguridad! Los IDs no coinciden.");
      req.flash("error_msg", "Pedido no encontrado o no te pertenece.");
      return res.redirect("/intranet/mis_pedidos");
    }

    
    // 4. Renderizar la NUEVA vista del cliente
    res.render("intranet_detalle_pedido", {
      title: `Detalle del Pedido #${id}`,
      pedido: data.pedido,
      detalles: data.detalles,

      user: req.session.user,
      datosUsuario: datosUsuario,
      currentPage: "pedidos",
    });
  } catch (error) {
    console.error(
      "Error CATCH al mostrar detalle de pedido (intranet):",
      error
    ); // <--- LOG DE ERROR CATCH
    req.flash("error_msg", "Error al cargar el detalle.");
    res.redirect("/intranet/mis_pedidos");
  }
};

intranetController.agregarTarjeta = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;
        const { numero_tarjeta, fecha_expiracion, nombre_titular, es_predeterminada } = req.body;

        // 1. Validaciones Simples
        if (!numero_tarjeta || numero_tarjeta.length < 13) {
            req.flash('error_msg', 'Número de tarjeta inválido.');
            return res.redirect('/intranet/mis_tarjetas');
        }

        // 2. Procesar Datos (Simulación de seguridad)
        const ultimos_cuatro = numero_tarjeta.slice(-4); // Extraer últimos 4
        let tipo = 'Desconocido';
        
        // Detección simple de tipo
        if (numero_tarjeta.startsWith('4')) tipo = 'Visa';
        else if (numero_tarjeta.startsWith('5')) tipo = 'Mastercard';
        else if (numero_tarjeta.startsWith('3')) tipo = 'Amex';

        // 3. Guardar en BD
        await Tarjeta.create(id_usuario, {
            nombre_titular,
            ultimos_cuatro_digitos: ultimos_cuatro,
            fecha_expiracion,
            tipo_tarjeta: tipo,
            es_predeterminada: es_predeterminada === 'on' // El checkbox envía 'on' si está marcado
        });

        req.flash('success_msg', 'Tarjeta agregada exitosamente.');
        res.redirect('/intranet/mis_tarjetas');

    } catch (error) {
        console.error('Error al agregar tarjeta:', error);
        req.flash('error_msg', 'Error al guardar la tarjeta.');
        res.redirect('/intranet/mis_tarjetas');
    }
};

// (GET /intranet/mis_tarjetas/eliminar/:id)
intranetController.eliminarTarjeta = async (req, res) => {
    try {
        const { id } = req.params; // ID de la tarjeta
        const id_usuario = req.session.user.id_usuario;

        const result = await Tarjeta.delete(id, id_usuario);

        if (result > 0) {
            req.flash('success_msg', 'Tarjeta eliminada.');
        } else {
            req.flash('error_msg', 'No se pudo eliminar la tarjeta.');
        }
        res.redirect('/intranet/mis_tarjetas');

    } catch (error) {
        console.error('Error al eliminar tarjeta:', error);
        req.flash('error_msg', 'Error interno al eliminar.');
        res.redirect('/intranet/mis_tarjetas');
    }
};


// (POST /intranet/direcciones/agregar)
intranetController.agregarDireccion = async (req, res) => {
    try {
        const id_usuario = req.session.user.id_usuario;
        const { direccion, referencia, ciudad, es_predeterminada } = req.body;

        await Direccion.create(id_usuario, {
            direccion,
            referencia,
            ciudad,
            es_predeterminada: es_predeterminada === 'on'
        });

        req.flash('success_msg', 'Dirección agregada correctamente.');
        res.redirect('/intranet/configuracion');
    } catch (error) {
        console.error("Error al agregar dirección:", error);
        req.flash('error_msg', 'No se pudo guardar la dirección.');
        res.redirect('/intranet/configuracion');
    }
};

// (GET /intranet/direcciones/eliminar/:id)
intranetController.eliminarDireccion = async (req, res) => {
    try {
        const { id } = req.params;
        const id_usuario = req.session.user.id_usuario;
        await Direccion.delete(id, id_usuario);
        req.flash('success_msg', 'Dirección eliminada.');
        res.redirect('/intranet/configuracion');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Error al eliminar.');
        res.redirect('/intranet/configuracion');
    }
};

module.exports = intranetController;
