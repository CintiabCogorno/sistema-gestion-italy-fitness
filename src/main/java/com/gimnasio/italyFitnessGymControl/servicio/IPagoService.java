package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Pago;

import java.time.LocalDate;
import java.util.List;

public interface IPagoService {

    Pago registrarPago(Pago pago);
    List<Pago> traerPagos();
    List<Pago> traerPagosVigentes();
    List<Pago> traerPagosPorRango(LocalDate desde, LocalDate hasta);
    Pago buscarPago(Long id);
    Pago editarPago(Long id, Pago datosActualizados);
    Pago anularPago(Long id);
}
