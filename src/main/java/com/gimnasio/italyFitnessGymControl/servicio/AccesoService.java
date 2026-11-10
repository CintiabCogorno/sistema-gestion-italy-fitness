package com.gimnasio.italyFitnessGymControl.servicio;


import com.gimnasio.italyFitnessGymControl.dominio.Acceso;
import com.gimnasio.italyFitnessGymControl.dominio.Socio;
import com.gimnasio.italyFitnessGymControl.repositorio.IAccesoRepository;
import com.gimnasio.italyFitnessGymControl.repositorio.ISocioRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;


@Service
public class AccesoService implements IAccesoService {

    private final IAccesoRepository accesoRepository;
    private final IPagoService pagoServ;
    private final ISocioRepository socioRepository;

    public AccesoService(
            IAccesoRepository accesoRepository,
            IPagoService pagoServ,
            ISocioRepository socioRepository) {
        this.accesoRepository = accesoRepository;
        this.pagoServ = pagoServ;
        this.socioRepository = socioRepository;
    }

    @Override
    public Acceso registrarAcceso(Acceso acceso, Long idSocio) {

        // Buscar al socio
        Socio socio = socioRepository.findById(idSocio)
                .orElseThrow(() ->
                        new RuntimeException("No se encuentra el socio"));

        // Asociar el socio al registro de acceso
        acceso.setSocio(socio);

        // La fecha y hora las establece el servidor
        acceso.setFechaHora(LocalDateTime.now());

        // Validar la vigencia de la cuota
        boolean cuotaVigente = pagoServ.tieneCuotaVigente(idSocio);

        acceso.setPermitido(cuotaVigente);

        if (cuotaVigente) {
            acceso.setMotivo("Acceso permitido: cuota vigente");
        } else {
            acceso.setMotivo("Acceso denegado: cuota vencida o inexistente");
        }

        // Guardar el intento de acceso
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
    public List<Acceso> traerAccesosPorRango(
            LocalDateTime desde,
            LocalDateTime hasta) {
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
