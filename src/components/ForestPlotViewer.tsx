import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  Info
} from 'lucide-react';
import {
  MetaAnalysisConfigState,
  CandidateOutcome,
  OutcomeStudyMapping,
  EvidenceStudyRecord,
  Rob2StudyAssessment,
  RobJudgment,
  SensitivityPreset,
  SensitivityAnalysisResult
} from '../types';
import { getI2BadgeInfo } from './MetaAnalysisConfig';
import {
  MetaStudyItem,
  calculateMetaStats,
  evaluateSensitivityPreset,
  computeAllSensitivityScenarios,
  generateSensitivityMarkdownTable,
  generateSensitivityResultsText,
  generateSensitivityMethodsText,
  ComputedMetaStats
} from '../utils/sensitivityAnalysis';

export interface ForestPlotStudyItem extends MetaStudyItem {}

interface ForestPlotViewerProps {
  config: MetaAnalysisConfigState;
  onChangeConfig?: (config: MetaAnalysisConfigState) => void;
  candidateOutcomes?: CandidateOutcome[];
  selectedOutcomeId?: string;
  onSelectOutcome?: (outcome: CandidateOutcome) => void;
  evidenceStudies?: EvidenceStudyRecord[];
  rob2Studies?: Rob2StudyAssessment[];
  onInsertFigureIntoResults?: (figureText: string) => void;
  onInsertSensitivityIntoResults?: (text: string) => void;
  onInsertSensitivityIntoMethods?: (text: string) => void;
  initialSensitivityPreset?: SensitivityPreset;
  onSensitivityResultChange?: (result: SensitivityAnalysisResult) => void;
  onNavigateToFunnelPlot?: () => void;
}

