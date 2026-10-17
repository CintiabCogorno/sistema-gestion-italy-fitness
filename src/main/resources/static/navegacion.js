
document.addEventListener("DOMContentLoaded", () => {
    const vistaSocios = document.getElementById("vistaSocios");
    const vistaProductos = document.getElementById("vistaProductos");
    const vistaAccesos = document.getElementById("vistaAccesos");

    const navSocios = document.getElementById("navSocios");
    const navProductos = document.getElementById("navProductos");
    const navAccesos = document.getElementById("navAccesos");

    function mostrarVista(vista) {
        const mostrarProductos = vista === "productos";
        const mostrarAccesos = vista === "accesos";

        vistaSocios.hidden = mostrarProductos;
        vistaProductos.hidden = !mostrarProductos;
        vistaAccesos.hidden = !mostrarProductos;

        navSocios.classList.toggle("activo", !mostrarProductos);
        navProductos.classList.toggle("activo", mostrarProductos);
        navAccesos.classList.toggle("activo", mostrarProductos);

        if (mostrarProductos) {
            window.cargarProductos?.();
        }
    }

    navSocios.addEventListener("click", (event) => {
        event.preventDefault();
        mostrarVista("socios");
    });

    navProductos.addEventListener("click", (event) => {
        event.preventDefault();
        mostrarVista("productos");
    });

    navAccesos.addEventListener("click", (event) => {
        event.preventDefault();
        mostrarVista("accesos");
    });
});
