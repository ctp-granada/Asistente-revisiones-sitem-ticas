import React, { useState, useMemo, useRef } from 'react';
import {
  Download,
  Copy,
  Check,
  FileText,
  Plus,
  Trash2,
  RefreshCw,
  Eye,
  Sliders,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  BarChart2,
  HelpCircle,
  Layers,
  ChevronRight,
  ExternalLink,
  Target,
  ShieldCheck,
  ShieldAlert,
  Filter,
  ArrowRight,
  TrendingDown,
  Info,
  Scale,
  Sparkles,
  GitCommit,
  RotateCcw
} from 'lucide-react';
import {
  MetaAnalysisConfigState,
  CandidateOutcome,
  EvidenceStudyRecord,
  Rob2StudyAssessment,
  RobJudgment
} from '../types';
import { MetaStudyItem } from '../utils/sensitivityAnalysis';
import {
  FunnelStudyPoint,
  EggerRegressionResult,
  BeggRankResult,
  TrimAndFillResult,
  prepareFunnelStudyPoints,
  calculateEggerTest,
  calculateBeggTest,
  calculateTrimAndFill,
  generateFunnelBoundaries,
  generateContourRegions,
  formatFunnelMethodsText,
  formatFunnelResultsText
} from '../utils/funnelAnalysis';

interface FunnelPlotViewerProps {
  config: MetaAnalysisConfigState;
  onChangeConfig?: (config: MetaAnalysisConfigState) => void;
  candidateOutcomes?: CandidateOutcome[];
  selectedOutcomeId?: string;
  onSelectOutcome?: (outcome: CandidateOutcome) => void;
  evidenceStudies?: EvidenceStudyRecord[];
  rob2Studies?: Rob2StudyAssessment[];
  onInsertFunnelIntoResults?: (text: string) => void;
  onInsertFunnelIntoMethods?: (text: string) => void;
  onNavigateToForestPlot?: () => void;
}

