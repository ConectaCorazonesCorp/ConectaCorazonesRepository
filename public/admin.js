// ============================================
// Panel de Administración — Conecta Corazones
// ============================================

// Configuración de tablas: nombre mostrado, endpoint API, y campos editables
const TABLE_CONFIG = {
    ongs: {
        label: '🏢 ONGs',
        endpoint: '/api/ongs',
        fields: [
            { key: 'name', label: 'Nombre', type: 'text', required: true },
            { key: 'description', label: 'Descripción', type: 'textarea' },
            { key: 'logo', label: 'Ruta del logo', type: 'text' },
            { key: 'link', label: 'Enlace web', type: 'text' }
        ]
    },
    voluntarios: {
        label: '👥 Voluntarios',
        endpoint: '/api/voluntarios',
        fields: [
            { key: 'name', label: 'Nombre', type: 'text', required: true },
            { key: 'description', label: 'Descripción', type: 'textarea' },
            { key: 'photo', label: 'Ruta de la foto', type: 'text' },
            { key: 'phone', label: 'Teléfono', type: 'text' },
            { key: 'email', label: 'Correo electrónico', type: 'email' }
        ]
    },
    faqs: {
        label: '❓ FAQs',
        endpoint: '/api/faqs',
        fields: [
            { key: 'question', label: 'Pregunta', type: 'textarea', required: true },
            { key: 'answer', label: 'Respuesta', type: 'textarea', required: true },
            { key: 'sort_order', label: 'Orden', type: 'number' }
        ]
    },
    survey_questions: {
        label: '📋 Preguntas Encuesta',
        endpoint: '/api/survey/questions',
        fields: [
            { key: 'question', label: 'Pregunta', type: 'textarea', required: true },
            { key: 'sort_order', label: 'Orden', type: 'number' }
        ]
    },
    survey_options: {
        label: '🔘 Opciones Encuesta',
        endpoint: '/api/survey/options',
        fields: [
            { key: 'question_id', label: 'ID de Pregunta', type: 'number', required: true },
            { key: 'label', label: 'Etiqueta (texto visible)', type: 'text', required: true },
            { key: 'value', label: 'Valor (interno)', type: 'text', required: true }
        ]
    }
};

let currentTable = 'ongs';
let allData = {};
let editingId = null;

// ---- INICIALIZACIÓN ----
document.addEventListener('DOMContentLoaded', () => {
    createTabs();
    loadAllData();
});

// ---- CREAR PESTAÑAS ----
function createTabs() {
    const container = document.getElementById('admin-tabs');
    Object.entries(TABLE_CONFIG).forEach(([key, config]) => {
        const btn = document.createElement('button');
        btn.className = 'admin-tab' + (key === currentTable ? ' active' : '');
        btn.textContent = config.label;
        btn.onclick = () => switchTab(key);
        container.appendChild(btn);
    });
}

function switchTab(tableName) {
    currentTable = tableName;
    document.querySelectorAll('.admin-tab').forEach((tab, i) => {
        const keys = Object.keys(TABLE_CONFIG);
        tab.classList.toggle('active', keys[i] === tableName);
    });
    renderTable();
}

// ---- CARGAR DATOS ----
async function loadAllData() {
    try {
        const res = await fetch('/api/admin/tables');
        allData = await res.json();
        renderTable();
    } catch (err) {
        console.error('Error cargando datos:', err);
        document.getElementById('admin-content').innerHTML =
            '<div class="admin-loading">❌ Error al cargar los datos. ¿Está el servidor corriendo?</div>';
    }
}

