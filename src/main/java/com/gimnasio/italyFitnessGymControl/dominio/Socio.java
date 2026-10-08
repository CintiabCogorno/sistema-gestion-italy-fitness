package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "socio")
public class Socio extends Persona {

    @Column(name = "fecha_alta", nullable = false)
    private LocalDate fechaAlta;

    @Column(nullable = false, length = 20)
    private String estado; // ACTIVO, INACTIVO

    public Socio() {
        super();
    }

    public Socio(String nombre, String apellido, String dni, String telefono,
                 LocalDate fechaAlta, String estado) {
        super(nombre, apellido, dni, telefono);
        this.fechaAlta = fechaAlta;
        this.estado = estado;
    }

    // TODO: cuando agreguemos las relaciones, acá van las listas de Pago y Acceso

    public boolean puedeIngresar() {
        // Lógica pendiente: dependerá de la relación con Pago (última cuota vigente)
        return false;
    }

    public LocalDate getFechaAlta() {
        return fechaAlta;
    }

    public void setFechaAlta(LocalDate fechaAlta) {
        this.fechaAlta = fechaAlta;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }
}
