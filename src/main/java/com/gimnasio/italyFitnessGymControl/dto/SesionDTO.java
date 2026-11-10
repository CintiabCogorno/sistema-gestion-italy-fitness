package com.gimnasio.italyFitnessGymControl.dto;

import com.gimnasio.italyFitnessGymControl.seguridad.SesionUsuario;

/** Lo que ve la pantalla de quien inició sesión (nunca incluye la contraseña). */
public record SesionDTO(String nombreUsuario, String nombre, String rol, String rolEtiqueta) {

    public static SesionDTO de(SesionUsuario s) {
        return new SesionDTO(s.nombreUsuario(), s.nombre(), s.rol().name(), s.rol().getEtiqueta());
    }
}
