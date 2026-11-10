package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.Promocion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface IPromocionRepository extends JpaRepository<Promocion, Long> {

    // Las más nuevas primero
    List<Promocion> findAllByOrderByFechaInicioDesc();

    // Promociones activas cuyo período incluye la fecha dada (hoy)
    List<Promocion> findByActivaTrueAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqualOrderByDescripcion(
            LocalDate desde, LocalDate hasta);
}
