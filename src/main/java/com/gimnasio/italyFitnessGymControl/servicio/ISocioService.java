package com.gimnasio.italyFitnessGymControl.servicio;

import java.util.List;
import com.gimnasio.italyFitnessGymControl.dominio.Socio;

public interface ISocioService {
	
	//metodos para el CRUD 
	
	//READ
	List<Socio> traerSocios();	
	Socio buscarSocio(Long Id);	
	Socio buscarPorDni(String dni);
	
	//CREATE
	Socio crearSocio(Socio Socio);
	
	//UPDATE
	Socio editarSocio(Long Id, Socio Socio);
	
	//DELETE
	boolean eliminarSocio(Long Id); 
	

}
