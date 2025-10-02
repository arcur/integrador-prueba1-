package bd.trabajo.app;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.HashMap;

/**
 * Controlador REST para manejar la autenticación (registro y login).
 * Mapea las URL que el frontend consume.
 */
@RestController
@RequestMapping("/api/auth") // Prefijo de URL: /api/auth
public class AuthController {

    private final AuthService authService;

    // La inyección de constructores es la mejor práctica. 
    // El error indica que falta @Service en AuthService.
   
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Endpoint para registrar un nuevo usuario.
     * URL completa: POST http://localhost:8081/api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegistroRequest request) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Llamar al servicio para registrar y guardar. 
            // Se asume que el objeto del modelo es 'Usuario' (capitalizado).
            Usuario nuevoUsuario = authService.register(request);

            // Respuesta de éxito (201 Created)
            response.put("message", "Usuario registrado exitosamente");
            response.put("usuarioId", nuevoUsuario.getId());
            response.put("usuarioName", nuevoUsuario.getUsuario());
            
            return new ResponseEntity<>(response, HttpStatus.CREATED); // 201

        } catch (RuntimeException e) {
            // Manejar excepciones de duplicados o errores de lógica
            response.put("message", e.getMessage());
            return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400
        } catch (Exception e) {
            // Manejar cualquier otro error inesperado (ej: error de DB)
            response.put("message", "Error interno del servidor al registrar usuario.");
            return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR); // 500
        }
    }
    
    // Aquí iría el endpoint para el login...
}
