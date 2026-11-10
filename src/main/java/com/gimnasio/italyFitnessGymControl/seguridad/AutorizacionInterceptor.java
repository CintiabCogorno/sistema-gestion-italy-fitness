package com.gimnasio.italyFitnessGymControl.seguridad;

import com.gimnasio.italyFitnessGymControl.servicio.IAuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

import static com.gimnasio.italyFitnessGymControl.seguridad.Rol.ADMINISTRADOR;
import static com.gimnasio.italyFitnessGymControl.seguridad.Rol.RECEPCIONISTA;

/**
 * Controla, en el servidor, quién puede usar cada parte de la API.
 *
 * Funciona al revés de lo que se suele hacer: TODO está protegido salvo una lista corta de
 * rutas públicas (pantallas, estilos, login). Una ruta de la API que no figure en la tabla de
 * permisos de abajo queda solo para el administrador, así que olvidarse de listar algo nunca
 * deja una puerta abierta.
 *
 * Para cambiar qué puede hacer cada rol, se edita la tabla PERMISOS.
 */
@Component
public class AutorizacionInterceptor implements HandlerInterceptor {

    private record Regla(Set<String> metodos, Pattern ruta, Set<Rol> roles) {
    }

    private static final Set<Rol> AMBOS = EnumSet.of(ADMINISTRADOR, RECEPCIONISTA);
    private static final Set<Rol> SOLO_ADMIN = EnumSet.of(ADMINISTRADOR);

    private static Regla regla(String metodos, String ruta, Set<Rol> roles) {
        return new Regla(Set.of(metodos.split(",")), Pattern.compile(ruta), roles);
    }

    /**
     * Permisos por método y ruta. Gana la primera regla que coincide.
     * Recepcionista: registrar socios, registrar pagos, asignar actividades y vender.
     * Todo lo demás (editar/anular pagos, productos, accesos, usuarios, borrar socios,
     * anular ventas, crear o editar actividades) es del administrador.
     */
    private static final List<Regla> PERMISOS = List.of(
            // Socios
            regla("GET,POST", "/socios", AMBOS),
            regla("GET,PUT", "/socios/\\d+", AMBOS),
            regla("GET", "/socios/.+", AMBOS),
            // Pagos
            regla("GET,POST", "/pagos", AMBOS),
            regla("GET", "/pagos/.+", AMBOS),
            // Actividades
            regla("GET", "/actividades", AMBOS),
            regla("PUT", "/actividades/socio/\\d+", AMBOS),
            // Productos: la recepción solo los consulta (para vender)
            regla("GET", "/productos", AMBOS),
            regla("GET", "/productos/.+", AMBOS),
            // Ventas: la recepción vende; anular es del administrador
            regla("GET,POST", "/ventas", AMBOS)
    );

    // Rutas que se pueden abrir sin sesión (pantallas, estilos y el propio login)
    private static final List<String> PUBLICAS = List.of(
            "/pages/", "/js/", "/styles/", "/img/", "/auth/", "/error");
    private static final Set<String> PUBLICAS_EXACTAS = Set.of("/", "/index.html", "/favicon.ico");

    private final IAuthService authServ;

    public AutorizacionInterceptor(IAuthService authServ) {
        this.authServ = authServ;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler)
            throws IOException {

        String metodo = request.getMethod().toUpperCase();
        if (metodo.equals("OPTIONS")) {
            return true;
        }

        String ruta = request.getRequestURI();
        String contexto = request.getContextPath();
        if (contexto != null && !contexto.isEmpty() && ruta.startsWith(contexto)) {
            ruta = ruta.substring(contexto.length());
        }

        if (esPublica(ruta)) {
            return true;
        }

        SesionUsuario sesion = sesionActual(request);
        if (sesion == null || !authServ.sigueActivo(sesion.id())) {
            if (sesion != null) {
                HttpSession http = request.getSession(false);
                if (http != null) {
                    http.invalidate();
                }
            }
            return responder(response, 401, "Tu sesión terminó. Iniciá sesión de nuevo.");
        }

        Set<Rol> permitidos = rolesPermitidos(metodo, ruta);
        if (!permitidos.contains(sesion.rol())) {
            return responder(response, 403, "No tenés permiso para hacer esto.");
        }
        return true;
    }

    /** Qué roles pueden usar esa ruta. Si no hay regla, solo el administrador. */
    static Set<Rol> rolesPermitidos(String metodo, String ruta) {
        for (Regla r : PERMISOS) {
            if (r.metodos().contains(metodo) && r.ruta().matcher(ruta).matches()) {
                return r.roles();
            }
        }
        return SOLO_ADMIN;
    }

    static boolean esPublica(String ruta) {
        // Rutas raras (.., ;, //, %) nunca se consideran públicas
        if (ruta.contains("..") || ruta.contains(";") || ruta.contains("//") || ruta.contains("%")) {
            return false;
        }
        if (PUBLICAS_EXACTAS.contains(ruta)) {
            return true;
        }
        for (String prefijo : PUBLICAS) {
            if (ruta.startsWith(prefijo)) {
                return true;
            }
        }
        return false;
    }

    static SesionUsuario sesionActual(HttpServletRequest request) {
        HttpSession http = request.getSession(false);
        if (http == null) {
            return null;
        }
        Object valor = http.getAttribute(SesionUsuario.ATRIBUTO);
        return valor instanceof SesionUsuario s ? s : null;
    }

    private static boolean responder(HttpServletResponse response, int estado, String mensaje) throws IOException {
        response.setStatus(estado);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"mensaje\":\"" + mensaje + "\"}");
        return false;
    }
}
