import { EvidenceStudyRecord } from '../types';

export const INITIAL_EVIDENCE_STUDIES: EvidenceStudyRecord[] = [
  {
    id: 'ev-1',
    fileName: 'McMurray_2019_NEJM_DAPA-HF.pdf',
    authorAndYear: 'McMurray et al., 2019',
    studyDesignAndSampleSize: 'Ensayo clínico aleatorizado, doble ciego, controlado con placebo, de grupos paralelos y multicéntrico (N = 4,744)',
    population: 'Inclusión: Adultos ≥ 18 años con IC sintomática en clase NYHA II-IV, fracción de eyección ventricular izquierda (FEVI) ≤ 40%, péptido natriurético NT-proBNP ≥ 600 pg/ml (≥ 900 pg/ml con fibrilación auricular) y tratamiento médico óptimo estándar. Exclusión: Tasa de filtrado glomerular estimada (TFGe) < 30 ml/min/1.73m², presión arterial sistólica < 95 mmHg o diabetes mellitus tipo 1.',
    interventionComparator: 'Dapagliflozina oral 10 mg una vez al día frente a Placebo idéntico una vez al día, ambos adicionados a la terapia estándar (IECA/ARA-II/ARNI, betabloqueadores y antagonistas de receptores de mineralocorticoides).',
    mainResults: 'Desenlace primario compuesto (empeoramiento de la insuficiencia cardíaca o muerte por causas cardiovasculares): 386 de 2,373 (16.3%) en dapagliflozina vs. 502 de 2,371 (21.2%) en placebo (HR = 0.74; IC 95%: 0.65 - 0.85; p < 0.001). Muerte cardiovascular: HR = 0.82 (IC 95%: 0.69 - 0.98; p = 0.029). Hospitalización por IC: HR = 0.70 (IC 95%: 0.59 - 0.83; p < 0.001). Mortalidad por cualquier causa: HR = 0.83 (IC 95%: 0.71 - 0.97).',
    authorConclusion: 'Entre los pacientes con insuficiencia cardíaca y fracción de eyección reducida, el riesgo de empeoramiento de la IC o muerte por causas cardiovasculares fue significativamente menor entre los que recibieron dapagliflozina en comparación con placebo, independientemente de la presencia o ausencia de diabetes mellitus tipo 2.',
    isExtractedWithAi: true,
    extractedAt: '2026-09-20T10:00:00Z',
  },
  {
    id: 'ev-2',
    fileName: 'Packer_2020_NEJM_EMPEROR-Reduced.pdf',
    authorAndYear: 'Packer et al., 2020',
    studyDesignAndSampleSize: 'Ensayo clínico aleatorizado, doble ciego, controlado con placebo, multinacional en 520 centros (N = 3,730)',
    population: 'Inclusión: Pacientes adultos con insuficiencia cardíaca crónica clase NYHA II-IV y FEVI ≤ 40% que recibían tratamiento médico óptimo recomendado por guías clínicas, con elevación de NT-proBNP ajustada a FEVI. Exclusión: TFGe < 20 ml/min/1.73m², trasplante cardíaco programado, dispositivo de asistencia ventricular o estenosis valvular hemodinámicamente significativa.',
    interventionComparator: 'Empagliflozina oral 10 mg una vez al día frente a Placebo correspondiente una vez al día, administrado sobre la terapia médica óptima basal.',
    mainResults: 'Desenlace primario compuesto (muerte cardiovascular u hospitalización por insuficiencia cardíaca): 361 de 1,863 (19.4%) en empagliflozina vs. 462 de 1,867 (24.7%) en placebo (HR = 0.75; IC 95%: 0.65 - 0.86; p < 0.001). Total de hospitalizaciones por IC: HR = 0.70 (IC 95%: 0.58 - 0.85; p < 0.001). Declinación anual de la TFGe: -0.55 vs. -2.28 ml/min/1.73m² (diferencia 1.73 ml/min/1.73m²; IC 95%: 1.10 - 2.37; p < 0.001). Muerte cardiovascular aislada: HR = 0.92 (IC 95%: 0.75 - 1.12; p = 0.39).',
    authorConclusion: 'En pacientes con insuficiencia cardíaca y fracción de eyección reducida, empagliflozina redujo el riesgo combinado de muerte cardiovascular u hospitalización por IC y ralentizó el deterioro de la función renal, con independencia de la presencia o ausencia de diabetes.',
    isExtractedWithAi: true,
    extractedAt: '2026-09-20T10:05:00Z',
  },
  {
    id: 'ev-3',
    fileName: 'Bhatt_2021_NEJM_SOLOIST-WHF.pdf',
    authorAndYear: 'Bhatt et al., 2021',
    studyDesignAndSampleSize: 'Ensayo clínico aleatorizado, doble ciego, controlado con placebo, de grupos paralelos (N = 1,222)',
    population: 'Inclusión: Pacientes adultos con diabetes tipo 2 hospitalizados recientemente por descompensación aguda de insuficiencia cardíaca (con fracción de eyección reducida o preservada), estabilizados antes del alta o dentro de los 3 días posteriores. Exclusión: Hipotensión arterial severa (PAS < 100 mmHg), TFGe < 30 ml/min/1.73m² o evento coronario agudo en los últimos 30 días.',
    interventionComparator: 'Sotagliflozina (inhibidor dual SGLT1 y SGLT2) oral 200 mg una vez al día (con ajuste a 400 mg según tolerancia) frente a Placebo correspondiente una vez al día.',
    mainResults: 'Desenlace primario compuesto (número total de muertes por causas cardiovasculares, hospitalizaciones y visitas urgentes por IC): 245 eventos en sotagliflozina vs. 355 eventos en placebo (HR = 0.67; IC 95%: 0.52 - 0.85; p < 0.001). Tasa por 100 pacientes-año: 51.0 vs. 76.3. Muerte cardiovascular aislada: HR = 0.84 (IC 95%: 0.58 - 1.22; p = 0.36). Diarrea como efecto adverso: 6.1% vs. 3.4% (p = 0.03).',
    authorConclusion: 'En pacientes con diabetes tipo 2 hospitalizados por empeoramiento agudo de insuficiencia cardíaca, la terapia con sotagliflozina iniciada antes o inmediatamente después del alta redujo significativamente el total de muertes cardiovasculares y eventos por IC.',
    isExtractedWithAi: true,
    extractedAt: '2026-09-20T10:10:00Z',
  },
  {
    id: 'ev-4',
    fileName: 'Nassif_2019_Circulation_DEFINE-HF.pdf',
    authorAndYear: 'Nassif et al., 2019',
    studyDesignAndSampleSize: 'Ensayo clínico aleatorizado, doble ciego, controlado con placebo, multicéntrico (N = 263)',
    population: 'Inclusión: Adultos con IC-FEr crónica (FEVI ≤ 40%), NYHA II-III, con péptidos natriuréticos elevados o antecedentes de hospitalización por IC en el último año. Exclusión: TFGe < 30 ml/min/1.73m² o presión arterial sistólica < 90 mmHg.',
    interventionComparator: 'Dapagliflozina 10 mg diarios frente a Placebo durante 12 semanas.',
    mainResults: 'Desenlace primario dual: Proporción de pacientes con aumento de ≥ 5 puntos en el puntaje de estado de salud KCCQ (42.9% vs. 32.5%; OR = 1.73; IC 95%: 0.98 - 3.05; p = 0.06). Cambio en NT-proBNP promedio ajustado a 12 semanas: razón de medias geométricas 0.90 (IC 95%: 0.77 - 1.05; p = 0.17). En análisis preespecificado de respuesta clínica KCCQ (aumento ≥ 5 puntos o reducción de NT-proBNP ≥ 20%): 61.5% vs. 50.4% (OR = 1.80; IC 95%: 1.03 - 3.16; p = 0.039).',
    authorConclusion: 'Dapagliflozina mejoró significativamente el estado de salud y los síntomas reportados por los pacientes evaluados por KCCQ en pacientes con IC-FEr crónica, aunque el efecto en la reducción aislada de NT-proBNP no alcanzó significancia estadística formal.',
    isExtractedWithAi: true,
    extractedAt: '2026-09-20T10:15:00Z',
  },
];

