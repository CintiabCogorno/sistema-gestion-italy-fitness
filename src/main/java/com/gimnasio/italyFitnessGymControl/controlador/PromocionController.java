package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dto.PromocionDTO;
import com.gimnasio.italyFitnessGymControl.dto.PromocionRequestDTO;
import com.gimnasio.italyFitnessGymControl.servicio.IPromocionService;
import com.gimnasio.italyFitnessGymControl.servicio.PromocionException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * GET    /promociones           -> lista todas (con el dato "vigente" calculado)
 * GET    /promociones/vigentes  -> solo las que se pueden aplicar hoy a una cuota
 * POST   /promociones           -> crea una promoción
 * PUT    /promociones/{id}      -> edita (también sirve para volver a activarla)
 * DELETE /promociones/{id}      -> baja lógica: la deja inactiva, no la borra
 *
 * Los errores se devuelven como {"mensaje": "..."} para mostrarlos en pantalla.
 *
 * Pendiente (cuando esté el login): permitir crear, editar y desactivar solo al Administrador.
 */
@RestController
@RequestMapping("/promociones")
public class PromocionController {

    private final IPromocionService promocionServ;

    public PromocionController(IPromocionService promocionServ) {
        this.promocionServ = promocionServ;
    }

    @GetMapping
    public List<PromocionDTO> traerPromociones() {
        return promocionServ.traerPromociones();
    }

    @GetMapping("/vigentes")
    public List<PromocionDTO> traerVigentes() {
        return promocionServ.traerVigentes();
    }

    @PostMapping
    public ResponseEntity<PromocionDTO> crearPromocion(@RequestBody PromocionRequestDTO datos) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(promocionServ.crearPromocion(datos));
    }

    @PutMapping("/{id}")
    public PromocionDTO editarPromocion(@PathVariable Long id,
                                        @RequestBody PromocionRequestDTO datos) {
        return promocionServ.editarPromocion(id, datos);
    }

    @DeleteMapping("/{id}")
    public PromocionDTO desactivarPromocion(@PathVariable Long id) {
        return promocionServ.desactivarPromocion(id);
    }

    // Convierte los errores de negocio en una respuesta con mensaje
    @ExceptionHandler(PromocionException.class)
    public ResponseEntity<Map<String, String>> manejarError(PromocionException error) {
        HttpStatus estado = switch (error.getTipo()) {
            case NO_ENCONTRADA -> HttpStatus.NOT_FOUND;
            case DATOS_INVALIDOS -> HttpStatus.BAD_REQUEST;
        };
        return ResponseEntity.status(estado).body(Map.of("mensaje", error.getMessage()));
    }
}
