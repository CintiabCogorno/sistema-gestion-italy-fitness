package com.gimnasio.italyFitnessGymControl.servicio;

import com.gimnasio.italyFitnessGymControl.dominio.Recepcionista;
import com.gimnasio.italyFitnessGymControl.dominio.Usuario;
import com.gimnasio.italyFitnessGymControl.dto.UsuarioDTO;
import com.gimnasio.italyFitnessGymControl.dto.UsuarioRequestDTO;
import com.gimnasio.italyFitnessGymControl.repositorio.IUsuarioRepository;
import com.gimnasio.italyFitnessGymControl.seguridad.PasswordUtil;
import com.gimnasio.italyFitnessGymControl.seguridad.Rol;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

import static com.gimnasio.italyFitnessGymControl.servicio.UsuarioException.Tipo.CONFLICTO;
import static com.gimnasio.italyFitnessGymControl.servicio.UsuarioException.Tipo.DATOS_INVALIDOS;
import static com.gimnasio.italyFitnessGymControl.servicio.UsuarioException.Tipo.NO_ENCONTRADO;

@Service
public class UsuarioService implements IUsuarioService {

    static final int LARGO_MINIMO_CLAVE = 8;
    static final int LARGO_MAXIMO_CLAVE = 72;
    private static final Pattern NOMBRE_USUARIO = Pattern.compile("[A-Za-z0-9._-]{4,30}");
    private static final Pattern DNI = Pattern.compile("\\d{7,8}");

    private final IUsuarioRepository usuarioRepo;

    public UsuarioService(IUsuarioRepository usuarioRepo) {
        this.usuarioRepo = usuarioRepo;
    }

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioDTO> traerUsuarios() {
        return usuarioRepo.findAll().stream()
                .filter(u -> Rol.de(u) != null)
                .sorted(Comparator.comparing((Usuario u) -> Rol.de(u)).thenComparing(Usuario::getNombreUsuario,
                        String.CASE_INSENSITIVE_ORDER))
                .map(UsuarioDTO::de)
                .toList();
    }

    @Override
    @Transactional
    public UsuarioDTO crearRecepcionista(UsuarioRequestDTO datos) {
        if (datos == null) {
            throw new UsuarioException(DATOS_INVALIDOS, "Faltan los datos del usuario.");
        }
        String nombre = limpiar(datos.nombre());
        String apellido = limpiar(datos.apellido());
        String dni = limpiar(datos.dni());
        String telefono = limpiar(datos.telefono());
        String nombreUsuario = limpiar(datos.nombreUsuario());

        if (nombre.isEmpty() || nombre.length() > 50) {
            throw new UsuarioException(DATOS_INVALIDOS, "Ingresá el nombre (hasta 50 caracteres).");
        }
        if (apellido.isEmpty() || apellido.length() > 50) {
            throw new UsuarioException(DATOS_INVALIDOS, "Ingresá el apellido (hasta 50 caracteres).");
        }
        if (!DNI.matcher(dni).matches()) {
            throw new UsuarioException(DATOS_INVALIDOS, "El DNI debe tener 7 u 8 números.");
        }
        if (telefono.length() > 20) {
            throw new UsuarioException(DATOS_INVALIDOS, "El teléfono es demasiado largo.");
        }
        if (!NOMBRE_USUARIO.matcher(nombreUsuario).matches()) {
            throw new UsuarioException(DATOS_INVALIDOS,
                    "El usuario debe tener de 4 a 30 caracteres: letras, números, punto, guion o guion bajo.");
        }
        validarClave(datos.clave(), nombreUsuario);

        if (usuarioRepo.existsByNombreUsuarioIgnoreCase(nombreUsuario)) {
            throw new UsuarioException(CONFLICTO, "Ya existe un usuario con ese nombre.");
        }
        if (usuarioRepo.existsByDni(dni)) {
            throw new UsuarioException(CONFLICTO, "Ya hay un usuario con ese DNI.");
        }

        Recepcionista nuevo = new Recepcionista(nombre, apellido, dni,
                telefono.isEmpty() ? null : telefono,
                usuarioRepo.ultimoIdUsuario() + 1, nombreUsuario, PasswordUtil.cifrar(datos.clave()), true);

        try {
            return UsuarioDTO.de(usuarioRepo.saveAndFlush(nuevo));
        } catch (DataIntegrityViolationException e) {
            // El DNI es único en toda la gente registrada (también socios)
            throw new UsuarioException(CONFLICTO, "Ese DNI o ese usuario ya están registrados.");
        }
    }

    @Override
    @Transactional
    public UsuarioDTO cambiarEstado(Long id, boolean activo) {
        Usuario usuario = buscar(id);
        if (Rol.de(usuario) == Rol.ADMINISTRADOR) {
            throw new UsuarioException(CONFLICTO, "El administrador no se puede desactivar.");
        }
        usuario.setActivo(activo);
        return UsuarioDTO.de(usuarioRepo.save(usuario));
    }

    @Override
    @Transactional
    public void restablecerClave(Long id, String nueva) {
        Usuario usuario = buscar(id);
        if (Rol.de(usuario) == Rol.ADMINISTRADOR) {
            throw new UsuarioException(CONFLICTO,
                    "La contraseña del administrador la cambia él mismo desde su sesión.");
        }
        validarClave(nueva, usuario.getNombreUsuario());
        usuario.setContrasenia(PasswordUtil.cifrar(nueva));
        usuarioRepo.save(usuario);
    }

    static void validarClave(String clave, String nombreUsuario) {
        if (clave == null || clave.length() < LARGO_MINIMO_CLAVE) {
            throw new UsuarioException(DATOS_INVALIDOS,
                    "La contraseña debe tener al menos " + LARGO_MINIMO_CLAVE + " caracteres.");
        }
        if (clave.length() > LARGO_MAXIMO_CLAVE) {
            throw new UsuarioException(DATOS_INVALIDOS, "La contraseña es demasiado larga.");
        }
        if (clave.equalsIgnoreCase(nombreUsuario)) {
            throw new UsuarioException(DATOS_INVALIDOS, "La contraseña no puede ser igual al usuario.");
        }
        boolean hayLetra = clave.chars().anyMatch(Character::isLetter);
        boolean hayNumero = clave.chars().anyMatch(Character::isDigit);
        if (!hayLetra || !hayNumero) {
            throw new UsuarioException(DATOS_INVALIDOS, "La contraseña debe combinar letras y números.");
        }
    }

    private Usuario buscar(Long id) {
        Usuario usuario = usuarioRepo.findById(id)
                .orElseThrow(() -> new UsuarioException(NO_ENCONTRADO, "El usuario no existe."));
        if (Rol.de(usuario) == null) {
            throw new UsuarioException(NO_ENCONTRADO, "El usuario no existe.");
        }
        return usuario;
    }

    private static String limpiar(String texto) {
        return texto == null ? "" : texto.trim();
    }
}
