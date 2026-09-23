import { Rob2StudyAssessment } from '../types';

export const INITIAL_ROB2_STUDIES: Rob2StudyAssessment[] = [
  {
    id: 'rob-1',
    studyName: 'DAPA-HF (McMurray et al.)',
    year: 2019,
    sampleSize: 4744,
    d1Randomization: 'low',
    d2Deviations: 'low',
    d3MissingData: 'low',
    d4Measurement: 'low',
    d5ReportedResult: 'low',
    overall: 'low',
    notes: 'Secuencia generada por computadora, ocultamiento centralizado, enmascaramiento doble ciego estricto con pérdidas de seguimiento < 0.2% y protocolo registrado en ClinicalTrials.gov (NCT03036124).',
  },
  {
    id: 'rob-2',
    studyName: 'EMPEROR-Reduced (Packer et al.)',
    year: 2020,
    sampleSize: 3730,
    d1Randomization: 'low',
    d2Deviations: 'low',
    d3MissingData: 'low',
    d4Measurement: 'low',
    d5ReportedResult: 'low',
    overall: 'low',
    notes: 'Diseño multinacional riguroso con comité de adjudicación de eventos ciego, datos basales homogéneos y análisis por intención de tratar (ITT) preespecificado (NCT03057977).',
  },
  {
    id: 'rob-3',
    studyName: 'SOLOIST-WHF (Bhatt et al.)',
    year: 2021,
    sampleSize: 1222,
    d1Randomization: 'low',
    d2Deviations: 'low',
    d3MissingData: 'low',
    d4Measurement: 'low',
    d5ReportedResult: 'some_concerns',
    overall: 'some_concerns',
    notes: 'Terminación anticipada del ensayo debido a la pérdida de patrocinio durante la pandemia de COVID-19, lo que motivó un cambio en el desenlace primario compuesto antes de levantar el enmascaramiento.',
  },
  {
    id: 'rob-4',
    studyName: 'DEFINE-HF (Nassif et al.)',
    year: 2019,
    sampleSize: 263,
    d1Randomization: 'low',
    d2Deviations: 'low',
    d3MissingData: 'low',
    d4Measurement: 'low',
    d5ReportedResult: 'low',
    overall: 'low',
    notes: 'Ensayo clínico aleatorizado doble ciego con evaluación de péptidos natriuréticos y estado de salud KCCQ a las 12 semanas con adherencia verificada mediante conteo de pastillas.',
  },
  {
    id: 'rob-5',
    studyName: 'EMPERIAL-Reduced (Abraham et al.)',
    year: 2021,
    sampleSize: 312,
    d1Randomization: 'low',
    d2Deviations: 'low',
    d3MissingData: 'low',
    d4Measurement: 'low',
    d5ReportedResult: 'low',
    overall: 'low',
    notes: 'Ensayo aleatorizado que evaluó la capacidad de ejercicio mediante la prueba de marcha de 6 minutos (6MWTD) con adjudicación cegada de eventos cardiovasculares.',
  },
];

export const ROB2_DOMAIN_NAMES = {
  d1: 'D1: Proceso de aleatorización',
  d2: 'D2: Desviaciones de intervenciones previstas',
  d3: 'D3: Datos de resultados faltantes',
  d4: 'D4: Medición del resultado',
  d5: 'D5: Selección del resultado informado',
  overall: 'Juicio Global',
};

export function getRobBadge(judgment: 'low' | 'some_concerns' | 'high') {
  switch (judgment) {
    case 'low':
      return { label: 'Bajo riesgo (+)', symbol: '+', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    case 'some_concerns':
      return { label: 'Algunas preocupaciones (?)', symbol: '?', color: 'bg-amber-100 text-amber-800 border-amber-300' };
    case 'high':
      return { label: 'Alto riesgo (-)', symbol: '-', color: 'bg-rose-100 text-rose-800 border-rose-300' };
  }
}
