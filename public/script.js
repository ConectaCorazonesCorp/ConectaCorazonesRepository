// ============================================
// Conecta Corazones — Frontend dinámico
// ============================================

document.addEventListener('DOMContentLoaded', () => {
	try { loadSurvey(); } catch (e) { }
	try { loadGeneralList(); } catch (e) { }
	try { loadPersonalizedList(); } catch (e) { }
	try { loadFAQs(); } catch (e) { }
});

// ============================================
// ENCUESTA PASO A PASO CON ETIQUETAS
// ============================================
let surveyQuestions = [];
let currentQuestionIndex = 0;
let surveyAnswers = {};   // {questionId: [optionValue1, optionValue2, ...]}
let surveyTags = [];       // [{_qid, tag}, ...]

async function loadSurvey() {
	const container = document.getElementById('survey-questions');
	if (!container) return;

	try {
		const res = await fetch('/api/survey');
		surveyQuestions = await res.json();

		if (surveyQuestions.length === 0) {
			container.innerHTML = '<p style="text-align:center;color:var(--gris-claro)">No hay preguntas configuradas.</p>';
			return;
		}

		currentQuestionIndex = 0;
		surveyAnswers = {};
		surveyTags = [];
		renderSurveyQuestion();
	} catch (err) {
		console.error('Error cargando encuesta:', err);
	}
}

function renderSurveyQuestion() {
	const container = document.getElementById('survey-questions');
	const progress = document.getElementById('survey-progress');
	const nextBtn = document.getElementById('survey-next');
	if (!container || !surveyQuestions.length) return;

	const q = surveyQuestions[currentQuestionIndex];
	const total = surveyQuestions.length;

	// Barra de progreso
	if (progress) {
		progress.innerHTML = `<span>Pregunta ${currentQuestionIndex + 1} de ${total}</span>
		<div class="progress-bar"><div class="progress-fill" style="width:${((currentQuestionIndex + 1) / total) * 100}%"></div></div>`;
	}

	// Pregunta + opciones
	container.innerHTML = '';
	const h2 = document.createElement('h2');
	h2.textContent = q.question;
	container.appendChild(h2);

	const group = document.createElement('div');
	group.className = 'radio-group';

	// Inicializar array de respuestas para esta pregunta si no existe
	if (!surveyAnswers[q.id]) surveyAnswers[q.id] = [];

	q.options.forEach(opt => {
		const label = document.createElement('label');
		label.className = 'radio-label';
		const isSelected = surveyAnswers[q.id].includes(opt.value);
		label.innerHTML = `<input type="checkbox" name="survey-q-${q.id}" value="${opt.value}" data-tag="${opt.tag || ''}" ${isSelected ? 'checked' : ''}> ${opt.label}`;
		label.querySelector('input').addEventListener('change', (e) => {
			if (e.target.checked) {
				// Añadir valor y tag
				if (!surveyAnswers[q.id].includes(opt.value)) {
					surveyAnswers[q.id].push(opt.value);
				}
				if (opt.tag) {
					surveyTags.push({ _qid: q.id, tag: opt.tag });
				}
			} else {
				// Quitar valor y tag
				surveyAnswers[q.id] = surveyAnswers[q.id].filter(v => v !== opt.value);
				surveyTags = surveyTags.filter(t => !(t._qid === q.id && t.tag === opt.tag));
			}
			nextBtn.disabled = surveyAnswers[q.id].length === 0;
		});
		group.appendChild(label);
	});
	container.appendChild(group);

	// Botón siguiente / ver resultados
	nextBtn.disabled = surveyAnswers[q.id].length === 0;
	if (currentQuestionIndex >= total - 1) {
		nextBtn.textContent = 'Ver resultados';
	} else {
		nextBtn.textContent = 'Siguiente';
	}
}

function nextSurveyQuestion() {
	if (currentQuestionIndex < surveyQuestions.length - 1) {
		currentQuestionIndex++;
		renderSurveyQuestion();
	} else {
		// Última pregunta: recopilar tags y navegar
		const tags = surveyTags.map(t => t.tag).join(',');
		window.location.href = 'ongs-personalizadas.html?tags=' + encodeURIComponent(tags);
	}
}
window.nextSurveyQuestion = nextSurveyQuestion;