// ---- RENDERIZAR TABLA ----
function renderTable() {
    const content = document.getElementById('admin-content');
    const config = TABLE_CONFIG[currentTable];
    const tableData = allData[currentTable];

    if (!tableData) {
        content.innerHTML = '<div class="admin-loading">No hay datos disponibles</div>';
        return;
    }

    const { columns, rows } = tableData;

    // Header de sección
    let html = `
        <div class="admin-section-header">
            <h2>${config.label}</h2>
            <button class="btn-add" onclick="openCreateModal()">＋ Añadir registro</button>
        </div>
    `;

    // Info del schema
    html += `<div class="schema-info"><strong>Estructura:</strong> `;
    html += columns.map(c =>
        `<span class="schema-badge">${c.column_name} <small>(${c.data_type})</small></span>`
    ).join(' ');
    html += `</div>`;

    // Tabla de datos
    if (rows.length === 0) {
        html += '<div class="empty-message">No hay registros en esta tabla. ¡Añade uno!</div>';
    } else {
        const displayCols = columns.map(c => c.column_name);

        html += '<div class="admin-table-wrapper"><table class="admin-table">';
        html += '<thead><tr>';
        displayCols.forEach(col => {
            html += `<th>${col}</th>`;
        });
        html += '<th>Acciones</th></tr></thead>';
        html += '<tbody>';
        rows.forEach(row => {
            html += '<tr>';
            displayCols.forEach(col => {
                const val = row[col];
                const display = val !== null && val !== undefined ? String(val) : '';
                html += `<td title="${display.replace(/"/g, '&quot;')}">${display}</td>`;
            });
            html += `<td class="row-actions">
                <button class="btn-edit" onclick="openEditModal(${row.id})">✏️ Editar</button>
                <button class="btn-delete" onclick="deleteRecord(${row.id})">🗑️ Eliminar</button>
            </td>`;
            html += '</tr>';
        });
        html += '</tbody></table></div>';
    }

    content.innerHTML = html;
}

// ---- MODAL: CREAR ----
function openCreateModal() {
    editingId = null;
    const config = TABLE_CONFIG[currentTable];
    document.getElementById('modal-title').textContent = `Nuevo registro en ${config.label}`;
    renderModalForm({});
    document.getElementById('modal-overlay').classList.add('active');
}

// ---- MODAL: EDITAR ----
function openEditModal(id) {
    editingId = id;
    const config = TABLE_CONFIG[currentTable];
    const row = allData[currentTable].rows.find(r => r.id === id);
    if (!row) return;

    document.getElementById('modal-title').textContent = `Editar registro #${id}`;
    renderModalForm(row);
    document.getElementById('modal-overlay').classList.add('active');
}

// ---- RENDERIZAR FORMULARIO DEL MODAL ----
function renderModalForm(data) {
    const form = document.getElementById('modal-form');
    const config = TABLE_CONFIG[currentTable];

    form.innerHTML = config.fields.map(f => {
        const value = data[f.key] !== undefined && data[f.key] !== null ? data[f.key] : '';
        if (f.type === 'textarea') {
            return `<div class="form-group">
                <label>${f.label}${f.required ? ' *' : ''}</label>
                <textarea name="${f.key}" ${f.required ? 'required' : ''}>${value}</textarea>
            </div>`;
        }
        return `<div class="form-group">
            <label>${f.label}${f.required ? ' *' : ''}</label>
            <input type="${f.type}" name="${f.key}" value="${String(value).replace(/"/g, '&quot;')}" ${f.required ? 'required' : ''}>
        </div>`;
    }).join('');
}

// ---- CERRAR MODAL ----
function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    editingId = null;
}

// ---- GUARDAR REGISTRO ----
async function saveRecord() {
    const config = TABLE_CONFIG[currentTable];
    const form = document.getElementById('modal-form');
    const formData = new FormData(form);
    const body = {};

    config.fields.forEach(f => {
        let val = formData.get(f.key);
        if (f.type === 'number' && val !== '') val = parseInt(val, 10);
        body[f.key] = val || (f.type === 'number' ? 0 : '');
    });

    try {
        const url = editingId
            ? `${config.endpoint}/${editingId}`
            : config.endpoint;
        const method = editingId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error desconocido');
        }

        showToast(editingId ? 'Registro actualizado ✓' : 'Registro creado ✓', 'success');
        closeModal();
        await loadAllData();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ---- ELIMINAR REGISTRO ----
async function deleteRecord(id) {
    if (!confirm('¿Seguro que quieres eliminar este registro?')) return;

    const config = TABLE_CONFIG[currentTable];
    try {
        const res = await fetch(`${config.endpoint}/${id}`, { method: 'DELETE' });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Error desconocido');
        }
        showToast('Registro eliminado ✓', 'success');
        await loadAllData();
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ---- TOAST NOTIFICATION ----
function showToast(message, type) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ---- SOS (reutilizado) ----
function handleSOS(event) {
    event.preventDefault();
    window.open('https://salvavidas.com/blog/a-que-numero-llamar-en-caso-de-emergencia-en-espana-guia-completa-actualizada-2025/', '_blank');
}
window.handleSOS = handleSOS;
