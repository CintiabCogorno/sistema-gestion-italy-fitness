/* =========================================================
   CAJA - Italy Fitness (solo administrador)

   - Resumen: ingresos, egresos y saldo del período, y saldo total.
   - Egresos a mano: compra de productos (suma stock), sueldos de
     profesores y recepcionistas, otros gastos.
   - Movimientos con filtros. Los ingresos (cuotas y ventas) entran
     solos desde Pagos y Ventas; se anulan desde allí.

   Los totales los calcula el servidor: acá solo se muestran.
========================================================= */
(function () {
    "use strict";

    const API = "http://localhost:8080";
    const URL_CAJA = `${API}/caja`;
    const URL_PRODUCTOS = `${API}/productos`;
    const URL_USUARIOS = `${API}/usuarios`;

    const $ = id => document.getElementById(id);
    if (!$("vistaCaja")) return;

    // ---------- Estado ----------
    let datos = null;            // última respuesta de GET /caja
    let productos = [];
    let periodoActivo = "mes";
    let enviando = false;
    let pedidoVigente = 0;       // para ignorar respuestas viejas si se pide de nuevo

    // ---------- Utilidades ----------
    const moneda = new Intl.NumberFormat("es-AR", {
        style: "currency", currency: "ARS", minimumFractionDigits: 2
    });
    const dinero = n => moneda.format(Number(n) || 0);
    const dos = n => String(n).padStart(2, "0");

    const normalizar = v =>
        String(v ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

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

    // Fecha sin hora ("2026-10-28" o [2026, 10, 28]) como día local.
    // No se usa new Date("2026-10-28") porque la toma como UTC y en Argentina daría el día anterior.
    function parsearDia(valor) {
        if (Array.isArray(valor)) {
            const [a, m, d] = valor;
            return new Date(a, m - 1, d);
        }
        const t = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(valor ?? ""));
        return t ? new Date(Number(t[1]), Number(t[2]) - 1, Number(t[3])) : null;
    }
    const aISO = f => `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
    function formatearDia(valor) {
        const f = parsearDia(valor);
        return f ? `${dos(f.getDate())}/${dos(f.getMonth() + 1)}/${f.getFullYear()}` : "—";
    }
    const hoy = () => { const f = new Date(); return new Date(f.getFullYear(), f.getMonth(), f.getDate()); };

    // Acepta "15000", "15000.50", "15000,50", "15.000" y "15.000,50"
    function parsearMonto(texto) {
        let t = String(texto ?? "").replace(/[\s$]/g, "");
        if (!t) return NaN;
        if (t.includes(",")) {
            t = t.replace(/\./g, "").replace(",", ".");
        } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
            t = t.replace(/\./g, "");
        }
        return /^\d+(\.\d+)?$/.test(t) ? Number(t) : NaN;
    }

    const MEDIOS = {
        EFECTIVO: "Efectivo", TRANSFERENCIA: "Transferencia",
        DEBITO: "Tarjeta de débito", CREDITO: "Tarjeta de crédito", OTRO: "Otro"
    };
    const nombreMedio = v => MEDIOS[String(v ?? "").toUpperCase()] || v || "";

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
        const caja = $("cajaMensaje");
        caja.textContent = texto;
        caja.className = "caja-mensaje " + (tipo === "error" ? "caja-mensaje-error" : "caja-mensaje-ok");
        caja.hidden = false;
        clearTimeout(temporizador);
        if (tipo !== "error") {
            temporizador = setTimeout(() => { caja.hidden = true; }, 6000);
        }
    }

    function errorFormulario(texto) {
        const caja = $("egError");
        caja.textContent = texto || "";
        caja.hidden = !texto;
    }

    // ---------- Períodos ----------
    function rangoDe(periodo) {
        const h = hoy();
        switch (periodo) {
            case "hoy": return [h, h];
            case "semana": return [new Date(h.getFullYear(), h.getMonth(), h.getDate() - 6), h];
            case "mes": return [new Date(h.getFullYear(), h.getMonth(), 1), h];
            case "mesAnterior":
                return [new Date(h.getFullYear(), h.getMonth() - 1, 1), new Date(h.getFullYear(), h.getMonth(), 0)];
            default: return [null, null];
        }
    }

    function marcarPeriodo(periodo) {
        periodoActivo = periodo;
        document.querySelectorAll(".caja-periodo").forEach(b =>
            b.classList.toggle("activo", b.dataset.periodo === periodo));
    }

    function aplicarPeriodo(periodo) {
        const [d, h] = rangoDe(periodo);
        $("cjDesde").value = d ? aISO(d) : "";
        $("cjHasta").value = h ? aISO(h) : "";
        marcarPeriodo(periodo);
        cargar();
    }

    // ---------- Carga ----------
    async function cargar() {
        const desde = $("cjDesde").value;
        const hasta = $("cjHasta").value;
        if (desde && hasta && desde > hasta) {
            mensaje("La fecha \"Desde\" no puede ser posterior a \"Hasta\".", "error");
            return;
        }

        const params = new URLSearchParams();
        if (desde) params.set("desde", desde);
        if (hasta) params.set("hasta", hasta);
        const consulta = params.toString();

        const numero = ++pedidoVigente;
        try {
            const respuesta = await pedir(consulta ? `${URL_CAJA}?${consulta}` : URL_CAJA);
            if (numero !== pedidoVigente) return;     // llegó una respuesta más nueva
            datos = respuesta;
            $("cajaMensaje").hidden = true;
        } catch (e) {
            if (numero !== pedidoVigente) return;
            mensaje(e.message, "error");
            return;
        }
        dibujar();
    }

    async function cargarProductos() {
        try {
            const lista = await pedir(URL_PRODUCTOS);
            productos = Array.isArray(lista) ? lista : [];
        } catch (e) {
            productos = [];
        }
        const select = $("egProducto");
        const elegido = select.value;
        select.replaceChildren(el("option", { value: "", text: "Sin producto: otra compra" }));
        [...productos]
            .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"))
            .forEach(p => select.append(el("option", {
                value: String(p.idProducto),
                text: `${p.nombre} (stock: ${p.stock})`
            })));
        if ([...select.options].some(o => o.value === elegido)) select.value = elegido;
    }

    async function cargarRecepcionistas() {
        try {
            const lista = await pedir(URL_USUARIOS);
            const nombres = (Array.isArray(lista) ? lista : [])
                .filter(u => u.rol === "RECEPCIONISTA")
                .map(u => `${u.nombre} ${u.apellido}`.trim());
            $("egRecepcionistas").replaceChildren(
                ...nombres.map(n => el("option", { value: n })));
        } catch (e) { /* sin sugerencias: se escribe a mano */ }
    }

    // ---------- Dibujo ----------
    function dibujar() {
        if (!datos) return;

        $("cajaIngresos").textContent = dinero(datos.totalIngresos);
        $("cajaEgresos").textContent = dinero(datos.totalEgresos);

        const saldo = $("cajaSaldo");
        saldo.textContent = dinero(datos.saldo);
        saldo.className = Number(datos.saldo) < 0 ? "caja-egreso" : "caja-ingreso";

        const total = $("cajaSaldoTotal");
        total.textContent = dinero(datos.saldoTotal);
        total.className = Number(datos.saldoTotal) < 0 ? "caja-egreso" : "caja-ingreso";

        dibujarDesglose();
        dibujarTabla();
    }

    function dibujarDesglose() {
        const contenedor = $("cajaDesglose");
        const elegida = $("cjCategoria").value;
        const totalIngresos = Number(datos.totalIngresos) || 0;
        const totalEgresos = Number(datos.totalEgresos) || 0;

        contenedor.replaceChildren(...(datos.categorias || []).map(c => {
            const esIngreso = c.tipo === "INGRESO";
            const base = esIngreso ? totalIngresos : totalEgresos;
            const porcentaje = base > 0 ? Math.round((Number(c.total) / base) * 100) : 0;
            const detalle = `${c.cantidad} ${c.cantidad === 1 ? "movimiento" : "movimientos"}` +
                (base > 0 ? ` · ${porcentaje}% de los ${esIngreso ? "ingresos" : "egresos"}` : "");

            const tarjeta = el("button", {
                type: "button",
                class: "caja-cat" + (esIngreso ? " caja-cat-ingreso" : " caja-cat-egreso") +
                    (elegida === c.categoria ? " elegida" : ""),
                "aria-pressed": elegida === c.categoria ? "true" : "false",
                title: "Tocá para filtrar por esta categoría"
            },
                el("span", { class: "caja-cat-nombre", text: c.etiqueta }),
                el("span", { class: "caja-cat-monto", text: (esIngreso ? "+ " : "− ") + dinero(c.total) }),
                el("span", { class: "caja-cat-barra" }, el("span", { style: `width:${porcentaje}%` })),
                el("span", { class: "caja-cat-detalle", text: detalle }));

            tarjeta.addEventListener("click", () => {
                $("cjCategoria").value = elegida === c.categoria ? "TODAS" : c.categoria;
                dibujarDesglose();
                dibujarTabla();
            });
            return tarjeta;
        }));
    }

    function movimientosFiltrados() {
        const tipo = $("cjTipo").value;
        const categoria = $("cjCategoria").value;
        const texto = normalizar($("cjBuscar").value);

        return (datos?.movimientos || []).filter(m => {
            if (tipo !== "TODOS" && m.tipo !== tipo) return false;
            if (categoria !== "TODAS" && m.categoria !== categoria) return false;
            if (texto && !normalizar(`${m.concepto} ${m.beneficiario ?? ""} ${m.categoriaEtiqueta}`).includes(texto)) {
                return false;
            }
            return true;
        });
    }

    function dibujarTabla() {
        const cuerpo = $("tablaCaja");
        const lista = movimientosFiltrados();
        const total = datos?.movimientos?.length || 0;

        cuerpo.replaceChildren(...lista.map(filaMovimiento));
        $("cajaVacia").hidden = lista.length > 0;

        if (!lista.length) {
            const hayFiltros = total > 0;
            $("cajaVaciaTitulo").textContent = hayFiltros
                ? "Ningún movimiento coincide con los filtros."
                : "No hay movimientos en este período.";
            $("cajaVaciaTexto").textContent = hayFiltros
                ? "Probá con otra categoría o borrá la búsqueda."
                : "Probá con otro período o registrá un egreso.";
        }

        const vigentes = lista.filter(m => !m.anulado);
        const suma = tipo => vigentes.filter(m => m.tipo === tipo)
            .reduce((acc, m) => acc + (Number(m.monto) || 0), 0);
        const resumen = $("cajaResumen");
        resumen.replaceChildren();
        if (lista.length) {
            resumen.append(
                `Mostrando ${lista.length} de ${total} movimientos · Ingresos: `,
                el("strong", { text: dinero(suma("INGRESO")) }),
                " · Egresos: ",
                el("strong", { text: dinero(suma("EGRESO")) }),
                " (sin contar anulados)");
        }
    }

    function filaMovimiento(m) {
        const esIngreso = m.tipo === "INGRESO";
        const detalle = [
            m.beneficiario,
            nombreMedio(m.medioPago),
            m.registradoPor ? `cargó ${m.registradoPor}` : ""
        ].filter(Boolean).join(" · ");

        const concepto = el("td", {},
            el("span", { class: "caja-concepto", text: m.concepto }),
            detalle ? el("span", { class: "caja-sub", text: detalle }) : null);

        let acciones;
        if (m.anulable) {
            acciones = el("button", {
                type: "button", class: "caja-btn-anular", text: "Anular",
                "aria-label": `Anular ${m.concepto}`,
                onclick: () => pedirAnulacion(m)
            });
        } else {
            acciones = el("span", {
                class: "caja-origen",
                text: m.origen === "PAGO" ? "Desde Pagos" : m.origen === "VENTA" ? "Desde Ventas" : "—"
            });
        }

        return el("tr", { class: m.anulado ? "caja-anulado" : null },
            el("td", { text: formatearDia(m.fecha) }),
            el("td", {}, el("span", {
                class: "caja-tipo " + (esIngreso ? "caja-tipo-ingreso" : "caja-tipo-egreso"),
                text: esIngreso ? "INGRESO" : "EGRESO"
            })),
            el("td", { text: m.categoriaEtiqueta }),
            concepto,
            el("td", {}, el("span", {
                class: "caja-monto " + (esIngreso ? "caja-monto-ingreso" : "caja-monto-egreso"),
                text: (esIngreso ? "+ " : "− ") + dinero(m.monto)
            })),
            el("td", {}, el("span", {
                class: "caja-estado " + (m.anulado ? "caja-estado-anulado" : "caja-estado-vigente"),
                text: m.anulado ? "Anulado" : "Vigente"
            })),
            el("td", {}, acciones));
    }

    // ---------- Anular un egreso ----------
    function pedirAnulacion(m) {
        if ($("cajaModalFondo")) return;

        const aviso = m.idProducto
            ? "Las unidades que esta compra sumó al stock se van a descontar de nuevo."
            : "Va a dejar de contar en los totales, pero queda en el historial.";
        const cancelar = el("button", { type: "button", class: "btn-cancelar", text: "Volver" });
        const confirmar = el("button", { type: "button", class: "caja-btn-confirmar", text: "Anular egreso" });

        const fondo = el("div", {
            id: "cajaModalFondo", class: "caja-modalbg", role: "dialog",
            "aria-modal": "true", "aria-labelledby": "cajaModalTitulo"
        }, el("div", { class: "caja-modal" },
            el("h2", { id: "cajaModalTitulo", text: "Anular egreso" }),
            el("p", {}, "¿Anular ", el("strong", { text: m.concepto }),
                " por ", el("strong", { text: dinero(m.monto) }), "?"),
            el("p", { text: aviso }),
            el("div", { class: "caja-modal-acciones" }, cancelar, confirmar)));

        const cerrar = () => { fondo.remove(); document.removeEventListener("keydown", alTeclear); };
        const alTeclear = e => { if (e.key === "Escape") cerrar(); };

        cancelar.addEventListener("click", cerrar);
        fondo.addEventListener("click", e => { if (e.target === fondo) cerrar(); });
        document.addEventListener("keydown", alTeclear);

        confirmar.addEventListener("click", async () => {
            confirmar.disabled = true;
            try {
                await pedir(`${URL_CAJA}/${encodeURIComponent(m.idMovimiento)}/anular`, { method: "PUT" });
                cerrar();
                mensaje("Egreso anulado.", "ok");
                await Promise.all([cargar(), cargarProductos()]);
            } catch (e) {
                cerrar();
                mensaje(e.message, "error");
            }
        });

        document.body.append(fondo);
        cancelar.focus();
    }

    // ---------- Formulario de egreso ----------
    const CONFIG_CATEGORIA = {
        COMPRA_PRODUCTOS: {
            beneficiario: "Proveedor (opcional)", requiereBeneficiario: false,
            ayuda: "Si elegís un producto, las unidades compradas se suman solas al stock."
        },
        SUELDO_PROFESOR: {
            beneficiario: "Profesor", requiereBeneficiario: true,
            ayuda: "Los profesores no tienen cuenta en el sistema: escribí el nombre."
        },
        SUELDO_RECEPCIONISTA: {
            beneficiario: "Recepcionista", requiereBeneficiario: true,
            ayuda: "Elegí a un recepcionista de la lista o escribí el nombre."
        },
        OTRO_EGRESO: {
            beneficiario: "Pagado a (opcional)", requiereBeneficiario: false,
            ayuda: "Alquiler, servicios, mantenimiento, limpieza, etc."
        }
    };

    function actualizarFormulario() {
        const categoria = $("egCategoria").value;
        const conf = CONFIG_CATEGORIA[categoria];
        const esCompra = categoria === "COMPRA_PRODUCTOS";
        const conProducto = esCompra && $("egProducto").value !== "";

        $("egBeneficiarioEtiqueta").textContent = conf.beneficiario;
        $("egBeneficiario").placeholder = conf.requiereBeneficiario ? "Nombre y apellido" : "Nombre";
        if (categoria === "SUELDO_RECEPCIONISTA") $("egBeneficiario").setAttribute("list", "egRecepcionistas");
        else $("egBeneficiario").removeAttribute("list");

        $("egBloqueProducto").hidden = !esCompra;
        $("egBloqueCantidad").hidden = !conProducto;

        const conceptoOpcional = conf.requiereBeneficiario || conProducto;
        $("egConceptoEtiqueta").textContent = conceptoOpcional ? "Concepto (opcional)" : "Concepto";
        $("egConcepto").placeholder = conf.requiereBeneficiario
            ? "Si lo dejás vacío se completa con el nombre"
            : conProducto ? "Si lo dejás vacío se completa con el producto" : "Detalle del gasto";
        $("egAyuda").textContent = conf.ayuda;
        errorFormulario("");
    }

    function limpiarFormulario() {
        $("formEgreso").reset();
        $("egFecha").value = aISO(hoy());
        actualizarFormulario();
    }

    async function registrarEgreso(evento) {
        evento.preventDefault();
        if (enviando) return;
        errorFormulario("");

        const categoria = $("egCategoria").value;
        const conf = CONFIG_CATEGORIA[categoria];
        const idProducto = categoria === "COMPRA_PRODUCTOS" && $("egProducto").value
            ? Number($("egProducto").value) : null;
        const cantidad = idProducto ? parseInt($("egCantidad").value, 10) : null;
        const monto = parsearMonto($("egMonto").value);
        const beneficiario = $("egBeneficiario").value.trim();
        const concepto = $("egConcepto").value.trim();
        const fecha = $("egFecha").value;

        if (!(monto > 0)) return errorFormulario("Ingresá un monto mayor que cero.");
        if (monto > 999999999.99) return errorFormulario("El monto es demasiado grande.");
        if (fecha && fecha > aISO(hoy())) return errorFormulario("La fecha no puede ser futura.");
        if (conf.requiereBeneficiario && !beneficiario) {
            return errorFormulario(categoria === "SUELDO_PROFESOR"
                ? "Indicá a qué profesor se le paga." : "Indicá a qué recepcionista se le paga.");
        }
        if (idProducto && !(cantidad >= 1)) return errorFormulario("Indicá cuántas unidades compraste.");
        if (!concepto && !conf.requiereBeneficiario && !idProducto) {
            return errorFormulario("Escribí el concepto del gasto.");
        }

        enviando = true;
        $("btnRegistrarEgreso").disabled = true;
        try {
            await pedir(`${URL_CAJA}/egresos`, {
                method: "POST",
                body: JSON.stringify({
                    categoria,
                    concepto: concepto || null,
                    monto: Math.round(monto * 100) / 100,
                    fecha: fecha || null,
                    medioPago: $("egMedio").value || null,
                    beneficiario: beneficiario || null,
                    idProducto,
                    cantidad
                })
            });
            limpiarFormulario();
            mensaje("Egreso registrado." + (idProducto ? " El stock del producto se actualizó." : ""), "ok");
            await Promise.all([cargar(), cargarProductos()]);
        } catch (e) {
            errorFormulario(e.message);
        } finally {
            enviando = false;
            $("btnRegistrarEgreso").disabled = false;
        }
    }

    // ---------- Eventos ----------
    function conectar() {
        $("formEgreso").addEventListener("submit", registrarEgreso);
        $("btnLimpiarEgreso").addEventListener("click", limpiarFormulario);
        $("egCategoria").addEventListener("change", actualizarFormulario);
        $("egProducto").addEventListener("change", actualizarFormulario);
        $("btnActualizarCaja").addEventListener("click", () => { cargar(); cargarProductos(); });

        document.querySelectorAll(".caja-periodo").forEach(b =>
            b.addEventListener("click", () => aplicarPeriodo(b.dataset.periodo)));

        // Si se toca una fecha a mano, ya no es ninguno de los períodos rápidos
        ["cjDesde", "cjHasta"].forEach(id => $(id).addEventListener("change", () => {
            const coincide = ["hoy", "semana", "mes", "mesAnterior", "todo"].find(p => {
                const [d, h] = rangoDe(p);
                return ($("cjDesde").value === (d ? aISO(d) : "")) &&
                    ($("cjHasta").value === (h ? aISO(h) : ""));
            });
            marcarPeriodo(coincide || "");
            cargar();
        }));

        ["cjTipo", "cjCategoria"].forEach(id => $(id).addEventListener("change", () => {
            dibujarDesglose();
            dibujarTabla();
        }));
        $("cjBuscar").addEventListener("input", dibujarTabla);
    }

    async function iniciar() {
        // Espera a que sesion.js confirme quién entró (si no es administrador, lo saca de acá)
        if (window.sesionLista) {
            const sesion = await window.sesionLista;
            if (!sesion || sesion.rol !== "ADMINISTRADOR") return;
        }
        conectar();
        limpiarFormulario();
        aplicarPeriodo(periodoActivo);
        cargarProductos();
        cargarRecepcionistas();
    }

    iniciar();
})();
