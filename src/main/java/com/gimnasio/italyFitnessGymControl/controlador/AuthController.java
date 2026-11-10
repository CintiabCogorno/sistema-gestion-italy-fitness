package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dto.ClaveRequestDTO;
import com.gimnasio.italyFitnessGymControl.dto.LoginRequestDTO;
import com.gimnasio.italyFitnessGymControl.dto.SesionDTO;
import com.gimnasio.italyFitnessGymControl.seguridad.SesionUsuario;
import com.gimnasio.italyFitnessGymControl.servicio.IAuthService;
import com.gimnasio.italyFitnessGymControl.servicio.UsuarioException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * POST /auth/login   -> inicia sesión
 * POST /auth/logout  -> cierra la sesión
 * GET  /auth/me      -> quién tiene la sesión iniciada (401 si nadie)
 * PUT  /auth/clave   -> cambia la contraseña propia
 */
@RestController
@RequestMapping("/auth")
public class AuthController {

    private final IAuthService authServ;

    public AuthController(IAuthService authServ) {
        this.authServ = authServ;
    }

    @PostMapping("/login")
    public SesionDTO login(@RequestBody LoginRequestDTO datos, HttpServletRequest request) {
        SesionUsuario sesion = authServ.autenticar(datos.usuario(), datos.clave());

        // Sesión nueva en cada ingreso (evita que alguien reutilice un identificador viejo)
        HttpSession anterior = request.getSession(false);
        if (anterior != null) {
            anterior.invalidate();
        }
        request.getSession(true).setAttribute(SesionUsuario.ATRIBUTO, sesion);
        return SesionDTO.de(sesion);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        HttpSession http = request.getSession(false);
        if (http != null) {
            http.invalidate();
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public SesionDTO me(HttpServletRequest request) {
        SesionUsuario sesion = exigirSesion(request);
        if (!authServ.sigueActivo(sesion.id())) {
            request.getSession().invalidate();
            throw new UsuarioException(UsuarioException.Tipo.NO_AUTENTICADO, "Tu sesión terminó. Iniciá sesión de nuevo.");
        }
        return SesionDTO.de(sesion);
    }

    @PutMapping("/clave")
    public ResponseEntity<Void> cambiarClave(@RequestBody ClaveRequestDTO datos, HttpServletRequest request) {
        SesionUsuario sesion = exigirSesion(request);
        authServ.cambiarClavePropia(sesion.id(), datos.actual(), datos.nueva());
        return ResponseEntity.noContent().build();
    }

    private SesionUsuario exigirSesion(HttpServletRequest request) {
        HttpSession http = request.getSession(false);
        Object valor = http == null ? null : http.getAttribute(SesionUsuario.ATRIBUTO);
        if (valor instanceof SesionUsuario sesion) {
            return sesion;
        }
        throw new UsuarioException(UsuarioException.Tipo.NO_AUTENTICADO, "Iniciá sesión para continuar.");
    }

    @ExceptionHandler(UsuarioException.class)
    public ResponseEntity<Map<String, String>> manejarError(UsuarioException error) {
        return UsuarioController.responder(error);
    }
}
