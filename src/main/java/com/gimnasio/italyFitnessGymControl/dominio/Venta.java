package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "venta")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idVenta;

    @Column(nullable = false)
    private LocalDateTime fecha;

    @Column(nullable = false)
    private BigDecimal total;

    // TODO: cuando agreguemos las relaciones, acá van:
    //  - la lista de DetalleVenta (@OneToMany)
    //  - el Socio comprador, opcional (@ManyToOne)
    //  - el Usuario que registró la venta (@ManyToOne)

    public Venta() {
    }

    public Venta(LocalDateTime fecha, BigDecimal total) {
        this.fecha = fecha;
        this.total = total;
    }

    public void calcularTotal() {
        // Lógica pendiente: sumar los subtotales de cada DetalleVenta una vez esté la relación
    }

    public void agregarDetalle(DetalleVenta detalle) {
        // Lógica pendiente: depende de la lista de detalles (relación aún no definida)
    }

    public Long getIdVenta() {
        return idVenta;
    }

    public void setIdVenta(Long idVenta) {
        this.idVenta = idVenta;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}
