
const API_BASE = "http://localhost:8080";
const URL_SOCIOS = `${API_BASE}/socios`;

const form = document.getElementById("formAcceso");
const dniInput = document.getElementById("dniAcceso");
const btn = document.getElementById("btnValidar");
const resultado = document.getElementById("resultadoAcceso");


function actualizarReloj() {
    const fecha = document.getElementById("fechaActual");
    const hora = document.getElementById("horaActual");

    // Si esta página no tiene el reloj, no hacer nada.
    if (!fecha || !hora) {
        return;
    }

    const ahora = new Date();

    fecha.textContent = new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(ahora);

    hora.textContent = new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(ahora);
}

actualizarReloj();
setInterval(actualizarReloj, 1000);


const normalizarDni = v => String(v ?? "").replace(/\D/g, "");

async function registrarAcceso(idSocio) {
    const respuesta = await fetch(
        `${API_BASE}/accesos?idSocio=${encodeURIComponent(idSocio)}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                permitido:false,
                motivo: "Validacion de acceso"
            })
        }    );

    if (!respuesta.ok) {
        const detalle = await respuesta.text();
        throw new Error(
            `Error al registrar el acceso: HTTP ${respuesta.status}. ${detalle}`
        );
    }

    return await respuesta.json();
}

function mostrarResultado(ok, titulo, mensaje, detalle = "") {
    resultado.hidden = false;
    resultado.className = `resultado ${ok ? "permitido" : "denegado"}`;
    document.getElementById("iconoResultado").innerHTML = ok ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>';
    document.getElementById("tituloResultado").textContent = titulo;
    document.getElementById("mensajeResultado").textContent = mensaje;
    document.getElementById("detalleResultado").textContent = detalle;
}


form.addEventListener("submit", async e => {
 e.preventDefault();

 const dni = normalizarDni(dniInput.value);

 if (!/^\d{7,8}$/.test(dni)) {
  mostrarResultado(
      false,
      "DNI INVÁLIDO",
      "Ingresá un DNI de 7 u 8 números."
  );
  dniInput.focus();
  return;
 }

 btn.disabled = true;
 btn.innerHTML =
     '<i class="fa-solid fa-spinner fa-spin"></i><span>VERIFICANDO...</span>';
 resultado.hidden = true;

 try {
  const response = await fetch(URL_SOCIOS, {
   headers: { Accept: "application/json" }
  });

  if (!response.ok) {
   throw new Error(`Error HTTP ${response.status}`);
  }

  const data = await response.json();

  const socios = Array.isArray(data)
      ? data
      : Array.isArray(data.content)
          ? data.content
          : [];

  const socio = socios.find(
      s => normalizarDni(s.dni) === dni
  );


     if (!socio) {
         mostrarResultado(
             false,
             "ACCESO DENEGADO",
             "Socio no registrado.",
             `DNI: ${dni}`
         );
         return;
     }

     const nombre = [socio.nombre, socio.apellido]
         .filter(Boolean)
         .join(" ");

     try {

         const acceso = await registrarAcceso(socio.id);

         if (acceso.permitido) {
             mostrarResultado(
                 true,
                 "ACCESO PERMITIDO",
                 `¡Bienvenido/a${nombre ? ", " + nombre : ""}!`,
                 acceso.motivo || "Tu cuota está vigente."
             );
         } else {
             mostrarResultado(
                 false,
                 "ACCESO DENEGADO",
                 acceso.motivo || "Cuota vencida o inexistente.",
                 `${nombre || "Socio"} · DNI ${dni}`
             );
         }
     } catch (errorRegistro) {
         console.error("Error al registrar el acceso:", errorRegistro);

         mostrarResultado(
             false,
             "ERROR DE REGISTRO",
             "No se pudo guardar el intento de acceso.",
             errorRegistro.message
         );
     }


 } catch (error) {
  console.error("Error validando acceso:", error);

  mostrarResultado(
      false,
      "NO SE PUDO VALIDAR",
      "No fue posible consultar el servidor.",
      "El ingreso no fue autorizado."
  );

 } finally {
  btn.disabled = false;
  btn.innerHTML =
      '<span>VALIDAR ACCESO</span><i class="fa-solid fa-arrow-right"></i>';

  dniInput.value = "";
  dniInput.focus();
 }
});
