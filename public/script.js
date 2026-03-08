// ============================================
// Conecta Corazones — Frontend dinámico
// ============================================

document.addEventListener('DOMContentLoaded', () => {
	loadSurvey();
	loadGeneralList();
	loadPersonalizedList();
	loadFAQs();
});

// ---- ENCUESTA (index.html) ----
async function loadSurvey() {
	const container = document.getElementById('survey-questions');
	if (!container) return;

	try {
		const res = await fetch('/api/survey');
		const questions = await res.json();

		questions.forEach(q => {
			const h2 = document.createElement('h2');
			h2.textContent = q.question;
			container.appendChild(h2);

			const group = document.createElement('div');
			group.className = 'radio-group';

			q.options.forEach(opt => {
				const label = document.createElement('label');
				label.className = 'radio-label';
				label.innerHTML = `<input type="radio" name="help-type" value="${opt.value}" required> ${opt.label}`;
				group.appendChild(label);
			});

			container.appendChild(group);
		});
	} catch (err) {
		console.error('Error cargando encuesta:', err);
	}
}

// ---- ONGs GENERALES (ongs-generales.html) ----
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
			container.appendChild(createOngCard(ong, false));
		});

		voluntarios.forEach(vol => {
			container.appendChild(createVoluntarioCard(vol, false));
		});
	} catch (err) {
		console.error('Error cargando lista general:', err);
	}
}

// ---- ONGs PERSONALIZADAS (ongs-personalizadas.html) ----
async function loadPersonalizedList() {
	const container = document.getElementById('personalized-list');
	if (!container) return;

	try {
		const [ongsRes, volsRes] = await Promise.all([
			fetch('/api/ongs'),
			fetch('/api/voluntarios')
		]);
		const ongs = await ongsRes.json();
		const voluntarios = await volsRes.json();

		ongs.forEach(ong => {
			container.appendChild(createOngCard(ong, true));
		});

		voluntarios.forEach(vol => {
			container.appendChild(createVoluntarioCard(vol, true));
		});

		// Filtrar si viene un parámetro de la encuesta
		const params = new URLSearchParams(location.search);
		const cat = params.get('help-type');
		if (cat) {
			container.querySelectorAll('.ong-card').forEach(card => {
				if (card.dataset.category && card.dataset.category !== cat) {
					card.style.display = 'none';
				}
			});
		}
	} catch (err) {
		console.error('Error cargando lista personalizada:', err);
	}
}

// ---- CREAR CARD DE ONG ----
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

// ---- CREAR CARD DE VOLUNTARIO ----
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

// ---- FAQs (faq.html) ----
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

		// Vincular acordeón después de crear los elementos
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

// ---- FILTRO ONGs/Voluntarios ----
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

// ---- CONTACTAR ONG ----
function contactOng(name) {
	alert('Conectando con ' + name + '. Pronto recibirás más información.');
}

// ---- SOS ----
function handleSOS(event) {
	event.preventDefault();
	window.open('https://salvavidas.com/blog/a-que-numero-llamar-en-caso-de-emergencia-en-espana-guia-completa-actualizada-2025/', '_blank');
}

window.contactOng = contactOng;
window.toggleFilter = toggleFilter;
window.handleSOS = handleSOS;
