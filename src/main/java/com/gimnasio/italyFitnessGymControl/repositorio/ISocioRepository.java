package com.gimnasio.italyFitnessGymControl.repositorio;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.gimnasio.italyFitnessGymControl.dominio.Socio;

@Repository
public interface ISocioRepository extends JpaRepository<Socio, Long>{

	Optional<Socio> findByDni(String dni);

	
}
