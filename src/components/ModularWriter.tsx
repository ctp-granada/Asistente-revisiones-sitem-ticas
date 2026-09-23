import React, { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  Copy, 
  ChevronRight, 
  Lock, 
  Unlock, 
  RotateCcw,
  BookOpen,
  Info,
  Award,
  Plus,
  ShieldCheck,
  Calculator,
  ChevronDown,
  ChevronUp,
  Layers,
  Download,
  FileSpreadsheet,
  Target
} from 'lucide-react';
import { ManuscriptSection, PicoData, PrismaChecklistItem, PrismaSectionKey } from '../types';
import { StatsCalculator } from './StatsCalculator';

interface ModularWriterProps {
  sections: ManuscriptSection[];
  activeSectionKey: PrismaSectionKey;
  onSelectSection: (key: PrismaSectionKey) => void;
  onUpdateSectionContent: (key: PrismaSectionKey, content: string) => void;
  onToggleConfirmSection: (key: PrismaSectionKey) => void;
  picoData: PicoData;
  checklistItems: PrismaChecklistItem[];
  onSendToChat: (prompt: string) => void;
  onNavigateToGrade?: () => void;
  onInsertGradeMethods?: () => void;
  onInsertGradeSoFTable?: () => void;
  onInsertRob2Methods?: () => void;
  onInsertRob2ResultsTable?: () => void;
  onNavigateToMeta?: () => void;
  onInsertMetaMethods?: () => void;
  onInsertMetaResults?: () => void;
  onOpenExport?: () => void;
  onNavigateToMatrix?: () => void;
  onInsertMatrixResultsTable?: () => void;
  onInsertMatrixMethods?: () => void;
  onNavigateToOutcomes?: () => void;
  onInsertOutcomesMethods?: () => void;
  onInsertOutcomesResults?: () => void;
}

