package com.gimnasio.italyFitnessGymControl.dominio;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "producto")
public class Producto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idProducto;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, length = 100)
    private String descripcion;

    @Column(nullable = false)
    private BigDecimal precio;

    @Column(nullable = false)
    private int stock;

    public Producto() {
    }

    public Producto(String nombre, String descripcion, BigDecimal precio, int stock) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.stock = stock;
    }

    public boolean hayStock(int cantidad) {

        return this.stock >= cantidad;
    }

    public void aumentarStock(int cantidad ) {

        this.stock += cantidad;
    }

    public void disminuirStock(int cantidad) {
        if (!hayStock(cantidad)) {
            throw new IllegalStateException("Stock insuficiente para el producto: " + nombre);
        }
        this.stock -= cantidad;
    }

    public Long getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Long idProducto) {

        this.idProducto = idProducto;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getDescripcion() {

        return descripcion;
    }

    public void setDescripcion(String descripcion) {

        this.descripcion = descripcion;
    }

    public BigDecimal getPrecio() {

        return precio;
    }

    public void setPrecio(BigDecimal precio) {

        this.precio = precio;
    }

    public int getStock() {

        return stock;
    }

    public void setStock(int stock) {

        this.stock = stock;
    }
}
