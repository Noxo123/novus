import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const features = [
  ['🧠', 'Communauté first', 'Les joueurs proposent, développent et font évoluer l’univers.'],
  ['🤖', 'Analyse automatisée', 'Chaque contribution passe par des contrôles de sécurité et de qualité.'],
  ['🧪', 'Staging', 'Rien n’arrive directement en production : on teste avant de publier.'],
  ['🌙', '21h30 Release', 'Un rendez-vous quotidien pour découvrir les nouveautés validées.'],
];

const checks = [
  ['Malware & secrets', '🟢', 'Aucun indicateur critique détecté'],
  ['Réseau & fichiers', '🟢', 'Accès sensibles vérifiés'],
  ['Performance', '🟡', 'Review humaine recommandée'],
  ['Tests', '🟢', 'Pipeline terminé avec succès'],
];

function App() {
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [menu, setMenu] = useState(false);

  return (
    <div className="app">
      <header className="nav">
        <a className="brand" href="#top"><span className="brand-mark">N</span> NOVUS</a>
        <nav className={menu ? 'nav-links open' : 'nav-links'}>
          <a href="#vision">Le concept</a>
          <a href="#security">Sécurité</a>
          <a href="#upload">Contribuer</a>
          <a href="#release">Releases</a>
        </nav>
        <a className="github" href="https://github.com/Noxo123/novus" target="_blank" rel="noreferrer">GitHub ↗</a>
        <button className="menu" onClick={() => setMenu(!menu)} aria-label="Menu">☰</button>
      </header>

      <main id="top">
        <section className="hero">
          <div className="orb orb-a" /><div className="orb orb-b" />
          <div className="eyebrow"><span className="pulse" /> COMMUNITY-DRIVEN MINECRAFT</div>
          <h1>Ton serveur.<br /><em>Notre univers.</em></h1>
          <p className="hero-copy">NOVUS est un serveur Minecraft construit avec sa communauté. Propose une idée, construis-la, fais-la tester — et vois-la peut-être arriver en jeu à 21h30.</p>
          <div className="hero-actions">
            <a className="button primary" href="#upload">Proposer une contribution <span>→</span></a>
            <a className="button ghost" href="https://github.com/Noxo123/novus" target="_blank" rel="noreferrer">Voir le GitHub</a>
          </div>
          <div className="hero-status"><span>●</span> Pipeline communautaire opérationnel <b>·</b> Prochaine release <strong>21:30</strong></div>
        </section>

        <section id="vision" className="section">
          <div className="section-head"><span>01 / PHILOSOPHIE</span><h2>Construire <em>ensemble.</em></h2></div>
          <div className="feature-grid">{features.map(([icon,title,text]) => <article className="feature" key={title}><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></article>)}</div>
        </section>

        <section id="security" className="security-section">
          <div className="section-head"><span>02 / TRUST LAYER</span><h2>Chaque contribution<br /><em>est inspectée.</em></h2></div>
          <div className="security-layout">
            <div className="security-copy"><p>Un fichier communautaire n’est jamais exécuté directement sur la production. Il est isolé, analysé et testé avant toute décision.</p><div className="flow"><div>UPLOAD</div><b>→</b><div>QUARANTAINE</div><b>→</b><div>ANALYSE</div><b>→</b><div>STAGING</div></div><p className="muted">L’analyse automatisée assiste la décision. La validation humaine reste obligatoire.</p></div>
            <div className="scan-card"><div className="scan-top"><span>🤖 NOVUS SCAN</span><span className="scan-id">SCAN #004281</span></div>{checks.map(([name,status,desc]) => <div className="check" key={name}><div><strong>{name}</strong><small>{desc}</small></div><span>{status}</span></div>)}<div className="verdict"><span>VERDICT</span><strong>🟡 REVIEW REQUIRED</strong></div></div>
          </div>
        </section>

        <section id="upload" className="section upload-section">
          <div className="section-head"><span>03 / CONTRIBUER</span><h2>Une idée ?<br /><em>Envoie-la.</em></h2></div>
          <div className="upload-card">
            {!submitted ? <>
              <div className="dropzone" onClick={() => document.getElementById('file').click()} onDragOver={e => e.preventDefault()} onDrop={e => {e.preventDefault(); setFile(e.dataTransfer.files[0])}}>
                <input id="file" type="file" accept=".jar,.zip" hidden onChange={e => setFile(e.target.files[0])} />
                <div className="upload-icon">↑</div><h3>{file ? file.name : 'Dépose ton plugin ici'}</h3><p>{file ? `${(file.size/1024/1024).toFixed(2)} MB · prêt pour l’analyse` : 'ou clique pour sélectionner un .jar ou .zip'}</p>
              </div>
              <div className="upload-bottom"><div><strong>Avant 17h30</strong><span>pour la release du jour</span></div><button className="button primary" disabled={!file} onClick={() => setSubmitted(true)}>Lancer l’analyse <span>→</span></button></div>
            </> : <div className="submitted"><div className="success">✓</div><h3>Contribution reçue.</h3><p><strong>{file?.name}</strong> est prête pour la pipeline de validation.</p><div className="progress"><span /></div><small>Quarantaine → Analyse → Tests → Review humaine</small></div>}
          </div>
        </section>

        <section id="release" className="release-section"><div className="release-time">21<span>:30</span></div><div><span className="eyebrow">EVERY DAY / RELEASE WINDOW</span><h2>Le serveur évolue<br /><em>avec vous.</em></h2><p>Deux changements de production maximum par jour au lancement. Les fonctionnalités expérimentales sont observées pendant environ deux semaines avant leur maintien ou leur archivage.</p></div></section>
      </main>

      <footer><div className="brand"><span className="brand-mark">N</span> NOVUS</div><span>Built with the community · 2026</span><a href="https://github.com/Noxo123/novus" target="_blank" rel="noreferrer">Open source ↗</a></footer>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
