package com.gimnasio.italyFitnessGymControl.dto;

import com.gimnasio.italyFitnessGymControl.dominio.CategoriaCaja;
import com.gimnasio.italyFitnessGymControl.dominio.MovimientoCaja;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Lo que la pantalla de Caja necesita: los totales del período pedido, el desglose por
 * categoría, el saldo de toda la historia y la lista de movimientos.
 * Los movimientos anulados aparecen en la lista pero no entran en ningún total.
 */
public record CajaDTO(LocalDate desde,
                      LocalDate hasta,
                      BigDecimal totalIngresos,
                      BigDecimal totalEgresos,
                      BigDecimal saldo,
                      BigDecimal saldoTotal,
                      List<Categoria> categorias,
                      List<Movimiento> movimientos) {

    public record Categoria(String categoria, String etiqueta, String tipo,
                            BigDecimal total, int cantidad) {
    }

    public record Movimiento(Long idMovimiento,
                             LocalDate fecha,
                             String tipo,
                             String categoria,
                             String categoriaEtiqueta,
                             String concepto,
                             BigDecimal monto,
                             String medioPago,
                             String beneficiario,
                             String origen,
                             Long origenId,
                             Long idProducto,
                             Integer cantidad,
                             boolean anulado,
                             boolean anulable,
                             String registradoPor) {

        public static Movimiento de(MovimientoCaja m) {
            CategoriaCaja cat = m.getCategoria();
            return new Movimiento(
                    m.getIdMovimiento(),
                    m.getFecha(),
                    m.getTipo().name(),
                    cat.name(),
                    cat.getEtiqueta(),
                    m.getConcepto(),
                    m.getMonto(),
                    m.getMedioPago(),
                    m.getBeneficiario(),
                    m.getOrigen().name(),
                    m.getOrigenId(),
                    m.getIdProducto(),
                    m.getCantidad(),
                    m.isAnulado(),
                    // Los de pagos y ventas se anulan desde Pagos o Ventas; solo los manuales, acá
                    m.getOrigen() == com.gimnasio.italyFitnessGymControl.dominio.OrigenMovimiento.MANUAL
                            && !m.isAnulado(),
                    m.getRegistradoPor());
        }
    }
}
