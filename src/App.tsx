import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ChatAssistant } from './components/ChatAssistant';
import { PicoBuilder } from './components/PicoBuilder';
import { ModularWriter } from './components/ModularWriter';
import { FlowDiagramViewer } from './components/FlowDiagramViewer';
import { ChecklistTable } from './components/ChecklistTable';
import { ExportModal } from './components/ExportModal';
import { GradeEvaluator } from './components/GradeEvaluator';
import { EvidenceMatrixView } from './components/EvidenceMatrixView';
import { OutcomesIdentifierView } from './components/OutcomesIdentifierView';
import { 
  MetaAnalysisConfig, 
  DEFAULT_META_CONFIG, 
  formatMetaMethodsText, 
  formatMetaResultsText 
} from './components/MetaAnalysisConfig';

import { INITIAL_PRISMA_CHECKLIST } from './data/prismaItems';
import { INITIAL_SECTIONS } from './data/initialSections';
import { INITIAL_FLOW_DIAGRAM } from './data/initialFlowDiagram';
import { INITIAL_GRADE_OUTCOMES } from './data/initialGrade';
import { INITIAL_ROB2_STUDIES } from './data/initialRob2';
import { 
  INITIAL_EVIDENCE_STUDIES, 
  generateEvidenceMatrixMarkdown, 
  generateDataExtractionMethodsText 
} from './data/initialEvidenceStudies';
import {
  INITIAL_CANDIDATE_OUTCOMES,
  generateOutcomesHarmonizationMarkdown,
  generateOutcomesMethodsText
} from './data/initialOutcomes';
import { 
  PicoData, 
  PrismaSectionKey, 
  ChatMessage, 
  ManuscriptSection, 
  PrismaChecklistItem, 
  FlowDiagramState,
  GradeOutcomeAssessment,
  MetaAnalysisConfigState,
  Rob2StudyAssessment,
  EvidenceStudyRecord,
  CandidateOutcome
} from './types';

