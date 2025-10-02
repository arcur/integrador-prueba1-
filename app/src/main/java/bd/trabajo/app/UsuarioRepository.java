package bd.trabajo.app;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

/**
 * Repositorio de Spring Data JPA para la entidad 'usuario'.
 * Proporciona métodos CRUD básicos y permite definir consultas personalizadas.
 */
public interface UsuarioRepository extends JpaRepository<Usuario, Integer>{
    /**
     * Busca un usuario por su nombre de usuario.
     * Esto es útil para verificar duplicados al registrar.
     * @param usuario El nombre de usuario a buscar.
     * @return Un Optional que contiene el usuario si se encuentra.
     */
    Optional<Usuario> findByUsuario(String usuario);

    /**
     * Busca un usuario por su correo electrónico.
     * @param correo El correo electrónico a buscar.
     * @return Un Optional que contiene el usuario si se encuentra.
     */
    Optional<Usuario> findByCorreo(String correo);

    /**
     * Busca un usuario por su DNI.
     * @param numeroDni El DNI a buscar.
     * @return Un Optional que contiene el usuario si se encuentra.
     */
    Optional<Usuario> findByNumeroDni(String numeroDni);
}
