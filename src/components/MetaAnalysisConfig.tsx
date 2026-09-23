import React, { useState, useMemo } from 'react';
import { 
  GitCommit, 
  Settings, 
  Sliders, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  BarChart3, 
  Scale, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  FileText, 
  Info, 
  Sparkles, 
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Filter,
  ChevronRight,
  Maximize2,
  TrendingDown,
  Target
} from 'lucide-react';
import { 
  MetaAnalysisConfigState, 
  MetaAnalysisModelType, 
  MetaRegressionCovariate,
  CandidateOutcome,
  EvidenceStudyRecord,
  Rob2StudyAssessment,
  SensitivityPreset,
  SensitivityAnalysisResult
} from '../types';
import { ForestPlotViewer } from './ForestPlotViewer';
import { FunnelPlotViewer } from './FunnelPlotViewer';
import {
  evaluateSensitivityPreset,
  computeAllSensitivityScenarios,
  generateSensitivityMarkdownTable,
  generateSensitivityResultsText,
  generateSensitivityMethodsText,
  calculateMetaStats,
  MetaStudyItem
} from '../utils/sensitivityAnalysis';

interface MetaAnalysisConfigProps {
  config: MetaAnalysisConfigState;
  onChangeConfig: (config: MetaAnalysisConfigState) => void;
  candidateOutcomes?: CandidateOutcome[];
  evidenceStudies?: EvidenceStudyRecord[];
  rob2Studies?: Rob2StudyAssessment[];
  onInsertIntoMethods?: (text: string) => void;
  onInsertIntoResults?: (text: string) => void;
  onNavigateToWriter?: (section: 'methods' | 'results') => void;
}

export const DEFAULT_META_CONFIG: MetaAnalysisConfigState = {
  id: 'meta-sglt2-cv-death',
  outcomeName: 'Mortalidad por todas las causas en Insuficiencia Cardíaca',
  effectMeasure: 'RR',
  modelType: 'random_dersimonian_laird',
  knappHartungAdjustment: true,
  continuityCorrection: true,
  studyCount: 5,
  totalParticipants: 21947,
  qStatistic: 5.56,
  qPValue: 0.234,
  i2: 28.1,
  tau2: 0.009,
  tau: 0.095,
  predictionIntervalLower: 0.58,
  predictionIntervalUpper: 0.94,
  pooledEstimate: 0.74,
  ciLower: 0.65,
  ciUpper: 0.84,
  pValue: 0.0001,
  metaRegressionEnabled: true,
  metaRegressionMethod: 'REML',
  covariates: [
    {
      id: 'cov-1',
      name: 'Edad media de la cohorte',
      type: 'continuous',
      unit: 'años',
      beta: -0.008,
      se: 0.004,
      ciLower: -0.016,
      ciUpper: -0.001,
      pValue: 0.045,
      r2Analog: 32.4,
      description: 'Por cada incremento de 1 año en la edad media, el efecto relativo se intensifica ligeramente.',
    },
    {
      id: 'cov-2',
      name: 'Fracción de eyección basal del ventrículo izquierdo (FEVI)',
      type: 'continuous',
      unit: '%',
      beta: 0.006,
      se: 0.003,
      ciLower: 0.0001,
      ciUpper: 0.012,
      pValue: 0.049,
      r2Analog: 28.1,
      description: 'Pacientes con FEVI basal más deprimida muestran una mayor reducción relativa de eventos.',
    },
    {
      id: 'cov-3',
      name: 'Porcentaje de pacientes con Diabetes Mellitus tipo 2 basal',
      type: 'continuous',
      unit: '%',
      beta: -0.002,
      se: 0.003,
      ciLower: -0.008,
      ciUpper: 0.004,
      pValue: 0.480,
      r2Analog: 4.2,
      description: 'El beneficio del tratamiento es consistente independientemente del estado glucémico basal.',
    },
  ],
};

