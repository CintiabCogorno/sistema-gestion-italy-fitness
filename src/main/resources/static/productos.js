
const API_PRODUCTOS = "http://localhost:8080/productos";

let productoEditando = null;
let productosCargados = [];

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formProducto");

    if (!form) return;

    form.addEventListener("submit", guardarOEditarProducto);

    document.getElementById("btnCancelarProducto")
        .addEventListener("click", cancelarEdicionProducto);

    document.getElementById("btnBuscarProducto")
        .addEventListener("click", buscarProductoPorNombre);

    document.getElementById("btnMostrarProductos")
        .addEventListener("click", () => {
            document.getElementById("buscarNombreProducto").value = "";
            cargarProductos();
        });

    document.getElementById("buscarNombreProducto")
        .addEventListener("keydown", event => {
            if (event.key === "Enter") {
                event.preventDefault();
                buscarProductoPorNombre();
            }
        });
});

// LISTAR PRODUCTOS
async function cargarProductos() {
    try {
        const respuesta = await fetch(API_PRODUCTOS);

        if (!respuesta.ok) {
            throw new Error("No se pudieron cargar los productos");
        }

        productosCargados = await respuesta.json();
        mostrarProductos(productosCargados);

    } catch (error) {
        console.error(error);
        alert("No se pudieron cargar los productos. Verificá que la API esté funcionando.");
    }
}

// MOSTRAR PRODUCTOS EN LA TABLA
function mostrarProductos(productos) {
    const tabla = document.getElementById("tablaProductos");
    const tablaVacia = document.getElementById("tablaProductosVacia");
    const cantidad = document.getElementById("cantidadProductos");

    tabla.replaceChildren();
    cantidad.textContent = productos.length;
    tablaVacia.hidden = productos.length > 0;

    productos.forEach(producto => {
        const fila = document.createElement("tr");

        agregarCelda(fila, producto.nombre);
        agregarCelda(fila, producto.descripcion);
        agregarCelda(
            fila,
            Number(producto.precio).toLocaleString("es-AR", {
                style: "currency",
                currency: "ARS"
            })
        );
        agregarCelda(fila, producto.stock);

        const celdaAcciones = document.createElement("td");
        celdaAcciones.className = "acciones-tabla";

        const botonEditar = document.createElement("button");
        botonEditar.type = "button";
        botonEditar.className = "btn-editar";
        botonEditar.title = "Editar producto";
        botonEditar.innerHTML = '<i class="fa-solid fa-pen"></i>';
        botonEditar.addEventListener("click", () => editarProducto(producto));

        const botonStock = document.createElement("button");
        botonStock.type = "button";
        botonStock.className = "btn-editar";
        botonStock.title = "Aumentar stock";
        botonStock.innerHTML = '<i class="fa-solid fa-boxes-stacked"></i>';
        botonStock.addEventListener("click", () => aumentarStockProducto(producto));

        const botonEliminar = document.createElement("button");
        botonEliminar.type = "button";
        botonEliminar.className = "btn-eliminar";
        botonEliminar.title = "Eliminar producto";
        botonEliminar.innerHTML = '<i class="fa-solid fa-trash"></i>';
        botonEliminar.addEventListener("click", () => eliminarProducto(producto));

        celdaAcciones.append(botonEditar, botonStock, botonEliminar);
        fila.appendChild(celdaAcciones);
        tabla.appendChild(fila);
    });
}

function agregarCelda(fila, valor) {
    const celda = document.createElement("td");
    celda.textContent = valor ?? "";
    fila.appendChild(celda);
}

