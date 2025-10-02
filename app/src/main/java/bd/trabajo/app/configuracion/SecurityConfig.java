package bd.trabajo.app.configuracion;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    /**
     * Define el bean para la encriptación de contraseñas (BCrypt).
     * Requerido por AuthService.java
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * Configuración del filtro de seguridad HTTP.
     * 1. Deshabilita CSRF.
     * 2. Permite el acceso a los endpoints de registro y login.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // Deshabilita CSRF (necesario para APIs REST sin sesiones)
            .csrf(csrf -> csrf.disable()) 
            // Manejamos CORS con el bean corsFilter() de abajo
            .cors(cors -> {}) 
            .authorizeHttpRequests(auth -> auth
                // Permite el acceso sin autenticación al endpoint de registro
                .requestMatchers("/api/auth/register", "/api/auth/login").permitAll()
                // Cualquier otra solicitud requiere autenticación 
                .anyRequest().authenticated() 
            );
        return http.build();
    }

    /**
     * Configuración de CORS para permitir solicitudes desde el frontend.
     * Esto es CRUCIAL para que el fetch() de JavaScript funcione sin errores de origen.
     */
    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        
        // Permite cualquier origen (el frontend)
        config.addAllowedOrigin("*"); 
        // Permite los métodos necesarios
        config.addAllowedMethod("*"); 
        // Permite cualquier encabezado
        config.addAllowedHeader("*");
        
        // Aplica esta configuración a todos los paths
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
