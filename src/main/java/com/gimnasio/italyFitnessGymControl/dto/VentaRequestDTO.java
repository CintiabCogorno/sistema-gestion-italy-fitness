package com.gimnasio.italyFitnessGymControl.dto;

import java.util.List;

/**
 * Lo que el frontend manda para registrar una venta: el socio (opcional) y qué productos
 * y cuántas unidades. El precio NO viaja: lo toma el servidor del producto.
 */
public record VentaRequestDTO(Long idSocio, List<Item> items) {

    public record Item(Long idProducto, int cantidad) {
    }
}
