package com.gimnasio.italyFitnessGymControl.dto;

/** Datos para crear un usuario recepcionista. */
public record UsuarioRequestDTO(String nombre, String apellido, String dni, String telefono,
                                String nombreUsuario, String clave) {
}
