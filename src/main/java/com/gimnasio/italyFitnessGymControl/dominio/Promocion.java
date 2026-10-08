package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "promocion")
public class Promocion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPromocion;

    @Column(nullable = false, length = 100)
    private String descripcion;

    @Column(name = "porcentaje_descuento", nullable = false)
    private BigDecimal porcentajeDescuento;

    @Column(name = "fecha_inicio", nullable = false)
    private LocalDate fechaInicio;

    @Column(name = "fecha_fin", nullable = false)
    private LocalDate fechaFin;

    @Column(nullable = false)
    private boolean activa;

    // TODO: cuando agreguemos las relaciones, acá va la lista de Pago (cuotas donde se aplicó esta promoción)

    public Promocion() {
    }

    public Promocion(String descripcion, BigDecimal porcentajeDescuento,
                      LocalDate fechaInicio, LocalDate fechaFin, boolean activa) {
        this.descripcion = descripcion;
        this.porcentajeDescuento = porcentajeDescuento;
        this.fechaInicio = fechaInicio;
        this.fechaFin = fechaFin;
        this.activa = activa;
    }

    public boolean estaVigente() {
        LocalDate hoy = LocalDate.now();
        return activa && !hoy.isBefore(fechaInicio) && !hoy.isAfter(fechaFin);
    }

    public BigDecimal aplicarDescuento(BigDecimal precio) {
        if (!estaVigente()) {
            return precio;
        }
        BigDecimal descuento = precio.multiply(porcentajeDescuento)
                .divide(BigDecimal.valueOf(100));
        return precio.subtract(descuento);
    }

    public Long getIdPromocion() {
        return idPromocion;
    }

    public void setIdPromocion(Long idPromocion) {
        this.idPromocion = idPromocion;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public BigDecimal getPorcentajeDescuento() {
        return porcentajeDescuento;
    }

    public void setPorcentajeDescuento(BigDecimal porcentajeDescuento) {
        this.porcentajeDescuento = porcentajeDescuento;
    }

    public LocalDate getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDate fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDate getFechaFin() {
        return fechaFin;
    }

    public void setFechaFin(LocalDate fechaFin) {
        this.fechaFin = fechaFin;
    }

    public boolean isActiva() {
        return activa;
    }

    public void setActiva(boolean activa) {
        this.activa = activa;
    }
}
