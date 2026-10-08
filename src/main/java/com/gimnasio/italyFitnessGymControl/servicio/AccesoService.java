package com.gimnasio.italyFitnessGymControl.servicio;


import com.gimnasio.italyFitnessGymControl.dominio.Acceso;
import com.gimnasio.italyFitnessGymControl.repositorio.IAccesoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccesoService implements IAccesoService {

    private final IAccesoRepository accesoRepository;

    public AccesoService (IAccesoRepository accesoRepository) {
        this.accesoRepository = accesoRepository;
    }

    @Override
    public Acceso registrarAcceso(Acceso acceso) {
        // La fecha/hora la pone el servidor, no se confía en lo que mande el cliente
        acceso.setFechaHora(LocalDateTime.now());
        return accesoRepository.save(acceso);
    }

    @Override
    public List<Acceso> traerAccesos() {
        return accesoRepository.findAll();
    }

    @Override
    public List<Acceso> traerAccesosDenegados() {
        return accesoRepository.findByPermitidoFalse();
    }

    @Override
    public List<Acceso> traerAccesosPorRango(LocalDateTime desde, LocalDateTime hasta) {
        return accesoRepository.findByFechaHoraBetween(desde, hasta);
    }

    @Override
    public Acceso buscarAcceso(Long id) {
        return accesoRepository.findById(id).orElse(null);
    }

    @Override
    public boolean eliminarAcceso(Long id) {
        if (!accesoRepository.existsById(id)) {
            return false;
        }
        accesoRepository.deleteById(id);
        return true;
    }
}

