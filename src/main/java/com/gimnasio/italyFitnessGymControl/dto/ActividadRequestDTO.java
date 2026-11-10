package com.gimnasio.italyFitnessGymControl.dto;

import java.math.BigDecimal;

/**
 * Lo que el frontend manda para crear o editar una actividad.
 * "disponible" puede venir vacío: en ese caso se toma como disponible al crear
 * y no se modifica al editar.
 */
public record ActividadRequestDTO(String nombre,
                                  String descripcion,
                                  BigDecimal precioCuota,
                                  Boolean disponible) {
}
