package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Producto;

import java.util.List;

public interface IProductoService {

    Producto crearProducto(Producto producto);

    List<Producto> traerProductos();
    //List<Producto> traerProductosActivos();
    Producto buscarProducto(Long id);
    List<Producto> buscarPorNombre(String nombre);

    Producto editarProducto(Long id, Producto producto);

    Producto aumentarStock(Long id, int cantidad);

    boolean eliminarProducto(Long id);

}
