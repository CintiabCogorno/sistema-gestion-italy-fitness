package com.gimnasio.italyFitnessGymControl.servicio;

/**
 * Error de regla de negocio de las ventas (sin stock, venta ya anulada, etc.).
 * El controlador la convierte en una respuesta HTTP con un mensaje para mostrar en pantalla.
 */
public class VentaException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public enum Tipo {
        NO_ENCONTRADA,    // 404
        DATOS_INVALIDOS,  // 400
        CONFLICTO         // 409
    }

    private final Tipo tipo;

    public VentaException(Tipo tipo, String mensaje) {
        super(mensaje);
        this.tipo = tipo;
    }

    public Tipo getTipo() {
        return tipo;
    }
}
