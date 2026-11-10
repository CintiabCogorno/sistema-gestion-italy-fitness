package com.gimnasio.italyFitnessGymControl.seguridad;

import java.io.Serializable;

/** Lo que se guarda en la sesión del servidor cuando alguien inicia sesión. */
public record SesionUsuario(Long id, String nombreUsuario, String nombre, Rol rol) implements Serializable {

    public static final String ATRIBUTO = "usuarioActual";
}
