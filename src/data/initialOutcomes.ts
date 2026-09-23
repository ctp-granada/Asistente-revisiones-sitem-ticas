import { CandidateOutcome } from '../types';

export const INITIAL_CANDIDATE_OUTCOMES: CandidateOutcome[] = [
  {
    id: 'out-primary-composite',
    name: 'Muerte cardiovascular o primera hospitalización por insuficiencia cardíaca',
    domain: 'Eficacia Clínica Primaria / Eventos Cardiovasculares Mayores (MACE)',
    category: 'primary',
    variableType: 'time_to_event',
    preferredEffectMeasure: 'HR',
    clinicalDefinition: 'Tiempo transcurrido desde la aleatorización hasta la primera ocurrencia de muerte atribuible a causas cardiovasculares o ingreso hospitalario no planificado (> 24 h) por agravamiento de insuficiencia cardíaca.',
    measurementTimepoint: 'Mediana de seguimiento del estudio (rango 9.0 a 24.0 meses)',
    importance: 'critical',
    cosAlignment: 'Alineado con el Core Outcome Set para Insuficiencia Cardíaca (COMET Initiative / COS-HF)',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: '386/2373 (16.3%) vs 502/2371 (21.2%); HR = 0.74 (IC 95%: 0.65 - 0.85); p < 0.001',
        numericEstimate: 0.74,
        ciLower: 0.65,
        ciUpper: 0.85,
        sampleSize: 4744,
        isEligibleForMetaAnalysis: true,
        extractedNotes: 'Variable principal de eficacia analizada bajo intención de tratar (ITT).',
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: '361/1863 (19.4%) vs 462/1867 (24.7%); HR = 0.75 (IC 95%: 0.65 - 0.86); p < 0.001',
        numericEstimate: 0.75,
        ciLower: 0.65,
        ciUpper: 0.86,
        sampleSize: 3730,
        isEligibleForMetaAnalysis: true,
        extractedNotes: 'Definición estandarizada confirmada por comité independiente de adjudicación de eventos.',
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: true,
        reportedText: 'Total de eventos: 245 vs 355; HR = 0.67 (IC 95%: 0.52 - 0.85); p < 0.001',
        numericEstimate: 0.67,
        ciLower: 0.52,
        ciUpper: 0.85,
        sampleSize: 1222,
        isEligibleForMetaAnalysis: true,
        extractedNotes: 'Incluyó visitas urgentes por IC además de hospitalizaciones; análisis de tiempo al primer evento reportado: HR 0.71 (IC 95%: 0.56 - 0.89).',
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: false,
        reportedText: 'No reportado como desenlace primario (estudio de 12 semanas centrado en biomarcadores y calidad de vida)',
        isEligibleForMetaAnalysis: false,
        extractedNotes: 'Estudio de corta duración; los eventos clínicos duros se registraron únicamente como eventos adversos graves.',
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 3,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: '3 ensayos clínicos aleatorizados de gran escala reportan estimadores consistentes (Hazard Ratios) con definiciones operativas armonizadas. Apto para modelo de efectos aleatorios con estimador REML/DerSimonian-Laird y ajuste Knapp-Hartung.',
    },
  },
  {
    id: 'out-all-cause-mortality',
    name: 'Mortalidad por cualquier causa (All-cause mortality)',
    domain: 'Supervivencia Global',
    category: 'primary',
    variableType: 'time_to_event',
    preferredEffectMeasure: 'HR',
    clinicalDefinition: 'Muerte por cualquier causa clínica confirmada durante el período de seguimiento doble ciego.',
    measurementTimepoint: 'Mediana de seguimiento de cada ensayo (hasta 24 meses)',
    importance: 'critical',
    cosAlignment: 'Core Outcome Set universal obligatorio en ensayos cardiovasculares (ICH E9 / COMET)',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: '276/2373 (11.6%) vs 329/2371 (13.9%); HR = 0.83 (IC 95%: 0.71 - 0.97); p = 0.022',
        numericEstimate: 0.83,
        ciLower: 0.71,
        ciUpper: 0.97,
        sampleSize: 4744,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: '249/1863 (13.4%) vs 266/1867 (14.2%); HR = 0.92 (IC 95%: 0.77 - 1.10); p = 0.37',
        numericEstimate: 0.92,
        ciLower: 0.77,
        ciUpper: 1.10,
        sampleSize: 3730,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: true,
        reportedText: '44/608 (7.2%) vs 52/614 (8.5%); HR = 0.82 (IC 95%: 0.54 - 1.23); p = 0.34',
        numericEstimate: 0.82,
        ciLower: 0.54,
        ciUpper: 1.23,
        sampleSize: 1222,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: true,
        reportedText: '1/131 (0.8%) vs 2/132 (1.5%); eventos escasos no aptos para modelo proporcional',
        sampleSize: 263,
        isEligibleForMetaAnalysis: false,
        extractedNotes: 'Número insignificante de eventos debido al corto seguimiento (12 semanas).',
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 3,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: 'Medida sin riesgo de clasificación errónea (mortalidad global). Requiere metaanálisis de efectos aleatorios dado que EMPEROR-Reduced tuvo pacientes con peor función sistólica basal.',
    },
  },
  {
    id: 'out-hosp-total',
    name: 'Total de hospitalizaciones por insuficiencia cardíaca (primeras y recurrentes)',
    domain: 'Carga Asistencial y Morbilidad Cardiovascular',
    category: 'secondary',
    variableType: 'time_to_event',
    preferredEffectMeasure: 'HR',
    clinicalDefinition: 'Conteo total ponderado de admisiones hospitalarias por descompensación de IC utilizando modelos de eventos recurrentes (proporcional de Lin-Wei-Yang-Ying / Andersen-Gill).',
    measurementTimepoint: 'Período completo de tratamiento',
    importance: 'critical',
    cosAlignment: 'Core Outcome Set secundario (HFA / ESC Consensus)',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: '567 eventos vs 742 eventos; RR/HR = 0.75 (IC 95%: 0.65 - 0.88); p < 0.001',
        numericEstimate: 0.75,
        ciLower: 0.65,
        ciUpper: 0.88,
        sampleSize: 4744,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: '388 eventos vs 553 eventos; HR = 0.70 (IC 95%: 0.58 - 0.85); p < 0.001',
        numericEstimate: 0.70,
        ciLower: 0.58,
        ciUpper: 0.85,
        sampleSize: 3730,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: true,
        reportedText: 'Total hospitalizaciones: HR = 0.64 (IC 95%: 0.49 - 0.83); p < 0.001',
        numericEstimate: 0.64,
        ciLower: 0.49,
        ciUpper: 0.83,
        sampleSize: 1222,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: false,
        reportedText: 'No reportado',
        isEligibleForMetaAnalysis: false,
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 3,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: 'Tres ensayos registraron eventos recurrentes mediante modelos de fragilidad o Poisson sobredispersa con efecto consistente favorable a SGLT2i.',
    },
  },
  {
    id: 'out-renal-composite',
    name: 'Deterioro renal progresivo / Desenlace renal compuesto sostenido',
    domain: 'Protección Cardiorrenal',
    category: 'secondary',
    variableType: 'time_to_event',
    preferredEffectMeasure: 'HR',
    clinicalDefinition: 'Compuesto de: descenso sostenido de TFGe ≥ 50%, enfermedad renal terminal (inicio de diálisis crónica, trasplante renal) o muerte atribuible a causas renales.',
    measurementTimepoint: 'Hasta el fin del ensayo clínico',
    importance: 'important',
    cosAlignment: 'KDIGO / Clinical Kidney Outcomes Consortium',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: '28 (1.2%) vs 39 (1.6%); HR = 0.71 (IC 95%: 0.44 - 1.16); p = 0.17',
        numericEstimate: 0.71,
        ciLower: 0.44,
        ciUpper: 1.16,
        sampleSize: 4744,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: '30 (1.6%) vs 58 (3.1%); HR = 0.50 (IC 95%: 0.32 - 0.77); p < 0.001',
        numericEstimate: 0.50,
        ciLower: 0.32,
        ciUpper: 0.77,
        sampleSize: 3730,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: false,
        reportedText: 'No evaluado como tiempo al evento compuesto formal (estudio interrumpido precozmente por pérdida de financiación)',
        isEligibleForMetaAnalysis: false,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: false,
        reportedText: 'No reportado',
        isEligibleForMetaAnalysis: false,
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 2,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: 'DAPA-HF y EMPEROR-Reduced utilizaron definiciones rigurosas compatibles. Permite síntesis preliminar (2 estudios, 8,474 participantes), aunque con baja potencia estadística por número de eventos.',
    },
  },
  {
    id: 'out-kccq-tss',
    name: 'Calidad de vida y síntomas de IC (Puntaje KCCQ Total Symptom Score)',
    domain: 'Desenlaces Reportados por el Paciente (PROMs)',
    category: 'secondary',
    variableType: 'continuous',
    preferredEffectMeasure: 'MD',
    clinicalDefinition: 'Cambio medio ajustado en el cuestionario Kansas City Cardiomyopathy Questionnaire (KCCQ-TSS, escala 0-100 puntos, donde aumentos ≥ 5 puntos representan mejoras clínicamente significativas).',
    measurementTimepoint: 'A las 12 - 32 semanas de tratamiento',
    importance: 'important',
    cosAlignment: 'COMET COS-HF / FDA PROM Validated Guidance',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: 'Diferencia media ajustada a los 8 meses: +2.8 puntos (IC 95%: 1.6 - 4.0; p < 0.001)',
        numericEstimate: 2.8,
        ciLower: 1.6,
        ciUpper: 4.0,
        sampleSize: 4744,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: 'Diferencia media a las 52 semanas: +1.7 puntos (IC 95%: 0.5 - 2.8; p < 0.001)',
        numericEstimate: 1.7,
        ciLower: 0.5,
        ciUpper: 2.8,
        sampleSize: 3730,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: true,
        reportedText: 'Mejora en KCCQ-12 a los 4 meses: +4.1 puntos (IC 95%: 1.3 - 7.0; p = 0.005)',
        numericEstimate: 4.1,
        ciLower: 1.3,
        ciUpper: 7.0,
        sampleSize: 1222,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: true,
        reportedText: 'Proporción con mejora ≥ 5 puntos a 12 semanas: OR 1.73 (IC 95%: 0.98 - 3.05; p = 0.06); cambio medio continuo no tabulado con DE completa',
        sampleSize: 263,
        isEligibleForMetaAnalysis: false,
        extractedNotes: 'Reportó proporciones dicotómicas en lugar de medias continuas y desviaciones estándar completas.',
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 3,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: '3 estudios reportan diferencias de medias ajustadas (MD) con IC 95% en la escala de 100 puntos. Apto para metaanálisis de efectos aleatorios de diferencias de medias (MD).',
    },
  },
  {
    id: 'out-safety-hypoglycemia',
    name: 'Seguridad: Episodios de hipoglucemia grave',
    domain: 'Seguridad y Tolerabilidad',
    category: 'safety',
    variableType: 'dichotomous',
    preferredEffectMeasure: 'RR',
    clinicalDefinition: 'Episodio que requirió la asistencia activa de un tercero para la administración de hidratos de carbono, glucagón o rescate médico.',
    measurementTimepoint: 'Durante todo el período de exposición activa',
    importance: 'important',
    cosAlignment: 'ADA / EASD Safety Standard Definitions',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: '4/2368 (0.2%) vs 4/2368 (0.2%); RR = 1.00 (IC 95%: 0.25 - 3.99)',
        numericEstimate: 1.00,
        ciLower: 0.25,
        ciUpper: 3.99,
        sampleSize: 4736,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: '6/1863 (0.3%) vs 7/1863 (0.4%); RR = 0.86 (IC 95%: 0.29 - 2.53)',
        numericEstimate: 0.86,
        ciLower: 0.29,
        ciUpper: 2.53,
        sampleSize: 3726,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: true,
        reportedText: '9/605 (1.5%) vs 4/611 (0.7%); RR = 2.27 (IC 95%: 0.70 - 7.33)',
        numericEstimate: 2.27,
        ciLower: 0.70,
        ciUpper: 7.33,
        sampleSize: 1216,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: true,
        reportedText: '0 eventos en ambos brazos',
        sampleSize: 263,
        isEligibleForMetaAnalysis: false,
        extractedNotes: 'Cero eventos (requeriría corrección de continuidad o método de Peto).',
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 3,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: 'Eventos infrecuentes (< 1%). Se recomienda metaanálisis con corrección de continuidad o modelo de Mantel-Haenszel / Peto odds ratio para eventos raros.',
    },
  },
  {
    id: 'out-safety-dka',
    name: 'Seguridad: Cetoacidosis diabética (CAD)',
    domain: 'Seguridad y Tolerabilidad',
    category: 'safety',
    variableType: 'dichotomous',
    preferredEffectMeasure: 'RR',
    clinicalDefinition: 'Acidosis metabólica documentada con hipercetonemia/cetonuria atribuible o no a euglucemia.',
    measurementTimepoint: 'Durante todo el tratamiento',
    importance: 'important',
    cosAlignment: 'Criterio de farmacovigilancia regulatoria EMA/FDA para inhibidores SGLT2',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: '3/2368 (0.1%) vs 0/2368 (0.0%); RR no calculable directamente sin corrección de continuidad',
        numericEstimate: 3.0,
        sampleSize: 4736,
        isEligibleForMetaAnalysis: true,
        extractedNotes: 'Todos los casos ocurrieron en pacientes con DM2 de base.',
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: '0/1863 (0.0%) vs 0/1863 (0.0%)',
        sampleSize: 3726,
        isEligibleForMetaAnalysis: false,
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: true,
        reportedText: '2/605 (0.3%) vs 4/611 (0.7%); RR = 0.51 (IC 95%: 0.09 - 2.76)',
        numericEstimate: 0.51,
        ciLower: 0.09,
        ciUpper: 2.76,
        sampleSize: 1216,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: true,
        reportedText: '0 eventos registrados',
        sampleSize: 263,
        isEligibleForMetaAnalysis: false,
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 2,
      canMetaAnalyze: false,
      recommendedSynthesis: 'narrative_synthesis',
      methodologicalJustification: 'Incidencia extremadamente baja (frecuencia < 0.2%). La síntesis narrativa descriptiva es metodológicamente preferible sobre modelos cuantitativos inestables.',
    },
  },
  {
    id: 'out-subgroup-dm',
    name: 'Subgrupo: Eficacia en pacientes con Diabetes tipo 2 frente a Sin Diabetes',
    domain: 'Análisis de Subgrupos Preespecificados',
    category: 'subgroup',
    variableType: 'time_to_event',
    preferredEffectMeasure: 'HR',
    clinicalDefinition: 'Efecto sobre el desenlace primario compuesto estratificado por diagnóstico basal de Diabetes Mellitus tipo 2 (valor de p de interacción estadística).',
    measurementTimepoint: 'Fin del estudio',
    importance: 'critical',
    cosAlignment: 'Consenso metodológico Cochrane para análisis de subgrupos (Handbook Sec. 10.11)',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: 'Con DM: HR = 0.75 (0.63 - 0.90); Sin DM: HR = 0.73 (0.60 - 0.88); p de interacción = 0.80',
        numericEstimate: 0.80,
        sampleSize: 4744,
        isEligibleForMetaAnalysis: true,
        extractedNotes: 'Ausencia formal de heterogeneidad de tratamiento según estado diabético.',
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: 'Con DM: HR = 0.72 (0.60 - 0.87); Sin DM: HR = 0.78 (0.64 - 0.97); p de interacción = 0.57',
        numericEstimate: 0.57,
        sampleSize: 3730,
        isEligibleForMetaAnalysis: true,
        extractedNotes: 'Beneficio homogéneo e independiente de la hemoglobina glicosilada basal.',
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: false,
        reportedText: 'No aplica (criterio de inclusión exigía 100% de pacientes con diabetes tipo 2)',
        isEligibleForMetaAnalysis: false,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: true,
        reportedText: 'Mejora en KCCQ observada tanto en pacientes diabéticos (OR 1.70) como no diabéticos (OR 1.78); p-interacción = 0.91',
        sampleSize: 263,
        isEligibleForMetaAnalysis: false,
        extractedNotes: 'Métrica continua/OR en muestra pequeña.',
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 2,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: 'DAPA-HF y EMPEROR-Reduced proporcionan razones de hazard ratios (RHR) y pruebas de interacción coincidentes demostrando efecto de clase independiente de diabetes.',
    },
  },
  {
    id: 'out-subgroup-egfr',
    name: 'Subgrupo: Eficacia según Tasa de Filtrado Glomerular Basal (TFGe < 60 vs ≥ 60 mL/min)',
    domain: 'Análisis de Subgrupos Preespecificados',
    category: 'subgroup',
    variableType: 'time_to_event',
    preferredEffectMeasure: 'HR',
    clinicalDefinition: 'Efecto terapéutico comparativo en pacientes con insuficiencia renal crónica coexistente (estadio 3-4, TFGe < 60) vs función renal conservada (TFGe ≥ 60 mL/min/1.73m²).',
    measurementTimepoint: 'Fin del estudio',
    importance: 'important',
    cosAlignment: 'Criterio KDIGO / Cochrane Kidney and Transplant',
    studiesMapping: [
      {
        studyId: 'ev-1',
        studyName: 'McMurray et al., 2019 (DAPA-HF)',
        reported: true,
        reportedText: 'TFGe < 60: HR = 0.72 (0.60 - 0.86); TFGe ≥ 60: HR = 0.76 (0.63 - 0.92); p de interacción = 0.69',
        sampleSize: 4744,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-2',
        studyName: 'Packer et al., 2020 (EMPEROR-Reduced)',
        reported: true,
        reportedText: 'TFGe < 60: HR = 0.69 (0.56 - 0.85); TFGe ≥ 60: HR = 0.82 (0.68 - 0.99); p de interacción = 0.21',
        sampleSize: 3730,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-3',
        studyName: 'Bhatt et al., 2021 (SOLOIST-WHF)',
        reported: true,
        reportedText: 'Efecto consistente favorable en ambos estratos de filtrado; p de interacción = 0.38',
        sampleSize: 1222,
        isEligibleForMetaAnalysis: true,
      },
      {
        studyId: 'ev-4',
        studyName: 'Nassif et al., 2019 (DEFINE-HF)',
        reported: false,
        reportedText: 'No reportado por estrato de TFGe',
        isEligibleForMetaAnalysis: false,
      },
    ],
    synthesisEligibility: {
      eligibleStudiesCount: 3,
      canMetaAnalyze: true,
      recommendedSynthesis: 'meta_analysis_random',
      methodologicalJustification: '3 ensayos evaluaron la interacción por estrato de función renal. Todos confirman consistencia del beneficio sin atenuación en nefropatía preexistente.',
    },
  },
];

