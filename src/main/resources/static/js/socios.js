
const API_URL = "http://localhost:8080/socios";
const API_ACTIVIDADES = "http://localhost:8080/actividades";

let socioEditando = null;
let actividadesPorSocio = {};

// ==========================================
// INICIALIZACIÓN
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

    cargarSocios();

    document.getElementById("formSocio")
        .addEventListener("submit", guardarOEditarSocio);

    document.getElementById("btnCancelar")
        .addEventListener("click", cancelarEdicion);

    document.getElementById("btnBuscarDni")
        .addEventListener("click", buscarPorDni);

    document.getElementById("btnMostrarTodos")
        .addEventListener("click", mostrarTodosLosSocios);

    // Evento para los botones de WhatsApp.
    // Se utiliza delegación porque las filas se generan dinámicamente.

    document.getElementById("tablaSocios")
        .addEventListener("click", (event) => {

            const boton = event.target.closest(".btn-whatsapp");

            if (!boton) return;

            const socio = {
                nombre: boton.dataset.nombre,
                apellido: boton.dataset.apellido,
                telefono: boton.dataset.telefono
            };

            seleccionarMensajeWhatsApp(socio);
        });
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

        actividadesPorSocio = await obtenerActividadesPorSocio();

        mostrarSocios(socios);

    } catch (error) {

        console.error("Error al cargar socios:", error);

        Notificaciones.error(
            "No se pudo conectar con el servidor.\n" +
            "Verifique que Spring Boot esté funcionando."
        );
    }
}


// ==========================================
// ACTIVIDADES DE CADA SOCIO
// ==========================================

async function obtenerActividadesPorSocio() {

    try {

        const respuesta = await fetch(API_ACTIVIDADES);

        if (!respuesta.ok) {
            return {};
        }

        const actividades = await respuesta.json();

        const porSocio = {};

        actividades.forEach(actividad => {

            (actividad.idsSocios ?? []).forEach(idSocio => {

                if (!porSocio[idSocio]) {
                    porSocio[idSocio] = [];
                }

                porSocio[idSocio].push(actividad.nombre);
            });
        });

        return porSocio;

    } catch (error) {

        console.warn(
            "No se pudieron obtener las actividades:",
            error
        );

        return {};
    }
}


// ==========================================
// ESCAPAR HTML
// ==========================================

function escaparHtml(texto) {

    return String(texto ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// ETIQUETAS DE ACTIVIDADES
// ==========================================

function etiquetasDeActividades(idSocio) {

    const nombres = actividadesPorSocio[idSocio] ?? [];

    if (nombres.length === 0) {
        return '<span class="act-muted">Sin actividad</span>';
    }

    return nombres
        .map(nombre =>
            `<span class="chip-actividad">${escaparHtml(nombre)}</span>`
        )
        .join("");
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

        const estado = String(socio.estado ?? "SIN ESTADO")
            .trim()
            .toUpperCase();

        const claseEstado = estado === "ACTIVO"
            ? "estado-activo"
            : estado === "INACTIVO"
                ? "estado-inactivo"
                : "estado-desconocido";

        fila.innerHTML = `

            <td>${escaparHtml(socio.nombre)}</td>

            <td>${escaparHtml(socio.apellido)}</td>

            <td>${escaparHtml(socio.dni)}</td>

            <td>${escaparHtml(socio.telefono)}</td>

            <td>${etiquetasDeActividades(socio.id)}</td>

            <td>
                <span class="badge-estado ${claseEstado}">
                    ${escaparHtml(estado)}
                </span>
            </td>

            <td class="acciones-tabla">

                <button
                    class="btn-gestionar"
                    title="Gestionar socio: pago y actividades"
                    onclick="abrirFichaSocio(${Number(socio.id)})">

                    <i class="fa-solid fa-clipboard-list"></i>
                    Gestionar

                </button>

                <button
                    class="btn-editar"
                    title="Editar socio"
                    onclick="editarSocio(${Number(socio.id)})">

                    <i class="fa-solid fa-pen"></i>

                </button>

                <!-- BOTÓN WHATSAPP -->

                <button
                       type="button"
                       class="btn-whatsapp"
                       title="Enviar WhatsApp"
                       data-nombre="${escaparHtml(socio.nombre)}"
                       data-apellido="${escaparHtml(socio.apellido)}"
                       data-telefono="${escaparHtml(socio.telefono)}">
                       <i class="fa-brands fa-whatsapp"></i>
                </button>

                <button
                    class="btn-eliminar"
                    title="Eliminar socio"
                    onclick="eliminarSocio(${Number(socio.id)})">

                    <i class="fa-solid fa-trash"></i>

                </button>

            </td>
        `;

        tabla.appendChild(fila);
    });
}