// ============================================
// ONGs GENERALES (ongs-generales.html)
// ============================================
async function loadGeneralList() {
	const container = document.getElementById('general-list');
	if (!container) return;

	try {
		const [ongsRes, volsRes] = await Promise.all([
			fetch('/api/ongs'),
			fetch('/api/voluntarios')
		]);
		const ongs = await ongsRes.json();
		const voluntarios = await volsRes.json();

		ongs.forEach(ong => {
			try {
				if (ong) container.appendChild(createOngCard(ong, false));
			} catch (e) { console.error('Error rendering ONG:', e); }
		});

		voluntarios.forEach(vol => {
			try {
				if (vol) container.appendChild(createVoluntarioCard(vol, false));
			} catch (e) { console.error('Error rendering Volunteer:', e); }
		});
	} catch (err) {
		console.error('Error cargando lista general:', err);
		container.innerHTML = '<p style="text-align:center;color:red;">Error cargando las organizaciones. Inténtalo más tarde.</p>';
	}
}

// ============================================
// ONGs PERSONALIZADAS CON MATCHING (ongs-personalizadas.html)
// ============================================
async function loadPersonalizedList() {
	const container = document.getElementById('personalized-list');
	if (!container) return;

	try {
		// Obtener tags del usuario de la URL
		const params = new URLSearchParams(location.search);
		const tagsParam = params.get('tags');

		let items = [];
		if (tagsParam) {
			// LLAMADA A LA NUEVA RUTA DE MATCHING SQL
			const res = await fetch(`/api/match?tags=${encodeURIComponent(tagsParam)}`);
			items = await res.json();
		}

		if (items.length > 0) {
			// Mostrar resumen de resultados
			const summary = document.createElement('div');
			summary.className = 'results-summary';
			summary.innerHTML = `
				<p>Estas son las ONGs y voluntarios que mejor se adaptan a tus preferencias. Explora tus mejores opciones y comienza a ayudar.</p>
			`;
			
			const filterButtons = container.parentElement.querySelector('.filter-buttons');
			if (filterButtons) {
				container.parentElement.insertBefore(summary, filterButtons);
			} else {
				container.parentElement.insertBefore(summary, container);
			}

			// Renderizar Resultados ordenados con indicador de relevancia
			items.forEach(item => {
				let card;
				if (item.type === 'ong') {
					card = createOngCard(item, true);
				} else {
					card = createVoluntarioCard(item, true);
				}

				// Agregar barra de relevancia a la columna izquierda (o al card)
				if (item.relevance > 0) {
					const badge = document.createElement('div');
					badge.className = 'relevance-badge inline-match';
					badge.innerHTML = `
						<strong>${item.relevance}% compatible</strong>
					`;

					// Insertar dentro del card-left
					const leftCol = card.querySelector('.card-left');
					if (leftCol) {
						leftCol.appendChild(badge);
					}
				}
				container.appendChild(card);
			});
		} else {
			// Sin tags o sin resultados: mostrar todas normalmente
			const [ongsRes, volsRes] = await Promise.all([
				fetch('/api/ongs'),
				fetch('/api/voluntarios')
			]);
			const ongs = await ongsRes.json();
			const voluntarios = await volsRes.json();

			ongs.forEach(ong => container.appendChild(createOngCard(ong, true)));
			voluntarios.forEach(vol => container.appendChild(createVoluntarioCard(vol, true)));
		}

	} catch (err) {
		console.error('Error cargando lista personalizada:', err);
	}
}

