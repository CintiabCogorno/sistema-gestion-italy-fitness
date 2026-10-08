const API_URL = "http://localhost:8080/socios";

let socioEditando = null;


// ==========================================
// INICIAR SISTEMA
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    cargarSocios();


    document
        .getElementById("formSocio")
        .addEventListener(
            "submit",
            guardarOEditarSocio
        );


    document
        .getElementById("btnCancelar")
        .addEventListener(
            "click",
            cancelarEdicion
        );


    // Buscar por DNI

    document
        .getElementById("btnBuscarDni")
        .addEventListener(
            "click",
            buscarPorDni
        );


    // Mostrar todos

    document
        .getElementById("btnMostrarTodos")
        .addEventListener(
            "click",
            mostrarTodosLosSocios
        );

});


// ==========================================
// OBTENER SOCIOS DESDE MYSQL
// ==========================================

async function cargarSocios() {

    try {

        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los socios");
        }

        const socios = await respuesta.json();
        mostrarSocios(socios);

    } catch (error) {
        console.error("Error al cargar socios:", error);
        alert(
            "No se pudo conectar con el servidor.\n" +
            "Verifique que Spring Boot esté funcionando."
        );
    }
}

// ==========================================
// MOSTRAR SOCIOS EN LA TABLA
// ==========================================

function mostrarSocios(socios) {

    const tabla = document.getElementById("tablaSocios");
    const tablaVacia = document.getElementById("tablaVacia");
    const cantidad = document.getElementById("cantidadSocios");

    tabla.innerHTML = "";

    cantidad.textContent = socios.length;


    if (socios.length === 0) {
        tablaVacia.style.display = "flex";
        return;
    }

    tablaVacia.style.display = "none";

    socios.forEach(socio => {
        const fila = document.createElement("tr");

        fila.innerHTML = `
            <td>${socio.nombre}</td>
            <td>${socio.apellido}</td>
            <td>${socio.dni}</td>
            <td>${socio.telefono}</td>

            <td class="acciones-tabla">

                <button
                    class="btn-editar"
                    title="Editar socio"
                    onclick="editarSocio(${socio.id})">
                    <i class="fa-solid fa-pen"></i>

                </button>

                <button
                    class="btn-eliminar"
                    title="Eliminar socio"
                    onclick="eliminarSocio(${socio.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </td>
        `;
        tabla.appendChild(fila);

    });
}


// ==========================================
// GUARDAR O EDITAR
// ==========================================

async function guardarOEditarSocio(event) {

    event.preventDefault();


    const nombre =
        document.getElementById("nombre").value.trim();

    const apellido =
        document.getElementById("apellido").value.trim();

    const dni =
        document.getElementById("dni").value.trim();

    const telefono =
        document.getElementById("telefono").value.trim();


    // Validación

    if (!nombre || !apellido || !dni || !telefono) {

        alert("Complete todos los campos.");

        return;
    }

    // ======================================
    // SI ESTAMOS EDITANDO
    // ======================================

    if (socioEditando !== null) {

        await actualizarSocio(
            nombre,
            apellido,
            dni,
            telefono
        );

        return;
    }

    // ======================================
    // SI ES UN SOCIO NUEVO
    // ======================================

    const socio = {

        nombre: nombre,
        apellido: apellido,
        dni: dni,
        telefono: telefono,

        // Campos obligatorios de tu entidad Socio
        fechaAlta: new Date()
            .toISOString()
            .split("T")[0],

        estado: "ACTIVO"
    };


    try {

        const respuesta = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(socio)

        });


        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            console.error("Respuesta del servidor:", mensaje);
            throw new Error("No se pudo guardar el socio");
        }

        const socioCreado = await respuesta.json();
        console.log("Socio creado:", socioCreado);


        alert("Socio guardado correctamente.");
        limpiarFormulario();
        await cargarSocios();

    } catch (error) {

        console.error("Error:", error);

        alert(
            "No se pudo guardar el socio.\n" +
            "Revise la conexión con el servidor."
        );
    }

}

// ==========================================
// EDITAR SOCIO
// ==========================================

