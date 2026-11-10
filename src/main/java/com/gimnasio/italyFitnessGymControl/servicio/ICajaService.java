package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Pago;
import com.gimnasio.italyFitnessGymControl.dominio.Venta;
import com.gimnasio.italyFitnessGymControl.dto.CajaDTO;
import com.gimnasio.italyFitnessGymControl.dto.EgresoRequestDTO;

import java.time.LocalDate;

public interface ICajaService {

    /** Totales, desglose y movimientos del período (desde/hasta pueden ser null = sin límite). */
    CajaDTO consultar(LocalDate desde, LocalDate hasta);

    /** Registra un egreso a mano (compra de productos, sueldo u otro gasto). */
    CajaDTO.Movimiento registrarEgreso(EgresoRequestDTO datos, String registradoPor);

    /** Anula un egreso cargado a mano. Los de pagos y ventas se anulan desde sus pantallas. */
    CajaDTO.Movimiento anularMovimiento(Long id);

    /** Deja la caja al día con este pago: lo crea, lo actualiza o lo marca como anulado. */
    void sincronizarCuota(Pago pago);

    /** Deja la caja al día con esta venta: la crea o la marca como anulada. */
    void sincronizarVenta(Venta venta);

    /** Carga en la caja los pagos y ventas que existían antes de tener Caja. Devuelve cuántos agregó. */
    int sincronizarHistorico();
}
