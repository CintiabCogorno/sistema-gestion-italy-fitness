
const API_BASE = "http://localhost:8080";
const URL_SOCIOS = `${API_BASE}/socios`;

const form = document.getElementById("formAcceso");
const dniInput = document.getElementById("dniAcceso");
const btn = document.getElementById("btnValidar");
const resultado = document.getElementById("resultadoAcceso");

function actualizarReloj() {
    const ahora = new Date();
    document.getElementById("fechaActual")
        .textContent = new Intl.DateTimeFormat("es-AR", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric"
    }).format(ahora);
    document.getElementById("horaActual")
        .textContent = new Intl.DateTimeFormat("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    }).format(ahora);
}

actualizarReloj();
setInterval(actualizarReloj, 1000);
const normalizarDni = v => String(v ?? "").replace(/\D/g, "");

function cuotaEstaVigente(socio) {
    if (typeof socio.cuotaVigente === "boolean")
        return socio.cuotaVigente;
    if (typeof socio.tieneCuotaVigente === "boolean")
        return socio.tieneCuotaVigente;
    const fecha = socio.fechaVencimientoCuota ?? socio.fechaVencimiento ?? socio.vencimientoCuota;
    if (fecha) {
        const vencimiento = new Date(`${String(fecha).slice(0, 10)}T23:59:59`);
        return !Number.isNaN(vencimiento.getTime()) && vencimiento >= new Date();
    }
    // Por seguridad, no autoriza si la API no informa la vigencia.
    return false;
}


async function registrarAcceso(permitido, motivo) {
    const respuesta = await fetch(`${API_BASE}/accesos`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify({
            permitido: permitido,
            motivo: motivo
        })
    });

    if (!respuesta.ok) {
        throw new Error(
            `Error al registrar el acceso: HTTP ${respuesta.status}`
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

  let permitido = false;
  let motivo = "";
  let nombre = "";

  if (!socio) {
   motivo = "Socio no registrado";
  } else {
   nombre = [socio.nombre, socio.apellido]
       .filter(Boolean)
       .join(" ");

   permitido = cuotaEstaVigente(socio);

   motivo = permitido
       ? "Cuota vigente"
       : "Cuota vencida o vigencia no verificada";
  }

  // Registrar el resultado en el backend.
  try {
   await registrarAcceso(permitido, motivo);
  } catch (errorRegistro) {
   console.error(
       "No se pudo registrar el acceso:",
       errorRegistro
   );

   mostrarResultado(
       false,
       "ERROR DE REGISTRO",
       "No se pudo guardar el intento de acceso.",
       `DNI: ${dni}. Consultá al personal del gimnasio.`
   );
   return;
  }

  // Mostrar el resultado de la validación.
  if (!socio) {
   mostrarResultado(
       false,
       "ACCESO DENEGADO",
       "Socio no registrado.",
       `DNI: ${dni}`
   );
  } else if (permitido) {
   mostrarResultado(
       true,
       "ACCESO PERMITIDO",
       `¡Bienvenido/a${nombre ? ", " + nombre : ""}!`,
       "Tu cuota está vigente."
   );
  } else {
   mostrarResultado(
       false,
       "ACCESO DENEGADO",
       "La cuota está vencida o no se pudo verificar su vigencia.",
       `${nombre || "Socio"} · DNI ${dni}`
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
