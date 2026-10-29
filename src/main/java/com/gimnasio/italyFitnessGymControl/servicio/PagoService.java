package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Pago;
import com.gimnasio.italyFitnessGymControl.dominio.Socio;
import com.gimnasio.italyFitnessGymControl.repositorio.IPagoRepository;
import org.springframework.stereotype.Service;
import com.gimnasio.italyFitnessGymControl.repositorio.ISocioRepository;
import com.gimnasio.italyFitnessGymControl.dto.PagoDTO;
import java.util.stream.Collectors;

import java.time.LocalDate;
import java.util.List;

@Service
public class PagoService implements IPagoService {

    private final IPagoRepository pagoRepository;
    private final ISocioRepository socioRepository;

    public PagoService(
            IPagoRepository pagoRepository,
            ISocioRepository socioRepository) {

        this.pagoRepository = pagoRepository;
        this.socioRepository = socioRepository;
    }

    @Override
    public Pago registrarPago(Pago pago) {
        pago.setAnulado(false);
        return pagoRepository.save(pago);
    }

    @Override
    public Pago registrarPago(Pago pago, Long idSocio) {
        Socio socio = socioRepository.findById(idSocio)
                .orElseThrow(() ->
                        new RuntimeException("No se encuentra el socio"));

                pago.setSocio(socio);
                pago.setAnulado(false);

                return pagoRepository.save(pago);
        }

    @Override
    public List<Pago> traerPagos() {
        return pagoRepository.findAll();
    }

    @Override
    public List<Pago> traerPagosVigentes() {
        return pagoRepository.findByAnuladoFalse();
    }

    @Override
    public List<Pago> traerPagosPorRango(LocalDate desde, LocalDate hasta) {
        return pagoRepository.findByFechaPagoBetween(desde, hasta);
    }

    @Override
    public Pago buscarPago(Long id) {
        return pagoRepository.findById(id).orElse(null);
    }

    @Override
    public Pago editarPago(Long id, Pago datosActualizados) {
        Pago existente = pagoRepository.findById(id).orElse(null);

        if (existente == null) {
            return null;
        }

        existente.setFechaPago(datosActualizados.getFechaPago());
        existente.setValorCuota(datosActualizados.getValorCuota());
        existente.setMedioPago(datosActualizados.getMedioPago());

        return pagoRepository.save(existente);
    }

    @Override
    public Pago anularPago(Long id) {
        Pago pago = pagoRepository.findById(id).orElse(null);

        if (pago == null) {
            return null;
        }

        pago.setAnulado(true);
        return pagoRepository.save(pago);
    }

    @Override
    public boolean tieneCuotaVigente(Long idSocio) {
        List<Pago> pagos = pagoRepository
                .findBySocio_IdAndAnuladoFalseOrderByFechaPagoDesc(idSocio);
        if (pagos.isEmpty()){
            return false;
        }
        return !pagos.get(0).estaVencido();
    }

    private PagoDTO convertirADTO(Pago pago) {
        PagoDTO dto = new PagoDTO();

        dto.setIdPago(pago.getIdPago());
        dto.setFechaPago(pago.getFechaPago());
        dto.setValorCuota(pago.getValorCuota());
        dto.setMedioPago(pago.getMedioPago());
        dto.setAnulado(pago.isAnulado());

        if (pago.getSocio() != null) {
            dto.setIdSocio(pago.getSocio().getId());
            dto.setNombreSocio(
                    pago.getSocio().getNombre() + " " +
                            pago.getSocio().getApellido()
            );
        }

        return dto;
    }

    public List<PagoDTO> traerPagosDTO() {
        return pagoRepository.findAll()
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    public List<PagoDTO> traerPagosVigentesDTO() {
        return pagoRepository.findByAnuladoFalse()
                .stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }
}