// ============================================
// CREAR CARDS
// ============================================
function createOngCard(ong, personalized) {
	const card = document.createElement('div');
	card.className = 'ong-card' + (personalized ? ' personalized' : '');
	card.dataset.id = ong.id;
	card.dataset.type = 'ong';
	card.style.display = filterOngs ? 'grid' : 'none';

	// Contribuir estrella personalizada y botón
	const rightContent = personalized ? `<div class="star-icon">⭐<span class="tooltip-text">Resultado personalizado</span></div>` : `<div></div>`;

	card.innerHTML = `
		<div class="card-left">
			<div class="entity-badge inline-badge badge-ong">ONG</div>
			<div class="ong-logo"><img src="${ong.logo || ong.image || './images/default-avatar.png'}" alt="${ong.name}"></div>
			<!-- El match badge se insertará aquí en JS si tiene relevance -->
		</div>
		<div class="card-center">
			<h3>${ong.name}</h3>
			<p>${ong.description}</p>
		</div>
		<div class="card-right">
			${rightContent}
			<div class="ong-actions">
				<button class="btn btn-primary" onclick="showOngModal('${encodeURIComponent(JSON.stringify(ong))}')">Acceder</button>
			</div>
		</div>
	`;
	return card;
}

function createVoluntarioCard(vol, personalized) {
	const card = document.createElement('div');
	card.className = 'ong-card' + (personalized ? ' personalized' : '');
	card.dataset.id = vol.id;
	card.dataset.type = 'voluntario';
	card.style.display = filterVoluntarios ? 'grid' : 'none';

	const contactInfo = [];
	if (vol.phone) contactInfo.push(`📞 ${vol.phone}`);
	if (vol.email) contactInfo.push(`✉ ${vol.email}`);

	const rightContent = personalized ? `<div class="star-icon">⭐<span class="tooltip-text">Resultado personalizado</span></div>` : `<div></div>`;

	card.innerHTML = `
		<div class="card-left">
			<div class="entity-badge inline-badge badge-vol">Voluntario</div>
			<div class="ong-logo"><img src="${vol.photo || vol.image || './images/default-avatar.png'}" alt="${vol.name}"></div>
			<!-- El match badge se insertará aquí en JS si tiene relevance -->
		</div>
		<div class="card-center">
			<h3>${vol.name}</h3>
			<p>${vol.description || ''}</p>
		</div>
		<div class="card-right">
			${rightContent}
			<div class="ong-actions">
				<button class="btn btn-primary" onclick="showVoluntarioModal('${encodeURIComponent(JSON.stringify(vol))}')">Contactar</button>
			</div>
		</div>
	`;
	return card;
}

// ============================================
// FAQs (faq.html)
// ============================================
async function loadFAQs() {
	const container = document.getElementById('faq-list');
	if (!container) return;

	try {
		const res = await fetch('/api/faqs');
		const faqs = await res.json();

		faqs.forEach(faq => {
			const item = document.createElement('div');
			item.className = 'card faq-item';
			item.innerHTML = `
                <button class="faq-question">${faq.question} <span class="arrow">▼</span></button>
                <div class="faq-answer"><p>${faq.answer}</p></div>
            `;
			container.appendChild(item);
		});

		document.querySelectorAll('.faq-question').forEach(q => {
			q.addEventListener('click', () => {
				const ans = q.nextElementSibling;
				q.classList.toggle('active');
				ans.classList.toggle('active');
			});
		});
	} catch (err) {
		console.error('Error cargando FAQs:', err);
	}
}

// ============================================
// FILTRO ONGs/Voluntarios
// ============================================
let filterOngs = true;
let filterVoluntarios = true;

function toggleFilter(btn, type) {
	if (filterOngs && filterVoluntarios) {
		// Ambos están prendidos. Si toco uno, ese se queda prendido y el otro se apaga.
		if (type === 'ongs') {
			filterVoluntarios = false;
		} else {
			filterOngs = false;
		}
	} else if (type === 'ongs' && !filterOngs) {
		// Estaba apagado ONGs (solo Voluntarios prendidos) y toco ONGs -> Se prenden los dos
		filterOngs = true;
	} else if (type === 'voluntarios' && !filterVoluntarios) {
		// Estaba apagado Voluntarios (solo ONGs prendidos) y toco Voluntarios -> Se prenden los dos
		filterVoluntarios = true;
	}

	// 3. Sincronizar visualmente TODOS los botones de filtro en la pantalla
	document.querySelectorAll('.filter-btn').forEach(b => {
		if (b.getAttribute('onclick').includes("'ongs'")) {
			filterOngs ? b.classList.add('active') : b.classList.remove('active');
		} else if (b.getAttribute('onclick').includes("'voluntarios'")) {
			filterVoluntarios ? b.classList.add('active') : b.classList.remove('active');
		}
	});

	// 4. Aplicar visibilidad a las tarjetas en la pantalla (usando 'grid' para respetar la maquetación CSS)
	document.querySelectorAll('.ong-card').forEach(card => {
		const cardType = card.dataset.type;
		if (cardType === 'ong') {
			card.style.display = filterOngs ? 'grid' : 'none';
		} else if (cardType === 'voluntario') {
			card.style.display = filterVoluntarios ? 'grid' : 'none';
		}
	});
}

