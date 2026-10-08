package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.Acceso;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface IAccesoRepository extends JpaRepository<Acceso, Long> {

    List<Acceso> findByPermitidoFalse();

    List<Acceso> findByFechaHoraBetween(LocalDateTime desde, LocalDateTime hasta);
}
