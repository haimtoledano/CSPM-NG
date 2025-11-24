
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

// Platform Management Types
export type UserRole = 'Admin' | 'Auditor' | 'Viewer';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: 'Active' | 'Inactive';
    last_login: string;
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