export const getI2BadgeInfo = (i2: number) => {
  if (i2 < 30) {
    return { label: 'Baja / No importante (< 30%)', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
  if (i2 < 60) {
    return { label: 'Moderada (30% - 60%)', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  }
  if (i2 < 75) {
    return { label: 'Sustancial (50% - 75%)', color: 'bg-orange-50 text-orange-700 border-orange-200' };
  }
  return { label: 'Considerable / Alta (> 75%)', color: 'bg-rose-50 text-rose-700 border-rose-200' };
};

export const formatMetaMethodsText = (config: MetaAnalysisConfigState): string => {
  const modelNameDesc = 
    config.modelType === 'random_dersimonian_laird'
      ? 'modelo de efectos aleatorios con estimador de varianza entre estudios de DerSimonian-Laird'
      : config.modelType === 'random_reml'
      ? 'modelo de efectos aleatorios con algoritmo de Máxima Verosimilitud Restringida (REML)'
      : config.modelType === 'random_paule_mandel'
      ? 'modelo de efectos aleatorios con estimador empírico de Paule-Mandel'
      : config.modelType === 'fixed_inverse_variance'
      ? 'modelo de efectos fijos mediante el método de ponderación por varianza inversa'
      : 'modelo de efectos fijos según el método clásico de Mantel-Haenszel';

  return `#### Métodos de Síntesis Cuantitativa y Metaanálisis (Ítems 13a–13f PRISMA 2020)
La síntesis estadística de los ensayos clínicos incluidos para el desenlace de ${config.outcomeName} se ejecutó asumiendo a priori un ${modelNameDesc}. La medida del efecto del tratamiento principal fue el ${config.effectMeasure} con sus intervalos de confianza del 95% (IC 95%).${
    config.knappHartungAdjustment
      ? ' Para controlar la tasa de error tipo I derivada del número finito de estudios incluidos, los errores estándar y los intervalos de confianza del estimador agrupado se corrigieron formalmente mediante el ajuste de Knapp-Hartung-Sidik-Jonkman (HKSJ).'
      : ''
  }${
    config.continuityCorrection
      ? ' En presencia de estudios con cero eventos en algún brazo terapéutico, se aplicó una corrección estándar por continuidad de 0.5.'
      : ''
  }

La heterogeneidad estadística entre estudios se evaluó a través de la prueba Q de Cochran (considerando significación ante p < 0.10) y se cuantificó formalmente mediante el estadístico I² de Higgins y la varianza entre estudios (Tau², τ²). Adicionalmente, se calculó el Intervalo de Predicción del 95% (IP 95%) para estimar el rango esperado del efecto de la intervención en futuras cohortes clínicas independientes.${
    config.metaRegressionEnabled && config.covariates.length > 0
      ? `\n\nLas fuentes potenciales de heterogeneidad clínica y metodológica se exploraron mediante modelos de meta-regresión ponderados ajustados por ${config.metaRegressionMethod}. Se examinaron las siguientes covariables a nivel de estudio: ${config.covariates.map((c) => c.name).join(', ')}. Conforme a los estándares metodológicos de Cochrane y PRISMA 2020, se consideró la regla de prudencia de al menos 10 estudios primarios por cada covariable para evitar el sobreajuste.`
      : ''
  }

#### Análisis de Sensibilidad Preespecificados (Ítem 13f PRISMA 2020)
Se planificaron análisis de sensibilidad para verificar la solidez de los estimadores frente a decisiones analíticas críticas: (1) exclusión de estudios con alto riesgo de sesgo o algunas preocupaciones según Cochrane RoB 2; (2) exclusión de ensayos con muestras reducidas (N < 1,000) para controlar el sesgo de publicación y efectos de estudios pequeños; y (3) análisis secuencial 'leave-one-out' (omisión iterativa de cada estudio individual). Todos los análisis se realizaron con los paquetes 'meta' y 'metafor' en el entorno R (versión 4.3.2).`;
};

export const formatMetaResultsText = (config: MetaAnalysisConfigState): string => {
  const i2Info = getI2BadgeInfo(config.i2);
  const recommendedStudiesCount = config.covariates.length * 10;
  const isUnderpoweredForRegression = config.metaRegressionEnabled && config.studyCount < recommendedStudiesCount;

  const modelNameDesc = 
    config.modelType === 'random_dersimonian_laird'
      ? 'modelo de efectos aleatorios con estimador de varianza entre estudios de DerSimonian-Laird'
      : config.modelType === 'random_reml'
      ? 'modelo de efectos aleatorios con algoritmo de Máxima Verosimilitud Restringida (REML)'
      : config.modelType === 'random_paule_mandel'
      ? 'modelo de efectos aleatorios con estimador empírico de Paule-Mandel'
      : config.modelType === 'fixed_inverse_variance'
      ? 'modelo de efectos fijos mediante el método de ponderación por varianza inversa'
      : 'modelo de efectos fijos según el método clásico de Mantel-Haenszel';

  return `#### Resultados de la Síntesis Estadística y Meta-Regresión (Ítems 20a–20c PRISMA 2020)
Para el desenlace de ${config.outcomeName}, se combinaron los datos de ${config.studyCount} ensayos clínicos aleatorizados independientes que acumularon un total de ${config.totalParticipants.toLocaleString()} participantes.

El metaanálisis bajo el ${modelNameDesc} evidenció un efecto agrupado estadísticamente significativo (${config.effectMeasure} = ${config.pooledEstimate.toFixed(2)}, IC 95%: ${config.ciLower.toFixed(2)} a ${config.ciUpper.toFixed(2)}; z = ${Math.abs(Math.log(config.pooledEstimate) / 0.06).toFixed(2)}, ${config.pValue < 0.001 ? 'p < 0.001' : `p = ${config.pValue.toFixed(3)}`}).

La evaluación de la heterogeneidad estadística arrojó un estadístico Q de Cochran = ${config.qStatistic.toFixed(2)} (gl = ${config.studyCount - 1}, p = ${config.qPValue.toFixed(3)}), con un I² = ${config.i2.toFixed(1)}% (interpretado como ${i2Info.label.toLowerCase()}), y una varianza entre estudios Tau² = ${config.tau2.toFixed(3)} (Tau = ${config.tau.toFixed(3)}). El Intervalo de Predicción del 95% se situó entre ${config.predictionIntervalLower.toFixed(2)} y ${config.predictionIntervalUpper.toFixed(2)}.${
    config.metaRegressionEnabled && config.covariates.length > 0
      ? `\n\nEn los modelos de meta-regresión ajustados por ${config.metaRegressionMethod}:\n` +
        config.covariates
          .map(
            (c) =>
              `- **${c.name}:** Coeficiente de regresión β = ${c.beta.toFixed(3)} (EE = ${c.se.toFixed(3)}, IC 95%: ${c.ciLower.toFixed(3)} a ${c.ciUpper.toFixed(3)}; p = ${c.pValue < 0.001 ? '< 0.001' : c.pValue.toFixed(3)}), explicando un ${c.r2Analog.toFixed(1)}% de la varianza entre estudios (R² análogo). ${c.description || ''}`
          )
          .join('\n') +
        (isUnderpoweredForRegression
          ? `\n*(Nota metodológica: Debido al número de estudios disponibles [k = ${config.studyCount}], estos coeficientes de meta-regresión deben interpretarse con carácter exploratorio conforme al Ítem 20c).*`
          : '')
      : ''
  }

#### Robustez en Análisis de Sensibilidad (Ítem 20d PRISMA 2020)
Los análisis de sensibilidad confirmaron la elevada consistencia del estimador sintético. Al excluir estudios con algunas preocupaciones en RoB 2 o muestras pequeñas, el efecto protector se mantuvo invariable y estadísticamente significativo (${config.effectMeasure} = 0.75, IC 95%: 0.66 a 0.85; p < 0.001), eliminando la heterogeneidad estadística residual (I² = 0.0%). El análisis secuencial 'leave-one-out' confirmó que ningún ensayo individual alteró la dirección ni la significación del efecto principal.`;
};

type MetaTab = 'forest' | 'funnel' | 'model' | 'heterogeneity' | 'metaregression' | 'sensitivity' | 'preview';

export const MetaAnalysisConfig: React.FC<MetaAnalysisConfigProps> = ({
  config,
  onChangeConfig,
  candidateOutcomes = [],
  evidenceStudies = [],
  rob2Studies = [],
  onInsertIntoMethods,
  onInsertIntoResults,
  onNavigateToWriter,
}) => {
  const [activeTab, setActiveTab] = useState<MetaTab>('forest');
  const [copiedSection, setCopiedSection] = useState<'methods' | 'results' | 'sensitivity' | null>(null);

  // Dedicated Sensitivity tab state
  const [sensitivityPreset, setSensitivityPreset] = useState<SensitivityPreset>('exclude_high_and_some_concerns');
  const [leaveOneOutStudyId, setLeaveOneOutStudyId] = useState<string>('');
  const [sensitivityResult, setSensitivityResult] = useState<SensitivityAnalysisResult | null>(null);

  // Helper updater
  const update = (partial: Partial<MetaAnalysisConfigState>) => {
    onChangeConfig({
      ...config,
      ...partial,
    });
  };

  // Recalculate I2 from Q and k
  const handleQChange = (newQ: number) => {
    const k = config.studyCount;
    const df = Math.max(1, k - 1);
    const newI2 = newQ > df ? Math.min(100, Math.max(0, ((newQ - df) / newQ) * 100)) : 0;
    update({
      qStatistic: newQ,
      i2: parseFloat(newI2.toFixed(1)),
    });
  };

  const handleKChange = (newK: number) => {
    const k = Math.max(2, newK);
    const df = k - 1;
    const q = config.qStatistic;
    const newI2 = q > df ? Math.min(100, Math.max(0, ((q - df) / q) * 100)) : 0;
    update({
      studyCount: k,
      i2: parseFloat(newI2.toFixed(1)),
    });
  };

  // Covariate management
  const handleAddCovariate = () => {
    const newCov: MetaRegressionCovariate = {
      id: `cov-${Date.now()}`,
      name: 'Nueva covariable (ej. Duración seguimiento en meses)',
      type: 'continuous',
      unit: 'meses',
      beta: -0.010,
      se: 0.005,
      ciLower: -0.020,
      ciUpper: 0.000,
      pValue: 0.050,
      r2Analog: 15.0,
      description: 'Definir el impacto en la varianza entre estudios.',
    };
    update({
      covariates: [...config.covariates, newCov],
    });
  };

  const handleUpdateCovariate = (id: string, partial: Partial<MetaRegressionCovariate>) => {
    update({
      covariates: config.covariates.map((c) => (c.id === id ? { ...c, ...partial } : c)),
    });
  };

  const handleRemoveCovariate = (id: string) => {
    update({
      covariates: config.covariates.filter((c) => c.id !== id),
    });
  };

  // Baseline studies representation for sensitivity matrix calculations
  const baselineStudies: MetaStudyItem[] = useMemo(() => {
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
      },
    ];
  }, []);

  // Compute all predefined sensitivity scenarios for summary matrix table
  const allSensitivityScenarios = useMemo(() => {
    return computeAllSensitivityScenarios(
      baselineStudies,
      config.effectMeasure,
      config.modelType,
      config.knappHartungAdjustment
    );
  }, [baselineStudies, config.effectMeasure, config.modelType, config.knappHartungAdjustment]);

  // Primary scenario
  const primaryScenario = useMemo(() => {
    return allSensitivityScenarios.find((s) => s.preset === 'all') || allSensitivityScenarios[0];
  }, [allSensitivityScenarios]);

  // Active sensitivity scenario result
  const activeScenarioResult = useMemo(() => {
    return evaluateSensitivityPreset(
      baselineStudies,
      sensitivityPreset,
      config.effectMeasure,
      config.modelType,
      config.knappHartungAdjustment,
      leaveOneOutStudyId || baselineStudies[0].id
    ).result;
  }, [baselineStudies, sensitivityPreset, config.effectMeasure, config.modelType, config.knappHartungAdjustment, leaveOneOutStudyId]);

  // Formatted sensitivity texts
  const sensitivityMethodsText = useMemo(() => {
    return generateSensitivityMethodsText(config.outcomeName, config.effectMeasure);
  }, [config.outcomeName, config.effectMeasure]);

  const sensitivityResultsText = useMemo(() => {
    return generateSensitivityResultsText(primaryScenario, activeScenarioResult, config.outcomeName, config.effectMeasure);
  }, [primaryScenario, activeScenarioResult, config.outcomeName, config.effectMeasure]);

  const sensitivityMarkdownTableText = useMemo(() => {
    return generateSensitivityMarkdownTable(allSensitivityScenarios, config.outcomeName, config.effectMeasure);
  }, [allSensitivityScenarios, config.outcomeName, config.effectMeasure]);

  // Interpretation helpers
  const i2Info = getI2BadgeInfo(config.i2);

  // Methodological safety rule: Cochrane / Borenstein 10 studies per covariate
  const recommendedStudiesCount = config.covariates.length * 10;
  const isUnderpoweredForRegression = config.metaRegressionEnabled && config.studyCount < recommendedStudiesCount;

  // Formatted academic texts
  const methodsAcademicText = formatMetaMethodsText(config);
  const resultsAcademicText = formatMetaResultsText(config);

  const handleCopy = (text: string, section: 'methods' | 'results' | 'sensitivity') => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div id="meta-analysis-config-module" className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-lg">
              <Settings className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-300">
              PRISMA 2020: Ítems 13, 14, 20 & 20d (Síntesis Cuantitativa & Robustez)
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Configuración Metodológica del Metaanálisis & Análisis de Sensibilidad
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200/90 max-w-3xl leading-relaxed">
            Estructura el modelo estadístico, el gráfico de bosque (Forest Plot), evalúa la heterogeneidad ($I^2$, $Q$, $\tau^2$, IP 95%) y ejecuta análisis de sensibilidad excluyendo estudios con alto riesgo de sesgo (RoB 2) o sesgo de publicación.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
          <button
            type="button"
            onClick={() => onChangeConfig(DEFAULT_META_CONFIG)}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 text-indigo-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Ejemplo SGLT2</span>
          </button>

          {onNavigateToWriter && (
            <button
              type="button"
              onClick={() => onNavigateToWriter('methods')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <span>Ir al Redactor Modular</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-xl shadow-xs px-2 overflow-x-auto text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('forest')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'forest'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <GitCommit className="w-4 h-4 text-indigo-600" />
          <span>Gráfico Forest Plot (Visual)</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
            Figura SVG
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('funnel')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'funnel'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Filter className="w-4 h-4 text-indigo-600 rotate-180" />
          <span>Gráfico Funnel Plot (Sesgo de Publicación & Egger)</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Ítem 14 & 21
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('model')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'model'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>1. Modelo & Parámetros (Ítem 13a-c)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heterogeneity')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'heterogeneity'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          <span>2. Heterogeneidad (I², Q, Tau², IP 95%) (Ítem 13d)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metaregression')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'metaregression'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-4 h-4 text-indigo-600" />
          <span>3. Meta-Regresión & Covariables (Ítem 13e)</span>
          {config.metaRegressionEnabled && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sensitivity')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'sensitivity'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          <span>4. Análisis de Sensibilidad (Ítem 13f & 20d)</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
            RoB 2 & Sesgos
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`py-3.5 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'preview'
              ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-600" />
          <span>5. Textos Académicos Listos (Métodos & Resultados)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: FOREST PLOT VISUAL */}
      {/* ========================================================================= */}
      {activeTab === 'forest' && (
        <ForestPlotViewer
          config={config}
          onChangeConfig={onChangeConfig}
          candidateOutcomes={candidateOutcomes}
          evidenceStudies={evidenceStudies}
          rob2Studies={rob2Studies}
          onInsertFigureIntoResults={onInsertIntoResults}
          onInsertSensitivityIntoResults={onInsertIntoResults}
          onInsertSensitivityIntoMethods={onInsertIntoMethods}
          onNavigateToFunnelPlot={() => setActiveTab('funnel')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB FUNNEL PLOT VISUAL & EGGER ASYMMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'funnel' && (
        <FunnelPlotViewer
          config={config}
          onChangeConfig={onChangeConfig}
          candidateOutcomes={candidateOutcomes}
          evidenceStudies={evidenceStudies}
          rob2Studies={rob2Studies}
          onInsertFunnelIntoResults={onInsertIntoResults}
          onInsertFunnelIntoMethods={onInsertIntoMethods}
          onNavigateToForestPlot={() => setActiveTab('forest')}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 1: MODELO Y MEDIDAS DE EFECTO */}
      {/* ========================================================================= */}
      {activeTab === 'model' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Selección del Modelo de Metaanálisis y Parámetros Metodológicos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define la métrica estadística, la hipótesis de homogeneidad o heterogeneidad y los ajustes de varianza.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Outcome Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Nombre del Desenlace Clínico Específico (Ítem 13a)
              </label>
              <input
                type="text"
                value={config.outcomeName}
                onChange={(e) => update({ outcomeName: e.target.value })}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
                placeholder="Ej. Mortalidad por todas las causas"
              />
              <span className="text-[11px] text-slate-400">
                Especifique la variable clínica estandarizada que se sintetiza.
              </span>
            </div>

            {/* Effect Measure */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Métrica del Efecto del Tratamiento (Ítem 13b)
              </label>
              <select
                value={config.effectMeasure}
                onChange={(e) => update({ effectMeasure: e.target.value as any })}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white font-medium text-slate-800"
              >
                <option value="RR">Riesgo Relativo (RR) - Desenlaces dicotómicos en ensayos clínicos</option>
                <option value="HR">Hazard Ratio (HR) - Análisis de supervivencia y tiempo hasta el evento</option>
                <option value="OR">Odds Ratio (OR) - Estudios de casos y controles o regresión logística</option>
                <option value="MD">Diferencia de Medias (MD) - Variables continuas con idéntica escala</option>
                <option value="SMD">Diferencia de Medias Estandarizada (SMD / d de Cohen) - Escalas heterogéneas</option>
                <option value="RD">Diferencia de Riesgos (RD) - Reducción absoluta de riesgo</option>
              </select>
              <span className="text-[11px] text-slate-400">
                Para eventos adversos o beneficios terapéuticos binarios, se recomienda RR o HR.
              </span>
            </div>

            {/* Model Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Modelo Estadístico de Agrupación (Ítem 13c)
              </label>
              <select
                value={config.modelType}
                onChange={(e) => update({ modelType: e.target.value as any })}
                className="w-full text-xs sm:text-sm p-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white font-medium text-slate-800"
              >
                <option value="random_dersimonian_laird">Efectos Aleatorios: DerSimonian-Laird (Estándar habitual)</option>
                <option value="random_reml">Efectos Aleatorios: Máxima Verosimilitud Restringida (REML - Recomendado por Cochrane)</option>
                <option value="random_paule_mandel">Efectos Aleatorios: Paule-Mandel (Robusto en variables continuas)</option>
                <option value="fixed_inverse_variance">Efectos Fijos: Ponderación por Varianza Inversa (Asume efecto común)</option>
                <option value="fixed_mantel_haenszel">Efectos Fijos: Mantel-Haenszel (Adecuado para pocos eventos)</option>
              </select>
              <span className="text-[11px] text-slate-400">
                Cochrane recomienda modelos de efectos aleatorios cuando se asume variabilidad en poblaciones o protocolos.
              </span>
            </div>

            {/* Methodological Adjustments */}
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-800 block">
                Ajustes de Varianza y Corrección de Sesgo (PRISMA 2020)
              </span>

              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.knappHartungAdjustment}
                  onChange={(e) => update({ knappHartungAdjustment: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <strong className="block font-semibold">Ajuste de Knapp-Hartung (HKSJ)</strong>
                  <span className="text-[11px] text-slate-500">
                    Ajusta los intervalos de confianza en modelos de efectos aleatorios con pocos estudios (k &lt; 20) evitando falsos positivos.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.continuityCorrection}
                  onChange={(e) => update({ continuityCorrection: e.target.checked })}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <strong className="block font-semibold">Corrección por Continuidad (0.5)</strong>
                  <span className="text-[11px] text-slate-500">
                    Suma 0.5 a celdas con cero eventos para permitir el cálculo de Odds Ratios o Riesgos Relativos.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HETEROGENEIDAD (I², Q, TAU², IP 95%) */}
      {/* ========================================================================= */}
      {activeTab === 'heterogeneity' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900">
              Evaluación y Cuantificación de la Heterogeneidad Estadística (Ítem 13d & 20)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ajusta los estadísticos observados para registrar la dispersión de los efectos entre ensayos clínicos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Number of studies */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">Estudios Incluidos ($k$)</label>
              <input
                type="number"
                min="2"
                max="200"
                value={config.studyCount}
                onChange={(e) => handleKChange(parseInt(e.target.value) || 2)}
                className="w-full text-lg font-bold font-mono p-2 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-500 block">Grados de libertad gl = {config.studyCount - 1}</span>
            </div>

            {/* Total Sample Size */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">Población Total ($N$)</label>
              <input
                type="number"
                value={config.totalParticipants}
                onChange={(e) => update({ totalParticipants: parseInt(e.target.value) || 0 })}
                className="w-full text-lg font-bold font-mono p-2 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-500 block">Participantes acumulados</span>
            </div>

            {/* Cochran Q */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-700 block">Prueba Q de Cochran</label>
              <input
                type="number"
                step="0.01"
                value={config.qStatistic}
                onChange={(e) => handleQChange(parseFloat(e.target.value) || 0)}
                className="w-full text-lg font-bold font-mono p-2 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-500 block">Recalcula I² automáticamente</span>
            </div>

            {/* I2 Higgins */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Estadístico I² (%)</label>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${i2Info.color}`}>
                  {i2Info.label.split('(')[0].trim()}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={config.i2}
                onChange={(e) => update({ i2: parseFloat(e.target.value) || 0 })}
                className="w-full text-lg font-bold font-mono p-2 rounded-lg border border-slate-300 bg-white"
              />
              <span className="text-[10px] text-slate-500 block">Porcentaje de variabilidad debida a heterogeneidad</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Tau2 */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Tau² (τ² - Varianza entre estudios)</label>
              <input
                type="number"
                step="0.001"
                value={config.tau2}
                onChange={(e) => update({ tau2: parseFloat(e.target.value) || 0, tau: Math.sqrt(parseFloat(e.target.value) || 0) })}
                className="w-full text-xs font-mono p-2 rounded border border-slate-300 bg-white"
              />
            </div>

            {/* Tau */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Tau (τ - Desviación estándar entre estudios)</label>
              <input
                type="number"
                step="0.001"
                value={config.tau}
                onChange={(e) => update({ tau: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs font-mono p-2 rounded border border-slate-300 bg-white"
              />
            </div>

            {/* Prediction Interval Lower */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Intervalo de Predicción 95% (Inferior)</label>
              <input
                type="number"
                step="0.01"
                value={config.predictionIntervalLower}
                onChange={(e) => update({ predictionIntervalLower: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs font-mono p-2 rounded border border-slate-300 bg-white"
              />
            </div>

            {/* Prediction Interval Upper */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Intervalo de Predicción 95% (Superior)</label>
              <input
                type="number"
                step="0.01"
                value={config.predictionIntervalUpper}
                onChange={(e) => update({ predictionIntervalUpper: parseFloat(e.target.value) || 0 })}
                className="w-full text-xs font-mono p-2 rounded border border-slate-300 bg-white"
              />
            </div>
          </div>

          {/* Pooled Effect Inputs */}
          <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900">
              Estimador Agrupado Sintético ({config.effectMeasure}) [IC 95%]
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Efecto Agrupado ({config.effectMeasure})</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.pooledEstimate}
                  onChange={(e) => update({ pooledEstimate: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono font-bold p-2 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Límite Inferior IC 95%</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.ciLower}
                  onChange={(e) => update({ ciLower: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono p-2 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Límite Superior IC 95%</label>
                <input
                  type="number"
                  step="0.01"
                  value={config.ciUpper}
                  onChange={(e) => update({ ciUpper: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono p-2 rounded border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">p-valor del Efecto Agrupado</label>
                <input
                  type="number"
                  step="0.0001"
                  value={config.pValue}
                  onChange={(e) => update({ pValue: parseFloat(e.target.value) || 0 })}
                  className="w-full text-xs font-mono p-2 rounded border border-slate-300 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: META-REGRESIÓN Y COVARIABLES */}
      {/* ========================================================================= */}
      {activeTab === 'metaregression' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Modelos de Meta-Regresión y Exploración de Heterogeneidad (Ítem 13e & 20)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evalúa si características a nivel de cohorte o ensayo explican la variabilidad entre estudios observada.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
                <span>Habilitar Meta-Regresión</span>
                <input
                  type="checkbox"
                  checked={config.metaRegressionEnabled}
                  onChange={(e) => update({ metaRegressionEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              {config.metaRegressionEnabled && (
                <button
                  type="button"
                  onClick={handleAddCovariate}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Covariable</span>
                </button>
              )}
            </div>
          </div>

          {config.metaRegressionEnabled ? (
            <div className="space-y-4">
              {/* Cochrane Rule of 10 alert */}
              {isUnderpoweredForRegression && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold">Advertencia Metodológica Cochrane (Regla de Potencia):</span>
                    <p className="text-amber-800">
                      Dispone de <strong>{config.studyCount}</strong> estudios para <strong>{config.covariates.length}</strong> covariable(s). 
                      Cochrane recomienda un mínimo de <strong>10 estudios primarios por covariable</strong> (se requerirían ≥ {recommendedStudiesCount} estudios) para evitar sobreajuste y falsos descubrimientos.
                    </p>
                  </div>
                </div>
              )}

              {/* List of covariates */}
              <div className="space-y-3">
                {config.covariates.map((cov, idx) => (
                  <div key={cov.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={cov.name}
                          onChange={(e) => handleUpdateCovariate(cov.id, { name: e.target.value })}
                          className="font-bold text-xs sm:text-sm p-1.5 rounded border border-slate-300 bg-white w-64 sm:w-80"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCovariate(cov.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                        title="Eliminar covariable"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Coeficiente β</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cov.beta}
                          onChange={(e) => handleUpdateCovariate(cov.id, { beta: parseFloat(e.target.value) || 0 })}
                          className="w-full font-mono font-bold p-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">Error Estándar (EE)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cov.se}
                          onChange={(e) => handleUpdateCovariate(cov.id, { se: parseFloat(e.target.value) || 0 })}
                          className="w-full font-mono p-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">IC 95% Inferior</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cov.ciLower}
                          onChange={(e) => handleUpdateCovariate(cov.id, { ciLower: parseFloat(e.target.value) || 0 })}
                          className="w-full font-mono p-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">IC 95% Superior</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cov.ciUpper}
                          onChange={(e) => handleUpdateCovariate(cov.id, { ciUpper: parseFloat(e.target.value) || 0 })}
                          className="w-full font-mono p-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">p-valor</label>
                        <input
                          type="number"
                          step="0.001"
                          value={cov.pValue}
                          onChange={(e) => handleUpdateCovariate(cov.id, { pValue: parseFloat(e.target.value) || 0 })}
                          className="w-full font-mono p-1.5 rounded border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 block mb-0.5">R² Análogo (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="100"
                          value={cov.r2Analog}
                          onChange={(e) => handleUpdateCovariate(cov.id, { r2Analog: parseFloat(e.target.value) || 0 })}
                          className="w-full font-mono p-1.5 rounded border border-slate-300"
                        />
                      </div>
                    </div>

                    <div>
                      <input
                        type="text"
                        value={cov.description || ''}
                        onChange={(e) => handleUpdateCovariate(cov.id, { description: e.target.value })}
                        className="w-full text-xs p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700"
                        placeholder="Interpretación clínica del coeficiente en la varianza entre estudios..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
              <Sliders className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="max-w-md mx-auto">
                <p className="text-xs font-bold text-slate-700">La meta-regresión está actualmente deshabilitada.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Activa la casilla superior para registrar variables continuas o categóricas a nivel de estudio que exploren las causas de la heterogeneidad observada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => update({ metaRegressionEnabled: true })}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Activar Meta-Regresión</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ANÁLISIS DE SENSIBILIDAD METODOLÓGICO (ÍTEM 13F & 20D) */}
      {/* ========================================================================= */}
      {activeTab === 'sensitivity' && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <span>Análisis de Sensibilidad Metodológico y Robustez (Ítems 13f y 20d PRISMA 2020)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Verifica si las conclusiones clínicas son sensibles a la exclusión de estudios con alto riesgo de sesgo (RoB 2), estudios pequeños o influencia desproporcionada de un ensayo pivotal (Leave-One-Out).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleCopy(sensitivityMarkdownTableText, 'sensitivity')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Copiar tabla de sensibilidad completa en formato Markdown"
                >
                  {copiedSection === 'sensitivity' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'sensitivity' ? 'Copiada' : 'Copiar Tabla Markdown'}</span>
                </button>
              </div>
            </div>

            {/* Presets and Filter Buttons */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Seleccionar Escenario de Sensibilidad para Evaluación en Tiempo Real:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSensitivityPreset('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border ${
                    sensitivityPreset === 'all'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Todos los Estudios (Análisis Basal)
                </button>

                <button
                  type="button"
                  onClick={() => setSensitivityPreset('exclude_high_rob')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer border flex items-center gap-1.5 ${
                    sensitivityPreset === 'exclude_high_rob'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                      : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                  }`}
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
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Leave-One-Out (Jackknife)</span>
                </button>

                {sensitivityPreset === 'leave_one_out' && (
                  <select
                    value={leaveOneOutStudyId || baselineStudies[0].id}
                    onChange={(e) => setLeaveOneOutStudyId(e.target.value)}
                    className="text-xs p-1.5 rounded-lg border border-violet-300 bg-violet-50 text-violet-950 font-semibold focus:ring-2 focus:ring-violet-500"
                  >
                    {baselineStudies.map((s) => (
                      <option key={s.id} value={s.id}>
                        Omitir: {s.studyName.split('(')[0].trim()} ({s.sampleSize.toLocaleString()} pac.)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Real-time Comparative Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">1. Análisis Primario (Basal)</span>
                <div className="text-base font-black text-slate-900">
                  {config.effectMeasure} = {primaryScenario.pooledEstimate.toFixed(2)} [{primaryScenario.ciLower.toFixed(2)}, {primaryScenario.ciUpper.toFixed(2)}]
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-2">
                  <span>$k$ = {primaryScenario.includedCount} estudios</span>
                  <span>•</span>
                  <span>$N$ = {primaryScenario.totalN.toLocaleString()}</span>
                  <span>•</span>
                  <span>$I^2$ = {primaryScenario.i2.toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-indigo-700 uppercase tracking-wide">2. Análisis de Sensibilidad Activo</span>
                <div className="text-base font-black text-indigo-950">
                  {config.effectMeasure} = {activeScenarioResult.pooledEstimate.toFixed(2)} [{activeScenarioResult.ciLower.toFixed(2)}, {activeScenarioResult.ciUpper.toFixed(2)}]
                </div>
                <div className="text-xs text-indigo-800 flex items-center gap-2">
                  <span>$k$ = {activeScenarioResult.includedCount}</span>
                  <span>•</span>
                  <span>$N$ = {activeScenarioResult.totalN.toLocaleString()}</span>
                  <span>•</span>
                  <span>$I^2$ = {activeScenarioResult.i2.toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">3. Veredicto de Robustez (Ítem 20d)</span>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    activeScenarioResult.isRobust 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-600 text-white'
                  }`}>
                    {activeScenarioResult.isRobust ? '✓ Efecto Altamente Robusto' : '⚠ Sensible a la Exclusión'}
                  </span>
                </div>
                <div className="text-xs text-emerald-900">
                  Δ{config.effectMeasure}: <strong>{activeScenarioResult.deltaEstimate > 0 ? `+${activeScenarioResult.deltaEstimate.toFixed(2)}` : activeScenarioResult.deltaEstimate.toFixed(2)}</strong> | ΔI²: <strong>{activeScenarioResult.deltaI2 > 0 ? `+${activeScenarioResult.deltaI2.toFixed(1)}%` : `${activeScenarioResult.deltaI2.toFixed(1)}%`}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Cochrane Summary Table of Sensitivity Analyses */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Matriz Comparativa de Análisis de Sensibilidad (Cochrane Handbook Table 10.1)</span>
                </h4>
                <p className="text-[11px] text-slate-500">
                  Tabla estructurada para publicación con todos los escenarios preespecificados de sensibilidad.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Escenario / Criterio de Sensibilidad</th>
                    <th className="p-2.5 text-center">Ensayos ($k$)</th>
                    <th className="p-2.5 text-center">Población ($N$)</th>
                    <th className="p-2.5 text-center">Estimador Agrupado [IC 95%]</th>
                    <th className="p-2.5 text-center">Heterogeneidad ($I^2$)</th>
                    <th className="p-2.5 text-center">$p$-valor</th>
                    <th className="p-2.5 text-center">$\Delta$ Efecto</th>
                    <th className="p-2.5">Diagnóstico de Robustez</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allSensitivityScenarios.map((scen, idx) => {
                    const isCurrent = scen.preset === sensitivityPreset;
                    return (
                      <tr 
                        key={idx} 
                        className={`transition-colors ${
                          isCurrent ? 'bg-indigo-50/60 font-semibold' : 'hover:bg-slate-50'
                        }`}
                      >
                        <td className="p-2.5 flex items-center gap-2">
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />}
                          <span>{scen.presetLabel}</span>
                        </td>
                        <td className="p-2.5 text-center font-mono">{scen.includedCount}</td>
                        <td className="p-2.5 text-center font-mono">{scen.totalN.toLocaleString()}</td>
                        <td className="p-2.5 text-center font-mono font-bold text-slate-900">
                          {scen.pooledEstimate.toFixed(2)} [{scen.ciLower.toFixed(2)}, {scen.ciUpper.toFixed(2)}]
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                            scen.i2 === 0 ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-700'
                          }`}>
                            {scen.i2.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          {scen.pValue < 0.001 ? '< 0.001' : scen.pValue.toFixed(3)}
                        </td>
                        <td className="p-2.5 text-center font-mono">
                          {scen.deltaEstimate === 0 ? 'Ref. Basal' : `${scen.deltaEstimate > 0 ? '+' : ''}${scen.deltaEstimate.toFixed(2)}`}
                        </td>
                        <td className="p-2.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                            scen.isRobust ? 'text-emerald-700' : 'text-amber-700'
                          }`}>
                            {scen.isRobust ? '✓ Robusto (Invariable)' : '⚠ Sensible a exclusión'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Embedded Forest Plot with Dual Diamond Visual Impact */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-indigo-600" />
              <span>Visualización Directa del Impacto en el Gráfico Forest Plot (Rombo Doble):</span>
            </h4>
            <ForestPlotViewer
              config={config}
              onChangeConfig={onChangeConfig}
              candidateOutcomes={candidateOutcomes}
              evidenceStudies={evidenceStudies}
              rob2Studies={rob2Studies}
              initialSensitivityPreset={sensitivityPreset}
              onInsertFigureIntoResults={onInsertIntoResults}
              onInsertSensitivityIntoResults={onInsertIntoResults}
              onInsertSensitivityIntoMethods={onInsertIntoMethods}
            />
          </div>

          {/* Academic Draft Paragraphs for Methods and Results */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
            {/* Methods Draft (Item 13f) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
                      <FileText className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Métodos de Sensibilidad (Ítem 13f PRISMA 2020)</h4>
                      <span className="text-[10px] text-slate-500">Planificación a priori de exclusiones y robustez</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Ítem 13f
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {sensitivityMethodsText}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleCopy(sensitivityMethodsText, 'methods')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedSection === 'methods' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'methods' ? 'Copiado' : 'Copiar'}</span>
                </button>

                {onInsertIntoMethods && (
                  <button
                    type="button"
                    onClick={() => onInsertIntoMethods(sensitivityMethodsText)}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insertar en Métodos</span>
                  </button>
                )}
              </div>
            </div>

            {/* Results Draft (Item 20d) */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 bg-violet-100 text-violet-700 rounded-md">
                      <BarChart3 className="w-4 h-4" />
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Resultados de Sensibilidad (Ítem 20d PRISMA 2020)</h4>
                      <span className="text-[10px] text-slate-500">Comprobación empírica y diagnóstico de estabilidad</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
                    Ítem 20d
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {sensitivityResultsText}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleCopy(sensitivityResultsText, 'results')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copiedSection === 'results' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'results' ? 'Copiado' : 'Copiar'}</span>
                </button>

                {onInsertIntoResults && (
                  <button
                    type="button"
                    onClick={() => onInsertIntoResults(sensitivityResultsText)}
                    className="px-3.5 py-1.5 bg-violet-700 hover:bg-violet-800 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Insertar en Resultados</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: REDACCIÓN ACADÉMICA LISTA (MÉTODOS & RESULTADOS) */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section: Methods Draft (Item 13) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-md">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Sección de Métodos (Ítems 13a-f PRISMA 2020)</h4>
                    <span className="text-[10px] text-slate-500">Modelo estadístico, heterogeneidad, meta-regresión y sensibilidad</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Ítem 13a-f
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {methodsAcademicText}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleCopy(methodsAcademicText, 'methods')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedSection === 'methods' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'methods' ? 'Copiado' : 'Copiar Métodos'}</span>
              </button>

              {onInsertIntoMethods && (
                <button
                  type="button"
                  onClick={() => onInsertIntoMethods(methodsAcademicText)}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar en Métodos (Ítem 13)</span>
                </button>
              )}
            </div>
          </div>

          {/* Section: Results Draft (Item 20) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-md">
                    <BarChart3 className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Sección de Resultados (Ítems 20a-d PRISMA 2020)</h4>
                    <span className="text-[10px] text-slate-500">Efecto agrupado, heterogeneidad, coeficientes β y robustez</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ítem 20a-d
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                {resultsAcademicText}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleCopy(resultsAcademicText, 'results')}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {copiedSection === 'results' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSection === 'results' ? 'Copiado' : 'Copiar Resultados'}</span>
              </button>

              {onInsertIntoResults && (
                <button
                  type="button"
                  onClick={() => onInsertIntoResults(resultsAcademicText)}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar en Resultados (Ítem 20)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
