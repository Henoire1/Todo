require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const app = express();
const cors = require('cors');
const fs = require('fs');
const path = require('path');
app.use(bodyParser.json());
app.use(cors());
// Servir le frontend en production: privilégie frontend/dist, sinon Page (compat)
const distPath = path.join(__dirname, '..', 'frontend', 'dist');
const legacyPagePath = path.join(__dirname, '..', 'Page');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
} else if (fs.existsSync(legacyPagePath)) {
  app.use(express.static(legacyPagePath));
}
// Variables d'environnement pour MySQL (compatibles MySQL Workbench)
const MYSQL_HOST = process.env.DB_HOST || "127.0.0.1";
const MYSQL_USER = process.env.DB_USER || "user";
const MYSQL_PASSWORD = process.env.DB_PASSWORD || "123";
const MYSQL_DATABASE = process.env.DB_NAME || "eleve";
const MYSQL_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 4000;
const MYSQL_SOCKET_FROM_ENV = process.env.DB_SOCKET && process.env.DB_SOCKET.trim().length > 0 ? process.env.DB_SOCKET.trim() : undefined;

let pool;
let FILE_STORE = false;
const DATA_FILE = path.join(__dirname, 'data.json');

function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([]), 'utf8');
    }
  } catch (e) {
    console.error('Impossible de préparer le fichier de données:', e);
  }
}

function convertToMySQLDate(dateString) {
  const [month, day, year] = dateString.split('-');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
function loadAllEleves() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.error('Lecture data.json échouée:', e);
    return [];
  }
}

function saveAllEleves(eleves) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(eleves, null, 2), 'utf8');
  } catch (e) {
    console.error('Écriture data.json échouée:', e);
  }
}

// Si le mot de passe est vide (root sans mot de passe), on tente la connexion via socket Unix
// pour supporter les installations MySQL/MariaDB avec auth_socket.
const CANDIDATE_SOCKETS = [
  "/tmp/mysql.sock",
  "/var/run/mysqld/mysqld.sock",
  "/usr/local/var/mysql/mysql.sock",
  "/usr/local/var/run/mysqld/mysqld.sock",
  "/opt/homebrew/var/mysql/mysql.sock",
  "/Applications/MAMP/tmp/mysql/mysql.sock",
  "/Applications/XAMPP/xamppfiles/var/mysql/mysql.sock"
];
const RESOLVED_SOCKET_PATH = MYSQL_SOCKET_FROM_ENV
  || ((!MYSQL_PASSWORD || MYSQL_PASSWORD.length === 0)
    ? CANDIDATE_SOCKETS.find(p => {
        try { return fs.existsSync(p); } catch { return false; }
      })
    : undefined);

