// URL de ton Google Sheet transformée pour l'export CSV automatique (Dinos)
const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1NQQD7SRU2JyYL2i_Y4hurFaZ6C6ADuOaLn_8cCVEwq4/export?format=csv&gid=0';

// URL de ta feuille Google Sheet pour les Patchs (Feuille "liste_patchs" avec le bon gid)
const PATCHS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1NQQD7SRU2JyYL2i_Y4hurFaZ6C6ADuOaLn_8cCVEwq4/export?format=csv&gid=787364891';

let dinosDatabase = {}; // Stockera les dinos récupérés du Google Sheet

function switchTab(targetId) {
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => link.classList.remove('active'));

    const targetContent = document.getElementById(targetId);
    if (targetContent) {
        targetContent.classList.add('active');
    }

    const targetLink = document.querySelector(`.nav-link[data-target="${targetId}"]`);
    if (targetLink) {
        targetLink.classList.add('active');
    }
}

// Fonction pour charger les données du Google Sheet (Dinos)
async function loadDinosFromGoogleSheet() {
    try {
        const response = await fetch(SHEET_CSV_URL);
        const data = await response.text();
        
        parseCSV(data);
    } catch (error) {
        console.error("Erreur lors du chargement du Google Sheet :", error);
        const gridContainer = document.getElementById('dinos-grid-container');
        if (gridContainer) {
            gridContainer.innerHTML = '<p style="color: #f85149;">Impossible de charger les dinosaures depuis le Google Sheet.</p>';
        }
    }
}

// Fonction pour découper le CSV et remplir la grille
function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const gridContainer = document.getElementById('dinos-grid-container');
    if (!gridContainer) return;
    gridContainer.innerHTML = ''; // Nettoyer avant d'injecter

    dinosDatabase = {}; // Réinitialiser

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const row = parseCSVRow(line);
        if (row.length < 7) continue;

        const [id_dino, nom_dino, lore_dino, regime_dino, espece_dino, image_dino, competence_dino] = row;

        dinosDatabase[id_dino] = {
            id: id_dino,
            name: nom_dino,
            lore: lore_dino,
            regime: regime_dino,
            espece: espece_dino,
            imageDino: image_dino,
            imageCompetence: competence_dino
        };

        const card = document.createElement('div');
        card.className = 'dino-card';
        card.onclick = () => openDinoDetail(id_dino);
        
        card.innerHTML = `
            <div class="dino-img-container">
                <img src="${image_dino}" alt="${nom_dino}" onerror="this.onerror=null; this.src=''; this.parentNode.innerHTML='[ Image indisponible ]';">
            </div>
            <div class="dino-info">
                <h3>${nom_dino}</h3>
                <p class="dino-lore"><em>${espece_dino} • ${regime_dino}</em></p>
            </div>
        `;
        gridContainer.appendChild(card);
    }
}

