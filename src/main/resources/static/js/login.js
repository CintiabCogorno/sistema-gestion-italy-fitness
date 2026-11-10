(function () {
    "use strict";

    const API = "http://localhost:8080";
    const RAIZ = new URL("../", document.currentScript.src).href;
    const DESTINO = {
        ADMINISTRADOR: RAIZ + "index.html",
        RECEPCIONISTA: RAIZ + "pages/socios.html"
    };

    const $ = id => document.getElementById(id);
    const form = $("formLogin");
    const mensaje = $("loginMensaje");
    const boton = $("btnIngresar");

    function mostrarError(texto) {
        mensaje.textContent = texto;
        mensaje.hidden = false;
    }

    function ocultarError() {
        mensaje.hidden = true;
        mensaje.textContent = "";
    }

    function ir(sesion) {
        location.replace(DESTINO[sesion.rol] || DESTINO.RECEPCIONISTA);
    }

    // Si ya hay una sesión abierta, no hace falta pedir la contraseña de nuevo
    fetch(`${API}/auth/me`, { headers: { Accept: "application/json" } })
        .then(r => (r.ok ? r.json() : null))
        .then(sesion => { if (sesion && sesion.rol) ir(sesion); })
        .catch(() => { /* sin conexión: se muestra el formulario igual */ });

    $("btnVerClave").addEventListener("click", e => {
        const campo = $("clave");
        const visible = campo.type === "text";
        campo.type = visible ? "password" : "text";
        e.currentTarget.textContent = visible ? "Mostrar" : "Ocultar";
        e.currentTarget.setAttribute("aria-pressed", String(!visible));
        e.currentTarget.setAttribute("aria-label", visible ? "Mostrar contraseña" : "Ocultar contraseña");
    });

    form.addEventListener("submit", async e => {
        e.preventDefault();
        ocultarError();

        const usuario = $("usuario").value.trim();
        const clave = $("clave").value;

        if (!usuario || !clave) {
            mostrarError("Ingresá tu usuario y tu contraseña.");
            (usuario ? $("clave") : $("usuario")).focus();
            return;
        }

        boton.disabled = true;
        boton.textContent = "VERIFICANDO...";

        try {
            const respuesta = await fetch(`${API}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify({ usuario, clave })
            });

            if (respuesta.ok) {
                ir(await respuesta.json());
                return;
            }

            let texto = "No se pudo iniciar sesión. Probá de nuevo.";
            try {
                const datos = await respuesta.json();
                if (datos && datos.mensaje) texto = datos.mensaje;
            } catch (err) { /* sin JSON */ }
            mostrarError(texto);
            $("clave").value = "";
            $("clave").focus();
        } catch (err) {
            mostrarError("No se pudo conectar con el servidor. Verificá que Spring Boot esté funcionando.");
        } finally {
            boton.disabled = false;
            boton.textContent = "INGRESAR";
        }
    });
})();
