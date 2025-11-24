import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Asset } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
const modelName = 'gemini-2.5-flash';

// System instruction for the general chatbot
const SYSTEM_INSTRUCTION_CHAT = `
You are the AI Security Analyst for Sentinel UCSSP (Unified Cloud & SaaS Security Platform).
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

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                systemInstruction: "You are an expert Cloud Security Posture Management (CSPM) analyst."
            }
        });

        return response.text || "Unable to analyze asset.";
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        return "Error: Unable to connect to AI Security Analyst.";
    }
};

export const generateConnectorYaml = async (description: string): Promise<string> => {
    try {
        const prompt = `
        Generate a 'Connector Definition YAML' for the Sentinel UCSSP Generic SaaS Adapter based on this description: "${description}".
        
        The YAML must follow this structure:
        provider: "Name"
        auth_type: "OAuth2" | "APIKey"
        endpoints:
          users: "/api/v1/users"
          settings: "/api/v1/settings"
        mapping_rules:
          - source_field: "email"
            target_field: "identity.email"
        
        Only return the YAML code block.
        `;

        const response: GenerateContentResponse = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
        });

        return response.text || "";
    } catch (error) {
        console.error("Gemini YAML Gen Error:", error);
        return "# Error generating configuration.";
    }
};

export const chatWithSecurityCopilot = async (message: string, history: {role: string, parts: {text: string}[]}[] = []): Promise<string> => {
    try {
        // Convert internal history format to Gemini format if needed, but for simple one-shot or maintaining state in component
        // Here we will use a simple generateContent for stateless or a chat session if we stored the chat object.
        // For simplicity in this demo, we assume stateless turn-by-turn with context injection if needed, 
        // but let's use the chat API properly.
        
        const chat = ai.chats.create({
            model: modelName,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION_CHAT,
            },
            history: history
        });

        const result = await chat.sendMessage({ message: message });
        return result.text || "No response generated.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "I am currently offline or experiencing connection issues.";
    }
};
