package com.gimnasio.italyFitnessGymControl.servicio;

/**
 * Error de regla de negocio de las actividades. El controlador la convierte
 * en una respuesta HTTP con un mensaje claro para mostrar en pantalla.
 */
public class ActividadException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public enum Tipo {
        NO_ENCONTRADA,    // 404
        DATOS_INVALIDOS,  // 400
        CONFLICTO         // 409
    }

    private final Tipo tipo;

    public ActividadException(Tipo tipo, String mensaje) {
        super(mensaje);
        this.tipo = tipo;
    }

    public Tipo getTipo() {
        return tipo;
    }
}
