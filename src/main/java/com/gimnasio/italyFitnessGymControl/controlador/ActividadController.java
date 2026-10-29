package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dto.ActividadDTO;
import com.gimnasio.italyFitnessGymControl.dto.ActividadRequestDTO;
import com.gimnasio.italyFitnessGymControl.servicio.ActividadException;
import com.gimnasio.italyFitnessGymControl.servicio.IActividadService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * GET    /actividades                -> lista (con cantidad de inscriptos y ids de socios)
 * POST   /actividades                -> crea una actividad
 * PUT    /actividades/{id}           -> edita (también sirve para marcarla como no disponible)
 * DELETE /actividades/{id}           -> elimina (solo si no tiene socios inscriptos)
 * PUT    /actividades/socio/{id}     -> define las actividades de un socio (body: [1, 3])
 *
 * Los errores se devuelven como {"mensaje": "..."} para mostrarlos en pantalla.
 */
@RestController
@RequestMapping("/actividades")
public class ActividadController {

    private final IActividadService actividadServ;

    public ActividadController(IActividadService actividadServ) {
        this.actividadServ = actividadServ;
    }

    @GetMapping
    public List<ActividadDTO> traerActividades() {
        return actividadServ.traerActividades();
    }

    @PostMapping
    public ResponseEntity<ActividadDTO> crearActividad(@RequestBody ActividadRequestDTO datos) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(actividadServ.crearActividad(datos));
    }

    @PutMapping("/{id}")
    public ActividadDTO editarActividad(@PathVariable Long id,
                                        @RequestBody ActividadRequestDTO datos) {
        return actividadServ.editarActividad(id, datos);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarActividad(@PathVariable Long id) {
        actividadServ.eliminarActividad(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/socio/{idSocio}")
    public Map<String, List<Long>> asignarActividadesASocio(@PathVariable Long idSocio,
                                                            @RequestBody List<Long> idsActividades) {
        return Map.of("idsActividades",
                actividadServ.asignarActividadesASocio(idSocio, idsActividades));
    }

    // Convierte los errores de negocio en una respuesta con mensaje
    @ExceptionHandler(ActividadException.class)
    public ResponseEntity<Map<String, String>> manejarError(ActividadException error) {
        HttpStatus estado = switch (error.getTipo()) {
            case NO_ENCONTRADA -> HttpStatus.NOT_FOUND;
            case DATOS_INVALIDOS -> HttpStatus.BAD_REQUEST;
            case CONFLICTO -> HttpStatus.CONFLICT;
        };
        return ResponseEntity.status(estado).body(Map.of("mensaje", error.getMessage()));
    }
}
