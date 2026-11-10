package com.gimnasio.italyFitnessGymControl.dominio;

public enum CategoriaCaja {
    CUOTA(TipoMovimiento.INGRESO, "Cuota de socio"),
    VENTA(TipoMovimiento.INGRESO, "Venta del store"),
    COMPRA_PRODUCTOS(TipoMovimiento.EGRESO, "Compra de productos"),
    SUELDO_PROFESOR(TipoMovimiento.EGRESO, "Sueldo de profesor"),
    SUELDO_RECEPCIONISTA(TipoMovimiento.EGRESO, "Sueldo de recepcionista"),
    OTRO_EGRESO(TipoMovimiento.EGRESO, "Otro gasto");

    private final TipoMovimiento tipo;
    private final String etiqueta;

    CategoriaCaja(TipoMovimiento tipo, String etiqueta) {
        this.tipo = tipo;
        this.etiqueta = etiqueta;
    }

    public TipoMovimiento getTipo() {
        return tipo;
    }

    public String getEtiqueta() {
        return etiqueta;
    }

    public boolean esSueldo() {
        return this == SUELDO_PROFESOR || this == SUELDO_RECEPCIONISTA;
    }
}
