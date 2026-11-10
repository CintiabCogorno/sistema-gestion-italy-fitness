package com.gimnasio.italyFitnessGymControl.servicio;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Al arrancar, carga en la caja los pagos y ventas que ya estaban en la base antes de que
 * existiera Caja. Es seguro correrlo siempre: solo agrega los que todavía no están.
 */
@Component
public class CajaInicializador implements ApplicationRunner {

    private final ICajaService cajaServ;

    public CajaInicializador(ICajaService cajaServ) {
        this.cajaServ = cajaServ;
    }

    @Override
    public void run(ApplicationArguments args) {
        int agregados = cajaServ.sincronizarHistorico();
        if (agregados > 0) {
            System.out.println("Caja: se cargaron " + agregados + " movimientos de pagos y ventas anteriores.");
        }
    }
}
