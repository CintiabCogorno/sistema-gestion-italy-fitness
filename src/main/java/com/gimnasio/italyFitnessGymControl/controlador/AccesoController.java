package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dominio.Acceso;
import com.gimnasio.italyFitnessGymControl.servicio.IAccesoService;
import com.gimnasio.italyFitnessGymControl.servicio.IPagoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/accesos")
public class AccesoController {

    private final IAccesoService accesoServ;
    private final IPagoService pagoServ;

    public AccesoController(IAccesoService accesoServ, IPagoService pagoServ) {
        this.accesoServ = accesoServ;
        this.pagoServ = pagoServ;
    }

    @GetMapping
    public List<Acceso> traerAccesos() {
        return accesoServ.traerAccesos();
    }

    @GetMapping("/denegados")
    public List<Acceso> traerDenegados() {
        return accesoServ.traerAccesosDenegados();
    }

    @GetMapping("/rango")
    public List<Acceso> traerPorRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime hasta) {
        return accesoServ.traerAccesosPorRango(desde, hasta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarAcceso(@PathVariable Long id) {
        Acceso acceso = accesoServ.buscarAcceso(id);

        if (acceso == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el registro");
        }

        return ResponseEntity.ok(acceso);
    }


    @PostMapping
    public ResponseEntity<?> registrarAcceso(
            @RequestParam Long idSocio,
            @RequestBody Acceso acceso) {

        Acceso creado = accesoServ.registrarAcceso(acceso, idSocio);

        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }


    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarAcceso(@PathVariable Long id) {
        boolean eliminado = accesoServ.eliminarAcceso(id);

        if (!eliminado) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el registro");
        }

        return ResponseEntity.ok("Registro de acceso eliminado correctamente");
    }
}
