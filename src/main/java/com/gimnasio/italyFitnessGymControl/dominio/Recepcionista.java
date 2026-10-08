package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;

@Entity
@Table(name = "recepcionista")
public class Recepcionista extends Usuario {

    public Recepcionista() {
        super();
    }

    public Recepcionista(String nombre, String apellido, String dni, String telefono,
                          Integer idUsuario, String nombreUsuario, String contrasenia, boolean activo) {
        super(nombre, apellido, dni, telefono, idUsuario, nombreUsuario, contrasenia, activo);
    }

    public void registrarSocio(Socio socio) {
        // Lógica pendiente
    }

    public void registrarPago(Pago pago) {
        // Lógica pendiente
    }

    public void registrarAcceso(Acceso acceso) {
        // Lógica pendiente
    }

    public void registrarVenta(Venta venta) {
        // Lógica pendiente
    }
}
