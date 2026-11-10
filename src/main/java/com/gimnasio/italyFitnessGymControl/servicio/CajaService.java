package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.*;
import com.gimnasio.italyFitnessGymControl.dto.CajaDTO;
import com.gimnasio.italyFitnessGymControl.dto.EgresoRequestDTO;
import com.gimnasio.italyFitnessGymControl.repositorio.IMovimientoCajaRepository;
import com.gimnasio.italyFitnessGymControl.repositorio.IPagoRepository;
import com.gimnasio.italyFitnessGymControl.repositorio.IProductoRepository;
import com.gimnasio.italyFitnessGymControl.repositorio.IVentaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import static com.gimnasio.italyFitnessGymControl.servicio.CajaException.Tipo.*;

@Service
public class CajaService implements ICajaService {

    private static final int MAX_CONCEPTO = 150;
    private static final int MAX_BENEFICIARIO = 100;
    private static final int MAX_MEDIO = 20;
    private static final BigDecimal MONTO_MAXIMO = new BigDecimal("999999999.99");
    private static final int CANTIDAD_MAXIMA = 1_000_000;

    // Para pedir "toda la historia" sin tener que armar la consulta distinta
    private static final LocalDate SIN_LIMITE_DESDE = LocalDate.of(1970, 1, 1);
    private static final LocalDate SIN_LIMITE_HASTA = LocalDate.of(2999, 12, 31);

    private final IMovimientoCajaRepository movimientoRepo;
    private final IPagoRepository pagoRepo;
    private final IVentaRepository ventaRepo;
    private final IProductoRepository productoRepo;

    // Se puede reemplazar en las pruebas para fijar "hoy"
    private Clock reloj = Clock.systemDefaultZone();

    public CajaService(IMovimientoCajaRepository movimientoRepo,
                       IPagoRepository pagoRepo,
                       IVentaRepository ventaRepo,
                       IProductoRepository productoRepo) {
        this.movimientoRepo = movimientoRepo;
        this.pagoRepo = pagoRepo;
        this.ventaRepo = ventaRepo;
        this.productoRepo = productoRepo;
    }

    void setReloj(Clock reloj) {
        this.reloj = reloj;
    }

    // =====================================================================
    //  Consulta
    // =====================================================================

    @Override
    @Transactional(readOnly = true)
    public CajaDTO consultar(LocalDate desde, LocalDate hasta) {
        if (desde != null && hasta != null && desde.isAfter(hasta)) {
            throw new CajaException(DATOS_INVALIDOS, "La fecha \"desde\" no puede ser posterior a \"hasta\".");
        }

        List<MovimientoCaja> movimientos = movimientoRepo
                .findByFechaBetweenOrderByFechaDescIdMovimientoDesc(
                        desde == null ? SIN_LIMITE_DESDE : desde,
                        hasta == null ? SIN_LIMITE_HASTA : hasta);

        // Los anulados se muestran en la lista pero no suman ni restan
        List<MovimientoCaja> vigentes = movimientos.stream().filter(m -> !m.isAnulado()).toList();

        BigDecimal ingresos = sumar(vigentes, TipoMovimiento.INGRESO);
        BigDecimal egresos = sumar(vigentes, TipoMovimiento.EGRESO);

        List<CajaDTO.Categoria> categorias = new ArrayList<>();
        for (CategoriaCaja cat : CategoriaCaja.values()) {
            List<MovimientoCaja> deLaCategoria = vigentes.stream()
                    .filter(m -> m.getCategoria() == cat).toList();
            BigDecimal total = deLaCategoria.stream()
                    .map(MovimientoCaja::getMonto)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            categorias.add(new CajaDTO.Categoria(cat.name(), cat.getEtiqueta(),
                    cat.getTipo().name(), total, deLaCategoria.size()));
        }

        BigDecimal saldoTotal = nuncaNulo(movimientoRepo.totalIngresosVigentes())
                .subtract(nuncaNulo(movimientoRepo.totalEgresosVigentes()));

        return new CajaDTO(desde, hasta, ingresos, egresos, ingresos.subtract(egresos), saldoTotal,
                categorias, movimientos.stream().map(CajaDTO.Movimiento::de).toList());
    }

