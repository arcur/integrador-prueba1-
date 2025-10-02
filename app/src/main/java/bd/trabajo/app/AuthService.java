package bd.trabajo.app;


import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * Servicio que contiene la lógica para la autenticación (registro y futuro login).
 * Incluye validaciones de duplicados y encriptación de la contraseña.
 */
@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    // Inyección de dependencias (Repositorio y PasswordEncoder)
 
    public AuthService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Procesa la solicitud de registro de un nuevo usuario.
     * @param request DTO con los datos del usuario.
     * @return La entidad 'Usuario' guardada, o lanza una excepción si falla.
     */
    // 🚨 CORRECCIÓN: Usamos 'Usuario' (clase) en lugar de 'usuario' (minúscula)
    public Usuario register(RegistroRequest request) { 
        
        // 1. Verificar duplicados (muy importante)
        if (usuarioRepository.findByUsuario(request.getUsuario()).isPresent()) {
            throw new RuntimeException("El nombre de usuario ya está en uso.");
        }
        if (usuarioRepository.findByCorreo(request.getCorreo()).isPresent()) {
            throw new RuntimeException("El correo electrónico ya está registrado.");
        }
        if (usuarioRepository.findByNumeroDni(request.getNumeroDni()).isPresent()) {
            throw new RuntimeException("El DNI ya está registrado.");
        }

        // 2. Crear la entidad 'Usuario'
        // 🚨 CORRECCIÓN: Usamos 'Usuario' (clase) en lugar de 'usuario' (minúscula)
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(request.getNombre());
        nuevoUsuario.setApellidoPaterno(request.getApellidoPaterno());
        nuevoUsuario.setApellidoMaterno(request.getApellidoMaterno());
        nuevoUsuario.setNumeroDni(request.getNumeroDni());
        nuevoUsuario.setTelefono(request.getTelefono());
        nuevoUsuario.setCorreo(request.getCorreo());
        nuevoUsuario.setUsuario(request.getUsuario());
        
        // 3. Encriptar la contraseña antes de guardarla
        String hashedPassword = passwordEncoder.encode(request.getContrasena());
        nuevoUsuario.setContrasena(hashedPassword);

        // 4. Guardar en la base de datos
        return usuarioRepository.save(nuevoUsuario);
    }
}
