package com.gimnasio.italyFitnessGymControl.servicio;

/** Error de negocio de usuarios y sesión; el controlador lo convierte en una respuesta con mensaje. */
public class UsuarioException extends RuntimeException {

    public enum Tipo {
        NO_AUTENTICADO, PROHIBIDO, NO_ENCONTRADO, DATOS_INVALIDOS, CONFLICTO, DEMASIADOS_INTENTOS
    }

    private final Tipo tipo;

    public UsuarioException(Tipo tipo, String mensaje) {
        super(mensaje);
        this.tipo = tipo;
    }

    public Tipo getTipo() {
        return tipo;
    }
}
