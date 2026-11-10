 package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Producto;
import com.gimnasio.italyFitnessGymControl.repositorio.IProductoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductoService implements IProductoService{

    private final IProductoRepository productoRepo;

    public ProductoService(IProductoRepository productoRepo) {
        this.productoRepo = productoRepo;
    }
    @Override
    public List<Producto> traerProductos() {
        return productoRepo.findAll();
    }
//    @Override
//    public List<Producto> traerProductosActivos() {
//        return productoRepo.findByActivoTrue();
//    }

    @Override
    public Producto buscarProducto(Long id) {
        return productoRepo.findById(id).orElse(null);
    }

    @Override
    public List<Producto> buscarPorNombre(String nombre) {
        return productoRepo.findByNombreContainingIgnoreCase(nombre);
    }

    @Override
    public Producto crearProducto(Producto producto) {
        if (producto  == null) {
            return null;
        }
        //productoRepo.setActivo(true);
        return productoRepo.save(producto);
    }

    @Override
    public Producto editarProducto(Long id, Producto producto) {
        Producto prodExistente = productoRepo.findById(id).orElse(null);

        if (prodExistente == null) {
            return null;
        }

        prodExistente.setNombre(producto.getNombre());
        prodExistente.setDescripcion(producto.getDescripcion());
        prodExistente.setPrecio(producto.getPrecio());
        // El stock no se pisa acá a propósito: se maneja aparte con aumentarStock()/disminuirStock()

        return productoRepo.save(prodExistente);

    }

    @Override
    public Producto aumentarStock(Long id, int cantidad) {
        Producto producto = productoRepo.findById(id).orElse(null);

        if (producto == null) {
            return null;
        }

        producto.aumentarStock(cantidad);
        return productoRepo.save(producto);
    }

    @Override
    public boolean eliminarProducto(Long id) {
        Producto productoExistente = buscarProducto(id);

        if (productoExistente==null) {
            return false;
        }

        productoRepo.delete(productoExistente);
        return true;
    }
}