/**
 * Genera la tabla oficial de la Matriz de Evidencia en formato Markdown
 * con las 6 columnas exactas exigidas por la directriz PRISMA 2020:
 * 1. Autor y Año
 * 2. Diseño del estudio y tamaño de la muestra ($N$)
 * 3. Población (Criterios de inclusión/exclusión)
 * 4. Intervención / Comparador
 * 5. Resultados principales (Outcomes primarios con sus valores estadísticos: $p$, IC 95%, OR/RR si aplican)
 * 6. Conclusión principal del autor.
 */
export function generateEvidenceMatrixMarkdown(studies: EvidenceStudyRecord[]): string {
  let md = `### Matriz de Evidencia: Extracción Estandarizada de Datos (Ítem 17 PRISMA 2020)\n\n`;
  md += `| Autor y Año | Diseño del estudio y tamaño de la muestra ($N$) | Población (Criterios de inclusión/exclusión) | Intervención / Comparador | Resultados principales (Outcomes primarios con sus valores estadísticos: $p$, IC 95%, OR/RR si aplican) | Conclusión principal del autor |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  studies.forEach((s) => {
    // Escape pipes if any exist within text
    const clean = (txt: string) => (txt || 'No reportado').replace(/\|/g, '\\|').trim();

    md += `| **${clean(s.authorAndYear)}** | ${clean(s.studyDesignAndSampleSize)} | ${clean(s.population)} | ${clean(s.interventionComparator)} | ${clean(s.mainResults)} | ${clean(s.authorConclusion)} |\n`;
  });

  md += `\n*Nota.* Datos extraídos siguiendo las recomendaciones PRISMA 2020 (Ítems 10a, 10b y 17). Los valores 'No reportado' señalan información no informada explícitamente en el texto original del informe publicado, garantizando el principio de trazabilidad y ausencia de imputación no justificada (cero alucinaciones).\n`;

  return md;
}

/**
 * Genera el texto metodológico canónico para la sección de Métodos (Ítems 10a y 10b PRISMA 2020)
 */
export function generateDataExtractionMethodsText(): string {
  return `### Proceso de Extracción de Datos y Variables Buscadas (Ítems 10a y 10b PRISMA 2020)
Dos investigadores ([INICIALES_REVISOR_1] y [INICIALES_REVISOR_2]) extrajeron de forma independiente y por duplicado la información de cada estudio elegible utilizando un formulario estandarizado y pilotado de extracción de datos desarrollado en consonancia con la declaración PRISMA 2020. Las discrepancias se resolvieron mediante discusión consensuada o la intervención arbitral de un tercer investigador sénior ([INICIALES_REVISOR_3]).

Para cada estudio incluido se extrajeron de forma sistemática los siguientes dominios de variables:
1. **Identificación y diseño**: Primer autor, año de publicación, país o centros participantes, diseño del estudio (aleatorizado, multicéntrico, cegamiento) y tamaño de la muestra total analizada ($N$).
2. **Características de los participantes (Población)**: Criterios específicos de inclusión (definición clínica, etiología, rangos de fracción de eyección FEVI, clase funcional NYHA, umbrales de biomarcadores NT-proBNP) y criterios de exclusión (puntos de corte de filtrado glomerular TFGe, cifras tensionales basales, comorbilidades).
3. **Intervención y comparador**: Régimen posológico detallado (fármaco, dosis diaria, vía de administración), duración de la exposición, naturaleza del grupo control (placebo o comparador activo) y tratamientos farmacológicos óptimos de base concomitantes.
4. **Resultados clínicos principales (Outcomes)**: Definición de desenlaces primarios y secundarios clave, número de eventos por brazo, medidas de efecto relativo (Hazard Ratios HR, Ratios de Riesgo RR u Odds Ratios OR con intervalos de confianza del 95%) y valores de p exactos bilaterales.
5. **Conclusión principal de los autores**: Juicio o conclusión textual declarada por el equipo de investigación en el informe primario.

En aquellos casos donde los datos requeridos no estuvieron informados explícitamente en el texto principal ni en el material suplementario publicado, se registraron formalmente como "No reportado" y se remitió una solicitud formal de clarificación por correo electrónico a los autores de correspondencia.`;
}
