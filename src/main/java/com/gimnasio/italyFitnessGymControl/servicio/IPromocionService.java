package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dto.PromocionDTO;
import com.gimnasio.italyFitnessGymControl.dto.PromocionRequestDTO;

import java.util.List;

public interface IPromocionService {

    // READ
    List<PromocionDTO> traerPromociones();

    // READ: las que se pueden aplicar hoy a una cuota
    List<PromocionDTO> traerVigentes();

    // CREATE
    PromocionDTO crearPromocion(PromocionRequestDTO datos);

    // UPDATE
    PromocionDTO editarPromocion(Long id, PromocionRequestDTO datos);

    // BAJA LÓGICA: la deja inactiva (no se borra, porque pudo aplicarse a pagos ya registrados)
    PromocionDTO desactivarPromocion(Long id);
}