async function editarSocio(id) {

    try {
        const respuesta = await fetch(`${API_URL}/${id}`);

        if (!respuesta.ok) {

            throw new Error("No se encontró el socio");
        }

        const socio = await respuesta.json();


        // Cargar datos en el formulario

        document.getElementById("nombre").value =
            socio.nombre;

        document.getElementById("apellido").value =
            socio.apellido;

        document.getElementById("dni").value =
            socio.dni;

        document.getElementById("telefono").value =
            socio.telefono;

        // Guardamos el ID del socio

        socioEditando = socio.id;

        // Cambiamos apariencia del formulario

        document.querySelector(".titulo-panel h2")
            .textContent = "Editar socio";

        document.querySelector(".titulo-panel p")
            .textContent = "Modifique los datos del socio.";


        document.querySelector(".btn-guardar")
            .innerHTML = `
                <i class="fa-solid fa-pen"></i>
                Actualizar socio
            `;

        // Mostrar botón cancelar

        document.getElementById("btnCancelar")
            .hidden = false;

        // Llevar al formulario

        document.querySelector(".panel")
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo cargar el socio.");
    }

}

// ==========================================
// ACTUALIZAR SOCIO
// ==========================================

async function actualizarSocio(
    nombre,
    apellido,
    dni,
    telefono
) {

    const socio = {

        nombre: nombre,
        apellido: apellido,
        dni: dni,
        telefono: telefono
    };


    try {

        const respuesta = await fetch(
            `${API_URL}/${socioEditando}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(socio)
            }
        );

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            console.error("Respuesta del servidor:", mensaje);
            throw new Error("No se pudo actualizar el socio");
        }

        const socioActualizado =
            await respuesta.json();

        console.log(
            "Socio actualizado:",
            socioActualizado
        );

        alert("Socio actualizado correctamente.");
        cancelarEdicion();
        await cargarSocios();


    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo actualizar el socio.");
    }

}


// ==========================================
// ELIMINAR SOCIO
// ==========================================

async function eliminarSocio(id) {

    const confirmar = confirm(
        "¿Está seguro de que desea eliminar este socio?"
    );

    if (!confirmar) {
        return;
    }

    try {

        const respuesta = await fetch(
            `${API_URL}/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            console.error("Respuesta del servidor:", mensaje);
            throw new Error("No se pudo eliminar el socio");
        }

        alert("Socio eliminado correctamente.");

        await cargarSocios();

    } catch (error) {
        console.error("Error:", error);
        alert("No se pudo eliminar el socio.");
    }

}

// ==========================================
// CANCELAR EDICIÓN
// ==========================================

function cancelarEdicion() {
    socioEditando = null;
    limpiarFormulario();
}

// ==========================================
// LIMPIAR FORMULARIO
// ==========================================

function limpiarFormulario() {

    document.getElementById("formSocio").reset();

    document.querySelector(".titulo-panel h2")
        .textContent = "Registrar socio";

    document.querySelector(".titulo-panel p")
        .textContent =
        "Ingrese los datos del nuevo socio.";

    document.querySelector(".btn-guardar")
        .innerHTML = `
            <i class="fa-solid fa-floppy-disk"></i>
            Guardar socio
        `;

    document.getElementById("btnCancelar")
        .hidden = true;
}


// ==========================================
// BUSCAR SOCIO POR DNI
// ==========================================

async function buscarPorDni() {

    const dni = document
        .getElementById("buscarDni")
        .value
        .trim();

    if (!dni) {

        alert("Ingrese un DNI para realizar la búsqueda.");

        return;
    }

    try {

        const respuesta = await fetch(
            `${API_URL}/dni/${dni}`
        );

        if (respuesta.status === 404) {

            alert("No se encontró un socio con ese DNI.");

            return;
        }

        if (!respuesta.ok) {

            throw new Error("Error al buscar el socio");
        }

        const socio = await respuesta.json();

        console.log("Socio encontrado:", socio);

        // Mostrar solamente el socio encontrado
        mostrarSocios([socio]);

    } catch (error) {

        console.error(
            "Error al buscar socio:",
            error
        );

        alert("No se pudo realizar la búsqueda.");
    }
}


// ==========================================
// MOSTRAR TODOS LOS SOCIOS
// ==========================================

function mostrarTodosLosSocios() {

    document.getElementById("buscarDni").value = "";

    cargarSocios();
}