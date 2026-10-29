package com.gimnasio.italyFitnessGymControl.dto;

import com.gimnasio.italyFitnessGymControl.dominio.Actividad;
import com.gimnasio.italyFitnessGymControl.dominio.Socio;

import java.math.BigDecimal;
import java.util.List;

/**
 * Lo que el backend le devuelve al frontend de una actividad:
 * sus datos + cuántos socios la hacen y cuáles son (solo los ids).
 */
public record ActividadDTO(Long idActividad,
                           String nombre,
                           String descripcion,
                           BigDecimal precioCuota,
                           boolean disponible,
                           int cantidadInscriptos,
                           List<Long> idsSocios) {

    public static ActividadDTO de(Actividad actividad) {
        List<Long> ids = actividad.getSocios().stream()
                .map(Socio::getId)
                .sorted()
                .toList();

        return new ActividadDTO(
                actividad.getIdActividad(),
                actividad.getNombre(),
                actividad.getDescripcion(),
                actividad.getPrecioCuota(),
                actividad.estaDisponible(),
                ids.size(),
                ids);
    }
}
