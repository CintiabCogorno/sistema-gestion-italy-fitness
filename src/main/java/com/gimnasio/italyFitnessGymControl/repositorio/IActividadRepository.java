package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.Actividad;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface IActividadRepository extends JpaRepository<Actividad, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdActividadNot(String nombre, Long idActividad);

    // Trae las actividades con sus socios en una sola consulta (evita una consulta por actividad)
    @Query("select distinct a from Actividad a left join fetch a.socios order by a.nombre")
    List<Actividad> traerTodasConSocios();
}
