package bd.trabajo.app;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Column;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;

import java.time.LocalDateTime;

/**
 * Entidad JPA para la tabla 'usuario'.
 * Representa a los usuarios del sistema (clientes y/o administradores).
 */
@Entity
public class usuario {

    // Clave primaria auto-incremental
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id; 

    // Campo único que se autogenera en la base de datos (se mapea, pero no se setea directamente)
    @Column(name = "codigo_usuario", unique = true, length = 10)
    private String codigoUsuario;

    @Column(name = "nombre", nullable = false, length = 50)
    private String nombre;

    @Column(name = "apellido_paterno", nullable = false, length = 50)
    private String apellidoPaterno;

    @Column(name = "apellido_materno", nullable = false, length = 50)
    private String apellidoMaterno;

    @Column(name = "numero_dni", unique = true, length = 8)
    private String numeroDni;

    @Column(name = "telefono", length = 15)
    private String telefono;

    @Column(name = "correo", unique = true, nullable = false, length = 100)
    private String correo;

    @Column(name = "usuario", unique = true, nullable = false, length = 50)
    private String usuario;

    // La contraseña debe ser almacenada encriptada (BCrypt)
    @Column(name = "contraseña", nullable = false, length = 255) 
    private String contrasena;
    
    // TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    @Column(name = "fecha_registro", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    @Temporal(TemporalType.TIMESTAMP) // Aunque LocalDateTime es mejor, se mantiene Temporal por compatibilidad JPA
    private LocalDateTime fechaRegistro;

    // --- Constructor por defecto (necesario para JPA) ---
    public usuario() {}

    // --- Constructor con campos requeridos (sin ID y sin fechaRegistro) ---
    public usuario(String nombre, String apellidoPaterno, String apellidoMaterno, String numeroDni, String telefono, String correo, String usuario, String contrasena) {
        this.nombre = nombre;
        this.apellidoPaterno = apellidoPaterno;
        this.apellidoMaterno = apellidoMaterno;
        this.numeroDni = numeroDni;
        this.telefono = telefono;
        this.correo = correo;
        this.usuario = usuario;
        this.contrasena = contrasena;
    }

    // --- Getters y Setters ---

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCodigoUsuario() {
        return codigoUsuario;
    }
    
    // Nota: El código de usuario es gestionado por la DB (trigger), por lo general solo se lee
    public void setCodigoUsuario(String codigoUsuario) {
        this.codigoUsuario = codigoUsuario;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellidoPaterno() {
        return apellidoPaterno;
    }

    public void setApellidoPaterno(String apellidoPaterno) {
        this.apellidoPaterno = apellidoPaterno;
    }

    public String getApellidoMaterno() {
        return apellidoMaterno;
    }

    public void setApellidoMaterno(String apellidoMaterno) {
        this.apellidoMaterno = apellidoMaterno;
    }

    public String getNumeroDni() {
        return numeroDni;
    }

    public void setNumeroDni(String numeroDni) {
        this.numeroDni = numeroDni;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getUsuario() {
        return usuario;
    }

    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }

    public String getContrasena() {
        return contrasena;
    }

    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}