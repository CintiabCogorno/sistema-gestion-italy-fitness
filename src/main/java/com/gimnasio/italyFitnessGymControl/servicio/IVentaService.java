package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dto.VentaDTO;
import com.gimnasio.italyFitnessGymControl.dto.VentaRequestDTO;

import java.util.List;

public interface IVentaService {

    // READ: historial (la más nueva primero)
    List<VentaDTO> traerVentas();

    // CREATE: toma el precio de cada producto y descuenta el stock
    VentaDTO registrarVenta(VentaRequestDTO datos);

    // Anula la venta y devuelve el stock de lo que se había vendido
    VentaDTO anularVenta(Long id);
}