const INITIAL_PICO: PicoData = {
  population: 'Pacientes adultos (≥ 18 años) diagnosticados con insuficiencia cardíaca con fracción de eyección reducida (IC-FEr ≤ 40%), en clase funcional NYHA II-IV.',
  intervention: 'Inhibidores del cotransportador sodio-glucosa tipo 2 (iSGLT2: dapagliflozina, empagliflozina) asociados al tratamiento estándar.',
  comparator: 'Placebo o tratamiento médico óptimo estándar sin inhibidor SGLT2.',
  outcomes: 'Mortalidad por todas las causas, mortalidad cardiovascular, hospitalizaciones por insuficiencia cardíaca y calidad de vida.',
  studyDesign: 'Ensayos Clínicos Aleatorizados (ECA) fase III/IV doble ciego con seguimiento mínimo de 12 semanas.',
  timeframe: 'Seguimiento de 12 semanas a 24 meses.',
  clinicalQuestion: 'En pacientes adultos con insuficiencia cardíaca y fracción de eyección reducida (IC-FEr), ¿la adición de inhibidores de SGLT2 al tratamiento habitual reduce la mortalidad cardiovascular y las hospitalizaciones por IC en comparación con el placebo?',
};

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'm1',
    role: 'assistant',
    content: `Saludos cordiales. Como asistente experto en metodología de investigación clínica y revisiones sistemáticas especializado en la **declaración PRISMA 2020** (*Page MJ et al., BMJ 2021;372:n160*), te guiaré paso a paso en la formulación, diseño y redacción rigurosa de tu manuscrito.

### Nuestras pautas metodológicas activas:
1. **Estructura PICO/PECO**: Delimitación explícita de Población, Intervención, Comparador y Desenlaces (Outcomes).
2. **Rigor de Directriz**: Cumplimiento exhaustivo de la lista de verificación PRISMA 2020 (27 ítems y sus elementos esenciales).
3. **Tono Académico**: Lenguaje científico formal, impersonal y preciso (norma APA 7 / estilo biomédico).
4. **Redacción Modular**: Progresamos sección por sección previa confirmación tuya antes de redactar la siguiente:
   - *Título y Resumen estructurado (PRISMA-A de 12 ítems)*
   - *Introducción (Justificación científica y Objetivos PICO)*
   - *Métodos (Estrategias booleanas, criterios de elegibilidad, proceso de selección en doble ciego, extracción de datos, herramientas de riesgo de sesgo como RoB 2 / ROBINS-I / Newcastle-Ottawa, y certeza GRADE)*
   - *Resultados (Estructuración para el Flujograma PRISMA, Tabla 1 de características y síntesis narrativa o cuantitativa)*
   - *Discusión, Limitaciones del cuerpo de evidencia y Conclusiones*.
5. **Control Estricto de Datos (Cero Alucinaciones)**: No inventaremos cifras, fechas ni tamaños de muestra. Si faltan datos clave para cumplir con PRISMA, te los solicitaré explícitamente o quedarán registrados como \`[PENDIENTE: ...]\` para asegurar total trazabilidad.

Para comenzar: **¿Deseas validar o ajustar los componentes de tu pregunta PICO actual, o prefieres que comencemos trabajando en la primera sección (Título y Resumen PRISMA-A)?**`,
    timestamp: 'Ahora',
    suggestedPrompts: [
      'Validar el marco PICO actual',
      'Comenzar con Título y Resumen estructurado (PRISMA-A)',
      'Diseñar la estrategia de búsqueda para PubMed (Ítem 7)',
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [activeSectionKey, setActiveSectionKey] = useState<PrismaSectionKey>('title-abstract');
  const [picoData, setPicoData] = useState<PicoData>(INITIAL_PICO);
  const [sections, setSections] = useState<ManuscriptSection[]>(INITIAL_SECTIONS);
  const [checklistItems, setChecklistItems] = useState<PrismaChecklistItem[]>(INITIAL_PRISMA_CHECKLIST);
  const [flowData, setFlowData] = useState<FlowDiagramState>(INITIAL_FLOW_DIAGRAM);
  const [gradeOutcomes, setGradeOutcomes] = useState<GradeOutcomeAssessment[]>(INITIAL_GRADE_OUTCOMES);
  const [rob2Studies, setRob2Studies] = useState<Rob2StudyAssessment[]>(INITIAL_ROB2_STUDIES);
  const [evidenceStudies, setEvidenceStudies] = useState<EvidenceStudyRecord[]>(INITIAL_EVIDENCE_STUDIES);
  const [candidateOutcomes, setCandidateOutcomes] = useState<CandidateOutcome[]>(INITIAL_CANDIDATE_OUTCOMES);
  const [metaConfig, setMetaConfig] = useState<MetaAnalysisConfigState>(DEFAULT_META_CONFIG);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  // Send message to backend Gemini API
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoadingChat(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          picoContext: picoData,
          currentSection: activeSectionKey,
        }),
      });

      const data = await response.json();
      const assistantReply = data.reply || 'No se recibió respuesta del asistente.';

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sectionContext: activeSectionKey,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hubo una dificultad al procesar la solicitud con el servidor. Por favor, reintenta tu consulta.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Update a single manuscript section's content
  const handleUpdateSectionContent = (key: PrismaSectionKey, content: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === key ? { ...s, content } : s))
    );

    // Also auto-update checklist item status if relevant
    const sec = sections.find((s) => s.id === key);
    if (sec && content.trim().length > 50) {
      setChecklistItems((prev) =>
        prev.map((item) => {
          if (sec.prismaItemNumbers.includes(item.itemNumber) && item.status === 'not_started') {
            return { ...item, status: 'in_progress', locationReported: `Sección ${sec.title}` };
          }
          return item;
        })
      );
    }
  };

  // Toggle confirmation approval of a section
  const handleToggleConfirmSection = (key: PrismaSectionKey) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === key) {
          const nextState = !s.isConfirmed;
          // If confirmed, update its checklist items to completed
          if (nextState) {
            setChecklistItems((cPrev) =>
              cPrev.map((item) =>
                s.prismaItemNumbers.includes(item.itemNumber)
                  ? { ...item, status: 'completed' }
                  : item
              )
            );
          }
          return { ...s, isConfirmed: nextState };
        }
        return s;
      })
    );
  };

  // Update a checklist item
  const handleUpdateChecklistItem = (itemNumber: string, updates: Partial<PrismaChecklistItem>) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.itemNumber === itemNumber ? { ...item, ...updates } : item))
    );
  };

  // Send prompt to chat and switch to chat tab
  const handleSendPromptToChat = (prompt: string) => {
    setActiveTab('chat');
    handleSendMessage(prompt);
  };

  // Insert generated draft from chat directly into section
  const handleApplyToSection = (sectionKey: PrismaSectionKey, text: string) => {
    handleUpdateSectionContent(sectionKey, text);
    setActiveSectionKey(sectionKey);
    setActiveTab('writer');
  };

  // Insert GRADE canonical methodology into Methods section
  const handleInsertGradeIntoMethods = (methodsText?: string) => {
    const textToInsert =
      methodsText ||
      `### Evaluación de la Certeza de la Evidencia (Enfoque GRADE) - Ítem 15 PRISMA 2020\nDos investigadores evaluaron de forma independiente la certeza del cuerpo de evidencia para cada desenlace preespecificado utilizando el enfoque GRADE (Grading of Recommendations Assessment, Development and Evaluation). La certeza inicial se graduó en "Alta" para ensayos clínicos aleatorizados y se evaluó la degradación considerando cinco dominios: riesgo de sesgo (RoB 2), inconsistencia (heterogeneidad I²), evidencia indirecta (aplicabilidad PICO), imprecisión (IC 95% frente a umbrales de relevancia clínica y OIS) y sesgo de publicación. Las discrepancias se resolvieron mediante consenso. La certeza se clasificó en cuatro niveles (Alta, Moderada, Baja o Muy Baja) y se generó una tabla de Resumen de Hallazgos (Summary of Findings) con el software GRADEpro GDT.`;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'methods') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + textToInsert };
        }
        return s;
      })
    );
    setActiveSectionKey('methods');
    setActiveTab('writer');
  };

  // Insert Cochrane RoB 2 methodology into Methods section (PRISMA 2020 Item 11)
  const handleInsertRob2IntoMethods = () => {
    const textToInsert =
`### Evaluación del Riesgo de Sesgo en los Estudios Incluidos (Cochrane RoB 2) | Ítem 11 PRISMA 2020
El riesgo de sesgo de los ensayos clínicos aleatorizados (ECA) incluidos se evaluó formalmente mediante la versión 2 de la herramienta de la Colaboración Cochrane (RoB 2; Sterne et al., 2019). Dos investigadores ([INICIALES_REVISOR_1] y [INICIALES_REVISOR_2]) evaluaron de forma independiente y por duplicado cada estudio incluido para el desenlace de [DESENLACE_DE_INTERÉS]. Las discrepancias entre evaluadores se resolvieron mediante discusión consensuada o, cuando fue necesario, mediante el arbitraje independiente de un tercer revisor sénior ([INICIALES_REVISOR_3]). El acuerdo inter-evaluador previo al consenso se determinó calculando el estadístico Kappa de Cohen ([VALOR_KAPPA]).

La evaluación se enfocó en el efecto de la asignación a la intervención al inicio del estudio (efecto de "intención de tratar", ITT) [o alternativamente: el efecto de adherirse a la intervención según el protocolo, "per-protocol"], estructurado a través de preguntas de señalización obligatorias agrupadas en cinco dominios metodológicos:
1. **Dominio 1: Sesgo derivado del proceso de aleatorización.** Se examinó la idoneidad de la generación de la secuencia aleatoria, la ocultación efectiva de la asignación hasta el momento de la inclusión y la comparabilidad de las características basales entre grupos.
2. **Dominio 2: Sesgo debido a desviaciones de las intervenciones previstas.** Se evaluó el cegamiento de los participantes y del personal sanitario que administraba la intervención, la presencia de desviaciones no protocolizadas derivadas del contexto del ensayo y si el análisis estadístico preservó la estrategia de intención de tratar.
3. **Dominio 3: Sesgo debido a datos de resultados faltantes.** Se cuantificó la proporción de participantes con datos de desenlace disponibles en cada brazo, si los motivos de pérdida durante el seguimiento estuvieron balanceados y si las pérdidas estuvieron relacionadas con el verdadero valor del resultado.
4. **Dominio 4: Sesgo en la medición del resultado.** Se analizó si el método de evaluación del desenlace fue adecuado e idéntico entre grupos, si los evaluadores del desenlace estaban cegados a la asignación y si la medición pudo estar sesgada por el conocimiento de la intervención recibida.
5. **Dominio 5: Sesgo en la selección del resultado informado.** Se contrastaron los resultados analizados con el protocolo del ensayo registrado prospectivamente (p. ej., en ClinicalTrials.gov o ISRCTN) o el plan de análisis estadístico (SAP), evaluando la existencia de reporte selectivo entre múltiples medidas de resultado o análisis de subgrupos no preespecificados.

**Algoritmo de Juicio Global (Overall Risk of Bias):**
Cada dominio se clasificó como "Bajo riesgo de sesgo", "Algunas preocupaciones" o "Alto riesgo de sesgo". El juicio global por estudio siguió el algoritmo estándar de RoB 2:
- **Bajo riesgo de sesgo global**: Asignado si y solo si todos los cinco dominios fueron juzgados con bajo riesgo.
- **Algunas preocupaciones globales**: Asignado si el estudio presentó algunas preocupaciones en al menos un dominio, sin presentar alto riesgo en ninguno.
- **Alto riesgo de sesgo global**: Asignado si el estudio presentó alto riesgo de sesgo en al menos un dominio, o si acumuló algunas preocupaciones en múltiples dominios que comprometieron sustancialmente la confianza en el resultado.

Los registros de evaluación detallados se gestionaron mediante la plantilla oficial RoB 2 de riskofbias.info y los gráficos de semáforo ("traffic light plot") y de barras ponderadas se confeccionaron con el paquete 'robvis' (McGuinness & Higgins, 2021).`;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'methods') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + textToInsert };
        }
        return s;
      })
    );
    setActiveSectionKey('methods');
    setActiveTab('writer');
  };

  // Insert Summary of Findings Table into Results section
  const handleInsertGradeSoFTable = () => {
    let md = `\n\n### Tabla de Resumen de Hallazgos (Summary of Findings - GRADE) | Ítem 22 PRISMA 2020\n\n`;
    md += `| Desenlace | Estudios (Pacientes) | Efecto Relativo (IC 95%) | Riesgo Control | Riesgo Intervención | Certeza GRADE | Frase Informativa GRADE |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

    gradeOutcomes.forEach((o) => {
      const certaintySymbol =
        o.overallCertainty === 'high' ? '⊕⊕⊕⊕ ALTA' :
        o.overallCertainty === 'moderate' ? '⊕⊕⊕◯ MODERADA' :
        o.overallCertainty === 'low' ? '⊕⊕◯◯ BAJA' : '⊕◯◯◯ MUY BAJA';

      md += `| **${o.outcomeName}** (${o.importance === 'critical' ? 'Crítico' : 'Importante'}) | ${o.studyCount} (${o.participantCount.toLocaleString()}) | ${o.effectEstimate} | ${o.baselineRisk || 'N/D'} | ${o.interventionRisk || 'N/D'} | **${certaintySymbol}** | ${o.informativeStatement} |\n`;
    });

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'results') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + md };
        }
        return s;
      })
    );
    setActiveSectionKey('results');
    setActiveTab('writer');
  };

  // Insert Cochrane RoB 2 Results Table into Results section (PRISMA 2020 Item 18)
  const handleInsertRob2ResultsTable = () => {
    let md = `\n\n### Evaluación del Riesgo de Sesgo en los Estudios Incluidos (Cochrane RoB 2) | Ítem 18 PRISMA 2020\n\n`;
    md += `| Estudio y Año | Muestra (N) | D1: Aleatorización | D2: Desviaciones | D3: Datos Faltantes | D4: Medición | D5: Selección Reporte | Juicio Global |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
    rob2Studies.forEach((s) => {
      const d1 = s.d1Randomization === 'low' ? 'Bajo (+)' : s.d1Randomization === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d2 = s.d2Deviations === 'low' ? 'Bajo (+)' : s.d2Deviations === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d3 = s.d3MissingData === 'low' ? 'Bajo (+)' : s.d3MissingData === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d4 = s.d4Measurement === 'low' ? 'Bajo (+)' : s.d4Measurement === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d5 = s.d5ReportedResult === 'low' ? 'Bajo (+)' : s.d5ReportedResult === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const overall = s.overall === 'low' ? '**Bajo (+)**' : s.overall === 'some_concerns' ? '**Preocupación (?)**' : '**Alto (-)**';
      md += `| **${s.studyName}** (${s.year}) | ${s.sampleSize.toLocaleString()} | ${d1} | ${d2} | ${d3} | ${d4} | ${d5} | ${overall} |\n`;
    });
    md += `\n*Nota.* D1: Proceso de aleatorización; D2: Desviaciones de intervenciones previstas; D3: Datos de resultados faltantes; D4: Medición del resultado; D5: Selección del resultado informado. Juicio global asignado según el algoritmo estándar de Sterne et al. (2019, BMJ, 366:l4898).\n`;

    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'results') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + md };
        }
        return s;
      })
    );
    setActiveSectionKey('results');
    setActiveTab('writer');
  };

  const handleInsertMetaIntoMethods = (textToInsert?: string) => {
    const text = textToInsert || formatMetaMethodsText(metaConfig);
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'methods') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + text };
        }
        return s;
      })
    );
    setActiveSectionKey('methods');
    setActiveTab('writer');
  };

  const handleInsertMetaIntoResults = (textToInsert?: string) => {
    const text = textToInsert || formatMetaResultsText(metaConfig);
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'results') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + text };
        }
        return s;
      })
    );
    setActiveSectionKey('results');
    setActiveTab('writer');
  };

  const handleInsertMatrixIntoResults = (tableMarkdown?: string) => {
    const md = tableMarkdown || generateEvidenceMatrixMarkdown(evidenceStudies);
    const text = `\n\n### Características Metodológicas y Clínicas de los Estudios Incluidos (Ítem 17 PRISMA 2020)\n\nSe realizó la extracción sistemática de datos de los estudios primarios que cumplieron con todos los criterios de elegibilidad. La información clave correspondiente a diseño, tamaño de muestra ($N$), características de la población, brazos de intervención/comparador, estimadores numéricos primarios y conclusiones de los autores se sintetiza a continuación en la Matriz de Evidencia:\n\n${md}\n`;
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'results') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + text };
        }
        return s;
      })
    );
    setActiveSectionKey('results');
    setActiveTab('writer');
  };

  const handleInsertMatrixIntoMethods = (methodsText?: string) => {
    const text = methodsText || generateDataExtractionMethodsText();
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'methods') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + text };
        }
        return s;
      })
    );
    setActiveSectionKey('methods');
    setActiveTab('writer');
  };

  const handleNavigateToMetaFromOutcome = (outcome: CandidateOutcome) => {
    setMetaConfig((prev) => ({
      ...prev,
      outcomeName: outcome.name,
      effectMeasure: outcome.preferredEffectMeasure === 'MD' || outcome.preferredEffectMeasure === 'SMD' 
        ? outcome.preferredEffectMeasure 
        : outcome.preferredEffectMeasure === 'OR' 
        ? 'OR' 
        : outcome.preferredEffectMeasure === 'RR' 
        ? 'RR' 
        : 'HR',
    }));
    setActiveTab('meta');
  };

  const handleNavigateToGradeFromOutcome = (_outcome: CandidateOutcome) => {
    setActiveTab('grade');
  };

  const handleInsertOutcomesIntoMethods = (methodsText?: string) => {
    const text = methodsText || generateOutcomesMethodsText(candidateOutcomes);
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'methods') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + text };
        }
        return s;
      })
    );
    setActiveSectionKey('methods');
    setActiveTab('writer');
  };

  const handleInsertOutcomesIntoResults = (resultsTable?: string) => {
    const text = resultsTable || generateOutcomesHarmonizationMarkdown(candidateOutcomes);
    setSections((prev) =>
      prev.map((s) => {
        if (s.id === 'results') {
          const separator = s.content.trim().length > 0 ? '\n\n' : '';
          return { ...s, content: s.content + separator + text };
        }
        return s;
      })
    );
    setActiveSectionKey('results');
    setActiveTab('writer');
  };

  const completedChecklistCount = checklistItems.filter((i) => i.status === 'completed').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Global Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        completedItemsCount={completedChecklistCount}
        totalItemsCount={checklistItems.length}
        onOpenExport={() => setIsExportOpen(true)}
      />

      {/* Main Tab Content Area */}
      <main className="flex-1">
        {activeTab === 'chat' && (
          <ChatAssistant
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingChat}
            picoData={picoData}
            activeSectionKey={activeSectionKey}
            onApplyToSection={handleApplyToSection}
          />
        )}

        {activeTab === 'pico' && (
          <PicoBuilder
            picoData={picoData}
            onChangePico={setPicoData}
            onSendToChat={handleSendPromptToChat}
          />
        )}

        {activeTab === 'writer' && (
          <ModularWriter
            sections={sections}
            activeSectionKey={activeSectionKey}
            onSelectSection={setActiveSectionKey}
            onUpdateSectionContent={handleUpdateSectionContent}
            onToggleConfirmSection={handleToggleConfirmSection}
            picoData={picoData}
            checklistItems={checklistItems}
            onSendToChat={handleSendPromptToChat}
            onNavigateToGrade={() => setActiveTab('grade')}
            onInsertGradeMethods={handleInsertGradeIntoMethods}
            onInsertGradeSoFTable={handleInsertGradeSoFTable}
            onInsertRob2Methods={handleInsertRob2IntoMethods}
            onInsertRob2ResultsTable={handleInsertRob2ResultsTable}
            onNavigateToMeta={() => setActiveTab('meta')}
            onInsertMetaMethods={() => handleInsertMetaIntoMethods()}
            onInsertMetaResults={() => handleInsertMetaIntoResults()}
            onOpenExport={() => setIsExportOpen(true)}
            onNavigateToMatrix={() => setActiveTab('matrix')}
            onInsertMatrixResultsTable={() => handleInsertMatrixIntoResults()}
            onInsertMatrixMethods={() => handleInsertMatrixIntoMethods()}
            onNavigateToOutcomes={() => setActiveTab('outcomes')}
            onInsertOutcomesMethods={() => handleInsertOutcomesIntoMethods()}
            onInsertOutcomesResults={() => handleInsertOutcomesIntoResults()}
          />
        )}

        {activeTab === 'matrix' && (
          <EvidenceMatrixView
            studies={evidenceStudies}
            onUpdateStudies={setEvidenceStudies}
            picoContext={picoData}
            onInsertIntoResults={handleInsertMatrixIntoResults}
            onInsertIntoMethods={handleInsertMatrixIntoMethods}
          />
        )}

        {activeTab === 'outcomes' && (
          <OutcomesIdentifierView
            outcomes={candidateOutcomes}
            onUpdateOutcomes={setCandidateOutcomes}
            evidenceStudies={evidenceStudies}
            picoContext={picoData}
            onNavigateToMeta={handleNavigateToMetaFromOutcome}
            onNavigateToGrade={handleNavigateToGradeFromOutcome}
            onInsertIntoMethods={handleInsertOutcomesIntoMethods}
            onInsertIntoResults={handleInsertOutcomesIntoResults}
          />
        )}

        {activeTab === 'meta' && (
          <MetaAnalysisConfig
            config={metaConfig}
            onChangeConfig={setMetaConfig}
            candidateOutcomes={candidateOutcomes}
            evidenceStudies={evidenceStudies}
            rob2Studies={rob2Studies}
            onInsertIntoMethods={handleInsertMetaIntoMethods}
            onInsertIntoResults={handleInsertMetaIntoResults}
            onNavigateToWriter={(sec) => {
              setActiveSectionKey(sec);
              setActiveTab('writer');
            }}
          />
        )}

        {activeTab === 'grade' && (
          <GradeEvaluator
            gradeOutcomes={gradeOutcomes}
            onChangeGradeOutcomes={setGradeOutcomes}
            onInsertIntoMethods={handleInsertGradeIntoMethods}
            onSendToChat={handleSendPromptToChat}
          />
        )}

        {activeTab === 'flow' && (
          <FlowDiagramViewer
            flowData={flowData}
            onChangeFlowData={setFlowData}
            onSendToChat={handleSendPromptToChat}
          />
        )}

        {activeTab === 'checklist' && (
          <ChecklistTable
            items={checklistItems}
            onUpdateItem={handleUpdateChecklistItem}
            onSendToChat={handleSendPromptToChat}
          />
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        sections={sections}
        picoData={picoData}
        checklistItems={checklistItems}
        flowData={flowData}
        gradeOutcomes={gradeOutcomes}
        metaConfig={metaConfig}
        rob2Studies={rob2Studies}
        evidenceStudies={evidenceStudies}
        candidateOutcomes={candidateOutcomes}
      />
    </div>
  );
}