// ==========================================
// GUARDAR O EDITAR SOCIO
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


    // VALIDACIÓN

    if (!nombre || !apellido || !dni || !telefono) {

        Notificaciones.info("Complete todos los campos.");

        return;
    }


    // SI ESTAMOS EDITANDO

    if (socioEditando !== null) {

        await actualizarSocio(
            nombre,
            apellido,
            dni,
            telefono
        );

        return;
    }


    // NUEVO SOCIO

    const socio = {

        nombre: nombre,
        apellido: apellido,
        dni: dni,
        telefono: telefono,

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


        Notificaciones.exito(
            "Socio guardado correctamente."
        );

        limpiarFormulario();

        await cargarSocios();


        // Deja abierta la ficha para registrar su pago
        // y asignarle actividades.

        window.abrirFichaSocio?.(
            socioCreado.id,
            "pago",
            "Socio guardado. Ya podés registrar su primer pago y asignarle actividades."
        );


    } catch (error) {

        console.error("Error:", error);

        Notificaciones.error(
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


        // CARGAR DATOS EN EL FORMULARIO

        document.getElementById("nombre").value =
            socio.nombre;

        document.getElementById("apellido").value =
            socio.apellido;

        document.getElementById("dni").value =
            socio.dni;

        document.getElementById("telefono").value =
            socio.telefono;


        // GUARDAR ID DEL SOCIO

        socioEditando = socio.id;


        // CAMBIAR APARIENCIA DEL FORMULARIO

        document.querySelector(".titulo-panel h2")
            .textContent = "Editar socio";

        document.querySelector(".titulo-panel p")
            .textContent = "Modifique los datos del socio.";


        document.querySelector(".btn-guardar")
            .innerHTML = `
                <i class="fa-solid fa-pen"></i>
                Actualizar socio
            `;


        // MOSTRAR BOTÓN CANCELAR

        document.getElementById("btnCancelar")
            .hidden = false;


        // LLEVAR AL FORMULARIO

        document.querySelector(".panel")
            .scrollIntoView({
                behavior: "smooth"
            });


    } catch (error) {

        console.error("Error:", error);

        Notificaciones.error(
            "No se pudo cargar el socio."
        );
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


        const socioActualizado = await respuesta.json();

        console.log(
            "Socio actualizado:",
            socioActualizado
        );


        Notificaciones.exito(
            "Socio actualizado correctamente."
        );

        cancelarEdicion();

        await cargarSocios();


    } catch (error) {

        console.error("Error:", error);

        Notificaciones.error(
            "No se pudo actualizar el socio."
        );
    }
}


// ==========================================
// ELIMINAR SOCIO
// ==========================================

async function eliminarSocio(id) {

    const confirmar = await Notificaciones.confirmar(
        "¿Está seguro de que desea eliminar este socio?",
        "Eliminar socio"
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


        await Notificaciones.exito(
            "El socio fue eliminado correctamente."
        );

        await cargarSocios();


    } catch (error) {

        console.error("Error:", error);

        Notificaciones.error(
            "No se pudo eliminar el socio."
        );
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

        await Notificaciones.info(
            "Ingrese un DNI para realizar la búsqueda.",
            "DNI requerido"
        );

        return;
    }


    try {

        const respuesta = await fetch(
            `${API_URL}/dni/${encodeURIComponent(dni)}`
        );


        if (respuesta.status === 404) {

            await Notificaciones.info(
                "No se encontró ningún socio registrado con ese DNI.",
                "Socio no encontrado"
            );

            return;
        }


        if (!respuesta.ok) {

            throw new Error("Error al buscar el socio");
        }


        const socio = await respuesta.json();

        console.log("Socio encontrado:", socio);


        // MOSTRAR SOLAMENTE EL SOCIO ENCONTRADO

        actividadesPorSocio = await obtenerActividadesPorSocio();

        mostrarSocios([socio]);


    } catch (error) {

        console.error(
            "Error al buscar socio:",
            error
        );

        Notificaciones.error(
            "No se pudo realizar la búsqueda. Verifique la conexión con el servidor."
        );
    }
}