// Utilitaire pour parser proprement une ligne CSV avec des guillemets
function parseCSVRow(text) {
    let result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        let char = text[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

// Ouvrir la vue détaillée d'un dino selon ton croquis
function openDinoDetail(dinoKey) {
    const dino = dinosDatabase[dinoKey];
    if (!dino) return;

    document.getElementById('dinos-list-view').style.display = 'none';
    const detailView = document.getElementById('dino-detail-view');
    detailView.style.display = 'block';

    // Gestion intelligente du régime : si ce sont des liens d'images, on les affiche en balises img
    let regimeContent = dino.regime;
    if (regimeContent.includes('http')) {
        regimeContent = regimeContent.split(',').map(url => `<img src="${url.trim()}" alt="Régime" style="height: 50px; vertical-align: middle; margin-right: 4px;">`).join(' ');
    }

    document.getElementById('dino-detail-content').innerHTML = `
        <div class="dino-detail-container">
            <div class="dino-header-bar">
                <h2>${dino.name}</h2>
                <div class="dino-badges">
                    <span class="badge">${dino.espece}</span>
                    <span class="badge">${regimeContent}</span>
                </div>
            </div>

            <div class="dino-main-content-grid">
                <div class="dino-big-img-box">
                    <img src="${dino.imageDino}" alt="${dino.name}" onerror="this.onerror=null; this.parentNode.innerHTML='[ Image Dino Introuvable ]';">
                </div>
                <div class="dino-lore-box">
                    <h3>Histoire & Lore</h3>
                    <p>${dino.lore}</p>
                </div>
            </div>

            <div class="dino-skills-full-banner">
                <h3>Compétences & Build</h3>
                <div class="skills-img-box">
                    <img src="${dino.imageCompetence}" alt="Compétences de ${dino.name}" onerror="this.onerror=null; this.parentNode.innerHTML='[ Image Compétences Introuvable ]';">
                </div>
            </div>
        </div>
    `;
}

function backToDinosList() {
    document.getElementById('dino-detail-view').style.display = 'none';
    document.getElementById('dinos-list-view').style.display = 'block';
}

// --- Gestion des Commentaires de la Communauté ---
function loadComments() {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;
    
    const savedComments = JSON.parse(localStorage.getItem('pot_comments')) || [];
    
    commentsList.innerHTML = '';
    if (savedComments.length === 0) {
        commentsList.innerHTML = '<p style="color: #8b949e; margin-top: 1rem;">Aucun commentaire pour le moment. Sois le premier à t\'exprimer !</p>';
        return;
    }

    savedComments.forEach(c => {
        const commentCard = document.createElement('div');
        commentCard.className = 'comment-card';
        commentCard.innerHTML = `
            <div class="comment-header">
                <strong>${escapeHtml(c.author)}</strong>
                <span class="comment-date">${c.date}</span>
            </div>
            <p class="comment-body">${escapeHtml(c.text)}</p>
        `;
        commentsList.appendChild(commentCard);
    });
}

function addComment(event) {
    event.preventDefault();
    const authorField = document.getElementById('comment-author');
    const textField = document.getElementById('comment-text');
    
    if (!authorField || !textField) return;

    const author = authorField.value;
    const text = textField.value;
    const date = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

    const newComment = { author, text, date };
    const savedComments = JSON.parse(localStorage.getItem('pot_comments')) || [];
    
    savedComments.unshift(newComment);
    localStorage.setItem('pot_comments', JSON.stringify(savedComments));

    document.getElementById('comment-form').reset();
    loadComments();
}

function escapeHtml(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- Gestion des Cartes Interactives (Maps) ---
function switchMap(mapId, mapUrl, buttonElement) {
    const mapButtons = document.querySelectorAll('.map-btn');
    mapButtons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('secondary');
    });
    buttonElement.classList.add('active');
    buttonElement.classList.remove('secondary');

    const container = document.getElementById('map-display-container');
    if (mapUrl && mapUrl.trim() !== '') {
        container.innerHTML = `<iframe src="${mapUrl}" title="Path of Titans Map ${mapId}" class="map-iframe" id="active-map-iframe"></iframe>`;
    } else {
        container.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #8b949e; text-align: center; padding: 2rem;">
                <h3 style="color: #ffffff; margin-bottom: 0.5rem;">Carte de ${mapId.charAt(0).toUpperCase() + mapId.slice(1)} en cours de préparation</h3>
                <p>Cette carte interactive sera disponible prochainement !</p>
            </div>
        `;
    }
}

// --- Chargement des Mises à Jour (Patchs & Vidéos YouTube) ---
async function loadPatchsFromGoogleSheet() {
    const container = document.getElementById('patchs-grid-container');
    if (!container) return;

    try {
        const response = await fetch(PATCHS_CSV_URL);
        const data = await response.text();
        
        // Utilisation du parseur intelligent pour gérer les retours à la ligne des cellules Google Sheets
        const rows = parseCSVLines(data);
        
        container.innerHTML = '';
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 4) continue;

            const titre_patch = row[1] || '';
            const date_patch = row[2] || '';
            const description_patch = row[3] || '';
            const youtube_url = row[4] || '';

            let embedUrl = '';
            if (youtube_url && youtube_url.includes('http')) {
                if (youtube_url.includes('watch?v=')) {
                    embedUrl = youtube_url.replace('watch?v=', 'embed/').split('&')[0];
                } else if (youtube_url.includes('youtu.be/')) {
                    const videoId = youtube_url.split('youtu.be/')[1].split('?')[0];
                    embedUrl = `https://www.youtube.com/embed/${videoId}`;
                } else {
                    embedUrl = youtube_url;
                }
            }

            const patchCard = document.createElement('div');
            patchCard.className = 'patch-card';
            patchCard.innerHTML = `
                <div class="patch-header">
                    <h3>${titre_patch}</h3>
                    <span class="patch-date">${date_patch}</span>
                </div>
                ${description_patch ? `<div class="patch-desc">${description_patch}</div>` : ''}
                ${embedUrl ? `
                    <div class="patch-video-container">
                        <iframe src="${embedUrl}" title="${titre_patch}" allowfullscreen class="patch-iframe"></iframe>
                    </div>
                ` : ''}
            `;
            container.appendChild(patchCard);
        }
    } catch (error) {
        console.error("Erreur chargement patchs :", error);
        container.innerHTML = '<p style="color: #f85149;">Impossible de charger les mises à jour depuis le Google Sheet.</p>';
    }
}

// Parseur CSV intelligent pour les cellules multilignes de Google Sheets
function parseCSVLines(text) {
    let lines = [];
    let row = [''];
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
        let c = text[i];
        let nextC = text[i + 1];
        
        if (c === '"') {
            if (inQuotes && nextC === '"') {
                row[row.length - 1] += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (c === ',' && !inQuotes) {
            row.push('');
        } else if ((c === '\r' && nextC === '\n' && !inQuotes) || (c === '\n' && !inQuotes)) {
            if (c === '\r') i++;
            lines.push(row);
            row = [''];
        } else {
            row[row.length - 1] += c;
        }
    }
    if (row.length > 1 || row[0] !== '') {
        lines.push(row);
    }
    return lines;
}

// Initialisation globale au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    switchTab('accueil');
    loadDinosFromGoogleSheet();
    loadPatchsFromGoogleSheet();
    loadComments();

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = link.getAttribute('data-target');
            if (target) {
                switchTab(target);
            }
        });
    });
});