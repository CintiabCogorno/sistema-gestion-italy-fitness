package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Usuario;
import com.gimnasio.italyFitnessGymControl.repositorio.IUsuarioRepository;
import com.gimnasio.italyFitnessGymControl.seguridad.PasswordUtil;
import com.gimnasio.italyFitnessGymControl.seguridad.Rol;
import com.gimnasio.italyFitnessGymControl.seguridad.SesionUsuario;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import static com.gimnasio.italyFitnessGymControl.servicio.UsuarioException.Tipo.DATOS_INVALIDOS;
import static com.gimnasio.italyFitnessGymControl.servicio.UsuarioException.Tipo.DEMASIADOS_INTENTOS;
import static com.gimnasio.italyFitnessGymControl.servicio.UsuarioException.Tipo.NO_AUTENTICADO;
import static com.gimnasio.italyFitnessGymControl.servicio.UsuarioException.Tipo.NO_ENCONTRADO;

@Service
public class AuthService implements IAuthService {

    static final int MAX_INTENTOS = 5;
    static final Duration BLOQUEO = Duration.ofMinutes(5);
    static final String MENSAJE_INVALIDO = "Usuario o contraseña incorrectos.";

    // Se usa para que tardar lo mismo aunque el usuario no exista
    private static final String CLAVE_FALSA = PasswordUtil.cifrar("clave-que-nadie-usa");

    private final IUsuarioRepository usuarioRepo;
    private Clock reloj = Clock.systemUTC();

    // Intentos fallidos por usuario (se reinicia al reiniciar la aplicación)
    private final Map<String, Intentos> intentos = new ConcurrentHashMap<>();

    private static final class Intentos {
        int fallidos;
        Instant bloqueadoHasta;
    }

    public AuthService(IUsuarioRepository usuarioRepo) {
        this.usuarioRepo = usuarioRepo;
    }

    // Solo para las pruebas
    void setReloj(Clock reloj) {
        this.reloj = reloj;
    }

    @Override
    @Transactional
    public SesionUsuario autenticar(String nombreUsuario, String clave) {
        if (nombreUsuario == null || nombreUsuario.isBlank() || clave == null || clave.isEmpty()) {
            throw new UsuarioException(DATOS_INVALIDOS, "Ingresá usuario y contraseña.");
        }
        String clavePerfil = nombreUsuario.trim().toLowerCase();
        verificarBloqueo(clavePerfil);

        Usuario usuario = usuarioRepo.findByNombreUsuarioIgnoreCase(nombreUsuario.trim()).orElse(null);
        boolean claveOk;
        if (usuario != null) {
            claveOk = PasswordUtil.verificar(clave, usuario.getContrasenia());
        } else {
            PasswordUtil.verificar(clave, CLAVE_FALSA);   // mismo trabajo, resultado ignorado
            claveOk = false;
        }

        Rol rol = usuario == null ? null : Rol.de(usuario);
        if (usuario == null || !claveOk || !usuario.isActivo() || rol == null) {
            registrarFallo(clavePerfil);
            throw new UsuarioException(NO_AUTENTICADO, MENSAJE_INVALIDO);
        }

        intentos.remove(clavePerfil);

        // Si la clave estaba guardada en texto plano, se cifra ahora
        if (!PasswordUtil.estaCifrada(usuario.getContrasenia())) {
            usuario.setContrasenia(PasswordUtil.cifrar(clave));
            usuarioRepo.save(usuario);
        }

        String nombre = (usuario.getNombre() + " " + usuario.getApellido()).trim();
        return new SesionUsuario(usuario.getId(), usuario.getNombreUsuario(), nombre, rol);
    }

    @Override
    @Transactional
    public void cambiarClavePropia(Long idUsuario, String actual, String nueva) {
        Usuario usuario = usuarioRepo.findById(idUsuario)
                .orElseThrow(() -> new UsuarioException(NO_ENCONTRADO, "El usuario no existe."));

        if (!PasswordUtil.verificar(actual, usuario.getContrasenia())) {
            throw new UsuarioException(DATOS_INVALIDOS, "La contraseña actual no es correcta.");
        }
        UsuarioService.validarClave(nueva, usuario.getNombreUsuario());
        if (nueva.equals(actual)) {
            throw new UsuarioException(DATOS_INVALIDOS, "La contraseña nueva tiene que ser distinta de la actual.");
        }
        usuario.setContrasenia(PasswordUtil.cifrar(nueva));
        usuarioRepo.save(usuario);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean sigueActivo(Long idUsuario) {
        return usuarioRepo.findById(idUsuario).map(Usuario::isActivo).orElse(false);
    }

    private void verificarBloqueo(String clavePerfil) {
        Intentos i = intentos.get(clavePerfil);
        if (i != null && i.bloqueadoHasta != null) {
            if (reloj.instant().isBefore(i.bloqueadoHasta)) {
                long minutos = Math.max(1, Duration.between(reloj.instant(), i.bloqueadoHasta).toMinutes() + 1);
                throw new UsuarioException(DEMASIADOS_INTENTOS,
                        "Demasiados intentos. Probá de nuevo en " + minutos + " min.");
            }
            intentos.remove(clavePerfil);
        }
    }

    private void registrarFallo(String clavePerfil) {
        Intentos i = intentos.computeIfAbsent(clavePerfil, k -> new Intentos());
        synchronized (i) {
            i.fallidos++;
            if (i.fallidos >= MAX_INTENTOS) {
                i.bloqueadoHasta = reloj.instant().plus(BLOQUEO);
                i.fallidos = 0;
            }
        }
    }
}
