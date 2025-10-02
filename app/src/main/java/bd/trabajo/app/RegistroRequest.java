package bd.trabajo.app;

// Nota: No se requiere ninguna anotación de Spring o JPA. Es solo un objeto de datos.

/**
 * Objeto de Transferencia de Datos (DTO) utilizado para recibir la información
 * del formulario de registro del cliente antes de ser procesada por el servicio.
 * Se mapea directamente con los campos enviados desde el frontend.
 */
public class RegistroRequest {

    // Los nombres de los campos deben coincidir con las propiedades esperadas en el JSON
    private String nombre;
    private String apellidoPaterno;
    private String apellidoMaterno;
    private String numeroDni; // En el frontend usa 'dni' pero en el JSON lo mapearemos a 'numeroDni'
    private String telefono;
    private String correo;
    private String usuario;
    private String contrasena; // Corresponde al campo 'password' del formulario HTML

    // Constructor por defecto
    public RegistroRequest() {}

    // Constructor completo
    public RegistroRequest(String nombre, String apellidoPaterno, String apellidoMaterno, String numeroDni, String telefono, String correo, String usuario, String contrasena) {
        this.nombre = nombre;
        this.apellidoPaterno = apellidoPaterno;
        this.apellidoMaterno = apellidoMaterno;
        this.numeroDni = numeroDni;
        this.telefono = telefono;
        this.correo = correo;
        this.usuario = usuario;
        this.contrasena = contrasena;
    }

    // Getters y Setters
    
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
}
