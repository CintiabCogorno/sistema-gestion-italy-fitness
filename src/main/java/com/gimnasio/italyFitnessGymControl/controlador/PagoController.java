package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dominio.Pago;
import com.gimnasio.italyFitnessGymControl.servicio.IPagoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/pagos")
public class PagoController {

    private final IPagoService pagoServ;

    public PagoController(IPagoService pagoServ) {
        this.pagoServ = pagoServ;
    }

    @GetMapping
    public List<Pago> traerPagos() {
        return pagoServ.traerPagos();
    }

    @GetMapping("/vigentes")
    public List<Pago> traerVigentes() {
        return pagoServ.traerPagosVigentes();
    }

    @GetMapping("/rango")
    public List<Pago> traerPorRango(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta) {
        return pagoServ.traerPagosPorRango(desde, hasta);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarPago(@PathVariable Long id) {
        Pago pago = pagoServ.buscarPago(id);

        if (pago == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el pago");
        }

        return ResponseEntity.ok(pago);
    }

    @PostMapping
    public ResponseEntity<?> registrarPago(@RequestBody Pago pago) {
        Pago creado = pagoServ.registrarPago(pago);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarPago(@PathVariable Long id, @RequestBody Pago pagoAModificar) {
        Pago editado = pagoServ.editarPago(id, pagoAModificar);

        if (editado == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el pago");
        }

        return ResponseEntity.ok(editado);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> anularPago(@PathVariable Long id) {
        Pago anulado = pagoServ.anularPago(id);

        if (anulado == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el pago");
        }

        return ResponseEntity.ok(anulado);
    }
}