export const FunnelPlotViewer: React.FC<FunnelPlotViewerProps> = ({
  config,
  onChangeConfig,
  candidateOutcomes = [],
  selectedOutcomeId,
  onSelectOutcome,
  evidenceStudies = [],
  rob2Studies = [],
  onInsertFunnelIntoResults,
  onInsertFunnelIntoMethods,
  onNavigateToForestPlot,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Active Outcome
  const [activeOutcomeId, setActiveOutcomeId] = useState<string>(
    selectedOutcomeId || candidateOutcomes[0]?.id || ''
  );

  // View Options
  const [showContours, setShowContours] = useState<boolean>(false);
  const [showTrimAndFill, setShowTrimAndFill] = useState<boolean>(false);
  const [show99Limits, setShow99Limits] = useState<boolean>(false);
  const [showStudyLabels, setShowStudyLabels] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'plot' | 'regression' | 'studies' | 'text'>('plot');
  const [copied, setCopied] = useState<string | null>(null);
  const [hoveredStudy, setHoveredStudy] = useState<FunnelStudyPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  // Editable studies state
  const isRatio = ['HR', 'RR', 'OR'].includes(config.effectMeasure);
  const nullValue = isRatio ? 1.0 : 0.0;

  // Helper to match RoB 2 judgment
  const getRobJudgmentForStudy = (name: string, id: string): RobJudgment => {
    if (rob2Studies.length > 0) {
      const match = rob2Studies.find((r) => {
        const rName = r.studyName.toLowerCase();
        const curName = name.toLowerCase();
        return (
          curName.includes(rName.split(' ')[0].toLowerCase()) ||
          curName.includes(r.id) ||
          id.includes(r.id)
        );
      });
      if (match) return match.overall;
    }
    const lower = name.toLowerCase();
    if (lower.includes('soloist')) return 'some_concerns';
    return 'low';
  };

  // Base list of studies for default SGLT2 outcome
  const defaultSGLT2Studies: MetaStudyItem[] = [
    {
      id: 's-dapa',
      studyName: 'McMurray et al., 2019 (DAPA-HF)',
      year: 2019,
      sampleSize: 4744,
      estimate: 0.74,
      ciLower: 0.65,
      ciUpper: 0.85,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Dapagliflozina vs Placebo (Doble ciego)',
    },
    {
      id: 's-emperor',
      studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
      year: 2020,
      sampleSize: 3730,
      estimate: 0.75,
      ciLower: 0.65,
      ciUpper: 0.86,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Empagliflozina vs Placebo (FEVI ≤ 40%)',
    },
    {
      id: 's-soloist',
      studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
      year: 2021,
      sampleSize: 1222,
      estimate: 0.67,
      ciLower: 0.52,
      ciUpper: 0.85,
      robJudgment: 'some_concerns',
      includedInMeta: true,
      notes: 'Sotagliflozina tras descompensación aguda',
    },
    {
      id: 's-deliver',
      studyName: 'Solomon et al., 2022 (DELIVER)',
      year: 2022,
      sampleSize: 6263,
      estimate: 0.82,
      ciLower: 0.73,
      ciUpper: 0.92,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Dapagliflozina en FEVI levemente reducida o preservada',
    },
    {
      id: 's-emperor-pres',
      studyName: 'Anker et al., 2021 (EMPEROR-Preserved)',
      year: 2021,
      sampleSize: 5988,
      estimate: 0.79,
      ciLower: 0.69,
      ciUpper: 0.90,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Empagliflozina en FEVI > 40%',
    },
  ];

  // 10-study benchmark preset to satisfy Cochrane k >= 10 rule
  const benchmark10Studies: MetaStudyItem[] = [
    ...defaultSGLT2Studies,
    {
      id: 's-declare',
      studyName: 'Wiviott et al., 2019 (DECLARE-TIMI 58)',
      year: 2019,
      sampleSize: 17160,
      estimate: 0.83,
      ciLower: 0.73,
      ciUpper: 0.95,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Prevención secundaria en diabetes tipo 2',
    },
    {
      id: 's-canvas',
      studyName: 'Neal et al., 2017 (CANVAS Program)',
      year: 2017,
      sampleSize: 10142,
      estimate: 0.87,
      ciLower: 0.72,
      ciUpper: 1.05,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Canagliflozina y desenlaces cardiovasculares',
    },
    {
      id: 's-credence',
      studyName: 'Perkovic et al., 2019 (CREDENCE)',
      year: 2019,
      sampleSize: 4401,
      estimate: 0.70,
      ciLower: 0.59,
      ciUpper: 0.83,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Nefropatía diabética y muerte cardiovascular',
    },
    {
      id: 's-vertis',
      studyName: 'Cannon et al., 2020 (VERTIS-CV)',
      year: 2020,
      sampleSize: 8246,
      estimate: 0.88,
      ciLower: 0.75,
      ciUpper: 1.03,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Ertugliflozina en pacientes vasculares establecidos',
    },
    {
      id: 's-dapa-ckd',
      studyName: 'Heerspink et al., 2020 (DAPA-CKD)',
      year: 2020,
      sampleSize: 4304,
      estimate: 0.69,
      ciLower: 0.53,
      ciUpper: 0.88,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Enfermedad renal crónica con o sin diabetes',
    },
  ];

  // Asymmetric mock dataset for testing publication bias detection
  const asymmetricBiasStudies: MetaStudyItem[] = [
    {
      id: 's-asym-1',
      studyName: 'Large Trial A, 2020',
      year: 2020,
      sampleSize: 8500,
      estimate: 0.82,
      ciLower: 0.75,
      ciUpper: 0.90,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Estudio amplio con alta precisión',
    },
    {
      id: 's-asym-2',
      studyName: 'Large Trial B, 2021',
      year: 2021,
      sampleSize: 6200,
      estimate: 0.80,
      ciLower: 0.71,
      ciUpper: 0.90,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Estudio multicéntrico grande',
    },
    {
      id: 's-asym-3',
      studyName: 'Medium Trial C, 2021',
      year: 2021,
      sampleSize: 1800,
      estimate: 0.68,
      ciLower: 0.54,
      ciUpper: 0.85,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Efecto moderado con precisión media',
    },
    {
      id: 's-asym-4',
      studyName: 'Small Trial D, 2018',
      year: 2018,
      sampleSize: 320,
      estimate: 0.50,
      ciLower: 0.32,
      ciUpper: 0.78,
      robJudgment: 'some_concerns',
      includedInMeta: true,
      notes: 'Estudio pequeño con efecto muy magnificado a la izquierda',
    },
    {
      id: 's-asym-5',
      studyName: 'Small Trial E, 2019',
      year: 2019,
      sampleSize: 240,
      estimate: 0.42,
      ciLower: 0.25,
      ciUpper: 0.70,
      robJudgment: 'some_concerns',
      includedInMeta: true,
      notes: 'Estudio pequeño con fuerte sobreestimación de beneficio',
    },
    {
      id: 's-asym-6',
      studyName: 'Small Pilot F, 2022',
      year: 2022,
      sampleSize: 150,
      estimate: 0.38,
      ciLower: 0.20,
      ciUpper: 0.72,
      robJudgment: 'high',
      includedInMeta: true,
      notes: 'Piloto con alto sesgo y efecto extremo (ausencia de estudios pequeños neutros)',
    },
  ];

  const [studies, setStudies] = useState<MetaStudyItem[]>(defaultSGLT2Studies);

  // Sync with candidateOutcomes if available
  const currentOutcome = useMemo(() => {
    return candidateOutcomes.find((o) => o.id === activeOutcomeId) || candidateOutcomes[0];
  }, [candidateOutcomes, activeOutcomeId]);

  // Prepared study points with log, SE, precision, SND
  const studyPoints: FunnelStudyPoint[] = useMemo(() => {
    return prepareFunnelStudyPoints(studies, config.effectMeasure);
  }, [studies, config.effectMeasure]);

  const pooledEstimate = config.pooledEstimate || 0.74;
  const pooledLog = isRatio ? Math.log(Math.max(0.001, pooledEstimate)) : pooledEstimate;

  // Egger Regression Test
  const eggerResult: EggerRegressionResult = useMemo(() => {
    return calculateEggerTest(studyPoints);
  }, [studyPoints]);

  // Begg & Mazumdar Rank Test
  const beggResult: BeggRankResult = useMemo(() => {
    return calculateBeggTest(studyPoints, pooledLog);
  }, [studyPoints, pooledLog]);

  // Trim and Fill Analysis
  const trimFillResult: TrimAndFillResult = useMemo(() => {
    return calculateTrimAndFill(studyPoints, pooledLog, config.effectMeasure);
  }, [studyPoints, pooledLog, config.effectMeasure]);

  // Max SE in dataset to scale vertical axis
  const maxStudySe = useMemo(() => {
    if (studyPoints.length === 0) return 0.5;
    const maxVal = Math.max(...studyPoints.map((s) => s.se));
    return Math.max(0.35, Math.ceil(maxVal * 1.25 * 10) / 10);
  }, [studyPoints]);

  // Funnel Guide Boundaries
  const funnelBoundaries = useMemo(() => {
    return generateFunnelBoundaries(pooledLog, maxStudySe, 30, config.effectMeasure);
  }, [pooledLog, maxStudySe, config.effectMeasure]);

  // Contour Significance Regions
  const contourRegions = useMemo(() => {
    return generateContourRegions(nullValue, maxStudySe, 30, config.effectMeasure);
  }, [nullValue, maxStudySe, config.effectMeasure]);

  // Academic Texts
  const methodsText = useMemo(() => {
    return formatFunnelMethodsText(config.outcomeName, config.effectMeasure, studyPoints.length);
  }, [config.outcomeName, config.effectMeasure, studyPoints.length]);

  const resultsText = useMemo(() => {
    return formatFunnelResultsText(
      config.outcomeName,
      config.effectMeasure,
      eggerResult,
      beggResult,
      trimFillResult,
      pooledEstimate
    );
  }, [config.outcomeName, config.effectMeasure, eggerResult, beggResult, trimFillResult, pooledEstimate]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgRef.current);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funnel-plot-${config.outcomeName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // SVG coordinate transformation helpers
  const svgWidth = 720;
  const svgHeight = 440;
  const margin = { top: 30, right: 40, bottom: 65, left: 65 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // X Scale bounds
  const xBounds = useMemo(() => {
    if (isRatio) {
      // Scale logarithmic: e.g. from 0.2 to 2.5
      return {
        min: 0.2,
        max: 2.2,
        logMin: Math.log(0.2),
        logMax: Math.log(2.2),
      };
    } else {
      return {
        min: -1.5,
        max: 1.5,
        logMin: -1.5,
        logMax: 1.5,
      };
    }
  }, [isRatio]);

  const getXCoord = (val: number): number => {
    const v = isRatio ? Math.log(Math.max(0.001, val)) : val;
    const proportion = (v - xBounds.logMin) / (xBounds.logMax - xBounds.logMin);
    return margin.left + proportion * plotWidth;
  };

  // Inverted Y scale: SE = 0 is at the top (margin.top), SE = maxStudySe is at the bottom (margin.top + plotHeight)
  const getYCoord = (se: number): number => {
    const proportion = Math.min(1.0, Math.max(0, se / maxStudySe));
    return margin.top + proportion * plotHeight;
  };

  // X ticks for ratio vs difference
  const xTicks = useMemo(() => {
    if (isRatio) {
      return [0.25, 0.5, 0.74, 1.0, 1.5, 2.0];
    } else {
      return [-1.0, -0.5, 0.0, 0.5, 1.0];
    }
  }, [isRatio]);

  // Y ticks (Standard Error)
  const yTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = maxStudySe <= 0.4 ? 0.05 : 0.1;
    for (let se = 0; se <= maxStudySe; se += step) {
      ticks.push(parseFloat(se.toFixed(2)));
    }
    return ticks;
  }, [maxStudySe]);

  // Generate SVG polygon string for 95% funnel triangle
  const funnel95Points = useMemo(() => {
    const topX = getXCoord(pooledEstimate);
    const topY = getYCoord(0);

    const btmLeftX = getXCoord(isRatio ? Math.exp(pooledLog - 1.96 * maxStudySe) : pooledLog - 1.96 * maxStudySe);
    const btmRightX = getXCoord(isRatio ? Math.exp(pooledLog + 1.96 * maxStudySe) : pooledLog + 1.96 * maxStudySe);
    const btmY = getYCoord(maxStudySe);

    return `${topX},${topY} ${btmRightX},${btmY} ${btmLeftX},${btmY}`;
  }, [pooledEstimate, pooledLog, maxStudySe, isRatio]);

  // Generate SVG polygon string for 99% funnel triangle
  const funnel99Points = useMemo(() => {
    const topX = getXCoord(pooledEstimate);
    const topY = getYCoord(0);

    const btmLeftX = getXCoord(isRatio ? Math.exp(pooledLog - 2.576 * maxStudySe) : pooledLog - 2.576 * maxStudySe);
    const btmRightX = getXCoord(isRatio ? Math.exp(pooledLog + 2.576 * maxStudySe) : pooledLog + 2.576 * maxStudySe);
    const btmY = getYCoord(maxStudySe);

    return `${topX},${topY} ${btmRightX},${btmY} ${btmLeftX},${btmY}`;
  }, [pooledEstimate, pooledLog, maxStudySe, isRatio]);

  // Contour polygons (centered at null effect line)
  const contourP05Points = useMemo(() => {
    const topX = getXCoord(nullValue);
    const topY = getYCoord(0);
    const nullLogVal = isRatio ? Math.log(nullValue) : nullValue;

    const btmLeftX = getXCoord(isRatio ? Math.exp(nullLogVal - 1.96 * maxStudySe) : nullLogVal - 1.96 * maxStudySe);
    const btmRightX = getXCoord(isRatio ? Math.exp(nullLogVal + 1.96 * maxStudySe) : nullLogVal + 1.96 * maxStudySe);
    const btmY = getYCoord(maxStudySe);

    return `${topX},${topY} ${btmRightX},${btmY} ${btmLeftX},${btmY}`;
  }, [nullValue, maxStudySe, isRatio]);

  const contourP01Points = useMemo(() => {
    const topX = getXCoord(nullValue);
    const topY = getYCoord(0);
    const nullLogVal = isRatio ? Math.log(nullValue) : nullValue;

    const btmLeftX = getXCoord(isRatio ? Math.exp(nullLogVal - 2.576 * maxStudySe) : nullLogVal - 2.576 * maxStudySe);
    const btmRightX = getXCoord(isRatio ? Math.exp(nullLogVal + 2.576 * maxStudySe) : nullLogVal + 2.576 * maxStudySe);
    const btmY = getYCoord(maxStudySe);

    return `${topX},${topY} ${btmRightX},${btmY} ${btmLeftX},${btmY}`;
  }, [nullValue, maxStudySe, isRatio]);

  // Toggle study inclusion
  const handleToggleStudy = (id: string) => {
    setStudies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, includedInMeta: !s.includedInMeta } : s))
    );
  };

  return (
    <div id="funnel-plot-module" className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg">
              <Filter className="w-5 h-5 rotate-180" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
              PRISMA 2020: Ítems 14 & 21 (Sesgos de Notificación y Publicación)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Gráfico de Embudo (Funnel Plot) & Test de Asimetría de Egger
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 max-w-3xl leading-relaxed">
            Evalúa visual y cuantitativamente la presencia de sesgo de publicación y efectos de estudios pequeños mediante el desvío normal estandarizado (SND), el test de Egger, la correlación de Begg-Mazumdar y el método de imputación Trim-and-Fill de Duval & Tweedie.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateToForestPlot && (
            <button
              type="button"
              onClick={onNavigateToForestPlot}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span>Ver Forest Plot</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadSvg}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Descargar SVG</span>
          </button>
        </div>
      </div>

      {/* Outcome Selector and Controls Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">Desenlace Sintetizado:</span>
          {candidateOutcomes.length > 0 ? (
            <select
              value={activeOutcomeId}
              onChange={(e) => {
                setActiveOutcomeId(e.target.value);
                const selected = candidateOutcomes.find((o) => o.id === e.target.value);
                if (selected && onSelectOutcome) onSelectOutcome(selected);
              }}
              className="text-xs sm:text-sm p-2 rounded-lg border border-slate-300 font-semibold text-slate-800 bg-white"
            >
              {candidateOutcomes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.preferredEffectMeasure})
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs sm:text-sm font-semibold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg">
              {config.outcomeName} ({config.effectMeasure})
            </span>
          )}
        </div>

        {/* Dataset Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Preajustes de Prueba:</span>
          <button
            type="button"
            onClick={() => setStudies(defaultSGLT2Studies)}
            className={`px-2.5 py-1 text-xs rounded-md border font-medium cursor-pointer transition-colors ${
              studies.length === 5 && studies[0].id === 's-dapa'
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            SGLT2 (k = 5, Simétrico)
          </button>
          <button
            type="button"
            onClick={() => setStudies(benchmark10Studies)}
            className={`px-2.5 py-1 text-xs rounded-md border font-medium cursor-pointer transition-colors ${
              studies.length === 10
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            10 Ensayos (Poder k ≥ 10)
          </button>
          <button
            type="button"
            onClick={() => setStudies(asymmetricBiasStudies)}
            className={`px-2.5 py-1 text-xs rounded-md border font-medium cursor-pointer transition-colors ${
              studies.length === 6 && studies[0].id === 's-asym-1'
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Sesgo Marcado (Asimétrico)
          </button>
        </div>
      </div>

      {/* Cochrane Power Rule Alert */}
      {studyPoints.length < 10 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-sm">
              Criterio Metodológico Cochrane (Manual Cochrane, Capítulo 13 / Ítem 14 PRISMA 2020)
            </span>
            <p className="text-amber-800 leading-relaxed">
              El análisis cuenta actualmente con <strong>k = {studyPoints.length}</strong> estudios primarios incluidos. 
              Cochrane establece la regla de prudencia de contar con al menos <strong>10 ensayos clínicos (k ≥ 10)</strong> para realizar pruebas estadísticas formales de asimetría (como el test de Egger o Begg-Mazumdar). Con menos de 10 estudios, la potencia analítica es insuficiente para distinguir el sesgo de publicación de la variación puramente aleatoria. Se recomienda fundamentar la conclusión prioritariamente en la <strong>inspección visual cualitativa</strong> del embudo.
            </p>
          </div>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs px-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('plot')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'plot'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4 text-indigo-600 rotate-180" />
          <span>Gráfico Funnel Plot Interactivo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('regression')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'regression'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Scale className="w-4 h-4 text-indigo-600" />
          <span>Pruebas de Asimetría (Egger, Begg & Trim-and-Fill)</span>
          {eggerResult.hasSignificantAsymmetry && (
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('studies')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'studies'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>Gestión de Ensayos ({studyPoints.length} incluidos)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('text')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'text'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>Redacción PRISMA 2020 (Ítems 14 & 21)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FUNNEL PLOT INTERACTIVO */}
      {/* ========================================================================= */}
      {activeTab === 'plot' && (
        <div className="space-y-6">
          {/* Visual Controls Strip */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showContours}
                  onChange={(e) => setShowContours(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Contornos de Significancia (Contour-Enhanced)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showTrimAndFill}
                  onChange={(e) => setShowTrimAndFill(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Mostrar Imputación Trim-and-Fill</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={show99Limits}
                  onChange={(e) => setShow99Limits(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Límites al 99% (p = 0.01)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={showStudyLabels}
                  onChange={(e) => setShowStudyLabels(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Nombres de Ensayos</span>
              </label>
            </div>

            {/* Quick Summary Badge */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Resultado Egger:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold border ${
                  eggerResult.hasSignificantAsymmetry
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {eggerResult.hasSignificantAsymmetry
                  ? `Asimetría p = ${eggerResult.pValue.toFixed(3)} (< 0.10)`
                  : `Simetría p = ${eggerResult.pValue.toFixed(3)} (≥ 0.10)`}
              </span>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Gráfico de Embudo (Funnel Plot) Centrado en el Efecto Agrupado
                </h3>
                <p className="text-xs text-slate-500">
                  Eje horizontal: {config.effectMeasure} (escala {isRatio ? 'logarítmica' : 'lineal'}) • Eje vertical: Error Estándar (SE, invertido)
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  <span>RoB 2 Bajo</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
                  <span>Algunas Preocupaciones</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
                  <span>Alto Riesgo</span>
                </div>
              </div>
            </div>

            {/* SVG Plot */}
            <div className="w-full overflow-x-auto flex justify-center">
              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full max-w-3xl h-auto select-none font-sans"
              >
                <defs>
                  {/* Subtle grid pattern */}
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1" />
                  </pattern>

                  {/* Shading gradients for Contour-Enhanced Funnel */}
                  <linearGradient id="contourP01Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.12" />
                  </linearGradient>
                  <linearGradient id="contourP05Grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.20" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.08" />
                  </linearGradient>
                </defs>

                {/* Plot Background */}
                <rect
                  x={margin.left}
                  y={margin.top}
                  width={plotWidth}
                  height={plotHeight}
                  fill="#ffffff"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                />

                {/* Background Grid Lines */}
                <g className="grid-lines" opacity={0.6}>
                  {/* Horizontal SE grid lines */}
                  {yTicks.map((tick) => {
                    const y = getYCoord(tick);
                    return (
                      <line
                        key={`grid-y-${tick}`}
                        x1={margin.left}
                        y1={y}
                        x2={margin.left + plotWidth}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="2,2"
                      />
                    );
                  })}
                  {/* Vertical Effect grid lines */}
                  {xTicks.map((tick) => {
                    const x = getXCoord(tick);
                    return (
                      <line
                        key={`grid-x-${tick}`}
                        x1={x}
                        y1={margin.top}
                        x2={x}
                        y2={margin.top + plotHeight}
                        stroke="#e2e8f0"
                        strokeDasharray="2,2"
                      />
                    );
                  })}
                </g>

                {/* CONTOUR-ENHANCED REGIONS (if enabled, centered at null line) */}
                {showContours && (
                  <g className="contour-regions">
                    {/* p < 0.01 Outer Area */}
                    <rect
                      x={margin.left}
                      y={margin.top}
                      width={plotWidth}
                      height={plotHeight}
                      fill="#e0e7ff"
                      opacity={0.35}
                    />
                    {/* p < 0.05 Polygon */}
                    <polygon points={contourP01Points} fill="#bae6fd" opacity={0.45} />
                    {/* p >= 0.05 / Non-significant central funnel */}
                    <polygon points={contourP05Points} fill="#ffffff" opacity={0.8} />
                  </g>
                )}

                {/* 99% Pseudo Confidence Funnel (Outer Triangle) */}
                {show99Limits && (
                  <polygon
                    points={funnel99Points}
                    fill="#f8fafc"
                    stroke="#94a3b8"
                    strokeWidth="1.5"
                    strokeDasharray="4,4"
                    opacity={0.7}
                  />
                )}

                {/* 95% Pseudo Confidence Funnel (Standard Triangle) */}
                <polygon
                  points={funnel95Points}
                  fill={showContours ? 'none' : '#f1f5f9'}
                  fillOpacity={0.65}
                  stroke="#64748b"
                  strokeWidth="2"
                  strokeDasharray="3,3"
                />

                {/* Reference Null Effect Line (RR = 1.0 or MD = 0.0) */}
                <line
                  x1={getXCoord(nullValue)}
                  y1={margin.top}
                  x2={getXCoord(nullValue)}
                  y2={margin.top + plotHeight}
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeDasharray="4,4"
                />

                {/* Central Pooled Effect Line (θ) */}
                <line
                  x1={getXCoord(pooledEstimate)}
                  y1={margin.top}
                  x2={getXCoord(pooledEstimate)}
                  y2={margin.top + plotHeight}
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                />

                {/* Trim-and-Fill Adjusted Pooled Line (if enabled and missing > 0) */}
                {showTrimAndFill && trimFillResult.missingCount > 0 && (
                  <line
                    x1={getXCoord(trimFillResult.adjustedPooledEstimate)}
                    y1={margin.top}
                    x2={getXCoord(trimFillResult.adjustedPooledEstimate)}
                    y2={margin.top + plotHeight}
                    stroke="#dc2626"
                    strokeWidth="2"
                    strokeDasharray="5,3"
                  />
                )}

                {/* Trim-and-Fill Imputed Study Points */}
                {showTrimAndFill &&
                  trimFillResult.imputedStudies.map((imp) => {
                    const cx = getXCoord(imp.estimate);
                    const cy = getYCoord(imp.se);
                    return (
                      <g
                        key={imp.id}
                        className="cursor-pointer group"
                        onMouseEnter={() => setHoveredStudy(imp)}
                        onMouseLeave={() => setHoveredStudy(null)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r="7"
                          fill="#ffffff"
                          stroke="#dc2626"
                          strokeWidth="2"
                          strokeDasharray="3,2"
                        />
                        <circle cx={cx} cy={cy} r="2.5" fill="#dc2626" />
                        <text
                          x={cx + 9}
                          y={cy + 3}
                          fontSize="9"
                          fill="#dc2626"
                          fontWeight="bold"
                        >
                          {imp.studyName}
                        </text>
                      </g>
                    );
                  })}

                {/* Empirical Studies Points */}
                {studyPoints.map((study) => {
                  const cx = getXCoord(study.estimate);
                  const cy = getYCoord(study.se);
                  const isHovered = hoveredStudy?.id === study.id;

                  // RoB 2 color
                  const fillColor =
                    study.robJudgment === 'low'
                      ? '#10b981'
                      : study.robJudgment === 'some_concerns'
                      ? '#f59e0b'
                      : '#f43f5e';

                  // Radius scaled with sample size
                  const radius = Math.min(10, Math.max(5, Math.sqrt(study.sampleSize) / 12));

                  return (
                    <g
                      key={study.id}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredStudy(study)}
                      onMouseLeave={() => setHoveredStudy(null)}
                    >
                      {/* Outer pulse when hovered */}
                      {isHovered && (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius + 5}
                          fill={fillColor}
                          opacity={0.3}
                        />
                      )}

                      <circle
                        cx={cx}
                        cy={cy}
                        r={radius}
                        fill={fillColor}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="filter drop-shadow-sm"
                      />

                      {/* Study Label */}
                      {showStudyLabels && (
                        <text
                          x={cx + radius + 4}
                          y={cy + 3}
                          fontSize="9.5"
                          fontWeight={isHovered ? 'bold' : 'normal'}
                          fill={isHovered ? '#1e293b' : '#475569'}
                        >
                          {study.studyName.split('(')[0].trim()}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* X Axis & Ticks */}
                <g className="x-axis">
                  <line
                    x1={margin.left}
                    y1={margin.top + plotHeight}
                    x2={margin.left + plotWidth}
                    y2={margin.top + plotHeight}
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />
                  {xTicks.map((tick) => {
                    const x = getXCoord(tick);
                    return (
                      <g key={`xtick-${tick}`}>
                        <line
                          x1={x}
                          y1={margin.top + plotHeight}
                          x2={x}
                          y2={margin.top + plotHeight + 5}
                          stroke="#64748b"
                          strokeWidth="1.5"
                        />
                        <text
                          x={x}
                          y={margin.top + plotHeight + 18}
                          fontSize="10"
                          textAnchor="middle"
                          fill="#334155"
                          fontWeight={tick === nullValue || tick === pooledEstimate ? 'bold' : 'normal'}
                        >
                          {tick}
                        </text>
                      </g>
                    );
                  })}
                  {/* Axis Title */}
                  <text
                    x={margin.left + plotWidth / 2}
                    y={margin.top + plotHeight + 42}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#1e293b"
                  >
                    Efecto Estimado ({config.effectMeasure}) [Favorece Intervención ← | → Favorece Control]
                  </text>
                </g>

                {/* Y Axis & Ticks (Standard Error - Inverted) */}
                <g className="y-axis">
                  <line
                    x1={margin.left}
                    y1={margin.top}
                    x2={margin.left}
                    y2={margin.top + plotHeight}
                    stroke="#64748b"
                    strokeWidth="1.5"
                  />
                  {yTicks.map((tick) => {
                    const y = getYCoord(tick);
                    return (
                      <g key={`ytick-${tick}`}>
                        <line
                          x1={margin.left - 5}
                          y1={y}
                          x2={margin.left}
                          y2={y}
                          stroke="#64748b"
                          strokeWidth="1.5"
                        />
                        <text
                          x={margin.left - 8}
                          y={y + 3.5}
                          fontSize="9.5"
                          textAnchor="end"
                          fill="#334155"
                        >
                          {tick.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                  {/* Y Axis Title */}
                  <text
                    x={-(margin.top + plotHeight / 2)}
                    y={margin.left - 42}
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#1e293b"
                    transform="rotate(-90)"
                  >
                    Error Estándar (SE) [Mayor Precisión ↑ | Menor Precisión ↓]
                  </text>
                </g>

                {/* Top Legend Markers inside canvas */}
                <g className="legend" transform={`translate(${margin.left + 15}, ${margin.top + 15})`}>
                  <rect
                    x="0"
                    y="0"
                    width="230"
                    height={showTrimAndFill && trimFillResult.missingCount > 0 ? "70" : "50"}
                    fill="#ffffff"
                    fillOpacity="0.9"
                    stroke="#e2e8f0"
                    rx="6"
                  />
                  {/* Pooled Effect Legend */}
                  <line x1="10" y1="14" x2="32" y2="14" stroke="#4f46e5" strokeWidth="2.5" />
                  <text x="38" y="17" fontSize="10" fontWeight="bold" fill="#1e293b">
                    Efecto Agrupado: {config.effectMeasure} = {pooledEstimate.toFixed(2)}
                  </text>

                  {/* 95% Funnel Lines */}
                  <line x1="10" y1="32" x2="32" y2="32" stroke="#64748b" strokeWidth="1.5" strokeDasharray="3,3" />
                  <text x="38" y="35" fontSize="9.5" fill="#475569">
                    Límites de Pseudo-Confianza del 95%
                  </text>

                  {/* Trim and Fill Legend if enabled */}
                  {showTrimAndFill && trimFillResult.missingCount > 0 && (
                    <>
                      <line x1="10" y1="50" x2="32" y2="50" stroke="#dc2626" strokeWidth="2" strokeDasharray="4,2" />
                      <text x="38" y="53" fontSize="9.5" fontWeight="bold" fill="#dc2626">
                        Ajustado Trim-Fill: {config.effectMeasure} = {trimFillResult.adjustedPooledEstimate.toFixed(2)} ({trimFillResult.missingCount} imp.)
                      </text>
                    </>
                  )}
                </g>
              </svg>
            </div>

            {/* Interactive Hover Tooltip Card */}
            {hoveredStudy && (
              <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-xl text-xs space-y-1.5 max-w-xl mx-auto shadow-lg border border-slate-700 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-slate-700 pb-1.5">
                  <span className="font-bold text-indigo-300">{hoveredStudy.studyName}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      hoveredStudy.robJudgment === 'low'
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                        : hoveredStudy.robJudgment === 'some_concerns'
                        ? 'bg-amber-900/80 text-amber-300 border border-amber-700'
                        : 'bg-rose-900/80 text-rose-300 border border-rose-700'
                    }`}
                  >
                    RoB 2: {hoveredStudy.robJudgment}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Efecto ({config.effectMeasure}):</span>
                    <strong className="text-emerald-400">{hoveredStudy.estimate.toFixed(2)}</strong> (IC: {hoveredStudy.ciLower.toFixed(2)} - {hoveredStudy.ciUpper.toFixed(2)})
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Error Estándar (SE):</span>
                    <strong>{hoveredStudy.se.toFixed(3)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Precisión (1/SE):</span>
                    <strong>{hoveredStudy.precision.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Población (N):</span>
                    <strong>{hoveredStudy.sampleSize.toLocaleString()}</strong>
                  </div>
                </div>
                {hoveredStudy.notes && (
                  <p className="text-[11px] text-slate-300 italic pt-1 border-t border-slate-800">
                    {hoveredStudy.notes}
                  </p>
                )}
              </div>
            )}

            {/* Contour-Enhanced Explanatory Note */}
            {showContours && (
              <div className="mt-4 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-semibold">Interpretación del Contour-Enhanced Funnel Plot (Peters et al., 2008):</strong>
                  <span>
                    El área blanca central representa la región donde los estudios individuales no alcanzan significación estadística (p ≥ 0.05). Las áreas celestes corresponden a p &lt; 0.05 y las azules a p &lt; 0.01. 
                    Si los estudios faltantes se sitúan preponderantemente en la <strong>zona blanca (no significativa)</strong>, la asimetría se atribuye al <strong>sesgo de publicación</strong> (falta de reporte de estudios neutros). 
                    Por el contrario, si faltan estudios en áreas de significación estadística, la asimetría obedece a <strong>heterogeneidad clínica o efectos de estudios pequeños</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Egger summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Test de Egger</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  eggerResult.hasSignificantAsymmetry
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {eggerResult.hasSignificantAsymmetry ? 'Asimétrico' : 'Simétrico'}
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                p = {eggerResult.pValue < 0.001 ? '< 0.001' : eggerResult.pValue.toFixed(3)}
              </div>
              <p className="text-[11px] text-slate-500">
                Intercepto de sesgo α = {eggerResult.intercept.toFixed(2)} (t = {eggerResult.tStatistic.toFixed(2)}, gl = {eggerResult.degreesOfFreedom})
              </p>
            </div>

            {/* Begg summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Test de Begg-Mazumdar</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Rangos de Kendall
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                p = {beggResult.pValue < 0.001 ? '< 0.001' : beggResult.pValue.toFixed(3)}
              </div>
              <p className="text-[11px] text-slate-500">
                τ de Kendall = {beggResult.tau.toFixed(2)} (z = {beggResult.zValue.toFixed(2)})
              </p>
            </div>

            {/* Trim and Fill summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Trim-and-Fill</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                  Duval & Tweedie
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900">
                k₀ = {trimFillResult.missingCount} faltantes
              </div>
              <p className="text-[11px] text-slate-500">
                Efecto ajustado: {config.effectMeasure} = {trimFillResult.adjustedPooledEstimate.toFixed(2)} (IC: {trimFillResult.adjustedCiLower.toFixed(2)} - {trimFillResult.adjustedCiUpper.toFixed(2)})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DETALLE DE PRUEBAS DE ASIMETRÍA */}
      {/* ========================================================================= */}
      {activeTab === 'regression' && (
        <div className="space-y-6">
          {/* Detailed Egger Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>Prueba de Regresión Lineal de Egger (Egger et al., BMJ 1997)</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                    eggerResult.hasSignificantAsymmetry
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {eggerResult.hasSignificantAsymmetry ? 'Asimetría Significativa (p < 0.10)' : 'Sin Asimetría Significativa (p ≥ 0.10)'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Modelo de regresión: SND = α + β · (1 / SE), donde el intercepto α evalúa cuantitativamente la asimetría del embudo.
                </p>
              </div>

              {eggerResult.isUnderpowered && (
                <span className="text-xs bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-lg font-semibold flex items-center gap-1.5 self-start">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Potencia Limitada (k &lt; 10)</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Intercepto de Sesgo (α)</span>
                <span className="text-lg font-black font-mono text-slate-900">{eggerResult.intercept.toFixed(3)}</span>
                <span className="text-[10px] text-slate-400 block">EE = {eggerResult.interceptSe.toFixed(3)}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Intervalo Confianza 95% (α)</span>
                <span className="text-sm font-black font-mono text-slate-900">
                  [{eggerResult.interceptCiLower.toFixed(3)}, {eggerResult.interceptCiUpper.toFixed(3)}]
                </span>
                <span className="text-[10px] text-slate-400 block">Contiene el 0 = Simetría</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Estadístico t (gl = {eggerResult.degreesOfFreedom})</span>
                <span className="text-lg font-black font-mono text-slate-900">{eggerResult.tStatistic.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block">Pendiente β = {eggerResult.slope.toFixed(2)}</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">p-valor Bidireccional</span>
                <span className={`text-lg font-black font-mono ${eggerResult.hasSignificantAsymmetry ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {eggerResult.pValue < 0.001 ? '< 0.001' : eggerResult.pValue.toFixed(4)}
                </span>
                <span className="text-[10px] text-slate-400 block">Umbral alfa = 0.10</span>
              </div>
            </div>

            {/* Regression Interpretation */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <strong className="text-slate-800 block">Interpretación Científica Formal:</strong>
              <p className="text-slate-700 leading-relaxed">{eggerResult.interpretation}</p>
              <p className="text-slate-500 italic text-[11px]">{eggerResult.recommendation}</p>
            </div>
          </div>

          {/* Begg and Trim-and-Fill Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Begg Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Test No Paramétrico de Begg & Mazumdar (1994)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Correlación de rangos de Kendall entre estimadores estandarizados y varianzas de muestreo.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Tau de Kendall</span>
                  <strong className="text-slate-900 text-sm">{beggResult.tau.toFixed(2)}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Estadístico z</span>
                  <strong className="text-slate-900 text-sm">{beggResult.zValue.toFixed(2)}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">p-valor</span>
                  <strong className={beggResult.hasSignificantAsymmetry ? 'text-rose-600 text-sm' : 'text-emerald-600 text-sm'}>
                    {beggResult.pValue < 0.001 ? '< 0.001' : beggResult.pValue.toFixed(3)}
                  </strong>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {beggResult.interpretation}
              </p>
            </div>

            {/* Trim and Fill Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="border-b border-slate-100 pb-2">
                <h4 className="text-sm font-bold text-slate-900">
                  Método Trim-and-Fill de Duval & Tweedie (2000)
                </h4>
                <p className="text-[11px] text-slate-500">
                  Imputación iterativa de estudios faltantes en el flanco asimétrico para recalcular el efecto ajustado.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Estudios Imputados</span>
                  <strong className="text-indigo-600 text-sm">{trimFillResult.missingCount} estudios</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Flanco Faltante</span>
                  <strong className="text-slate-900 text-sm capitalize">{trimFillResult.side}</strong>
                </div>
                <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block">Efecto Ajustado</span>
                  <strong className="text-slate-900 text-sm">{trimFillResult.adjustedPooledEstimate.toFixed(2)}</strong>
                </div>
              </div>

              <div className="text-xs text-slate-600">
                <p>
                  Efecto original: <strong>{config.effectMeasure} = {pooledEstimate.toFixed(2)}</strong> (IC 95%: {config.ciLower.toFixed(2)} - {config.ciUpper.toFixed(2)})
                </p>
                <p className="mt-1">
                  Efecto ajustado con Trim-and-Fill: <strong>{config.effectMeasure} = {trimFillResult.adjustedPooledEstimate.toFixed(2)}</strong> (IC 95%: {trimFillResult.adjustedCiLower.toFixed(2)} - {trimFillResult.adjustedCiUpper.toFixed(2)})
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GESTIÓN DE ENSAYOS INCLUIDOS */}
      {/* ========================================================================= */}
      {activeTab === 'studies' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Ensayos Clínicos Incluidos en el Embudo ({studies.length} estudios)
              </h3>
              <p className="text-xs text-slate-500">
                Activa o desactiva estudios para observar en tiempo real la variación en la simetría y el p-valor de Egger.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setStudies(defaultSGLT2Studies)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="p-3">Incluir</th>
                  <th className="p-3">Estudio y Año</th>
                  <th className="p-3 text-center">Muestra (N)</th>
                  <th className="p-3 text-center">Efecto ({config.effectMeasure})</th>
                  <th className="p-3 text-center">IC 95%</th>
                  <th className="p-3 text-center">Error Estándar (SE)</th>
                  <th className="p-3 text-center">Precisión (1/SE)</th>
                  <th className="p-3 text-center">SND (y/SE)</th>
                  <th className="p-3 text-center">RoB 2</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studyPoints.map((study) => (
                  <tr
                    key={study.id}
                    className={`hover:bg-slate-50 transition-colors ${
                      !study.includedInMeta ? 'opacity-40 bg-slate-50/50' : ''
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={study.includedInMeta}
                        onChange={() => handleToggleStudy(study.id)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {study.studyName}
                      {study.notes && (
                        <span className="block text-[10px] text-slate-400 font-normal">{study.notes}</span>
                      )}
                    </td>
                    <td className="p-3 text-center font-mono">{study.sampleSize.toLocaleString()}</td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-600">{study.estimate.toFixed(2)}</td>
                    <td className="p-3 text-center font-mono text-slate-600">
                      [{study.ciLower.toFixed(2)}, {study.ciUpper.toFixed(2)}]
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-slate-800">{study.se.toFixed(3)}</td>
                    <td className="p-3 text-center font-mono text-slate-600">{study.precision.toFixed(2)}</td>
                    <td className="p-3 text-center font-mono text-slate-600">{study.snd.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          study.robJudgment === 'low'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : study.robJudgment === 'some_concerns'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {study.robJudgment === 'low'
                          ? 'Bajo'
                          : study.robJudgment === 'some_concerns'
                          ? 'Preocupaciones'
                          : 'Alto'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: REDACCIÓN PRISMA 2020 LISTA PARA MANUSCRITO */}
      {/* ========================================================================= */}
      {activeTab === 'text' && (
        <div className="space-y-6">
          {/* PRISMA Item 14 Methods */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                  Ítem 14 PRISMA 2020 (Reporting Bias Assessment)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Métodos de Evaluación del Sesgo de Notificación y Publicación
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(methodsText, 'methods')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copied === 'methods' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'methods' ? 'Copiado' : 'Copiar Texto'}</span>
                </button>

                {onInsertFunnelIntoMethods && (
                  <button
                    type="button"
                    onClick={() => onInsertFunnelIntoMethods(methodsText)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insertar en Métodos</span>
                  </button>
                )}
              </div>
            </div>

            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {methodsText}
            </pre>
          </div>

          {/* PRISMA Item 21 Results */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                  Ítem 21 PRISMA 2020 (Reporting Biases Results)
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Resultados del Sesgo de Publicación y Prueba de Egger
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(resultsText, 'results')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  {copied === 'results' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'results' ? 'Copiado' : 'Copiar Texto'}</span>
                </button>

                {onInsertFunnelIntoResults && (
                  <button
                    type="button"
                    onClick={() => onInsertFunnelIntoResults(resultsText)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insertar en Resultados</span>
                  </button>
                )}
              </div>
            </div>

            <pre className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
              {resultsText}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