// REGISTRAR O EDITAR
async function guardarOEditarProducto(event) {
    event.preventDefault();

    const nombre = document.getElementById("nombreProducto").value.trim();
    const descripcion = document.getElementById("descripcionProducto").value.trim();
    const precioTexto = document.getElementById("precioProducto").value;
    const stockTexto = document.getElementById("stockProducto").value;

    const precio = Number(precioTexto);
    const stock = Number(stockTexto);

    if (!nombre || !descripcion || !precioTexto || !stockTexto) {
        alert("Completá todos los campos.");
        return;
    }

    if (!Number.isFinite(precio) || precio <= 0) {
        alert("El precio debe ser mayor que cero.");
        return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
        alert("El stock debe ser un número entero no negativo.");
        return;
    }

    const producto = {
        nombre,
        descripcion,
        precio,
        stock
    };

    const editando = productoEditando !== null;
    const url = editando
        ? `${API_PRODUCTOS}/${productoEditando}`
        : API_PRODUCTOS;

    try {
        const respuesta = await fetch(url, {
            method: editando ? "PUT" : "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(producto)
        });

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            throw new Error(mensaje || "No se pudo guardar el producto");
        }

        alert(editando
            ? "Producto actualizado correctamente."
            : "Producto registrado correctamente.");

        limpiarFormularioProducto();
        await cargarProductos();

    } catch (error) {
        console.error(error);
        alert(`Error al guardar el producto: ${error.message}`);
    }
}

// CARGAR DATOS EN EL FORMULARIO
function editarProducto(producto) {
    productoEditando = producto.idProducto;

    document.getElementById("nombreProducto").value = producto.nombre;
    document.getElementById("descripcionProducto").value = producto.descripcion;
    document.getElementById("precioProducto").value = producto.precio;
    document.getElementById("stockProducto").value = producto.stock;

    document.getElementById("tituloFormularioProducto").textContent =
        "Editar producto";

    document.getElementById("btnGuardarProducto").innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Guardar cambios';

    document.getElementById("btnCancelarProducto").hidden = false;

    document.getElementById("formProducto").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// CANCELAR EDICIÓN
function cancelarEdicionProducto() {
    limpiarFormularioProducto();
}

function limpiarFormularioProducto() {
    productoEditando = null;
    document.getElementById("formProducto").reset();

    document.getElementById("tituloFormularioProducto").textContent =
        "Registrar producto";

    document.getElementById("btnGuardarProducto").innerHTML =
        '<i class="fa-solid fa-floppy-disk"></i> Guardar producto';

    document.getElementById("btnCancelarProducto").hidden = true;
}

// BUSCAR POR NOMBRE
async function buscarProductoPorNombre() {
    const nombre = document
        .getElementById("buscarNombreProducto")
        .value.trim();

    if (!nombre) {
        alert("Ingresá el nombre del producto.");
        return;
    }

    try {
        const respuesta = await fetch(
            `${API_PRODUCTOS}/buscar?nombre=${encodeURIComponent(nombre)}`
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo realizar la búsqueda");
        }

        const productos = await respuesta.json();
        mostrarProductos(productos);

        if (productos.length === 0) {
            alert("No se encontraron productos con ese nombre.");
        }

    } catch (error) {
        console.error(error);
        alert("Error al buscar productos.");
    }
}

// ELIMINAR PRODUCTO
async function eliminarProducto(producto) {
    const confirmar = confirm(
        `¿Querés eliminar el producto "${producto.nombre}"?`
    );

    if (!confirmar) return;

    try {
        const respuesta = await fetch(
            `${API_PRODUCTOS}/${producto.idProducto}`,
            { method: "DELETE" }
        );

        if (!respuesta.ok) {
            const mensaje = await respuesta.text();
            throw new Error(mensaje || "No se pudo eliminar el producto");
        }

        alert("Producto eliminado correctamente.");
        await cargarProductos();

    } catch (error) {
        console.error(error);
        alert(`Error al eliminar: ${error.message}`);
    }
}

// AUMENTAR STOCK
async function aumentarStockProducto(producto) {
    const respuestaUsuario = prompt(
        `Stock actual de ${producto.nombre}: ${producto.stock}\n` +
        "¿Cuántas unidades querés agregar?"
    );

    if (respuestaUsuario === null) return;

    const cantidad = Number(respuestaUsuario);

    if (!Number.isInteger(cantidad) || cantidad <= 0) {
        alert("Ingresá una cantidad entera mayor que cero.");
        return;
    }

    try {
        const respuesta = await fetch(
            `${API_PRODUCTOS}/${producto.idProducto}/stock?cantidad=${cantidad}`,
            { method: "PUT" }
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo actualizar el stock");
        }

        alert("Stock actualizado correctamente.");
        await cargarProductos();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// Permite que la navegación cargue los productos al abrir la vista.
window.cargarProductos = cargarProductos;
