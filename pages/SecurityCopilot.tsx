import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../components/Widgets';
import { ChatMessage } from '../types';
import { chatWithSecurityCopilot } from '../services/geminiService';
import { Send, Bot, User, ShieldCheck } from 'lucide-react';

const SecurityCopilot: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: '1',
            role: 'model',
            text: 'Hello, I am the CSPM-NG Security Copilot. I can assist you with investigating risks, explaining vulnerabilities, or querying your asset inventory. How can I help today?',
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            text: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Format history for Gemini SDK
        const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
        }));

        const responseText = await chatWithSecurityCopilot(userMsg.text, history);

        const aiMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
        setIsLoading(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
             <div className="mb-4">
                <h2 className="text-2xl font-bold text-slate-900">Security Copilot</h2>
                <p className="text-slate-500">AI-driven investigations and remediation assistance.</p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden border-indigo-100 shadow-md">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-600'}`}>
                                {msg.role === 'user' ? <User className="w-6 h-6 text-slate-600" /> : <Bot className="w-6 h-6 text-white" />}
                            </div>
                            
                            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                                msg.role === 'user' 
                                    ? 'bg-white text-slate-800 rounded-tr-none' 
                                    : 'bg-indigo-600 text-white rounded-tl-none'
                            }`}>
                                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                    {msg.text}
                                </div>
                                <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-slate-400' : 'text-indigo-200'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                                <Bot className="w-6 h-6 text-white" />
                            </div>
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="relative">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about recent vulnerabilities, specific assets, or remediation steps..."
                            className="w-full pr-12 pl-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none shadow-inner"
                            rows={2}
                        />
                        <button 
                            onClick={handleSend}
                            disabled={isLoading || !input.trim()}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 justify-center">
                        <ShieldCheck className="w-3 h-3" />
                        <span>AI responses generated by Gemini 2.5 Flash. Verify critical info manually.</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SecurityCopilot;