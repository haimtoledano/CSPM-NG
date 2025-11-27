import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// Ensure data directory exists
const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)){
    fs.mkdirSync(dataDir, { recursive: true });
}

const DB_PATH = path.join(dataDir, 'cspm.db');
console.log(`Using Database at: ${DB_PATH}`);

const db = new Database(DB_PATH);

// --- Initialize Schema ---
const initSchema = () => {
    db.exec(`
        CREATE TABLE IF NOT EXISTS system_config (
            key TEXT PRIMARY KEY,
            value TEXT
        );

        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            role TEXT NOT NULL,
            status TEXT DEFAULT 'Active',
            last_login TEXT,
            mfa_secret TEXT,
            is_super_admin INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS assets (
            id TEXT PRIMARY KEY,
            global_id TEXT UNIQUE NOT NULL,
            name TEXT,
            source_type TEXT,
            asset_category TEXT,
            region TEXT,
            tags TEXT,
            security_posture TEXT,
            raw_metadata TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            actor TEXT,
            action TEXT,
            target TEXT,
            ip_address TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        -- Default Config
        INSERT OR IGNORE INTO system_config (key, value) VALUES ('app_name', 'CSPM-NG');
        INSERT OR IGNORE INTO system_config (key, value) VALUES ('is_setup', 'true');
    `);
    console.log("SQLite Schema Initialized.");
};

initSchema();

// --- Routes ---

// 1. System Status
app.get('/api/status', (req, res) => {
    // SQLite is always "setup" once the file exists
    res.json({ isSetup: true, mode: 'SQLITE' });
});

// 2. Setup (Now used mostly for Branding updates)
app.post('/api/setup', (req, res) => {
    // We can use this to update branding in system_config
    const { appName, logoUrl } = req.body;
    if (appName) {
        const stmt = db.prepare("INSERT INTO system_config (key, value) VALUES ('app_name', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
        stmt.run(appName);
    }
    if (logoUrl) {
         const stmt = db.prepare("INSERT INTO system_config (key, value) VALUES ('logo_url', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
        stmt.run(logoUrl);
    }
    res.json({ success: true, message: 'Configuration updated.' });
});

// 3. User Management
app.get('/api/users', (req, res) => {
    try {
        const users = db.prepare('SELECT * FROM users').all();
        // Transform for frontend
        const formatted = users.map(u => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            last_login: u.last_login,
            mfaSecret: u.mfa_secret,
            isSuperAdmin: !!u.is_super_admin
        }));
        res.json(formatted);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/users', (req, res) => {
    const { id, name, email, role, mfaSecret, isSuperAdmin, status, last_login } = req.body;
    try {
        const stmt = db.prepare(`
            INSERT INTO users (id, name, email, role, mfa_secret, is_super_admin, status, last_login)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(email) DO UPDATE SET
            name=excluded.name, role=excluded.role, mfa_secret=excluded.mfa_secret, last_login=excluded.last_login
        `);
        
        // Generate UUID if missing (e.g. initial seed)
        const finalId = id || crypto.randomUUID();
        
        stmt.run(finalId, name, email, role, mfaSecret, isSuperAdmin ? 1 : 0, status, last_login);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 4. Branding Config Retrieval
app.get('/api/config', (req, res) => {
    const rows = db.prepare("SELECT key, value FROM system_config").all();
    const config = {};
    rows.forEach(r => config[r.key] = r.value);
    res.json(config);
});

app.listen(PORT, () => {
    console.log(`Backend Server running on port ${PORT}`);
});