/* =========================================================
   USUARIOS - Italy Fitness (solo administrador)
   - Crear recepcionistas
   - Activar / desactivar cuentas
   - Definir una contraseña nueva para un recepcionista
========================================================= */
(function () {
    "use strict";

    const API = "http://localhost:8080";
    const URL_USUARIOS = `${API}/usuarios`;
    const $ = id => document.getElementById(id);
    if (!$("vistaUsuarios")) return;

    let usuarios = [];
    let usuarioClave = null;     // a quién se le cambia la contraseña

    function el(etiqueta, atributos = {}, ...hijos) {
        const nodo = document.createElement(etiqueta);
        for (const [clave, valor] of Object.entries(atributos)) {
            if (valor === false || valor == null) continue;
            if (clave === "class") nodo.className = valor;
            else if (clave === "text") nodo.textContent = valor;
            else if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
            else nodo.setAttribute(clave, valor === true ? "" : valor);
        }
        hijos.forEach(h => h && nodo.append(h));
        return nodo;
    }

    async function pedir(url, opciones = {}) {
        let r;
        try {
            r = await fetch(url, {
                ...opciones,
                headers: {
                    Accept: "application/json",
                    ...(opciones.body ? { "Content-Type": "application/json" } : {})
                }
            });
        } catch (e) {
            throw new Error("No se pudo conectar con el servidor. Verifique que Spring Boot esté funcionando.");
        }
        if (!r.ok) {
            let mensaje = `Error del servidor (HTTP ${r.status}).`;
            try {
                const d = await r.json();
                if (d && d.mensaje) mensaje = d.mensaje;
            } catch (e) { /* sin JSON */ }
            throw new Error(mensaje);
        }
        return r.status === 204 ? null : r.json();
    }

    // ---------- Mensajes ----------
    let temporizador;
    function mensaje(texto, tipo) {
        const caja = $("usrMensaje");
        caja.textContent = texto;
        caja.className = "usr-mensaje " + (tipo === "error" ? "usr-mensaje-error" : "usr-mensaje-ok");
        caja.hidden = false;
        clearTimeout(temporizador);
        if (tipo !== "error") {
            temporizador = setTimeout(() => { caja.hidden = true; }, 6000);
        }
    }

    // ---------- Lista ----------
    async function cargar() {
        try {
            const datos = await pedir(URL_USUARIOS);
            usuarios = Array.isArray(datos) ? datos : [];
        } catch (e) {
            mensaje(e.message, "error");
            usuarios = [];
        }
        dibujar();
    }

    function dibujar() {
        const cuerpo = $("usrTabla");
        cuerpo.replaceChildren();
        $("usrCantidad").textContent = String(usuarios.length);
        $("usrVacia").hidden = usuarios.length > 0;

        usuarios.forEach(u => {
            const esAdmin = u.rol === "ADMINISTRADOR";
            const acciones = esAdmin
                ? el("span", { class: "usr-muted", text: "Cuenta principal" })
                : el("div", { class: "usr-botones" },
                    el("button", {
                        type: "button", class: "usr-btn",
                        text: "Nueva contraseña",
                        onclick: () => abrirClave(u)
                    }),
                    el("button", {
                        type: "button",
                        class: "usr-btn " + (u.activo ? "usr-btn-baja" : "usr-btn-alta"),
                        text: u.activo ? "Desactivar" : "Activar",
                        onclick: () => cambiarEstado(u)
                    }));

            cuerpo.append(el("tr", { class: u.activo ? "" : "usr-inactivo" },
                el("td", { class: "usr-nombre", text: `${u.nombre} ${u.apellido}` }),
                el("td", { text: u.nombreUsuario }),
                el("td", { text: u.dni }),
                el("td", {}, el("span", {
                    class: "usr-rol " + (esAdmin ? "usr-rol-admin" : ""),
                    text: u.rolEtiqueta
                })),
                el("td", {}, el("span", {
                    class: "badge-estado " + (u.activo ? "estado-activo" : "estado-inactivo"),
                    text: u.activo ? "Activo" : "Desactivado"
                })),
                el("td", {}, acciones)));
        });
    }

    // ---------- Crear ----------
    async function crear(e) {
        e.preventDefault();
        const datos = {
            nombre: $("usrNombre").value.trim(),
            apellido: $("usrApellido").value.trim(),
            dni: $("usrDni").value.trim(),
            telefono: $("usrTelefono").value.trim(),
            nombreUsuario: $("usrUsuario").value.trim(),
            clave: $("usrClave").value
        };

        if (!datos.nombre || !datos.apellido || !datos.dni || !datos.nombreUsuario || !datos.clave) {
            mensaje("Completá nombre, apellido, DNI, usuario y contraseña.", "error");
            return;
        }

        const boton = $("btnCrearUsuario");
        boton.disabled = true;
        try {
            const creado = await pedir(URL_USUARIOS, { method: "POST", body: JSON.stringify(datos) });
            mensaje(`Usuario "${creado.nombreUsuario}" creado. Pasale la contraseña inicial en persona.`, "ok");
            limpiar();
            await cargar();
        } catch (err) {
            mensaje(err.message, "error");
        } finally {
            boton.disabled = false;
        }
    }

    function limpiar() {
        $("formUsuario").reset();
    }

    // ---------- Activar / desactivar ----------
    async function cambiarEstado(usuario) {
        const nuevo = !usuario.activo;
        const pregunta = nuevo
            ? `¿Activar a ${usuario.nombre} ${usuario.apellido}?`
            : `¿Desactivar a ${usuario.nombre} ${usuario.apellido}? No va a poder iniciar sesión.`;
        const confirmado = window.confirmar
            ? await window.confirmar(pregunta, nuevo ? "Activar" : "Desactivar")
            : confirm(pregunta);
        if (!confirmado) return;

        try {
            await pedir(`${URL_USUARIOS}/${usuario.id}/estado`, {
                method: "PUT", body: JSON.stringify({ activo: nuevo })
            });
            mensaje(`${usuario.nombreUsuario} ${nuevo ? "activado" : "desactivado"}.`, "ok");
        } catch (err) {
            mensaje(err.message, "error");
        }
        await cargar();
    }

    // ---------- Contraseña nueva ----------
    function abrirClave(usuario) {
        usuarioClave = usuario;
        $("usrModalTexto").textContent =
            `Definí una contraseña nueva para ${usuario.nombre} ${usuario.apellido} (${usuario.nombreUsuario}).`;
        $("usrNuevaClave").value = "";
        $("usrModalError").hidden = true;
        $("usrModal").hidden = false;
        $("usrNuevaClave").focus();
    }

    function cerrarClave() {
        $("usrModal").hidden = true;
        $("usrNuevaClave").value = "";
        usuarioClave = null;
    }

    async function guardarClave(e) {
        e.preventDefault();
        if (!usuarioClave) return;
        const nueva = $("usrNuevaClave").value;
        const boton = $("btnUsrGuardarClave");
        boton.disabled = true;
        try {
            await pedir(`${URL_USUARIOS}/${usuarioClave.id}/clave`, {
                method: "PUT", body: JSON.stringify({ nueva })
            });
            const nombre = usuarioClave.nombreUsuario;
            cerrarClave();
            mensaje(`Contraseña de ${nombre} actualizada.`, "ok");
        } catch (err) {
            $("usrModalError").textContent = err.message;
            $("usrModalError").hidden = false;
        } finally {
            boton.disabled = false;
        }
    }

    // ---------- Eventos ----------
    $("formUsuario").addEventListener("submit", crear);
    $("btnLimpiarUsuario").addEventListener("click", limpiar);
    $("formClaveUsuario").addEventListener("submit", guardarClave);
    $("btnUsrCancelar").addEventListener("click", cerrarClave);
    $("usrModal").addEventListener("click", e => { if (e.target === $("usrModal")) cerrarClave(); });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !$("usrModal").hidden) cerrarClave();
    });

    cargar();
})();
