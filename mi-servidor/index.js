const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const crypto = require('node:crypto');
const QRCode = require('qrcode');
const { generateSecret, generateURI, verifySync } = require('otplib');
const pool = require('./db'); // Importamos la conexión
const app = express();
const serverPort = Number(process.env.PORT || 3000);
const adminEmail = String(process.env.ADMIN_EMAIL || 'admin@aegis.com').trim().toLowerCase();
let databaseAvailable = false;
let inMemoryUserId = 1;
const inMemoryUsers = [];
const wikiSseClients = new Set();
const watchedTables = ['armas', 'armaduras', 'hechizos', 'milagros', 'clases', 'talismanes', 'personajes', 'builds'];
let lastWikiSignatures = null;
const mfaLoginChallenges = new Map();

const allowedOrigins = [
  'http://localhost:4200',
  'http://127.0.0.1:4200',
  ...String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origen no permitido por CORS'));
  }
};

app.use(cors(corsOptions));
app.use(express.json());

async function initDatabase() {
  console.log('Iniciando base de datos...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(80) NOT NULL,
        email VARCHAR(120) UNIQUE NOT NULL,
        role VARCHAR(16) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
        password_hash TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    await pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user'
    `);

    await pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS mfa_secret TEXT
    `);

    await pool.query(`
      ALTER TABLE usuarios
      ADD COLUMN IF NOT EXISTS mfa_temp_secret TEXT
    `);

    await pool.query(`
      UPDATE usuarios
      SET role = CASE
        WHEN LOWER(email) = $1 THEN 'admin'
        ELSE 'user'
      END
      WHERE role IS NULL OR role NOT IN ('admin', 'user')
    `, [adminEmail]);

    console.log('Tabla usuarios verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tipos_arma (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(60) NOT NULL UNIQUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla tipos_arma verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS armas (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        tipo_id INT REFERENCES tipos_arma(id) ON DELETE SET NULL,
        rareza SMALLINT NOT NULL DEFAULT 1 CHECK (rareza BETWEEN 1 AND 5),
        peso NUMERIC(5,2) NOT NULL DEFAULT 0,
        escalado VARCHAR(40),
        descripcion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla armas verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS clases (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(60) NOT NULL UNIQUE,
        enfoque VARCHAR(80) NOT NULL,
        vigor SMALLINT NOT NULL DEFAULT 10,
        mente SMALLINT NOT NULL DEFAULT 10,
        resistencia SMALLINT NOT NULL DEFAULT 10,
        fuerza SMALLINT NOT NULL DEFAULT 10,
        destreza SMALLINT NOT NULL DEFAULT 10,
        inteligencia SMALLINT NOT NULL DEFAULT 10,
        fe SMALLINT NOT NULL DEFAULT 10,
        arcano SMALLINT NOT NULL DEFAULT 10,
        descripcion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla clases verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS armaduras (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        categoria VARCHAR(50) NOT NULL,
        peso NUMERIC(5,2) NOT NULL DEFAULT 0,
        defensa_fisica NUMERIC(6,2) NOT NULL DEFAULT 0,
        defensa_magica NUMERIC(6,2) NOT NULL DEFAULT 0,
        descripcion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla armaduras verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hechizos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        costo_fp SMALLINT NOT NULL DEFAULT 0,
        requisitos VARCHAR(120),
        descripcion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla hechizos verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS milagros (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        costo_fp SMALLINT NOT NULL DEFAULT 0,
        requisitos VARCHAR(120),
        descripcion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla milagros verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS talismanes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        efecto TEXT NOT NULL,
        ubicacion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla talismanes verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS personajes (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        faccion VARCHAR(120),
        zona VARCHAR(120),
        descripcion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla personajes verificada');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS builds (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(120) NOT NULL UNIQUE,
        enfoque VARCHAR(80) NOT NULL,
        nivel_recomendado VARCHAR(40),
        distribucion_puntos VARCHAR(180),
        descripcion TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    console.log('Tabla builds verificada');

    await pool.query(`
      ALTER TABLE builds
      ADD COLUMN IF NOT EXISTS nivel_recomendado VARCHAR(40)
    `);

    await pool.query(`
      ALTER TABLE builds
      ADD COLUMN IF NOT EXISTS distribucion_puntos VARCHAR(180)
    `);

    databaseAvailable = true;
    console.log('✅ Base de datos iniciada correctamente');
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    databaseAvailable = false;
  }
}

function isValidEmail(email) {
  return /^\S+@\S+\.\S+$/.test(email);
}

function buildSessionUser(user) {
  return {
    id: user.id,
    nombre: user.nombre,
    email: user.email,
    role: user.role,
    mfaEnabled: Boolean(user.mfa_enabled)
  };
}

function createMfaChallenge(userId) {
  const token = crypto.randomBytes(24).toString('hex');
  const expiresAt = Date.now() + (2 * 60 * 1000);
  mfaLoginChallenges.set(token, { userId, expiresAt });
  return token;
}

function readMfaChallenge(token) {
  const challenge = mfaLoginChallenges.get(token);
  if (!challenge) {
    return null;
  }

  if (Date.now() > challenge.expiresAt) {
    mfaLoginChallenges.delete(token);
    return null;
  }

  return challenge;
}

setInterval(() => {
  const now = Date.now();
  for (const [token, challenge] of mfaLoginChallenges.entries()) {
    if (now > challenge.expiresAt) {
      mfaLoginChallenges.delete(token);
    }
  }
}, 30 * 1000);

function broadcastWikiUpdate(payload) {
  const message = `data: ${JSON.stringify(payload)}\n\n`;
  for (const client of wikiSseClients) {
    client.write(message);
  }
}

async function getTableSignature(tableName) {
  const result = await pool.query(
    `
      SELECT COALESCE(md5(string_agg(row_text, '|' ORDER BY row_text)), '') AS signature
      FROM (
        SELECT row_to_json(t)::text AS row_text
        FROM ${tableName} t
      ) rows
    `
  );

  return result.rows[0]?.signature ?? '';
}

async function computeWikiSignatures() {
  if (!databaseAvailable) {
    return null;
  }

  const signatures = {};
  for (const tableName of watchedTables) {
    signatures[tableName] = await getTableSignature(tableName);
  }

  return signatures;
}

function getChangedTables(previousSignatures, currentSignatures) {
  const changed = [];
  for (const tableName of watchedTables) {
    if (previousSignatures[tableName] !== currentSignatures[tableName]) {
      changed.push(tableName);
    }
  }
  return changed;
}

function startWikiWatcher() {
  let running = false;

  setInterval(async () => {
    if (running || !databaseAvailable) {
      return;
    }

    running = true;
    try {
      const currentSignatures = await computeWikiSignatures();
      if (!currentSignatures) {
        return;
      }

      if (!lastWikiSignatures) {
        lastWikiSignatures = currentSignatures;
        return;
      }

      const changedTables = getChangedTables(lastWikiSignatures, currentSignatures);
      if (changedTables.length > 0) {
        lastWikiSignatures = currentSignatures;
        broadcastWikiUpdate({
          type: 'wiki-update',
          timestamp: new Date().toISOString(),
          tables: changedTables
        });
      }
    } catch (error) {
      console.error('Error detectando cambios en la wiki:', error.message);
    } finally {
      running = false;
    }
  }, 3000);

  setInterval(() => {
    broadcastWikiUpdate({
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    });
  }, 25000);
}

app.get('/events/wiki', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  wikiSseClients.add(res);
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  req.on('close', () => {
    wikiSseClients.delete(res);
  });
});

app.post('/auth/register', async (req, res) => {
  const { nombre, email, password } = req.body ?? {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Nombre, correo y contraseña son obligatorios.' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'Correo electrónico no válido.' });
  }

  if (String(password).length < 6) {
    return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    const role = normalizedEmail === adminEmail ? 'admin' : 'user';
    const passwordHash = await bcrypt.hash(String(password), 10);

    if (databaseAvailable) {
      const existing = await pool.query('SELECT id FROM usuarios WHERE email = $1', [normalizedEmail]);
      if (existing.rowCount > 0) {
        return res.status(409).json({ message: 'El correo ya está registrado.' });
      }

      const result = await pool.query(
        'INSERT INTO usuarios (nombre, email, role, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, nombre, email, role, mfa_enabled',
        [String(nombre).trim(), normalizedEmail, role, passwordHash]
      );

      return res.status(201).json({
        message: 'Registro completado.',
        user: buildSessionUser(result.rows[0])
      });
    }

    const existingMemoryUser = inMemoryUsers.find((user) => user.email === normalizedEmail);
    if (existingMemoryUser) {
      return res.status(409).json({ message: 'El correo ya está registrado.' });
    }

    const newUser = {
      id: inMemoryUserId++,
      nombre: String(nombre).trim(),
      email: normalizedEmail,
      role,
      passwordHash,
      mfa_enabled: false,
      mfa_secret: null,
      mfa_temp_secret: null
    };
    inMemoryUsers.push(newUser);

    return res.status(201).json({
      message: 'Registro completado (modo local).',
      user: {
        id: newUser.id,
        nombre: newUser.nombre,
        email: newUser.email,
        role: newUser.role,
        mfaEnabled: false
      }
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son obligatorios.' });
  }

  try {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (databaseAvailable) {
      const result = await pool.query(
        'SELECT id, nombre, email, role, password_hash, mfa_enabled, mfa_secret FROM usuarios WHERE email = $1',
        [normalizedEmail]
      );

      if (result.rowCount === 0) {
        return res.status(401).json({ message: 'Credenciales incorrectas.' });
      }

      const user = result.rows[0];
      const isMatch = await bcrypt.compare(String(password), user.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Credenciales incorrectas.' });
      }

      if (user.mfa_enabled && user.mfa_secret) {
        return res.json({
          message: 'Se requiere verificación de dos pasos.',
          mfaRequired: true,
          mfaToken: createMfaChallenge(user.id)
        });
      }

      return res.json({
        message: 'Inicio de sesión exitoso.',
        user: buildSessionUser(user)
      });
    }

    const user = inMemoryUsers.find((item) => item.email === normalizedEmail);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    const isMatch = await bcrypt.compare(String(password), user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas.' });
    }

    if (user.mfa_enabled && user.mfa_secret) {
      return res.json({
        message: 'Se requiere verificación de dos pasos.',
        mfaRequired: true,
        mfaToken: createMfaChallenge(user.id)
      });
    }

    return res.json({
      message: 'Inicio de sesión exitoso (modo local).',
      user: buildSessionUser(user)
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

app.post('/auth/mfa/login/verify', async (req, res) => {
  const { mfaToken, code } = req.body ?? {};
  if (!mfaToken || !code) {
    return res.status(400).json({ message: 'Token MFA y código son obligatorios.' });
  }

  try {
    const challenge = readMfaChallenge(String(mfaToken));
    if (!challenge) {
      return res.status(401).json({ message: 'El desafío MFA expiró o no es válido.' });
    }

    if (databaseAvailable) {
      const result = await pool.query(
        'SELECT id, nombre, email, role, mfa_enabled, mfa_secret FROM usuarios WHERE id = $1',
        [challenge.userId]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      const user = result.rows[0];
      if (!user.mfa_enabled || !user.mfa_secret) {
        return res.status(400).json({ message: 'El usuario no tiene MFA habilitado.' });
      }

      const verifyResult = verifySync({ token: String(code).trim(), secret: user.mfa_secret, window: 1, step: 30 });
      if (!verifyResult?.valid) {
        return res.status(401).json({ message: 'Código de verificación inválido.' });
      }

      mfaLoginChallenges.delete(String(mfaToken));
      return res.json({
        message: 'Inicio de sesión exitoso con MFA.',
        user: buildSessionUser(user)
      });
    }

    const user = inMemoryUsers.find((item) => item.id === challenge.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (!user.mfa_enabled || !user.mfa_secret) {
      return res.status(400).json({ message: 'El usuario no tiene MFA habilitado.' });
    }

    const verifyResult = verifySync({ token: String(code).trim(), secret: user.mfa_secret, window: 1, step: 30 });
    if (!verifyResult?.valid) {
      return res.status(401).json({ message: 'Código de verificación inválido.' });
    }

    mfaLoginChallenges.delete(String(mfaToken));
    return res.json({
      message: 'Inicio de sesión exitoso con MFA (modo local).',
      user: buildSessionUser(user)
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

app.get('/auth/mfa/status/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  if (!Number.isFinite(userId) || userId <= 0) {
    return res.status(400).json({ message: 'ID de usuario inválido.' });
  }

  try {
    if (databaseAvailable) {
      const result = await pool.query('SELECT mfa_enabled FROM usuarios WHERE id = $1', [userId]);
      if (result.rowCount === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      return res.json({ mfaEnabled: Boolean(result.rows[0].mfa_enabled) });
    }

    const user = inMemoryUsers.find((item) => item.id === userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    return res.json({ mfaEnabled: Boolean(user.mfa_enabled) });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

app.post('/auth/mfa/setup/start', async (req, res) => {
  const { userId } = req.body ?? {};
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0) {
    return res.status(400).json({ message: 'ID de usuario inválido.' });
  }

  try {
    const secret = generateSecret();

    if (databaseAvailable) {
      const userResult = await pool.query('SELECT id, email, mfa_enabled FROM usuarios WHERE id = $1', [numericUserId]);
      if (userResult.rowCount === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      if (userResult.rows[0].mfa_enabled) {
        return res.status(409).json({ message: 'MFA ya está habilitado para este usuario.' });
      }

      await pool.query('UPDATE usuarios SET mfa_temp_secret = $1 WHERE id = $2', [secret, numericUserId]);
      const otpAuthUrl = generateURI({
        secret,
        issuer: 'AEGIS Wiki',
        label: userResult.rows[0].email,
        step: 30,
        digits: 6
      });
      const qrImageDataUrl = await QRCode.toDataURL(otpAuthUrl);

      return res.json({ message: 'Escanea el QR y confirma con un código.', qrImageDataUrl, otpAuthUrl });
    }

    const user = inMemoryUsers.find((item) => item.id === numericUserId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (user.mfa_enabled) {
      return res.status(409).json({ message: 'MFA ya está habilitado para este usuario.' });
    }

    user.mfa_temp_secret = secret;
    const otpAuthUrl = generateURI({
      secret,
      issuer: 'AEGIS Wiki',
      label: user.email,
      step: 30,
      digits: 6
    });
    const qrImageDataUrl = await QRCode.toDataURL(otpAuthUrl);
    return res.json({ message: 'Escanea el QR y confirma con un código.', qrImageDataUrl, otpAuthUrl });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

app.post('/auth/mfa/setup/confirm', async (req, res) => {
  const { userId, code } = req.body ?? {};
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0 || !code) {
    return res.status(400).json({ message: 'ID de usuario y código son obligatorios.' });
  }

  try {
    if (databaseAvailable) {
      const userResult = await pool.query(
        'SELECT mfa_temp_secret, mfa_enabled FROM usuarios WHERE id = $1',
        [numericUserId]
      );

      if (userResult.rowCount === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      const user = userResult.rows[0];
      if (user.mfa_enabled) {
        return res.status(409).json({ message: 'MFA ya está habilitado para este usuario.' });
      }

      if (!user.mfa_temp_secret) {
        return res.status(400).json({ message: 'No hay un proceso de configuración MFA activo.' });
      }

      const verifyResult = verifySync({ token: String(code).trim(), secret: user.mfa_temp_secret, window: 1, step: 30 });
      if (!verifyResult?.valid) {
        return res.status(401).json({ message: 'Código de verificación inválido.' });
      }

      await pool.query(
        'UPDATE usuarios SET mfa_enabled = TRUE, mfa_secret = mfa_temp_secret, mfa_temp_secret = NULL WHERE id = $1',
        [numericUserId]
      );

      return res.json({ message: 'MFA activado correctamente.', mfaEnabled: true });
    }

    const user = inMemoryUsers.find((item) => item.id === numericUserId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (user.mfa_enabled) {
      return res.status(409).json({ message: 'MFA ya está habilitado para este usuario.' });
    }

    if (!user.mfa_temp_secret) {
      return res.status(400).json({ message: 'No hay un proceso de configuración MFA activo.' });
    }

    const verifyResult = verifySync({ token: String(code).trim(), secret: user.mfa_temp_secret, window: 1, step: 30 });
    if (!verifyResult?.valid) {
      return res.status(401).json({ message: 'Código de verificación inválido.' });
    }

    user.mfa_enabled = true;
    user.mfa_secret = user.mfa_temp_secret;
    user.mfa_temp_secret = null;
    return res.json({ message: 'MFA activado correctamente (modo local).', mfaEnabled: true });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

app.post('/auth/mfa/disable', async (req, res) => {
  const { userId, code } = req.body ?? {};
  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0 || !code) {
    return res.status(400).json({ message: 'ID de usuario y código son obligatorios.' });
  }

  try {
    if (databaseAvailable) {
      const userResult = await pool.query('SELECT mfa_enabled, mfa_secret FROM usuarios WHERE id = $1', [numericUserId]);
      if (userResult.rowCount === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado.' });
      }

      const user = userResult.rows[0];
      if (!user.mfa_enabled || !user.mfa_secret) {
        return res.status(400).json({ message: 'MFA no está habilitado para este usuario.' });
      }

      const verifyResult = verifySync({ token: String(code).trim(), secret: user.mfa_secret, window: 1, step: 30 });
      if (!verifyResult?.valid) {
        return res.status(401).json({ message: 'Código de verificación inválido.' });
      }

      await pool.query('UPDATE usuarios SET mfa_enabled = FALSE, mfa_secret = NULL, mfa_temp_secret = NULL WHERE id = $1', [numericUserId]);
      return res.json({ message: 'MFA desactivado correctamente.', mfaEnabled: false });
    }

    const user = inMemoryUsers.find((item) => item.id === numericUserId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    if (!user.mfa_enabled || !user.mfa_secret) {
      return res.status(400).json({ message: 'MFA no está habilitado para este usuario.' });
    }

    const verifyResult = verifySync({ token: String(code).trim(), secret: user.mfa_secret, window: 1, step: 30 });
    if (!verifyResult?.valid) {
      return res.status(401).json({ message: 'Código de verificación inválido.' });
    }

    user.mfa_enabled = false;
    user.mfa_secret = null;
    user.mfa_temp_secret = null;
    return res.json({ message: 'MFA desactivado correctamente (modo local).', mfaEnabled: false });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: 'Error en el servidor.' });
  }
});

// Ruta para ver todas las armas de tu Wiki
app.get('/armas', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }

    const resultado = await pool.query('SELECT * FROM armas');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// Endpoint para armaduras
app.get('/armaduras', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }
    const resultado = await pool.query('SELECT * FROM armaduras');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// Endpoint para hechizos
app.get('/hechizos', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }
    const resultado = await pool.query('SELECT * FROM hechizos');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// Endpoint para milagros
app.get('/milagros', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }
    const resultado = await pool.query('SELECT * FROM milagros');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// Endpoint para clases
app.get('/clases', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }
    const resultado = await pool.query('SELECT * FROM clases ORDER BY id ASC');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// Endpoint para talismanes
app.get('/talismanes', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }
    const resultado = await pool.query('SELECT * FROM talismanes');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// Endpoint para personajes
app.get('/personajes', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }
    const resultado = await pool.query('SELECT * FROM personajes');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

// Endpoint para builds
app.get('/builds', async (req, res) => {
  try {
    if (!databaseAvailable) {
      return res.json([]);
    }
    const resultado = await pool.query('SELECT * FROM builds');
    res.json(resultado.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Error en el servidor");
  }
});

async function startServer() {
  try {
    await initDatabase();
    startWikiWatcher();
    app.listen(serverPort, () => {
      console.log(`Servidor AEGIS corriendo en el puerto ${serverPort}`);
    });
  } catch (error) {
    console.error('Error al arrancar el servidor:', error.message);
    process.exitCode = 1;
  }
}

// eslint-disable-next-line unicorn/prefer-top-level-await
startServer();
