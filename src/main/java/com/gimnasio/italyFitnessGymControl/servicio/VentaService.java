package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.DetalleVenta;
import com.gimnasio.italyFitnessGymControl.dominio.Producto;
import com.gimnasio.italyFitnessGymControl.dominio.Socio;
import com.gimnasio.italyFitnessGymControl.dominio.Venta;
import com.gimnasio.italyFitnessGymControl.dto.VentaDTO;
import com.gimnasio.italyFitnessGymControl.dto.VentaRequestDTO;
import com.gimnasio.italyFitnessGymControl.repositorio.IProductoRepository;
import com.gimnasio.italyFitnessGymControl.repositorio.ISocioRepository;
import com.gimnasio.italyFitnessGymControl.repositorio.IVentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.gimnasio.italyFitnessGymControl.servicio.VentaException.Tipo.CONFLICTO;
import static com.gimnasio.italyFitnessGymControl.servicio.VentaException.Tipo.DATOS_INVALIDOS;
import static com.gimnasio.italyFitnessGymControl.servicio.VentaException.Tipo.NO_ENCONTRADA;

@Service
public class VentaService implements IVentaService {

    private final IVentaRepository ventaRepo;
    private final IProductoRepository productoRepo;
    private final ISocioRepository socioRepo;

    public VentaService(IVentaRepository ventaRepo,
                        IProductoRepository productoRepo,
                        ISocioRepository socioRepo) {
        this.ventaRepo = ventaRepo;
        this.productoRepo = productoRepo;
        this.socioRepo = socioRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<VentaDTO> traerVentas() {
        return ventaRepo.traerTodasConDetalle().stream()
                .map(VentaDTO::de)
                .toList();
    }

    // Si algo falla (por ejemplo falta stock de un producto), se deshace todo:
    // no queda stock descontado a medias ni una venta incompleta.
    @Override
    @Transactional
    public VentaDTO registrarVenta(VentaRequestDTO datos) {
        if (datos == null || datos.items() == null || datos.items().isEmpty()) {
            throw new VentaException(DATOS_INVALIDOS, "La venta debe tener al menos un producto.");
        }

        Socio socio = null;
        if (datos.idSocio() != null) {
            socio = socioRepo.findById(datos.idSocio())
                    .orElseThrow(() -> new VentaException(NO_ENCONTRADA, "El socio no existe."));
        }

        // Si el mismo producto viene dos veces, se suman las cantidades
        Map<Long, Integer> cantidades = new LinkedHashMap<>();
        for (VentaRequestDTO.Item item : datos.items()) {
            if (item == null || item.idProducto() == null) {
                throw new VentaException(DATOS_INVALIDOS, "Hay un producto sin identificar.");
            }
            if (item.cantidad() <= 0) {
                throw new VentaException(DATOS_INVALIDOS, "La cantidad debe ser mayor que cero.");
            }
            cantidades.merge(item.idProducto(), item.cantidad(), Integer::sum);
        }

        Venta venta = new Venta(LocalDateTime.now(), BigDecimal.ZERO);
        venta.setSocio(socio);

        for (Map.Entry<Long, Integer> entrada : cantidades.entrySet()) {
            Producto producto = productoRepo.findById(entrada.getKey())
                    .orElseThrow(() -> new VentaException(NO_ENCONTRADA, "Un producto de la venta ya no existe."));

            int cantidad = entrada.getValue();
            if (!producto.hayStock(cantidad)) {
                throw new VentaException(CONFLICTO,
                        "Stock insuficiente de \"" + producto.getNombre() + "\": quedan " + producto.getStock() + ".");
            }

            producto.disminuirStock(cantidad);

            // El precio se toma del producto en este momento: si después cambia, la venta no se altera
            DetalleVenta detalle = new DetalleVenta(cantidad, producto.getPrecio());
            detalle.setProducto(producto);
            venta.agregarDetalle(detalle);
        }

        return VentaDTO.de(ventaRepo.save(venta));
    }

    @Override
    @Transactional
    public VentaDTO anularVenta(Long id) {
        Venta venta = ventaRepo.findById(id)
                .orElseThrow(() -> new VentaException(NO_ENCONTRADA, "La venta no existe."));

        if (venta.isAnulada()) {
            throw new VentaException(CONFLICTO, "La venta ya está anulada.");
        }

        for (DetalleVenta detalle : venta.getDetalles()) {
            detalle.getProducto().aumentarStock(detalle.getCantidad());
        }
        venta.setAnulada(true);

        return VentaDTO.de(ventaRepo.save(venta));
    }
}
