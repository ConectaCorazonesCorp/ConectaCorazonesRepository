// ============================================
// Conecta Corazones — Frontend dinámico
// ============================================

document.addEventListener('DOMContentLoaded', () => {
	loadSurvey();
	loadGeneralList();
	loadPersonalizedList();
	loadFAQs();
});

// ============================================
// ENCUESTA PASO A PASO CON ETIQUETAS
// ============================================
let surveyQuestions = [];
let currentQuestionIndex = 0;
let surveyAnswers = {};   // {questionId: optionValue}
let surveyTags = [];       // ['salud', 'refugio', ...]

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

	q.options.forEach(opt => {
		const label = document.createElement('label');
		label.className = 'radio-label';
		const isSelected = surveyAnswers[q.id] === opt.value;
		label.innerHTML = `<input type="radio" name="survey-q-${q.id}" value="${opt.value}" data-tag="${opt.tag || ''}" ${isSelected ? 'checked' : ''}> ${opt.label}`;
		label.querySelector('input').addEventListener('change', (e) => {
			surveyAnswers[q.id] = opt.value;
			// Guardar el tag de la opción seleccionada
			surveyTags = surveyTags.filter(t => t._qid !== q.id);
			if (opt.tag) {
				surveyTags.push({ _qid: q.id, tag: opt.tag });
			}
			nextBtn.disabled = false;
		});
		group.appendChild(label);
	});
	container.appendChild(group);

	// Botón siguiente / ver resultados
	nextBtn.disabled = !surveyAnswers[q.id];
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
				<h2>🎯 Resultados personalizados</h2>
				<p>Hemos analizado tus respuestas y ordenado las ONGs y voluntarios según su relevancia para ti mediante nuestro algoritmo de match.</p>
			`;
			container.parentElement.insertBefore(summary, container);

			// Renderizar Resultados ordenados con indicador de relevancia
			items.forEach(item => {
				let card;
				if (item.type === 'ong') {
					card = createOngCard(item, true);
				} else {
					card = createVoluntarioCard(item, true);
				}

				// Agregar barra de relevancia
				if (item.relevance > 0) {
					const badge = document.createElement('div');
					badge.className = 'relevance-badge';
					badge.innerHTML = `
						<div class="relevance-bar">
							<div class="relevance-fill" style="width:${item.relevance}%"></div>
						</div>
						<span class="relevance-text">${item.relevance}% compatible (${item.match_count} coincidencias exactas)</span>
					`;
					card.insertBefore(badge, card.firstChild.nextSibling);
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

	card.innerHTML = `
        <div class="ong-logo"><img src="${ong.logo}" alt="${ong.name}"></div>
        <div class="ong-desc">${ong.description}</div>
        <div class="ong-actions">
            <a class="btn btn-primary" href="${ong.link || '#'}" target="_blank">Acceder</a>
        </div>
    `;
	return card;
}

function createVoluntarioCard(vol, personalized) {
	const card = document.createElement('div');
	card.className = 'ong-card' + (personalized ? ' personalized' : '');
	card.dataset.id = vol.id;
	card.dataset.type = 'voluntario';

	const contactInfo = [];
	if (vol.phone) contactInfo.push(`📞 ${vol.phone}`);
	if (vol.email) contactInfo.push(`✉ ${vol.email}`);

	card.innerHTML = `
        <div class="ong-logo"><img src="${vol.photo || './images/default-avatar.png'}" alt="${vol.name}"></div>
        <div class="ong-desc">
            <strong>${vol.name}</strong><br>
            ${vol.description || ''}
            ${contactInfo.length ? '<br><small>' + contactInfo.join(' | ') + '</small>' : ''}
        </div>
        <div class="ong-actions">
            <button class="btn btn-primary" onclick="contactOng('${vol.name}')">Contactar</button>
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
	btn.classList.toggle('active');
	if (type === 'ongs') filterOngs = !filterOngs;
	if (type === 'voluntarios') filterVoluntarios = !filterVoluntarios;

	const container = document.getElementById('general-list') || document.getElementById('personalized-list');
	if (!container) return;

	container.querySelectorAll('.ong-card').forEach(card => {
		const cardType = card.dataset.type;
		if (cardType === 'ong') {
			card.style.display = filterOngs ? '' : 'none';
		} else if (cardType === 'voluntario') {
			card.style.display = filterVoluntarios ? '' : 'none';
		}
	});
}

// ============================================
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
