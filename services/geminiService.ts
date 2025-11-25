import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Asset, AIConfig, AIProvider, ReportContext } from '../types';

const STORAGE_KEY_CONFIG = 'CSPM_AI_CONFIG';

// Default Configuration
const DEFAULT_CONFIG: AIConfig = {
    provider: 'GEMINI',
    geminiKey: '',
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3'
};

// --- Configuration Management ---

const getAIConfig = (): AIConfig => {
    const stored = localStorage.getItem(STORAGE_KEY_CONFIG);
    const config = stored ? JSON.parse(stored) : DEFAULT_CONFIG;
    
    // Fallback for Gemini Key if using Env Var
    if (!config.geminiKey) {
        config.geminiKey = process.env.API_KEY || '';
    }
    return config;
};

// --- Unified Execution Layer ---

/**
 * Generic function to generate text/code based on current provider
 */
const generateUnifiedContent = async (
    prompt: string, 
    systemInstruction?: string
): Promise<string> => {
    const config = getAIConfig();

    if (config.provider === 'OLLAMA') {
        return await callOllama(config, prompt, systemInstruction);
    } else {
        return await callGemini(config, prompt, systemInstruction);
    }
};

/**
 * Generic function for chat interactions
 */
const generateUnifiedChat = async (
    message: string, 
    history: { role: string, parts: { text: string }[] }[]
): Promise<string> => {
    const config = getAIConfig();

    if (config.provider === 'OLLAMA') {
        return await callOllamaChat(config, message, history);
    } else {
        return await callGeminiChat(config, message, history);
    }
};

// --- Provider Implementations ---

// 1. Google Gemini Implementation
const callGemini = async (config: AIConfig, prompt: string, systemInstruction?: string): Promise<string> => {
    if (!config.geminiKey) throw new Error("Gemini API Key is missing");
    
    const ai = new GoogleGenAI({ apiKey: config.geminiKey });
    const model = 'gemini-2.5-flash'; // Default model for Gemini

    const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
            systemInstruction: systemInstruction
        }
    });

    return response.text || "";
};

const callGeminiChat = async (config: AIConfig, message: string, history: any[]): Promise<string> => {
    if (!config.geminiKey) throw new Error("Gemini API Key is missing");

    const ai = new GoogleGenAI({ apiKey: config.geminiKey });
    const model = 'gemini-2.5-flash';

    const chat = ai.chats.create({
        model: model,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION_CHAT,
        },
        history: history
    });

    const result = await chat.sendMessage({ message: message });
    return result.text || "";
};

// 2. Ollama Implementation
const callOllama = async (config: AIConfig, prompt: string, systemInstruction?: string): Promise<string> => {
    const url = `${config.ollamaUrl.replace(/\/$/, '')}/api/generate`;
    
    // Construct prompt with system instruction if provided
    // Note: Some models differ, but generally sending "system" role in chat endpoint is better. 
    // However, for /api/generate, we prepend system instruction.
    const finalPrompt = systemInstruction 
        ? `System: ${systemInstruction}\n\nUser: ${prompt}` 
        : prompt;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollamaModel,
                prompt: finalPrompt,
                stream: false
            })
        });

        if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("Ollama Connection Failed. Ensure OLLAMA_ORIGINS='*' is set.", error);
        throw error;
    }
};

const callOllamaChat = async (config: AIConfig, message: string, history: any[]): Promise<string> => {
    const url = `${config.ollamaUrl.replace(/\/$/, '')}/api/chat`;

    // Convert Gemini History format to Ollama Format
    // Gemini: { role: 'user'|'model', parts: [{text: '...'}] }
    // Ollama: { role: 'user'|'assistant', content: '...' }
    const ollamaMessages = history.map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0]?.text || ''
    }));

    // Add System Instruction
    ollamaMessages.unshift({ role: 'system', content: SYSTEM_INSTRUCTION_CHAT });

    // Add current message
    ollamaMessages.push({ role: 'user', content: message });

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: config.ollamaModel,
                messages: ollamaMessages,
                stream: false
            })
        });

        if (!response.ok) throw new Error(`Ollama Error: ${response.statusText}`);
        const data = await response.json();
        return data.message.content;
    } catch (error) {
        console.error("Ollama Chat Failed", error);
        throw error;
    }
};

// --- Application Logic (Consumed by UI) ---

