package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Promocion;
import com.gimnasio.italyFitnessGymControl.dto.PromocionDTO;
import com.gimnasio.italyFitnessGymControl.dto.PromocionRequestDTO;
import com.gimnasio.italyFitnessGymControl.repositorio.IPromocionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

import static com.gimnasio.italyFitnessGymControl.servicio.PromocionException.Tipo.DATOS_INVALIDOS;
import static com.gimnasio.italyFitnessGymControl.servicio.PromocionException.Tipo.NO_ENCONTRADA;

@Service
public class PromocionService implements IPromocionService {

    private static final BigDecimal CIEN = BigDecimal.valueOf(100);

    private final IPromocionRepository promocionRepo;

    public PromocionService(IPromocionRepository promocionRepo) {
        this.promocionRepo = promocionRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromocionDTO> traerPromociones() {
        return promocionRepo.findAllByOrderByFechaInicioDesc().stream()
                .map(PromocionDTO::de)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PromocionDTO> traerVigentes() {
        LocalDate hoy = LocalDate.now();
        return promocionRepo
                .findByActivaTrueAndFechaInicioLessThanEqualAndFechaFinGreaterThanEqualOrderByDescripcion(hoy, hoy)
                .stream()
                .map(PromocionDTO::de)
                .toList();
    }

    @Override
    @Transactional
    public PromocionDTO crearPromocion(PromocionRequestDTO datos) {
        validar(datos);

        Promocion promocion = new Promocion(
                datos.descripcion().trim(),
                datos.porcentajeDescuento().setScale(2, RoundingMode.HALF_UP),
                datos.fechaInicio(),
                datos.fechaFin(),
                datos.activa() == null || datos.activa());

        return PromocionDTO.de(promocionRepo.save(promocion));
    }

    @Override
    @Transactional
    public PromocionDTO editarPromocion(Long id, PromocionRequestDTO datos) {
        Promocion promocion = buscar(id);
        validar(datos);

        promocion.setDescripcion(datos.descripcion().trim());
        promocion.setPorcentajeDescuento(datos.porcentajeDescuento().setScale(2, RoundingMode.HALF_UP));
        promocion.setFechaInicio(datos.fechaInicio());
        promocion.setFechaFin(datos.fechaFin());
        if (datos.activa() != null) {
            promocion.setActiva(datos.activa());
        }

        return PromocionDTO.de(promocionRepo.save(promocion));
    }

    @Override
    @Transactional
    public PromocionDTO desactivarPromocion(Long id) {
        Promocion promocion = buscar(id);
        promocion.setActiva(false);
        return PromocionDTO.de(promocionRepo.save(promocion));
    }

    // ---------- Auxiliares ----------

    private Promocion buscar(Long id) {
        return promocionRepo.findById(id)
                .orElseThrow(() -> new PromocionException(NO_ENCONTRADA, "La promoción no existe."));
    }

    private void validar(PromocionRequestDTO datos) {
        if (datos == null || datos.descripcion() == null || datos.descripcion().isBlank()) {
            throw new PromocionException(DATOS_INVALIDOS, "La descripción de la promoción es obligatoria.");
        }
        if (datos.descripcion().trim().length() > 100) {
            throw new PromocionException(DATOS_INVALIDOS, "La descripción no puede superar los 100 caracteres.");
        }
        if (datos.porcentajeDescuento() == null
                || datos.porcentajeDescuento().compareTo(BigDecimal.ZERO) <= 0
                || datos.porcentajeDescuento().compareTo(CIEN) > 0) {
            throw new PromocionException(DATOS_INVALIDOS, "El descuento debe ser mayor a 0 y hasta 100 %.");
        }
        if (datos.fechaInicio() == null || datos.fechaFin() == null) {
            throw new PromocionException(DATOS_INVALIDOS, "Las fechas de inicio y de fin son obligatorias.");
        }
        if (datos.fechaFin().isBefore(datos.fechaInicio())) {
            throw new PromocionException(DATOS_INVALIDOS, "La fecha de fin no puede ser anterior a la de inicio.");
        }
    }
}
