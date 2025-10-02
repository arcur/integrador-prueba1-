package bd.trabajo.app;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Clase principal para lanzar la aplicación Spring Boot.
 * Esta clase detecta todos los componentes (@Controller, @Service, @Repository)
 * y configura automáticamente la conexión a la base de datos y la seguridad.
 */
@SpringBootApplication
public class TrabajoApplication {

    public static void main(String[] args) {
        // Inicializa y ejecuta la aplicación Spring Boot
        SpringApplication.run(TrabajoApplication.class, args);
    }
}