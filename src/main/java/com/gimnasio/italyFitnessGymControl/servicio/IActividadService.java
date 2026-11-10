package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dto.ActividadDTO;
import com.gimnasio.italyFitnessGymControl.dto.ActividadRequestDTO;

import java.util.List;

public interface IActividadService {

    // READ
    List<ActividadDTO> traerActividades();

    // CREATE
    ActividadDTO crearActividad(ActividadRequestDTO datos);

    // UPDATE
    ActividadDTO editarActividad(Long id, ActividadRequestDTO datos);

    // DELETE (solo si no tiene socios inscriptos)
    void eliminarActividad(Long id);

    // Define las actividades que realiza un socio; devuelve los ids que quedaron guardados
    List<Long> asignarActividadesASocio(Long idSocio, List<Long> idsActividades);
}
