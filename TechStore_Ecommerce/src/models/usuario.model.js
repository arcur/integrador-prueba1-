// src/models/usuario.model.js
// (ACTUALIZADO con Gestión de Clientes)

const pool = require('./db');
const bcrypt = require('bcryptjs');

const Usuario = {};

/**
 * Modelo para crear un nuevo usuario (Registro PÚBLICO).
 * (Sin cambios)
 */
Usuario.create = async (newUser) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(newUser.contraseña, salt);
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
 * Modelo para buscar un usuario por su 'usuario' (para Login).
 * (Sin cambios)
 */
Usuario.findByUsername = async (username) => {
    const sql = `
        SELECT 
            u.id_usuario, u.nombre, u.usuario, u.contraseña,
            r.nombre_rol AS rol, e.nombre_estado AS estado
        FROM usuario u
        JOIN rol r ON u.id_rol = r.id_rol
        JOIN estado e ON u.id_estado = e.id_estado
        WHERE u.usuario = ?
    `;
    const [rows] = await pool.query(sql, [username]);
    return rows[0]; 
};

/**
 * Modelo para crear un nuevo usuario (Registro de ADMIN).
 * (Sin cambios)
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
 * (Sin cambios)
 */
Usuario.getAllAdmins = async () => {
    const sql = `
        SELECT 
            u.id_usuario, u.codigo_usuario, u.nombre, u.apellido_paterno, 
            u.correo, u.usuario, r.nombre_rol, e.nombre_estado
        FROM usuario u
        JOIN rol r ON u.id_rol = r.id_rol
        JOIN estado e ON u.id_estado = e.id_estado
        WHERE u.id_rol IN (2, 3)
        ORDER BY u.nombre ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * ¡NUEVO! Modelo para obtener TODOS los Clientes.
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
 * Modelo para obtener un usuario por ID (para editar).
 * (Sin cambios)
 */
Usuario.getById = async (id_usuario) => {
    const sql = `SELECT * FROM usuario WHERE id_usuario = ?`;
    const [rows] = await pool.query(sql, [id_usuario]);
    return rows[0];
};

/**
 * Modelo para actualizar Rol y Estado de un admin.
 * (Sin cambios)
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
 * ¡NUEVO! Modelo para actualizar solo el ESTADO de un usuario (para Clientes).
 */
Usuario.updateState = async (id_usuario, id_estado) => {
    const sql = `UPDATE usuario SET id_estado = ? WHERE id_usuario = ?`;
    const [result] = await pool.query(sql, [id_estado, id_usuario]);
    return result.affectedRows;
};

/**
 * Modelo para obtener los roles de Admin (para el formulario).
 * (Sin cambios)
 */
Usuario.getAdminRoles = async () => {
    const sql = `SELECT * FROM rol WHERE id_rol IN (2, 3)`;
    const [rows] = await pool.query(sql);
    return rows;
};

/**
 * Modelo para obtener TODOS los estados (Activo/Inactivo).
 * (Sin cambios)
 */
Usuario.getAllStates = async () => {
    const sql = `SELECT * FROM estado`;
    const [rows] = await pool.query(sql);
    return rows;
};

// ... (resto de funciones del modelo Usuario) ...

/**
 * ¡NUEVO! Obtener detalles básicos de un usuario por ID (para "Mi Cuenta").
 * Excluye la contraseña.
 */
Usuario.getProfileById = async (id_usuario) => {
    const sql = `
        SELECT
            u.codigo_usuario, u.nombre, u.apellido_paterno, u.apellido_materno,
            u.numero_dni, u.telefono, u.correo, u.usuario, u.fecha_registro,
            r.nombre_rol, e.nombre_estado
        FROM usuario u
        JOIN rol r ON u.id_rol = r.id_rol
        JOIN estado e ON u.id_estado = e.id_estado
        WHERE u.id_usuario = ?
    `;
    const [rows] = await pool.query(sql, [id_usuario]);
    return rows[0]; // Devuelve el perfil o undefined
};


/**
 * ¡NUEVO! Actualiza los datos del perfil de un usuario (Cliente).
 * Verifica duplicados de correo y usuario si se cambian.
 * @param {number} id_usuario
 * @param {object} profileData - { nombre, apellido_paterno, apellido_materno, telefono, correo, usuario }
 */
Usuario.updateProfile = async (id_usuario, profileData) => {
    // 1. Obtener datos actuales para comparar
    const currentUser = await Usuario.getById(id_usuario); // Usamos getById que trae todo
    if (!currentUser) {
        throw new Error('Usuario no encontrado.');
    }

    // 2. Construir la consulta y parámetros dinámicamente
    const fieldsToUpdate = {};
    const params = [];

    // Campos siempre actualizables
    fieldsToUpdate.nombre = profileData.nombre;
    fieldsToUpdate.apellido_paterno = profileData.apellido_paterno;
    fieldsToUpdate.apellido_materno = profileData.apellido_materno;
    fieldsToUpdate.telefono = profileData.telefono || null; // Permitir nulo

    // Campos que requieren verificación de unicidad
    // Verificar correo SOLO si ha cambiado
    if (profileData.correo && profileData.correo !== currentUser.correo) {
        // Comprobar si el nuevo correo ya existe para OTRO usuario
        const [existingEmail] = await pool.query(
            'SELECT id_usuario FROM usuario WHERE correo = ? AND id_usuario != ?',
            [profileData.correo, id_usuario]
        );
        if (existingEmail.length > 0) {
            throw new Error('El correo electrónico ingresado ya está en uso por otra cuenta.');
        }
        fieldsToUpdate.correo = profileData.correo;
    }

    // Verificar usuario SOLO si ha cambiado
    if (profileData.usuario && profileData.usuario !== currentUser.usuario) {
        // Comprobar si el nuevo usuario ya existe para OTRO usuario
        const [existingUsername] = await pool.query(
            'SELECT id_usuario FROM usuario WHERE usuario = ? AND id_usuario != ?',
            [profileData.usuario, id_usuario]
        );
        if (existingUsername.length > 0) {
            throw new Error('El nombre de usuario ingresado ya está en uso.');
        }
        fieldsToUpdate.usuario = profileData.usuario;
    }

    // Preparar SET clause y parámetros finales
    const setClauses = Object.keys(fieldsToUpdate).map(key => `${key} = ?`);
    params.push(...Object.values(fieldsToUpdate));
    params.push(id_usuario); // Para el WHERE

    if (setClauses.length === 0) {
        return 0; // No hay nada que actualizar
    }

    // 3. Ejecutar la actualización
    const sql = `UPDATE usuario SET ${setClauses.join(', ')} WHERE id_usuario = ?`;
    const [result] = await pool.query(sql, params);

    return result.affectedRows;
};

module.exports = Usuario;