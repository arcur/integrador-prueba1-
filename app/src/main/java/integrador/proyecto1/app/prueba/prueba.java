package integrador.proyecto1.app.prueba;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class prueba {
    @GetMapping("/")
    public static void main(String[] args) {

        System.out.println("hola mundo");
    }
}
