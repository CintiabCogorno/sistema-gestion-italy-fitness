package com.gimnasio.italyFitnessGymControl.servicio;

/** Error de negocio de la caja, con un mensaje listo para mostrar en pantalla. */
public class CajaException extends RuntimeException {

    public enum Tipo {NO_ENCONTRADO, DATOS_INVALIDOS, CONFLICTO}

    private final Tipo tipo;

    public CajaException(Tipo tipo, String mensaje) {
        super(mensaje);
        this.tipo = tipo;
    }

    public Tipo getTipo() {
        return tipo;
    }
}
