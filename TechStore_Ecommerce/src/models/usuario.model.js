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
            u.id_usuario, u.nombre, u.usuario, u.contraseña, u.correo, 
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


/**
 * ¡NUEVO! Modelo para actualizar datos del perfil de un cliente.
 */
Usuario.updateProfileData = async (id_usuario, data) => {
    const sql = `
        UPDATE usuario 
        SET nombre = ?, apellido_paterno = ?, apellido_materno = ?, telefono = ?
        WHERE id_usuario = ?
    `;
    const [result] = await pool.query(sql, [
        data.nombre, data.apellido_paterno, data.apellido_materno, data.telefono, id_usuario
    ]);
    return result.affectedRows;
};

/**
 * ¡NUEVO! Modelo para actualizar solo la contraseña.
 */
Usuario.updatePassword = async (id_usuario, nuevaContraseña) => {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(nuevaContraseña, salt);
    
    const sql = `UPDATE usuario SET contraseña = ? WHERE id_usuario = ?`;
    const [result] = await pool.query(sql, [hash, id_usuario]);
    return result.affectedRows;
};

module.exports = Usuario;