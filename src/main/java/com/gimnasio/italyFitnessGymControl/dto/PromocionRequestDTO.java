package com.gimnasio.italyFitnessGymControl.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Lo que el frontend manda para crear o editar una promoción.
 * "activa" puede venir vacío: al crear se toma como activa y al editar no se modifica.
 */
public record PromocionRequestDTO(String descripcion,
                                  BigDecimal porcentajeDescuento,
                                  LocalDate fechaInicio,
                                  LocalDate fechaFin,
                                  Boolean activa) {
}
