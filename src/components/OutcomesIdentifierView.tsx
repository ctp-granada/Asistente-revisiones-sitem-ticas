import React, { useState } from 'react';
import {
  Target,
  Search,
  Filter,
  Sparkles,
  Plus,
  Download,
  Copy,
  Check,
  Layers,
  Award,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart2,
  Clock,
  ShieldCheck,
  Edit2,
  Trash2,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Table as TableIcon
} from 'lucide-react';
import {
  CandidateOutcome,
  OutcomeCategory,
  OutcomeVariableType,
  OutcomeEffectMeasure,
  EvidenceStudyRecord,
  PicoData
} from '../types';
import {
  generateOutcomesHarmonizationMarkdown,
  generateOutcomesMethodsText,
  generateOutcomesCsv
} from '../data/initialOutcomes';

interface OutcomesIdentifierViewProps {
  outcomes: CandidateOutcome[];
  onUpdateOutcomes: (outcomes: CandidateOutcome[]) => void;
  evidenceStudies: EvidenceStudyRecord[];
  picoContext?: PicoData;
  onNavigateToMeta?: (outcome: CandidateOutcome) => void;
  onNavigateToGrade?: (outcome: CandidateOutcome) => void;
  onInsertIntoMethods?: (text: string) => void;
  onInsertIntoResults?: (text: string) => void;
}

