package com.gimnasio.italyFitnessGymControl.servicio;

import java.util.List;

import org.springframework.stereotype.Service;

import com.gimnasio.italyFitnessGymControl.dominio.Socio;
import com.gimnasio.italyFitnessGymControl.repositorio.ISocioRepository;

@Service
public class SocioService  implements ISocioService{
	
	private ISocioRepository socioRepo;
	
	public SocioService(ISocioRepository socioRepo) {
		super();
		this.socioRepo = socioRepo;
	}

	public List<Socio> traerSocios() {
		// TODO Auto-generated method stub 
		return socioRepo.findAll();
	}

	public Socio buscarSocio(Long Id) {
		// TODO Auto-generated method stub
		return socioRepo.findById(Id).orElse(null);
	}
	
	@Override
	public Socio buscarPorDni(String dni) {
		return socioRepo.findByDni(dni).orElse(null);
	}

	@Override
	public Socio crearSocio(Socio socio) {
		// TODO Auto-generated method stub
		if (socio  == null) {
			return null;
		}
		//id se genera automaticamente y con esto la devolvemos junto con el socio 
		return socioRepo.save(socio);
		
		}

	@Override
	public Socio editarSocio(Long Id, Socio Socio) {
		// TODO Auto-generated method stub
		
		//buscar el socio para saber si existe 
		Socio socioExistente = buscarSocio(Id);
		
		//validar 
		if (socioExistente == null) {
			return null;
		}
		
		//actualizamos los datos
		socioExistente.setNombre(Socio.getNombre());
		socioExistente.setApellido(Socio.getApellido());
		socioExistente.setDni(Socio.getDni());
		socioExistente.setTelefono(Socio.getTelefono());
		return socioRepo.save(socioExistente);
			
	}

	@Override
	public boolean eliminarSocio(Long Id) {
		
		Socio socioExistente = buscarSocio(Id);
		
		if (socioExistente == null) {
			return false;
		}
		
		socioRepo.delete(socioExistente);
		return true;
		
	}

	

}
