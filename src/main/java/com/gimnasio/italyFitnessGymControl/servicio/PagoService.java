package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Pago;
import com.gimnasio.italyFitnessGymControl.repositorio.IPagoRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class PagoService implements IPagoService {

    private final IPagoRepository pagoRepository;

    public PagoService(IPagoRepository pagoRepository) {
        this.pagoRepository = pagoRepository;
    }

    @Override
    public Pago registrarPago(Pago pago) {
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
        // "anulado" no se toca acá a propósito: eso se maneja con anularPago()

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
        return false;
    }
}

