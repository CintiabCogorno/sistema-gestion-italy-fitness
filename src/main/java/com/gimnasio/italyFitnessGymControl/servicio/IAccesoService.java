package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Acceso;

import java.time.LocalDateTime;
import java.util.List;

public interface IAccesoService {

    Acceso registrarAcceso(Acceso acceso, Long idSocio);
    List<Acceso> traerAccesos();
    List<Acceso> traerAccesosDenegados();
    List<Acceso> traerAccesosPorRango(LocalDateTime desde, LocalDateTime hasta);
    Acceso buscarAcceso(Long id);
    boolean eliminarAcceso(Long id);
}
