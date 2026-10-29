
const API = 'http://localhost:8080', $ = id => document.getElementById(id);
let socios = [], pagos = [], selectedSocio = null, editing = null, toVoid = null;
const money = n => new Intl.NumberFormat('es-AR', {style: 'currency', currency: 'ARS'}).format(Number(n || 0));
const dateObj = s => s ? new Date(s + 'T00:00:00') : null;
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
}[c]));
const sid = s => s?.idSocio ?? s?.idPersona ?? s?.id ?? s?.id_socio ?? null;
const sname = s => [s?.nombre, s?.apellido].filter(Boolean).join(' ') || s?.nombreCompleto || s?.apellidoNombre || 'Socio sin nombre';
const dni = s => s?.dni ?? s?.documento ?? '';

function notice(msg, type = 'info') {
    const n = $('notice');

    if (!n) {
        console.warn('No se encontró el elemento #notice:', msg);
        return;
    }

    n.textContent = msg;
    n.className = 'notice show ' + type;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearNotice() {
    const n = $('notice');

    if (!n) return;

    n.className = 'notice';
}

async function api(path, opt = {}) {
    const r = await fetch(API + path, {headers: {'Content-Type': 'application/json', ...(opt.headers || {})}, ...opt});
    const t = await r.text();
    let d = null;
    try {
        d = t ? JSON.parse(t) : null
    } catch {
        d = t
    }
    if (!r.ok) throw Error(typeof d === 'string' ? d : (d?.message || `Error HTTP ${r.status}`));
    return d
}

function findSocio(p) {
    const id = p?.socioId ?? p?.idSocio ?? p?.socio?.idSocio ?? p?.socio?.idPersona ?? p?.socio?.id;
    return id == null ? null : socios.find(s => String(sid(s)) === String(id)) || null
}

function renderMetrics() {
    const active = pagos.filter(p => !p.anulado), now = new Date(), month = active.filter(p => {
        const d = dateObj(p.fechaPago);
        return d && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    });
    $('metricTotal').textContent = active.length;
    $('metricMonth').textContent = money(month.reduce((a, p) => a + Number(p.valorCuota || 0), 0));
    $('metricSocios').textContent = socios.length
}

function renderResults() {
    const q = $('buscarSocio').value.trim().toLowerCase(), box = $('results');
    if (!q || selectedSocio) {
        box.style.display = 'none';
        return
    }
    const list = socios.filter(s => (sname(s) + ' ' + dni(s)).toLowerCase().includes(q)).slice(0, 12);
    box.innerHTML = list.length ? list.map(s => `<button type="button" class="socio-option" data-id="${esc(sid(s))}"><b>${esc(sname(s))}</b><span>DNI: ${esc(dni(s) || 'No informado')} · ID: ${esc(sid(s) ?? 'No disponible')}</span></button>`).join('') : '<div class="empty">No se encontraron socios.</div>';
    box.style.display = 'block'
}

function chooseSocio(s) {
    if (sid(s) == null) {
        notice('No se pudo identificar el ID del socio. Revisá el JSON de GET /socios y la entidad Persona.', 'error');
        return
    }
    selectedSocio = s;
    $('buscarSocio').value = `${sname(s)} · DNI ${dni(s) || 's/d'}`;
    $('selected').innerHTML = `<b>✓ ${esc(sname(s))}</b>\n    <div >DNI: ${esc(dni(s) || 'No informado')}</div>`;
    $('selected').style.display = 'block';
    $('results').style.display = 'none'
}

function clearSocio() {
    selectedSocio = null;
    $('buscarSocio').value = '';
    $('selected').style.display = 'none';
    $('selected').innerHTML = '';
    $('results').style.display = 'none'
}

function render() {
    const q = $('search').value.trim().toLowerCase(), st = $('statusFilter').value, from = $('desde').value,
        to = $('hasta').value;
    const list = pagos.filter(p => {
        const s = findSocio(p),
            hay = `${p.idPago || ''} ${sname(s || {})} ${dni(s || {})} ${p.medioPago || ''}`.toLowerCase();
        return (!q || hay.includes(q)) && (st === 'TODOS' || (st === 'ANULADO' ? p.anulado : !p.anulado)) && (!from || p.fechaPago >= from) && (!to || p.fechaPago <= to)
    }).sort((a, b) => String(b.fechaPago || '').localeCompare(String(a.fechaPago || '')));
    $('tbody').innerHTML = list.length ? list.map(p => {
        const s = findSocio(p),
            who = s ? `${esc(sname(s))}<small>DNI ${esc(dni(s) || 's/d')}</small>` : '<span style="color:#ffd166">Socio no incluido en JSON</span>';
        return `<tr><td>#${esc(p.idPago)}</td><td>${who}</td><td>${esc(p.fechaPago || '—')}</td><td><b>${money(p.valorCuota)}</b></td><td>${esc(p.medioPago || '—')}</td><td><span class="status ${p.anulado ? 'void' : 'valid'}">${p.anulado ? 'ANULADO' : 'NO ANULADO'}</span></td><td><button class="smallbtn" data-edit="${esc(p.idPago)}" ${p.anulado ? 'disabled' : ''}>Editar</button><button class="smallbtn" data-void="${esc(p.idPago)}" ${p.anulado ? 'disabled' : ''}>Anular</button></td></tr>`
    }).join('') : '<tr><td colspan="7" class="empty">No hay pagos que coincidan con los filtros.</td></tr>';
    $('summary').textContent = `Mostrando ${list.length} de ${pagos.length} pagos. Los registros anulados se conservan.`
}

async function load() {
    clearNotice();
    $('tbody').innerHTML = '<tr><td colspan="7" class="empty">Cargando pagos...</td></tr>';
    try {
        const [s, p] = await Promise.all([api('/socios'), api('/pagos')]);
        socios = Array.isArray(s) ? s : [];
        pagos = Array.isArray(p) ? p : [];
        renderMetrics();
        render();
        if (pagos.some(p => !p.socioId && !p.idSocio && !p.socio)) notice('El backend oculta la relación socio en Pago mediante @JsonIgnore. El registro de pagos funciona, pero para mostrar el socio histórico y permitir editarlo desde la tabla hay que exponer socioId en la respuesta mediante un DTO o un getter de solo lectura.', 'info')
    } catch (e) {
        $('tbody').innerHTML = '<tr><td colspan="7" class="empty">No se pudo cargar la información.</td></tr>';
        notice(`No se pudo conectar con ${API}. Verificá que Spring Boot esté iniciado y que CORS permita la página. ${e.message}`, 'error')
    }
}

function reset() {
    $('pagoForm').reset();
    editing = null;
    clearSocio();
    $('formTitle').textContent = 'Registrar un pago';
    $('submitBtn').textContent = 'REGISTRAR PAGO';
    $('cancelEdit').hidden = true;
    $('fechaPago').value = new Date().toLocaleDateString('en-CA')
}

$('buscarSocio').addEventListener('input', () => {
    if (selectedSocio) clearSocio();
    renderResults()
});
$('buscarSocio').addEventListener('focus', renderResults);
$('results').addEventListener('click', e => {
    const b = e.target.closest('[data-id]');
    if (b) {
        const s = socios.find(x => String(sid(x)) === b.dataset.id);
        if (s) chooseSocio(s)
    }
});
$('pagoForm').addEventListener('submit', async e => {
    e.preventDefault();
    clearNotice();
    if (!selectedSocio) {
        notice('Seleccioná un socio existente.', 'error');
        return
    }
    const date = $('fechaPago').value, d = dateObj(date), today = new Date();
    today.setHours(0, 0, 0, 0);
    const amount = Number($('valorCuota').value);
    if (!d || d > today) {
        notice('La fecha de pago no puede ser futura.', 'error');
        return
    }
    if (!Number.isFinite(amount) || amount <= 0) {
        notice('Ingresá un importe mayor que cero.', 'error');
        return
    }
    const payload = {fechaPago: date, valorCuota: amount, medioPago: $('medioPago').value, anulado: false};
    $('submitBtn').disabled = true;
    try {
        if (editing) {
            await api(`/pagos/${encodeURIComponent(editing)}`, {method: 'PUT', body: JSON.stringify(payload)});
            notice('Pago actualizado correctamente.', 'ok')
        } else {
            await api(`/pagos?idSocio=${encodeURIComponent(sid(selectedSocio))}`, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            notice('Pago registrado y asociado al socio.', 'ok')
        }
        reset();
        await load()
    } catch (err) {
        notice(`No se pudo guardar el pago: ${err.message}`, 'error')
    } finally {
        $('submitBtn').disabled = false
    }
});
$('tbody').addEventListener('click', e => {
    const edit = e.target.closest('[data-edit]'), v = e.target.closest('[data-void]');
    if (edit) {
        const p = pagos.find(x => String(x.idPago) === edit.dataset.edit);
        if (!p) return;
        const s = findSocio(p);
        if (!s) {
            notice('La respuesta actual de /pagos no expone socioId, por eso no se puede precargar el socio de este pago. Se necesita el ajuste de respuesta indicado.', 'error');
            return
        }
        editing = p.idPago;
        chooseSocio(s);
        $('fechaPago').value = p.fechaPago || '';
        $('valorCuota').value = p.valorCuota ?? '';
        $('medioPago').value = p.medioPago || '';
        $('formTitle').textContent = `Editar pago #${p.idPago}`;
        $('submitBtn').textContent = 'GUARDAR CAMBIOS';
        $('cancelEdit').hidden = false;
        window.scrollTo({top: 0, behavior: 'smooth'})
    }
    if (v) {
        toVoid = v.dataset.void;
        $('modalText').textContent = `¿Anular el pago #${toVoid}? Se conservará en el historial. Si no existe otro pago vigente, el acceso será denegado.`;
        $('modalbg').classList.add('show')
    }
});
$('modalCancel').addEventListener('click', () => {
    $('modalbg').classList.remove('show');
    toVoid = null
});
$('modalConfirm').addEventListener('click', async () => {
    if (!toVoid) return;
    $('modalConfirm').disabled = true;
    try {
        await api(`/pagos/${encodeURIComponent(toVoid)}`, {method: 'DELETE'});
        $('modalbg').classList.remove('show');
        notice(`Pago #${toVoid} anulado correctamente.`, 'ok');
        toVoid = null;
        await load()
    } catch (e) {
        $('modalbg').classList.remove('show');
        notice(`No se pudo anular: ${e.message}`, 'error')
    } finally {
        $('modalConfirm').disabled = false
    }
});
$('cancelEdit').addEventListener('click', reset);
$('clearForm').addEventListener('click', () => {
    reset();
    clearNotice()
});
$('refresh').addEventListener('click', load);
['search', 'desde', 'hasta', 'statusFilter'].forEach(id => $(id).addEventListener('input', render));
reset();
load();