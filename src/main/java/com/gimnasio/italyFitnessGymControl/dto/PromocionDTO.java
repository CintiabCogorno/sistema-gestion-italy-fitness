package com.gimnasio.italyFitnessGymControl.dto;

import com.gimnasio.italyFitnessGymControl.dominio.Promocion;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Lo que el backend le devuelve al frontend de una promoción:
 * sus datos + "vigente" (activa y con la fecha de hoy dentro del período).
 */
public record PromocionDTO(Long idPromocion,
                           String descripcion,
                           BigDecimal porcentajeDescuento,
                           LocalDate fechaInicio,
                           LocalDate fechaFin,
                           boolean activa,
                           boolean vigente) {

    public static PromocionDTO de(Promocion promocion) {
        return new PromocionDTO(
                promocion.getIdPromocion(),
                promocion.getDescripcion(),
                promocion.getPorcentajeDescuento(),
                promocion.getFechaInicio(),
                promocion.getFechaFin(),
                promocion.isActiva(),
                promocion.estaVigente());
    }
}
