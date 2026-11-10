/* =========================================================
   PROMOCIONES - ITALY FITNESS

   - Alta, edición y baja lógica (desactivar) de promociones.
   - Cada promoción tiene un % de descuento y fechas de vigencia.
   - Se aplican únicamente a la cuota del gimnasio (pantalla Pagos),
     nunca a los productos.

   Todo el código está dentro de una función para no chocar
   con variables de otros scripts.
========================================================= */
(function () {
    "use strict";

    const API = "http://localhost:8080";
    const URL_PROMOCIONES = `${API}/promociones`;

    const $ = id => document.getElementById(id);
    const vista = $("vistaPromociones");
    if (!vista) {
        return;
    }

    // Usa las notificaciones del sistema (notificaciones.js); si no están, los carteles del navegador.
    const avisar = (mensaje, tipo) => {
        if (typeof Notificaciones === "undefined") return alert(mensaje);
        if (tipo === "exito") Notificaciones.exito(mensaje);
        else if (tipo === "error") Notificaciones.error(mensaje);
        else Notificaciones.info(mensaje);
    };
    const preguntar = mensaje =>
        typeof Notificaciones !== "undefined"
            ? Notificaciones.confirmar(mensaje, "Desactivar promoción")
            : Promise.resolve(confirm(mensaje));

    // ---------- Estado ----------
    let promociones = [];
    let editandoId = null;

    // ---------- Utilidades ----------
    const normalizar = v =>
        String(v ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .trim();

    // "2026-11-08" -> "08/11/2026" (sin pasar por Date para evitar corrimientos de zona horaria)
    const fechaLinda = iso => {
        const [a, m, d] = String(iso ?? "").split("-");
        return a && m && d ? `${d}/${m}/${a}` : "—";
    };

    const porcentaje = n => `${Number(n ?? 0).toLocaleString("es-AR", { maximumFractionDigits: 2 })} %`;

    // Crea elementos sin usar innerHTML
    function el(etiqueta, atributos = {}, ...hijos) {
        const nodo = document.createElement(etiqueta);
        for (const [clave, valor] of Object.entries(atributos)) {
            if (valor === false || valor == null) continue;
            if (clave === "class") nodo.className = valor;
            else if (clave === "text") nodo.textContent = valor;
            else if (clave.startsWith("on")) nodo.addEventListener(clave.slice(2), valor);
            else nodo.setAttribute(clave, valor === true ? "" : valor);
        }
        hijos.forEach(hijo => hijo && nodo.append(hijo));
        return nodo;
    }

    const icono = clase => el("i", { class: `fa-solid ${clase}` });

    async function pedir(url, opciones = {}) {
        let respuesta;
        try {
            respuesta = await fetch(url, {
                ...opciones,
                headers: {
                    Accept: "application/json",
                    ...(opciones.body ? { "Content-Type": "application/json" } : {})
                }
            });
        } catch (e) {
            throw new Error(
                "No se pudo conectar con el servidor. Verifique que Spring Boot esté funcionando."
            );
        }

        if (!respuesta.ok) {
            let mensaje = `Error del servidor (HTTP ${respuesta.status}).`;
            try {
                const datos = await respuesta.json();
                if (datos && datos.mensaje) mensaje = datos.mensaje;
            } catch (e) { /* la respuesta no traía JSON */ }
            throw new Error(mensaje);
        }

        return respuesta.status === 204 ? null : respuesta.json();
    }

    // ---------- Carga ----------
    async function cargar() {
        try {
            const lista = await pedir(URL_PROMOCIONES);
            promociones = Array.isArray(lista) ? lista : [];
            renderTabla();
        } catch (error) {
            avisar(error.message, "error");
        }
    }

    // Texto y estilo del estado de una promoción
    function estadoDe(p) {
        if (p.vigente) return { texto: "Vigente", clase: "estado-activo" };
        if (!p.activa) return { texto: "Inactiva", clase: "estado-inactivo" };
        const hoy = new Date().toLocaleDateString("en-CA"); // aaaa-mm-dd local
        return p.fechaInicio > hoy
            ? { texto: "Próxima", clase: "estado-inactivo" }
            : { texto: "Vencida", clase: "estado-inactivo" };
    }

    // ---------- Listado ----------
    function renderTabla() {
        const consulta = normalizar($("promoBuscar").value);
        const lista = promociones.filter(p =>
            !consulta || normalizar(p.descripcion).includes(consulta)
        );

        $("cantidadPromos").textContent = promociones.length;

        const cuerpo = $("tablaPromos");
        cuerpo.replaceChildren();

        const vacia = $("promoTablaVacia");
        vacia.hidden = lista.length > 0;
        if (lista.length === 0) {
            const hay = promociones.length > 0;
            $("promoVaciaTitulo").textContent = hay
                ? "Ninguna promoción coincide con la búsqueda."
                : "No hay promociones registradas.";
            $("promoVaciaTexto").textContent = hay
                ? "Probá con otra descripción."
                : "Utilice el formulario para agregar una promoción.";
        }

        lista.forEach(p => {
            const estado = estadoDe(p);

            const acciones = el("div", { class: "acciones-tabla" },
                el("button", {
                    type: "button",
                    class: "btn-editar",
                    title: "Editar promoción",
                    "aria-label": `Editar ${p.descripcion}`,
                    onclick: () => editar(p)
                }, icono("fa-pen")),
                p.activa
                    ? el("button", {
                        type: "button",
                        class: "btn-eliminar",
                        title: "Desactivar promoción",
                        "aria-label": `Desactivar ${p.descripcion}`,
                        onclick: () => desactivar(p)
                    }, icono("fa-ban"))
                    : el("button", {
                        type: "button",
                        class: "btn-editar",
                        title: "Volver a activar",
                        "aria-label": `Activar ${p.descripcion}`,
                        onclick: () => reactivar(p)
                    }, icono("fa-rotate-left"))
            );

            cuerpo.append(el("tr", {},
                el("td", { class: "act-nombre", text: p.descripcion }),
                el("td", { text: porcentaje(p.porcentajeDescuento) }),
                el("td", { text: `${fechaLinda(p.fechaInicio)} al ${fechaLinda(p.fechaFin)}` }),
                el("td", {}, el("span", {
                    class: `badge-estado ${estado.clase}`,
                    text: estado.texto
                })),
                el("td", {}, acciones)
            ));
        });
    }

    // ---------- Formulario ----------
    function limpiarFormulario() {
        $("formPromo").reset();
        editandoId = null;
        $("tituloFormPromo").textContent = "REGISTRAR PROMOCIÓN";
        $("btnGuardarPromo").textContent = "Guardar promoción";
        $("btnCancelarPromo").hidden = true;
    }

    function editar(p) {
        editandoId = p.idPromocion;
        $("promoDescripcion").value = p.descripcion ?? "";
        $("promoPorcentaje").value = p.porcentajeDescuento ?? "";
        $("promoDesde").value = p.fechaInicio ?? "";
        $("promoHasta").value = p.fechaFin ?? "";
        $("promoActiva").value = p.activa ? "true" : "false";

        $("tituloFormPromo").textContent = "EDITAR PROMOCIÓN";
        $("btnGuardarPromo").textContent = "Guardar cambios";
        $("btnCancelarPromo").hidden = false;

        $("formPromo").scrollIntoView({ behavior: "smooth", block: "center" });
        $("promoDescripcion").focus();
    }

    function datosDelFormulario() {
        return {
            descripcion: $("promoDescripcion").value.trim(),
            porcentajeDescuento: Number($("promoPorcentaje").value),
            fechaInicio: $("promoDesde").value,
            fechaFin: $("promoHasta").value,
            activa: $("promoActiva").value === "true"
        };
    }

    async function guardar(evento) {
        evento.preventDefault();
        const datos = datosDelFormulario();

        if (!datos.descripcion) {
            avisar("Ingresá la descripción de la promoción.", "aviso");
            return;
        }
        if (!(datos.porcentajeDescuento > 0 && datos.porcentajeDescuento <= 100)) {
            avisar("El descuento debe ser mayor a 0 y hasta 100 %.", "aviso");
            return;
        }
        if (!datos.fechaInicio || !datos.fechaFin) {
            avisar("Completá las fechas de vigencia.", "aviso");
            return;
        }
        if (datos.fechaFin < datos.fechaInicio) {
            avisar("La fecha de fin no puede ser anterior a la de inicio.", "aviso");
            return;
        }

        const boton = $("btnGuardarPromo");
        boton.disabled = true;

        try {
            if (editandoId == null) {
                await pedir(URL_PROMOCIONES, { method: "POST", body: JSON.stringify(datos) });
                avisar("Promoción registrada.", "exito");
            } else {
                await pedir(`${URL_PROMOCIONES}/${editandoId}`, {
                    method: "PUT",
                    body: JSON.stringify(datos)
                });
                avisar("Promoción actualizada.", "exito");
            }
            limpiarFormulario();
            await cargar();
        } catch (error) {
            avisar(error.message, "error");
        } finally {
            boton.disabled = false;
        }
    }

    async function desactivar(p) {
        const confirmado = await preguntar(
            `¿Desactivar la promoción "${p.descripcion}"? Los pagos ya registrados no cambian.`
        );
        if (!confirmado) return;

        try {
            await pedir(`${URL_PROMOCIONES}/${p.idPromocion}`, { method: "DELETE" });
            if (String(editandoId) === String(p.idPromocion)) limpiarFormulario();
            avisar("Promoción desactivada.", "exito");
            await cargar();
        } catch (error) {
            avisar(error.message, "error");
        }
    }

    async function reactivar(p) {
        try {
            await pedir(`${URL_PROMOCIONES}/${p.idPromocion}`, {
                method: "PUT",
                body: JSON.stringify({
                    descripcion: p.descripcion,
                    porcentajeDescuento: p.porcentajeDescuento,
                    fechaInicio: p.fechaInicio,
                    fechaFin: p.fechaFin,
                    activa: true
                })
            });
            avisar("Promoción activada.", "exito");
            await cargar();
        } catch (error) {
            avisar(error.message, "error");
        }
    }

    // ---------- Eventos ----------
    $("formPromo").addEventListener("submit", guardar);
    $("btnCancelarPromo").addEventListener("click", limpiarFormulario);
    $("promoBuscar").addEventListener("input", renderTabla);

    cargar();
})();
