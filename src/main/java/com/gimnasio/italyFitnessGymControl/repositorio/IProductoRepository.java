package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.Producto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IProductoRepository extends JpaRepository<Producto, Long> {

    //List<Producto> findByActivoTrue();
    //Optional<Producto> findByNombre(String nombre);
    List<Producto> findByNombreContainingIgnoreCase(String nombre);
}
