import React from 'react';
import { 
  FileText, 
  CheckSquare, 
  GitFork, 
  MessageSquare, 
  SlidersHorizontal, 
  Download,
  BookOpen,
  ShieldCheck,
  Award,
  Layers,
  FileSpreadsheet,
  Target
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  completedItemsCount: number;
  totalItemsCount: number;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  completedItemsCount,
  totalItemsCount,
  onOpenExport,
}) => {
  const percent = Math.round((completedItemsCount / totalItemsCount) * 100);

  const tabs = [
    { id: 'chat', label: 'Asistente Metodológico', icon: MessageSquare },
    { id: 'pico', label: 'Marco PICO & Búsqueda', icon: SlidersHorizontal },
    { id: 'matrix', label: 'Matriz de Evidencia (PDF)', icon: FileSpreadsheet },
    { id: 'outcomes', label: 'Variables & Outcomes', icon: Target },
    { id: 'writer', label: 'Redacción Modular', icon: FileText },
    { id: 'meta', label: 'Metaanálisis (Forest & Funnel)', icon: Layers },
    { id: 'grade', label: 'Certeza GRADE', icon: Award },
    { id: 'flow', label: 'Diagrama de Flujo', icon: GitFork },
    { id: 'checklist', label: 'Checklist PRISMA 2020', icon: CheckSquare },
  ];

  return (
    <header id="app-header" className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                PRISMA 2020 Research Assistant
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                BMJ 2021;372:n160
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Metodología de Revisiones Sistemáticas & Metaanálisis • Marco PICO • Trazabilidad y Cero Alucinaciones
            </p>
          </div>
        </div>

        {/* Status indicator & Export */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-700">Cumplimiento PRISMA</div>
              <div className="text-[11px] text-slate-500">{completedItemsCount} de {totalItemsCount} ítems ({percent}%)</div>
            </div>
            <div className="w-10 h-10 relative flex items-center justify-center">
              <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-slate-200"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 transition-all duration-500"
                  strokeDasharray={`${percent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-[10px] font-bold text-slate-700">{percent}%</span>
            </div>
          </div>

          <button
            id="btn-export-manuscript"
            onClick={onOpenExport}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            title="Exportar informe o manuscrito"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Manuscrito</span>
          </button>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto no-scrollbar border-t border-slate-100 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-2.5 px-3 border-b-2 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
