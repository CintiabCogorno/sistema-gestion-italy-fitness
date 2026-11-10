package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Actividad;
import com.gimnasio.italyFitnessGymControl.dominio.Socio;
import com.gimnasio.italyFitnessGymControl.dto.ActividadDTO;
import com.gimnasio.italyFitnessGymControl.dto.ActividadRequestDTO;
import com.gimnasio.italyFitnessGymControl.repositorio.IActividadRepository;
import com.gimnasio.italyFitnessGymControl.repositorio.ISocioRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static com.gimnasio.italyFitnessGymControl.servicio.ActividadException.Tipo.CONFLICTO;
import static com.gimnasio.italyFitnessGymControl.servicio.ActividadException.Tipo.DATOS_INVALIDOS;
import static com.gimnasio.italyFitnessGymControl.servicio.ActividadException.Tipo.NO_ENCONTRADA;

@Service
public class ActividadService implements IActividadService {

    private final IActividadRepository actividadRepo;
    private final ISocioRepository socioRepo;

    public ActividadService(IActividadRepository actividadRepo, ISocioRepository socioRepo) {
        this.actividadRepo = actividadRepo;
        this.socioRepo = socioRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActividadDTO> traerActividades() {
        return actividadRepo.traerTodasConSocios().stream()
                .map(ActividadDTO::de)
                .toList();
    }

    @Override
    @Transactional
    public ActividadDTO crearActividad(ActividadRequestDTO datos) {
        validar(datos, null);

        Actividad actividad = new Actividad(
                datos.nombre().trim(),
                limpiar(datos.descripcion()),
                datos.precioCuota(),
                datos.disponible() == null || datos.disponible());

        return ActividadDTO.de(actividadRepo.save(actividad));
    }

    @Override
    @Transactional
    public ActividadDTO editarActividad(Long id, ActividadRequestDTO datos) {
        Actividad actividad = buscar(id);
        validar(datos, id);

        actividad.setNombre(datos.nombre().trim());
        actividad.setDescripcion(limpiar(datos.descripcion()));
        actividad.setPrecioCuota(datos.precioCuota());
        if (datos.disponible() != null) {
            actividad.setDisponible(datos.disponible());
        }

        return ActividadDTO.de(actividadRepo.save(actividad));
    }

    @Override
    @Transactional
    public void eliminarActividad(Long id) {
        Actividad actividad = buscar(id);

        int inscriptos = actividad.getSocios().size();
        if (inscriptos > 0) {
            throw new ActividadException(CONFLICTO,
                    "No se puede eliminar: tiene " + inscriptos + " socio(s) inscripto(s). "
                            + "Marcala como no disponible para que no se pueda asignar más.");
        }

        actividadRepo.delete(actividad);
    }

    @Override
    @Transactional
    public List<Long> asignarActividadesASocio(Long idSocio, List<Long> idsActividades) {
        Socio socio = socioRepo.findById(idSocio)
                .orElseThrow(() -> new ActividadException(NO_ENCONTRADA, "El socio no existe."));

        Set<Long> pedidas = (idsActividades == null) ? Set.of() : new HashSet<>(idsActividades);

        List<Actividad> elegidas = actividadRepo.findAllById(pedidas);
        if (elegidas.size() != pedidas.size()) {
            throw new ActividadException(DATOS_INVALIDOS, "Alguna de las actividades elegidas no existe.");
        }

        Set<Long> actuales = socio.getActividades().stream()
                .map(Actividad::getIdActividad)
                .collect(Collectors.toSet());

        // No se puede sumar a un socio a una actividad que no está disponible
        for (Actividad actividad : elegidas) {
            if (!actividad.estaDisponible() && !actuales.contains(actividad.getIdActividad())) {
                throw new ActividadException(DATOS_INVALIDOS,
                        "La actividad \"" + actividad.getNombre() + "\" no está disponible.");
            }
        }

        socio.getActividades().retainAll(elegidas);   // saca las que ya no hace
        socio.getActividades().addAll(elegidas);      // suma las nuevas
        socioRepo.save(socio);

        return pedidas.stream().sorted().toList();
    }

    // ---------- Auxiliares ----------

    private Actividad buscar(Long id) {
        return actividadRepo.findById(id)
                .orElseThrow(() -> new ActividadException(NO_ENCONTRADA, "La actividad no existe."));
    }

    private void validar(ActividadRequestDTO datos, Long idActual) {
        if (datos == null || datos.nombre() == null || datos.nombre().isBlank()) {
            throw new ActividadException(DATOS_INVALIDOS, "El nombre de la actividad es obligatorio.");
        }

        String nombre = datos.nombre().trim();
        if (nombre.length() > 50) {
            throw new ActividadException(DATOS_INVALIDOS, "El nombre no puede superar los 50 caracteres.");
        }
        if (datos.descripcion() != null && datos.descripcion().trim().length() > 200) {
            throw new ActividadException(DATOS_INVALIDOS, "La descripción no puede superar los 200 caracteres.");
        }
        if (datos.precioCuota() == null || datos.precioCuota().compareTo(BigDecimal.ZERO) <= 0) {
            throw new ActividadException(DATOS_INVALIDOS, "El precio de la cuota debe ser mayor a 0.");
        }

        boolean repetido = (idActual == null)
                ? actividadRepo.existsByNombreIgnoreCase(nombre)
                : actividadRepo.existsByNombreIgnoreCaseAndIdActividadNot(nombre, idActual);
        if (repetido) {
            throw new ActividadException(DATOS_INVALIDOS, "Ya existe una actividad con ese nombre.");
        }
    }

    private static String limpiar(String texto) {
        return (texto == null || texto.isBlank()) ? null : texto.trim();
    }
}
