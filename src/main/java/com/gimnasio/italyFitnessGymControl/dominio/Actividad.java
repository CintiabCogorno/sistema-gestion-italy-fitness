package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "actividad")
public class Actividad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idActividad;

    @Column(nullable = false, length = 50)
    private String nombre;

    @Column(length = 200)
    private String descripcion;

    @Column(name = "precio_cuota", nullable = false)
    private BigDecimal precioCuota;

    @Column(nullable = false)
    private boolean disponible;

    // TODO: cuando agreguemos las relaciones, acá van la lista de Socio (inscriptos) y de Pago

    public Actividad() {
    }

    public Actividad(String nombre, String descripcion, BigDecimal precioCuota, boolean disponible) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precioCuota = precioCuota;
        this.disponible = disponible;
    }

    public boolean estaDisponible() {
        return disponible;
    }

    public Long getIdActividad() {
        return idActividad;
    }

    public void setIdActividad(Long idActividad) {
        this.idActividad = idActividad;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPrecioCuota() {
        return precioCuota;
    }

    public void setPrecioCuota(BigDecimal precioCuota) {
        this.precioCuota = precioCuota;
    }

    public void setDisponible(boolean disponible) {
        this.disponible = disponible;
    }
}
