package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.MovimientoCaja;
import com.gimnasio.italyFitnessGymControl.dominio.OrigenMovimiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface IMovimientoCajaRepository extends JpaRepository<MovimientoCaja, Long> {

    // Movimientos del período, el más nuevo primero
    List<MovimientoCaja> findByFechaBetweenOrderByFechaDescIdMovimientoDesc(LocalDate desde, LocalDate hasta);

    Optional<MovimientoCaja> findByOrigenAndOrigenId(OrigenMovimiento origen, Long origenId);

    List<MovimientoCaja> findByOrigen(OrigenMovimiento origen);

    // Totales de toda la historia de la caja (sin contar los anulados)
    @Query("select coalesce(sum(m.monto), 0) from MovimientoCaja m "
            + "where m.anulado = false and m.tipo = com.gimnasio.italyFitnessGymControl.dominio.TipoMovimiento.INGRESO")
    BigDecimal totalIngresosVigentes();

    @Query("select coalesce(sum(m.monto), 0) from MovimientoCaja m "
            + "where m.anulado = false and m.tipo = com.gimnasio.italyFitnessGymControl.dominio.TipoMovimiento.EGRESO")
    BigDecimal totalEgresosVigentes();
}
