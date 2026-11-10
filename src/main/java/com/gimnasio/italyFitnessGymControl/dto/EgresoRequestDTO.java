package com.gimnasio.italyFitnessGymControl.dto;

import com.gimnasio.italyFitnessGymControl.dominio.CategoriaCaja;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Datos para registrar un egreso a mano.
 *
 * - fecha: si no viene, es hoy.
 * - beneficiario: obligatorio en los sueldos (a quién se le paga); en una compra, el proveedor.
 * - idProducto + cantidad: solo en COMPRA_PRODUCTOS; si vienen, esas unidades se suman al stock.
 * - concepto: si no viene, se arma uno con la categoría y el beneficiario o el producto.
 */
public record EgresoRequestDTO(CategoriaCaja categoria,
                               String concepto,
                               BigDecimal monto,
                               LocalDate fecha,
                               String medioPago,
                               String beneficiario,
                               Long idProducto,
                               Integer cantidad) {
}