const SYSTEM_INSTRUCTION_CHAT = `
You are the AI Security Analyst for CSPM-NG (Unified Cloud & SaaS Security Platform).
Your goal is to assist security engineers in understanding risks, interpreting cloud configurations, and suggesting remediation steps.
You have expertise in AWS, Azure, GCP, and SaaS security standards (CIS Benchmarks, NIST).
Keep answers concise, professional, and actionable.
`;

export const analyzeAssetRisk = async (asset: Asset): Promise<string> => {
    try {
        const prompt = `
        Analyze the security posture of the following asset and provide a brief executive summary of the risks and 3 concrete remediation steps.
        
        Asset Data:
        ${JSON.stringify(asset, null, 2)}
        
        Format the output in Markdown.
        `;

        return await generateUnifiedContent(prompt, "You are an expert Cloud Security Posture Management (CSPM) analyst.");
    } catch (error) {
        console.error("Analysis Error:", error);
        return "Error: Unable to connect to AI Service. Please check your AI Provider settings.";
    }
};

export const generateConnectorYaml = async (description: string): Promise<string> => {
    try {
        const prompt = `
        Generate a 'Connector Definition YAML' for the CSPM-NG Generic SaaS Adapter based on this description: "${description}".
        
        The YAML must follow this structure:
        provider: "Name"
        auth_type: "OAuth2" | "APIKey"
        endpoints:
          users: "/api/v1/users"
          settings: "/api/v1/settings"
        mapping_rules:
          - source_field: "email"
            target_field: "identity.email"
        
        Only return the YAML code block. Do not include markdown backticks.
        `;

        let text = await generateUnifiedContent(prompt);
        // Cleanup if model adds backticks
        text = text.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
        return text;
    } catch (error) {
        console.error("YAML Gen Error:", error);
        return "# Error generating configuration. Please check your AI Provider settings.";
    }
};

export const generatePolicyLogic = async (description: string, provider: string): Promise<string> => {
    try {
        const prompt = `
        You are a Policy Engineer. Write a security policy rule (in pseudo-code or OPA Rego format) for ${provider} based on this requirement: "${description}".
        
        Include a comment explaining what it checks.
        Only return the code block. Do not include markdown backticks.
        `;

        let text = await generateUnifiedContent(prompt);
        text = text.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
        return text;
    } catch (error) {
        console.error("Policy Gen Error:", error);
        return "// Error connecting to AI service. Check Settings.";
    }
};

export const generateRemediationCode = async (misconfiguration: string, asset: Asset): Promise<string> => {
    try {
        const prompt = `
        You are a DevSecOps Engineer. Generate Infrastructure as Code (Terraform or CLI command) to fix the following misconfiguration:
        "${misconfiguration}"
        
        For this asset:
        Provider: ${asset.source_type}
        Resource Name: ${asset.name}
        ID: ${asset.global_id}
        
        Only return the code block with the fix. Do not include markdown formatting or explanations outside the code block.
        `;

        let text = await generateUnifiedContent(prompt);
        // Strip markdown backticks if present
        text = text.replace(/^```[a-z]*\n/, '').replace(/\n```$/, '');
        return text;
    } catch (error) {
        console.error("Remediation Gen Error:", error);
        return "# Error generating remediation code. Check AI settings.";
    }
};

export const generateReportSummary = async (templateName: string, context: ReportContext): Promise<string> => {
    try {
        const prompt = `
        Write an Executive Summary for a ${templateName} Report.
        
        Key Metrics:
        - Date: ${context.generatedDate}
        - Total Assets: ${context.totalAssets}
        - Compliance Score: ${context.complianceScore}%
        - Open Critical Risks: ${context.criticalIssues}
        - Top Risks Found: ${context.topRisks.join(', ')}
        
        Tone: Professional, Concise, Action-Oriented.
        Structure:
        1. Overview of security posture.
        2. Highlight key risks.
        3. Strategic recommendation.
        
        Do not use Markdown formatting (bold/italic is okay, but no headers like #).
        `;

        return await generateUnifiedContent(prompt, "You are a CISO advisor generating a formal security report.");
    } catch (error) {
        console.error("Report Gen Error:", error);
        return "Executive summary could not be generated due to an AI service error.";
    }
}

export const chatWithSecurityCopilot = async (message: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
    try {
        return await generateUnifiedChat(message, history);
    } catch (error) {
        console.error("Chat Error:", error);
        return "I am currently offline or experiencing connection issues. Please verify your AI Provider Settings.";
    }
};
