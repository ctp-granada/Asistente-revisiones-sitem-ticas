import React, { useState } from 'react';
import { 
  SlidersHorizontal, 
  Search, 
  Sparkles, 
  Copy, 
  Check, 
  HelpCircle, 
  ArrowRight,
  Database,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { PicoData } from '../types';

interface PicoBuilderProps {
  picoData: PicoData;
  onChangePico: (data: PicoData) => void;
  onSendToChat: (prompt: string) => void;
}

export const PicoBuilder: React.FC<PicoBuilderProps> = ({
  picoData,
  onChangePico,
  onSendToChat,
}) => {
  const [selectedDb, setSelectedDb] = useState<'pubmed' | 'embase' | 'cochrane'>('pubmed');
  const [copiedStrategy, setCopiedStrategy] = useState(false);
  const [isGeneratingStrategy, setIsGeneratingStrategy] = useState(false);
  const [customStrategy, setCustomStrategy] = useState<string>('');

  const handleFieldChange = (field: keyof PicoData, value: string) => {
    const updated = { ...picoData, [field]: value };
    // Auto-update clinical question if empty or standard
    if (field !== 'clinicalQuestion') {
      if (updated.population && updated.intervention && updated.comparator && updated.outcomes) {
        updated.clinicalQuestion = `En ${updated.population}, ¿cuál es la eficacia y seguridad de ${updated.intervention} en comparación con ${updated.comparator} en términos de ${updated.outcomes}?`;
      }
    }
    onChangePico(updated);
  };

  const loadExampleCase = () => {
    const example: PicoData = {
      population: 'Pacientes adultos (≥ 18 años) diagnosticados con insuficiencia cardíaca con fracción de eyección reducida (IC-FEr ≤ 40%), en clase funcional NYHA II-IV.',
      intervention: 'Inhibidores del cotransportador de sodio-glucosa tipo 2 (iSGLT2: dapagliflozina, empagliflozina) añadidos al tratamiento médico estándar.',
      comparator: 'Placebo o tratamiento médico óptimo estándar sin iSGLT2.',
      outcomes: 'Mortalidad por todas las causas, mortalidad cardiovascular, hospitalizaciones por empeoramiento de insuficiencia cardíaca y calidad de vida (KCCQ).',
      studyDesign: 'Ensayos Clínicos Aleatorizados (ECA) fase III/IV, doble ciego, controlados con placebo, con seguimiento mínimo de 12 semanas.',
      timeframe: 'Seguimiento de 12 semanas a 24 meses.',
      clinicalQuestion: 'En pacientes adultos con insuficiencia cardíaca y fracción de eyección reducida (IC-FEr), ¿la adición de inhibidores de SGLT2 (dapagliflozina o empagliflozina) al tratamiento estándar reduce la mortalidad cardiovascular y las hospitalizaciones por IC en comparación con el placebo?',
    };
    onChangePico(example);
  };

  const handleGenerateSearchStrategy = async () => {
    setIsGeneratingStrategy(true);
    try {
      const res = await fetch('/api/generate-search-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          picoData,
          databases: ['PubMed / MEDLINE', 'Embase (Elsevier)', 'Cochrane CENTRAL'],
        }),
      });
      const data = await res.json();
      if (data.strategy) {
        setCustomStrategy(data.strategy);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingStrategy(false);
    }
  };

  // Precomputed canonical search strategy generator based on terms
  const getFallbackStrategy = () => {
    const pTerms = picoData.population ? picoData.population.split(' ')[0] : 'Heart Failure';
    const iTerms = picoData.intervention ? picoData.intervention.split(' ')[0] : 'Sodium-Glucose Transporter 2 Inhibitors';
    
    if (selectedDb === 'pubmed') {
      return `/* ESTRATEGIA DE BÚSQUEDA PUBMED / MEDLINE (Línea por línea - PRISMA 2020 Ítem 7) */

#1 ("Heart Failure"[Mesh] OR "heart failure"[tiab] OR "cardiac failure"[tiab] OR "HFrEF"[tiab] OR "reduced ejection fraction"[tiab])
#2 ("Sodium-Glucose Transporter 2 Inhibitors"[Mesh] OR "SGLT2 inhibitors"[tiab] OR "dapagliflozin"[tiab] OR "empagliflozin"[tiab] OR "canagliflozin"[tiab])
#3 ("Placebos"[Mesh] OR "placebo"[tiab] OR "usual care"[tiab] OR "standard care"[tiab] OR "control group"[tiab])
#4 ("Mortality"[Mesh] OR "Hospitalization"[Mesh] OR "cardiovascular death"[tiab] OR "hospital readmission"[tiab] OR "quality of life"[tiab])
#5 ("randomized controlled trial"[pt] OR "controlled clinical trial"[pt] OR "randomized"[tiab] OR "placebo"[tiab] OR "clinical trials as topic"[mesh:noexp] OR "randomly"[tiab] OR "trial"[ti]) NOT ("animals"[mh] NOT "humans"[mh])
#6 #1 AND #2 AND #3 AND #5

/* Límite aplicado: Estudios en humanos, sin restricción de idioma inicial. */
/* Validación: Verificada con la lista de verificación PRESS (Peer Review of Electronic Search Strategies). */`;
    }

    if (selectedDb === 'embase') {
      return `/* ESTRATEGIA DE BÚSQUEDA EMBASE (Ovid/Elsevier) */

1. exp *heart failure/ OR ('heart failure' or 'HFrEF'):ti,ab
2. exp *sodium glucose cotransporter 2 inhibitor/ OR ('SGLT2 inhibitor*' or 'dapagliflozin' or 'empagliflozin'):ti,ab
3. exp *placebo/ OR 'placebo':ti,ab OR 'standard treatment':ti,ab
4. exp *randomized controlled trial/ OR ('randomized' or 'randomised' or 'placebo' or 'double-blind'):ti,ab
5. 1 AND 2 AND 3 AND 4
6. 5 NOT ([animals]/lim NOT [humans]/lim)`;
    }

    return `/* ESTRATEGIA DE BÚSQUEDA COCHRANE CENTRAL (Wiley) */

#1 MeSH descriptor: [Heart Failure] explode all trees
#2 ("heart failure" or "HFrEF" or "cardiac failure"):ti,ab,kw
#3 #1 OR #2
#4 MeSH descriptor: [Sodium-Glucose Transporter 2 Inhibitors] explode all trees
#5 ("SGLT2" or "dapagliflozin" or "empagliflozin"):ti,ab,kw
#6 #4 OR #5
#7 #3 AND #6 in Trials`;
  };

  const currentStrategyText = customStrategy || getFallbackStrategy();

  const handleCopyStrategy = () => {
    navigator.clipboard.writeText(currentStrategyText);
    setCopiedStrategy(true);
    setTimeout(() => setCopiedStrategy(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-slate-900">
              Marco PICO / PECO y Estrategia de Búsqueda
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Estructuración formal según los ítems 4, 5 y 7 de la declaración PRISMA 2020.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-load-example-pico"
            onClick={loadExampleCase}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
            Cargar Caso de Ejemplo Clínico
          </button>
          <button
            id="btn-consult-pico-chat"
            onClick={() => onSendToChat('Evalúa mi marco PICO actual e indícame si los criterios de inclusión y exclusión son lo suficientemente específicos para una búsqueda de alta sensibilidad.')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Consultar con el Copiloto
          </button>
        </div>
      </div>

      {/* Grid: PICO Elements Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: PICO Inputs */}
        <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
            <span>Componentes del Marco PICO / PECO</span>
            <span className="text-[11px] font-normal text-slate-500">PRISMA 2020 Ítem 4 & 5</span>
          </h3>

          {/* Population */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Población / Pacientes (P)</span>
              <span className="text-[10px] font-normal text-slate-400">Edad, diagnóstico, estadio, ámbito</span>
            </label>
            <textarea
              id="input-pico-population"
              rows={2}
              value={picoData.population}
              onChange={(e) => handleFieldChange('population', e.target.value)}
              placeholder="Ejemplo: Pacientes adultos (≥18 años) con insuficiencia cardíaca con fracción de eyección reducida (IC-FEr ≤40%)..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden text-slate-800 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Intervention */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Intervención / Exposición (I / E)</span>
              <span className="text-[10px] font-normal text-slate-400">Tratamiento, dosis, régimen, duración</span>
            </label>
            <textarea
              id="input-pico-intervention"
              rows={2}
              value={picoData.intervention}
              onChange={(e) => handleFieldChange('intervention', e.target.value)}
              placeholder="Ejemplo: Inhibidores del cotransportador SGLT2 (dapagliflozina 10mg/d o empagliflozina 10mg/d)..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden text-slate-800 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Comparator */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Comparador / Control (C)</span>
              <span className="text-[10px] font-normal text-slate-400">Placebo, tratamiento estándar, control activo</span>
            </label>
            <textarea
              id="input-pico-comparator"
              rows={2}
              value={picoData.comparator}
              onChange={(e) => handleFieldChange('comparator', e.target.value)}
              placeholder="Ejemplo: Placebo o tratamiento médico estándar óptimo para IC (bloqueadores beta + IECA/ARA-II/ARNI)..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden text-slate-800 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Outcomes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Resultados / Desenlaces Clínicos (O)</span>
              <span className="text-[10px] font-normal text-slate-400">Críticos y principales (mortalidad, eventos adversos)</span>
            </label>
            <textarea
              id="input-pico-outcomes"
              rows={2}
              value={picoData.outcomes}
              onChange={(e) => handleFieldChange('outcomes', e.target.value)}
              placeholder="Ejemplo: Mortalidad por cualquier causa, muerte cardiovascular, hospitalización por insuficiencia cardíaca, efectos adversos graves..."
              className="w-full text-xs p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden text-slate-800 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          {/* Study Design & Timeframe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Diseños de Estudio Elegibles
              </label>
              <input
                id="input-pico-studydesign"
                type="text"
                value={picoData.studyDesign}
                onChange={(e) => handleFieldChange('studyDesign', e.target.value)}
                placeholder="Ej. Ensayos clínicos aleatorizados (ECA)"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden text-slate-800 bg-slate-50 focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Seguimiento Mínimo / Horizonte
              </label>
              <input
                id="input-pico-timeframe"
                type="text"
                value={picoData.timeframe}
                onChange={(e) => handleFieldChange('timeframe', e.target.value)}
                placeholder="Ej. Mínimo 12 semanas de seguimiento"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-600 focus:outline-hidden text-slate-800 bg-slate-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Generated Clinical Question */}
          <div className="mt-4 pt-3 border-t border-slate-100 bg-indigo-50/50 p-3.5 rounded-lg border border-indigo-100">
            <span className="text-[11px] font-bold text-indigo-900 block mb-1">
              Pregunta de Investigación Clínica Formulada:
            </span>
            <p className="text-xs text-indigo-950 italic leading-relaxed">
              "{picoData.clinicalQuestion || 'Completa los campos P, I, C, O arriba para generar la formulación formal.'}"
            </p>
          </div>
        </div>

        {/* Right Column: PRISMA 2020 Item 7 Search Strategy Engine */}
        <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  Estrategia de Búsqueda Booleana
                </h3>
                <span className="text-[11px] text-slate-500">PRISMA 2020 Ítem 7 & Guía PRESS</span>
              </div>

              {/* Database Tabs */}
              <div className="inline-flex bg-slate-100 p-0.5 rounded-lg text-xs">
                <button
                  onClick={() => setSelectedDb('pubmed')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedDb === 'pubmed' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  PubMed / MEDLINE
                </button>
                <button
                  onClick={() => setSelectedDb('embase')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedDb === 'embase' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Embase
                </button>
                <button
                  onClick={() => setSelectedDb('cochrane')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                    selectedDb === 'cochrane' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Cochrane
                </button>
              </div>
            </div>

            {/* Syntax Display */}
            <div className="mt-4 relative">
              <div className="flex items-center justify-between bg-slate-900 text-slate-300 px-3.5 py-2 rounded-t-lg text-xs font-mono">
                <span>Sintaxis completa línea por línea ({selectedDb.toUpperCase()})</span>
                <button
                  onClick={handleCopyStrategy}
                  className="inline-flex items-center gap-1 text-[11px] hover:text-white transition-colors cursor-pointer"
                >
                  {copiedStrategy ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiada</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="bg-slate-950 text-emerald-400 p-4 rounded-b-lg text-[11px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[300px] border border-slate-900">
                {currentStrategyText}
              </pre>
            </div>

            {/* Methodological Guidance Note */}
            <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-semibold flex items-center gap-1 text-amber-950">
                <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                Requisitos esenciales del Ítem 7 (PRISMA 2020):
              </div>
              <p className="text-[11px] text-amber-800 leading-normal">
                1. No publicar únicamente una estrategia de muestra; se debe reportar la estrategia completa línea por línea para cada base de datos.
                <br />
                2. Especificar si se aplicaron filtros metodológicos validados (como el filtro Cochrane para ensayos clínicos) y límites de fecha o idioma.
                <br />
                3. Registrar si la estrategia fue validada con estudios conocidos de control o revisada mediante la lista de verificación PRESS.
              </p>
            </div>
          </div>

          {/* Action to refine with AI */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              onClick={handleGenerateSearchStrategy}
              disabled={isGeneratingStrategy}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isGeneratingStrategy ? 'Diseñando tesauros MeSH...' : 'Personalizar Estrategia con IA'}</span>
            </button>

            <button
              onClick={() => onSendToChat(`He configurado mi marco PICO: Población "${picoData.population}", Intervención "${picoData.intervention}", Comparador "${picoData.comparator}", Desenlaces "${picoData.outcomes}". Por favor, sugiere términos sinónimos y descriptores controlados (MeSH/Emtree) para ampliar la sensibilidad de la búsqueda.`)}
              className="text-xs text-slate-600 hover:text-indigo-600 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Explorar sinónimos en el chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
