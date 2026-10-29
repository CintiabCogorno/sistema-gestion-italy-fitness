package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.Venta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IVentaRepository extends JpaRepository<Venta, Long> {

    // Ventas con su socio, sus detalles y los productos, en una sola consulta (la más nueva primero)
    @Query("select distinct v from Venta v "
            + "left join fetch v.socio "
            + "left join fetch v.detalles d "
            + "left join fetch d.producto "
            + "order by v.fecha desc")
    List<Venta> traerTodasConDetalle();
}
