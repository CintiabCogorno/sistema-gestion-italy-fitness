package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dto.VentaDTO;
import com.gimnasio.italyFitnessGymControl.dto.VentaRequestDTO;
import com.gimnasio.italyFitnessGymControl.servicio.IVentaService;
import com.gimnasio.italyFitnessGymControl.servicio.VentaException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * GET  /ventas              -> historial (la más nueva primero)
 * POST /ventas              -> registra una venta (descuenta stock)
 * PUT  /ventas/{id}/anular  -> anula la venta y devuelve el stock
 *
 * Los errores se devuelven como {"mensaje": "..."} para mostrarlos en pantalla.
 */
@RestController
@RequestMapping("/ventas")
public class VentaController {

    private final IVentaService ventaServ;

    public VentaController(IVentaService ventaServ) {
        this.ventaServ = ventaServ;
    }

    @GetMapping
    public List<VentaDTO> traerVentas() {
        return ventaServ.traerVentas();
    }

    @PostMapping
    public ResponseEntity<VentaDTO> registrarVenta(@RequestBody VentaRequestDTO datos) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ventaServ.registrarVenta(datos));
    }

    @PutMapping("/{id}/anular")
    public VentaDTO anularVenta(@PathVariable Long id) {
        return ventaServ.anularVenta(id);
    }

    @ExceptionHandler(VentaException.class)
    public ResponseEntity<Map<String, String>> manejarError(VentaException error) {
        HttpStatus estado = switch (error.getTipo()) {
            case NO_ENCONTRADA -> HttpStatus.NOT_FOUND;
            case DATOS_INVALIDOS -> HttpStatus.BAD_REQUEST;
            case CONFLICTO -> HttpStatus.CONFLICT;
        };
        return ResponseEntity.status(estado).body(Map.of("mensaje", error.getMessage()));
    }
}