// ==========================================
// MOSTRAR TODOS LOS SOCIOS
// ==========================================

function mostrarTodosLosSocios() {

    document.getElementById("buscarDni").value = "";

    cargarSocios();
}


// ==========================================
// WHATSAPP - ABRIR CONVERSACIÓN
// ==========================================

function abrirWhatsApp(telefono, mensaje) {

    if (!telefono) {

        Notificaciones.info(
            "El socio no tiene un teléfono registrado."
        );

        return;
    }


    // ELIMINAR ESPACIOS, GUIONES Y SÍMBOLOS

    let numero = String(telefono).replace(/\D/g, '');


    // FORMATO ARGENTINO

    // Si tiene 10 dígitos, se agrega 549.
    if (numero.length === 10) {

        numero = "549" + numero;
    }

        // Si tiene 12 dígitos y comienza con 54,
    // se agrega el 9 para formato WhatsApp.
    else if (numero.length === 12 && numero.startsWith("54")) {

        numero = "549" + numero.substring(2);
    }


    // VALIDAR NÚMERO

    if (!/^549\d{10}$/.test(numero)) {

        Notificaciones.info(
            "El número de teléfono no tiene un formato válido para WhatsApp. Verifique el teléfono registrado del socio."
        );

        return;
    }


    if (!mensaje || !mensaje.trim()) {
        return;
    }


    // GENERAR ENLACE DE WHATSAPP

    const url =
        `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;


    // ABRIR WHATSAPP

    window.open(
        url,
        "_blank",
        "noopener,noreferrer"
    );
}


// ==========================================
// WHATSAPP - GENERAR MENSAJES
// ==========================================

function generarMensaje(tipo, socio) {

    const nombre = socio.nombre;

    const mensajes = {

        bienvenida:
            `¡Hola ${nombre}! Bienvenido/a a Italy Fitness. ¡Gracias por elegirnos!`,

        vencimiento:
            `¡Hola ${nombre}! Te recordamos que tu cuota de Italy Fitness está próxima a vencer. ¡Te esperamos!`,

        vencida:
            `¡Hola ${nombre}! Te informamos que tu cuota de Italy Fitness se encuentra vencida. Podés acercarte a recepción para renovarla.`,

        pago:
            `¡Hola ${nombre}! Confirmamos que registramos tu pago en Italy Fitness. ¡Muchas gracias!`,

        promocion:
            `¡Hola ${nombre}! Tenemos una promoción especial en Italy Fitness. ¡Consultanos!`
    };


    return mensajes[tipo] || '';
}


// ==========================================
// WHATSAPP - SELECCIONAR MENSAJE
// ==========================================

function seleccionarMensajeWhatsApp(socio) {

    const nombreCompleto =
        `${socio.nombre} ${socio.apellido}`;


    // VERIFICAR TELÉFONO

    if (!socio.telefono || !socio.telefono.trim()) {

        Notificaciones.info(
            "Este socio no tiene un teléfono registrado."
        );

        return;
    }


    // SELECCIONAR TIPO DE MENSAJE

    const opcion = prompt(

        `Enviar WhatsApp a ${nombreCompleto}\n\n` +

        `1 - Mensaje personalizado\n` +
        `2 - Bienvenida\n` +
        `3 - Recordatorio de vencimiento\n` +
        `4 - Cuota vencida\n` +
        `5 - Confirmación de pago\n` +
        `6 - Promoción\n\n` +

        `Seleccione una opción:`
    );


    if (opcion === null) {
        return;
    }


    let mensaje = "";


    // MENSAJE PERSONALIZADO

    if (opcion === "1") {

        mensaje = prompt(
            `Escriba el mensaje para ${nombreCompleto}:`
        );

        if (!mensaje || !mensaje.trim()) {

            return;
        }

        mensaje = mensaje.trim();
    }


    // MENSAJES AUTOMÁTICOS

    else {

        const tipos = {

            "2": "bienvenida",
            "3": "vencimiento",
            "4": "vencida",
            "5": "pago",
            "6": "promocion"
        };


        const tipo = tipos[opcion];


        if (!tipo) {

            Notificaciones.info(
                "Opción no válida."
            );

            return;
        }


        mensaje = generarMensaje(tipo, socio);
    }


    // ABRIR WHATSAPP CON EL MENSAJE PREPARADO

    abrirWhatsApp(
        socio.telefono,
        mensaje
    );
}
