package com.gimnasio.italyFitnessGymControl.dto;

import com.gimnasio.italyFitnessGymControl.dominio.Usuario;
import com.gimnasio.italyFitnessGymControl.seguridad.Rol;

/** Usuario del sistema para mostrar en pantalla. No incluye la contraseña. */
public record UsuarioDTO(Long id, String nombre, String apellido, String dni, String telefono,
                         String nombreUsuario, String rol, String rolEtiqueta, boolean activo) {

    public static UsuarioDTO de(Usuario u) {
        Rol rol = Rol.de(u);
        return new UsuarioDTO(u.getId(), u.getNombre(), u.getApellido(), u.getDni(), u.getTelefono(),
                u.getNombreUsuario(), rol == null ? null : rol.name(),
                rol == null ? null : rol.getEtiqueta(), u.isActivo());
    }
}
