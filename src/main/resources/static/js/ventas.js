/* =========================================================
   VENTAS - ITALY FITNESS

   - Registrar una venta (carrito de productos, socio opcional).
   - Historial con filtros, detalle y anulación.
   - Resumen de hoy / del mes.

   El precio y el stock los maneja el servidor: acá solo se
   envían el producto y la cantidad.
========================================================= */
(function () {
    "use strict";

    const API = "http://localhost:8080";
    const URL_VENTAS = `${API}/ventas`;
    const URL_PRODUCTOS = `${API}/productos`;
    const URL_SOCIOS = `${API}/socios`;

    const $ = id => document.getElementById(id);
    const vista = $("vistaVentas");
    if (!vista) {
        return;
    }

    const avisar = (mensaje, tipo) =>
        window.avisar ? window.avisar(mensaje, tipo) : alert(mensaje);
    const preguntar = (mensaje, boton) =>
        window.confirmar
            ? window.confirmar(mensaje, boton)
            : Promise.resolve(confirm(mensaje));

    // ---------- Estado ----------
    let ventas = [];
    let productos = [];
    let socios = [];
    let carrito = [];          // [{ producto, cantidad }]
    let socioElegido = null;
    let ventaAbierta = null;
    let enviando = false;

    // ---------- Utilidades ----------
    const moneda = new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2
    });
    const dinero = n => moneda.format(Number(n) || 0);

    const normalizar = v =>
        String(v ?? "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[̀-ͯ]/g, "")
            .trim();

    const soloDigitos = v => String(v ?? "").replace(/\D/g, "");

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

    const nombreSocio = s =>
        [s.apellido, s.nombre].filter(Boolean).join(", ") || "Socio sin nombre";

    // El servidor puede mandar la fecha como texto ISO o como lista [a, m, d, h, min, s]
    function parsearFecha(valor) {
        if (Array.isArray(valor)) {
            const [a, m, d, h = 0, mi = 0, s = 0] = valor;
            return new Date(a, m - 1, d, h, mi, s);
        }
        const fecha = new Date(valor);
        return isNaN(fecha) ? null : fecha;
    }

    const dosDigitos = n => String(n).padStart(2, "0");

    function formatearFecha(valor) {
        const f = parsearFecha(valor);
        if (!f) return "—";
        return `${dosDigitos(f.getDate())}/${dosDigitos(f.getMonth() + 1)}/${f.getFullYear()} ` +
            `${dosDigitos(f.getHours())}:${dosDigitos(f.getMinutes())}`;
    }

    const claveDia = f =>
        `${f.getFullYear()}-${dosDigitos(f.getMonth() + 1)}-${dosDigitos(f.getDate())}`;

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

    // ---------- Carga de datos ----------
    async function cargar() {
        try {
            const [listaVentas, listaProductos, listaSocios] = await Promise.all([
                pedir(URL_VENTAS),
                pedir(URL_PRODUCTOS),
                pedir(URL_SOCIOS)
            ]);
            ventas = Array.isArray(listaVentas) ? listaVentas : [];
            productos = Array.isArray(listaProductos) ? listaProductos : [];
            socios = Array.isArray(listaSocios) ? listaSocios : [];
        } catch (e) {
            avisar(e.message, "error");
        }

        // Si el stock cambió, lo que hay en el carrito se ajusta a los productos actuales
        carrito = carrito
            .map(linea => {
                const actual = productos.find(p => p.idProducto === linea.producto.idProducto);
                return actual ? { producto: actual, cantidad: linea.cantidad } : null;
            })
            .filter(Boolean);

        dibujarMetricas();
        dibujarCarrito();
        dibujarHistorial();
        buscarProductos();
        buscarSocios();
    }

    // ---------- Resumen ----------
    function dibujarMetricas() {
        const hoy = new Date();
        const hoyClave = claveDia(hoy);
        let ventasHoy = 0;
        let totalHoy = 0;
        let totalMes = 0;
        let unidadesMes = 0;

        ventas.filter(v => !v.anulada).forEach(v => {
            const f = parsearFecha(v.fecha);
            if (!f) return;
            if (claveDia(f) === hoyClave) {
                ventasHoy++;
                totalHoy += Number(v.total) || 0;
            }
            if (f.getFullYear() === hoy.getFullYear() && f.getMonth() === hoy.getMonth()) {
                totalMes += Number(v.total) || 0;
                (v.detalles || []).forEach(d => { unidadesMes += Number(d.cantidad) || 0; });
            }
        });

        $("vtaMetricaHoy").textContent = String(ventasHoy);
        $("vtaMetricaHoyDetalle").textContent = `${dinero(totalHoy)} · sin contar anuladas`;
        $("vtaMetricaMes").textContent = dinero(totalMes);
        $("vtaMetricaUnidades").textContent = String(unidadesMes);
    }

    // ---------- Buscar producto ----------
    function buscarProductos() {
        const caja = $("vtaResultadosProducto");
        caja.replaceChildren();
        const texto = normalizar($("vtaBuscarProducto").value);
        if (!texto) return;

        const hallados = productos
            .filter(p => normalizar(p.nombre).includes(texto))
            .slice(0, 6);

        if (hallados.length === 0) {
            caja.append(el("div", { class: "vta-sin-resultados", text: "No se encontraron productos." }));
            return;
        }

        hallados.forEach(p => {
            const sinStock = !(p.stock > 0);
            caja.append(el("button", {
                type: "button",
                disabled: sinStock,
                onclick: () => agregarAlCarrito(p)
            },
                el("span", { text: p.nombre }),
                el("small", { text: sinStock ? "Sin stock" : `${dinero(p.precio)} · stock ${p.stock}` })
            ));
        });
    }

    // ---------- Buscar socio ----------
    function buscarSocios() {
        const caja = $("vtaResultadosSocio");
        caja.replaceChildren();
        const crudo = $("vtaBuscarSocio").value;
        const texto = normalizar(crudo);
        if (!texto) return;
        const digitos = soloDigitos(crudo);

        const hallados = socios
            .filter(s =>
                normalizar(`${s.nombre} ${s.apellido}`).includes(texto) ||
                normalizar(`${s.apellido} ${s.nombre}`).includes(texto) ||
                (digitos && soloDigitos(s.dni).includes(digitos)))
            .slice(0, 6);

        if (hallados.length === 0) {
            caja.append(el("div", { class: "vta-sin-resultados", text: "No se encontraron socios." }));
            return;
        }

        hallados.forEach(s => {
            caja.append(el("button", {
                type: "button",
                onclick: () => elegirSocio(s)
            },
                el("span", { text: nombreSocio(s) }),
                el("small", { text: `DNI ${s.dni ?? "—"}` })
            ));
        });
    }

    function elegirSocio(socio) {
        socioElegido = socio;
        $("vtaBuscarSocio").value = "";
        $("vtaResultadosSocio").replaceChildren();
        dibujarSocio();
    }

    function dibujarSocio() {
        const caja = $("vtaSocioElegido");
        caja.replaceChildren();
        caja.classList.toggle("con-socio", !!socioElegido);

        if (!socioElegido) {
            caja.append(icono("fa-user"), el("div", {},
                el("strong", { text: "Consumidor final" }),
                el("small", { text: "La venta no queda asociada a ningún socio." })));
            return;
        }

        caja.append(icono("fa-user-check"), el("div", {},
            el("strong", { text: nombreSocio(socioElegido) }),
            el("small", { text: `DNI ${socioElegido.dni ?? "—"}` })),
            el("button", {
                type: "button",
                title: "Quitar socio",
                "aria-label": "Quitar socio",
                onclick: () => { socioElegido = null; dibujarSocio(); }
            }, icono("fa-xmark")));
    }

    // ---------- Carrito ----------
    function agregarAlCarrito(producto) {
        const linea = carrito.find(l => l.producto.idProducto === producto.idProducto);
        if (linea) {
            if (linea.cantidad >= producto.stock) {
                avisar(`Solo quedan ${producto.stock} de "${producto.nombre}".`, "error");
                return;
            }
            linea.cantidad++;
        } else {
            carrito.push({ producto, cantidad: 1 });
        }
        $("vtaBuscarProducto").value = "";
        buscarProductos();
        dibujarCarrito();
    }

    function cambiarCantidad(linea, nueva) {
        const n = Math.floor(Number(nueva));
        if (!Number.isFinite(n) || n < 1) {
            linea.cantidad = 1;
        } else if (n > linea.producto.stock) {
            linea.cantidad = linea.producto.stock;
            avisar(`Solo quedan ${linea.producto.stock} de "${linea.producto.nombre}".`, "error");
        } else {
            linea.cantidad = n;
        }
        dibujarCarrito();
    }

    function quitarLinea(linea) {
        carrito = carrito.filter(l => l !== linea);
        dibujarCarrito();
    }

    function totalCarrito() {
        return carrito.reduce((t, l) => t + Number(l.producto.precio) * l.cantidad, 0);
    }

    function dibujarCarrito() {
        const cuerpo = $("vtaCarrito");
        cuerpo.replaceChildren();

        carrito.forEach(linea => {
            const { producto, cantidad } = linea;
            const entrada = el("input", {
                type: "number",
                min: "1",
                max: String(producto.stock),
                value: String(cantidad),
                "aria-label": `Cantidad de ${producto.nombre}`,
                onchange: e => cambiarCantidad(linea, e.target.value)
            });

            cuerpo.append(el("tr", {},
                el("td", { class: "vta-nombre", text: producto.nombre }),
                el("td", { class: "vta-importe", text: dinero(producto.precio) }),
                el("td", {}, el("div", { class: "vta-cant" },
                    el("button", {
                        type: "button",
                        "aria-label": "Restar uno",
                        disabled: cantidad <= 1,
                        onclick: () => cambiarCantidad(linea, cantidad - 1)
                    }, icono("fa-minus")),
                    entrada,
                    el("button", {
                        type: "button",
                        "aria-label": "Sumar uno",
                        disabled: cantidad >= producto.stock,
                        onclick: () => cambiarCantidad(linea, cantidad + 1)
                    }, icono("fa-plus")))),
                el("td", { class: "vta-importe", text: dinero(Number(producto.precio) * cantidad) }),
                el("td", {}, el("button", {
                    type: "button",
                    class: "vta-quitar",
                    title: "Quitar",
                    "aria-label": `Quitar ${producto.nombre}`,
                    onclick: () => quitarLinea(linea)
                }, icono("fa-trash")))
            ));
        });

        $("vtaCarritoVacio").hidden = carrito.length > 0;
        $("vtaTotal").textContent = dinero(totalCarrito());
        $("btnRegistrarVenta").disabled = carrito.length === 0 || enviando;
    }

    function vaciarVenta() {
        carrito = [];
        socioElegido = null;
        $("vtaBuscarProducto").value = "";
        $("vtaBuscarSocio").value = "";
        buscarProductos();
        buscarSocios();
        dibujarSocio();
        dibujarCarrito();
    }

    async function registrarVenta() {
        if (carrito.length === 0 || enviando) return;
        enviando = true;
        $("btnRegistrarVenta").disabled = true;

        const cuerpo = {
            idSocio: socioElegido ? socioElegido.id : null,
            items: carrito.map(l => ({ idProducto: l.producto.idProducto, cantidad: l.cantidad }))
        };

        try {
            const creada = await pedir(URL_VENTAS, { method: "POST", body: JSON.stringify(cuerpo) });
            avisar(`Venta registrada por ${dinero(creada?.total ?? 0)}.`, "exito");
            carrito = [];
            socioElegido = null;
            dibujarSocio();
            await cargar();
        } catch (e) {
            avisar(e.message, "error");
            // El stock pudo haber cambiado: se refresca lo que se ve
            await cargar();
        } finally {
            enviando = false;
            dibujarCarrito();
        }
    }

    // ---------- Historial ----------
    function ventasFiltradas() {
        const texto = normalizar($("vtaBuscar").value);
        const desde = $("vtaDesde").value;   // yyyy-mm-dd
        const hasta = $("vtaHasta").value;
        const estado = $("vtaEstado").value;

        return ventas.filter(v => {
            if (estado === "VIGENTES" && v.anulada) return false;
            if (estado === "ANULADAS" && !v.anulada) return false;

            const f = parsearFecha(v.fecha);
            if (desde || hasta) {
                if (!f) return false;
                const dia = claveDia(f);
                if (desde && dia < desde) return false;
                if (hasta && dia > hasta) return false;
            }

            if (texto) {
                const socio = v.nombreSocio || "consumidor final";
                const productosTexto = (v.detalles || []).map(d => d.nombreProducto).join(" ");
                if (!normalizar(`${socio} ${productosTexto}`).includes(texto)) return false;
            }
            return true;
        });
    }

    function resumenProductos(v) {
        return (v.detalles || [])
            .map(d => `${d.cantidad} × ${d.nombreProducto}`)
            .join(", ");
    }

    function dibujarHistorial() {
        const cuerpo = $("tablaVentas");
        cuerpo.replaceChildren();
        const lista = ventasFiltradas();
        const hayFiltros = $("vtaBuscar").value || $("vtaDesde").value ||
            $("vtaHasta").value || $("vtaEstado").value !== "TODAS";

        lista.forEach(v => {
            cuerpo.append(el("tr", { class: v.anulada ? "vta-anulada" : "" },
                el("td", { text: `#${v.idVenta}` }),
                el("td", { text: formatearFecha(v.fecha) }),
                el("td", {}, v.nombreSocio
                    ? el("span", { class: "vta-nombre", text: v.nombreSocio })
                    : el("span", { class: "vta-muted", text: "Consumidor final" })),
                el("td", { class: "vta-productos", text: resumenProductos(v) }),
                el("td", { class: "vta-importe", text: dinero(v.total) }),
                el("td", {}, el("span", {
                    class: `badge-estado ${v.anulada ? "estado-inactivo" : "estado-activo"}`,
                    text: v.anulada ? "Anulada" : "Vigente"
                })),
                el("td", {}, el("div", { class: "acciones-tabla" },
                    el("button", {
                        type: "button",
                        class: "btn-editar",
                        title: "Ver detalle",
                        "aria-label": `Ver detalle de la venta ${v.idVenta}`,
                        onclick: () => abrirDetalle(v)
                    }, icono("fa-eye")),
                    el("button", {
                        type: "button",
                        class: "btn-eliminar",
                        title: v.anulada ? "Ya anulada" : "Anular venta",
                        "aria-label": `Anular la venta ${v.idVenta}`,
                        disabled: v.anulada,
                        onclick: () => anular(v)
                    }, icono("fa-ban"))))
            ));
        });

        const vacia = lista.length === 0;
        $("vtaTablaVacia").hidden = !vacia;
        if (vacia) {
            $("vtaVaciaTitulo").textContent = hayFiltros
                ? "No hay ventas con esos filtros."
                : "No hay ventas registradas.";
            $("vtaVaciaTexto").textContent = hayFiltros
                ? "Probá cambiando o quitando algún filtro."
                : "Registrá la primera venta con el formulario de arriba.";
        }

        const vigentes = lista.filter(v => !v.anulada);
        const suma = vigentes.reduce((t, v) => t + (Number(v.total) || 0), 0);
        const resumen = $("vtaResumen");
        resumen.replaceChildren();
        if (!vacia) {
            resumen.append(
                `${lista.length} ${lista.length === 1 ? "venta" : "ventas"} · ` +
                `${vigentes.length} ${vigentes.length === 1 ? "vigente" : "vigentes"} por `,
                el("strong", { text: dinero(suma) })
            );
        }
    }

    // ---------- Detalle y anulación ----------
    function abrirDetalle(v) {
        ventaAbierta = v;
        $("vtaModalTitulo").textContent = `Venta #${v.idVenta}`;

        const cuerpo = $("vtaModalCuerpo");
        cuerpo.replaceChildren(
            el("div", { class: "vta-modal-datos" },
                el("span", { text: `Fecha: ${formatearFecha(v.fecha)}` }),
                el("span", { text: `Socio: ${v.nombreSocio || "Consumidor final"}` }),
                el("span", { text: `Estado: ${v.anulada ? "Anulada" : "Vigente"}` })),
            el("div", { class: "tabla-contenedor" }, el("table", {},
                el("thead", {}, el("tr", {},
                    el("th", { text: "Producto" }),
                    el("th", { text: "Cant." }),
                    el("th", { text: "Precio" }),
                    el("th", { text: "Subtotal" }))),
                el("tbody", {}, ...(v.detalles || []).map(d => el("tr", {},
                    el("td", { text: d.nombreProducto }),
                    el("td", { text: String(d.cantidad) }),
                    el("td", { text: dinero(d.precioUnitario) }),
                    el("td", { class: "vta-importe", text: dinero(d.subtotal) })))))),
            el("div", { class: "vta-total" },
                el("span", { text: "TOTAL" }),
                el("strong", { text: dinero(v.total) }))
        );

        $("btnVtaAnular").hidden = !!v.anulada;
        $("vtaModal").hidden = false;
        $("btnVtaCerrar").focus();
    }

    function cerrarDetalle() {
        $("vtaModal").hidden = true;
        ventaAbierta = null;
    }

    async function anular(v) {
        const ok = await preguntar(
            `¿Anular la venta #${v.idVenta}? Se devuelve al stock lo que se había vendido.`,
            "Anular"
        );
        if (!ok) return;

        try {
            await pedir(`${URL_VENTAS}/${v.idVenta}/anular`, { method: "PUT" });
            avisar(`Venta #${v.idVenta} anulada. El stock fue devuelto.`, "exito");
            cerrarDetalle();
        } catch (e) {
            avisar(e.message, "error");
        }
        await cargar();
    }

    // ---------- Eventos ----------
    $("vtaBuscarProducto").addEventListener("input", buscarProductos);
    $("vtaBuscarSocio").addEventListener("input", buscarSocios);
    $("btnRegistrarVenta").addEventListener("click", registrarVenta);
    $("btnVaciarVenta").addEventListener("click", vaciarVenta);
    $("btnActualizarVentas").addEventListener("click", cargar);
    ["vtaBuscar", "vtaDesde", "vtaHasta", "vtaEstado"].forEach(id => {
        $(id).addEventListener("input", dibujarHistorial);
        $(id).addEventListener("change", dibujarHistorial);
    });
    $("btnVtaCerrar").addEventListener("click", cerrarDetalle);
    $("btnVtaAnular").addEventListener("click", () => ventaAbierta && anular(ventaAbierta));
    $("vtaModal").addEventListener("click", e => {
        if (e.target === $("vtaModal")) cerrarDetalle();
    });
    document.addEventListener("keydown", e => {
        if (e.key === "Escape" && !$("vtaModal").hidden) cerrarDetalle();
    });

    dibujarSocio();
    dibujarCarrito();
    window.cargarVentas = cargar;
    cargar();
})();
