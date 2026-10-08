package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "acceso")
public class Acceso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idAcceso;

    @Column(name = "fecha_hora", nullable = false)
    private LocalDateTime fechaHora;

    @Column(nullable = false)
    private boolean permitido;

    @Column(length = 100)
    private String motivo;

    // TODO: cuando agreguemos las relaciones, acá va la referencia al Socio (quien ingresa con su DNI)

    public Acceso() {
    }

    public Acceso(LocalDateTime fechaHora, boolean permitido, String motivo) {
        this.fechaHora = fechaHora;
        this.permitido = permitido;
        this.motivo = motivo;
    }

    public Long getIdAcceso() {
        return idAcceso;
    }

    public void setIdAcceso(Long idAcceso) {
        this.idAcceso = idAcceso;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    public boolean isPermitido() {
        return permitido;
    }

    public void setPermitido(boolean permitido) {
        this.permitido = permitido;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }
}