// Initialisation: créer la base si absente, puis la table `eleve`
function initializeDatabase(callback) {
  const tryConnect = (configList, idx = 0) => {
    if (idx >= configList.length) {
      const lastErr = new Error('Impossible de se connecter à MySQL via toutes les méthodes testées');
      console.error(lastErr.message);
      // Activer le mode fichier en repli
      FILE_STORE = true;
      ensureDataFile();
      return callback();
    }

    const config = configList[idx];
    const bootstrap = mysql.createConnection(config);
    bootstrap.connect((err) => {
      if (err) {
        // En cas d'échec, essayer la config suivante
        console.warn(`Échec de connexion MySQL (essai ${idx + 1}/${configList.length})`, err.code || err.message);
        bootstrap.destroy();
        return tryConnect(configList, idx + 1);
      }

      console.log("Connecté à MySQL ✅");
      const proceedWithPool = () => {
        bootstrap.end();

        pool = mysql.createPool({
          ...config,
          database: MYSQL_DATABASE,
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });

        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS eleve (
            nom VARCHAR(255) PRIMARY KEY,
            prenom CHAR(30) NOT NULL,
            date_naissance DATE NOT NULL,
            note1 DECIMAL(5,2) NOT NULL,
            note2 DECIMAL(5,2) NOT NULL
          )`;

        pool.query(createTableQuery, (tableErr) => {
          if (tableErr) {
            if (tableErr && tableErr.code === 'ER_BAD_DB_ERROR') {
              console.warn("Base inexistante, bascule en mode fichier.");
              FILE_STORE = true;
              ensureDataFile();
              // Désactiver la pool pour éviter les checks DB dans /health
              try { if (pool && typeof pool.end === 'function') pool.end(); } catch {}
              pool = undefined;
              return callback();
            }
            console.error("Erreur lors de la création de la table:", tableErr);
            return callback(tableErr);
          }
          console.log("Table eleve prête ✅");
          callback();
        });
      };

      bootstrap.query(`CREATE DATABASE IF NOT EXISTS \`${MYSQL_DATABASE}\`` , (createDbErr) => {
        if (createDbErr) {
          // Si l'utilisateur n'a pas le droit de créer la base, on tente quand même la suite
          if (createDbErr.code === 'ER_DBACCESS_DENIED_ERROR' || createDbErr.code === 'ER_ACCESS_DENIED_ERROR') {
            console.warn('Pas de droit CREATE DATABASE, tentative de connexion directe à la base existante…');
            return proceedWithPool();
          }
          console.error("Erreur lors de la création de la base:", createDbErr);
          bootstrap.end();
          return callback(createDbErr);
        }
        proceedWithPool();
      });
    });
  };

  const baseTcpConfig = {
    host: MYSQL_HOST,
    user: MYSQL_USER,
    password: MYSQL_PASSWORD,
    port: MYSQL_PORT
  };

  const socketCandidates = [RESOLVED_SOCKET_PATH, ...CANDIDATE_SOCKETS]
    .filter(Boolean)
    .map(socketPath => ({ user: MYSQL_USER, password: MYSQL_PASSWORD, socketPath }));

  // Ordre d’essai: 1) TCP normal, 2) sockets Unix (si password vide ou config explicite)
  const configs = [baseTcpConfig, ...socketCandidates];
  tryConnect(configs);
}

