package com.gimnasio.italyFitnessGymControl.controlador;

import com.gimnasio.italyFitnessGymControl.dominio.Producto;
import com.gimnasio.italyFitnessGymControl.servicio.IProductoService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/productos")
public class ProductoController {

    private final IProductoService productoServ;

    public ProductoController(IProductoService productoServ) {
        this.productoServ = productoServ;
    }

    @GetMapping
    public List<Producto> traerProductos() {
        return productoServ.traerProductos();
    }

//    @GetMapping("/activos")
//    public List<Producto> traerActivos() {
//        return productoServ.traerProductosActivos();
//    }

    @GetMapping("/{id}")
    public ResponseEntity<?> buscarProducto(@PathVariable Long id) {
        Producto producto = productoServ.buscarProducto(id);

        if (producto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el producto");
        }

        return ResponseEntity.ok(producto);
    }

    @GetMapping("/{nombre}")
    public List<Producto> buscarPorNombre(@RequestParam String nombre) {
        return productoServ.buscarPorNombre(nombre);
    }

    @PostMapping
    public ResponseEntity<?> crearProducto(@RequestBody Producto producto) {
        Producto creado = productoServ.crearProducto(producto);
        return ResponseEntity.status(HttpStatus.CREATED).body(creado);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> editarProducto(@PathVariable Long id,
                                            @RequestBody Producto productoAModificar) {
        Producto editado = productoServ.editarProducto(id, productoAModificar);

        if (editado == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el producto");
        }

        return ResponseEntity.ok(editado);
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<?> aumentarStock(@PathVariable Long id, @RequestParam int cantidad) {
        Producto producto = productoServ.aumentarStock(id, cantidad);

        if (producto == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el producto");
        }

        return ResponseEntity.ok(producto);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProducto(@PathVariable Long id) {
        boolean dadoDeBaja = productoServ.eliminarProducto(id);

        if (!dadoDeBaja) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("No se encuentra el producto");
        }

        return ResponseEntity.ok("Producto eliminado correctamente");
    }
}
