package com.gimnasio.italyFitnessGymControl.dominio;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

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

    // Compras del socio (se ocultan en el JSON para no devolver todo el historial en /socios)
    @OneToMany(mappedBy = "socio")
    @JsonIgnore
    private List<Venta> ventas = new ArrayList<>();

    // Actividades que realiza el socio (musculación, yoga, etc.). Se guarda en la tabla "socio_actividad".
    @ManyToMany
    @JoinTable(
            name = "socio_actividad",
            joinColumns = @JoinColumn(name = "id_socio"),
            inverseJoinColumns = @JoinColumn(name = "id_actividad")
    )
    @JsonIgnore
    private Set<Actividad> actividades = new HashSet<>();


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

    public List<Venta> getVentas() {
        return ventas;
    }

    public void setVentas(List<Venta> ventas) {
        this.ventas = ventas;
    }

    public List<Acceso> getAccesos() {
        return accesos;
    }

    public void setAccesos(List<Acceso> accesos) {
        this.accesos = accesos;
    }

    public Set<Actividad> getActividades() {
        return actividades;
    }

    public void setActividades(Set<Actividad> actividades) {
        this.actividades = actividades;
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
