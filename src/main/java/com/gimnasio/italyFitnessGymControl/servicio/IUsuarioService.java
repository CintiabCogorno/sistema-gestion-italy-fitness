package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dto.UsuarioDTO;
import com.gimnasio.italyFitnessGymControl.dto.UsuarioRequestDTO;

import java.util.List;

public interface IUsuarioService {

    List<UsuarioDTO> traerUsuarios();

    /** Crea un usuario recepcionista. El administrador es único y no se crea desde acá. */
    UsuarioDTO crearRecepcionista(UsuarioRequestDTO datos);

    /** Activa o desactiva a un recepcionista (un desactivado no puede iniciar sesión). */
    UsuarioDTO cambiarEstado(Long id, boolean activo);

    /** El administrador define una clave nueva para un recepcionista. */
    void restablecerClave(Long id, String nueva);
}