export const ModularWriter: React.FC<ModularWriterProps> = ({
  sections,
  activeSectionKey,
  onSelectSection,
  onUpdateSectionContent,
  onToggleConfirmSection,
  picoData,
  checklistItems,
  onSendToChat,
  onNavigateToGrade,
  onInsertGradeMethods,
  onInsertGradeSoFTable,
  onInsertRob2Methods,
  onInsertRob2ResultsTable,
  onNavigateToMeta,
  onInsertMetaMethods,
  onInsertMetaResults,
  onOpenExport,
  onNavigateToMatrix,
  onInsertMatrixResultsTable,
  onInsertMatrixMethods,
  onNavigateToOutcomes,
  onInsertOutcomesMethods,
  onInsertOutcomesResults,
}) => {
  const [isDrafting, setIsDrafting] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showStatsCalc, setShowStatsCalc] = useState(false);

  const currentSection = sections.find((s) => s.id === activeSectionKey) || sections[0];
  const relatedChecklistItems = checklistItems.filter((item) =>
    currentSection.prismaItemNumbers.includes(item.itemNumber)
  );

  const handleInsertFromStats = (textToInsert: string) => {
    const currentContent = currentSection.content.trim();
    const separator = currentContent.length > 0 ? '\n\n' : '';
    onUpdateSectionContent(currentSection.id, currentContent + separator + textToInsert);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentSection.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateDraft = async () => {
    setIsDrafting(true);
    setAuditResult(null);
    try {
      const res = await fetch('/api/draft-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionKey: currentSection.title,
          picoData,
          currentContent: currentSection.content,
          userInstructions: `Redacta la sección "${currentSection.title}" asegurando el cumplimiento de los ítems PRISMA 2020: ${currentSection.prismaItemNumbers.join(', ')}. No inventes datos numéricos ni fechas de búsqueda no especificadas; utiliza marcadores [PENDIENTE: ...].`,
        }),
      });
      const data = await res.json();
      if (data.text) {
        onUpdateSectionContent(currentSection.id, data.text);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAuditSection = async () => {
    if (!currentSection.content.trim()) return;
    setIsAuditing(true);
    try {
      const res = await fetch('/api/audit-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionName: currentSection.title,
          sectionText: currentSection.content,
          prismaItemNumbers: currentSection.prismaItemNumbers,
        }),
      });
      const data = await res.json();
      if (data.audit) {
        setAuditResult(data.audit);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const insertPlaceholder = (tag: string) => {
    const textToInsert = ` [PENDIENTE: ${tag}] `;
    onUpdateSectionContent(currentSection.id, currentSection.content + textToInsert);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner explaining Modular Workflow */}
      <div className="bg-slate-900 text-slate-100 p-4 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Redacción Modular Académica (PRISMA 2020)
            </h2>
            <p className="text-xs text-slate-300">
              Directriz metodológica 4: Trabajo sección por sección previa confirmación del investigador con estricto control de datos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-300">
            Confirmadas: <strong>{sections.filter((s) => s.isConfirmed).length} de {sections.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Grid: Left navigation of sections, Right editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sections List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Secciones del Manuscrito
          </div>
          {sections.map((section, idx) => {
            const isSelected = section.id === activeSectionKey;
            const hasContent = section.content.trim().length > 0;
            return (
              <div
                key={section.id}
                onClick={() => onSelectSection(section.id)}
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
                        {section.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                      {section.subtitle}
                    </p>
                  </div>

                  <div>
                    {section.isConfirmed ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300" title="Sección confirmada y aprobada por el investigador">
                        <CheckCircle className="w-3 h-3 text-emerald-600" />
                        Validada
                      </span>
                    ) : hasContent ? (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        Borrador
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin iniciar</span>
                    )}
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>Ítems PRISMA: {section.prismaItemNumbers.join(', ')}</span>
                  <span>{section.content.length} caracteres</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Active Section Editor & Auditor (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
            {/* Header of Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {currentSection.title}
                  </h3>
                  {currentSection.isConfirmed && (
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Confirmada por el usuario
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {currentSection.subtitle}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {onOpenExport && (
                  <button
                    id="btn-modular-export"
                    onClick={onOpenExport}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Abrir modal de exportación académica avanzada"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Exportar Manuscrito</span>
                  </button>
                )}

                <button
                  id="btn-copy-section-content"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Copiar texto de la sección"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </button>

                <button
                  id="btn-toggle-confirm-section"
                  onClick={() => onToggleConfirmSection(currentSection.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 border ${
                    currentSection.isConfirmed
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {currentSection.isConfirmed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{currentSection.isConfirmed ? 'Confirmada (Bloquear)' : 'Confirmar Sección'}</span>
                </button>
              </div>
            </div>

            {/* Applicable PRISMA 2020 Checklist Items Accordion/Pills */}
            <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                <span>Directrices PRISMA 2020 para esta sección:</span>
                <span className="text-[11px] font-normal text-slate-500">
                  {relatedChecklistItems.length} ítems auditables
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {relatedChecklistItems.map((item) => (
                  <div key={item.itemNumber} className="bg-white p-2.5 rounded border border-slate-200 text-xs">
                    <div className="font-semibold text-indigo-700">
                      Ítem {item.itemNumber}: {item.topic}
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                      {item.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Extraction banner for Methods (Item 10) */}
            {currentSection.id === 'methods' && (
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-teal-600 text-white rounded-md shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-teal-950 font-bold block">
                      Proceso de Extracción de Datos Estandarizado (Ítems 10a y 10b PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Metodología de extracción independiente por duplicado, resolución de discrepancias, extracción directa de PDFs e imputación estricta de 'No reportado'.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertMatrixMethods && (
                    <button
                      type="button"
                      id="btn-modular-insert-matrix-methods"
                      onClick={onInsertMatrixMethods}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Párrafo Ítem 10
                    </button>
                  )}
                  {onNavigateToMatrix && (
                    <button
                      type="button"
                      onClick={onNavigateToMatrix}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-teal-800 border border-teal-300 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Abrir Matriz PDF</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Outcomes & Variables Specification banner for Methods (Item 10b & 13a) */}
            {currentSection.id === 'methods' && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-md shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-emerald-950 font-bold block">
                      Definición de Desenlaces y Criterios de Síntesis (Ítems 10b y 13a PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Inserta el párrafo metodológico formal con la priorización jerárquica de outcomes (primarios, secundarios, seguridad y subgrupos) y criterios de combinabilidad.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertOutcomesMethods && (
                    <button
                      type="button"
                      id="btn-modular-insert-outcomes-methods"
                      onClick={onInsertOutcomesMethods}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Ítem 10b/13a
                    </button>
                  )}
                  {onNavigateToOutcomes && (
                    <button
                      type="button"
                      onClick={onNavigateToOutcomes}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Catálogo Variables</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* RoB 2 Evaluation banner for Methods (Item 11) */}
            {currentSection.id === 'methods' && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-600 text-white rounded-md shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-amber-950 font-bold block">
                      Evaluación de Riesgo de Sesgo (Cochrane RoB 2 - Ítem 11 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Plantilla metodológica formal: 5 dominios (D1 aleatorización, D2 desviaciones, D3 datos faltantes, D4 medición, D5 reporte selectivo), regla del peor juicio y doble revisión independiente.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertRob2Methods && (
                    <button
                      type="button"
                      id="btn-modular-insert-rob2-methods"
                      onClick={onInsertRob2Methods}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Párrafo RoB 2
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* GRADE Evaluation banner for Methods (Item 15) */}
            {currentSection.id === 'methods' && (
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-md shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-indigo-950 font-bold block">
                      Evaluación de la Certeza de la Evidencia (Enfoque GRADE - Ítem 15 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Incluye la degradación por los 5 dominios (sesgo, inconsistencia, evidencia indirecta, imprecisión, sesgo de publicación) y software GRADEpro GDT.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertGradeMethods && (
                    <button
                      type="button"
                      id="btn-modular-insert-grade-methods"
                      onClick={onInsertGradeMethods}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Párrafo GRADE
                    </button>
                  )}
                  {onNavigateToGrade && (
                    <button
                      type="button"
                      onClick={onNavigateToGrade}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 border border-indigo-200 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Abrir Evaluador GRADE</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Meta-Analysis Configuration banner for Methods (Item 13) */}
            {currentSection.id === 'methods' && (
              <div className="bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-violet-600 text-white rounded-md shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-violet-950 font-bold block">
                      Configuración Metodológica del Metaanálisis (Ítems 13a–13f PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Selección entre Efectos Aleatorios (DerSimonian-Laird / REML) o Fijos, ajuste de Knapp-Hartung (HKSJ), cuantificación de heterogeneidad (I², Tau², IP 95%) y diseño de meta-regresión.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertMetaMethods && (
                    <button
                      type="button"
                      id="btn-modular-insert-meta-methods"
                      onClick={onInsertMetaMethods}
                      className="px-2.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Párrafo Ítem 13
                    </button>
                  )}
                  {onNavigateToMeta && (
                    <button
                      type="button"
                      onClick={onNavigateToMeta}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-violet-700 border border-violet-200 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Abrir Módulo Metaanálisis</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Evidence Matrix banner for Results (Item 17) */}
            {currentSection.id === 'results' && (
              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-teal-600 text-white rounded-md shrink-0">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-teal-950 font-bold block">
                      Características de los Estudios Incluidos - Matriz de Evidencia (Ítem 17 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Inserta la tabla Markdown con las 6 columnas normalizadas (Autor/Año, Diseño/$N$, Población, Intervención/Comparador, Resultados numéricos con IC 95%/$p$, Conclusión).
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertMatrixResultsTable && (
                    <button
                      type="button"
                      id="btn-modular-insert-matrix-results"
                      onClick={onInsertMatrixResultsTable}
                      className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Tabla Ítem 17
                    </button>
                  )}
                  {onNavigateToMatrix && (
                    <button
                      type="button"
                      onClick={onNavigateToMatrix}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-teal-800 border border-teal-300 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Gestionar Estudios</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Outcomes & Variables Harmonization Table banner for Results (Item 13a & 17) */}
            {currentSection.id === 'results' && (
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 border border-emerald-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-md shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-emerald-950 font-bold block">
                      Armonización de Desenlaces y Elegibilidad de Síntesis (Ítems 13a y 17 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Inserta la tabla comparativa de desenlaces disponibles por estudio, métricas preferidas y elegibilidad para metaanálisis de efectos aleatorios.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertOutcomesResults && (
                    <button
                      type="button"
                      id="btn-modular-insert-outcomes-results"
                      onClick={onInsertOutcomesResults}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Tabla Ítems 13a/17
                    </button>
                  )}
                  {onNavigateToOutcomes && (
                    <button
                      type="button"
                      onClick={onNavigateToOutcomes}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Abrir Armonizador</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Cochrane RoB 2 Results Table banner for Results (Item 18) */}
            {currentSection.id === 'results' && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-amber-600 text-white rounded-md shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-amber-950 font-bold block">
                      Evaluación del Riesgo de Sesgo Cochrane RoB 2 (Ítem 18 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Inserta la matriz de juicio de riesgo de sesgo por los 5 dominios y algoritmo de peor juicio en el borrador de resultados.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertRob2ResultsTable && (
                    <button
                      type="button"
                      id="btn-modular-insert-rob2-results"
                      onClick={onInsertRob2ResultsTable}
                      className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Tabla RoB 2
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* GRADE SoF Table banner for Results (Item 22) */}
            {currentSection.id === 'results' && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-emerald-600 text-white rounded-md shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-emerald-950 font-bold block">
                      Tabla de Resumen de Hallazgos (Summary of Findings - GRADE - Ítem 22 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Integra la síntesis de efectos relativos, riesgos absolutos y niveles de certeza (Alta, Moderada, Baja, Muy Baja) con frases estándar GRADE.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertGradeSoFTable && (
                    <button
                      type="button"
                      id="btn-modular-insert-grade-sof"
                      onClick={onInsertGradeSoFTable}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Tabla SoF
                    </button>
                  )}
                  {onNavigateToGrade && (
                    <button
                      type="button"
                      onClick={onNavigateToGrade}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-emerald-800 border border-emerald-300 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Ver Evaluador GRADE</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Meta-Analysis Results banner for Results (Item 20) */}
            {currentSection.id === 'results' && (
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-violet-700 text-white rounded-md shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-violet-950 font-bold block">
                      Resultados del Metaanálisis & Meta-Regresión (Ítem 20 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Sintetiza estimadores combinados (RR/OR/MD), intervalos de confianza del 95%, I², Tau², Intervalo de Predicción del 95% y coeficientes de meta-regresión con control de sesgo.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {onInsertMetaResults && (
                    <button
                      type="button"
                      id="btn-modular-insert-meta-results"
                      onClick={onInsertMetaResults}
                      className="px-2.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Insertar Resultados Ítem 20
                    </button>
                  )}
                  {onNavigateToMeta && (
                    <button
                      type="button"
                      onClick={onNavigateToMeta}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-violet-700 border border-violet-200 rounded-md font-semibold text-xs cursor-pointer flex items-center gap-1"
                    >
                      <span>Configurar Parámetros</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Statistical Calculator Banner for Results (Item 13 & 20) */}
            {currentSection.id === 'results' && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-3.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-indigo-600 text-white rounded-md shrink-0">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-indigo-950 font-bold block">
                      Calculadora de Síntesis Estadística y Conversiones (Ítem 13 & 20 PRISMA 2020)
                    </strong>
                    <span className="text-[11px] text-slate-600">
                      Transforma Medianas/IQR a Medias/DE (Wan/Luo), calcula tablas 2×2 (OR, RR, NNT), heterogeneidad (I², Q, Tau²) y Hedges' g con inserción directa en el borrador.
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    id="btn-toggle-stats-calc"
                    onClick={() => setShowStatsCalc((prev) => !prev)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-semibold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>{showStatsCalc ? 'Ocultar Calculadora' : 'Abrir Calculadora Estadística'}</span>
                    {showStatsCalc ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Embedded Statistical Calculator when toggled */}
            {showStatsCalc && (
              <div className="my-2">
                <StatsCalculator
                  onInsertText={handleInsertFromStats}
                  onClose={() => setShowStatsCalc(false)}
                />
              </div>
            )}

            {/* Toolbar for Zero Hallucination Markers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-slate-500 text-[11px] font-medium">Marcadores de trazabilidad:</span>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('indicar fecha exacta de búsqueda')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] border border-slate-200 cursor-pointer"
                >
                  + Fecha búsqueda
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('número de revisores independientes')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] border border-slate-200 cursor-pointer"
                >
                  + Revisores
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('valor numérico I² de heterogeneidad')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] border border-slate-200 cursor-pointer"
                >
                  + I² Heterogeneidad
                </button>
                <button
                  type="button"
                  onClick={() => insertPlaceholder('número de registro PROSPERO')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] border border-slate-200 cursor-pointer"
                >
                  + PROSPERO ID
                </button>

                {/* Quick toggle for Statistical Calculator */}
                <button
                  type="button"
                  id="btn-toolbar-toggle-stats"
                  onClick={() => setShowStatsCalc((prev) => !prev)}
                  className={`px-2 py-0.5 rounded text-[11px] border cursor-pointer flex items-center gap-1 transition-colors ${
                    showStatsCalc
                      ? 'bg-indigo-600 text-white border-indigo-700'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                >
                  <Calculator className="w-3 h-3" />
                  <span>Calculadora Estadística (Ítem 13)</span>
                </button>
              </div>

              <div className="text-[11px] text-slate-400">
                {currentSection.content.split(/\s+/).filter(Boolean).length} palabras
              </div>
            </div>

            {/* Textarea Editor */}
            <textarea
              id={`textarea-section-${currentSection.id}`}
              rows={14}
              value={currentSection.content}
              onChange={(e) => onUpdateSectionContent(currentSection.id, e.target.value)}
              placeholder={`Redacta o genera aquí el texto científico para ${currentSection.title}...\n\nRecuerda: Los datos numéricos no deben inventarse. Si faltan datos clínicos (tamaños muestrales, p-valores, heterogeneidad), utiliza el marcador [PENDIENTE: ...].`}
              className="w-full text-xs sm:text-sm p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden text-slate-900 bg-white font-sans leading-relaxed transition-all shadow-inner"
            />

            {/* Footer Buttons: AI Drafter & PRISMA Auditor */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  id="btn-draft-with-ai"
                  onClick={handleGenerateDraft}
                  disabled={isDrafting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isDrafting ? 'Redactando con rigor PRISMA...' : 'Generar Borrador Riguroso (IA)'}</span>
                </button>

                <button
                  id="btn-audit-section-prisma"
                  onClick={handleAuditSection}
                  disabled={isAuditing || !currentSection.content.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4 text-indigo-600" />
                  <span>{isAuditing ? 'Auditando...' : 'Auditar Ítems PRISMA'}</span>
                </button>
              </div>

              <button
                onClick={() => onSendToChat(`Revisa la redacción de la sección "${currentSection.title}". Mi texto actual es:\n\n"${currentSection.content}"\n\n¿Falta algún elemento metodológico esencial exigido por la declaración PRISMA 2020?`)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Consultar en el chat metodológico</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Audit Results Box */}
            {auditResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-2 text-xs leading-relaxed animate-fadeIn">
                <div className="flex items-center justify-between font-bold text-emerald-400 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    Informe de Auditoría PRISMA 2020 ({currentSection.title})
                  </span>
                  <button
                    onClick={() => setAuditResult(null)}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    Cerrar
                  </button>
                </div>
                <div className="whitespace-pre-wrap font-sans text-slate-200 max-h-[300px] overflow-y-auto pr-2">
                  {auditResult}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
