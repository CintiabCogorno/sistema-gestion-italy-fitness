package com.gimnasio.italyFitnessGymControl.controlador;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;  
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.gimnasio.italyFitnessGymControl.dominio.Socio;
import com.gimnasio.italyFitnessGymControl.servicio.ISocioService;

@RestController
@RequestMapping("/socios") 

public class SocioController {
	
	private ISocioService socioServ;

	public SocioController(ISocioService socioServ) {
		super();
		this.socioServ = socioServ;
	}
	
	//READ
	@GetMapping
	public List<Socio> traerSocios() {
	return socioServ.traerSocios();
	}
		
	//READ de producto especifico
	@GetMapping("/{id}") 
	
	public ResponseEntity<?> buscarSocio (@PathVariable Long id) {
		
		Socio socio = socioServ.buscarSocio(id);
		
		if (socio == null) {
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body("No se encuentra el socio");
		}
		
		return ResponseEntity.ok(socio);
	}
	
	@GetMapping("/dni/{dni}")
	public ResponseEntity<?> buscarPorDni(@PathVariable String dni) {

	    Socio socio = socioServ.buscarPorDni(dni);

	    if (socio == null) {
	        return ResponseEntity.status(HttpStatus.NOT_FOUND)
	                .body("No se encuentra un socio con ese DNI");
	    }

	    return ResponseEntity.ok(socio);
	}
	
	
	@PostMapping
	public ResponseEntity<?> crearSocio (@RequestBody Socio socio) {
		Socio socioCreado = socioServ.crearSocio(socio);
		
		if (socioCreado == null ) {
			return ResponseEntity.badRequest()
					.body("los datos no son validos");
		}
		
		return ResponseEntity.status(HttpStatus.CREATED)
				.body(socioCreado);
	}
	
	//UPDATE 
	@PutMapping("/{id}")
	
	public ResponseEntity<?> editarSocio(@PathVariable Long id,
										  @RequestBody Socio socioAModificar) {
	
		Socio socioEditado = socioServ.editarSocio(id, socioAModificar);
		
		if (socioEditado == null) {
			return ResponseEntity.badRequest()
					.body("No se pudo editar el socio");
		}
		
		return ResponseEntity.ok(socioEditado);
	
	}
	
	//DELETE
	@DeleteMapping("/{id}")
	
	public ResponseEntity<?> eliminarSocio(@PathVariable Long id) {
		
		boolean socioEliminado = socioServ.eliminarSocio(id);
		
		if (socioEliminado == false) {
		
			return ResponseEntity.status(HttpStatus.NOT_FOUND)
					.body("no se pudo eliminar el socio n°:" + id);
		                                             	
		}
		
		return ResponseEntity.ok("Socio Eliminado Correctamente");
		
		
	}
			
}
	 
	
 