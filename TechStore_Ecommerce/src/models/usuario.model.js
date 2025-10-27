// src/models/usuario.model.js
// (ACTUALIZADO con Gestión de Clientes y updatePassword)

const pool = require('./db');
const bcrypt = require('bcryptjs');

const Usuario = {};

/**
 * Modelo para crear un nuevo usuario (Registro PÚBLICO).
 */
Usuario.create = async (newUser) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.contraseña, salt);
    // Asignar rol 'Cliente' (ID 1) y estado 'Activo' (ID 1) por defecto
    const sql = `
        INSERT INTO usuario (
            id_rol, id_estado, nombre, apellido_paterno, apellido_materno,
            numero_dni, telefono, correo, usuario, contraseña
        ) VALUES (1, 1, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        newUser.nombre, newUser.apellido_paterno, newUser.apellido_materno,
        newUser.numero_dni, newUser.telefono, newUser.correo,
        newUser.usuario, hash
    ]);
    return result.insertId;
};

/**
 * Modelo para buscar un usuario por su 'usuario' O 'correo'.
 * Usado por UserDetailsServiceImpl para el login.
 */
Usuario.findByUsernameOrEmail = async (loginIdentifier) => {
    const sql = `
        SELECT
            u.id_usuario, u.nombre, u.usuario, u.contraseña,
            r.nombre_rol AS rol, e.nombre_estado AS estado
        FROM usuario u
        JOIN rol r ON u.id_rol = r.id_rol
        JOIN estado e ON u.id_estado = e.id_estado
        WHERE (u.usuario = ? OR u.correo = ?)
    `; // Busca en ambas columnas
    const [rows] = await pool.query(sql, [loginIdentifier, loginIdentifier]);
    return rows[0]; // Devuelve el primero que coincida o undefined
};

/**
 * Modelo para buscar un usuario por su 'usuario' (DEPRECATED - usar findByUsernameOrEmail).
 */
Usuario.findByUsername = async (username) => {
     console.warn("DEPRECATED: Usar findByUsernameOrEmail en lugar de findByUsername");
     return Usuario.findByUsernameOrEmail(username); // Llamar a la función unificada
};


/**
 * Modelo para crear un nuevo usuario ADMIN (desde el panel de admin).
 */
Usuario.createAdmin = async (newAdmin) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newAdmin.contraseña, salt);
    const sql = `
        INSERT INTO usuario (
            id_rol, id_estado, nombre, apellido_paterno, apellido_materno,
            numero_dni, telefono, correo, usuario, contraseña
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
        newAdmin.id_rol, newAdmin.id_estado, newAdmin.nombre,
        newAdmin.apellido_paterno, newAdmin.apellido_materno,
        newAdmin.numero_dni, newAdmin.telefono, newAdmin.correo,
        newAdmin.usuario, hash
    ]);
    return result.insertId;
};

/**
 * Modelo para obtener TODOS los administradores (Admins y MainAdmins).
 */
