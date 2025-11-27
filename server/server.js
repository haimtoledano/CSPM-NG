import express from 'express';
import Database from 'better-sqlite3';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3001;
const DATA_DIR = path.join(__dirname, '../data');
const DB_PATH = path.join(DATA_DIR, 'cspm.db');

// --- Database Manager Class ---
class DBManager {
    constructor() {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        
        this.db = new Database(DB_PATH);
        this.applyOptimizations();
        this.initSchema();
        this.prepareStatements();
    }

    applyOptimizations() {
        // WAL mode allows simultaneous readers and writers
        this.db.pragma('journal_mode = WAL'); 
        // Enforce foreign keys for data integrity
        this.db.pragma('foreign_keys = ON');
        // Synchronous NORMAL is faster and safe enough for WAL
        this.db.pragma('synchronous = NORMAL');
    }

    initSchema() {
        // Core Tables
        this.db.exec(`
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
                avatar_url TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS connectors (
                id TEXT PRIMARY KEY,
                name TEXT,
                provider TEXT,
                status TEXT,
                last_sync TEXT,
                auth_method TEXT
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

        // Performance Indexes
        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_assets_source ON assets(source_type);
            CREATE INDEX IF NOT EXISTS idx_assets_category ON assets(asset_category);
            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON audit_logs(timestamp);
        `);

        console.log("SQLite Optimized Schema & Indexes Initialized.");
    }

    prepareStatements() {
        // Caching statements improves performance by ~2x for repeated calls
        this.stmt = {
            // Config
            upsertConfig: this.db.prepare("INSERT INTO system_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value"),
            getConfig: this.db.prepare("SELECT key, value FROM system_config"),
            
            // Users
            getUsers: this.db.prepare("SELECT * FROM users"),
            upsertUser: this.db.prepare(`
                INSERT INTO users (id, name, email, role, mfa_secret, is_super_admin, status, last_login, avatar_url)
                VALUES (@id, @name, @email, @role, @mfaSecret, @isSuperAdmin, @status, @last_login, @avatarUrl)
                ON CONFLICT(email) DO UPDATE SET
                name=excluded.name, role=excluded.role, mfa_secret=excluded.mfa_secret, last_login=excluded.last_login, avatar_url=excluded.avatar_url
            `),
            
            // Connectors
            getConnectors: this.db.prepare("SELECT * FROM connectors"),
            upsertConnector: this.db.prepare(`
                INSERT INTO connectors (id, name, provider, status, last_sync, auth_method)
                VALUES (@id, @name, @provider, @status, @last_sync, @auth_method)
                ON CONFLICT(id) DO UPDATE SET status=excluded.status, last_sync=excluded.last_sync
            `),
            deleteConnector: this.db.prepare("DELETE FROM connectors WHERE id = ?"),
            syncConnectorUpdate: this.db.prepare("UPDATE connectors SET last_sync = 'Just now', status = 'ACTIVE' WHERE id = ?"),

            // Assets
            getAssets: this.db.prepare("SELECT * FROM assets"),
            upsertAsset: this.db.prepare(`
                INSERT INTO assets (id, global_id, name, source_type, asset_category, region, tags, security_posture, raw_metadata, updated_at)
                VALUES (@id, @global_id, @name, @source_type, @asset_category, @region, @tags, @security_posture, @raw_metadata, CURRENT_TIMESTAMP)
                ON CONFLICT(global_id) DO UPDATE SET security_posture=excluded.security_posture, updated_at=CURRENT_TIMESTAMP
            `),
            
            // Logs
            logAction: this.db.prepare("INSERT INTO audit_logs (id, actor, action, target, ip_address) VALUES (@id, @actor, @action, @target, @ip_address)")
        };
    }
}

const dbManager = new DBManager();
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increased limit for large asset payloads

// --- Helper for Consistent Responses ---
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((err) => {
        console.error(err);
        res.status(500).json({ error: err.message });
    });
};

// --- Routes ---

app.get('/api/status', (req, res) => res.json({ isSetup: true, mode: 'SQLITE-WAL' }));

app.post('/api/setup', asyncHandler(async (req, res) => {
    const { appName, logoUrl } = req.body;
    const update = dbManager.db.transaction(() => {
        if (appName) dbManager.stmt.upsertConfig.run('app_name', appName);
        if (logoUrl) dbManager.stmt.upsertConfig.run('logo_url', logoUrl);
    });
    update();
    res.json({ success: true });
}));

app.get('/api/config', asyncHandler(async (req, res) => {
    const rows = dbManager.stmt.getConfig.all();
    const config = rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    res.json(config);
}));

app.get('/api/users', asyncHandler(async (req, res) => {
    const users = dbManager.stmt.getUsers.all();
    res.json(users.map(u => ({
        ...u,
        isSuperAdmin: !!u.is_super_admin,
        avatarUrl: u.avatar_url,
        mfaSecret: u.mfa_secret // In prod, consider stripping this if not needed
    })));
}));

app.post('/api/users', asyncHandler(async (req, res) => {
    const user = {
        ...req.body,
        id: req.body.id || crypto.randomUUID(),
        isSuperAdmin: req.body.isSuperAdmin ? 1 : 0
    };
    dbManager.stmt.upsertUser.run(user);
    res.json({ success: true });
}));

app.get('/api/connectors', asyncHandler(async (req, res) => {
    res.json(dbManager.stmt.getConnectors.all());
}));

app.post('/api/connectors', asyncHandler(async (req, res) => {
    dbManager.stmt.upsertConnector.run(req.body);
    res.json({ success: true });
}));

app.delete('/api/connectors/:id', asyncHandler(async (req, res) => {
    const info = dbManager.stmt.deleteConnector.run(req.params.id);
    if (info.changes > 0) res.json({ success: true });
    else res.status(404).json({ error: 'Not found' });
}));

app.post('/api/connectors/:id/sync', asyncHandler(async (req, res) => {
    dbManager.stmt.syncConnectorUpdate.run(req.params.id);
    dbManager.stmt.logAction.run({
        id: crypto.randomUUID(),
        actor: 'system',
        action: 'SYNC_CONNECTOR',
        target: `Connector ID: ${req.params.id}`,
        ip_address: req.ip || '127.0.0.1'
    });
    res.json({ success: true });
}));

app.get('/api/assets', asyncHandler(async (req, res) => {
    const assets = dbManager.stmt.getAssets.all();
    // Parse JSON fields on read (Storage optimization: stored as text)
    const formatted = assets.map(a => ({
        ...a,
        tags: JSON.parse(a.tags || '{}'),
        security_posture: JSON.parse(a.security_posture || '{}'),
        raw_metadata: JSON.parse(a.raw_metadata || '{}')
    }));
    res.json(formatted);
}));

app.post('/api/assets', asyncHandler(async (req, res) => {
    const asset = {
        ...req.body,
        id: req.body.id || crypto.randomUUID(),
        tags: JSON.stringify(req.body.tags),
        security_posture: JSON.stringify(req.body.security_posture),
        raw_metadata: JSON.stringify(req.body.raw_metadata)
    };
    dbManager.stmt.upsertAsset.run(asset);
    res.json({ success: true });
}));

app.listen(PORT, () => {
    console.log(`🚀 Backend Optimized (WAL Mode) running on port ${PORT}`);
});