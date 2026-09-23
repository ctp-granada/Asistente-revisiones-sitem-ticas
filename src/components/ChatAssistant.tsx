import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileCheck,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { ChatMessage, PicoData, PrismaSectionKey } from '../types';

interface ChatAssistantProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  isLoading: boolean;
  picoData: PicoData;
  activeSectionKey: PrismaSectionKey;
  onApplyToSection?: (sectionKey: PrismaSectionKey, text: string) => void;
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({
  messages,
  onSendMessage,
  isLoading,
  picoData,
  activeSectionKey,
  onApplyToSection,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPrompts = [
    {
      label: 'Validar formulación PICO',
      prompt: 'Por favor, evalúa si los componentes de mi marco PICO actual cumplen con los criterios de especificidad y rigor metodológico para iniciar una revisión sistemática bajo PRISMA 2020.',
    },
    {
      label: 'Propuesta de Título y Abstract PRISMA-A',
      prompt: 'Propón un título estructurado que identifique el estudio como revisión sistemática y el esquema de los 12 ítems de PRISMA 2020 para resúmenes (PRISMA-A). Pregúntame los datos numéricos que falten.',
    },
    {
      label: 'Estrategia de búsqueda Booleana (Ítem 7)',
      prompt: 'Genera la estrategia de búsqueda completa línea por línea para PubMed/MEDLINE utilizando descriptores MeSH y términos en título/resumen [tiab] según la recomendación del ítem 7 de PRISMA 2020.',
    },
    {
      label: 'Protocolo de Riesgo de Sesgo (RoB 2)',
      prompt: 'Redacta el párrafo de metodología para la evaluación de riesgo de sesgo en Ensayos Clínicos Aleatorizados utilizando Cochrane RoB 2, detallando los 5 dominios y la regla del peor juicio.',
    },
    {
      label: 'Certeza de Evidencia (GRADE - Ítem 15)',
      prompt: 'Explícame cómo redactar con rigor la evaluación de certeza de la evidencia con el enfoque GRADE para la sección de Métodos (Ítem 15) y cómo estructurar la tabla Summary of Findings (SoF) para Resultados (Ítem 22).',
    },
    {
      label: 'Estructurar Datos para Flujograma',
      prompt: 'Ayúdame a organizar la trazabilidad de los números para el Diagrama de Flujo PRISMA 2020: ¿qué datos exactos de cribado y exclusión por texto completo debo recopilar?',
    },
    {
      label: 'Limitaciones: Evidencia vs. Proceso',
      prompt: 'Explica cómo redactar la sección de Discusión diferenciando estrictamente las limitaciones del cuerpo de evidencia incluido (ítem 23b) de las limitaciones del proceso metodológico de la revisión (ítem 23c).',
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50">
      {/* Top Methodological Guideline Card */}
      <div className="bg-indigo-900 text-indigo-50 px-4 py-3 border-b border-indigo-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold text-white">Copiloto Metodológico PRISMA 2020</span>
            <span className="text-indigo-200">| Directiva activa: Redacción modular paso a paso previa confirmación</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-indigo-200">
            <span className="bg-indigo-800 px-2 py-0.5 rounded border border-indigo-700">PICO Estricto</span>
            <span className="bg-indigo-800 px-2 py-0.5 rounded border border-indigo-700">Cero Alucinaciones</span>
            <span className="bg-indigo-800 px-2 py-0.5 rounded border border-indigo-700">Norma APA 7</span>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-5xl mx-auto w-full">
        {messages.map((message) => {
          const isAssistant = message.role === 'assistant';
          return (
            <div
              key={message.id}
              className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
            >
              {isAssistant && (
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-3xl rounded-xl p-4 sm:p-5 text-sm leading-relaxed shadow-xs ${
                  isAssistant
                    ? 'bg-white border border-slate-200 text-slate-800'
                    : 'bg-indigo-600 text-white font-normal'
                }`}
              >
                {/* Header inside bubble */}
                <div className="flex items-center justify-between gap-3 pb-2 mb-2 border-b border-slate-100 text-xs text-slate-400">
                  <span className={`font-semibold ${isAssistant ? 'text-indigo-700' : 'text-indigo-200'}`}>
                    {isAssistant ? 'Asistente Clínico PRISMA 2020' : 'Investigador / Usuario'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{message.timestamp}</span>
                    {isAssistant && (
                      <button
                        onClick={() => handleCopy(message.id, message.content)}
                        className="text-slate-400 hover:text-slate-700 transition-colors p-1 cursor-pointer"
                        title="Copiar texto"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content formatted */}
                <div className="whitespace-pre-wrap font-sans text-slate-800 space-y-2 prose prose-sm max-w-none prose-slate">
                  {message.content}
                </div>

                {/* Optional Action: Insert into manuscript section */}
                {isAssistant && onApplyToSection && message.content.length > 80 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 italic">
                      ¿Deseas volcar este borrador al manuscrito?
                    </span>
                    <button
                      onClick={() => onApplyToSection(activeSectionKey, message.content)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      Insertar en sección activa ({activeSectionKey})
                    </button>
                  </div>
                )}
              </div>

              {!isAssistant && (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white shrink-0 mt-1 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start items-center">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-600 flex items-center gap-3 shadow-xs">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span>Evaluando directrices PRISMA 2020 y verificando control de datos...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="bg-white border-t border-slate-200 px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-semibold text-slate-500 whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Guías rápidas:
          </span>
          {quickPrompts.map((qp, index) => (
            <button
              key={index}
              onClick={() => onSendMessage(qp.prompt)}
              disabled={isLoading}
              className="px-2.5 py-1 text-xs rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 border border-slate-200 whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {qp.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-5xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              id="input-chat-message"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu consulta metodológica, datos clínicos o confirmación para avanzar de sección..."
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white text-slate-900 disabled:opacity-60 transition-all"
            />
            <button
              id="btn-send-chat"
              type="submit"
              disabled={!input.trim() || isLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-sm font-semibold shadow-xs transition-colors cursor-pointer shrink-0 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
              <span>Enviar</span>
            </button>
          </form>

          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>Rigor metodológico estricto: cero alucinaciones y trazabilidad de datos.</span>
            <span>Sección contextual: <strong className="text-slate-600">{activeSectionKey}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
