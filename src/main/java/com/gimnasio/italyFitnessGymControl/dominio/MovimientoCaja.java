package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "movimiento_caja",
        uniqueConstraints = @UniqueConstraint(name = "uk_movimiento_origen",
                columnNames = {"origen", "origen_id"}))

public class MovimientoCaja {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idMovimiento;

    @Column(nullable = false)
    private LocalDate fecha;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TipoMovimiento tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private CategoriaCaja categoria;

    @Column(nullable = false, length = 150)
    private String concepto;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal monto = BigDecimal.ZERO;

    @Column(name = "medio_pago", length = 20)
    private String medioPago;

    // persona que cobra (el profesor o el recepcionista)
    @Column(length = 100)
    private String beneficiario;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private OrigenMovimiento origen;

    // Id del pago o de la venta
    @Column(name = "origen_id")
    private Long origenId;

    // qué producto y cuántas unidades entraron al stock
    @Column(name = "id_producto")
    private Long idProducto;

    private Integer cantidad;

    @Column(nullable = false)
    private boolean anulado;

    @Column(name = "registrado_por", length = 50)
    private String registradoPor;

    @Column(name = "creado_en", nullable = false)
    private LocalDateTime creadoEn;

    public MovimientoCaja() {
    }

    public Long getIdMovimiento() {
        return idMovimiento;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public TipoMovimiento getTipo() {
        return tipo;
    }

    public CategoriaCaja getCategoria() {
        return categoria;
    }

    /** Al elegir la categoría queda definido también el tipo (ingreso o egreso). */
    public void setCategoria(CategoriaCaja categoria) {
        this.categoria = categoria;
        this.tipo = categoria == null ? null : categoria.getTipo();
    }

    public String getConcepto() {
        return concepto;
    }

    public void setConcepto(String concepto) {
        this.concepto = concepto;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public String getMedioPago() {
        return medioPago;
    }

    public void setMedioPago(String medioPago) {
        this.medioPago = medioPago;
    }

    public String getBeneficiario() {
        return beneficiario;
    }

    public void setBeneficiario(String beneficiario) {
        this.beneficiario = beneficiario;
    }

    public OrigenMovimiento getOrigen() {
        return origen;
    }

    public void setOrigen(OrigenMovimiento origen) {
        this.origen = origen;
    }

    public Long getOrigenId() {
        return origenId;
    }

    public void setOrigenId(Long origenId) {
        this.origenId = origenId;
    }

    public Long getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Long idProducto) {
        this.idProducto = idProducto;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public boolean isAnulado() {
        return anulado;
    }

    public void setAnulado(boolean anulado) {
        this.anulado = anulado;
    }

    public String getRegistradoPor() {
        return registradoPor;
    }

    public void setRegistradoPor(String registradoPor) {
        this.registradoPor = registradoPor;
    }

    public LocalDateTime getCreadoEn() {
        return creadoEn;
    }

    public void setCreadoEn(LocalDateTime creadoEn) {
        this.creadoEn = creadoEn;
    }
}
