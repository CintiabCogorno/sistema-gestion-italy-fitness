package com.gimnasio.italyFitnessGymControl.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public class PagoDTO {
    private Long idPago;
    private LocalDate fechaPago;
    private BigDecimal valorCuota;
    private String medioPago;
    private boolean anulado;

    private Long idSocio;
    private String nombreSocio;

    public PagoDTO() {
    }

    public PagoDTO(Long idPago, LocalDate fechaPago, BigDecimal valorCuota, String medioPago, boolean anulado, Long idSocio, String nombreSocio) {
        this.idPago = idPago;
        this.fechaPago = fechaPago;
        this.valorCuota = valorCuota;
        this.medioPago = medioPago;
        this.anulado = anulado;
        this.idSocio = idSocio;
        this.nombreSocio = nombreSocio;
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

    public Long getIdSocio() {
        return idSocio;
    }

    public void setIdSocio(Long idSocio) {
        this.idSocio = idSocio;
    }

    public String getNombreSocio() {
        return nombreSocio;
    }

    public void setNombreSocio(String nombreSocio) {
        this.nombreSocio = nombreSocio;
    }
}