// Routes
// Vérification de santé
app.get('/health', async (req, res) => {
  try {
    if (!pool && FILE_STORE) {
      return res.json({ ok: true, db: 'file' });
    }
    if (!pool) {
      return res.status(503).json({ ok: false, db: 'not_initialized' });
    }
    pool.query('SELECT 1 AS ok', (err) => {
      if (err) return res.status(500).json({ ok: false, db: 'error', error: err.message });
      res.json({ ok: true, db: 'up' });
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});
// GET /eleve - Récupérer tous les élèves
app.get("/eleve", (req, res) => {
  if (!pool && FILE_STORE) {
    return res.json(loadAllEleves());
  }
  pool.query("SELECT * FROM eleve", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// POST /eleve - Ajouter un nouvel élève
app.post("/eleve", (req, res) => {
  const { nom, prenom, date_naissance, note1, note2 } = req.body;
  if (!nom || !prenom || !date_naissance || note1 === undefined || note2 === undefined) {
    return res.status(400).json({ error: "Champs requis: nom, prenom, date_naissance, note1, note2" });
  }
  if (typeof nom !== 'string' || typeof prenom !== 'string') {
    return res.status(400).json({ error: 'Types invalides pour nom/prenom' });
  }
  if (isNaN(Number(note1)) || isNaN(Number(note2))) {
    return res.status(400).json({ error: 'note1/note2 doivent être numériques' });
  }
  const n1 = Number(note1);
  const n2 = Number(note2);
  if (n1 < 0 || n1 > 20 || n2 < 0 || n2 > 20) {
    return res.status(400).json({ error: 'Les notes doivent être entre 0 et 20' });
  }

  const insertQuery = "INSERT INTO eleve (nom, prenom, date_naissance, note1, note2) VALUES (?, ?, ?, ?, ?)";
  if (!pool && FILE_STORE) {
    const eleves = loadAllEleves();
    if (eleves.some(e => e.nom === nom)) {
      return res.status(409).json({ error: 'Élève déjà existant' });
    }
    eleves.push({ nom, prenom, date_naissance, note1: n1, note2: n2 });
    saveAllEleves(eleves);
    return res.status(201).json({ nom, prenom, date_naissance, note1, note2 });
  }
  pool.query(insertQuery, [nom, prenom, date_naissance, n1, n2], (err) => {
    if (err) {
      if (err && err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Élève déjà existant' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ nom, prenom, date_naissance, note1, note2 });
  });
});

// PUT /eleve/:id - Mettre à jour un élève (id = nom actuel)
app.put("/eleve/:id", (req, res) => {
  const { id } = req.params; // nom actuel
  const { nom, prenom, date_naissance, note1, note2 } = req.body;
  if (!prenom || !date_naissance || note1 === undefined || note2 === undefined) {
    return res.status(400).json({ error: "Champs requis: prenom, date_naissance, note1, note2" });
  }
  if (typeof (nom || id) !== 'string' || typeof prenom !== 'string') {
    return res.status(400).json({ error: 'Types invalides pour nom/prenom' });
  }
  if (isNaN(Number(note1)) || isNaN(Number(note2))) {
    return res.status(400).json({ error: 'note1/note2 doivent être numériques' });
  }
  const n1u = Number(note1);
  const n2u = Number(note2);
  if (n1u < 0 || n1u > 20 || n2u < 0 || n2u > 20) {
    return res.status(400).json({ error: 'Les notes doivent être entre 0 et 20' });
  }

  const updateQuery = "UPDATE eleve SET nom = ?, prenom = ?, date_naissance = ?, note1 = ?, note2 = ? WHERE nom = ?";
  if (!pool && FILE_STORE) {
    const eleves = loadAllEleves();
    const idx = eleves.findIndex(e => e.nom === id);
    if (idx === -1) return res.status(404).json({ error: "Élève non trouvé" });
    const nextNom = nom || id;
    eleves[idx] = { nom: nextNom, prenom, date_naissance, note1: n1u, note2: n2u };
    saveAllEleves(eleves);
    return res.json(eleves[idx]);
  }
  pool.query(updateQuery, [nom || id, prenom, date_naissance, n1u, n2u, id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Élève non trouvé" });
    }
    res.json({ nom: nom || id, prenom, date_naissance, note1, note2 });
  });
});

// DELETE /eleve/:id - Supprimer un élève (id = nom)
app.delete("/eleve/:id", (req, res) => {
  const { id } = req.params; // nom

  if (!pool && FILE_STORE) {
    const eleves = loadAllEleves();
    const next = eleves.filter(e => e.nom !== id);
    if (next.length === eleves.length) {
      return res.status(404).json({ error: "Élève non trouvé" });
    }
    saveAllEleves(next);
    return res.json({ message: `Élève ${id} supprimé` });
  }
  pool.query("DELETE FROM eleve WHERE nom = ?", [id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Élève non trouvé" });
    }
    res.json({ message: `Élève ${id} supprimé` });
  });
});

// 404 pour les autres routes API
app.use((req, res, next) => {
  if (req.path.startsWith('/eleve') || req.path.startsWith('/health')) {
    return res.status(404).json({ error: 'Route introuvable' });
  }
  next();
});

// Gestionnaire d’erreurs générique
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});
const dateNaissance = convertToMySQLDate('12-23-2003')
// Démarrage du serveur après initialisation DB
const PORT = process.env.PORT || 4000;
initializeDatabase((initErr) => {
  // En mode fichier, on continue même si MySQL est KO
  app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
    if (FILE_STORE) {
      console.log('Mode stockage fichier activé (data.json).');
    }
  });
});
