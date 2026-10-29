/* =========================================================
   ACTIVIDADES - ITALY FITNESS

   - Alta, edición, baja y disponibilidad de actividades.
   - Asignación de actividades a un socio.
   - Listado de la actividad que realiza cada socio.

   Todo el código está dentro de una función para no chocar
   con variables de socios.js, productos.js, pagos.js, etc.
========================================================= */
(function () {
    "use strict";

    const API = "http://localhost:8080";
    const URL_ACTIVIDADES = `${API}/actividades`;
    const URL_SOCIOS = `${API}/socios`;

    const $ = id => document.getElementById(id);
    const vista = $("vistaActividades");
    if (!vista) {
        return;
    }

    // Usa los carteles de avisos.js si está instalado; si no, los del navegador.
    const avisar = (mensaje, tipo) =>
        window.avisar ? window.avisar(mensaje, tipo) : alert(mensaje);
    const preguntar = mensaje =>
        window.confirmar
            ? window.confirmar(mensaje, "Eliminar")
            : Promise.resolve(confirm(mensaje));

    // ---------- Estado ----------
    let actividades = [];
    let socios = [];
    let editandoId = null;
    let socioElegido = null;

    // ---------- Utilidades ----------
    const moneda = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 2
    });

    const normalizar = v =>
        String(v ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .trim();

    const soloDigitos = v => String(v ?? "").replace(/\D/g, "");
    const mismoId = (a, b) => String(a) === String(b);

    // Crea elementos sin usar innerHTML: el texto del usuario nunca se interpreta como HTML.
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

    const nombreCompleto = s =>
        [s.apellido, s.nombre].filter(Boolean).join(", ") || "Socio sin nombre";

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

    const idsDeSocios = a => (Array.isArray(a.idsSocios) ? a.idsSocios : []);

    const actividadesDe = socio =>
        actividades.filter(a => idsDeSocios(a).some(id => mismoId(id, socio.id)));

    // ---------- Carga de datos ----------
    async function cargar() {
        try {
            const [listaActividades, listaSocios] = await Promise.all([
                pedir(URL_ACTIVIDADES),
                pedir(URL_SOCIOS)
            ]);

            actividades = Array.isArray(listaActividades) ? listaActividades : [];
            socios = Array.isArray(listaSocios)
                ? listaSocios
                : Array.isArray(listaSocios?.content)
                    ? listaSocios.content
                    : [];

            // Si el socio elegido sigue existiendo, tomamos sus datos actualizados
            if (socioElegido) {
                socioElegido = socios.find(s => mismoId(s.id, socioElegido.id)) || null;
            }

            renderTodo();
        } catch (error) {
            avisar(error.message, "error");
        }
    }

    function renderTodo() {
        renderTabla();
        renderSocioElegido();
        renderChecks();
        renderFiltro();
        renderInscripciones();
    }

    // ---------- Listado de actividades ----------
    function renderTabla() {
        const consulta = normalizar($("actBuscar").value);
        const lista = actividades.filter(a =>
            !consulta ||
            normalizar(a.nombre).includes(consulta) ||
            normalizar(a.descripcion).includes(consulta)
        );

        $("cantidadActividades").textContent = actividades.length;

        const cuerpo = $("tablaActividades");
        cuerpo.replaceChildren();

        const vacia = $("actTablaVacia");
        vacia.hidden = lista.length > 0;
        if (lista.length === 0) {
            const hayActividades = actividades.length > 0;
            $("actVaciaTitulo").textContent = hayActividades
                ? "Ninguna actividad coincide con la búsqueda."
                : "No hay actividades registradas.";
            $("actVaciaTexto").textContent = hayActividades
                ? "Probá con otro nombre."
                : "Utilice el formulario para agregar una actividad.";
        }

        lista.forEach(a => {
            const disponible = a.disponible !== false;

            const acciones = el("div", { class: "acciones-tabla" },
                el("button", {
                    type: "button",
                    class: "btn-editar",
                    title: "Editar actividad",
                    "aria-label": `Editar ${a.nombre}`,
                    onclick: () => editar(a)
                }, icono("fa-pen")),
                el("button", {
                    type: "button",
                    class: "btn-editar",
                    title: disponible ? "Marcar como no disponible" : "Marcar como disponible",
                    "aria-label": disponible
                        ? `Marcar ${a.nombre} como no disponible`
                        : `Marcar ${a.nombre} como disponible`,
                    onclick: () => cambiarDisponibilidad(a)
                }, icono(disponible ? "fa-toggle-on" : "fa-toggle-off")),
                el("button", {
                    type: "button",
                    class: "btn-eliminar",
                    title: "Eliminar actividad",
                    "aria-label": `Eliminar ${a.nombre}`,
                    onclick: () => eliminar(a)
                }, icono("fa-trash"))
            );

            cuerpo.append(el("tr", {},
                el("td", { class: "act-nombre", text: a.nombre }),
                el("td", { class: "act-desc", text: a.descripcion || "—" }),
                el("td", { text: moneda.format(a.precioCuota ?? 0) }),
                el("td", { text: String(a.cantidadInscriptos ?? idsDeSocios(a).length) }),
                el("td", {}, el("span", {
                    class: `badge-estado ${disponible ? "estado-activo" : "estado-inactivo"}`,
                    text: disponible ? "Disponible" : "No disponible"
                })),
                el("td", {}, acciones)
            ));
        });
    }

    // ---------- Formulario ----------
    function limpiarFormulario() {
        $("formActividad").reset();
        editandoId = null;
        $("tituloFormActividad").textContent = "REGISTRAR ACTIVIDAD";
        $("btnGuardarActividad").textContent = "Guardar actividad";
        $("btnCancelarActividad").hidden = true;
    }

    function editar(actividad) {
        editandoId = actividad.idActividad;
        $("actNombre").value = actividad.nombre ?? "";
        $("actDescripcion").value = actividad.descripcion ?? "";
        $("actPrecio").value = actividad.precioCuota ?? "";
        $("actDisponible").value = actividad.disponible === false ? "false" : "true";

        $("tituloFormActividad").textContent = "EDITAR ACTIVIDAD";
        $("btnGuardarActividad").textContent = "Guardar cambios";
        $("btnCancelarActividad").hidden = false;

        $("formActividad").scrollIntoView({ behavior: "smooth", block: "center" });
        $("actNombre").focus();
    }

    async function guardar(evento) {
        evento.preventDefault();

        const datos = {
            nombre: $("actNombre").value.trim(),
            descripcion: $("actDescripcion").value.trim(),
            precioCuota: Number($("actPrecio").value),
            disponible: $("actDisponible").value === "true"
        };

        if (!datos.nombre) {
            avisar("Ingresá el nombre de la actividad.", "aviso");
            return;
        }
        if (!(datos.precioCuota > 0)) {
            avisar("El precio de la cuota debe ser mayor a 0.", "aviso");
            return;
        }

        const boton = $("btnGuardarActividad");
        boton.disabled = true;

        try {
            if (editandoId == null) {
                await pedir(URL_ACTIVIDADES, { method: "POST", body: JSON.stringify(datos) });
                avisar("Actividad registrada.", "exito");
            } else {
                await pedir(`${URL_ACTIVIDADES}/${editandoId}`, {
                    method: "PUT",
                    body: JSON.stringify(datos)
                });
                avisar("Actividad actualizada.", "exito");
            }
            limpiarFormulario();
            await cargar();
        } catch (error) {
            avisar(error.message, "error");
        } finally {
            boton.disabled = false;
        }
    }

    async function cambiarDisponibilidad(actividad) {
        const disponible = actividad.disponible === false;
        try {
            await pedir(`${URL_ACTIVIDADES}/${actividad.idActividad}`, {
                method: "PUT",
                body: JSON.stringify({
                    nombre: actividad.nombre,
                    descripcion: actividad.descripcion ?? "",
                    precioCuota: actividad.precioCuota,
                    disponible
                })
            });
            avisar(
                `"${actividad.nombre}" ahora está ${disponible ? "disponible" : "no disponible"}.`,
                "exito"
            );
            await cargar();
        } catch (error) {
            avisar(error.message, "error");
        }
    }

    async function eliminar(actividad) {
        const confirmado = await preguntar(`¿Eliminar la actividad "${actividad.nombre}"?`);
        if (!confirmado) return;

        try {
            await pedir(`${URL_ACTIVIDADES}/${actividad.idActividad}`, { method: "DELETE" });
            if (mismoId(editandoId, actividad.idActividad)) limpiarFormulario();
            avisar("Actividad eliminada.", "exito");
            await cargar();
        } catch (error) {
            avisar(error.message, "error");
        }
    }

    // ---------- Asignar actividades a un socio ----------
    function buscarSocios() {
        const consulta = normalizar($("actBuscarSocio").value);
        const contenedor = $("actResultadosSocio");
        contenedor.replaceChildren();
        if (!consulta) return;

        const digitos = soloDigitos(consulta);
        const hallados = socios
            .filter(s =>
                normalizar(`${s.nombre} ${s.apellido}`).includes(consulta) ||
                normalizar(`${s.apellido} ${s.nombre}`).includes(consulta) ||
                (digitos && soloDigitos(s.dni).includes(digitos))
            )
            .slice(0, 6);

        if (hallados.length === 0) {
            contenedor.append(el("div", {
                class: "act-sin-resultados",
                text: "No se encontraron socios."
            }));
            return;
        }

        hallados.forEach(s => {
            contenedor.append(el("button", {
                type: "button",
                text: `${nombreCompleto(s)} · DNI ${s.dni ?? "—"}`,
                onclick: () => elegirSocio(s)
            }));
        });
    }

    function elegirSocio(socio) {
        socioElegido = socio;
        $("actBuscarSocio").value = "";
        $("actResultadosSocio").replaceChildren();
        renderSocioElegido();
        renderChecks();
    }

    function renderSocioElegido() {
        const caja = $("actSocioElegido");
        caja.replaceChildren();
        caja.hidden = !socioElegido;
        if (!socioElegido) return;

        caja.append(
            icono("fa-user-check"),
            el("div", {},
                el("strong", { text: nombreCompleto(socioElegido) }),
                el("small", { text: `DNI ${socioElegido.dni ?? "—"}` })
            )
        );
    }

    function renderChecks() {
        const lista = $("actListaChecks");
        lista.replaceChildren();
        $("btnGuardarAsignacion").disabled = !socioElegido;

        if (!socioElegido) {
            lista.append(el("div", {
                class: "act-vacio",
                text: "Elegí un socio para asignarle actividades."
            }));
            return;
        }

        if (actividades.length === 0) {
            $("btnGuardarAsignacion").disabled = true;
            lista.append(el("div", {
                class: "act-vacio",
                text: "Primero registrá al menos una actividad."
            }));
            return;
        }

        actividades.forEach(a => {
            const tiene = idsDeSocios(a).some(id => mismoId(id, socioElegido.id));
            const bloqueada = a.disponible === false && !tiene;

            lista.append(el("label", {
                class: `act-check${bloqueada ? " deshabilitada" : ""}`
            },
                el("input", {
                    type: "checkbox",
                    value: a.idActividad,
                    checked: tiene,
                    disabled: bloqueada
                }),
                el("span", { text: a.nombre }),
                el("small", {
                    text: bloqueada
                        ? "No disponible"
                        : moneda.format(a.precioCuota ?? 0)
                })
            ));
        });
    }

    async function guardarAsignacion() {
        if (!socioElegido) return;

        const ids = [...$("actListaChecks").querySelectorAll("input:checked")]
            .map(casilla => Number(casilla.value));

        const boton = $("btnGuardarAsignacion");
        boton.disabled = true;

        try {
            await pedir(`${URL_ACTIVIDADES}/socio/${socioElegido.id}`, {
                method: "PUT",
                body: JSON.stringify(ids)
            });
            avisar(`Actividades de ${nombreCompleto(socioElegido)} actualizadas.`, "exito");
            await cargar();
        } catch (error) {
            avisar(error.message, "error");
        } finally {
            boton.disabled = !socioElegido;
        }
    }

    // ---------- Actividad de cada socio ----------
    function renderFiltro() {
        const select = $("actFiltro");
        const anterior = select.value;
        select.replaceChildren(
            el("option", { value: "TODAS", text: "Todos los socios" }),
            el("option", { value: "NINGUNA", text: "Socios sin actividad" }),
            ...actividades.map(a => el("option", {
                value: a.idActividad,
                text: `Solo ${a.nombre}`
            }))
        );
        select.value = [...select.options].some(o => o.value === anterior) ? anterior : "TODAS";
    }

    function renderInscripciones() {
        const filtro = $("actFiltro").value;

        const lista = [...socios]
            .sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es"))
            .filter(s => {
                const suyas = actividadesDe(s);
                if (filtro === "TODAS") return true;
                if (filtro === "NINGUNA") return suyas.length === 0;
                return suyas.some(a => mismoId(a.idActividad, filtro));
            });

        $("cantidadInscripciones").textContent = lista.length;
        $("actInscripcionesVacia").hidden = lista.length > 0;

        const cuerpo = $("tablaInscripciones");
        cuerpo.replaceChildren();

        lista.forEach(s => {
            const suyas = actividadesDe(s);

            const celdaActividades = el("td", {},
                ...(suyas.length > 0
                    ? suyas.map(a => el("span", { class: "chip-actividad", text: a.nombre }))
                    : [el("span", { class: "act-muted", text: "Sin actividad" })])
            );

            cuerpo.append(el("tr", {},
                el("td", { class: "act-nombre", text: nombreCompleto(s) }),
                el("td", { text: String(s.dni ?? "—") }),
                celdaActividades,
                el("td", {}, el("div", { class: "acciones-tabla" },
                    el("button", {
                        type: "button",
                        class: "btn-editar",
                        title: "Cambiar actividades",
                        "aria-label": `Cambiar actividades de ${nombreCompleto(s)}`,
                        onclick: () => {
                            elegirSocio(s);
                            $("actListaChecks").scrollIntoView({ behavior: "smooth", block: "center" });
                        }
                    }, icono("fa-pen"))
                ))
            ));
        });
    }

    // ---------- Navegación ----------
    // navegacion.js muestra/oculta la vista y llama a esta función cada vez que se entra
    window.cargarActividades = cargar;
    cargar();

    // ---------- Eventos ----------
    $("formActividad").addEventListener("submit", guardar);
    $("btnCancelarActividad").addEventListener("click", limpiarFormulario);
    $("actBuscar").addEventListener("input", renderTabla);
    $("actBuscarSocio").addEventListener("input", buscarSocios);
    $("btnGuardarAsignacion").addEventListener("click", guardarAsignacion);
    $("actFiltro").addEventListener("change", renderInscripciones);

    renderChecks();
})();