Usuario.getAllAdmins = async () => {
    const sql = `
        SELECT
            u.id_usuario, u.codigo_usuario, u.nombre, u.apellido_paterno,
            u.correo, u.usuario, r.nombre_rol, e.nombre_estado, u.id_rol, u.id_estado
        FROM usuario u
        JOIN rol r ON u.id_rol = r.id_rol
        JOIN estado e ON u.id_estado = e.id_estado
        WHERE u.id_rol IN (2, 3) -- ID de Admin y MainAdmin
        ORDER BY u.nombre ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Modelo para obtener TODOS los Clientes (Rol ID 1).
 */
Usuario.getAllClients = async () => {
    const sql = `
        SELECT
            u.id_usuario, u.codigo_usuario, u.nombre, u.apellido_paterno,
            u.correo, u.numero_dni, e.nombre_estado, e.id_estado
        FROM usuario u
        JOIN estado e ON u.id_estado = e.id_estado
        WHERE u.id_rol = 1 -- Solo Clientes
        ORDER BY u.nombre ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Modelo para obtener un usuario por ID (para editar admin, perfil, etc.).
 * Incluye TODO, hasta la contraseña hash.
 */
Usuario.getById = async (id_usuario) => {
    const sql = `SELECT * FROM usuario WHERE id_usuario = ?`;
    const [rows] = await pool.query(sql, [id_usuario]);
    return rows[0];
};

/**
 * Modelo para actualizar Rol y Estado de un admin (usado por AdminController).
 */
Usuario.updateAdmin = async (id_usuario, data) => {
    const sql = `
        UPDATE usuario
        SET id_rol = ?, id_estado = ?
        WHERE id_usuario = ?
    `;
    const [result] = await pool.query(sql, [
        data.id_rol, data.id_estado, id_usuario
    ]);
    return result.affectedRows;
};

/**
 * Modelo para actualizar solo el ESTADO de un usuario (para Clientes).
 */
Usuario.updateState = async (id_usuario, id_estado) => {
    const sql = `UPDATE usuario SET id_estado = ? WHERE id_usuario = ?`;
    const [result] = await pool.query(sql, [id_estado, id_usuario]);
    return result.affectedRows;
};

/**
 * Modelo para obtener los roles de Admin y MainAdmin (para el formulario de admin).
 */
Usuario.getAdminRoles = async () => {
    const sql = `SELECT * FROM rol WHERE id_rol IN (2, 3)`;
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Modelo para obtener TODOS los estados (Activo/Inactivo).
 */
Usuario.getAllStates = async () => {
    const sql = `SELECT * FROM estado`;
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Obtener detalles del perfil de un usuario por ID (para "Mi Cuenta").
 * Excluye la contraseña.
 */
Usuario.getProfileById = async (id_usuario) => {
    const sql = `
        SELECT
            u.id_usuario, u.codigo_usuario, u.nombre, u.apellido_paterno, u.apellido_materno,
            u.numero_dni, u.telefono, u.correo, u.usuario, u.fecha_registro,
            r.nombre_rol, e.nombre_estado, u.id_rol, u.id_estado
        FROM usuario u
        JOIN rol r ON u.id_rol = r.id_rol
        JOIN estado e ON u.id_estado = e.id_estado
        WHERE u.id_usuario = ?
    `;
    const [rows] = await pool.query(sql, [id_usuario]);
    return rows[0];
};


/**
 * Actualiza los datos del perfil de un usuario (Cliente).
 * Verifica duplicados de correo y usuario si se cambian.
 */
Usuario.updateProfile = async (id_usuario, profileData) => {
    const currentUser = await Usuario.getById(id_usuario);
    if (!currentUser) throw new Error('Usuario no encontrado.');

    const fieldsToUpdate = {};
    const params = [];

    // Campos siempre actualizables
    fieldsToUpdate.nombre = profileData.nombre;
    fieldsToUpdate.apellido_paterno = profileData.apellido_paterno;
    fieldsToUpdate.apellido_materno = profileData.apellido_materno;
    fieldsToUpdate.telefono = profileData.telefono || null;

    // Verificar correo SOLO si ha cambiado
    if (profileData.correo && profileData.correo !== currentUser.correo) {
        const [existingEmail] = await pool.query(
            'SELECT id_usuario FROM usuario WHERE correo = ? AND id_usuario != ?',
            [profileData.correo, id_usuario]
        );
        if (existingEmail.length > 0) throw new Error('El correo electrónico ingresado ya está en uso.');
        fieldsToUpdate.correo = profileData.correo;
    }

    // Verificar usuario SOLO si ha cambiado
    if (profileData.usuario && profileData.usuario !== currentUser.usuario) {
        const [existingUsername] = await pool.query(
            'SELECT id_usuario FROM usuario WHERE usuario = ? AND id_usuario != ?',
            [profileData.usuario, id_usuario]
        );
        if (existingUsername.length > 0) throw new Error('El nombre de usuario ingresado ya está en uso.');
        fieldsToUpdate.usuario = profileData.usuario;
    }

    const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`);
    if (setClauses.length === 0) return 0; // No hay nada que actualizar

    params.push(...Object.values(fieldsToUpdate));
    params.push(id_usuario);

    const sql = `UPDATE usuario SET ${setClauses.join(', ')} WHERE id_usuario = ?`;
    const [result] = await pool.query(sql, params);
    return result.affectedRows;
};

// --- ¡NUEVO MÉTODO PARA ACTUALIZAR CONTRASEÑA! ---
/**
 * Actualiza únicamente la contraseña (hasheada) de un usuario.
 * @param {number} id_usuario - ID del usuario a actualizar.
 * @param {string} hashedPassword - La NUEVA contraseña YA HASHEADA.
 */
Usuario.updatePassword = async (id_usuario, hashedPassword) => {
    const sql = `UPDATE usuario SET contraseña = ? WHERE id_usuario = ?`;
    const [result] = await pool.query(sql, [hashedPassword, id_usuario]);
    return result.affectedRows; // Devuelve 1 si se actualizó, 0 si no
};


module.exports = Usuario;
