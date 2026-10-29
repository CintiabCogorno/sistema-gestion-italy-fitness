package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.Pago;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface IPagoRepository extends JpaRepository<Pago, Long> {

    List<Pago> findByAnuladoFalse();
    List<Pago> findByFechaPagoBetween(LocalDate desde, LocalDate hasta);
    List<Pago> findBySocio_IdAndAnuladoFalseOrderByFechaPagoDesc(Long idSocio);

}
