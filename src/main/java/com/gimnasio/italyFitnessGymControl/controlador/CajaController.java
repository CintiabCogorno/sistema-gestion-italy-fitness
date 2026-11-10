package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dto.CajaDTO;
import com.gimnasio.italyFitnessGymControl.dto.EgresoRequestDTO;
import com.gimnasio.italyFitnessGymControl.seguridad.SesionUsuario;
import com.gimnasio.italyFitnessGymControl.servicio.CajaException;
import com.gimnasio.italyFitnessGymControl.servicio.ICajaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * GET  /caja?desde=&hasta=  -> totales, desglose por categoría y movimientos del período
 * POST /caja/egresos        -> registra un egreso (compra de productos, sueldo, otro gasto)
 * PUT  /caja/{id}/anular    -> anula un egreso cargado a mano
 *
 * Solo el administrador entra acá (así lo define AutorizacionInterceptor: lo que no está
 * en su tabla de permisos es del administrador).
 * Los errores se devuelven como {"mensaje": "..."} para mostrarlos en pantalla.
 */
@RestController
@RequestMapping("/caja")
public class CajaController {

    private final ICajaService cajaServ;

    public CajaController(ICajaService cajaServ) {
        this.cajaServ = cajaServ;
    }

    @GetMapping
    public CajaDTO consultar(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return cajaServ.consultar(desde, hasta);
    }

    @PostMapping("/egresos")
    public ResponseEntity<CajaDTO.Movimiento> registrarEgreso(@RequestBody EgresoRequestDTO datos,
                                                              HttpServletRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(cajaServ.registrarEgreso(datos, quienEsta(request)));
    }

    @PutMapping("/{id}/anular")
    public CajaDTO.Movimiento anular(@PathVariable Long id) {
        return cajaServ.anularMovimiento(id);
    }

    // Usuario que tiene la sesión abierta, para dejar anotado quién cargó el egreso
    private static String quienEsta(HttpServletRequest request) {
        HttpSession http = request.getSession(false);
        Object valor = http == null ? null : http.getAttribute(SesionUsuario.ATRIBUTO);
        return valor instanceof SesionUsuario s ? s.nombreUsuario() : null;
    }

    @ExceptionHandler(CajaException.class)
    public ResponseEntity<Map<String, String>> manejarError(CajaException error) {
        HttpStatus estado = switch (error.getTipo()) {
            case NO_ENCONTRADO -> HttpStatus.NOT_FOUND;
            case DATOS_INVALIDOS -> HttpStatus.BAD_REQUEST;
            case CONFLICTO -> HttpStatus.CONFLICT;
        };
        return ResponseEntity.status(estado).body(Map.of("mensaje", error.getMessage()));
    }
}