// ============================================
// VENTANAS EMERGENTES (MODALS)
// ============================================

function createModalInstance(contentHTML) {
	// Remover modal existente si lo hay
	const existing = document.getElementById('global-modal');
	if (existing) existing.remove();

	const overlay = document.createElement('div');
	overlay.id = 'global-modal';
	overlay.className = 'modal-overlay';
	overlay.innerHTML = `
		<div class="modal-content">
			<button class="modal-close" onclick="closeModal()">×</button>
			${contentHTML}
		</div>
	`;

	// Cerrar si hace clic fuera del contenido
	overlay.addEventListener('click', (e) => {
		if (e.target === overlay) closeModal();
	});

	document.body.appendChild(overlay);

	// Pequeño timeout para activar la transición CSS
	setTimeout(() => {
		overlay.classList.add('active');
	}, 10);
}

function closeModal() {
	const overlay = document.getElementById('global-modal');
	if (overlay) {
		overlay.classList.remove('active');
		setTimeout(() => overlay.remove(), 300); // Dar tiempo a la animación CSS
	}
}

function showOngModal(encodedOng) {
	const ong = JSON.parse(decodeURIComponent(encodedOng));
	// Definimos defaults por si el ONG no tiene los scopes/servicios
	const scope = ong.scope || 'No especificado';
	const services = ong.services || 'Múltiples servicios de apoyo';

	const html = `
		<h3>${ong.name}</h3>
		<p><strong>Alcance / Ámbito:</strong> ${scope}</p>
		<p><strong>Servicios Principales:</strong> ${services}</p>
		<p>${ong.description}</p>
		<a href="${ong.link || '#'}" target="_blank" class="btn btn-primary" style="display:block; text-align:center; box-sizing:border-box;">Ir a la web oficial</a>
	`;
	createModalInstance(html);
}

// Ventana emergente para Voluntarios
function showVoluntarioModal(encodedVol) {
	const vol = JSON.parse(decodeURIComponent(encodedVol));

	let contactHtml = '';
	if (vol.phone) contactHtml += `<p><strong>📞 Teléfono:</strong> ${vol.phone}</p>`;
	if (vol.email) contactHtml += `<p><strong>✉️ Correo Electrónico:</strong> <a href="mailto:${vol.email}">${vol.email}</a></p>`;

	if (!contactHtml) contactHtml = '<p>No se han proporcionado datos de contacto directos.</p>';

	const html = `
		<h3>Contactar a ${vol.name}</h3>
		<p>${vol.description || 'Voluntario de la plataforma.'}</p>
		<hr style="border:0; border-top:1px solid #ccc; margin: 15px 0;">
		<h4>Información de Contacto</h4>
		${contactHtml}
		<button class="btn btn-primary" onclick="closeModal()" style="width: 100%; box-sizing: border-box; margin-top: 15px;">Entendido</button>
	`;
	createModalInstance(html);
}
// UTILIDADES
// ============================================
function contactOng(name) {
	alert('Conectando con ' + name + '. Pronto recibirás más información.');
}

function handleSOS(event) {
	event.preventDefault();
	window.open('https://salvavidas.com/blog/a-que-numero-llamar-en-caso-de-emergencia-en-espana-guia-completa-actualizada-2025/', '_blank');
}

window.contactOng = contactOng;
window.toggleFilter = toggleFilter;
window.handleSOS = handleSOS;
