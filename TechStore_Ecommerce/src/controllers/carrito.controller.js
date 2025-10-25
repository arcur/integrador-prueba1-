// src/controllers/carrito.controller.js

const Producto = require('../models/producto.model');
const Carrito = require('../models/carrito.model');

// --- Función Auxiliar para inicializar el carrito ---
// Revisa si el carrito existe en la sesión; si no, lo crea.
function inicializarCarrito(req) {
    if (!req.session.cart) {
        req.session.cart = {
            items: [], // Array de productos { id, nombre, precio, cantidad, imagen }
            total: 0
        };
    }
    return req.session.cart;
}

// --- Función Auxiliar para recalcular el total ---
function recalcularTotal(cart) {
    cart.total = 0;
    cart.items.forEach(item => {
        cart.total += item.precio * item.cantidad;
    });
}

const carritoController = {};

/**
 * Muestra la página del carrito (GET /carrito)
 */
carritoController.mostrarCarrito = (req, res) => {
    const cart = inicializarCarrito(req);
    
    res.render('carrito', {
        title: 'Mi Carrito - TechStore',
        carrito: cart,
        // ¡NUEVO! Pasamos los mensajes de la URL a la vista
        error: req.query.error || null,
        success: req.query.success || null
    });
};

/**
 * Añade un producto al carrito (GET /carrito/agregar/:id)
 */
carritoController.agregarAlCarrito = async (req, res) => {
    // 1. Solo usuarios logueados pueden añadir al carrito
    if (!req.session.user) {
        return res.redirect('/login?error=Debes iniciar sesión para comprar.');
    }
    
    const id_producto = req.params.id;
    const cart = inicializarCarrito(req);

    try {
        // 2. Buscar el producto en la BD (por seguridad)
        const productoDB = await Producto.getById(id_producto);

        if (!productoDB) {
            return res.redirect('/catalogo?error=Producto no encontrado.');
        }

        // 3. Verificar Stock
        if (productoDB.stock <= 0) {
            return res.redirect('/catalogo?error=Producto sin stock.');
        }

        // 4. Lógica del carrito
        const itemExistente = cart.items.find(item => item.id_producto === productoDB.id_producto);

        if (itemExistente) {
            // Si ya está en el carrito, solo incrementa la cantidad (si hay stock)
            if (itemExistente.cantidad < productoDB.stock) {
                itemExistente.cantidad++;
            } else {
                // Si no hay más stock, no se añade
                // (En el futuro, podríamos añadir un mensaje de 'stock máximo alcanzado')
            }
        } else {
            // Si es un producto nuevo, lo añade al array
            cart.items.push({
                id_producto: productoDB.id_producto,
                nombre_producto: productoDB.nombre_producto,
                precio: productoDB.precio,
                imagen: productoDB.imagen,
                cantidad: 1,
                stock_disponible: productoDB.stock // Guardamos el stock para validaciones
            });
        }

        // 5. Recalcular total y redirigir
        recalcularTotal(cart);
        res.redirect('/carrito');

    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        res.status(500).send('Error interno del servidor');
    }
};

/**
 * Elimina un producto del carrito (GET /carrito/eliminar/:id)
 */
carritoController.eliminarDelCarrito = (req, res) => {
    const id_producto = parseInt(req.params.id, 10); // Asegurarse de que sea un número
    const cart = inicializarCarrito(req);

    // Filtramos el array, quitando el producto con el ID correspondiente
    cart.items = cart.items.filter(item => item.id_producto !== id_producto);
    
    recalcularTotal(cart);
    res.redirect('/carrito');
};



/**
 * Actualiza la cantidad (POST /carrito/actualizar) en sesión y BD.
 * (CORREGIDO - Usa sessionCart consistentemente)
 */
