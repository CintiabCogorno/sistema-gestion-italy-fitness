package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dto.ClaveRequestDTO;
import com.gimnasio.italyFitnessGymControl.dto.EstadoRequestDTO;
import com.gimnasio.italyFitnessGymControl.dto.UsuarioDTO;
import com.gimnasio.italyFitnessGymControl.dto.UsuarioRequestDTO;
import com.gimnasio.italyFitnessGymControl.servicio.IUsuarioService;
import com.gimnasio.italyFitnessGymControl.servicio.UsuarioException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Solo el administrador (lo controla AutorizacionInterceptor).
 *
 * GET  /usuarios              -> lista de usuarios del sistema
 * POST /usuarios              -> crea un recepcionista
 * PUT  /usuarios/{id}/estado  -> activa o desactiva a un recepcionista
 * PUT  /usuarios/{id}/clave   -> define una clave nueva para un recepcionista
 */
@RestController
@RequestMapping("/usuarios")
public class UsuarioController {

    private final IUsuarioService usuarioServ;

    public UsuarioController(IUsuarioService usuarioServ) {
        this.usuarioServ = usuarioServ;
    }

    @GetMapping
    public List<UsuarioDTO> traerUsuarios() {
        return usuarioServ.traerUsuarios();
    }

    @PostMapping
    public ResponseEntity<UsuarioDTO> crear(@RequestBody UsuarioRequestDTO datos) {
        return ResponseEntity.status(HttpStatus.CREATED).body(usuarioServ.crearRecepcionista(datos));
    }

    @PutMapping("/{id}/estado")
    public UsuarioDTO cambiarEstado(@PathVariable Long id, @RequestBody EstadoRequestDTO datos) {
        return usuarioServ.cambiarEstado(id, datos.activo());
    }

    @PutMapping("/{id}/clave")
    public ResponseEntity<Void> restablecerClave(@PathVariable Long id, @RequestBody ClaveRequestDTO datos) {
        usuarioServ.restablecerClave(id, datos.nueva());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(UsuarioException.class)
    public ResponseEntity<Map<String, String>> manejarError(UsuarioException error) {
        return responder(error);
    }

    static ResponseEntity<Map<String, String>> responder(UsuarioException error) {
        HttpStatus estado = switch (error.getTipo()) {
            case NO_AUTENTICADO -> HttpStatus.UNAUTHORIZED;
            case PROHIBIDO -> HttpStatus.FORBIDDEN;
            case NO_ENCONTRADO -> HttpStatus.NOT_FOUND;
            case DATOS_INVALIDOS -> HttpStatus.BAD_REQUEST;
            case CONFLICTO -> HttpStatus.CONFLICT;
            case DEMASIADOS_INTENTOS -> HttpStatus.TOO_MANY_REQUESTS;
        };
        return ResponseEntity.status(estado).body(Map.of("mensaje", error.getMessage()));
    }
}
