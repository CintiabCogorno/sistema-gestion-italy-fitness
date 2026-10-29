/* =========================================================
   INICIO - resumen del gimnasio
   - Socios registrados
   - Ingresos de hoy (accesos permitidos)
   - Productos en stock del local
========================================================= */
(function () {
    "use strict";

    const API = "http://localhost:8080";
    const $ = id => document.getElementById(id);
    const STOCK_BAJO = 5;

    const moneda = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });

    async function pedir(ruta) {
        const r = await fetch(`${API}${ruta}`, { headers: { Accept: "application/json" } });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const datos = await r.json();
        return Array.isArray(datos) ? datos : [];
    }

    // El servidor puede mandar la fecha como texto ISO o como lista [a, m, d, h, min, s]
    function parsearFecha(valor) {
        if (Array.isArray(valor)) {
            const [a, m, d, h = 0, mi = 0, s = 0] = valor;
            return new Date(a, m - 1, d, h, mi, s);
        }
        const f = new Date(valor);
        return isNaN(f) ? null : f;
    }

    const mismoDia = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    function fila(...celdas) {
        const tr = document.createElement("tr");
        celdas.forEach(c => {
            const td = document.createElement("td");
            if (c instanceof Node) td.append(c);
            else td.textContent = c;
            tr.append(td);
        });
        return tr;
    }

    function dibujarSocios(socios) {
        const activos = socios.filter(s =>
            String(s.estado ?? "").trim().toUpperCase() === "ACTIVO").length;
        $("inicioSocios").textContent = String(socios.length);
        $("inicioSociosDetalle").textContent =
            `${activos} ${activos === 1 ? "activo" : "activos"}`;
    }

    function dibujarIngresos(accesos) {
        const hoy = new Date();
        const deHoy = accesos.filter(a => {
            const f = parsearFecha(a.fechaHora);
            return f && mismoDia(f, hoy);
        });
        const permitidos = deHoy.filter(a => a.permitido).length;
        const denegados = deHoy.length - permitidos;
        $("inicioIngresos").textContent = String(permitidos);
        $("inicioIngresosDetalle").textContent =
            `${denegados} ${denegados === 1 ? "acceso denegado" : "accesos denegados"} hoy`;
    }

    function dibujarStock(productos) {
        const cuerpo = $("inicioTablaStock");
        cuerpo.replaceChildren();

        const enStock = productos
            .filter(p => Number(p.stock) > 0)
            .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), "es"));
        const sinStock = productos.length - enStock.length;
        const unidades = enStock.reduce((t, p) => t + Number(p.stock), 0);

        $("inicioProductos").textContent = String(enStock.length);
        $("inicioProductosDetalle").textContent =
            `${unidades} ${unidades === 1 ? "unidad" : "unidades"} en total` +
            (sinStock ? ` · ${sinStock} sin stock` : "");

        $("inicioStockVacio").hidden = enStock.length > 0;
        $("inicioStockTabla").hidden = enStock.length === 0;

        enStock.forEach(p => {
            const stock = document.createElement("span");
            stock.className = Number(p.stock) <= STOCK_BAJO ? "stock-bajo" : "stock-ok";
            stock.textContent = Number(p.stock) <= STOCK_BAJO
                ? `${p.stock} · stock bajo`
                : String(p.stock);
            cuerpo.append(fila(p.nombre ?? "—", moneda.format(Number(p.precio) || 0), stock));
        });
    }

    async function cargar() {
        // Cada dato se pide por separado: si uno falla, los otros se muestran igual
        const [socios, accesos, productos] = await Promise.allSettled([
            pedir("/socios"), pedir("/accesos"), pedir("/productos")
        ]);

        if (socios.status === "fulfilled") dibujarSocios(socios.value);
        else $("inicioSociosDetalle").textContent = "No se pudo cargar";

        if (accesos.status === "fulfilled") dibujarIngresos(accesos.value);
        else $("inicioIngresosDetalle").textContent = "No se pudo cargar";

        if (productos.status === "fulfilled") dibujarStock(productos.value);
        else $("inicioProductosDetalle").textContent = "No se pudo cargar";
    }

    cargar();
})();
