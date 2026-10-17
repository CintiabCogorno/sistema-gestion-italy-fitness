package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "socio")
public class Socio extends Persona {

    @Column(name = "fecha_alta", nullable = false)
    private LocalDate fechaAlta;

    @Column(nullable = false, length = 20)
    private String estado; // ACTIVO, INACTIVO



    @OneToMany(mappedBy = "socio")
    private List<Pago> pagos = new ArrayList<>();


    @OneToMany(mappedBy = "socio")
    private List<Acceso> accesos = new ArrayList<>();


    public Socio() {
        super();
    }

    public Socio(String nombre, String apellido, String dni, String telefono,
                 LocalDate fechaAlta, String estado) {
        super(nombre, apellido, dni, telefono);
        this.fechaAlta = fechaAlta;
        this.estado = estado;
    }

    public List<Pago> getPagos() {
        return pagos;
    }

    public void setPagos(List<Pago> pagos) {
        this.pagos = pagos;
    }

    public List<Acceso> getAccesos() {
        return accesos;
    }

    public void setAccesos(List<Acceso> accesos) {
        this.accesos = accesos;
    }

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
