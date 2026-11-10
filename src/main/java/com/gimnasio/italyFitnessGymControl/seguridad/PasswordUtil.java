package com.gimnasio.italyFitnessGymControl.seguridad;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Guarda las contraseñas cifradas (PBKDF2 con sal aleatoria), nunca en texto plano.
 * Formato guardado: pbkdf2$iteraciones$sal$hash
 *
 * Las contraseñas viejas, guardadas en texto plano, se siguen aceptando y se cifran
 * solas la próxima vez que esa persona inicia sesión.
 */
public final class PasswordUtil {

    private static final String PREFIJO = "pbkdf2";
    private static final String ALGORITMO = "PBKDF2WithHmacSHA256";
    private static final int ITERACIONES = 210_000;
    private static final int BYTES_SAL = 16;
    private static final int BITS_CLAVE = 256;
    private static final String LETRAS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    private static final SecureRandom AZAR = new SecureRandom();

    private PasswordUtil() {
    }

    public static String cifrar(String clave) {
        byte[] sal = new byte[BYTES_SAL];
        AZAR.nextBytes(sal);
        byte[] hash = derivar(clave, sal, ITERACIONES);
        return PREFIJO + "$" + ITERACIONES + "$" + codificar(sal) + "$" + codificar(hash);
    }

    public static boolean estaCifrada(String guardada) {
        return guardada != null && guardada.startsWith(PREFIJO + "$");
    }

    public static boolean verificar(String clave, String guardada) {
        if (clave == null || guardada == null) {
            return false;
        }
        if (!estaCifrada(guardada)) {
            // Contraseña vieja en texto plano
            return MessageDigest.isEqual(
                    clave.getBytes(StandardCharsets.UTF_8),
                    guardada.getBytes(StandardCharsets.UTF_8));
        }
        String[] partes = guardada.split("\\$");
        if (partes.length != 4) {
            return false;
        }
        try {
            int iteraciones = Integer.parseInt(partes[1]);
            byte[] sal = Base64.getDecoder().decode(partes[2]);
            byte[] esperado = Base64.getDecoder().decode(partes[3]);
            byte[] calculado = derivar(clave, sal, iteraciones);
            return MessageDigest.isEqual(esperado, calculado);
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /** Clave aleatoria legible (sin letras que se confunden, como 0/O o l/1). */
    public static String generarClave(int largo) {
        StringBuilder clave = new StringBuilder(largo);
        for (int i = 0; i < largo; i++) {
            clave.append(LETRAS.charAt(AZAR.nextInt(LETRAS.length())));
        }
        return clave.toString();
    }

    private static byte[] derivar(String clave, byte[] sal, int iteraciones) {
        PBEKeySpec especificacion = new PBEKeySpec(clave.toCharArray(), sal, iteraciones, BITS_CLAVE);
        try {
            return SecretKeyFactory.getInstance(ALGORITMO).generateSecret(especificacion).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("No se pudo cifrar la contraseña.", e);
        } finally {
            especificacion.clearPassword();
        }
    }

    private static String codificar(byte[] datos) {
        return Base64.getEncoder().encodeToString(datos);
    }
}
