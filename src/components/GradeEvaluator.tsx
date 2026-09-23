import React, { useState } from 'react';
import { 
  Award, 
  HelpCircle, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Table as TableIcon, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Sparkles, 
  AlertCircle,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { GradeOutcomeAssessment, GradeCertaintyLevel } from '../types';
import { calculateGradeCertainty } from '../data/initialGrade';

interface GradeEvaluatorProps {
  gradeOutcomes: GradeOutcomeAssessment[];
  onChangeGradeOutcomes: (outcomes: GradeOutcomeAssessment[]) => void;
  onInsertIntoMethods: (methodsText: string) => void;
  onSendToChat: (prompt: string) => void;
}

export const GradeEvaluator: React.FC<GradeEvaluatorProps> = ({
  gradeOutcomes,
  onChangeGradeOutcomes,
  onInsertIntoMethods,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'evaluator' | 'sof-table' | 'methods-text'>('evaluator');
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(gradeOutcomes[0]?.id || '');
  const [copiedMethods, setCopiedMethods] = useState(false);
  const [copiedSoF, setCopiedSoF] = useState(false);
  const [insertedSuccess, setInsertedSuccess] = useState(false);

  const selectedOutcome = gradeOutcomes.find((o) => o.id === selectedOutcomeId) || gradeOutcomes[0];

  const handleUpdateSelected = (updatedFields: Partial<GradeOutcomeAssessment>) => {
    if (!selectedOutcome) return;
    const merged = { ...selectedOutcome, ...updatedFields };
    const { overallCertainty, informativeStatement, footnotes } = calculateGradeCertainty(merged);
    const updatedOutcome: GradeOutcomeAssessment = {
      ...merged,
      overallCertainty,
      informativeStatement,
      footnotes,
    };

    const nextList = gradeOutcomes.map((o) => (o.id === selectedOutcome.id ? updatedOutcome : o));
    onChangeGradeOutcomes(nextList);
  };

  const handleAddOutcome = () => {
    const newId = Date.now().toString();
    const newOutcomeBase: Omit<GradeOutcomeAssessment, 'overallCertainty' | 'informativeStatement' | 'footnotes'> = {
      id: newId,
      outcomeName: 'Nuevo desenlace clínico',
      importance: 'critical',
      studyType: 'rct',
      studyCount: 1,
      participantCount: 500,
      effectEstimate: 'RR 0.85 (IC 95%: 0.70 a 1.05)',
      baselineRisk: '100 por 1,000',
      interventionRisk: '85 por 1,000',
      riskDifference: '15 menos por 1,000',
      riskOfBias: { level: 0, justification: 'Sin limitaciones graves detectadas.' },
      inconsistency: { level: 0, justification: 'I² < 25%, estimaciones homogéneas.' },
      indirectness: { level: 0, justification: 'Evidencia directa según criterios PICO.' },
      imprecision: { level: 0, justification: 'Intervalo de confianza preciso.' },
      publicationBias: { level: 0, justification: 'No sospechado.' },
      largeEffect: { level: 0, justification: '' },
      doseResponse: { level: 0, justification: '' },
      residualConfounding: { level: 0, justification: '' },
    };

    const { overallCertainty, informativeStatement, footnotes } = calculateGradeCertainty(newOutcomeBase);
    const newOutcome: GradeOutcomeAssessment = {
      ...newOutcomeBase,
      overallCertainty,
      informativeStatement,
      footnotes,
    };

    onChangeGradeOutcomes([...gradeOutcomes, newOutcome]);
    setSelectedOutcomeId(newId);
  };

  const handleDeleteOutcome = (id: string) => {
    if (gradeOutcomes.length <= 1) return;
    const filtered = gradeOutcomes.filter((o) => o.id !== id);
    onChangeGradeOutcomes(filtered);
    if (selectedOutcomeId === id) {
      setSelectedOutcomeId(filtered[0].id);
    }
  };

  // Generate canonical Methods text for PRISMA 2020 Item 15
  const generateMethodsGradeParagraph = () => {
    return `### Evaluación de la Certeza de la Evidencia (Enfoque GRADE) - Ítem 15 PRISMA 2020
Dos investigadores evaluaron de forma independiente la certeza del cuerpo de evidencia para cada desenlace clínico preespecificado (críticos e importantes) utilizando el enfoque GRADE (Grading of Recommendations Assessment, Development and Evaluation) [Guyatt et al., BMJ 2008; Schünemann et al., GRADE Handbook].

Para los ensayos clínicos aleatorizados, la certeza inicial se estableció en "Alta", pudiendo disminuir en uno o dos niveles según la presencia de limitaciones en cinco dominios específicos:
1. **Riesgo de sesgo**: evaluado mediante la herramienta Cochrane RoB 2 para cada dominio de aleatorización, desvíos, datos incompletos, medición del desenlace y reporte selectivo.
2. **Inconsistencia**: evaluada analizando la superposición de los intervalos de confianza, la dirección del efecto y la estadística I² de heterogeneidad (considerando I² > 50% como heterogeneidad sustancial).
3. **Evidencia indirecta**: valorando las discrepancias entre la población, intervención, comparador o desenlaces evaluados y la pregunta PICO original de la revisión.
4. **Imprecisión**: examinando si el intervalo de confianza del 95% del estimador agrupado cruzaba el umbral de efecto nulo y la mínima diferencia clínicamente importante (MCID), así como el cumplimiento del tamaño óptimo de información (OIS).
5. **Sesgo de publicación**: evaluado mediante inspección visual de gráficos en embudo (funnel plots) y la prueba de regresión de Egger (cuando se dispuso de al menos 10 estudios).

Cualquier discrepancia entre los revisores fue resuelta mediante consenso o con la intervención de un tercer metodólogo sénior. La certeza global se clasificó en cuatro niveles estandarizados: Alta (⊕⊕⊕⊕), Moderada (⊕⊕⊕◯), Baja (⊕⊕◯◯) o Muy Baja (⊕◯◯◯). Se generó una Tabla de Resumen de Hallazgos (Summary of Findings, SoF) mediante el software GRADEpro GDT (McMaster University/Evidence Prime). La comunicación de los hallazgos se formuló empleando las frases estándar recomendadas por el grupo de trabajo GRADE [Santesso et al., J Clin Epidemiol 2020].`;
  };

  // Generate Summary of Findings Markdown Table (PRISMA Item 22)
  const generateSoFMarkdown = () => {
    let md = `### Tabla de Resumen de Hallazgos (Summary of Findings - GRADE) | PRISMA 2020 Ítem 22\n\n`;
    md += `| Desenlace | Estudios (Nº participantes) | Efecto Relativo (IC 95%) | Riesgo Absoluto Basal | Riesgo Absoluto con Intervención | Certeza de la Evidencia (GRADE) | Frase Informativa GRADE |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

    gradeOutcomes.forEach((o) => {
      const certaintySymbol = 
        o.overallCertainty === 'high' ? '⊕⊕⊕⊕ ALTA' :
        o.overallCertainty === 'moderate' ? '⊕⊕⊕◯ MODERADA' :
        o.overallCertainty === 'low' ? '⊕⊕◯◯ BAJA' : '⊕◯◯◯ MUY BAJA';
      
      md += `| **${o.outcomeName}** (${o.importance === 'critical' ? 'Crítico' : 'Importante'}) | ${o.studyCount} (${o.participantCount.toLocaleString()}) | ${o.effectEstimate} | ${o.baselineRisk || 'N/D'} | ${o.interventionRisk || 'N/D'} | **${certaintySymbol}** | ${o.informativeStatement} |\n`;
    });

    md += `\n**Notas y explicaciones GRADE**:\n`;
    gradeOutcomes.forEach((o) => {
      if (o.footnotes && o.footnotes.length > 0) {
        md += `- **${o.outcomeName}**: ${o.footnotes.join('; ')}\n`;
      }
    });

    return md;
  };

  const handleCopyMethodsText = () => {
    navigator.clipboard.writeText(generateMethodsGradeParagraph());
    setCopiedMethods(true);
    setTimeout(() => setCopiedMethods(false), 2000);
  };

  const handleCopySoF = () => {
    navigator.clipboard.writeText(generateSoFMarkdown());
    setCopiedSoF(true);
    setTimeout(() => setCopiedSoF(false), 2000);
  };

  const handleInsertMethods = () => {
    onInsertIntoMethods(generateMethodsGradeParagraph());
    setInsertedSuccess(true);
    setTimeout(() => setInsertedSuccess(false), 3000);
  };

  const getCertaintyBadge = (level: GradeCertaintyLevel) => {
    switch (level) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <span>⊕⊕⊕⊕</span>
            <span>ALTA</span>
          </span>
        );
      case 'moderate':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <span>⊕⊕⊕◯</span>
            <span>MODERADA</span>
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <span>⊕⊕◯◯</span>
            <span>BAJA</span>
          </span>
        );
      case 'very_low':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <span>⊕◯◯◯</span>
            <span>MUY BAJA</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Evaluación de la Certeza de la Evidencia (GRADE) | Ítems 15 y 22 PRISMA 2020
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Metodología formal para graduar la confianza en el estimador del efecto (Guyatt GH et al. BMJ 2008 / Schünemann H et al. GRADE Handbook).
          </p>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('evaluator')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'evaluator' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Evaluador por Desenlace
            </button>
            <button
              onClick={() => setActiveTab('sof-table')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sof-table' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              Tabla SoF (Ítem 22)
            </button>
            <button
              onClick={() => setActiveTab('methods-text')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'methods-text' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Redacción Métodos (Ítem 15)
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'evaluator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Outcomes list (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Desenlaces PICO ({gradeOutcomes.length})
              </span>
              <button
                type="button"
                onClick={handleAddOutcome}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir desenlace
              </button>
            </div>

            <div className="space-y-2">
              {gradeOutcomes.map((outcome) => {
                const isSelected = outcome.id === selectedOutcome.id;
                return (
                  <div
                    key={outcome.id}
                    onClick={() => setSelectedOutcomeId(outcome.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-300 shadow-xs ring-1 ring-indigo-200'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isSelected ? 'text-indigo-950' : 'text-slate-800'}`}>
                            {outcome.outcomeName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                          {outcome.effectEstimate} • {outcome.studyCount} estudios ({outcome.participantCount.toLocaleString()} pts)
                        </p>
                      </div>

                      <div>{getCertaintyBadge(outcome.overallCertainty)}</div>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${outcome.importance === 'critical' ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                        {outcome.importance === 'critical' ? 'Crítico para decisión' : 'Importante'}
                      </span>
                      {gradeOutcomes.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOutcome(outcome.id);
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer"
                          title="Eliminar desenlace"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick guide card */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Reglas Canónicas GRADE</span>
              </div>
              <ul className="text-[11px] space-y-1 pl-4 list-disc text-slate-600">
                <li><strong>Ensayos Clínicos Aleatorizados</strong> inician con certeza <strong>Alta (4 puntos)</strong>.</li>
                <li><strong>Estudios Observacionales</strong> inician con certeza <strong>Baja (2 puntos)</strong>.</li>
                <li>5 dominios pueden <strong>degradar</strong> (-1 ó -2): Sesgo, Inconsistencia, Evidencia indirecta, Imprecisión, Sesgo de publicación.</li>
                <li>3 dominios pueden <strong>aumentar</strong> (+1 ó +2): Gran efecto, Dosis-respuesta, Confusión residual.</li>
              </ul>
            </div>
          </div>

          {/* Right Column: Detailed GRADE Domain Assessor (8 cols) */}
          <div className="lg:col-span-8 space-y-5">
            {selectedOutcome && (
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
                {/* Outcome Header & Overall Certainty Result */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={selectedOutcome.outcomeName}
                        onChange={(e) => handleUpdateSelected({ outcomeName: e.target.value })}
                        className="text-base font-bold text-slate-900 border-b border-transparent hover:border-slate-300 focus:border-indigo-600 focus:outline-hidden px-1 rounded"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                      <label className="flex items-center gap-1">
                        <span>Importancia:</span>
                        <select
                          value={selectedOutcome.importance}
                          onChange={(e) => handleUpdateSelected({ importance: e.target.value as any })}
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-semibold"
                        >
                          <option value="critical">Crítico para toma de decisiones</option>
                          <option value="important">Importante pero no crítico</option>
                        </select>
                      </label>
                      <label className="flex items-center gap-1">
                        <span>Diseño base:</span>
                        <select
                          value={selectedOutcome.studyType}
                          onChange={(e) => handleUpdateSelected({ studyType: e.target.value as any })}
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-xs text-slate-800 font-semibold"
                        >
                          <option value="rct">Ensayos Clínicos Aleatorizados (Inicia Alta)</option>
                          <option value="observational">Estudios Observacionales (Inicia Baja)</option>
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1">
                      Certeza Global Resultante
                    </span>
                    {getCertaintyBadge(selectedOutcome.overallCertainty)}
                  </div>
                </div>

                {/* Quantitative Data Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nº Estudios</label>
                    <input
                      type="number"
                      value={selectedOutcome.studyCount}
                      onChange={(e) => handleUpdateSelected({ studyCount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nº Participantes</label>
                    <input
                      type="number"
                      value={selectedOutcome.participantCount}
                      onChange={(e) => handleUpdateSelected({ participantCount: parseInt(e.target.value) || 0 })}
                      className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Estimador Efecto Relativo</label>
                    <input
                      type="text"
                      value={selectedOutcome.effectEstimate}
                      onChange={(e) => handleUpdateSelected({ effectEstimate: e.target.value })}
                      placeholder="Ej. RR 0.83 (IC 95%: 0.75-0.92)"
                      className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Diferencia Absoluta</label>
                    <input
                      type="text"
                      value={selectedOutcome.riskDifference || ''}
                      onChange={(e) => handleUpdateSelected({ riskDifference: e.target.value })}
                      placeholder="Ej. 23 menos por 1,000"
                      className="w-full bg-white px-2 py-1 rounded border border-slate-200 text-xs font-semibold"
                    />
                  </div>
                </div>

                {/* Section: 5 Downgrade Domains */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ArrowDownCircle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Los 5 Dominios de Degradación (Downgrade)
                    </h4>
                  </div>

                  <div className="space-y-3">
                    {/* Domain 1: Risk of Bias */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <strong className="text-slate-800">1. Riesgo de Sesgo (Risk of Bias / Limitaciones de diseño):</strong>
                          <span className="text-[11px] text-slate-500 block">Evaluado con RoB 2, ROBINS-I o Newcastle-Ottawa.</span>
                        </div>
                        <select
                          value={selectedOutcome.riskOfBias.level}
                          onChange={(e) =>
                            handleUpdateSelected({
                              riskOfBias: { ...selectedOutcome.riskOfBias, level: parseInt(e.target.value) },
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-slate-50"
                        >
                          <option value={0}>No grave (0) - Sin degradación</option>
                          <option value={-1}>Grave (-1) - Degradación de 1 nivel</option>
                          <option value={-2}>Muy grave (-2) - Degradación de 2 niveles</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={selectedOutcome.riskOfBias.justification}
                        onChange={(e) =>
                          handleUpdateSelected({
                            riskOfBias: { ...selectedOutcome.riskOfBias, justification: e.target.value },
                          })
                        }
                        placeholder="Justificación metodológica (ej. Ensayos con bajo riesgo global en aleatorización y enmascaramiento)..."
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800"
                      />
                    </div>

                    {/* Domain 2: Inconsistency */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <strong className="text-slate-800">2. Inconsistencia (Inconsistency / Heterogeneidad):</strong>
                          <span className="text-[11px] text-slate-500 block">Variabilidad en la dirección de estimaciones, I² {'>'} 50% o p {`<`} 0.10.</span>
                        </div>
                        <select
                          value={selectedOutcome.inconsistency.level}
                          onChange={(e) =>
                            handleUpdateSelected({
                              inconsistency: { ...selectedOutcome.inconsistency, level: parseInt(e.target.value) },
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-slate-50"
                        >
                          <option value={0}>No grave (0) - Homogeneidad adecuada</option>
                          <option value={-1}>Grave (-1) - Heterogeneidad no explicada</option>
                          <option value={-2}>Muy grave (-2) - Gran inconsistencia clínica y estadística</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={selectedOutcome.inconsistency.justification}
                        onChange={(e) =>
                          handleUpdateSelected({
                            inconsistency: { ...selectedOutcome.inconsistency, justification: e.target.value },
                          })
                        }
                        placeholder="Justificación (ej. Homogeneidad consistente entre ensayos, I² = 0%)..."
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800"
                      />
                    </div>

                    {/* Domain 3: Indirectness */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <strong className="text-slate-800">3. Evidencia Indirecta (Indirectness):</strong>
                          <span className="text-[11px] text-slate-500 block">Diferencias en población, comparador o uso de desenlaces subrogados.</span>
                        </div>
                        <select
                          value={selectedOutcome.indirectness.level}
                          onChange={(e) =>
                            handleUpdateSelected({
                              indirectness: { ...selectedOutcome.indirectness, level: parseInt(e.target.value) },
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-slate-50"
                        >
                          <option value={0}>No grave (0) - Evidencia directa de la pregunta PICO</option>
                          <option value={-1}>Grave (-1) - Evidencia indirecta sustancial</option>
                          <option value={-2}>Muy grave (-2) - Población o desenlace muy distante</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={selectedOutcome.indirectness.justification}
                        onChange={(e) =>
                          handleUpdateSelected({
                            indirectness: { ...selectedOutcome.indirectness, justification: e.target.value },
                          })
                        }
                        placeholder="Justificación (ej. Medición directa en población diana con el comparador exacto)..."
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800"
                      />
                    </div>

                    {/* Domain 4: Imprecision */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <strong className="text-slate-800">4. Imprecisión (Imprecision):</strong>
                          <span className="text-[11px] text-slate-500 block">IC 95% cruza la línea de no efecto o umbral MCID; tamaño muestral no alcanza OIS.</span>
                        </div>
                        <select
                          value={selectedOutcome.imprecision.level}
                          onChange={(e) =>
                            handleUpdateSelected({
                              imprecision: { ...selectedOutcome.imprecision, level: parseInt(e.target.value) },
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-slate-50"
                        >
                          <option value={0}>No grave (0) - Estimación precisa y supera OIS</option>
                          <option value={-1}>Grave (-1) - IC amplio que cruza MCID o bajo número de eventos</option>
                          <option value={-2}>Muy grave (-2) - IC extremadamente amplio que abarca daño y beneficio</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={selectedOutcome.imprecision.justification}
                        onChange={(e) =>
                          handleUpdateSelected({
                            imprecision: { ...selectedOutcome.imprecision, justification: e.target.value },
                          })
                        }
                        placeholder="Justificación (ej. Tamaño muestral acumulado amplio e IC estrecho)..."
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800"
                      />
                    </div>

                    {/* Domain 5: Publication Bias */}
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <strong className="text-slate-800">5. Sesgo de Publicación (Publication Bias):</strong>
                          <span className="text-[11px] text-slate-500 block">Asimetría en funnel plot, prueba de Egger p {`<`} 0.10 o estudios no publicados.</span>
                        </div>
                        <select
                          value={selectedOutcome.publicationBias.level}
                          onChange={(e) =>
                            handleUpdateSelected({
                              publicationBias: { ...selectedOutcome.publicationBias, level: parseInt(e.target.value) },
                            })
                          }
                          className="px-2 py-1 rounded border border-slate-200 text-xs font-semibold bg-slate-50"
                        >
                          <option value={0}>No detectado / No sospechado (0)</option>
                          <option value={-1}>Sospechado (-1)</option>
                          <option value={-2}>Fuertemente sospechado (-2)</option>
                        </select>
                      </div>
                      <input
                        type="text"
                        value={selectedOutcome.publicationBias.justification}
                        onChange={(e) =>
                          handleUpdateSelected({
                            publicationBias: { ...selectedOutcome.publicationBias, justification: e.target.value },
                          })
                        }
                        placeholder="Justificación (ej. Funnel plot simétrico y prueba de Egger p = 0.42)..."
                        className="w-full text-xs px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800"
                      />
                    </div>
                  </div>
                </div>

                {/* Section: 3 Upgrade Domains (Collapsible / Optional) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                    <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Los 3 Dominios de Aumento (Upgrade) — Principalmente Observacionales
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-800">Gran magnitud de efecto:</div>
                      <select
                        value={selectedOutcome.largeEffect.level}
                        onChange={(e) =>
                          handleUpdateSelected({
                            largeEffect: { ...selectedOutcome.largeEffect, level: parseInt(e.target.value) },
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs bg-slate-50 font-semibold"
                      >
                        <option value={0}>No aplica (0)</option>
                        <option value={1}>Gran efecto: RR {'>'} 2 o {'<'} 0.5 (+1)</option>
                        <option value={2}>Muy gran efecto: RR {'>'} 5 o {'<'} 0.2 (+2)</option>
                      </select>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-800">Gradiente dosis-respuesta:</div>
                      <select
                        value={selectedOutcome.doseResponse.level}
                        onChange={(e) =>
                          handleUpdateSelected({
                            doseResponse: { ...selectedOutcome.doseResponse, level: parseInt(e.target.value) },
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs bg-slate-50 font-semibold"
                      >
                        <option value={0}>No observado (0)</option>
                        <option value={1}>Presente y consistente (+1)</option>
                      </select>
                    </div>

                    <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 text-xs">
                      <div className="font-semibold text-slate-800">Confusión residual plausible:</div>
                      <select
                        value={selectedOutcome.residualConfounding.level}
                        onChange={(e) =>
                          handleUpdateSelected({
                            residualConfounding: { ...selectedOutcome.residualConfounding, level: parseInt(e.target.value) },
                          })
                        }
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs bg-slate-50 font-semibold"
                      >
                        <option value={0}>No aplica (0)</option>
                        <option value={1}>Subestimaría el efecto real (+1)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Formatted GRADE Informative Statement (Santesso et al. 2020) */}
                <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-indigo-950">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Frase Informativa Recomendada por GRADE (Santesso et al. 2020)
                    </span>
                    <button
                      onClick={() =>
                        onSendToChat(
                          `Analiza la evaluación GRADE para el desenlace "${selectedOutcome.outcomeName}". Estimador: ${selectedOutcome.effectEstimate}, Sesgo: ${selectedOutcome.riskOfBias.level}, Inconsistencia: ${selectedOutcome.inconsistency.level}, Imprecisión: ${selectedOutcome.imprecision.level}. ¿La certeza resultante (${selectedOutcome.overallCertainty}) es metodológicamente sólida o requiere algún matiz?`
                        )
                      }
                      className="text-indigo-600 hover:text-indigo-800 text-[11px] font-semibold cursor-pointer"
                    >
                      Discutir con Copiloto →
                    </button>
                  </div>
                  <div className="text-slate-800 font-medium leading-relaxed bg-white p-3 rounded-lg border border-indigo-100">
                    {selectedOutcome.informativeStatement}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* View 2: Summary of Findings (SoF) Table (PRISMA Item 22) */}
      {activeTab === 'sof-table' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tabla de Resumen de Hallazgos (Summary of Findings - SoF) | Ítem 22 PRISMA 2020
              </h3>
              <p className="text-xs text-slate-500">
                Tabla obligatoria que sintetiza los desenlaces principales, los estimadores del efecto y la certeza de la evidencia.
              </p>
            </div>

            <button
              onClick={handleCopySoF}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition-colors shadow-xs"
            >
              {copiedSoF ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSoF ? 'Tabla Copiada' : 'Copiar Tabla SoF (Markdown)'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Desenlace</th>
                  <th className="py-3 px-3">Nº Estudios (Pacientes)</th>
                  <th className="py-3 px-3">Efecto Relativo (IC 95%)</th>
                  <th className="py-3 px-3">Riesgo con Control</th>
                  <th className="py-3 px-3">Riesgo con Intervención</th>
                  <th className="py-3 px-3">Certeza GRADE</th>
                  <th className="py-3 px-3">Declaración Informativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {gradeOutcomes.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div>{o.outcomeName}</div>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${o.importance === 'critical' ? 'text-rose-700 bg-rose-50' : 'text-slate-500 bg-slate-100'}`}>
                        {o.importance === 'critical' ? 'Crítico' : 'Importante'}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px]">
                      {o.studyCount} ({o.participantCount.toLocaleString()})
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] font-semibold text-slate-800">
                      {o.effectEstimate}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      {o.baselineRisk || 'N/D'}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-600">
                      {o.interventionRisk || 'N/D'}
                    </td>
                    <td className="py-3 px-3">
                      {getCertaintyBadge(o.overallCertainty)}
                    </td>
                    <td className="py-3 px-3 text-[11px] text-slate-700 leading-snug">
                      {o.informativeStatement}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Footnotes */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-1">
            <span className="font-semibold text-slate-700">Notas explicativas de degradación:</span>
            {gradeOutcomes.map((o) => (
              o.footnotes.length > 0 && (
                <div key={o.id} className="pl-2">
                  • <strong>{o.outcomeName}</strong>: {o.footnotes.join('; ')}
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* View 3: Methods Text Generator (PRISMA Item 15) */}
      {activeTab === 'methods-text' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Subsección Metodológica: Evaluación de Certeza (Ítem 15 PRISMA 2020)
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Texto estructurado con lenguaje científico formal y riguroso para ser incorporado en la sección de Métodos.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="btn-copy-grade-methods-text"
                onClick={handleCopyMethodsText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
              >
                {copiedMethods ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedMethods ? 'Copiado' : 'Copiar Texto'}</span>
              </button>

              <button
                id="btn-insert-grade-into-methods"
                onClick={handleInsertMethods}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                {insertedSuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> : <Plus className="w-3.5 h-3.5" />}
                <span>{insertedSuccess ? '¡Insertado en Métodos!' : 'Insertar en Sección Métodos del Manuscrito'}</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
            {generateMethodsGradeParagraph()}
          </div>
        </div>
      )}
    </div>
  );
};
