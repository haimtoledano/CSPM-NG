
// 4.1 The Asset Object (Canonical Schema)
export enum SourceType {
    AWS = 'AWS',
    AZURE = 'AZURE',
    GCP = 'GCP',
    SAAS_GITHUB = 'SAAS_GITHUB',
    SAAS_SALESFORCE = 'SAAS_SALESFORCE',
    SAAS_ZOOM = 'SAAS_ZOOM',
    SAAS_GENERIC = 'SAAS_GENERIC'
}

export enum AssetCategory {
    COMPUTE = 'COMPUTE',
    IDENTITY = 'IDENTITY',
    STORAGE = 'STORAGE',
    NETWORK = 'NETWORK',
    CONFIG = 'CONFIG'
}

export interface SecurityPosture {
    risk_score: number; // 0-100
    vulnerabilities: string[];
    misconfigurations: string[];
}

export interface Asset {
    id: string;
    global_id: string; // ARN or Subscription ID
    name: string;
    source_type: SourceType;
    asset_category: AssetCategory;
    region: string;
    tags: Record<string, string>;
    security_posture: SecurityPosture;
    raw_metadata: any; // The original JSON
    related_assets?: string[]; // IDs of connected assets (Graph edges)
}

// Connector Types
export enum AuthMethod {
    STATIC_KEY = 'STATIC_KEY',
    OAUTH = 'OAUTH',
    IAM_ROLE = 'IAM_ROLE'
}

export interface Connector {
    id: string;
    name: string;
    provider: SourceType;
    status: 'ACTIVE' | 'ERROR' | 'SYNCING';
    last_sync: string;
    auth_method?: AuthMethod;
    oauth_metadata?: {
        tenant_id?: string;
        client_id?: string;
        scopes?: string[];
    };
}

// Chat/Gemini Types
export interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    text: string;
    timestamp: Date;
    isTyping?: boolean;
}

// AI Configuration Types
export type AIProvider = 'GEMINI' | 'OLLAMA';

export interface AIConfig {
    provider: AIProvider;
    geminiKey: string;
    ollamaUrl: string;
    ollamaModel: string;
}

// Syslog / Log Forwarding Types
export interface SyslogConfig {
    enabled: boolean;
    host: string;
    port: number;
    protocol: 'UDP' | 'TCP' | 'TLS';
}

// System Setup Configuration
export interface DatabaseConfig {
    host: string;
    port: string;
    user: string;
    password?: string;
    dbName: string;
    isInitialized: boolean;
}

export interface SystemConfig {
    appName: string;
    logoUrl: string;
    dbConfig: DatabaseConfig;
    isSetupComplete: boolean;
}

// Platform Management Types
export type UserRole = 'Admin' | 'Auditor' | 'Viewer';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: 'Active' | 'Inactive';
    last_login: string;
    mfaSecret?: string; // Encrypted or raw secret for TOTP
    isSuperAdmin?: boolean; // Only the first user gets this
}

export interface AuditLog {
    id: string;
    actor: string;
    action: string;
    target: string;
    timestamp: string;
    ip_address: string;
}

export interface RoleDefinition {
    name: UserRole;
    description: string;
    permissions: string[];
}

// Notification Types
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: Date;
    read: boolean;
}

// Compliance & Policy Types
export interface ComplianceStandard {
    id: string;
    name: string; // e.g., "CIS AWS Foundations v1.4"
    description: string;
    score: number; // 0-100
    passing_controls: number;
    total_controls: number;
}

export interface Policy {
    id: string;
    name: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    provider: SourceType;
    status: 'ACTIVE' | 'DISABLED';
    description: string;
    logic_preview?: string; // Pseudo-code or Rego
}

// Dashboard Configuration Types
export type WidgetType = 'METRIC' | 'BAR_CHART' | 'PIE_CHART' | 'LINE_CHART';
export type DataSource = 'GLOBAL_COMPLIANCE' | 'CRITICAL_RISKS' | 'TOTAL_ASSETS' | 'SAAS_USERS' | 'ASSETS_BY_PROVIDER' | 'RISK_TREND';
export type WidgetSize = 'SMALL' | 'MEDIUM' | 'LARGE' | 'FULL'; 

export interface DashboardWidget {
    id: string;
    title: string;
    type: WidgetType;
    dataSource: DataSource;
    size: WidgetSize; // Controls grid column span
}

// Reporting Types
export interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    type: 'EXECUTIVE' | 'COMPLIANCE' | 'VULNERABILITY';
}

export interface ReportContext {
    generatedDate: string;
    tenantName: string;
    totalAssets: number;
    riskScore: number;
    criticalIssues: number;
    complianceScore: number;
    topRisks: string[];
}

// Auth Types
export interface AuthState {
    isAuthenticated: boolean;
    currentUser: User | null;
}

export interface AuthContextType extends AuthState {
    // Core Auth
    checkEmailStatus: (email: string) => { status: 'UNKNOWN' | 'KNOWN_NO_MFA' | 'KNOWN_WITH_MFA' | 'SYSTEM_INIT' };
    login: (email: string, code: string) => Promise<boolean>;
    logout: () => void;
    
    // MFA Setup
    generateTempSecret: () => string;
    completeMfaSetup: (email: string, secret: string, token: string) => boolean;
    
    // User Management (Admin)
    users: User[];
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    deleteUser: (id: string) => void;
    
    // Helpers
    getCurrentUserMfaSecret: () => string | undefined;

    // System Config
    systemConfig: SystemConfig;
    updateSystemConfig: (config: SystemConfig) => void;
}