    private static BigDecimal sumar(List<MovimientoCaja> lista, TipoMovimiento tipo) {
        return lista.stream()
                .filter(m -> m.getTipo() == tipo)
                .map(MovimientoCaja::getMonto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private static BigDecimal nuncaNulo(BigDecimal valor) {
        return valor == null ? BigDecimal.ZERO : valor;
    }

    // =====================================================================
    //  Egresos a mano
    // =====================================================================

    // Si algo falla (por ejemplo el producto ya no existe), no queda ni el egreso ni el stock a medias
    @Override
    @Transactional
    public CajaDTO.Movimiento registrarEgreso(EgresoRequestDTO datos, String registradoPor) {
        if (datos == null || datos.categoria() == null) {
            throw new CajaException(DATOS_INVALIDOS, "Elegí el tipo de egreso.");
        }
        CategoriaCaja categoria = datos.categoria();
        if (categoria.getTipo() != TipoMovimiento.EGRESO) {
            throw new CajaException(DATOS_INVALIDOS,
                    "Los ingresos entran solos desde Pagos y Ventas; acá solo se cargan egresos.");
        }

        BigDecimal monto = validarMonto(datos.monto());

        LocalDate hoy = LocalDate.now(reloj);
        LocalDate fecha = datos.fecha() == null ? hoy : datos.fecha();
        if (fecha.isAfter(hoy)) {
            throw new CajaException(DATOS_INVALIDOS, "La fecha no puede ser futura.");
        }

        String beneficiario = limpiar(datos.beneficiario());
        if (beneficiario != null && beneficiario.length() > MAX_BENEFICIARIO) {
            throw new CajaException(DATOS_INVALIDOS,
                    "El nombre es demasiado largo (máximo " + MAX_BENEFICIARIO + " caracteres).");
        }
        if (categoria.esSueldo() && beneficiario == null) {
            throw new CajaException(DATOS_INVALIDOS,
                    categoria == CategoriaCaja.SUELDO_PROFESOR
                            ? "Indicá a qué profesor se le paga."
                            : "Indicá a qué recepcionista se le paga.");
        }

        String medio = limpiar(datos.medioPago());
        if (medio != null && medio.length() > MAX_MEDIO) {
            throw new CajaException(DATOS_INVALIDOS, "El medio de pago no es válido.");
        }

        // Compra de un producto del store: suma esas unidades al stock
        Producto producto = null;
        Integer cantidad = null;
        if (categoria == CategoriaCaja.COMPRA_PRODUCTOS && datos.idProducto() != null) {
            if (datos.cantidad() == null || datos.cantidad() <= 0) {
                throw new CajaException(DATOS_INVALIDOS, "La cantidad comprada debe ser mayor que cero.");
            }
            if (datos.cantidad() > CANTIDAD_MAXIMA) {
                throw new CajaException(DATOS_INVALIDOS, "La cantidad es demasiado grande.");
            }
            producto = productoRepo.findById(datos.idProducto())
                    .orElseThrow(() -> new CajaException(NO_ENCONTRADO, "El producto no existe."));
            cantidad = datos.cantidad();
        }

        String concepto = limpiar(datos.concepto());
        if (concepto == null) {
            concepto = conceptoPorDefecto(categoria, beneficiario, producto, cantidad);
        }
        if (concepto == null) {
            throw new CajaException(DATOS_INVALIDOS, "Escribí el concepto del gasto.");
        }
        if (concepto.length() > MAX_CONCEPTO) {
            throw new CajaException(DATOS_INVALIDOS,
                    "El concepto es demasiado largo (máximo " + MAX_CONCEPTO + " caracteres).");
        }

        if (producto != null) {
            producto.aumentarStock(cantidad);
            productoRepo.save(producto);
        }

        MovimientoCaja m = new MovimientoCaja();
        m.setCategoria(categoria);
        m.setFecha(fecha);
        m.setConcepto(concepto);
        m.setMonto(monto);
        m.setMedioPago(medio);
        m.setBeneficiario(beneficiario);
        m.setOrigen(OrigenMovimiento.MANUAL);
        m.setIdProducto(producto == null ? null : producto.getIdProducto());
        m.setCantidad(cantidad);
        m.setRegistradoPor(registradoPor);
        m.setCreadoEn(LocalDateTime.now(reloj));
        return CajaDTO.Movimiento.de(movimientoRepo.save(m));
    }

    private static String conceptoPorDefecto(CategoriaCaja categoria, String beneficiario,
                                             Producto producto, Integer cantidad) {
        if (categoria.esSueldo()) {
            return categoria.getEtiqueta() + " - " + beneficiario;
        }
        if (categoria == CategoriaCaja.COMPRA_PRODUCTOS && producto != null) {
            return "Compra: " + cantidad + "× " + producto.getNombre();
        }
        return null;
    }

    private static BigDecimal validarMonto(BigDecimal monto) {
        if (monto == null || monto.signum() <= 0) {
            throw new CajaException(DATOS_INVALIDOS, "El monto debe ser mayor que cero.");
        }
        BigDecimal redondeado = monto.setScale(2, RoundingMode.HALF_UP);
        if (redondeado.signum() <= 0) {
            throw new CajaException(DATOS_INVALIDOS, "El monto debe ser mayor que cero.");
        }
        if (redondeado.compareTo(MONTO_MAXIMO) > 0) {
            throw new CajaException(DATOS_INVALIDOS, "El monto es demasiado grande.");
        }
        return redondeado;
    }

    private static String limpiar(String texto) {
        if (texto == null) {
            return null;
        }
        String limpio = texto.trim().replaceAll("\\s+", " ");
        return limpio.isEmpty() ? null : limpio;
    }

    @Override
    @Transactional
    public CajaDTO.Movimiento anularMovimiento(Long id) {
        MovimientoCaja m = movimientoRepo.findById(id)
                .orElseThrow(() -> new CajaException(NO_ENCONTRADO, "El movimiento no existe."));

        if (m.getOrigen() != OrigenMovimiento.MANUAL) {
            throw new CajaException(CONFLICTO, m.getOrigen() == OrigenMovimiento.PAGO
                    ? "Este ingreso viene de un pago: se anula desde Pagos."
                    : "Este ingreso viene de una venta: se anula desde Ventas.");
        }
        if (m.isAnulado()) {
            throw new CajaException(CONFLICTO, "El movimiento ya está anulado.");
        }

        // Si la compra había sumado stock, se devuelve, salvo que ya se haya vendido
        if (m.getIdProducto() != null && m.getCantidad() != null) {
            Optional<Producto> producto = productoRepo.findById(m.getIdProducto());
            if (producto.isPresent()) {
                if (!producto.get().hayStock(m.getCantidad())) {
                    throw new CajaException(CONFLICTO,
                            "No se puede anular: ya se vendió parte del stock que entró con esta compra.");
                }
                producto.get().disminuirStock(m.getCantidad());
                productoRepo.save(producto.get());
            }
        }

        m.setAnulado(true);
        return CajaDTO.Movimiento.de(movimientoRepo.save(m));
    }

    // =====================================================================
    //  Ingresos que vienen de Pagos y Ventas
    // =====================================================================

    @Override
    @Transactional
    public void sincronizarCuota(Pago pago) {
        if (pago == null || pago.getIdPago() == null) {
            return;
        }
        MovimientoCaja m = movimientoRepo.findByOrigenAndOrigenId(OrigenMovimiento.PAGO, pago.getIdPago())
                .orElseGet(() -> nuevoDeOrigen(OrigenMovimiento.PAGO, pago.getIdPago(), CategoriaCaja.CUOTA));

        Socio socio = pago.getSocio();
        m.setFecha(pago.getFechaPago() == null ? LocalDate.now(reloj) : pago.getFechaPago());
        m.setConcepto(recortar(socio == null
                ? "Cuota"
                : "Cuota - " + socio.getNombre() + " " + socio.getApellido()));
        m.setMonto(nuncaNulo(pago.getValorCuota()));
        m.setMedioPago(pago.getMedioPago());
        m.setBeneficiario(null);
        m.setAnulado(pago.isAnulado());
        movimientoRepo.save(m);
    }

    @Override
    @Transactional
    public void sincronizarVenta(Venta venta) {
        if (venta == null || venta.getIdVenta() == null) {
            return;
        }
        MovimientoCaja m = movimientoRepo.findByOrigenAndOrigenId(OrigenMovimiento.VENTA, venta.getIdVenta())
                .orElseGet(() -> nuevoDeOrigen(OrigenMovimiento.VENTA, venta.getIdVenta(), CategoriaCaja.VENTA));

        String productos = venta.getDetalles().stream()
                .map(d -> d.getCantidad() + "× " + d.getProducto().getNombre())
                .collect(Collectors.joining(", "));
        Socio socio = venta.getSocio();
        String concepto = "Venta #" + venta.getIdVenta()
                + (socio == null ? "" : " - " + socio.getNombre() + " " + socio.getApellido())
                + (productos.isEmpty() ? "" : ": " + productos);

        m.setFecha(venta.getFecha() == null ? LocalDate.now(reloj) : venta.getFecha().toLocalDate());
        m.setConcepto(recortar(concepto));
        m.setMonto(nuncaNulo(venta.getTotal()));
        m.setBeneficiario(null);
        m.setAnulado(venta.isAnulada());
        movimientoRepo.save(m);
    }

    private MovimientoCaja nuevoDeOrigen(OrigenMovimiento origen, Long idOrigen, CategoriaCaja categoria) {
        MovimientoCaja m = new MovimientoCaja();
        m.setOrigen(origen);
        m.setOrigenId(idOrigen);
        m.setCategoria(categoria);
        m.setCreadoEn(LocalDateTime.now(reloj));
        return m;
    }

    private static String recortar(String texto) {
        return texto.length() <= MAX_CONCEPTO ? texto : texto.substring(0, MAX_CONCEPTO - 1) + "…";
    }

    // =====================================================================
    //  Datos anteriores a la Caja
    // =====================================================================

    @Override
    @Transactional
    public int sincronizarHistorico() {
        int agregados = 0;

        Set<Long> pagosCargados = movimientoRepo.findByOrigen(OrigenMovimiento.PAGO).stream()
                .map(MovimientoCaja::getOrigenId).collect(Collectors.toSet());
        for (Pago pago : pagoRepo.findAll()) {
            if (!pagosCargados.contains(pago.getIdPago())) {
                sincronizarCuota(pago);
                agregados++;
            }
        }

        Set<Long> ventasCargadas = movimientoRepo.findByOrigen(OrigenMovimiento.VENTA).stream()
                .map(MovimientoCaja::getOrigenId).collect(Collectors.toSet());
        for (Venta venta : ventaRepo.traerTodasConDetalle()) {
            if (!ventasCargadas.contains(venta.getIdVenta())) {
                sincronizarVenta(venta);
                agregados++;
            }
        }
        return agregados;
    }
}
