package com.gimnasio.italyFitnessGymControl.seguridad;

import com.gimnasio.italyFitnessGymControl.dominio.Administrador;
import com.gimnasio.italyFitnessGymControl.repositorio.IUsuarioRepository;
import com.gimnasio.italyFitnessGymControl.servicio.UsuarioException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Al arrancar, si todavía no hay administrador, crea el único administrador del sistema.
 *
 * Usuario:    gimnasio.admin.usuario  (por defecto "admin")
 * Contraseña: gimnasio.admin.clave    (si no se define, se genera una al azar y se muestra
 *                                      UNA vez en la consola; no hay contraseña por defecto)
 */
@Component
public class InicializadorAdmin implements ApplicationRunner {

    private final IUsuarioRepository usuarioRepo;
    private final String usuarioInicial;
    private final String claveInicial;

    public InicializadorAdmin(IUsuarioRepository usuarioRepo,
                              @Value("${gimnasio.admin.usuario:admin}") String usuarioInicial,
                              @Value("${gimnasio.admin.clave:}") String claveInicial) {
        this.usuarioRepo = usuarioRepo;
        this.usuarioInicial = usuarioInicial;
        this.claveInicial = claveInicial;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (usuarioRepo.contarAdministradores() > 0) {
            return;
        }

        boolean generada = claveInicial == null || claveInicial.length() < 8;
        String clave = generada ? PasswordUtil.generarClave(12) : claveInicial;

        Administrador admin = new Administrador("Administrador", "del Sistema", "ADMIN",
                null, usuarioRepo.ultimoIdUsuario() + 1, usuarioInicial.trim(),
                PasswordUtil.cifrar(clave), true);
        try {
            usuarioRepo.saveAndFlush(admin);
        } catch (RuntimeException e) {
            throw new UsuarioException(UsuarioException.Tipo.CONFLICTO,
                    "No se pudo crear el administrador inicial: " + e.getMessage());
        }

        System.out.println();
        System.out.println("============================================================");
        System.out.println(" ADMINISTRADOR CREADO");
        System.out.println("   Usuario:    " + admin.getNombreUsuario());
        if (generada) {
            System.out.println("   Contraseña: " + clave + "   (anotala: no se vuelve a mostrar)");
            System.out.println("   Cambiala al entrar, desde \"Cambiar contraseña\".");
        } else {
            System.out.println("   Contraseña: la definida en gimnasio.admin.clave");
        }
        System.out.println("============================================================");
        System.out.println();
    }
}
