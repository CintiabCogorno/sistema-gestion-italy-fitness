package com.gimnasio.italyFitnessGymControl.dto;

import com.gimnasio.italyFitnessGymControl.dominio.DetalleVenta;
import com.gimnasio.italyFitnessGymControl.dominio.Socio;
import com.gimnasio.italyFitnessGymControl.dominio.Venta;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Lo que el backend le devuelve al frontend de una venta:
 * datos de la venta, nombre del socio (si hay) y el detalle de lo que se vendió.
 */
public record VentaDTO(Long idVenta,
                       LocalDateTime fecha,
                       BigDecimal total,
                       boolean anulada,
                       Long idSocio,
                       String nombreSocio,
                       List<Detalle> detalles) {

    public record Detalle(Long idDetalle,
                          Long idProducto,
                          String nombreProducto,
                          int cantidad,
                          BigDecimal precioUnitario,
                          BigDecimal subtotal) {

        static Detalle de(DetalleVenta detalle) {
            return new Detalle(
                    detalle.getIdDetalle(),
                    detalle.getProducto().getIdProducto(),
                    detalle.getProducto().getNombre(),
                    detalle.getCantidad(),
                    detalle.getPrecioUnitario(),
                    detalle.getSubtotal());
        }
    }

    public static VentaDTO de(Venta venta) {
        Socio socio = venta.getSocio();

        return new VentaDTO(
                venta.getIdVenta(),
                venta.getFecha(),
                venta.getTotal(),
                venta.isAnulada(),
                socio == null ? null : socio.getId(),
                socio == null ? null : socio.getNombre() + " " + socio.getApellido(),
                venta.getDetalles().stream().map(Detalle::de).toList());
    }
}
