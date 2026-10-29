package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Pago;
import com.gimnasio.italyFitnessGymControl.dto.PagoDTO;
import java.time.LocalDate;
import java.util.List;

public interface IPagoService {

    Pago registrarPago(Pago pago);
    Pago registrarPago(Pago pago, Long idSocio);
    List<Pago> traerPagos();
    List<Pago> traerPagosVigentes();
    List<Pago> traerPagosPorRango(LocalDate desde, LocalDate hasta);
    Pago buscarPago(Long id);
    Pago editarPago(Long id, Pago datosActualizados);
    Pago anularPago(Long id);
    boolean tieneCuotaVigente(Long idSocio);
    List<PagoDTO> traerPagosDTO();
    List<PagoDTO> traerPagosVigentesDTO();
}
