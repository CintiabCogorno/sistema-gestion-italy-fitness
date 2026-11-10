package com.gimnasio.italyFitnessGymControl.seguridad;

import com.gimnasio.italyFitnessGymControl.dominio.Administrador;
import com.gimnasio.italyFitnessGymControl.dominio.Recepcionista;
import com.gimnasio.italyFitnessGymControl.dominio.Usuario;

/**
 * Los dos tipos de usuario del sistema. El rol no se guarda como un dato aparte:
 * sale de la clase del usuario (Administrador o Recepcionista).
 */
public enum Rol {
    ADMINISTRADOR("Administrador"),
    RECEPCIONISTA("Recepcionista");

    private final String etiqueta;

    Rol(String etiqueta) {
        this.etiqueta = etiqueta;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    /** Devuelve el rol de un usuario, o null si no es ni administrador ni recepcionista. */
    public static Rol de(Usuario usuario) {
        if (usuario instanceof Administrador) {
            return ADMINISTRADOR;
        }
        if (usuario instanceof Recepcionista) {
            return RECEPCIONISTA;
        }
        return null;
    }
}
