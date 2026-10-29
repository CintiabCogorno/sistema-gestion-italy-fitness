/* =========================================================
   FICHA DEL SOCIO - ITALY FITNESS

   Desde la vista de Socios permite, sobre el socio elegido:
   - registrar un pago
   - asignar actividades
   Se abre con el botón "Gestionar" de la tabla o, solo, al
   guardar un socio nuevo.
========================================================= */
(function () {
    "use strict";

    const API = "http://localhost:8080";
    const $ = id => document.getElementById(id);
    const panel = $("fichaSocio");
    if (!panel) {
        return;
    }

    const avisar = (mensaje, tipo) =>
        window.avisar ? window.avisar(mensaje, tipo) : alert(mensaje);

    let socio = null;
    let listaSocios = [];
    let actividades = [];
    let pagosDelSocio = [];

    const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

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
                if (d && (d.mensaje || d.message)) mensaje = d.mensaje || d.message;
            } catch (e) { /* sin JSON */ }
            throw new Error(mensaje);
        }
        return r.status === 204 ? null : r.json().catch(() => null);
    }

    const hoy = () => new Date().toLocaleDateString("en-CA");

    // ---------- Pestañas ----------
    function mostrarPestana(nombre) {
        document.querySelectorAll("#fichaSocio .fs-tab").forEach(b => {
            const activa = b.dataset.tab === nombre;
            b.classList.toggle("activa", activa);
            b.setAttribute("aria-selected", String(activa));
        });
        $("fsPanelPago").hidden = nombre !== "pago";
        $("fsPanelActividades").hidden = nombre !== "actividades";
    }

    // ---------- Apertura / cierre ----------
    async function abrir(id, pestana = "pago", mensaje = "") {
        try {
            socio = await pedir(`${API}/socios/${id}`);
        } catch (e) {
            avisar(e.message, "error");
            return;
        }

        listaSocios = [];   // se vuelve a pedir en la próxima búsqueda (puede haber socios nuevos)
        const nombre = [socio.nombre, socio.apellido].filter(Boolean).join(" ") || "Socio";
        $("fsNombre").textContent = nombre;
        $("fsDni").textContent = `DNI ${socio.dni ?? "—"}`;
        $("fsMensaje").textContent = mensaje;
        $("fsMensaje").hidden = !mensaje;

        $("fsFecha").value = hoy();
        $("fsImporte").value = "";
        $("fsMedio").value = "";

        $("fsElegir").hidden = true;
        $("fsCuerpo").hidden = false;
        mostrarPestana(pestana);
        panel.scrollIntoView({ behavior: "smooth", block: "start" });
        await cargarDatos();
    }

    // Vuelve al buscador para elegir otro socio
    function cerrar() {
        socio = null;
        $("fsCuerpo").hidden = true;
        $("fsElegir").hidden = false;
        $("fsBuscar").value = "";
        $("fsResultados").replaceChildren();
        $("fsBuscar").focus();
    }

    // ---------- Buscador de socios ----------
    const normalizar = v =>
        String(v ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

    async function buscar() {
        const caja = $("fsResultados");
        caja.replaceChildren();
        const crudo = $("fsBuscar").value;
        const texto = normalizar(crudo);
        if (!texto) return;

        if (listaSocios.length === 0) {
            try {
                const datos = await pedir(`${API}/socios`);
                listaSocios = Array.isArray(datos) ? datos : [];
            } catch (e) {
                avisar(e.message, "error");
                return;
            }
        }

        const digitos = crudo.replace(/\D/g, "");
        const hallados = listaSocios.filter(s =>
            normalizar(`${s.nombre} ${s.apellido}`).includes(texto) ||
            normalizar(`${s.apellido} ${s.nombre}`).includes(texto) ||
            (digitos && String(s.dni ?? "").replace(/\D/g, "").includes(digitos))
        ).slice(0, 6);

        if (hallados.length === 0) {
            caja.append(el("div", { class: "fs-vacio", text: "No se encontraron socios." }));
            return;
        }
        hallados.forEach(s => {
            const b = el("button", { type: "button" },
                el("span", { text: [s.apellido, s.nombre].filter(Boolean).join(", ") }),
                el("small", { text: `DNI ${s.dni ?? "—"}` }));
            b.addEventListener("click", () => abrir(s.id));
            caja.append(b);
        });
    }

    async function cargarDatos() {
        if (!socio) return;
        try {
            const [listaActividades, listaPagos] = await Promise.all([
                pedir(`${API}/actividades`),
                pedir(`${API}/pagos`)
            ]);
            actividades = Array.isArray(listaActividades) ? listaActividades : [];
            pagosDelSocio = (Array.isArray(listaPagos) ? listaPagos : [])
                .filter(p => String(p.idSocio) === String(socio.id))
                .sort((a, b) => String(b.fechaPago).localeCompare(String(a.fechaPago)));
        } catch (e) {
            avisar(e.message, "error");
        }
        dibujarPagos();
        dibujarActividades();
    }

    // ---------- Pagos ----------
    function dibujarPagos() {
        const caja = $("fsPagos");
        caja.replaceChildren();

        const vigentes = pagosDelSocio.filter(p => !p.anulado);
        $("fsUltimoPago").textContent = vigentes.length
            ? `Último pago: ${vigentes[0].fechaPago} · ${moneda.format(vigentes[0].valorCuota)}`
            : "Todavía no registra pagos.";

        pagosDelSocio.slice(0, 5).forEach(p => {
            caja.append(el("li", { class: p.anulado ? "fs-anulado" : "" },
                el("span", { text: p.fechaPago }),
                el("span", { text: p.medioPago || "—" }),
                el("strong", { text: moneda.format(p.valorCuota) }),
                p.anulado ? el("em", { text: "Anulado" }) : null));
        });
    }

    async function registrarPago(e) {
        e.preventDefault();
        if (!socio) return;

        const fecha = $("fsFecha").value;
        const importe = Number($("fsImporte").value);
        const medio = $("fsMedio").value;

        if (!fecha || fecha > hoy()) {
            avisar("La fecha de pago no puede estar vacía ni ser futura.", "error");
            return;
        }
        if (!Number.isFinite(importe) || importe <= 0) {
            avisar("Ingresá un importe mayor que cero.", "error");
            return;
        }
        if (!medio) {
            avisar("Elegí el medio de pago.", "error");
            return;
        }

        const boton = $("fsBtnPago");
        boton.disabled = true;
        try {
            await pedir(`${API}/pagos?idSocio=${encodeURIComponent(socio.id)}`, {
                method: "POST",
                body: JSON.stringify({ fechaPago: fecha, valorCuota: importe, medioPago: medio, anulado: false })
            });
            avisar("Pago registrado y asociado al socio.", "exito");
            $("fsImporte").value = "";
            $("fsMedio").value = "";
            await cargarDatos();
            window.cargarPagos?.();
        } catch (err) {
            avisar(`No se pudo guardar el pago: ${err.message}`, "error");
        } finally {
            boton.disabled = false;
        }
    }

    // ---------- Actividades ----------
    function dibujarActividades() {
        const lista = $("fsActividades");
        lista.replaceChildren();

        if (actividades.length === 0) {
            lista.append(el("p", { class: "fs-vacio", text: "Todavía no hay actividades cargadas. Crealas en la sección Actividades." }));
            $("fsBtnActividades").disabled = true;
            return;
        }
        $("fsBtnActividades").disabled = false;

        actividades.forEach(a => {
            const asignada = (a.idsSocios || []).some(id => String(id) === String(socio.id));
            // Una actividad no disponible solo se puede quitar, no sumar
            const bloqueada = !a.disponible && !asignada;
            const casilla = el("input", { type: "checkbox", value: a.idActividad, disabled: bloqueada });
            casilla.checked = asignada;

            lista.append(el("label", { class: "fs-actividad" + (bloqueada ? " bloqueada" : "") },
                casilla,
                el("span", { class: "fs-act-nombre", text: a.nombre }),
                el("small", { text: bloqueada ? "No disponible" : moneda.format(a.precioCuota ?? 0) })));
        });
    }

    async function guardarActividades() {
        if (!socio) return;
        const ids = [...$("fsActividades").querySelectorAll("input:checked")].map(c => Number(c.value));

        const boton = $("fsBtnActividades");
        boton.disabled = true;
        try {
            await pedir(`${API}/actividades/socio/${socio.id}`, { method: "PUT", body: JSON.stringify(ids) });
            avisar("Actividades del socio actualizadas.", "exito");
            await cargarDatos();
            window.cargarSocios?.();
        } catch (err) {
            avisar(err.message, "error");
        } finally {
            boton.disabled = false;
        }
    }

    // ---------- Eventos ----------
    document.querySelectorAll("#fichaSocio .fs-tab").forEach(b =>
        b.addEventListener("click", () => mostrarPestana(b.dataset.tab)));
    $("fsCerrar").addEventListener("click", cerrar);
    $("fsBuscar").addEventListener("input", buscar);
    $("fsFormPago").addEventListener("submit", registrarPago);
    $("fsBtnActividades").addEventListener("click", guardarActividades);

    window.abrirFichaSocio = abrir;
})();
