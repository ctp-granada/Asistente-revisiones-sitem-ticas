import React, { useState } from 'react';
import { 
  CheckSquare, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { PrismaChecklistItem } from '../types';

interface ChecklistTableProps {
  items: PrismaChecklistItem[];
  onUpdateItem: (itemNumber: string, updates: Partial<PrismaChecklistItem>) => void;
  onSendToChat: (prompt: string) => void;
}

export const ChecklistTable: React.FC<ChecklistTableProps> = ({
  items,
  onUpdateItem,
  onSendToChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const sectionsList = ['ALL', 'TITLE', 'ABSTRACT', 'INTRODUCTION', 'METHODS', 'RESULTS', 'DISCUSSION', 'OTHER'];

  const filteredItems = items.filter((item) => {
    const matchesSection = selectedSection === 'ALL' || item.section === selectedSection;
    const matchesStatus = selectedStatus === 'ALL' || item.status === selectedStatus;
    const matchesQuery = 
      item.itemNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSection && matchesStatus && matchesQuery;
  });

  const completedCount = items.filter((i) => i.status === 'completed').length;
  const inProgressCount = items.filter((i) => i.status === 'in_progress').length;
  const notStartedCount = items.filter((i) => i.status === 'not_started').length;

  const toggleExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Banner and Summary */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Lista de Verificación PRISMA 2020 (27 Ítems)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Directriz oficial para la comunicación transparente de revisiones sistemáticas (Page MJ et al. BMJ 2021;372:n160).
          </p>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {completedCount} Cumplidos
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            {inProgressCount} En progreso
          </span>
          <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            {notStartedCount} Pendientes
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            id="input-search-checklist"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por ítem, tema o directriz..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:bg-white text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Section filter */}
          <select
            id="select-section-filter"
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">Todas las Secciones ({items.length})</option>
            {sectionsList.filter((s) => s !== 'ALL').map((sec) => (
              <option key={sec} value={sec}>
                {sec}
              </option>
            ))}
          </select>

          {/* Status filter */}
          <select
            id="select-status-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="completed">Cumplidos</option>
            <option value="in_progress">En progreso</option>
            <option value="not_started">No iniciados</option>
          </select>
        </div>
      </div>

      {/* Checklist Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-14">Ítem</th>
                <th className="py-3 px-4 w-32">Sección / Tema</th>
                <th className="py-3 px-4">Recomendación de Reporte (PRISMA 2020)</th>
                <th className="py-3 px-4 w-44">Ubicación en Manuscrito</th>
                <th className="py-3 px-4 w-36">Estado</th>
                <th className="py-3 px-4 w-12 text-center">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredItems.map((item) => {
                const isExpanded = expandedItemId === item.itemNumber;
                return (
                  <React.Fragment key={item.itemNumber}>
                    <tr className={`hover:bg-slate-50 transition-colors ${isExpanded ? 'bg-indigo-50/40' : ''}`}>
                      {/* Item # */}
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono">
                        {item.itemNumber}
                      </td>

                      {/* Section & Topic */}
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 inline-block mb-1">
                          {item.section}
                        </span>
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {item.topic}
                        </div>
                      </td>

                      {/* Title / Description */}
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 leading-snug">
                          {item.title}
                        </div>
                        {item.essentialElements && (
                          <div className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                            {item.essentialElements[0]}
                          </div>
                        )}
                      </td>

                      {/* Location in report */}
                      <td className="py-3 px-4">
                        <input
                          type="text"
                          value={item.locationReported}
                          onChange={(e) => onUpdateItem(item.itemNumber, { locationReported: e.target.value })}
                          placeholder="Ej. Métodos / Pág. 3"
                          className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded focus:ring-1 focus:ring-indigo-600 focus:outline-hidden bg-slate-50 focus:bg-white text-slate-800"
                        />
                      </td>

                      {/* Status select */}
                      <td className="py-3 px-4">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateItem(item.itemNumber, { status: e.target.value as any })}
                          className={`w-full text-[11px] font-semibold px-2 py-1 rounded border focus:outline-hidden cursor-pointer ${
                            item.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : item.status === 'in_progress'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="not_started">Pendiente</option>
                          <option value="in_progress">En progreso</option>
                          <option value="completed">Cumplido</option>
                          <option value="not_applicable">N / A</option>
                        </select>
                      </td>

                      {/* Toggle details */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => toggleExpand(item.itemNumber)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer"
                          title="Ver elementos esenciales y adicionales"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>

                    {/* Expandable row: Essential & Additional Elements */}
                    {isExpanded && (
                      <tr className="bg-indigo-50/60 border-b border-indigo-100">
                        <td colSpan={6} className="p-4 sm:p-5 text-xs space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Essential elements */}
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                              <span className="font-bold text-slate-800 block text-xs flex items-center justify-between">
                                <span>Elementos Esenciales (Essential Elements):</span>
                                <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded">Obligatorios</span>
                              </span>
                              <ul className="list-disc pl-4 space-y-1 text-slate-700 text-[11px] leading-relaxed">
                                {item.essentialElements.map((el, idx) => (
                                  <li key={idx}>{el}</li>
                                ))}
                              </ul>
                            </div>

                            {/* Additional elements */}
                            <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2 flex flex-col justify-between">
                              <div>
                                <span className="font-bold text-slate-800 block text-xs flex items-center justify-between">
                                  <span>Elementos Adicionales Recomendados:</span>
                                  <span className="text-[10px] text-slate-500 font-normal">Buenas prácticas</span>
                                </span>
                                {item.additionalElements && item.additionalElements.length > 0 ? (
                                  <ul className="list-disc pl-4 space-y-1 text-slate-600 text-[11px] leading-relaxed mt-1">
                                    {item.additionalElements.map((el, idx) => (
                                      <li key={idx}>{el}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-[11px] text-slate-400 italic mt-1">
                                    No se aplican elementos adicionales específicos para este ítem.
                                  </p>
                                )}
                              </div>

                              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                <button
                                  onClick={() => onSendToChat(`Como experto en PRISMA 2020, explícame cómo redactar y reportar con la máxima precisión el Ítem ${item.itemNumber} (${item.topic}): "${item.title}". ¿Qué errores metodológicos comunes debo evitar en la revisión por pares?`)}
                                  className="inline-flex items-center gap-1.5 text-xs text-indigo-700 font-semibold hover:text-indigo-900 cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Preguntar pautas de este ítem al Copiloto</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
