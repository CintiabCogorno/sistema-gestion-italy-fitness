
/* ===================================
   ITALY FITNESS - NOTIFICACIONES JS
=================================== */

const Notificaciones = (() => {

    const configuracion = {
        success: {
            icono: "✓",
            titulo: "¡Operación exitosa!"
        },
        error: {
            icono: "✕",
            titulo: "Ocurrió un error"
        },
        warning: {
            icono: "!",
            titulo: "Atención"
        },
        info: {
            icono: "i",
            titulo: "Información"
        }
    };

    function crearElemento(html) {
        const contenedor = document.createElement("div");
        contenedor.innerHTML = html.trim();
        return contenedor.firstElementChild;
    }

    function mostrar(mensaje, tipo = "success", titulo = null) {

        const config = configuracion[tipo] || configuracion.info;

        const overlay = crearElemento(`
            <div class="notif-overlay">
                <div class="notif-modal notif-${tipo}"
                     role="alertdialog"
                     aria-modal="true">

                    <div class="notif-icono">
                        ${config.icono}
                    </div>

                    <h2></h2>
                    <p></p>

                    <div class="notif-acciones">
                        <button class="notif-btn notif-btn-primary">
                            Aceptar
                        </button>
                    </div>

                </div>
            </div>
        `);

        overlay.querySelector("h2").textContent =
            titulo || config.titulo;

        overlay.querySelector("p").textContent = mensaje;

        document.body.appendChild(overlay);

        const boton = overlay.querySelector("button");
        boton.focus();

        function cerrar() {
            overlay.remove();
        }

        boton.addEventListener("click", cerrar);

        return new Promise(resolve => {
            boton.addEventListener("click", () => resolve(true));
        });
    }

    function confirmar(mensaje, titulo = "¿Estás seguro?") {

        return new Promise(resolve => {

            const overlay = crearElemento(`
                <div class="notif-overlay">
                    <div class="notif-modal notif-warning"
                         role="alertdialog"
                         aria-modal="true">

                        <div class="notif-icono">!</div>

                        <h2></h2>
                        <p></p>

                        <div class="notif-acciones">
                            <button class="notif-btn notif-btn-secondary"
                                    data-action="cancelar">
                                Cancelar
                            </button>

                            <button class="notif-btn notif-btn-primary"
                                    data-action="confirmar">
                                Confirmar
                            </button>
                        </div>

                    </div>
                </div>
            `);

            overlay.querySelector("h2").textContent = titulo;
            overlay.querySelector("p").textContent = mensaje;

            document.body.appendChild(overlay);

            function finalizar(resultado) {
                overlay.remove();
                resolve(resultado);
            }

            overlay.querySelector('[data-action="cancelar"]')
                .addEventListener("click", () => finalizar(false));

            overlay.querySelector('[data-action="confirmar"]')
                .addEventListener("click", () => finalizar(true));

            overlay.querySelector('[data-action="confirmar"]').focus();

        });
    }

    return {
        exito: (mensaje, titulo) =>
            mostrar(mensaje, "success", titulo),

        error: (mensaje, titulo) =>
            mostrar(mensaje, "error", titulo),

        advertencia: (mensaje, titulo) =>
            mostrar(mensaje, "warning", titulo),

        info: (mensaje, titulo) =>
            mostrar(mensaje, "info", titulo),

        confirmar: confirmar
    };

})();
