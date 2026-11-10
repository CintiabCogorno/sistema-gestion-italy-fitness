package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;

@Entity
@Table(name = "usuario")
public class Usuario extends Persona {

    // Identificador de negocio, distinto del id técnico heredado de Persona
    @Column(name = "id_usuario", unique = true)
    private Integer idUsuario;

    @Column(name = "nombre_usuario", nullable = false, unique = true, length = 30)
    private String nombreUsuario;

    @Column(nullable = false)
    private String contrasenia;

    @Column(nullable = false)
    private boolean activo;

    public Usuario() {
        super();
    }

    public Usuario(String nombre, String apellido, String dni, String telefono,
                    Integer idUsuario, String nombreUsuario, String contrasenia, boolean activo) {
        super(nombre, apellido, dni, telefono);
        this.idUsuario = idUsuario;
        this.nombreUsuario = nombreUsuario;
        this.contrasenia = contrasenia;
        this.activo = activo;
    }

    public void iniciarSesion() {
        // Lógica pendiente
    }

    public void cerrarSesion() {
        // Lógica pendiente
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
    }

    public String getContrasenia() {
        return contrasenia;
    }

    public void setContrasenia(String contrasenia) {
        this.contrasenia = contrasenia;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }
}