carritoController.actualizarCantidad = async (req, res) => {
    const { id_producto, cantidad } = req.body;
    const id = parseInt(id_producto, 10);
    const cant = parseInt(cantidad, 10);
    const dbCartId = req.session.dbCartId;
    
    // --- USA sessionCart aquí ---
    const sessionCart = inicializarCarrito(req); 
    // --- FIN ---

    // --- USA sessionCart aquí ---
    const item = sessionCart.items.find(i => i.id_producto === id);
    // --- FIN ---

    if (!item) {
        req.flash('error_msg', 'Producto no encontrado en el carrito.');
        return res.redirect('/carrito');
    }

    let cantidadFinal = cant;
    let debeEliminarse = false;

    // Validar cantidad y ajustar
    if (cantidadFinal <= 0) {
        cantidadFinal = 0;
        debeEliminarse = true;
    } else if (cantidadFinal > item.stock_disponible) {
        cantidadFinal = item.stock_disponible;
        req.flash('error_msg', `Stock máximo para ${item.nombre_producto} es ${item.stock_disponible}.`);
    }

    // Actualizar/Eliminar en Sesión (Usa sessionCart)
    if (debeEliminarse) {
        sessionCart.items = sessionCart.items.filter(i => i.id_producto !== id);
    } else {
        item.cantidad = cantidadFinal;
    }
    recalcularTotal(sessionCart);

    // Actualizar/Eliminar en BD
    if (dbCartId) {
        try {
            if (debeEliminarse) {
                console.log(`[Update Cart Qty -> Remove] User: ${req.session.user.id_usuario}, DB Cart ID: ${dbCartId}, Product: ${id}`);
                await Carrito.removeItem(dbCartId, id);
            } else {
                console.log(`[Update Cart Qty -> Upsert] User: ${req.session.user.id_usuario}, DB Cart ID: ${dbCartId}, Product: ${id}, New Qty: ${cantidadFinal}`);
                await Carrito.upsertItem(dbCartId, id, cantidadFinal, item.stock_disponible);
            }
        } catch (dbError) {
             console.error(`[Update Cart Qty] DB Error User: ${req.session.user.id_usuario}, Cart: ${dbCartId}, Prod: ${id}:`, dbError);
             req.flash('error_msg', 'Error al guardar cambio en base de datos.');
        }
    }

    res.redirect('/carrito');
};

// ... (resto de funciones y module.exports) ...
carritoController.agregarAlCarritoAPI = async (req, res) => {
    // isAuth ya verificó que el usuario está logueado
    const id_producto = parseInt(req.params.id, 10); // Asegurar que sea número
    const cart = inicializarCarrito(req);

    try {
        const productoDB = await Producto.getById(id_producto);

        if (!productoDB) {
            return res.status(404).json({ success: false, message: 'Producto no encontrado.' });
        }
        if (productoDB.stock <= 0) {
             return res.status(400).json({ success: false, message: 'Producto sin stock.' });
        }

        const itemExistente = cart.items.find(item => item.id_producto === productoDB.id_producto);
        let addedNew = false; // Bandera para saber si se añadió uno nuevo o se incrementó

        if (itemExistente) {
            // Solo incrementa si hay stock
            if (itemExistente.cantidad < productoDB.stock) {
                itemExistente.cantidad++;
            } else {
                 return res.status(400).json({ success: false, message: 'No hay más stock disponible para este producto.' });
            }
        } else {
            // Añade nuevo item
            cart.items.push({
                id_producto: productoDB.id_producto,
                nombre_producto: productoDB.nombre_producto,
                precio: productoDB.precio,
                imagen: productoDB.imagen,
                cantidad: 1,
                stock_disponible: productoDB.stock
            });
            addedNew = true;
        }

        recalcularTotal(cart);

        // Respondemos con éxito y la nueva cantidad de items únicos en el carrito
        res.status(200).json({
            success: true,
            message: `${productoDB.nombre_producto} añadido al carrito.`,
            cartItemCount: cart.items.length // Cantidad de items únicos
            // Podríamos enviar más datos si fueran necesarios (ej: total del carrito)
        });

    } catch (error) {
        console.error('Error API al agregar al carrito:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
};
module.exports = carritoController;