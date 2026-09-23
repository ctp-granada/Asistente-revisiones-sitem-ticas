import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Table, 
  FileCode, 
  Printer,
  Award,
  ShieldCheck,
  Layers,
  Settings,
  Eye,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Target
} from 'lucide-react';
import { 
  ManuscriptSection, 
  PicoData, 
  PrismaChecklistItem, 
  FlowDiagramState, 
  GradeOutcomeAssessment,
  MetaAnalysisConfigState,
  Rob2StudyAssessment,
  EvidenceStudyRecord,
  AcademicFormatStyle,
  ManuscriptExportMetadata,
  CandidateOutcome
} from '../types';
import { 
  generateAcademicMarkdown, 
  generateAcademicHtmlDocument, 
  DEFAULT_EXPORT_METADATA 
} from '../utils/academicExport';
import {
  generateOutcomesHarmonizationMarkdown,
  generateOutcomesCsv
} from '../data/initialOutcomes';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: ManuscriptSection[];
  picoData: PicoData;
  checklistItems: PrismaChecklistItem[];
  flowData: FlowDiagramState;
  gradeOutcomes?: GradeOutcomeAssessment[];
  metaConfig?: MetaAnalysisConfigState;
  rob2Studies?: Rob2StudyAssessment[];
  evidenceStudies?: EvidenceStudyRecord[];
  candidateOutcomes?: CandidateOutcome[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  sections,
  picoData,
  checklistItems,
  flowData,
  gradeOutcomes = [],
  metaConfig,
  rob2Studies = [],
  evidenceStudies = [],
  candidateOutcomes = [],
}) => {
  const [academicStyle, setAcademicStyle] = useState<AcademicFormatStyle>('biomedical_icmje');
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'outcomes' | 'matrix' | 'grade' | 'rob2' | 'checklist' | 'json'>('preview');
  const [metadata, setMetadata] = useState<ManuscriptExportMetadata>(DEFAULT_EXPORT_METADATA);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Fallback default meta config if not passed
  const activeMetaConfig: MetaAnalysisConfigState = metaConfig || {
    id: 'meta-default',
    outcomeName: 'Mortalidad por todas las causas',
    effectMeasure: 'RR',
    modelType: 'random_dersimonian_laird',
    knappHartungAdjustment: true,
    continuityCorrection: false,
    studyCount: 5,
    totalParticipants: 12450,
    qStatistic: 2.31,
    qPValue: 0.68,
    i2: 0.0,
    tau2: 0.0,
    tau: 0.0,
    predictionIntervalLower: 0.71,
    predictionIntervalUpper: 0.96,
    pooledEstimate: 0.83,
    ciLower: 0.75,
    ciUpper: 0.92,
    pValue: 0.0004,
    metaRegressionEnabled: true,
    metaRegressionMethod: 'REML',
    covariates: [
      {
        id: 'c1',
        name: 'Edad media (años)',
        type: 'continuous',
        beta: 0.012,
        se: 0.005,
        ciLower: 0.002,
        ciUpper: 0.022,
        pValue: 0.018,
        r2Analog: 42.5,
        description: 'Efecto moderador significativo de la edad sobre la magnitud de la reducción de riesgo.',
      }
    ],
  };

  // Generate Academic Markdown
  const markdownContent = generateAcademicMarkdown(
    metadata,
    academicStyle,
    sections,
    picoData,
    flowData,
    rob2Studies,
    gradeOutcomes,
    activeMetaConfig,
    checklistItems,
    evidenceStudies
  );

  // Generate Word-ready HTML document
  const htmlWordContent = generateAcademicHtmlDocument(
    metadata,
    academicStyle,
    sections,
    picoData,
    flowData,
    rob2Studies,
    gradeOutcomes,
    activeMetaConfig,
    checklistItems,
    evidenceStudies
  );

  // Evidence Matrix Table Markdown
  const generateEvidenceMatrixMarkdown = () => {
    let md = `# TABLA 1: MATRIZ DE EXTRACCIÓN ESTANDARIZADA DE EVIDENCIA\n`;
    md += `*Declaración PRISMA 2020: Ítems 10a, 10b (Métodos) e Ítem 17 (Resultados)*\n\n`;
    md += `| Autor y Año | Diseño del estudio y tamaño de la muestra ($N$) | Población (Criterios de inclusión/exclusión) | Intervención / Comparador | Resultados principales (Outcomes primarios con sus valores estadísticos: $p$, IC 95%, OR/RR si aplican) | Conclusión principal del autor |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

    evidenceStudies.forEach((s) => {
      const clean = (t: string) => (t || 'No reportado').replace(/\|/g, '\\|').trim();
      md += `| **${clean(s.authorAndYear)}** | ${clean(s.studyDesignAndSampleSize)} | ${clean(s.population)} | ${clean(s.interventionComparator)} | ${clean(s.mainResults)} | ${clean(s.authorConclusion)} |\n`;
    });

    md += `\n*Nota.* Datos extraídos siguiendo las recomendaciones metodológicas PRISMA 2020. Todo elemento no explícito en el texto original publicado se catalogó como 'No reportado' para garantizar la estricta fidelidad documental y prevenir alucinaciones.\n`;
    return md;
  };

  // GRADE Summary of Findings Table Markdown
  const generateGradeMarkdown = () => {
    let md = `# TABLA DE RESUMEN DE HALLAZGOS GRADE (Summary of Findings - SoF)\n`;
    md += `*Declaración PRISMA 2020: Ítem 15 (Métodos) e Ítem 22 (Resultados)*\n\n`;
    md += `| Desenlace Clínico | Estudios (Nº Participantes) | Efecto Relativo (IC 95%) | Riesgo Basal | Riesgo con Intervención | Diferencia de Riesgo | Certeza GRADE | Frase Informativa GRADE |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;

    gradeOutcomes.forEach((o) => {
      const certaintySymbol = 
        o.overallCertainty === 'high' ? '⊕⊕⊕⊕ ALTA' :
        o.overallCertainty === 'moderate' ? '⊕⊕⊕◯ MODERADA' :
        o.overallCertainty === 'low' ? '⊕⊕◯◯ BAJA' : '⊕◯◯◯ MUY BAJA';
      md += `| **${o.outcomeName}** (${o.importance === 'critical' ? 'Crítico' : 'Importante'}) | ${o.studyCount} (${o.participantCount.toLocaleString()}) | ${o.effectEstimate} | ${o.baselineRisk || 'N/D'} | ${o.interventionRisk || 'N/D'} | ${o.riskDifference || 'N/D'} | **${certaintySymbol}** | ${o.informativeStatement} |\n`;
    });

    md += `\n### Justificaciones metodológicas y notas al pie:\n`;
    gradeOutcomes.forEach((o) => {
      if (o.footnotes && o.footnotes.length > 0) {
        md += `- **${o.outcomeName}**: ${o.footnotes.join('; ')}\n`;
      }
    });

    return md;
  };

  // RoB 2 Markdown Table
  const generateRob2Markdown = () => {
    let md = `# MATRIZ DE RIESGO DE SESGO COCHRANE RoB 2 (Ítem 18 PRISMA 2020)\n\n`;
    md += `| Ensayo Clínico | Año | Muestra (N) | D1: Aleatorización | D2: Desviaciones | D3: Datos Faltantes | D4: Medición | D5: Reporte Selectivo | Juicio Global |\n`;
    md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

    rob2Studies.forEach((s) => {
      const d1 = s.d1Randomization === 'low' ? 'Bajo (+)' : s.d1Randomization === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d2 = s.d2Deviations === 'low' ? 'Bajo (+)' : s.d2Deviations === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d3 = s.d3MissingData === 'low' ? 'Bajo (+)' : s.d3MissingData === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d4 = s.d4Measurement === 'low' ? 'Bajo (+)' : s.d4Measurement === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const d5 = s.d5ReportedResult === 'low' ? 'Bajo (+)' : s.d5ReportedResult === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
      const overall = s.overall === 'low' ? '**Bajo (+)**' : s.overall === 'some_concerns' ? '**Preocupación (?)**' : '**Alto (-)**';
      md += `| **${s.studyName}** | ${s.year} | ${s.sampleSize.toLocaleString()} | ${d1} | ${d2} | ${d3} | ${d4} | ${d5} | ${overall} |\n`;
    });

    md += `\n*Nota.* D1: Proceso de aleatorización; D2: Desviaciones de intervenciones previstas; D3: Datos faltantes; D4: Medición del desenlace; D5: Selección del resultado informado. Juicio global asignado bajo el algoritmo estándar RoB 2 (Sterne et al., 2019).\n`;
    return md;
  };

  // PRISMA Checklist Markdown
  const generateChecklistMarkdown = () => {
    let md = `# LISTA DE VERIFICACIÓN PRISMA 2020 (Page et al., BMJ 2021;372:n160)\n\n`;
    md += `| Ítem | Sección / Tema | Recomendación de reporte | Ubicación en manuscrito | Estado |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;

    checklistItems.forEach((item) => {
      const statusLabel = 
        item.status === 'completed' ? 'Cumplido' :
        item.status === 'in_progress' ? 'En progreso' :
        item.status === 'not_applicable' ? 'N/A' : 'Pendiente';
      md += `| **${item.itemNumber}** | ${item.topic} | ${item.title.replace(/\|/g, '-')} | ${item.locationReported || 'N/A'} | ${statusLabel} |\n`;
    });

    return md;
  };

  // JSON complete project data
  const generateJsonData = () => {
    return JSON.stringify(
      {
        version: 'PRISMA-2020-v2',
        exportedAt: new Date().toISOString(),
        metadata,
        academicStyle,
        picoData,
        sections,
        checklistItems,
        flowData,
        gradeOutcomes,
        rob2Studies,
        metaConfig: activeMetaConfig,
        evidenceStudies,
      },
      null,
      2
    );
  };

  const getCopyableContent = (): string => {
    switch (activeTab) {
      case 'preview':
      case 'markdown':
        return markdownContent;
      case 'matrix':
        return generateEvidenceMatrixMarkdown();
      case 'outcomes':
        return generateOutcomesHarmonizationMarkdown(candidateOutcomes);
      case 'grade':
        return generateGradeMarkdown();
      case 'rob2':
        return generateRob2Markdown();
      case 'checklist':
        return generateChecklistMarkdown();
      case 'json':
        return generateJsonData();
      default:
        return '';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCopyableContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as Word Document (.doc with native styles and tables)
  const handleDownloadWordDoc = () => {
    const filename = `manuscrito_${academicStyle}_prisma2020.doc`;
    const blob = new Blob(['\ufeff', htmlWordContent], {
      type: 'application/msword;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download as Markdown (.md)
  const handleDownloadMarkdown = () => {
    const filename = `manuscrito_${academicStyle}_prisma2020.md`;
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download project as JSON
  const handleDownloadJson = () => {
    const filename = `proyecto_revision_prisma2020.json`;
    const blob = new Blob([generateJsonData()], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlWordContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-2 sm:p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-5xl w-full flex flex-col max-h-[94vh] overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Exportación Académica Avanzada (PRISMA 2020)
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 bg-indigo-500/30 text-indigo-200 rounded border border-indigo-400/30">
                  Listo para Envío
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Integra secciones IMRyD, Flujograma PRISMA, Tablas Cochrane RoB 2, GRADE SoF y Metaanálisis en formato APA 7 / Biomédico.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditingMetadata(!isEditingMetadata)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                isEditingMetadata 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Metadatos del Manuscrito</span>
              {isEditingMetadata ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Collapsible Metadata Editor */}
        {isEditingMetadata && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 text-xs animate-fadeIn max-h-48 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Manuscrito</label>
                <input
                  type="text"
                  value={metadata.title}
                  onChange={(e) => setMetadata({ ...metadata, title: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Titulejo (Running Head APA)</label>
                <input
                  type="text"
                  value={metadata.runningHead}
                  onChange={(e) => setMetadata({ ...metadata, runningHead: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Autores y Credenciales</label>
                <input
                  type="text"
                  value={metadata.authors}
                  onChange={(e) => setMetadata({ ...metadata, authors: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Registro de Protocolo (PROSPERO)</label>
                <input
                  type="text"
                  value={metadata.prosperoRegistration}
                  onChange={(e) => setMetadata({ ...metadata, prosperoRegistration: e.target.value })}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Controls Toolbar: Style Selector + Tabs + Action Buttons */}
        <div className="px-6 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 shrink-0">
          {/* Format style toggle */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              Estilo Editorial:
            </span>
            <div className="inline-flex bg-white border border-slate-300 p-0.5 rounded-lg text-xs shadow-2xs">
              <button
                type="button"
                id="btn-style-biomedical"
                onClick={() => setAcademicStyle('biomedical_icmje')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  academicStyle === 'biomedical_icmje'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Biomédico (ICMJE / Lancet)
              </button>
              <button
                type="button"
                id="btn-style-apa7"
                onClick={() => setAcademicStyle('apa7')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  academicStyle === 'apa7'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                APA 7.ª Edición
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              id="btn-export-download-word"
              onClick={handleDownloadWordDoc}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors cursor-pointer"
              title="Descargar documento completo estructurado compatible con Microsoft Word y Google Docs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Word (.doc)</span>
            </button>

            <button
              type="button"
              id="btn-export-download-md"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Descargar archivo Markdown (.md) para Obsidian, Typora o Pandoc"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>Descargar .md</span>
            </button>

            <button
              type="button"
              id="btn-export-print-pdf"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
              title="Abrir vista de impresión para guardar como PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>PDF / Imprimir</span>
            </button>

            <button
              type="button"
              id="btn-export-copy"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="px-6 py-2 bg-white border-b border-slate-200 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Vista Previa Maquetada
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'markdown' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Markdown (.md)
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'matrix' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Matriz de Evidencia
            </button>
            <button
              onClick={() => setActiveTab('outcomes')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'outcomes' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              Desenlaces / Variables
            </button>
            <button
              onClick={() => setActiveTab('grade')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'grade' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              Tabla SoF GRADE
            </button>
            <button
              onClick={() => setActiveTab('rob2')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'rob2' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Tabla Cochrane RoB 2
            </button>
            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'checklist' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              Checklist PRISMA
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'json' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>

          <div className="text-[11px] text-slate-500 hidden sm:block">
            {activeTab === 'preview' && 'Vista maquetada en papel editorial A4 con estilos tipográficos estándar'}
            {activeTab === 'markdown' && 'Texto markdown limpio listo para copiar o compilar'}
            {activeTab === 'grade' && 'Resumen de hallazgos con justificaciones y notas al pie'}
            {activeTab === 'rob2' && 'Matriz de sesgo con los 5 dominios y algoritmo de peor juicio'}
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 overflow-y-auto bg-slate-100 p-4">
          {activeTab === 'preview' && (
            <div className="max-w-4xl mx-auto bg-white border border-slate-300 shadow-lg rounded-sm p-8 sm:p-12 text-slate-900 font-serif leading-relaxed text-sm">
              {/* Document Header Preview */}
              <div className="border-b border-slate-300 pb-3 mb-6 flex justify-between text-xs text-slate-500 uppercase tracking-wider font-sans">
                <span>{metadata.runningHead}</span>
                <span>{academicStyle === 'apa7' ? 'APA 7ma Edición' : 'Estilo Biomédico ICMJE'}</span>
              </div>

              <h1 className={`text-xl sm:text-2xl font-bold mb-3 ${academicStyle === 'apa7' ? 'text-center' : 'text-left'} text-slate-900 font-serif`}>
                {metadata.title}
              </h1>

              <div className={`text-xs font-semibold text-slate-800 mb-1 ${academicStyle === 'apa7' ? 'text-center' : 'text-left'} font-sans`}>
                {metadata.authors}
              </div>

              <div className={`text-xs italic text-slate-600 mb-6 ${academicStyle === 'apa7' ? 'text-center' : 'text-left'} font-sans whitespace-pre-line`}>
                {metadata.affiliations}
              </div>

              <div className="bg-slate-50 border-l-4 border-slate-500 p-3 mb-6 text-xs text-slate-700 font-sans">
                <strong>Nota del Autor:</strong> Correspondencia: {metadata.correspondingAuthor} ({metadata.correspondingEmail}). Registro PROSPERO: {metadata.prosperoRegistration}. {metadata.fundingStatement}
              </div>

              {/* Resumen */}
              <h2 className="text-base font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3 text-slate-900 font-sans">
                {academicStyle === 'apa7' ? 'Resumen' : 'Resumen Estructurado (PRISMA 2020)'}
              </h2>
              <div className="text-xs text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                {sections.find((s) => s.id === 'title-abstract')?.content || 'Resumen en proceso de redacción.'}
              </div>

              {/* PICO */}
              <div className="bg-slate-50 border border-slate-200 rounded p-3 mb-6 text-xs font-sans text-slate-700">
                <span className="font-bold block text-slate-900 mb-1">Estructura PICO:</span>
                <div>• <strong>P:</strong> {picoData.population || 'N/A'}</div>
                <div>• <strong>I:</strong> {picoData.intervention || 'N/A'}</div>
                <div>• <strong>C:</strong> {picoData.comparator || 'N/A'}</div>
                <div>• <strong>O:</strong> {picoData.outcomes || 'N/A'}</div>
              </div>

              {/* Introducción */}
              <h2 className="text-base font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3 text-slate-900 font-sans">
                1. Introducción
              </h2>
              <div className="text-xs text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                {sections.find((s) => s.id === 'introduction')?.content || 'Contenido pendiente.'}
              </div>

              {/* Métodos */}
              <h2 className="text-base font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3 text-slate-900 font-sans">
                2. Métodos
              </h2>
              <div className="text-xs text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                {sections.find((s) => s.id === 'methods')?.content || 'Contenido pendiente.'}
              </div>

              {/* Resultados */}
              <h2 className="text-base font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3 text-slate-900 font-sans">
                3. Resultados
              </h2>
              <div className="text-xs text-slate-800 mb-4 leading-relaxed whitespace-pre-line">
                {sections.find((s) => s.id === 'results')?.content || 'Contenido pendiente.'}
              </div>

              {/* Figura 1: Flujograma PRISMA en Vista Previa */}
              <div className="border border-slate-300 rounded p-4 mb-6 bg-slate-50 font-sans text-xs">
                <div className="font-bold text-slate-900">Figura 1</div>
                <div className="italic text-slate-600 mb-3">Diagrama de flujo del proceso de identificación, cribado, elegibilidad e inclusión (PRISMA 2020)</div>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <strong className="text-indigo-900 block mb-1">Identificación</strong>
                    Bases de datos: {flowData.databasesIdentified.reduce((a, b) => a + b.count, 0)} registros<br/>
                    Registros de ensayos: {flowData.registersIdentified.reduce((a, b) => a + b.count, 0)} registros<br/>
                    Duplicados removidos: {flowData.duplicatesRemoved}
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <strong className="text-indigo-900 block mb-1">Cribado</strong>
                    Registros cribados: {flowData.recordsScreened}<br/>
                    Excluidos en cribado inicial: {flowData.recordsExcludedScreening}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <strong className="text-indigo-900 block mb-1">Elegibilidad</strong>
                    Informes evaluados a texto completo: {flowData.reportsAssessed}<br/>
                    Excluidos con motivo: {flowData.reportsExcludedReasons.reduce((a, b) => a + b.count, 0)}
                  </div>
                  <div className="bg-emerald-50 p-2.5 rounded border border-emerald-300">
                    <strong className="text-emerald-900 block mb-1">Inclusión</strong>
                    Total estudios incluidos: {flowData.totalStudiesIncluded} ensayos<br/>
                    Total informes: {flowData.totalReportsIncluded}
                  </div>
                </div>
              </div>

              {/* Tabla 1: RoB 2 en Vista Previa */}
              <div className="my-6 font-sans">
                <div className="font-bold text-slate-900 text-xs">Tabla 1</div>
                <div className="italic text-slate-600 text-xs mb-2">Evaluación del riesgo de sesgo en los ensayos clínicos incluidos mediante Cochrane RoB 2</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-t-2 border-b-2 border-black border-collapse">
                    <thead>
                      <tr className="border-b border-black bg-slate-50 text-left">
                        <th className="py-1 px-1.5">Estudio</th>
                        <th className="py-1 px-1.5 text-center">N</th>
                        <th className="py-1 px-1.5 text-center">D1</th>
                        <th className="py-1 px-1.5 text-center">D2</th>
                        <th className="py-1 px-1.5 text-center">D3</th>
                        <th className="py-1 px-1.5 text-center">D4</th>
                        <th className="py-1 px-1.5 text-center">D5</th>
                        <th className="py-1 px-1.5 text-center">Global</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rob2Studies.map((s) => (
                        <tr key={s.id} className="border-t border-slate-200">
                          <td className="py-1 px-1.5 font-medium">{s.studyName} ({s.year})</td>
                          <td className="py-1 px-1.5 text-center">{s.sampleSize.toLocaleString()}</td>
                          <td className="py-1 px-1.5 text-center">{s.d1Randomization === 'low' ? 'Bajo (+)' : s.d1Randomization === 'some_concerns' ? 'Preoc. (?)' : 'Alto (-)'}</td>
                          <td className="py-1 px-1.5 text-center">{s.d2Deviations === 'low' ? 'Bajo (+)' : s.d2Deviations === 'some_concerns' ? 'Preoc. (?)' : 'Alto (-)'}</td>
                          <td className="py-1 px-1.5 text-center">{s.d3MissingData === 'low' ? 'Bajo (+)' : s.d3MissingData === 'some_concerns' ? 'Preoc. (?)' : 'Alto (-)'}</td>
                          <td className="py-1 px-1.5 text-center">{s.d4Measurement === 'low' ? 'Bajo (+)' : s.d4Measurement === 'some_concerns' ? 'Preoc. (?)' : 'Alto (-)'}</td>
                          <td className="py-1 px-1.5 text-center">{s.d5ReportedResult === 'low' ? 'Bajo (+)' : s.d5ReportedResult === 'some_concerns' ? 'Preoc. (?)' : 'Alto (-)'}</td>
                          <td className="py-1 px-1.5 text-center font-bold">{s.overall === 'low' ? 'Bajo (+)' : s.overall === 'some_concerns' ? 'Preoc. (?)' : 'Alto (-)'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  <em>Nota.</em> D1: Aleatorización; D2: Desviaciones; D3: Datos faltantes; D4: Medición; D5: Reporte selectivo. Evaluado según Sterne et al. (2019).
                </div>
              </div>

              {/* Tabla 2: GRADE SoF en Vista Previa */}
              <div className="my-6 font-sans">
                <div className="font-bold text-slate-900 text-xs">Tabla 2</div>
                <div className="italic text-slate-600 text-xs mb-2">Resumen de hallazgos y evaluación de la certeza de la evidencia (GRADE)</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11px] border-t-2 border-b-2 border-black border-collapse">
                    <thead>
                      <tr className="border-b border-black bg-slate-50 text-left">
                        <th className="py-1 px-1.5">Desenlace</th>
                        <th className="py-1 px-1.5 text-center">Estudios (N)</th>
                        <th className="py-1 px-1.5 text-center">Efecto Relativo</th>
                        <th className="py-1 px-1.5 text-center">Diferencia Absoluta</th>
                        <th className="py-1 px-1.5 text-center">Certeza GRADE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeOutcomes.map((g) => (
                        <tr key={g.id} className="border-t border-slate-200">
                          <td className="py-1 px-1.5 font-medium">{g.outcomeName}</td>
                          <td className="py-1 px-1.5 text-center">{g.studyCount} ({g.participantCount.toLocaleString()})</td>
                          <td className="py-1 px-1.5 text-center font-bold">{g.effectEstimate}</td>
                          <td className="py-1 px-1.5 text-center">{g.riskDifference || 'N/D'}</td>
                          <td className="py-1 px-1.5 text-center font-bold text-indigo-900">
                            {g.overallCertainty === 'high' ? '⊕⊕⊕⊕ Alta' :
                             g.overallCertainty === 'moderate' ? '⊕⊕⊕◯ Moderada' :
                             g.overallCertainty === 'low' ? '⊕⊕◯◯ Baja' : '⊕◯◯◯ Muy Baja'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Discusión */}
              <h2 className="text-base font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3 text-slate-900 font-sans">
                4. Discusión
              </h2>
              <div className="text-xs text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                {sections.find((s) => s.id === 'discussion')?.content || 'Contenido pendiente.'}
              </div>

              {/* Otra información */}
              <h2 className="text-base font-bold uppercase tracking-wide border-b border-slate-300 pb-1 mb-3 text-slate-900 font-sans">
                5. Información Administrativa & Declaraciones
              </h2>
              <div className="text-xs text-slate-800 mb-6 leading-relaxed whitespace-pre-line">
                {sections.find((s) => s.id === 'other')?.content || 'Contenido pendiente.'}
              </div>
            </div>
          )}

          {activeTab === 'markdown' && (
            <div className="bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed p-6 rounded-lg whitespace-pre-wrap select-all shadow-inner border border-slate-800">
              {markdownContent}
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="bg-slate-950 font-mono text-xs text-teal-300 leading-relaxed p-6 rounded-lg whitespace-pre-wrap select-all shadow-inner border border-slate-800">
              {generateEvidenceMatrixMarkdown()}
            </div>
          )}

          {activeTab === 'outcomes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-lg text-xs">
                <span className="font-medium text-slate-300">
                  Catálogo y Mapeo de Variables / Outcomes Armonizados (PRISMA 2020: Ítems 10b, 13a y 17)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const csv = generateOutcomesCsv(candidateOutcomes);
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `PRISMA2020_Variables_Outcomes.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded font-bold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar CSV</span>
                </button>
              </div>
              <div className="bg-slate-950 font-mono text-xs text-emerald-300 leading-relaxed p-6 rounded-lg whitespace-pre-wrap select-all shadow-inner border border-slate-800">
                {generateOutcomesHarmonizationMarkdown(candidateOutcomes)}
              </div>
            </div>
          )}

          {activeTab === 'grade' && (
            <div className="bg-slate-950 font-mono text-xs text-emerald-300 leading-relaxed p-6 rounded-lg whitespace-pre-wrap select-all shadow-inner border border-slate-800">
              {generateGradeMarkdown()}
            </div>
          )}

          {activeTab === 'rob2' && (
            <div className="bg-slate-950 font-mono text-xs text-cyan-300 leading-relaxed p-6 rounded-lg whitespace-pre-wrap select-all shadow-inner border border-slate-800">
              {generateRob2Markdown()}
            </div>
          )}

          {activeTab === 'checklist' && (
            <div className="bg-slate-950 font-mono text-xs text-indigo-300 leading-relaxed p-6 rounded-lg whitespace-pre-wrap select-all shadow-inner border border-slate-800">
              {generateChecklistMarkdown()}
            </div>
          )}

          {activeTab === 'json' && (
            <div className="bg-slate-950 font-mono text-xs text-amber-300 leading-relaxed p-6 rounded-lg whitespace-pre-wrap select-all shadow-inner border border-slate-800">
              {generateJsonData()}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Documento sincronizado con todas las secciones, flujograma, RoB 2, GRADE y metaanálisis.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              Cerrar
            </button>
            <button
              onClick={handleDownloadWordDoc}
              className="px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Word (.doc)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
