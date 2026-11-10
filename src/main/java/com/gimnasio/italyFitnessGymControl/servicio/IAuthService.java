package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.seguridad.SesionUsuario;

public interface IAuthService {

    /** Valida usuario y contraseña. Si son correctos devuelve los datos de la sesión. */
    SesionUsuario autenticar(String nombreUsuario, String clave);

    /** Cambia la contraseña de quien tiene la sesión iniciada. */
    void cambiarClavePropia(Long idUsuario, String actual, String nueva);

    /** Indica si el usuario sigue existiendo y activo (si lo desactivaron, se le corta la sesión). */
    boolean sigueActivo(Long idUsuario);
}