export const OutcomesIdentifierView: React.FC<OutcomesIdentifierViewProps> = ({
  outcomes,
  onUpdateOutcomes,
  evidenceStudies,
  picoContext,
  onNavigateToMeta,
  onNavigateToGrade,
  onInsertIntoMethods,
  onInsertIntoResults,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [onlyMetaAnalyzable, setOnlyMetaAnalyzable] = useState(false);
  const [copied, setCopied] = useState(false);
  const [insertedNotice, setInsertedNotice] = useState<string | null>(null);

  // IA Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiFocusPrompt, setAiFocusPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);

  // Manual Edit / Create Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingOutcomeId, setEditingOutcomeId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CandidateOutcome>>({
    name: '',
    domain: '',
    category: 'primary',
    variableType: 'time_to_event',
    preferredEffectMeasure: 'HR',
    clinicalDefinition: '',
    measurementTimepoint: '',
    importance: 'critical',
    cosAlignment: '',
  });

  // Filtered outcomes
  const filteredOutcomes = outcomes.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.clinicalDefinition.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || o.category === selectedCategory;
    const matchesType = selectedType === 'all' || o.variableType === selectedType;
    const matchesMeta = !onlyMetaAnalyzable || o.synthesisEligibility.canMetaAnalyze;

    return matchesSearch && matchesCategory && matchesType && matchesMeta;
  });

  // Quick statistics
  const primaryCount = outcomes.filter((o) => o.category === 'primary').length;
  const secondaryCount = outcomes.filter((o) => o.category === 'secondary').length;
  const safetyCount = outcomes.filter((o) => o.category === 'safety').length;
  const subgroupCount = outcomes.filter((o) => o.category === 'subgroup').length;
  const metaAnalyzableCount = outcomes.filter((o) => o.synthesisEligibility.canMetaAnalyze).length;

  const handleCopyMarkdown = () => {
    const md = generateOutcomesHarmonizationMarkdown(outcomes);
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCsv = () => {
    const csv = generateOutcomesCsv(outcomes);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PRISMA2020_Variables_Outcomes_Armonizados_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleInsertMethods = () => {
    if (onInsertIntoMethods) {
      const text = generateOutcomesMethodsText(outcomes);
      onInsertIntoMethods(text);
      setInsertedNotice('Sección de Métodos (Ítems 10b y 13a) actualizada con la especificación de variables.');
      setTimeout(() => setInsertedNotice(null), 3500);
    }
  };

  const handleInsertResults = () => {
    if (onInsertIntoResults) {
      const md = generateOutcomesHarmonizationMarkdown(outcomes);
      onInsertIntoResults(md);
      setInsertedNotice('Sección de Resultados (Ítem 17) actualizada con la tabla de variables.');
      setTimeout(() => setInsertedNotice(null), 3500);
    }
  };

  // Run AI Scan using /api/identify-outcomes
  const handleRunAiScan = async () => {
    setIsGeneratingAi(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const res = await fetch('/api/identify-outcomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          picoContext,
          evidenceStudies,
          customQuery: aiFocusPrompt.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor.');
      }

      if (data.outcomes && data.outcomes.length > 0) {
        // Merge or replace: we add newly identified outcomes preserving existing IDs
        const existingMap = new Map(outcomes.map((o) => [o.name.toLowerCase().trim(), o]));
        const merged: CandidateOutcome[] = [...outcomes];

        data.outcomes.forEach((newOut: any) => {
          const key = (newOut.name || '').toLowerCase().trim();
          if (!existingMap.has(key)) {
            merged.push({
              ...newOut,
              id: newOut.id || `out-ai-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            });
          }
        });

        onUpdateOutcomes(merged);
        setAiSuccessMessage(`¡Análisis completado con éxito! Se identificaron y armonizaron ${data.outcomes.length} desenlaces clínicos según las directrices PRISMA 2020.`);
        setTimeout(() => {
          setIsAiModalOpen(false);
          setAiSuccessMessage(null);
        }, 1800);
      } else {
        setAiError('No se recibieron desenlaces estructurados. Revisa el texto de los estudios en la Matriz de Evidencia.');
      }
    } catch (err: any) {
      console.error(err);
      setAiError(err.message || 'Error durante la identificación automatizada con IA.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingOutcomeId(null);
    setFormData({
      name: '',
      domain: 'Eficacia Clínica / Eventos Mayores',
      category: 'primary',
      variableType: 'time_to_event',
      preferredEffectMeasure: 'HR',
      clinicalDefinition: '',
      measurementTimepoint: 'Mediana de seguimiento',
      importance: 'critical',
      cosAlignment: 'COMET Core Outcome Set',
    });
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (o: CandidateOutcome) => {
    setEditingOutcomeId(o.id);
    setFormData({ ...o });
    setIsFormModalOpen(true);
  };

  // Save Modal Form
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    if (editingOutcomeId) {
      // Update
      const updated = outcomes.map((o) => {
        if (o.id === editingOutcomeId) {
          return {
            ...o,
            ...formData,
          } as CandidateOutcome;
        }
        return o;
      });
      onUpdateOutcomes(updated);
    } else {
      // Create new
      const newOutcome: CandidateOutcome = {
        id: `out-custom-${Date.now()}`,
        name: formData.name || 'Nuevo Desenlace',
        domain: formData.domain || 'Clínico General',
        category: (formData.category as OutcomeCategory) || 'primary',
        variableType: (formData.variableType as OutcomeVariableType) || 'time_to_event',
        preferredEffectMeasure: (formData.preferredEffectMeasure as OutcomeEffectMeasure) || 'HR',
        clinicalDefinition: formData.clinicalDefinition || 'No especificada',
        measurementTimepoint: formData.measurementTimepoint || 'Fin del estudio',
        importance: (formData.importance as 'critical' | 'important') || 'critical',
        cosAlignment: formData.cosAlignment,
        studiesMapping: evidenceStudies.map((s) => ({
          studyId: s.id,
          studyName: s.authorAndYear,
          reported: false,
          reportedText: 'No reportado',
          isEligibleForMetaAnalysis: false,
        })),
        synthesisEligibility: {
          eligibleStudiesCount: 0,
          canMetaAnalyze: false,
          recommendedSynthesis: 'narrative_synthesis',
          methodologicalJustification: 'Recién creado. Asigna los estudios que reportan este desenlace para evaluar la elegibilidad cuantitativa.',
        },
      };
      onUpdateOutcomes([newOutcome, ...outcomes]);
    }

    setIsFormModalOpen(false);
  };

  // Delete Outcome
  const handleDeleteOutcome = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este desenlace del catálogo de variables?')) {
      onUpdateOutcomes(outcomes.filter((o) => o.id !== id));
    }
  };

  // Toggle study reported status in card
  const handleToggleStudyReported = (outcomeId: string, studyId: string) => {
    const updated = outcomes.map((o) => {
      if (o.id !== outcomeId) return o;
      const updatedStudies = o.studiesMapping.map((sm) => {
        if (sm.studyId === studyId) {
          const nextState = !sm.reported;
          return {
            ...sm,
            reported: nextState,
            reportedText: nextState ? 'Reportado con efecto clínicamente detectable' : 'No reportado',
            isEligibleForMetaAnalysis: nextState,
          };
        }
        return sm;
      });
      const eligibleCount = updatedStudies.filter((s) => s.isEligibleForMetaAnalysis).length;
      return {
        ...o,
        studiesMapping: updatedStudies,
        synthesisEligibility: {
          ...o.synthesisEligibility,
          eligibleStudiesCount: eligibleCount,
          canMetaAnalyze: eligibleCount >= 2,
          recommendedSynthesis: (eligibleCount >= 2 ? 'meta_analysis_random' : 'narrative_synthesis') as 'meta_analysis_random' | 'narrative_synthesis',
        },
      };
    });
    onUpdateOutcomes(updated as CandidateOutcome[]);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {insertedNotice && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-lg shadow-xl border border-teal-500/40 flex items-center gap-3 text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-teal-400 shrink-0" />
          <span>{insertedNotice}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-teal-600 text-white flex items-center justify-center shadow-xs">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Identificador y Armonizador de Variables y Desenlaces
              </h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                Ítems 10b, 13a y 17 PRISMA 2020
              </span>
            </div>
            <p className="text-sm text-slate-600 mt-1.5 max-w-3xl leading-relaxed">
              Catálogo estandarizado de desenlaces candidatos primarios, secundarios, eventos de seguridad y subgrupos.
              Permite verificar la comparabilidad métrica entre los estudios de la Matriz de Evidencia y clasificar su elegibilidad para síntesis cuantitativa (metaanálisis) o narrativa según la iniciativa <strong>COMET</strong> y directrices Cochrane.
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Identificar con IA (Gemini)</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Variable</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-all cursor-pointer"
              title="Copiar tabla en Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copiado' : 'Markdown'}</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-xs transition-all cursor-pointer"
              title="Descargar catálogo en CSV para Excel"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Variables
            </span>
            <div className="text-xl font-bold text-slate-900 mt-0.5">{outcomes.length}</div>
            <span className="text-[10px] text-slate-500">en el protocolo</span>
          </div>

          <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider block">
              ★ Primarios
            </span>
            <div className="text-xl font-bold text-amber-900 mt-0.5">{primaryCount}</div>
            <span className="text-[10px] text-amber-700">MACE y supervivencia</span>
          </div>

          <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-indigo-800 uppercase tracking-wider block">
              Secundarios
            </span>
            <div className="text-xl font-bold text-indigo-900 mt-0.5">{secondaryCount}</div>
            <span className="text-[10px] text-indigo-700">Órganos diana & PROMs</span>
          </div>

          <div className="bg-rose-50/70 border border-rose-200/80 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider block">
              ⚠ Seguridad
            </span>
            <div className="text-xl font-bold text-rose-900 mt-0.5">{safetyCount}</div>
            <span className="text-[10px] text-rose-700">Eventos adversos graves</span>
          </div>

          <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3">
            <span className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider block">
              ✓ Apto Metaanálisis
            </span>
            <div className="text-xl font-bold text-emerald-900 mt-0.5">{metaAnalyzableCount}</div>
            <span className="text-[10px] text-emerald-700">≥ 2 ensayos compatibles</span>
          </div>
        </div>
      </div>

      {/* Insertion into Manuscript Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Banner Methods */}
        <div className="bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-600 text-white rounded-lg shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">
                Especificación Metodológica (Ítems 10b y 13a)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Inserta el texto metodológico en la sección de <strong>Métodos</strong> describiendo las definiciones operativas y los criterios de elegibilidad.
              </p>
            </div>
          </div>
          <button
            onClick={handleInsertMethods}
            className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-md text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
          >
            Insertar en Métodos
          </button>
        </div>

        {/* Banner Results */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-4 rounded-xl flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 text-white rounded-lg shrink-0">
              <TableIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                Tabla de Armonización y Elegibilidad (Ítem 17)
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Inserta la tabla Markdown estructurada en la sección de <strong>Resultados</strong> para la revisión por pares de la revista.
              </p>
            </div>
          </div>
          <button
            onClick={handleInsertResults}
            className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-md text-xs font-semibold shrink-0 cursor-pointer shadow-xs transition-colors"
          >
            Insertar en Resultados
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nombre de variable, definición clínica o dominio..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Todas las Categorías ({outcomes.length})</option>
            <option value="primary">★ Primarios ({primaryCount})</option>
            <option value="secondary">Secundarios ({secondaryCount})</option>
            <option value="safety">⚠ Seguridad ({safetyCount})</option>
            <option value="subgroup">Subgrupos / Covariables ({subgroupCount})</option>
          </select>

          {/* Metric Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">Todos los Tipos Métricos</option>
            <option value="time_to_event">Tiempo al evento (HR)</option>
            <option value="dichotomous">Dicotómica / Binaria (RR/OR)</option>
            <option value="continuous">Continua (MD / SMD)</option>
          </select>

          {/* Toggle only meta-analyzable */}
          <button
            type="button"
            onClick={() => setOnlyMetaAnalyzable(!onlyMetaAnalyzable)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border ${
              onlyMetaAnalyzable
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Solo Aptos Metaanálisis</span>
          </button>
        </div>
      </div>

      {/* Outcomes Cards List */}
      <div className="space-y-4">
        {filteredOutcomes.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No se encontraron desenlaces</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No hay variables que coincidan con los filtros seleccionados o el término de búsqueda. Prueba restableciendo los filtros o utiliza el analizador con IA.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setSelectedType('all');
                setOnlyMetaAnalyzable(false);
              }}
              className="mt-4 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          filteredOutcomes.map((outcome) => {
            const reportedCount = outcome.studiesMapping.filter((s) => s.reported).length;
            const totalStudiesInGrid = outcome.studiesMapping.length;

            return (
              <div
                key={outcome.id}
                className={`bg-white rounded-xl border transition-all duration-200 p-5 shadow-xs hover:shadow-md ${
                  outcome.category === 'primary'
                    ? 'border-amber-200/90'
                    : outcome.category === 'safety'
                    ? 'border-rose-200'
                    : outcome.category === 'subgroup'
                    ? 'border-purple-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Header of outcome card */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Category Badge */}
                      {outcome.category === 'primary' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          ★ Desenlace Primario
                        </span>
                      )}
                      {outcome.category === 'secondary' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                          Desenlace Secundario
                        </span>
                      )}
                      {outcome.category === 'safety' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          ⚠ Seguridad / Tolerabilidad
                        </span>
                      )}
                      {outcome.category === 'subgroup' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          Subgrupo / Covariable
                        </span>
                      )}

                      {/* Metric Type badge */}
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                        {outcome.variableType === 'time_to_event'
                          ? `Tiempo al evento (${outcome.preferredEffectMeasure})`
                          : outcome.variableType === 'dichotomous'
                          ? `Dicotómica (${outcome.preferredEffectMeasure})`
                          : `Continua (${outcome.preferredEffectMeasure})`}
                      </span>

                      {/* Importance */}
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                          outcome.importance === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        {outcome.importance === 'critical' ? 'GRADE: Crítico' : 'GRADE: Importante'}
                      </span>

                      {outcome.cosAlignment && (
                        <span className="text-[10px] text-slate-500 italic bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {outcome.cosAlignment}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 mt-1">
                      {outcome.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      Dominio: <span className="text-slate-700">{outcome.domain}</span> • Ventana: <span className="text-slate-700">{outcome.measurementTimepoint}</span>
                    </p>
                  </div>

                  {/* Actions for this outcome */}
                  <div className="flex items-center gap-1.5 shrink-0 self-start">
                    {onNavigateToMeta && outcome.synthesisEligibility.canMetaAnalyze && (
                      <button
                        onClick={() => onNavigateToMeta(outcome)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold cursor-pointer transition-colors"
                        title="Abrir en el módulo de Metaanálisis para generar Forest Plot"
                      >
                        <Layers className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Metaanálisis</span>
                      </button>
                    )}

                    {onNavigateToGrade && (
                      <button
                        onClick={() => onNavigateToGrade(outcome)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-300 text-xs font-semibold cursor-pointer transition-colors"
                        title="Evaluar certeza con el enfoque GRADE"
                      >
                        <Award className="w-3.5 h-3.5 text-indigo-600" />
                        <span>GRADE</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(outcome)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                      title="Editar especificación del desenlace"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteOutcome(outcome.id)}
                      className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                      title="Eliminar desenlace"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Operational definition */}
                <div className="mt-3 bg-slate-50 rounded-lg p-3 border border-slate-200/80">
                  <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    Definición Operativa Estandarizada (Armonización COMET / PRISMA 2020)
                  </div>
                  <p className="text-xs text-slate-800 mt-1 leading-relaxed">
                    {outcome.clinicalDefinition}
                  </p>
                </div>

                {/* Studies Mapping Grid */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <BarChart2 className="w-3.5 h-3.5 text-teal-600" />
                      Mapeo Comparativo en los Estudios Incluidos ({reportedCount} de {totalStudiesInGrid} reportan este desenlace)
                    </span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Haz clic en el estado para alternar reporte
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {outcome.studiesMapping.map((sm) => (
                      <div
                        key={sm.studyId}
                        onClick={() => handleToggleStudyReported(outcome.id, sm.studyId)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                          sm.reported
                            ? 'bg-teal-50/50 border-teal-200 hover:border-teal-400'
                            : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 opacity-75'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 font-bold truncate text-[11px]">
                            {sm.studyName}
                          </strong>
                          {sm.reported ? (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3 text-teal-600" />
                              Reportado
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 bg-slate-200/80 px-1.5 py-0.5 rounded">
                              <XCircle className="w-3 h-3 text-slate-400" />
                              No reportado
                            </span>
                          )}
                        </div>

                        <div className="mt-1.5 text-[11px] text-slate-600 line-clamp-2 font-mono bg-white/70 p-1 rounded border border-slate-100">
                          {sm.reportedText || 'No reportado en el informe publicado'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Methodological Synthesis Eligibility */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2 text-xs">
                    {outcome.synthesisEligibility.canMetaAnalyze ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-bold text-slate-900">
                        {outcome.synthesisEligibility.canMetaAnalyze
                          ? `Apto para Metaanálisis de Efectos Aleatorios (${outcome.synthesisEligibility.eligibleStudiesCount} estudios compatibles)`
                          : `Requiere Síntesis Narrativa únicamente (No apto para metaanálisis)`}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">
                        {outcome.synthesisEligibility.methodologicalJustification}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[11px] text-slate-500">
                      Medida: <strong>{outcome.preferredEffectMeasure}</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Identification Modal */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-teal-600 text-white">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Identificar y Armonizar Variables con IA
                  </h3>
                  <p className="text-xs text-slate-500">
                    Escaneo inteligente de la Matriz de Evidencia ({evidenceStudies.length} estudios cargados)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed">
                El agente examinará exhaustivamente la información de los ensayos clínicos incluidos y el marco PICO para detectar todos los desenlaces reportados, extraer las métricas numéricas exactas, armonizar sus definiciones según la directriz <strong>PRISMA 2020 (Ítem 10b y 13a)</strong> y clasificar su viabilidad para metaanálisis.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Enfoque clínico o instrucciones adicionales (opcional):
                </label>
                <textarea
                  rows={3}
                  value={aiFocusPrompt}
                  onChange={(e) => setAiFocusPrompt(e.target.value)}
                  placeholder="Ej. Priorizar desenlaces de seguridad renal (deterioro de TFGe), hospitalizaciones totales e interacciones de subgrupo en diabéticos..."
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {aiError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{aiError}</span>
                </div>
              )}

              {aiSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{aiSuccessMessage}</span>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRunAiScan}
                disabled={isGeneratingAi}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analizando Estudios...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Iniciar Escaneo PRISMA</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create / Edit Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-slate-900 text-white">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {editingOutcomeId ? 'Editar Variable o Desenlace Clínico' : 'Registrar Nuevo Desenlace Clínico'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Definición metodológica estandarizada según PRISMA 2020 (Ítem 10b)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-md cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Nombre del Desenlace / Variable <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ej. Muerte cardiovascular o primera hospitalización por insuficiencia cardíaca"
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Categoría Metodológica
                  </label>
                  <select
                    value={formData.category || 'primary'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as OutcomeCategory })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="primary">★ Desenlace Primario</option>
                    <option value="secondary">Desenlace Secundario</option>
                    <option value="safety">⚠ Evento de Seguridad / Tolerabilidad</option>
                    <option value="subgroup">Subgrupo / Covariable Moduladora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Dominio Clínico
                  </label>
                  <input
                    type="text"
                    value={formData.domain || ''}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    placeholder="ej. Eventos Cardiovasculares Mayores (MACE)"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Tipo de Variable
                  </label>
                  <select
                    value={formData.variableType || 'time_to_event'}
                    onChange={(e) => setFormData({ ...formData, variableType: e.target.value as OutcomeVariableType })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="time_to_event">Tiempo al evento</option>
                    <option value="dichotomous">Dicotómica / Binaria</option>
                    <option value="continuous">Continua</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Medida de Efecto
                  </label>
                  <select
                    value={formData.preferredEffectMeasure || 'HR'}
                    onChange={(e) => setFormData({ ...formData, preferredEffectMeasure: e.target.value as OutcomeEffectMeasure })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="HR">Hazard Ratio (HR)</option>
                    <option value="RR">Risk Ratio / Riesgo Relativo (RR)</option>
                    <option value="OR">Odds Ratio (OR)</option>
                    <option value="MD">Diferencia de Medias (MD)</option>
                    <option value="SMD">Diferencia de Medias Estandarizada (SMD)</option>
                    <option value="RD">Diferencia de Riesgo (RD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Importancia GRADE
                  </label>
                  <select
                    value={formData.importance || 'critical'}
                    onChange={(e) => setFormData({ ...formData, importance: e.target.value as 'critical' | 'important' })}
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="critical">Crítico para toma de decisiones</option>
                    <option value="important">Importante no crítico</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Definición Operativa Armonizada <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.clinicalDefinition || ''}
                  onChange={(e) => setFormData({ ...formData, clinicalDefinition: e.target.value })}
                  placeholder="Describe con precisión metodológica cómo se define el desenlace para garantizar comparabilidad y evitar heterogeneidad..."
                  className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Ventana Temporal de Medición
                  </label>
                  <input
                    type="text"
                    value={formData.measurementTimepoint || ''}
                    onChange={(e) => setFormData({ ...formData, measurementTimepoint: e.target.value })}
                    placeholder="ej. Mediana de seguimiento (18 a 24 meses)"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Alineación Core Outcome Set (COMET)
                  </label>
                  <input
                    type="text"
                    value={formData.cosAlignment || ''}
                    onChange={(e) => setFormData({ ...formData, cosAlignment: e.target.value })}
                    placeholder="ej. COMET Heart Failure COS / ICH E9"
                    className="w-full text-xs rounded-lg border border-slate-200 p-2.5 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer transition-colors"
                >
                  {editingOutcomeId ? 'Actualizar Variable' : 'Guardar en Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
