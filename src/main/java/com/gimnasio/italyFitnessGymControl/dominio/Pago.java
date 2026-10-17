package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "pago")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPago;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDate fechaPago;

    @Column(name = "valor_cuota", nullable = false)
    private BigDecimal valorCuota;

    @Column(name = "medio_pago", nullable = false, length = 20)
    private String medioPago;

    @Column(nullable = false)
    private boolean anulado;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "socio_id")
    private Socio socio;

    public Socio getSocio() {
        return socio;
    }

    public void setSocio(Socio socio) {
        this.socio = socio;
    }


    public Pago() {
    }

    public Pago(LocalDate fechaPago, BigDecimal valorCuota, String medioPago) {
        this.fechaPago = fechaPago;
        this.valorCuota = valorCuota;
        this.medioPago = medioPago;
        this.anulado = false;
    }

    public boolean estaVencido() {
        // Lógica pendiente: comparar fechaPago + período de vigencia contra la fecha actual
        return false;
    }

    public Long getIdPago() {
        return idPago;
    }

    public void setIdPago(Long idPago) {
        this.idPago = idPago;
    }

    public LocalDate getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDate fechaPago) {
        this.fechaPago = fechaPago;
    }

    public BigDecimal getValorCuota() {
        return valorCuota;
    }

    public void setValorCuota(BigDecimal valorCuota) {
        this.valorCuota = valorCuota;
    }

    public String getMedioPago() {
        return medioPago;
    }

    public void setMedioPago(String medioPago) {
        this.medioPago = medioPago;
    }

    public boolean isAnulado() {
        return anulado;
    }

    public void setAnulado(boolean anulado) {
        this.anulado = anulado;
    }
}