/**
 * Genera la tabla oficial de Armonización y Elegibilidad de Outcomes en Markdown
 * para PRISMA 2020 (Ítems 10b, 13a, 13b y 17)
 */
export function generateOutcomesHarmonizationMarkdown(outcomes: CandidateOutcome[]): string {
  let md = `### Especificación y Armonización de Variables y Desenlaces Clínicos (Ítem 10b y 13a PRISMA 2020)\n\n`;
  md += `| Desenlace / Variable Clínica | Dominio / Categoría | Tipo de Variable y Métrica | Momento de Medición | Estudios que lo Reportan | Elegibilidad para Síntesis Cuantitativa (Metaanálisis) |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  outcomes.forEach((o) => {
    const reportedStudies = o.studiesMapping
      .filter((s) => s.reported)
      .map((s) => s.studyName.split('(')[0].trim())
      .join(', ') || 'Ninguno';

    const categoryLabel = 
      o.category === 'primary' ? '★ Primario' :
      o.category === 'secondary' ? 'Secundario' :
      o.category === 'safety' ? '⚠ Seguridad' : 'Subgrupo / Covariable';

    const typeLabel = `${o.variableType === 'time_to_event' ? 'Tiempo al evento' : o.variableType === 'dichotomous' ? 'Dicotómica' : 'Continua'} (${o.preferredEffectMeasure})`;
    const eligibilityLabel = o.synthesisEligibility.canMetaAnalyze 
      ? `**Apto para Metaanálisis** (${o.synthesisEligibility.eligibleStudiesCount} estudios)`
      : `Síntesis Narrativa únicamente`;

    md += `| **${o.name}**<br><span style="font-size: 0.85em; color: #475569;">*Definición:* ${o.clinicalDefinition}</span> | ${categoryLabel} | ${typeLabel} | ${o.measurementTimepoint} | ${reportedStudies} | ${eligibilityLabel}<br><span style="font-size: 0.8em; color: #64748b;">${o.synthesisEligibility.methodologicalJustification}</span> |\n`;
  });

  md += `\n*Nota.* Armonización realizada según la iniciativa COMET (Core Outcome Measures in Effectiveness Trials) y las recomendaciones PRISMA 2020 (Ítems 10b y 13a). Se excluyen de síntesis cuantitativa agregada aquellos desenlaces con discrepancias métricas irreconciliables o reporte escaso (< 2 estudios comparables).\n`;

  return md;
}

/**
 * Genera el texto metodológico formal para la sección de Métodos (Ítems 10b y 13a)
 */
export function generateOutcomesMethodsText(outcomes: CandidateOutcome[]): string {
  const primaryOutcomes = outcomes.filter((o) => o.category === 'primary');
  const secondaryOutcomes = outcomes.filter((o) => o.category === 'secondary');
  const safetyOutcomes = outcomes.filter((o) => o.category === 'safety');
  const subgroupOutcomes = outcomes.filter((o) => o.category === 'subgroup');

  return `### Especificación de Variables y Criterios de Elegibilidad para la Síntesis (Ítems 10b y 13a PRISMA 2020)

**Definición y Priorización de Desenlaces:**
Los desenlaces clínicos evaluados se estructuraron jerárquicamente conforme a su relevancia clínica y a las directrices de la iniciativa COMET (Core Outcome Measures in Effectiveness Trials):
- **Desenlaces Primarios de Eficacia:** ${primaryOutcomes.map((o) => `${o.name} (definido como ${o.clinicalDefinition}; medido preferentemente mediante Hazard Ratio [HR] de tiempo transcurrido hasta el evento)`).join('; ')}.
- **Desenlaces Secundarios:** ${secondaryOutcomes.map((o) => `${o.name} (${o.clinicalDefinition})`).join('; ')}.
- **Desenlaces de Seguridad y Tolerabilidad:** ${safetyOutcomes.map((o) => `${o.name} (${o.clinicalDefinition})`).join('; ')}.
- **Variables Moduladoras y de Subgrupo:** ${subgroupOutcomes.map((o) => `${o.name} (${o.clinicalDefinition})`).join('; ')}.

**Criterios de Agrupamiento y Elegibilidad para Metaanálisis (Ítem 13a):**
Para decidir la viabilidad de la síntesis cuantitativa de cada desenlace, se aplicaron los siguientes criterios preespecificados:
1. Existencia de al menos dos ensayos clínicos independientes que reportaran la misma variable operativa o métricas matemáticamente convertibles (ej. Hazard Ratios ajustados con sus intervalos de confianza del 95%).
2. Homogeneidad clínica y conceptual en la intervención evaluada (inhibidores SGLT2 frente a placebo administrados sobre tratamiento neurohormonal estándar).
3. En presencia de desenlaces con eventos infrecuentes (< 1% o presencia de ceros en algún brazo, como cetoacidosis diabética o hipoglucemias severas), se preespecificó el uso de modelos de Mantel-Haenszel con corrección de continuidad o el análisis de Peto Odds Ratio, recurriendo a la síntesis narrativa cuando el número total de eventos imposibilitara una inferencia asintótica válida.`;
}

/**
 * Genera CSV delimitado por comas de los desenlaces candidatos
 */
export function generateOutcomesCsv(outcomes: CandidateOutcome[]): string {
  const headers = [
    'ID',
    'Nombre del Desenlace',
    'Dominio',
    'Categoría',
    'Tipo de Variable',
    'Medida de Efecto Preferida',
    'Definición Clínica Operativa',
    'Momento de Medición',
    'Importancia GRADE',
    'Estudios que lo Reportan',
    'Apto para Metaanálisis',
    'Número de Estudios Aptos',
    'Justificación Metodológica',
  ];

  const escapeCsv = (val: string | number | boolean | undefined) => {
    if (val === undefined || val === null) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = outcomes.map((o) => {
    const reportedStudies = o.studiesMapping
      .filter((s) => s.reported)
      .map((s) => s.studyName)
      .join('; ');

    return [
      escapeCsv(o.id),
      escapeCsv(o.name),
      escapeCsv(o.domain),
      escapeCsv(o.category),
      escapeCsv(o.variableType),
      escapeCsv(o.preferredEffectMeasure),
      escapeCsv(o.clinicalDefinition),
      escapeCsv(o.measurementTimepoint),
      escapeCsv(o.importance),
      escapeCsv(reportedStudies),
      escapeCsv(o.synthesisEligibility.canMetaAnalyze ? 'SÍ' : 'NO'),
      escapeCsv(o.synthesisEligibility.eligibleStudiesCount),
      escapeCsv(o.synthesisEligibility.methodologicalJustification),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
