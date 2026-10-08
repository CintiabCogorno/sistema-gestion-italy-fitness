package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;

@Entity
@Table(name = "administrador")
public class Administrador extends Usuario {

    public Administrador() {
        super();
    }

    public Administrador(String nombre, String apellido, String dni, String telefono,
                          Integer idUsuario, String nombreUsuario, String contrasenia, boolean activo) {
        super(nombre, apellido, dni, telefono, idUsuario, nombreUsuario, contrasenia, activo);
    }

    public void gestionarUsuarios() {
        // Lógica pendiente
    }

    public void generarReportes() {
        // Lógica pendiente
    }

    public void cargarStock(Producto producto, int cantidad) {
        producto.aumentarStock(cantidad);
    }

    public void gestionarPromociones() {
        // Lógica pendiente: crear, activar o desactivar promociones
    }

    public void gestionarActividades() {
        // Lógica pendiente: crear, modificar o marcar actividades como no disponibles
    }
}
