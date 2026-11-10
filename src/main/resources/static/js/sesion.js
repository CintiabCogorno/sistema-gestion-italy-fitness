(function () {
    "use strict";

    const API = "http://localhost:8080";
    const RAIZ = new URL("../", document.currentScript.src).href;
    const LOGIN = RAIZ + "pages/login.html";
    const HOME = {
        ADMINISTRADOR: RAIZ + "index.html",
        RECEPCIONISTA: RAIZ + "pages/socios.html"
    };

    // Pantallas que puede abrir la recepción (el administrador abre todas)
    const PAGINAS_RECEPCION = ["index", "socios", "ventas"];

    const pagina = (location.pathname.split("/").pop() || "index.html").replace(/\.html$/, "") || "index";
    const paginaDe = href => {
        try {
            return (new URL(href, location.href).pathname.split("/").pop() || "index.html")
                .replace(/\.html$/, "") || "index";
        } catch (e) {
            return "";
        }
    };
    const puedeVer = (rol, nombrePagina) =>
        rol === "ADMINISTRADOR" || PAGINAS_RECEPCION.includes(nombrePagina);

    // La pantalla queda oculta hasta confirmar la sesión (evita ver contenido un instante)
    document.documentElement.style.visibility = "hidden";
    const estilos = document.createElement("link");
    estilos.rel = "stylesheet";
    estilos.href = RAIZ + "styles/sesion.css";
    document.head.appendChild(estilos);

    let resolverSesion;
    window.sesionLista = new Promise(resolver => { resolverSesion = resolver; });

    // ---------- Pedidos al servidor ----------
    const fetchOriginal = window.fetch.bind(window);
    let saliendo = false;

    function irAlLogin() {
        if (saliendo) return;
        saliendo = true;
        location.replace(LOGIN);
    }

    // Todas las pantallas usan fetch: si el servidor dice "sesión terminada" (401) se va al login,
    // y si dice "sin permiso" (403) se avisa en pantalla.
    window.fetch = async function (...args) {
        const respuesta = await fetchOriginal(...args);
        const destino = String(args[0] && args[0].url ? args[0].url : args[0]);
        if (destino.startsWith(API) && !saliendo) {
            if (respuesta.status === 401) {
                irAlLogin();
            } else if (respuesta.status === 403) {
                avisar("No tenés permiso para hacer esto.");
            }
        }
        return respuesta;
    };

    // ---------- Utilidades de pantalla ----------
    function el(etiqueta, atributos = {}, ...hijos) {
        const nodo = document.createElement(etiqueta);
        for (const [clave, valor] of Object.entries(atributos)) {
            if (valor === false || valor == null) continue;
            if (clave === "class") nodo.className = valor;
            else if (clave === "text") nodo.textContent = valor;
            else nodo.setAttribute(clave, valor === true ? "" : valor);
        }
        hijos.forEach(h => h && nodo.append(h));
        return nodo;
    }

    let temporizadorAviso;
    function avisar(texto) {
        let caja = document.getElementById("sesionAviso");
        if (!caja) {
            caja = el("div", { id: "sesionAviso", class: "sesion-aviso", role: "alert" });
            document.body.append(caja);
        }
        caja.textContent = texto;
        caja.classList.add("visible");
        clearTimeout(temporizadorAviso);
        temporizadorAviso = setTimeout(() => caja.classList.remove("visible"), 5000);
    }
    window.avisarPermiso = avisar;

    async function cerrarSesion() {
        try {
            await fetchOriginal(`${API}/auth/logout`, { method: "POST" });
        } catch (e) { /* aunque falle, se vuelve al login */ }
        irAlLogin();
    }

    // ---------- Cambiar contraseña ----------
    function abrirCambioClave() {
        if (document.getElementById("sesionClaveFondo")) return;

        const mensaje = el("p", { class: "sesion-msg", role: "alert", hidden: true });
        const actual = el("input", { type: "password", id: "scActual", autocomplete: "current-password", maxlength: "72", required: true });
        const nueva = el("input", { type: "password", id: "scNueva", autocomplete: "new-password", maxlength: "72", required: true });
        const repetir = el("input", { type: "password", id: "scRepetir", autocomplete: "new-password", maxlength: "72", required: true });
        const guardar = el("button", { type: "submit", class: "btn-guardar", text: "Guardar contraseña" });
        const cancelar = el("button", { type: "button", class: "btn-cancelar", text: "Cancelar" });

        const form = el("form", { class: "sesion-modal", novalidate: true },
            el("h2", { id: "sesionClaveTitulo", text: "Cambiar contraseña" }),
            el("p", { class: "sesion-ayuda", text: "Mínimo 8 caracteres, con letras y números." }),
            el("label", { for: "scActual", text: "Contraseña actual" }), actual,
            el("label", { for: "scNueva", text: "Contraseña nueva" }), nueva,
            el("label", { for: "scRepetir", text: "Repetir contraseña nueva" }), repetir,
            mensaje,
            el("div", { class: "sesion-acciones" }, cancelar, guardar));

        const fondo = el("div", {
            id: "sesionClaveFondo", class: "sesion-fondo", role: "dialog",
            "aria-modal": "true", "aria-labelledby": "sesionClaveTitulo"
        }, form);

        const cerrar = () => { fondo.remove(); document.removeEventListener("keydown", alTeclear); };
        const alTeclear = e => { if (e.key === "Escape") cerrar(); };
        const error = texto => { mensaje.textContent = texto; mensaje.hidden = false; };

        cancelar.addEventListener("click", cerrar);
        fondo.addEventListener("click", e => { if (e.target === fondo) cerrar(); });
        document.addEventListener("keydown", alTeclear);

        form.addEventListener("submit", async e => {
            e.preventDefault();
            mensaje.hidden = true;
            if (!actual.value || !nueva.value) return error("Completá todos los campos.");
            if (nueva.value !== repetir.value) return error("Las contraseñas nuevas no coinciden.");

            guardar.disabled = true;
            try {
                const r = await fetch(`${API}/auth/clave`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ actual: actual.value, nueva: nueva.value })
                });
                if (r.ok) {
                    cerrar();
                    avisar("Contraseña actualizada.");
                    return;
                }
                let texto = "No se pudo cambiar la contraseña.";
                try { const d = await r.json(); if (d && d.mensaje) texto = d.mensaje; } catch (err) { /* sin JSON */ }
                error(texto);
            } catch (err) {
                error("No se pudo conectar con el servidor.");
            } finally {
                guardar.disabled = false;
            }
        });

        document.body.append(fondo);
        actual.focus();
    }

    // ---------- Armado de la pantalla según el rol ----------
    function montar(sesion) {
        const rol = sesion.rol;

        // Menú lateral
        const menu = document.querySelector(".sidebar nav");
        if (menu) {
            menu.querySelectorAll("a").forEach(enlace => {
                if (!puedeVer(rol, paginaDe(enlace.getAttribute("href")))) {
                    enlace.remove();
                }
            });

            if (rol === "ADMINISTRADOR" && !menu.querySelector("#navUsuarios")) {
                const enlace = el("a", {
                    href: RAIZ + "pages/usuarios.html", id: "navUsuarios",
                    class: pagina === "usuarios" ? "activo" : null
                }, el("i", { class: "fa-solid fa-user-gear" }), " Usuarios");
                menu.append(enlace);
            }
        }

        // Tarjetas de acceso rápido del Inicio
        document.querySelectorAll(".inicio-card").forEach(tarjeta => {
            if (!puedeVer(rol, paginaDe(tarjeta.getAttribute("href")))) {
                tarjeta.remove();
            }
        });

        // Datos de quien inició sesión
        const barra = document.querySelector(".sidebar");
        if (barra) {
            const cambiar = el("button", { type: "button", class: "sesion-link", text: "Cambiar contraseña" });
            const salir = el("button", { type: "button", class: "sesion-link sesion-salir", text: "Cerrar sesión" });
            cambiar.addEventListener("click", abrirCambioClave);
            salir.addEventListener("click", cerrarSesion);

            barra.append(el("div", { class: "sesion-box" },
                el("span", { class: "sesion-rol", text: sesion.rolEtiqueta }),
                el("strong", { class: "sesion-nombre", text: sesion.nombre }),
                el("span", { class: "sesion-usuario", text: "@" + sesion.nombreUsuario }),
                cambiar, salir));
        }

        // El chip "Recepcionista" fijo del encabezado pasa a mostrar quién es en realidad
        document.querySelectorAll(".encabezado .usuario span").forEach(s => { s.textContent = sesion.nombre; });

        document.documentElement.style.visibility = "";
    }

    function cuandoEsteListo(funcion) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", funcion);
        } else {
            funcion();
        }
    }

    (async function iniciar() {
        let sesion;
        try {
            const r = await fetchOriginal(`${API}/auth/me`, { headers: { Accept: "application/json" } });
            if (!r.ok) {
                irAlLogin();
                return;
            }
            sesion = await r.json();
        } catch (e) {
            irAlLogin();
            return;
        }

        window.usuarioActual = sesion;
        document.documentElement.dataset.rol = sesion.rol;

        // Si la recepción abre por link una pantalla que no le corresponde, vuelve a la suya
        if (!puedeVer(sesion.rol, pagina)) {
            location.replace(HOME[sesion.rol]);
            return;
        }

        resolverSesion(sesion);
        cuandoEsteListo(() => montar(sesion));
    })();
})();