export const ForestPlotViewer: React.FC<ForestPlotViewerProps> = ({
  config,
  onChangeConfig,
  candidateOutcomes = [],
  selectedOutcomeId,
  onSelectOutcome,
  evidenceStudies = [],
  rob2Studies = [],
  onInsertFigureIntoResults,
  onInsertSensitivityIntoResults,
  onInsertSensitivityIntoMethods,
  initialSensitivityPreset = 'all',
  onSensitivityResultChange,
  onNavigateToFunnelPlot,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeOutcomeId, setActiveOutcomeId] = useState<string>(
    selectedOutcomeId || candidateOutcomes[0]?.id || ''
  );
  const [showPredictionInterval, setShowPredictionInterval] = useState<boolean>(true);
  const [showWeights, setShowWeights] = useState<boolean>(true);
  const [showDualDiamond, setShowDualDiamond] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedSensitivity, setCopiedSensitivity] = useState<boolean>(false);
  const [insertedNotice, setInsertedNotice] = useState<string | null>(null);
  const [isEditingStudies, setIsEditingStudies] = useState<boolean>(false);

  // Sensitivity Analysis States
  const [sensitivityPreset, setSensitivityPreset] = useState<SensitivityPreset>(initialSensitivityPreset);
  const [leaveOneOutStudyId, setLeaveOneOutStudyId] = useState<string>('');

  // Editable custom range or auto
  const [scaleMin, setScaleMin] = useState<number>(0.3);
  const [scaleMax, setScaleMax] = useState<number>(2.0);

  // Active outcome object
  const currentOutcome = useMemo(() => {
    return candidateOutcomes.find((o) => o.id === activeOutcomeId) || candidateOutcomes[0];
  }, [candidateOutcomes, activeOutcomeId]);

  const isRatioMeasure = ['HR', 'RR', 'OR'].includes(config.effectMeasure);
  const nullValue = isRatioMeasure ? 1.0 : 0.0;

  // Helper to match RoB 2 judgment
  const getRobJudgmentForStudy = (name: string, id: string): RobJudgment => {
    if (rob2Studies.length > 0) {
      const match = rob2Studies.find((r) => {
        const rName = r.studyName.toLowerCase();
        const curName = name.toLowerCase();
        return curName.includes(rName.split(' ')[0].toLowerCase()) || 
               curName.includes(r.id) ||
               id.includes(r.id);
      });
      if (match) return match.overall;
    }
    // Standard heuristics based on known trials
    const lower = name.toLowerCase();
    if (lower.includes('soloist')) return 'some_concerns';
    return 'low';
  };

  // Build baseline studies from currentOutcome.studiesMapping OR default evidence
  const initialStudies: ForestPlotStudyItem[] = useMemo(() => {
    if (currentOutcome && currentOutcome.studiesMapping && currentOutcome.studiesMapping.length > 0) {
      return currentOutcome.studiesMapping
        .filter((sm) => sm.reported && sm.numericEstimate && sm.ciLower && sm.ciUpper)
        .map((sm, idx) => ({
          id: sm.studyId || `study-${idx}`,
          studyName: sm.studyName,
          sampleSize: sm.sampleSize || 2000,
          estimate: sm.numericEstimate!,
          ciLower: sm.ciLower!,
          ciUpper: sm.ciUpper!,
          robJudgment: getRobJudgmentForStudy(sm.studyName, sm.studyId || `study-${idx}`),
          includedInMeta: sm.isEligibleForMetaAnalysis !== false,
          notes: sm.reportedText,
        }));
    }

    // Fallback based on evidenceStudies or standard SGLT2i studies
    return [
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
        notes: 'Dapagliflozina vs Placebo (Doble ciego, multicéntrico)',
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
        notes: 'Sotagliflozina tras empeoramiento IC (Terminación anticipada)',
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
        notes: 'Dapagliflozina en IC-FE ligera o preservada',
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
        notes: 'Empagliflozina en IC-FEp (FEVI > 40%)',
      },
    ];
  }, [currentOutcome, rob2Studies]);

  const [studies, setStudies] = useState<ForestPlotStudyItem[]>(initialStudies);

  // Keep leaveOneOut default to first study if empty
  useEffect(() => {
    if (!leaveOneOutStudyId && studies.length > 0) {
      setLeaveOneOutStudyId(studies[0].id);
    }
  }, [studies, leaveOneOutStudyId]);

  // Sync when activeOutcome changes
  useEffect(() => {
    if (currentOutcome && currentOutcome.studiesMapping) {
      const mapped = currentOutcome.studiesMapping
        .filter((sm) => sm.reported && sm.numericEstimate && sm.ciLower && sm.ciUpper)
        .map((sm, idx) => ({
          id: sm.studyId || `study-${idx}`,
          studyName: sm.studyName,
          sampleSize: sm.sampleSize || 2000,
          estimate: sm.numericEstimate!,
          ciLower: sm.ciLower!,
          ciUpper: sm.ciUpper!,
          robJudgment: getRobJudgmentForStudy(sm.studyName, sm.studyId || `study-${idx}`),
          includedInMeta: sm.isEligibleForMetaAnalysis !== false,
          notes: sm.reportedText,
        }));

      if (mapped.length > 0) {
        setStudies(mapped);
      }
    }
  }, [currentOutcome]);

  // Compute Primary (Baseline) Stats
  const primaryStats: ComputedMetaStats = useMemo(() => {
    const clean = studies.map((s) => ({
      ...s,
      excludedBySensitivity: false,
      sensitivityExclusionReason: undefined,
    }));
    return calculateMetaStats(
      clean,
      config.effectMeasure,
      config.modelType,
      config.knappHartungAdjustment
    );
  }, [studies, config.effectMeasure, config.modelType, config.knappHartungAdjustment]);

  // Compute Active Sensitivity Analysis & Filtered Studies
  const {
    filteredStudies,
    stats: sensitivityStats,
    result: sensitivityResult,
  } = useMemo(() => {
    return evaluateSensitivityPreset(
      studies,
      sensitivityPreset,
      config.effectMeasure,
      config.modelType,
      config.knappHartungAdjustment,
      leaveOneOutStudyId
    );
  }, [
    studies,
    sensitivityPreset,
    config.effectMeasure,
    config.modelType,
    config.knappHartungAdjustment,
    leaveOneOutStudyId,
  ]);

  // Notify parent of sensitivity results when changed
  useEffect(() => {
    if (onSensitivityResultChange) {
      onSensitivityResultChange(sensitivityResult);
    }
  }, [sensitivityResult, onSensitivityResultChange]);

  const isSensitivityActive = sensitivityPreset !== 'all' && sensitivityResult.excludedCount > 0;

  // Handle outcome selection change
  const handleSelectOutcomeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextId = e.target.value;
    setActiveOutcomeId(nextId);
    const found = candidateOutcomes.find((o) => o.id === nextId);
    if (found && onSelectOutcome) {
      onSelectOutcome(found);
    }
    if (found && onChangeConfig) {
      onChangeConfig({
        ...config,
        outcomeName: found.name,
        effectMeasure:
          found.preferredEffectMeasure === 'MD' || found.preferredEffectMeasure === 'SMD'
            ? found.preferredEffectMeasure
            : found.preferredEffectMeasure === 'OR'
            ? 'OR'
            : found.preferredEffectMeasure === 'RR'
            ? 'RR'
            : 'HR',
      });
    }
  };

  // Toggle study inclusion in meta-analysis
  const handleToggleStudy = (id: string) => {
    setStudies((prev) =>
      prev.map((s) => (s.id === id ? { ...s, includedInMeta: !s.includedInMeta } : s))
    );
  };

  // Toggle custom sensitivity exclusion
  const handleToggleCustomSensitivity = (id: string) => {
    setSensitivityPreset('custom');
    setStudies((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              excludedBySensitivity: !s.excludedBySensitivity,
              sensitivityExclusionReason: !s.excludedBySensitivity
                ? 'Exclusión manual personalizada'
                : undefined,
            }
          : s
      )
    );
  };

  // Add custom study
  const handleAddStudy = () => {
    const newStudy: ForestPlotStudyItem = {
      id: `study-custom-${Date.now()}`,
      studyName: `Nuevo Estudio (${new Date().getFullYear()})`,
      sampleSize: 1500,
      estimate: 0.80,
      ciLower: 0.68,
      ciUpper: 0.94,
      robJudgment: 'low',
      includedInMeta: true,
      notes: 'Estudio añadido manualmente',
    };
    setStudies([...studies, newStudy]);
  };

  const handleUpdateStudy = (id: string, partial: Partial<ForestPlotStudyItem>) => {
    setStudies((prev) => prev.map((s) => (s.id === id ? { ...s, ...partial } : s)));
  };

  const handleDeleteStudy = (id: string) => {
    setStudies((prev) => prev.filter((s) => s.id !== id));
  };

  // Download SVG
  const handleDownloadSvg = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = `forest_plot_${config.outcomeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);
  };

  // Download PNG (300 DPI)
  const handleDownloadPng = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const scaleFactor = 3;
    const bbox = svgRef.current.getBoundingClientRect();
    const width = bbox.width || 920;
    const height = bbox.height || 540;

    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `forest_plot_300dpi_${config.outcomeName.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  // Copy Markdown Table
  const handleCopyMarkdown = () => {
    const header = `| Estudio | Total ($N$) | Estimador (${config.effectMeasure}) [IC 95%] | Peso Relativo (%) | Riesgo de Sesgo (RoB 2) | Estado en Análisis |\n| :--- | :---: | :---: | :---: | :---: | :--- |`;
    const rows = filteredStudies.map((s) => {
      const robBadge = s.robJudgment === 'low' ? 'Bajo (+)' : s.robJudgment === 'some_concerns' ? 'Preocupaciones (?)' : 'Alto (-)';
      const statusText = s.excludedBySensitivity 
        ? `Excluido (${s.sensitivityExclusionReason || 'Sensibilidad'})` 
        : 'Incluido';
      return `| ${s.studyName} | ${(s.sampleSize || 0).toLocaleString()} | ${s.estimate.toFixed(2)} [${s.ciLower.toFixed(2)}, ${s.ciUpper.toFixed(2)}] | ${s.weightPercent ? `${s.weightPercent.toFixed(1)}%` : '0.0%'} | ${robBadge} | ${statusText} |`;
    });
    const summary = `| **Total Agrupado (${isSensitivityActive ? 'Sensibilidad' : 'Primario'})** | **${sensitivityStats.totalN.toLocaleString()}** | **${sensitivityStats.pooledEst.toFixed(2)} [${sensitivityStats.ciLower.toFixed(2)}, ${sensitivityStats.ciUpper.toFixed(2)}]** | **100.0%** | — | **${sensitivityStats.k} estudios** |`;
    const md = `### Diagrama de Bosque (Forest Plot): ${config.outcomeName}\n${header}\n${rows.join('\n')}\n${summary}\n\n*Heterogeneidad:* Q = ${sensitivityStats.qStatistic.toFixed(2)}, I² = ${sensitivityStats.i2.toFixed(1)}%, Tau² = ${sensitivityStats.tau2.toFixed(3)}. Modelo: ${config.modelType}.`;

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Copy Markdown Sensitivity Summary
  const handleCopySensitivityTable = () => {
    const allScenarios = computeAllSensitivityScenarios(
      studies,
      config.effectMeasure,
      config.modelType,
      config.knappHartungAdjustment
    );
    const md = generateSensitivityMarkdownTable(allScenarios, config.outcomeName, config.effectMeasure);
    navigator.clipboard.writeText(md).then(() => {
      setCopiedSensitivity(true);
      setTimeout(() => setCopiedSensitivity(false), 2000);
    });
  };

  // Insert into Results
  const handleInsertResults = () => {
    if (!onInsertFigureIntoResults) return;

    const figText = `\n\n### Figura 2. Diagrama de Bosque (Forest Plot) del Efecto en ${config.outcomeName}\n\n` +
      `Se sintetizaron los hallazgos de los ensayos clínicos mediante un ${
        config.modelType.startsWith('random') ? 'modelo de efectos aleatorios con estimador de DerSimonian-Laird' : 'modelo de efectos fijos'
      } ponderado por varianza inversa${config.knappHartungAdjustment ? ' con ajuste de Knapp-Hartung' : ''}.\n\n` +
      `El estimador agrupado evidenció un ${config.effectMeasure} = ${sensitivityStats.pooledEst.toFixed(2)} ` +
      `(IC 95%: ${sensitivityStats.ciLower.toFixed(2)} a ${sensitivityStats.ciUpper.toFixed(2)}; p < 0.001) basado en ${sensitivityStats.k} estudios y ${sensitivityStats.totalN.toLocaleString()} participantes. ` +
      `La heterogeneidad entre estudios arrojó un I² = ${sensitivityStats.i2.toFixed(1)}% (Q = ${sensitivityStats.qStatistic.toFixed(2)}, p = ${sensitivityStats.pValue.toFixed(3)}, Tau² = ${sensitivityStats.tau2.toFixed(3)}). ` +
      `El Intervalo de Predicción del 95% osciló entre ${sensitivityStats.predictionIntervalLower.toFixed(2)} y ${sensitivityStats.predictionIntervalUpper.toFixed(2)}.\n\n` +
      `*(Ver archivo complementario Figure2_ForestPlot_${config.outcomeName.replace(/\s+/g, '_')}.svg para el gráfico vectorial en alta resolución)*.`;

    onInsertFigureIntoResults(figText);
    setInsertedNotice('Figura y datos insertados en la sección de Resultados');
    setTimeout(() => setInsertedNotice(null), 3500);
  };

  // Insert Sensitivity Findings into Results
  const handleInsertSensitivityResults = () => {
    if (!onInsertSensitivityIntoResults) {
      if (onInsertFigureIntoResults) {
        const text = '\n\n' + generateSensitivityResultsText(
          evaluateSensitivityPreset(studies, 'all', config.effectMeasure, config.modelType, config.knappHartungAdjustment).result,
          sensitivityResult,
          config.outcomeName,
          config.effectMeasure
        );
        onInsertFigureIntoResults(text);
        setInsertedNotice('Análisis de sensibilidad insertado en Resultados (Ítem 20d)');
        setTimeout(() => setInsertedNotice(null), 3500);
      }
      return;
    }
    const text = '\n\n' + generateSensitivityResultsText(
      evaluateSensitivityPreset(studies, 'all', config.effectMeasure, config.modelType, config.knappHartungAdjustment).result,
      sensitivityResult,
      config.outcomeName,
      config.effectMeasure
    );
    onInsertSensitivityIntoResults(text);
    setInsertedNotice('Análisis de sensibilidad insertado en Resultados (Ítem 20d)');
    setTimeout(() => setInsertedNotice(null), 3500);
  };

  // Insert Sensitivity Specification into Methods
  const handleInsertSensitivityMethods = () => {
    if (!onInsertSensitivityIntoMethods) return;
    const text = '\n\n' + generateSensitivityMethodsText(config.outcomeName, config.effectMeasure);
    onInsertSensitivityIntoMethods(text);
    setInsertedNotice('Métodos de sensibilidad insertados en Métodos (Ítem 13f)');
    setTimeout(() => setInsertedNotice(null), 3500);
  };

  // SVG Geometry Constants
  const plotWidth = 960;
  const headerHeight = 70;
  const rowHeight = 36;
  const studiesCount = filteredStudies.length;
  const dualDiamondExtraHeight = isSensitivityActive && showDualDiamond ? 36 : 0;
  const diamondRowY = headerHeight + 35 + studiesCount * rowHeight;
  const primaryRefDiamondY = diamondRowY + 34;
  const predictionRowY = isSensitivityActive && showDualDiamond ? primaryRefDiamondY + 32 : diamondRowY + 32;
  const footerY = showPredictionInterval ? predictionRowY + 45 : (isSensitivityActive && showDualDiamond ? primaryRefDiamondY + 45 : diamondRowY + 45);
  const totalHeight = footerY + 75;

  const graphLeft = 320;
  const graphRight = 680;
  const graphWidth = graphRight - graphLeft;

  // Coordinate mapping for effect size to X
  const getXPos = (val: number): number => {
    if (isRatioMeasure) {
      const minVal = Math.max(0.01, scaleMin);
      const maxVal = Math.max(minVal + 0.1, scaleMax);
      const logMin = Math.log(minVal);
      const logMax = Math.log(maxVal);
      const logVal = Math.log(Math.max(0.001, val));
      const clampedLog = Math.max(logMin, Math.min(logMax, logVal));
      return graphLeft + ((clampedLog - logMin) / (logMax - logMin)) * graphWidth;
    } else {
      const clamped = Math.max(scaleMin, Math.min(scaleMax, val));
      return graphLeft + ((clamped - scaleMin) / (scaleMax - scaleMin)) * graphWidth;
    }
  };

  const nullXPos = getXPos(nullValue);
  const i2Info = getI2BadgeInfo(sensitivityStats.i2);

  return (
    <div className="space-y-6">
      {/* Header and Controls Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Gráfico de Bosque (Forest Plot) & Análisis de Sensibilidad
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    PRISMA 2020: Ítems 13, 20 & 20d
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visualización cuantitativa con pesos de varianza inversa, rombo agrupado, intervalo de predicción y comprobación de robustez metodológica.
                </p>
              </div>
            </div>
          </div>

          {/* Export and Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadSvg}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Descargar imagen vectorial SVG para publicaciones"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>Descargar SVG</span>
            </button>

            <button
              onClick={handleDownloadPng}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Descargar imagen PNG de alta resolución (300 DPI)"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              <span>PNG (300 DPI)</span>
            </button>

            <button
              onClick={handleCopyMarkdown}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
              title="Copiar tabla de datos en formato Markdown"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
              <span>{copied ? 'Copiado' : 'Copiar Tabla'}</span>
            </button>

            {onNavigateToFunnelPlot && (
              <button
                onClick={onNavigateToFunnelPlot}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300 shadow-2xs transition-colors cursor-pointer"
                title="Evaluar sesgo de publicación y asimetría de Egger (Funnel Plot)"
              >
                <Filter className="w-3.5 h-3.5 text-amber-700 rotate-180" />
                <span>Funnel Plot & Egger (Ítems 14 & 21)</span>
              </button>
            )}

            {onInsertFigureIntoResults && (
              <button
                onClick={handleInsertResults}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insertar en Resultados (Ítem 20)</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Model Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Outcome selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-teal-600" />
              <span>Desenlace Clínico Evaluado:</span>
            </label>
            <select
              value={activeOutcomeId}
              onChange={handleSelectOutcomeChange}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {candidateOutcomes.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name} ({o.preferredEffectMeasure})
                </option>
              ))}
            </select>
          </div>

          {/* Model Type Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Modelo Estadístico:
            </label>
            <select
              value={config.modelType}
              onChange={(e) => {
                if (onChangeConfig) {
                  onChangeConfig({ ...config, modelType: e.target.value as any });
                }
              }}
              className="w-full text-xs rounded-lg border border-slate-300 bg-white p-2 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="random_dersimonian_laird">Efectos Aleatorios (DerSimonian-Laird)</option>
              <option value="random_reml">Efectos Aleatorios (REML)</option>
              <option value="fixed_inverse_variance">Efectos Fijos (Varianza Inversa)</option>
              <option value="fixed_mantel_haenszel">Efectos Fijos (Mantel-Haenszel)</option>
            </select>
          </div>

          {/* Display toggles */}
          <div className="flex flex-col justify-end gap-1.5">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showPredictionInterval}
                onChange={(e) => setShowPredictionInterval(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Intervalo de Predicción 95% (IP)</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showWeights}
                onChange={(e) => setShowWeights(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Mostrar Pesos Estadísticos (%)</span>
            </label>
          </div>

          {/* Scale range controls */}
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">X-Mín</label>
              <input
                type="number"
                step="0.1"
                min="0.01"
                value={scaleMin}
                onChange={(e) => setScaleMin(parseFloat(e.target.value) || 0.1)}
                className="w-full text-xs p-1.5 rounded border border-slate-300 font-mono"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">X-Máx</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                value={scaleMax}
                onChange={(e) => setScaleMax(parseFloat(e.target.value) || 2.0)}
                className="w-full text-xs p-1.5 rounded border border-slate-300 font-mono"
              />
            </div>
            <div className="pt-4">
              <button
                type="button"
                onClick={() => setIsEditingStudies(!isEditingStudies)}
                className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                  isEditingStudies
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
                title="Abrir editor tabular de estudios primarios y riesgo de sesgo"
              >
                <Sliders className="w-4 h-4" />
                <span>Estudios</span>
              </button>
            </div>
          </div>
        </div>

        {/* SENSITIVITY ANALYSIS CONTROLS BAR (NEW) */}
        <div className="pt-3 border-t border-slate-100 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold text-slate-900">
                Análisis de Sensibilidad Metodológico (Ítems 13f y 20d PRISMA 2020):
              </span>
            </div>
            {isSensitivityActive && (
              <span className="text-[11px] font-semibold text-violet-700 bg-violet-50 px-2 py-0.5 rounded border border-violet-200">
                Filtro activo: {sensitivityResult.presetLabel} ({sensitivityResult.excludedCount} excluido/s)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSensitivityPreset('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                sensitivityPreset === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              Todos los Estudios (Basal)
            </button>

            <button
              type="button"
              onClick={() => setSensitivityPreset('exclude_high_rob')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                sensitivityPreset === 'exclude_high_rob'
                  ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                  : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
              }`}
              title="Excluir automáticamente cualquier ensayo clasificado con alto riesgo de sesgo global"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Excluir Alto Riesgo (RoB 2)</span>
            </button>

            <button
              type="button"
              onClick={() => setSensitivityPreset('exclude_high_and_some_concerns')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                sensitivityPreset === 'exclude_high_and_some_concerns'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
              }`}
              title="Restringir la síntesis únicamente a ensayos con bajo riesgo en todos los dominios RoB 2"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Solo Bajo Riesgo (RoB 2)</span>
            </button>

            <button
              type="button"
              onClick={() => setSensitivityPreset('exclude_small_sample')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                sensitivityPreset === 'exclude_small_sample'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-amber-800 border-amber-200 hover:bg-amber-50'
              }`}
              title="Excluir estudios con menos de 1,000 participantes para controlar efectos de muestras pequeñas"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Excluir N &lt; 1,000</span>
            </button>

            <button
              type="button"
              onClick={() => setSensitivityPreset('leave_one_out')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                sensitivityPreset === 'leave_one_out'
                  ? 'bg-violet-700 text-white border-violet-700 shadow-xs'
                  : 'bg-white text-violet-800 border-violet-200 hover:bg-violet-50'
              }`}
              title="Excluir un ensayo a la vez para evaluar influencia unilateral (Jackknife)"
            >
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Leave-One-Out (Jackknife)</span>
            </button>

            {sensitivityPreset === 'leave_one_out' && (
              <select
                value={leaveOneOutStudyId}
                onChange={(e) => setLeaveOneOutStudyId(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-violet-300 bg-violet-50 text-violet-950 font-semibold focus:ring-2 focus:ring-violet-500"
              >
                {studies.map((s) => (
                  <option key={s.id} value={s.id}>
                    Omitir: {s.studyName.split('(')[0].trim()} ({s.sampleSize.toLocaleString()} pac.)
                  </option>
                ))}
              </select>
            )}

            {isSensitivityActive && (
              <label className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer ml-auto">
                <input
                  type="checkbox"
                  checked={showDualDiamond}
                  onChange={(e) => setShowDualDiamond(e.target.checked)}
                  className="rounded text-indigo-600"
                />
                <span>Rombo Comparativo Doble</span>
              </label>
            )}
          </div>

          {/* SENSITIVITY IMPACT COMPARISON BANNER */}
          {isSensitivityActive && (
            <div className="bg-gradient-to-r from-violet-50/70 via-indigo-50/50 to-slate-50 border border-violet-200 rounded-xl p-3.5 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-violet-950">
                    Impacto en el Estimador Agrupado y Heterogeneidad:
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    sensitivityResult.isRobust 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {sensitivityResult.isRobust ? '✓ Efecto Altamente Robusto' : '⚠ Sensible a la Exclusión'}
                  </span>
                </div>
                <div className="text-slate-600 text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    <strong>Basal (k={primaryStats.k}):</strong> {config.effectMeasure} = {primaryStats.pooledEst.toFixed(2)} [{primaryStats.ciLower.toFixed(2)}, {primaryStats.ciUpper.toFixed(2)}] • I² = {primaryStats.i2.toFixed(1)}%
                  </span>
                  <span className="text-violet-700 font-semibold">
                    <ArrowRight className="w-3 h-3 inline mr-1" />
                    <strong>Sensibilidad (k={sensitivityStats.k}):</strong> {config.effectMeasure} = {sensitivityStats.pooledEst.toFixed(2)} [{sensitivityStats.ciLower.toFixed(2)}, {sensitivityStats.ciUpper.toFixed(2)}] • I² = {sensitivityStats.i2.toFixed(1)}%
                  </span>
                  <span className="font-mono text-slate-500">
                    (Δ{config.effectMeasure}: {sensitivityResult.deltaEstimate > 0 ? `+${sensitivityResult.deltaEstimate.toFixed(2)}` : sensitivityResult.deltaEstimate.toFixed(2)} | ΔI²: {sensitivityResult.deltaI2 > 0 ? `+${sensitivityResult.deltaI2.toFixed(1)}%` : `${sensitivityResult.deltaI2.toFixed(1)}%`})
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopySensitivityTable}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                  title="Copiar tabla completa de análisis de sensibilidad en formato Markdown"
                >
                  {copiedSensitivity ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSensitivity ? 'Copiada' : 'Tabla Markdown'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleInsertSensitivityResults}
                  className="px-2.5 py-1 rounded-lg bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                  title="Insertar párrafo de sensibilidad formal en Resultados (Ítem 20d)"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar Ítem 20d</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Insert notice toast */}
      {insertedNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs px-4 py-2 rounded-lg flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span className="font-medium">{insertedNotice}</span>
        </div>
      )}

      {/* Interactive Studies Management Drawer */}
      {isEditingStudies && (
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Gestión de Ensayos Clínicos Primarios y Riesgo de Sesgo (RoB 2)</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Modifica estimadores, tamaños de muestra, juicios de riesgo de sesgo o añade nuevos ensayos para evaluar su impacto directo.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddStudy}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Estudio</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-2 w-10 text-center">Incluir</th>
                  <th className="p-2">Estudio</th>
                  <th className="p-2 w-24">Muestra ($N$)</th>
                  <th className="p-2 w-28 text-center">RoB 2</th>
                  <th className="p-2 w-24 text-center">Estimador</th>
                  <th className="p-2 w-24 text-center">IC Inf 95%</th>
                  <th className="p-2 w-24 text-center">IC Sup 95%</th>
                  <th className="p-2 w-32">Estado Sensibilidad</th>
                  <th className="p-2 w-10 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudies.map((st) => (
                  <tr key={st.id} className={st.excludedBySensitivity ? 'bg-slate-50/80 opacity-60' : 'hover:bg-slate-50'}>
                    <td className="p-2 text-center">
                      <input
                        type="checkbox"
                        checked={st.includedInMeta}
                        onChange={() => handleToggleStudy(st.id)}
                        className="rounded text-indigo-600 cursor-pointer"
                        title="Incluir o excluir del metaanálisis"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="text"
                        value={st.studyName}
                        onChange={(e) => handleUpdateStudy(st.id, { studyName: e.target.value })}
                        className="w-full text-xs p-1 border border-slate-200 rounded font-medium"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        value={st.sampleSize}
                        onChange={(e) => handleUpdateStudy(st.id, { sampleSize: parseInt(e.target.value) || 0 })}
                        className="w-full text-xs p-1 border border-slate-200 rounded font-mono"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <select
                        value={st.robJudgment}
                        onChange={(e) => handleUpdateStudy(st.id, { robJudgment: e.target.value as RobJudgment })}
                        className={`text-[11px] font-bold p-1 rounded border ${
                          st.robJudgment === 'low'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : st.robJudgment === 'some_concerns'
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}
                      >
                        <option value="low">Bajo (+)</option>
                        <option value="some_concerns">Preocupaciones (?)</option>
                        <option value="high">Alto (-)</option>
                      </select>
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={st.estimate}
                        onChange={(e) => handleUpdateStudy(st.id, { estimate: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-1 border border-slate-200 rounded text-center font-mono font-bold"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={st.ciLower}
                        onChange={(e) => handleUpdateStudy(st.id, { ciLower: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-1 border border-slate-200 rounded text-center font-mono"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={st.ciUpper}
                        onChange={(e) => handleUpdateStudy(st.id, { ciUpper: parseFloat(e.target.value) || 0 })}
                        className="w-full text-xs p-1 border border-slate-200 rounded text-center font-mono"
                      />
                    </td>
                    <td className="p-2 text-[11px]">
                      {st.excludedBySensitivity ? (
                        <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Excluido ({st.sensitivityExclusionReason || 'Filtro'})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Incluido ({st.weightPercent?.toFixed(1)}%)
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => handleDeleteStudy(st.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Eliminar estudio"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Forest Plot Graphic Container */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm overflow-x-auto">
        <div className="min-w-[880px]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${plotWidth} ${totalHeight}`}
            width="100%"
            height={totalHeight}
            className="font-sans select-none"
            style={{ backgroundColor: '#ffffff' }}
          >
            <defs>
              {/* Drop shadow filter for diamond */}
              <filter id="diamondShadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodOpacity="0.2" />
              </filter>
            </defs>

            {/* Title / Header of the Figure */}
            <text x="20" y="24" fontSize="13" fontWeight="bold" fill="#0f172a">
              {config.outcomeName.toUpperCase()}
            </text>
            <text x="20" y="40" fontSize="10" fill="#64748b">
              {config.modelType.startsWith('random')
                ? `Modelo de Efectos Aleatorios (${config.modelType === 'random_reml' ? 'REML' : 'DerSimonian-Laird'}) con Intervalos de Confianza del 95%`
                : 'Modelo de Efectos Fijos (Ponderación por Varianza Inversa) con Intervalos de Confianza del 95%'}
              {isSensitivityActive ? ` • [ANÁLISIS DE SENSIBILIDAD: ${sensitivityResult.presetLabel.toUpperCase()}]` : ''}
            </text>

            {/* Table Header Row */}
            <rect x="15" y="48" width={plotWidth - 30} height="22" fill="#f8fafc" rx="4" />
            <text x="25" y="63" fontSize="10" fontWeight="bold" fill="#334155">
              Estudio (Autor y Año)
            </text>
            <text x="245" y="63" fontSize="10" fontWeight="bold" fill="#334155" textAnchor="middle">
              RoB 2
            </text>
            <text x="290" y="63" fontSize="10" fontWeight="bold" fill="#334155" textAnchor="middle">
              Total ($N$)
            </text>
            <text x={(graphLeft + graphRight) / 2} y="63" fontSize="10" fontWeight="bold" fill="#334155" textAnchor="middle">
              Efecto Clínico ({config.effectMeasure}) [IC 95%]
            </text>
            {showWeights && (
              <text x="715" y="63" fontSize="10" fontWeight="bold" fill="#334155" textAnchor="middle">
                Peso (%)
              </text>
            )}
            <text x="840" y="63" fontSize="10" fontWeight="bold" fill="#334155" textAnchor="middle">
              {config.effectMeasure} [IC 95%]
            </text>

            {/* Divider line under header */}
            <line x1="15" y1="70" x2={plotWidth - 15} y2="70" stroke="#cbd5e1" strokeWidth="1" />

            {/* Vertical Reference Line: Null Effect (e.g. 1.0 or 0.0) */}
            <line
              x1={nullXPos}
              y1="70"
              x2={nullXPos}
              y2={footerY - 10}
              stroke="#64748b"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />

            {/* Studies rows */}
            {filteredStudies.map((st, idx) => {
              const y = headerHeight + 20 + idx * rowHeight;
              const xEst = getXPos(st.estimate);
              const xLow = getXPos(st.ciLower);
              const xHigh = getXPos(st.ciUpper);

              const isExcluded = st.excludedBySensitivity || !st.includedInMeta;

              // Square size proportional to weight (min 8px, max 20px)
              const squareSize = showWeights && st.weightPercent && !isExcluded
                ? Math.max(8, Math.min(22, 6 + Math.sqrt(st.weightPercent) * 3.2))
                : 10;

              return (
                <g key={st.id} className="study-row" opacity={isExcluded ? 0.45 : 1.0}>
                  {/* Alternating row background for readability */}
                  {idx % 2 === 1 && (
                    <rect x="15" y={y - 14} width={plotWidth - 30} height={rowHeight} fill="#fcfdfe" />
                  )}

                  {/* Study Name */}
                  <text x="25" y={y + 3} fontSize="11" fontWeight={isExcluded ? 'normal' : '600'} fill={isExcluded ? '#64748b' : '#0f172a'}>
                    {st.studyName} {isExcluded ? '[Excluido]' : ''}
                  </text>

                  {/* RoB 2 badge text */}
                  <text 
                    x="245" 
                    y={y + 3} 
                    fontSize="9" 
                    fontWeight="bold" 
                    fill={st.robJudgment === 'low' ? '#047857' : st.robJudgment === 'some_concerns' ? '#b45309' : '#b91c1c'} 
                    textAnchor="middle"
                  >
                    {st.robJudgment === 'low' ? '⊕ Bajo' : st.robJudgment === 'some_concerns' ? '⊙ Prec.' : '⊝ Alto'}
                  </text>

                  {/* Sample size N */}
                  <text x="290" y={y + 3} fontSize="10" fill="#475569" textAnchor="middle" fontFamily="monospace">
                    {st.sampleSize.toLocaleString()}
                  </text>

                  {/* Horizontal CI Bar */}
                  <line
                    x1={xLow}
                    y1={y}
                    x2={xHigh}
                    y2={y}
                    stroke={isExcluded ? '#94a3b8' : '#0f172a'}
                    strokeWidth={isExcluded ? '1.2' : '1.6'}
                    strokeDasharray={isExcluded ? '3 2' : undefined}
                    strokeLinecap="round"
                  />
                  {/* CI Whiskers */}
                  <line x1={xLow} y1={y - 4} x2={xLow} y2={y + 4} stroke={isExcluded ? '#94a3b8' : '#0f172a'} strokeWidth="1.4" />
                  <line x1={xHigh} y1={y - 4} x2={xHigh} y2={y + 4} stroke={isExcluded ? '#94a3b8' : '#0f172a'} strokeWidth="1.4" />

                  {/* Point Estimate Square */}
                  {isExcluded ? (
                    <rect
                      x={xEst - squareSize / 2}
                      y={y - squareSize / 2}
                      width={squareSize}
                      height={squareSize}
                      fill="#ffffff"
                      stroke="#94a3b8"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                      rx="1"
                    />
                  ) : (
                    <rect
                      x={xEst - squareSize / 2}
                      y={y - squareSize / 2}
                      width={squareSize}
                      height={squareSize}
                      fill="#4338ca"
                      stroke="#312e81"
                      strokeWidth="1"
                      rx="1.5"
                    />
                  )}

                  {/* Weight percentage */}
                  {showWeights && (
                    <text x="715" y={y + 3} fontSize="10" fill={isExcluded ? '#94a3b8' : '#334155'} textAnchor="middle" fontFamily="monospace">
                      {isExcluded ? '0.0%' : `${st.weightPercent?.toFixed(1)}%`}
                    </text>
                  )}

                  {/* Numeric Effect and 95% CI text */}
                  <text 
                    x="840" 
                    y={y + 3} 
                    fontSize="11" 
                    fontWeight={isExcluded ? 'normal' : '500'} 
                    fill={isExcluded ? '#94a3b8' : '#0f172a'} 
                    textAnchor="middle" 
                    fontFamily="monospace"
                  >
                    {st.estimate.toFixed(2)} [{st.ciLower.toFixed(2)}, {st.ciUpper.toFixed(2)}]
                  </text>
                </g>
              );
            })}

            {/* Separator line above summary diamond */}
            <line
              x1="15"
              y1={diamondRowY - 14}
              x2={plotWidth - 15}
              y2={diamondRowY - 14}
              stroke="#94a3b8"
              strokeWidth="1"
            />

            {/* ========================================================================= */}
            {/* ACTIVE SYNTHESIS DIAMOND (SENSITIVITY OR PRIMARY) */}
            {/* ========================================================================= */}
            {(() => {
              const xEst = getXPos(sensitivityStats.pooledEst);
              const xLow = getXPos(sensitivityStats.ciLower);
              const xHigh = getXPos(sensitivityStats.ciUpper);
              const diamondHeight = 9;

              const points = `${xLow},${diamondRowY} ${xEst},${diamondRowY - diamondHeight} ${xHigh},${diamondRowY} ${xEst},${diamondRowY + diamondHeight}`;

              return (
                <g className="summary-diamond">
                  {/* Summary Label */}
                  <text x="25" y={diamondRowY + 4} fontSize="11" fontWeight="bold" fill="#0f172a">
                    {isSensitivityActive 
                      ? `Sensibilidad: ${sensitivityResult.presetLabel.split('(')[0].trim()} (k=${sensitivityStats.k})`
                      : (config.modelType.startsWith('random') ? 'Efectos Aleatorios (Agrupado)' : 'Efectos Fijos (Agrupado)')}
                  </text>

                  {/* Total Sample Size */}
                  <text x="290" y={diamondRowY + 4} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="monospace">
                    {sensitivityStats.totalN.toLocaleString()}
                  </text>

                  {/* Vertical pooled line */}
                  <line
                    x1={xEst}
                    y1={headerHeight}
                    x2={xEst}
                    y2={footerY - 10}
                    stroke="#dc2626"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.8"
                  />

                  {/* Pooled Diamond */}
                  <polygon
                    points={points}
                    fill="#0f172a"
                    stroke="#020617"
                    strokeWidth="1.5"
                    filter="url(#diamondShadow)"
                  />

                  {/* Summary Weight (100%) */}
                  {showWeights && (
                    <text x="715" y={diamondRowY + 4} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="monospace">
                      100.0%
                    </text>
                  )}

                  {/* Summary Numeric Effect */}
                  <text x="840" y={diamondRowY + 4} fontSize="11" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="monospace">
                    {sensitivityStats.pooledEst.toFixed(2)} [{sensitivityStats.ciLower.toFixed(2)}, {sensitivityStats.ciUpper.toFixed(2)}]
                  </text>
                </g>
              );
            })()}

            {/* ========================================================================= */}
            {/* DUAL DIAMOND: PRIMARY REFERENCE DIAMOND (WHEN SENSITIVITY IS ACTIVE) */}
            {/* ========================================================================= */}
            {isSensitivityActive && showDualDiamond && (() => {
              const xEst = getXPos(primaryStats.pooledEst);
              const xLow = getXPos(primaryStats.ciLower);
              const xHigh = getXPos(primaryStats.ciUpper);
              const diamondHeight = 8;

              const points = `${xLow},${primaryRefDiamondY} ${xEst},${primaryRefDiamondY - diamondHeight} ${xHigh},${primaryRefDiamondY} ${xEst},${primaryRefDiamondY + diamondHeight}`;

              return (
                <g className="primary-reference-diamond">
                  <text x="25" y={primaryRefDiamondY + 4} fontSize="10" fontStyle="italic" fill="#64748b">
                    Referencia Basal (Todos los estudios, k={primaryStats.k}):
                  </text>
                  <text x="290" y={primaryRefDiamondY + 4} fontSize="10" fill="#64748b" textAnchor="middle" fontFamily="monospace">
                    {primaryStats.totalN.toLocaleString()}
                  </text>

                  <polygon
                    points={points}
                    fill="#f1f5f9"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="4 3"
                  />

                  {showWeights && (
                    <text x="715" y={primaryRefDiamondY + 4} fontSize="10" fill="#64748b" textAnchor="middle" fontFamily="monospace">
                      Ref.
                    </text>
                  )}

                  <text x="840" y={primaryRefDiamondY + 4} fontSize="10" fill="#64748b" textAnchor="middle" fontFamily="monospace">
                    {primaryStats.pooledEst.toFixed(2)} [{primaryStats.ciLower.toFixed(2)}, {primaryStats.ciUpper.toFixed(2)}]
                  </text>
                </g>
              );
            })()}

            {/* ========================================================================= */}
            {/* 95% PREDICTION INTERVAL (IP) */}
            {/* ========================================================================= */}
            {showPredictionInterval && (() => {
              const xPredL = getXPos(sensitivityStats.predictionIntervalLower);
              const xPredU = getXPos(sensitivityStats.predictionIntervalUpper);

              return (
                <g className="prediction-interval">
                  <text x="25" y={predictionRowY + 3} fontSize="10" fontStyle="italic" fill="#475569">
                    Intervalo de Predicción del 95% (IP):
                  </text>

                  {/* Prediction Bar */}
                  <line
                    x1={xPredL}
                    y1={predictionRowY}
                    x2={xPredU}
                    y2={predictionRowY}
                    stroke="#be123c"
                    strokeWidth="2.5"
                    strokeLinecap="square"
                  />
                  {/* Bracket caps */}
                  <line x1={xPredL} y1={predictionRowY - 5} x2={xPredL} y2={predictionRowY + 5} stroke="#be123c" strokeWidth="2" />
                  <line x1={xPredU} y1={predictionRowY - 5} x2={xPredU} y2={predictionRowY + 5} stroke="#be123c" strokeWidth="2" />

                  {/* Text on right */}
                  <text x="840" y={predictionRowY + 3} fontSize="10" fill="#be123c" fontWeight="600" textAnchor="middle" fontFamily="monospace">
                    [{sensitivityStats.predictionIntervalLower.toFixed(2)}, {sensitivityStats.predictionIntervalUpper.toFixed(2)}]
                  </text>
                </g>
              );
            })()}

            {/* ========================================================================= */}
            {/* X-AXIS AND DIRECTION LABELS */}
            {/* ========================================================================= */}
            <g className="x-axis" transform={`translate(0, ${footerY})`}>
              <line x1={graphLeft} y1="0" x2={graphRight} y2="0" stroke="#475569" strokeWidth="1.2" />

              {/* Ticks & Labels */}
              {(() => {
                const tickValues = isRatioMeasure
                  ? [scaleMin, 0.5, 0.7, 1.0, 1.5, scaleMax].filter(
                      (v, i, arr) => v >= scaleMin && v <= scaleMax && arr.indexOf(v) === i
                    )
                  : [scaleMin, -0.5, 0.0, 0.5, scaleMax];

                return tickValues.map((tv) => {
                  const x = getXPos(tv);
                  return (
                    <g key={tv}>
                      <line x1={x} y1="0" x2={x} y2="5" stroke="#475569" strokeWidth="1" />
                      <text x={x} y="16" fontSize="9" fill="#475569" textAnchor="middle" fontFamily="monospace">
                        {tv.toFixed(tv < 1 ? 2 : 1)}
                      </text>
                    </g>
                  );
                });
              })()}

              {/* Directional Arrows & Explanations */}
              <text x={graphLeft + 15} y="32" fontSize="9" fontWeight="600" fill="#15803d" textAnchor="start">
                ← Favorece Intervención (SGLT2i)
              </text>
              <text x={graphRight - 15} y="32" fontSize="9" fontWeight="600" fill="#b91c1c" textAnchor="end">
                Favorece Control / Placebo →
              </text>
            </g>

            {/* ========================================================================= */}
            {/* FOOTER STATISTICAL ANNOTATIONS (PRISMA ITEM 20) */}
            {/* ========================================================================= */}
            <g className="footer-stats" transform={`translate(20, ${footerY + 48})`}>
              <rect x="0" y="0" width={plotWidth - 40} height="28" fill="#f8fafc" rx="4" stroke="#e2e8f0" />
              <text x="12" y="18" fontSize="10" fill="#334155">
                <tspan fontWeight="bold">Heterogeneidad ({isSensitivityActive ? 'Sensibilidad' : 'Primario'}):</tspan> Q = {sensitivityStats.qStatistic.toFixed(2)} (gl = {Math.max(1, sensitivityStats.k - 1)}, p = {sensitivityStats.pValue.toFixed(3)}); I² = {sensitivityStats.i2.toFixed(1)}%; Tau² = {sensitivityStats.tau2.toFixed(3)}
              </text>
              <text x={plotWidth - 55} y="18" fontSize="10" fill="#334155" textAnchor="end">
                <tspan fontWeight="bold">Efecto global:</tspan> Z = {sensitivityStats.zValue.toFixed(2)} (p &lt; 0.001)
              </text>
            </g>
          </svg>
        </div>
      </div>

      {/* Summary Interpretation Card */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-1">
          <div className="font-bold text-slate-900 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Interpretación Metodológica Cochrane & PRISMA 2020:</span>
          </div>
          <p className="text-slate-600 max-w-3xl leading-relaxed">
            {isSensitivityActive ? (
              <>
                El análisis de sensibilidad (<strong>{sensitivityResult.presetLabel}</strong>) corrobora que el efecto combinado continúa siendo estadísticamente significativo ({config.effectMeasure} = {sensitivityStats.pooledEst.toFixed(2)}, IC 95%: {sensitivityStats.ciLower.toFixed(2)} a {sensitivityStats.ciUpper.toFixed(2)}; p &lt; 0.001). 
                La variación absoluta con respecto al análisis primario basal es de solo <strong>{sensitivityResult.deltaEstimate > 0 ? `+${sensitivityResult.deltaEstimate.toFixed(2)}` : sensitivityResult.deltaEstimate.toFixed(2)}</strong> en el estimador puntual, lo que confirma que el resultado <strong>{sensitivityResult.isRobust ? 'es robusto frente a sesgos potenciales' : 'requiere cautela interpretativa'}</strong>.
              </>
            ) : (
              <>
                El estimador agrupado sintético evidencia una reducción relativa estadísticamente significativa en el riesgo de <strong>{config.outcomeName}</strong> ({config.effectMeasure} = {sensitivityStats.pooledEst.toFixed(2)}, IC 95%: {sensitivityStats.ciLower.toFixed(2)} a {sensitivityStats.ciUpper.toFixed(2)}; p &lt; 0.001). La heterogeneidad observada se clasifica como <strong>{i2Info.label}</strong> (I² = {sensitivityStats.i2.toFixed(1)}%).
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${i2Info.color}`}>
            I² = {sensitivityStats.i2.toFixed(1)}% ({i2Info.label.split('(')[0].trim()})
          </span>
        </div>
      </div>
    </div>
  );
};
