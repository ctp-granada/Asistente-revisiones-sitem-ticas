import React, { useState } from 'react';
import { 
  GitFork, 
  Plus, 
  Trash2, 
  Download, 
  Copy, 
  Check, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { FlowDiagramState } from '../types';

interface FlowDiagramViewerProps {
  flowData: FlowDiagramState;
  onChangeFlowData: (data: FlowDiagramState) => void;
  onSendToChat: (prompt: string) => void;
}

export const FlowDiagramViewer: React.FC<FlowDiagramViewerProps> = ({
  flowData,
  onChangeFlowData,
  onSendToChat,
}) => {
  const [activeTab, setActiveTab] = useState<'diagram' | 'editor'>('diagram');
  const [copiedSummary, setCopiedSummary] = useState(false);

  // Derived totals
  const totalDbRecords = flowData.databasesIdentified.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);
  const totalRegRecords = flowData.registersIdentified.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);
  const totalIdentifiedDatabasesAndRegisters = totalDbRecords + totalRegRecords;
  const totalRemovedBeforeScreening = (Number(flowData.duplicatesRemoved) || 0) + 
                                      (Number(flowData.automationExcludedPreScreening) || 0) + 
                                      (Number(flowData.otherRemovedPreScreening) || 0);

  const totalOtherIdentified = flowData.otherSourcesIdentified.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);
  const totalExcludedReasonsCount = flowData.reportsExcludedReasons.reduce((acc, curr) => acc + (Number(curr.count) || 0), 0);

  // Mathematical validation check
  const calculatedScreened = totalIdentifiedDatabasesAndRegisters - totalRemovedBeforeScreening;
  const isScreenedConsistent = flowData.recordsScreened === calculatedScreened;

  const handleUpdateField = (field: keyof FlowDiagramState, value: any) => {
    onChangeFlowData({ ...flowData, [field]: value });
  };

  const handleUpdateDatabase = (index: number, count: number) => {
    const updated = [...flowData.databasesIdentified];
    updated[index].count = count;
    onChangeFlowData({ ...flowData, databasesIdentified: updated });
  };

  const handleAddExclusionReason = () => {
    const newReason = {
      id: Date.now().toString(),
      reason: 'Nuevo motivo de exclusión clínica',
      count: 0,
    };
    onChangeFlowData({
      ...flowData,
      reportsExcludedReasons: [...flowData.reportsExcludedReasons, newReason],
    });
  };

  const handleRemoveExclusionReason = (id: string) => {
    onChangeFlowData({
      ...flowData,
      reportsExcludedReasons: flowData.reportsExcludedReasons.filter((r) => r.id !== id),
    });
  };

  const handleUpdateExclusionReason = (id: string, reason: string, count: number) => {
    onChangeFlowData({
      ...flowData,
      reportsExcludedReasons: flowData.reportsExcludedReasons.map((r) =>
        r.id === id ? { ...r, reason, count } : r
      ),
    });
  };

  const generateTextSummary = () => {
    return `### Flujo de Selección de Estudios (PRISMA 2020)
La búsqueda bibliográfica inicial identificó un total de ${totalIdentifiedDatabasesAndRegisters} registros (${flowData.databasesIdentified.map(d => `${d.name}: n = ${d.count}`).join(', ')}; registros de ensayos: ${flowData.registersIdentified.map(r => `${r.name}: n = ${r.count}`).join(', ')}). 
Tras la eliminación de ${flowData.duplicatesRemoved} registros duplicados, se procedió al cribado ciego de títulos y resúmenes de ${flowData.recordsScreened} registros, excluyéndose ${flowData.recordsExcludedScreening} por no cumplir los criterios de elegibilidad.
Se buscaron para recuperación a texto completo ${flowData.reportsSought} informes, de los cuales ${flowData.reportsNotRetrieved} no pudieron ser recuperados. Se evaluaron exhaustivamente ${flowData.reportsAssessed} informes a texto completo, excluyéndose ${totalExcludedReasonsCount} por los siguientes motivos específicos: ${flowData.reportsExcludedReasons.map(r => `${r.reason} (n = ${r.count})`).join('; ')}.
Finalmente, se incluyeron ${flowData.totalStudiesIncluded} estudios (${flowData.totalReportsIncluded} informes) en la revisión sistemática.`;
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(generateTextSummary());
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <GitFork className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Diagrama de Flujo PRISMA 2020 (Ítem 16a)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Plantilla oficial BMJ 2021;372:n71 para identificación, cribado, elegibilidad e inclusión de estudios.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
            <button
              onClick={() => setActiveTab('diagram')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'diagram' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Visualizar Diagrama
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                activeTab === 'editor' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editar Cifras & Motivos
            </button>
          </div>

          <button
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSummary ? 'Texto Copiado' : 'Copiar Texto para Manuscrito'}</span>
          </button>
        </div>
      </div>

      {/* Consistency Validation Warning */}
      {!isScreenedConsistent && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Aviso de Trazabilidad Matemática:</strong> El número de registros cribados ({flowData.recordsScreened}) difiere de los identificados ({totalIdentifiedDatabasesAndRegisters}) menos los eliminados antes del cribado ({totalRemovedBeforeScreening} = {calculatedScreened}). Asegúrate de cuadrar los números para evitar objeciones de los revisores.
          </div>
        </div>
      )}

      {activeTab === 'editor' ? (
        /* Data Editor Form */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          {/* Section 1: Identification */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              1. Fase de Identificación (Bases de datos y Registros)
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Registros por Base Bibliográfica:</label>
              {flowData.databasesIdentified.map((db, idx) => (
                <div key={db.id} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">{db.name}:</span>
                  <input
                    type="number"
                    value={db.count}
                    onChange={(e) => handleUpdateDatabase(idx, parseInt(e.target.value) || 0)}
                    className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-xs font-semibold text-slate-700 block">Eliminados antes del cribado:</label>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">Duplicados eliminados:</span>
                <input
                  type="number"
                  value={flowData.duplicatesRemoved}
                  onChange={(e) => handleUpdateField('duplicatesRemoved', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                />
              </div>
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-600">Excluidos por automatización:</span>
                <input
                  type="number"
                  value={flowData.automationExcludedPreScreening}
                  onChange={(e) => handleUpdateField('automationExcludedPreScreening', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                />
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 pt-4">
              2. Fase de Cribado (Título y Resumen)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Registros cribados (título/resumen):</span>
                <input
                  type="number"
                  value={flowData.recordsScreened}
                  onChange={(e) => handleUpdateField('recordsScreened', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Registros excluidos en cribado:</span>
                <input
                  type="number"
                  value={flowData.recordsExcludedScreening}
                  onChange={(e) => handleUpdateField('recordsExcludedScreening', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Eligibility and Inclusion */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">
              3. Fase de Elegibilidad (Texto Completo)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Informes buscados para recuperación:</span>
                <input
                  type="number"
                  value={flowData.reportsSought}
                  onChange={(e) => handleUpdateField('reportsSought', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Informes no recuperados:</span>
                <input
                  type="number"
                  value={flowData.reportsNotRetrieved}
                  onChange={(e) => handleUpdateField('reportsNotRetrieved', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600">Informes evaluados a texto completo:</span>
                <input
                  type="number"
                  value={flowData.reportsAssessed}
                  onChange={(e) => handleUpdateField('reportsAssessed', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                />
              </div>
            </div>

            {/* Motivos de exclusión */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Desglose de motivos de exclusión:</label>
                <button
                  type="button"
                  onClick={handleAddExclusionReason}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Añadir motivo
                </button>
              </div>
              {flowData.reportsExcludedReasons.map((reason) => (
                <div key={reason.id} className="flex items-center gap-2 text-xs">
                  <input
                    type="text"
                    value={reason.reason}
                    onChange={(e) => handleUpdateExclusionReason(reason.id, e.target.value, reason.count)}
                    className="flex-1 px-2 py-1 rounded border border-slate-200"
                  />
                  <input
                    type="number"
                    value={reason.count}
                    onChange={(e) => handleUpdateExclusionReason(reason.id, reason.reason, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1 rounded border border-slate-200 text-right font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveExclusionReason(reason.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 pt-4">
              4. Fase de Inclusión
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-semibold">Total de estudios incluidos (n):</span>
                <input
                  type="number"
                  value={flowData.totalStudiesIncluded}
                  onChange={(e) => handleUpdateField('totalStudiesIncluded', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono font-bold text-indigo-700"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-600 font-semibold">Total de informes incluidos (n):</span>
                <input
                  type="number"
                  value={flowData.totalReportsIncluded}
                  onChange={(e) => handleUpdateField('totalReportsIncluded', parseInt(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-200 text-right font-mono font-bold text-indigo-700"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Visual Flow Diagram Display (Matching BMJ 2021;372:n71) */
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs space-y-6 overflow-x-auto">
          <div className="min-w-[700px] max-w-4xl mx-auto space-y-6">
            
            {/* Top Stage Header */}
            <div className="grid grid-cols-12 gap-4 text-center text-xs font-bold text-white">
              <div className="col-span-8 bg-amber-500 py-2 rounded-t-lg shadow-xs uppercase tracking-wide">
                Identificación de nuevos estudios mediante bases de datos y registros
              </div>
              <div className="col-span-4 bg-amber-600 py-2 rounded-t-lg shadow-xs uppercase tracking-wide">
                Identificación mediante otros métodos
              </div>
            </div>

            {/* Stage 1: Identification Boxes */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Left Column: DB Identification */}
              <div className="col-span-4 bg-slate-50 border-2 border-slate-700 rounded-lg p-3 text-xs space-y-1">
                <div className="font-bold text-slate-800">Registros identificados de:</div>
                <div className="text-[11px] text-slate-600">
                  Bases de datos (n = {totalDbRecords}):
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                    {flowData.databasesIdentified.map(d => (
                      <li key={d.id}>{d.name} (n = {d.count})</li>
                    ))}
                  </ul>
                </div>
                <div className="text-[11px] text-slate-600 pt-1 border-t border-slate-200">
                  Registros de ensayos (n = {totalRegRecords}):
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                    {flowData.registersIdentified.map(r => (
                      <li key={r.id}>{r.name} (n = {r.count})</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Arrow to Duplicates */}
              <div className="col-span-4 flex flex-col items-center justify-center">
                <div className="w-full bg-slate-50 border-2 border-slate-700 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-bold text-slate-800">Registros eliminados antes del cribado:</div>
                  <div className="text-[11px] text-slate-600">
                    • Duplicados eliminados (n = {flowData.duplicatesRemoved})
                  </div>
                  {flowData.automationExcludedPreScreening > 0 && (
                    <div className="text-[11px] text-slate-600">
                      • Inelegibles por automatización (n = {flowData.automationExcludedPreScreening})
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Other Sources */}
              <div className="col-span-4 bg-slate-50 border-2 border-slate-700 rounded-lg p-3 text-xs space-y-1">
                <div className="font-bold text-slate-800">Registros identificados de:</div>
                <div className="text-[11px] text-slate-600">
                  • Sitios web y organizaciones (n = {totalOtherIdentified})
                  <br />
                  • Búsqueda de citas (snowballing)
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center -my-2">
              <span className="text-slate-400 font-bold text-lg">↓</span>
            </div>

            {/* Stage 2: Screening Boxes */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Screened Box */}
              <div className="col-span-4 bg-slate-50 border-2 border-slate-700 rounded-lg p-3 text-xs flex flex-col justify-center text-center">
                <div className="font-bold text-slate-800">Registros cribados</div>
                <div className="text-sm font-semibold text-indigo-700 mt-1">(n = {flowData.recordsScreened})</div>
              </div>

              {/* Excluded at screening */}
              <div className="col-span-4 bg-rose-50 border-2 border-rose-300 rounded-lg p-3 text-xs flex flex-col justify-center text-center">
                <div className="font-bold text-rose-900">Registros excluidos**</div>
                <div className="text-sm font-semibold text-rose-700 mt-1">(n = {flowData.recordsExcludedScreening})</div>
                <div className="text-[10px] text-rose-500 mt-0.5">Tras lectura de título y resumen</div>
              </div>

              {/* Other methods sought */}
              <div className="col-span-4 bg-slate-50 border-2 border-slate-700 rounded-lg p-3 text-xs text-center">
                <div className="font-bold text-slate-800">Informes buscados para recuperación</div>
                <div className="text-sm font-semibold text-indigo-700 mt-1">(n = {flowData.otherReportsSought})</div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center -my-2">
              <span className="text-slate-400 font-bold text-lg">↓</span>
            </div>

            {/* Stage 3: Retrieval & Eligibility */}
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Reports Sought & Not retrieved */}
              <div className="col-span-4 space-y-2">
                <div className="bg-slate-50 border-2 border-slate-700 rounded-lg p-2.5 text-xs text-center">
                  <div className="font-bold text-slate-800">Informes buscados para recuperación</div>
                  <div className="text-xs font-semibold text-slate-700">(n = {flowData.reportsSought})</div>
                </div>
                <div className="bg-slate-50 border-2 border-slate-700 rounded-lg p-2.5 text-xs text-center">
                  <div className="font-bold text-slate-800">Informes evaluados a texto completo</div>
                  <div className="text-xs font-semibold text-indigo-700">(n = {flowData.reportsAssessed})</div>
                </div>
              </div>

              {/* Exclusions breakdown at Full Text */}
              <div className="col-span-4 bg-rose-50 border-2 border-rose-400 rounded-lg p-3 text-xs space-y-1">
                <div className="font-bold text-rose-900">
                  Informes excluidos a texto completo (n = {totalExcludedReasonsCount}):
                </div>
                <ul className="text-[11px] text-rose-800 space-y-1 mt-1">
                  {flowData.reportsExcludedReasons.map(r => (
                    <li key={r.id} className="flex justify-between">
                      <span className="pr-1">• {r.reason}</span>
                      <strong className="shrink-0">(n = {r.count})</strong>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Other methods assessed */}
              <div className="col-span-4 space-y-2">
                <div className="bg-slate-50 border-2 border-slate-700 rounded-lg p-2.5 text-xs text-center">
                  <div className="font-bold text-slate-800">Informes evaluados (otras fuentes)</div>
                  <div className="text-xs font-semibold text-slate-700">(n = {flowData.otherReportsAssessed})</div>
                </div>
                <div className="bg-slate-50 border-2 border-slate-700 rounded-lg p-2.5 text-xs text-center">
                  <div className="font-bold text-slate-800">Estudios incluidos de otras fuentes</div>
                  <div className="text-xs font-semibold text-indigo-700">(n = {flowData.otherStudiesIncluded})</div>
                </div>
              </div>
            </div>

            {/* Connecting Arrow */}
            <div className="flex justify-center -my-2">
              <span className="text-slate-400 font-bold text-lg">↓</span>
            </div>

            {/* Stage 4: Included (Final Bottom Box) */}
            <div className="bg-emerald-50 border-2 border-emerald-600 rounded-xl p-4 text-center max-w-lg mx-auto shadow-xs">
              <div className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                Estudios e informes finalmente incluidos en la revisión
              </div>
              <div className="flex items-center justify-center gap-6 mt-2">
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-700">{flowData.totalStudiesIncluded}</div>
                  <div className="text-xs font-semibold text-emerald-900">Estudios incluidos</div>
                </div>
                <div className="h-8 w-px bg-emerald-300" />
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-700">{flowData.totalReportsIncluded}</div>
                  <div className="text-xs font-semibold text-emerald-900">Informes / Artículos</div>
                </div>
              </div>
            </div>

            {/* Footer reference note */}
            <div className="text-[11px] text-slate-400 text-center pt-2">
              Adaptado de Page MJ, McKenzie JE, Bossuyt PM, et al. The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. <em>BMJ</em> 2021;372:n71.
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
