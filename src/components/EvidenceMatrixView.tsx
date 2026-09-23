import React, { useState, useRef } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  FileText, 
  Copy, 
  Check, 
  Download, 
  Plus, 
  Trash2, 
  Edit3, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  RefreshCw,
  BookOpen,
  ArrowRight,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { EvidenceStudyRecord, PicoData } from '../types';
import { 
  generateEvidenceMatrixMarkdown, 
  generateDataExtractionMethodsText,
  INITIAL_EVIDENCE_STUDIES 
} from '../data/initialEvidenceStudies';

interface EvidenceMatrixViewProps {
  studies: EvidenceStudyRecord[];
  onUpdateStudies: (studies: EvidenceStudyRecord[]) => void;
  picoContext?: PicoData;
  onInsertIntoResults?: (markdownTable: string) => void;
  onInsertIntoMethods?: (methodsText: string) => void;
}

export const EvidenceMatrixView: React.FC<EvidenceMatrixViewProps> = ({
  studies,
  onUpdateStudies,
  picoContext,
  onInsertIntoResults,
  onInsertIntoMethods,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'markdown' | 'cards'>('table');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgressText, setUploadProgressText] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isPasteTextModalOpen, setIsPasteTextModalOpen] = useState<boolean>(false);
  const [pastedArticleText, setPastedArticleText] = useState<string>('');
  const [pastedArticleTitle, setPastedArticleTitle] = useState<string>('');
  const [editingStudy, setEditingStudy] = useState<EvidenceStudyRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File Upload & Gemini Extraction handler
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setIsUploading(true);

    const newStudies: EvidenceStudyRecord[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgressText(`Analizando y extrayendo "${file.name}" (${i + 1} de ${files.length})...`);

      try {
        // Convert file to base64
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });

        // Call backend API
        const response = await fetch('/api/extract-pdf-matrix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileBase64: base64Data,
            fileName: file.name,
            mimeType: file.type || 'application/pdf',
            picoContext,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Error al procesar el archivo en el servidor.');
        }

        if (data.record) {
          newStudies.push(data.record);
        }
      } catch (err: any) {
        console.error('Error extracting PDF:', err);
        setUploadError(`Fallo al extraer "${file.name}": ${err.message || 'Error de red o procesamiento.'}`);
      }
    }

    if (newStudies.length > 0) {
      onUpdateStudies([...newStudies, ...studies]);
    }

    setIsUploading(false);
    setUploadProgressText('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Text-based extraction handler (for pasted article text/abstract)
  const handleExtractFromPastedText = async () => {
    if (!pastedArticleText.trim()) return;
    setUploadError(null);
    setIsUploading(true);
    setUploadProgressText('Extrayendo los 6 elementos clave PRISMA desde el texto ingresado...');

    try {
      const response = await fetch('/api/extract-pdf-matrix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleText: pastedArticleText,
          fileName: pastedArticleTitle ? `${pastedArticleTitle}.txt` : 'Texto_Artículo_Pegado.txt',
          picoContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar el texto.');
      }

      if (data.record) {
        onUpdateStudies([data.record, ...studies]);
        setIsPasteTextModalOpen(false);
        setPastedArticleText('');
        setPastedArticleTitle('');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(`Error de extracción: ${err.message || 'Verifica la clave API o el formato del texto.'}`);
    } finally {
      setIsUploading(false);
      setUploadProgressText('');
    }
  };

  // Delete a study
  const handleDeleteStudy = (id: string) => {
    onUpdateStudies(studies.filter((s) => s.id !== id));
  };

  // Save edited or newly added study
  const handleSaveStudyEdit = (study: EvidenceStudyRecord) => {
    const exists = studies.some((s) => s.id === study.id);
    if (exists) {
      onUpdateStudies(studies.map((s) => (s.id === study.id ? study : s)));
    } else {
      onUpdateStudies([study, ...studies]);
    }
    setIsEditModalOpen(false);
    setEditingStudy(null);
  };

  // Copy full Markdown table
  const handleCopyMarkdown = () => {
    const md = generateEvidenceMatrixMarkdown(studies);
    navigator.clipboard.writeText(md);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Download CSV with UTF-8 BOM
  const handleDownloadCsv = () => {
    const headers = [
      'Autor y Año',
      'Diseño del estudio y tamaño de la muestra (N)',
      'Población (Criterios de inclusión/exclusión)',
      'Intervención / Comparador',
      'Resultados principales (Outcomes primarios con valores estadísticos)',
      'Conclusión principal del autor',
    ];

    const escapeCsv = (val: string) => {
      const str = val || 'No reportado';
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = studies.map((s) => [
      escapeCsv(s.authorAndYear),
      escapeCsv(s.studyDesignAndSampleSize),
      escapeCsv(s.population),
      escapeCsv(s.interventionComparator),
      escapeCsv(s.mainResults),
      escapeCsv(s.authorConclusion),
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Matriz_Evidencia_PRISMA_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filtered studies
  const filteredStudies = studies.filter((s) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      s.authorAndYear.toLowerCase().includes(q) ||
      s.studyDesignAndSampleSize.toLowerCase().includes(q) ||
      s.population.toLowerCase().includes(q) ||
      s.interventionComparator.toLowerCase().includes(q) ||
      s.mainResults.toLowerCase().includes(q) ||
      s.authorConclusion.toLowerCase().includes(q)
    );
  });

  const markdownContent = generateEvidenceMatrixMarkdown(studies);

  return (
    <div id="evidence-matrix-container" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Extracción Estandarizada de Datos (Matriz de Evidencia)
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ítems 10a, 10b y 17 PRISMA 2020
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Extrae sistemáticamente los 6 elementos clave de cada estudio publicado. Si algún elemento falta en el texto, se etiqueta con rigor como <span className="font-semibold text-amber-700">"No reportado"</span> (cero alucinaciones).
              </p>
            </div>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onInsertIntoResults && (
            <button
              id="btn-insert-matrix-results"
              onClick={() => onInsertIntoResults(markdownContent)}
              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Inserta la tabla Markdown completa en la sección Resultados del manuscrito"
            >
              <FileCheck className="w-4 h-4" />
              <span>Insertar en Resultados (Ítem 17)</span>
            </button>
          )}

          {onInsertIntoMethods && (
            <button
              id="btn-insert-matrix-methods"
              onClick={() => onInsertIntoMethods(generateDataExtractionMethodsText())}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              title="Inserta la metodología canónica de extracción por duplicado en Métodos"
            >
              <BookOpen className="w-4 h-4" />
              <span>Insertar en Métodos (Ítem 10)</span>
            </button>
          )}

          <button
            id="btn-copy-matrix-markdown"
            onClick={handleCopyMarkdown}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{isCopied ? '¡Copiado!' : 'Copiar Tabla Markdown'}</span>
          </button>

          <button
            id="btn-download-matrix-csv"
            onClick={handleDownloadCsv}
            className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            title="Descargar datos en formato CSV compatible con Excel"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Descargar CSV</span>
          </button>
        </div>
      </div>

      {/* PDF Upload Dropzone & Action Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Upload Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-50/60 via-slate-50/60 to-white border-2 border-dashed border-indigo-200 hover:border-indigo-400 rounded-xl p-6 text-center transition-all">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            multiple
            className="hidden"
            id="pdf-matrix-file-input"
            onChange={(e) => handleFileUpload(e.target.files)}
          />

          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Arrastra y suelta aquí tus artículos científicos en PDF
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Soporta uno o varios archivos PDF. Gemini analizará el documento y extraerá de inmediato las 6 columnas clave de la matriz.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                id="btn-browse-pdf-files"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>Examinar archivos PDF</span>
              </button>

              <button
                type="button"
                id="btn-paste-article-text"
                disabled={isUploading}
                onClick={() => setIsPasteTextModalOpen(true)}
                className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Pegar Texto o Abstract</span>
              </button>

              <button
                type="button"
                id="btn-load-sample-studies"
                disabled={isUploading}
                onClick={() => onUpdateStudies(INITIAL_EVIDENCE_STUDIES)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
                title="Carga ensayos clínicos emblemáticos (DAPA-HF, EMPEROR-Reduced, SOLOIST-WHF, DEFINE-HF)"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                <span>Restaurar Ensayos ECA</span>
              </button>
            </div>

            {/* Upload loading state */}
            {isUploading && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex items-center justify-center gap-3 text-xs text-indigo-900 font-medium animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>{uploadProgressText || 'Procesando extracción estandarizada...'}</span>
              </div>
            )}

            {/* Upload error display */}
            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800 text-left">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Aviso de extracción:</strong>
                  <span>{uploadError}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* PRISMA 2020 Guidance Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 flex flex-col justify-between">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Estructura de la Matriz PRISMA 2020
              </h4>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              El primer paso analítico tras la inclusión definitiva es la conformación de la tabla de características de los estudios (Ítem 17). Las 6 dimensiones extraídas son:
            </p>

            <ul className="text-[11px] text-slate-600 space-y-1.5 pl-3 list-disc">
              <li><strong className="text-slate-800">1. Autor y Año:</strong> Cita formal normalizada del informe principal.</li>
              <li><strong className="text-slate-800">2. Diseño y Tamaño ($N$):</strong> Tipo de ECA/observacional y muestra total analizada.</li>
              <li><strong className="text-slate-800">3. Población:</strong> Criterios explícitos de inclusión y exclusión.</li>
              <li><strong className="text-slate-800">4. Intervención / Comparador:</strong> Dosis, posología y brazo control.</li>
              <li><strong className="text-slate-800">5. Resultados ($p$, IC 95%, OR/RR/HR):</strong> Cifras estadísticas primarias exactas.</li>
              <li><strong className="text-slate-800">6. Conclusión:</strong> Declaración principal del investigador.</li>
            </ul>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Política Cero Alucinaciones:</strong> Cualquier dato no explícito en el PDF se etiqueta como <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">No reportado</code> para contactar a los autores.
            </span>
          </div>
        </div>
      </div>

      {/* Main Table & Markdown Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Sub-header toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-800">
              Estudios en la Matriz ({studies.length})
            </span>

            {/* View switchers */}
            <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                id="btn-view-mode-table"
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'table' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tabla Completa
              </button>
              <button
                type="button"
                id="btn-view-mode-cards"
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'cards' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Fichas Clínicas
              </button>
              <button
                type="button"
                id="btn-view-mode-markdown"
                onClick={() => setViewMode('markdown')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  viewMode === 'markdown' ? 'bg-indigo-600 text-white font-semibold shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Código Markdown
              </button>
            </div>
          </div>

          {/* Search filter & Add manually button */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Filtrar por autor, resultado o población..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-52 sm:w-64"
            />

            <button
              type="button"
              id="btn-add-study-manually"
              onClick={() => {
                setEditingStudy({
                  id: `study-${Date.now()}`,
                  authorAndYear: '',
                  studyDesignAndSampleSize: '',
                  population: '',
                  interventionComparator: '',
                  mainResults: '',
                  authorConclusion: '',
                });
                setIsEditModalOpen(true);
              }}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Registro</span>
            </button>
          </div>
        </div>

        {/* View Mode 1: Table */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-3 px-3.5 w-44">Autor y Año</th>
                  <th className="py-3 px-3.5 w-48">Diseño y Muestra ($N$)</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Población (Inclusión / Exclusión)</th>
                  <th className="py-3 px-3.5 w-56">Intervención / Comparador</th>
                  <th className="py-3 px-3.5 min-w-[220px]">Resultados Principales ($p$, IC 95%, HR/RR/OR)</th>
                  <th className="py-3 px-3.5 min-w-[200px]">Conclusión del Autor</th>
                  <th className="py-3 px-2 w-20 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredStudies.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No se encontraron estudios que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  filteredStudies.map((study) => {
                    const hasNotReported = 
                      study.population.includes('No reportado') || 
                      study.interventionComparator.includes('No reportado') ||
                      study.mainResults.includes('No reportado');

                    return (
                      <tr key={study.id} className="hover:bg-slate-50/80 transition-colors align-top">
                        {/* 1. Autor y Año */}
                        <td className="py-3 px-3.5 font-semibold text-slate-900">
                          <div>{study.authorAndYear || 'No reportado'}</div>
                          {study.fileName && (
                            <span className="text-[10px] text-slate-400 font-normal truncate block max-w-[150px]" title={study.fileName}>
                              {study.fileName}
                            </span>
                          )}
                          {study.isExtractedWithAi && (
                            <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              <Sparkles className="w-2.5 h-2.5" />
                              IA PDF
                            </span>
                          )}
                        </td>

                        {/* 2. Diseño y Muestra */}
                        <td className="py-3 px-3.5 text-slate-700">
                          {study.studyDesignAndSampleSize === 'No reportado' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                              No reportado
                            </span>
                          ) : (
                            study.studyDesignAndSampleSize
                          )}
                        </td>

                        {/* 3. Población */}
                        <td className="py-3 px-3.5 text-slate-700 leading-relaxed">
                          {study.population === 'No reportado' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                              No reportado
                            </span>
                          ) : (
                            study.population
                          )}
                        </td>

                        {/* 4. Intervención / Comparador */}
                        <td className="py-3 px-3.5 text-slate-700 leading-relaxed">
                          {study.interventionComparator === 'No reportado' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                              No reportado
                            </span>
                          ) : (
                            study.interventionComparator
                          )}
                        </td>

                        {/* 5. Resultados principales */}
                        <td className="py-3 px-3.5 text-slate-800 leading-relaxed font-mono text-[11px]">
                          {study.mainResults === 'No reportado' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-sans font-medium">
                              No reportado
                            </span>
                          ) : (
                            study.mainResults
                          )}
                        </td>

                        {/* 6. Conclusión */}
                        <td className="py-3 px-3.5 text-slate-700 leading-relaxed italic text-[11px]">
                          "{study.authorConclusion || 'No reportado'}"
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStudy(study);
                                setIsEditModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors cursor-pointer"
                              title="Editar este registro"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudy(study.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* View Mode 2: Fichas Clínicas (Cards) */}
        {viewMode === 'cards' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredStudies.map((study) => (
              <div key={study.id} className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 space-y-3 hover:shadow-xs transition-shadow">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {study.authorAndYear}
                      {study.isExtractedWithAi && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          IA
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {study.studyDesignAndSampleSize}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingStudy(study);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1 text-slate-500 hover:text-indigo-600 rounded"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteStudy(study.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <strong className="text-slate-800 block font-semibold text-[11px]">Población:</strong>
                    <p className="text-slate-600 leading-relaxed">{study.population}</p>
                  </div>

                  <div>
                    <strong className="text-slate-800 block font-semibold text-[11px]">Intervención / Comparador:</strong>
                    <p className="text-slate-600 leading-relaxed">{study.interventionComparator}</p>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <strong className="text-slate-800 block font-semibold text-[11px] mb-1">Resultados Principales (Outcomes):</strong>
                    <p className="font-mono text-[11px] text-slate-800">{study.mainResults}</p>
                  </div>

                  <div>
                    <strong className="text-slate-800 block font-semibold text-[11px]">Conclusión:</strong>
                    <p className="text-slate-600 italic text-[11px]">"{study.authorConclusion}"</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View Mode 3: Raw Markdown */}
        {viewMode === 'markdown' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-600">
                Sintaxis Markdown oficial con las 6 columnas exigidas por PRISMA 2020:
              </span>
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={14}
              value={markdownContent}
              className="w-full font-mono text-xs p-3 bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Modal: Paste Article Text / Abstract */}
      {isPasteTextModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Extraer Datos desde Texto de Artículo o Abstract
                </h3>
              </div>
              <button
                onClick={() => setIsPasteTextModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Pega el texto completo del artículo publicado, el resumen estructurado de PubMed o la sección de Métodos y Resultados. Gemini extraerá rigurosamente las 6 columnas metodológicas de la matriz.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Título o Identificador del Estudio (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ej. DELIVER trial (Solomon et al., NEJM 2022)"
                  value={pastedArticleTitle}
                  onChange={(e) => setPastedArticleTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Texto del Artículo / Abstract:
                </label>
                <textarea
                  rows={8}
                  placeholder="Pega aquí el texto completo, resumen, métodos o tablas del artículo..."
                  value={pastedArticleText}
                  onChange={(e) => setPastedArticleText(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 rounded-lg font-sans focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPasteTextModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={!pastedArticleText.trim() || isUploading}
                onClick={handleExtractFromPastedText}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Iniciar Extracción con IA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit / Add Study Record */}
      {isEditModalOpen && editingStudy && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingStudy.authorAndYear ? `Editar Estudio: ${editingStudy.authorAndYear}` : 'Registrar Nuevo Estudio en la Matriz'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  1. Autor y Año:
                </label>
                <input
                  type="text"
                  placeholder="Ej. Solomon et al., 2022"
                  value={editingStudy.authorAndYear}
                  onChange={(e) => setEditingStudy({ ...editingStudy, authorAndYear: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  2. Diseño del estudio y tamaño de la muestra ($N$):
                </label>
                <input
                  type="text"
                  placeholder="Ej. Ensayo clínico aleatorizado, doble ciego (N = 6,263)"
                  value={editingStudy.studyDesignAndSampleSize}
                  onChange={(e) => setEditingStudy({ ...editingStudy, studyDesignAndSampleSize: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  3. Población (Criterios de inclusión/exclusión):
                </label>
                <textarea
                  rows={3}
                  placeholder="Criterios de inclusión (edad, FEVI, estadios) y exclusión (TFGe, comorbilidades)... Si no se indica, escribe 'No reportado'"
                  value={editingStudy.population}
                  onChange={(e) => setEditingStudy({ ...editingStudy, population: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  4. Intervención / Comparador:
                </label>
                <textarea
                  rows={2}
                  placeholder="Fármaco activo (dosis, posología) vs. Placebo/control con terapia de base... Si no se indica, 'No reportado'"
                  value={editingStudy.interventionComparator}
                  onChange={(e) => setEditingStudy({ ...editingStudy, interventionComparator: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  5. Resultados principales (Outcomes primarios con valores estadísticos: $p$, IC 95%, OR/RR/HR):
                </label>
                <textarea
                  rows={3}
                  placeholder="Desenlace compuesto primario: HR = 0.82 (IC 95%: 0.73 - 0.92; p < 0.001)... Si falta algún valor, indica 'No reportado'"
                  value={editingStudy.mainResults}
                  onChange={(e) => setEditingStudy({ ...editingStudy, mainResults: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  6. Conclusión principal del autor:
                </label>
                <textarea
                  rows={2}
                  placeholder="Conclusión textual informada por los autores en el manuscrito... Si falta, 'No reportado'"
                  value={editingStudy.authorConclusion}
                  onChange={(e) => setEditingStudy({ ...editingStudy, authorConclusion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveStudyEdit(editingStudy)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Guardar Registro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
