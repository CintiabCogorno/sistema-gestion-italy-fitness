package com.gimnasio.italyFitnessGymControl.repositorio;

import com.gimnasio.italyFitnessGymControl.dominio.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface IUsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByNombreUsuarioIgnoreCase(String nombreUsuario);

    boolean existsByNombreUsuarioIgnoreCase(String nombreUsuario);

    boolean existsByDni(String dni);

    @Query("select count(a) from Administrador a")
    long contarAdministradores();

    @Query("select coalesce(max(u.idUsuario), 0) from Usuario u")
    int ultimoIdUsuario();
}
