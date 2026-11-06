/* veille.js : affiche automatiquement la veille technologique sur le portfolio.
   Lit les fichiers veille/AAAA-MM-JJ.json publiés chaque jour par le workflow n8n. */
(function () {
  'use strict';

  // ---------- Réglages ----------
  var DOSSIER = 'veille';        // dossier des fichiers JSON (relatif à index.html)
  var JOURS_RECHERCHE = 14;      // nombre de jours cherchés en arrière
  var JOURS_VISIBLES = 5;        // jours affichés au départ

  var section = document.getElementById('veille');
  if (!section) return;

  // ---------- Style (utilise les couleurs du portfolio) ----------
  var style = document.createElement('style');
  style.textContent = [
    '.veille-feed{margin-top:50px}',
    '.veille-feed-title{color:var(--text-color);font-size:1.2rem;margin-bottom:10px;text-transform:uppercase}',
    '.veille-pipeline{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0 15px;font-size:.8rem;color:var(--text-muted)}',
    '.veille-step{border:1px solid rgba(0,180,216,.3);padding:3px 8px;border-radius:3px;background:var(--bg-card)}',
    '.veille-arrow{color:var(--secondary-color)}',
    '.veille-note{font-size:.8rem;color:var(--text-muted);border-left:3px solid var(--secondary-color);padding:8px 12px;margin-bottom:20px;background:rgba(247,127,0,.05)}',
    '.veille-day{background:var(--bg-card);border:1px solid rgba(0,180,216,.2);border-radius:5px;padding:20px;margin-bottom:15px}',
    '.veille-day-date{color:var(--primary-color);font-size:.9rem;text-transform:uppercase;margin-bottom:12px;border-bottom:1px solid rgba(0,180,216,.2);padding-bottom:8px}',
    '.veille-entry{padding:10px 0;border-bottom:1px dashed rgba(255,255,255,.08)}',
    '.veille-entry:last-child{border-bottom:none}',
    '.veille-entry-source{color:var(--secondary-color);font-size:.75rem}',
    '.veille-entry-title{display:block;color:var(--text-color);font-weight:600;text-decoration:none;margin:2px 0}',
    '.veille-entry-title:hover{color:var(--primary-color)}',
    '.veille-entry-resume{color:var(--text-muted);font-size:.88rem}',
    '.veille-more{display:block;margin:10px auto 0;background:transparent;color:var(--primary-color);border:1px solid var(--primary-color);border-radius:3px;padding:10px 18px;font-family:var(--font-main);font-size:.85rem;cursor:pointer;text-transform:uppercase}',
    '.veille-more:hover{background:var(--primary-color);color:#000}',
    '.veille-status{color:var(--text-muted);font-size:.85rem}'
  ].join('\n');
  document.head.appendChild(style);

  // ---------- Structure ----------
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  var bloc = el('div', 'veille-feed');
  bloc.setAttribute('aria-live', 'polite');
  bloc.appendChild(el('h3', 'veille-feed-title', '>_ Dernières publications suivies'));

  var pipeline = el('div', 'veille-pipeline');
  ['Flux RSS', 'n8n', 'IA locale (Ollama)', 'GitHub Pages'].forEach(function (t, i) {
    if (i > 0) pipeline.appendChild(el('span', 'veille-arrow', '\u2192'));
    pipeline.appendChild(el('span', 'veille-step', t));
  });
  bloc.appendChild(pipeline);

  var note = el('p', 'veille-note', 'Chargement de la veille...');
  bloc.appendChild(note);
  var liste = el('div', 'veille-list');
  bloc.appendChild(liste);
  section.appendChild(bloc);

  // ---------- Outils ----------
  function ymd(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var j = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + j;
  }
  function texte(v, max) { return String(v == null ? '' : v).slice(0, max); }
  function lienSur(u) {
    try {
      var url = new URL(u);
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : null;
    } catch (e) { return null; }
  }
  function dateLongue(iso) {
    var p = iso.split('-');
    var d = new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]), 12);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function charger(jour) {
    return fetch(DOSSIER + '/' + jour + '.json', { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; })
      .then(function (d) {
        var valide = d && typeof d.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d.date) && Array.isArray(d.articles);
        return valide ? d : null;
      });
  }

  // ---------- Affichage d'un jour ----------
  function carteJour(jour) {
    var carte = el('article', 'veille-day');
    carte.appendChild(el('div', 'veille-day-date', dateLongue(jour.date)));
    jour.articles.slice(0, 30).forEach(function (a) {
      var ligne = el('div', 'veille-entry');
      ligne.appendChild(el('span', 'veille-entry-source', '[' + texte(a.source, 60) + ']'));
      var titre = texte(a.titre, 200) || texte(a.resume, 80);
      var href = lienSur(a.lien);
      var t;
      if (href) {
        t = el('a', 'veille-entry-title', titre);
        t.href = href;
        t.target = '_blank';
        t.rel = 'noopener noreferrer';
      } else {
        t = el('span', 'veille-entry-title', titre);
      }
      ligne.appendChild(t);
      ligne.appendChild(el('span', 'veille-entry-resume', texte(a.resume, 400)));
      carte.appendChild(ligne);
    });
    return carte;
  }

  // ---------- Chargement ----------
  var aujourdhui = new Date();
  var jours = [];
  for (var i = -1; i < JOURS_RECHERCHE - 1; i++) {      // -1 = demain (décalage de fuseau possible)
    jours.push(ymd(new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate() - i, 12)));
  }

  Promise.all(jours.map(charger)).then(function (res) {
    var trouves = res.filter(Boolean).sort(function (a, b) { return a.date < b.date ? 1 : -1; });

    if (trouves.length === 0) {
      note.textContent = "Aucune publication disponible pour le moment. Les résumés apparaissent ici chaque jour.";
      return;
    }

    var recent = trouves[0];
    var modele = texte(recent.modele, 40);
    note.textContent = 'Résumés générés automatiquement par une IA exécutée en local' +
      (modele ? ' (' + modele + ')' : '') +
      ' à partir de flux RSS. Ils peuvent comporter des erreurs : consulter les sources. Dernière mise à jour : ' +
      dateLongue(recent.date) + '.';

    trouves.forEach(function (j, index) {
      var c = carteJour(j);
      if (index >= JOURS_VISIBLES) c.hidden = true;
      liste.appendChild(c);
    });

    if (trouves.length > JOURS_VISIBLES) {
      var bouton = el('button', 'veille-more', 'Afficher les jours précédents');
      bouton.type = 'button';
      bouton.addEventListener('click', function () {
        liste.querySelectorAll('.veille-day[hidden]').forEach(function (c) { c.hidden = false; });
        bouton.remove();
      });
      bloc.appendChild(bouton);
    }
  });
})();
