import { GradeOutcomeAssessment, GradeCertaintyLevel } from '../types';

export function calculateGradeCertainty(
  outcome: Omit<GradeOutcomeAssessment, 'overallCertainty' | 'informativeStatement' | 'footnotes'>
): { overallCertainty: GradeCertaintyLevel; informativeStatement: string; footnotes: string[] } {
  // Base score: RCT = 4 (High), Observational = 2 (Low)
  let score = outcome.studyType === 'rct' ? 4 : 2;
  const footnotes: string[] = [];

  // Downgrades
  if (outcome.riskOfBias.level < 0) {
    score += outcome.riskOfBias.level;
    footnotes.push(`Riesgo de sesgo degradado en ${Math.abs(outcome.riskOfBias.level)} nivel(es): ${outcome.riskOfBias.justification}`);
  }
  if (outcome.inconsistency.level < 0) {
    score += outcome.inconsistency.level;
    footnotes.push(`Inconsistencia degradada en ${Math.abs(outcome.inconsistency.level)} nivel(es): ${outcome.inconsistency.justification}`);
  }
  if (outcome.indirectness.level < 0) {
    score += outcome.indirectness.level;
    footnotes.push(`Evidencia indirecta degradada en ${Math.abs(outcome.indirectness.level)} nivel(es): ${outcome.indirectness.justification}`);
  }
  if (outcome.imprecision.level < 0) {
    score += outcome.imprecision.level;
    footnotes.push(`Imprecisión degradada en ${Math.abs(outcome.imprecision.level)} nivel(es): ${outcome.imprecision.justification}`);
  }
  if (outcome.publicationBias.level < 0) {
    score += outcome.publicationBias.level;
    footnotes.push(`Sesgo de publicación degradado en ${Math.abs(outcome.publicationBias.level)} nivel(es): ${outcome.publicationBias.justification}`);
  }

  // Upgrades (mainly observational or when applicable)
  if (outcome.largeEffect.level > 0) {
    score += outcome.largeEffect.level;
    footnotes.push(`Aumentado por gran magnitud del efecto: ${outcome.largeEffect.justification}`);
  }
  if (outcome.doseResponse.level > 0) {
    score += outcome.doseResponse.level;
    footnotes.push(`Aumentado por gradiente dosis-respuesta: ${outcome.doseResponse.justification}`);
  }
  if (outcome.residualConfounding.level > 0) {
    score += outcome.residualConfounding.level;
    footnotes.push(`Aumentado por factores de confusión residuales plausibles: ${outcome.residualConfounding.justification}`);
  }

  // Clamp score between 1 and 4
  if (score >= 4) score = 4;
  if (score <= 1) score = 1;

  let overallCertainty: GradeCertaintyLevel = 'very_low';
  let informativeStatement = '';

  if (score === 4) {
    overallCertainty = 'high';
    informativeStatement = `Certeza Alta (⊕⊕⊕⊕): Existe gran confianza en que el efecto real se encuentra cercano al estimado. Frase recomendada GRADE: "[La intervención] reduce/aumenta [el desenlace]".`;
  } else if (score === 3) {
    overallCertainty = 'moderate';
    informativeStatement = `Certeza Moderada (⊕⊕⊕◯): Confianza moderada en el estimador del efecto; es probable que el efecto real sea cercano, pero existe la posibilidad de que difiera. Frase recomendada GRADE: "[La intervención] probablemente reduce/aumenta [el desenlace]".`;
  } else if (score === 2) {
    overallCertainty = 'low';
    informativeStatement = `Certeza Baja (⊕⊕◯◯): Confianza limitada en el estimador; el efecto real puede ser sustancialmente diferente. Frase recomendada GRADE: "[La intervención] podría reducir/aumentar [el desenlace]".`;
  } else {
    overallCertainty = 'very_low';
    informativeStatement = `Certeza Muy Baja (⊕◯◯◯): Muy poca confianza en el estimador del efecto; la evidencia es muy incierta. Frase recomendada GRADE: "La evidencia es muy incierta sobre el efecto de [la intervención] en [el desenlace]".`;
  }

  return { overallCertainty, informativeStatement, footnotes };
}

export const INITIAL_GRADE_OUTCOMES: GradeOutcomeAssessment[] = [
  {
    id: 'g1',
    outcomeName: 'Mortalidad por todas las causas',
    importance: 'critical',
    studyType: 'rct',
    studyCount: 5,
    participantCount: 12450,
    effectEstimate: 'RR 0.83 (IC 95%: 0.75 a 0.92)',
    baselineRisk: '138 por 1,000',
    interventionRisk: '115 por 1,000',
    riskDifference: '23 menos por 1,000 (IC 95%: 11 a 35 menos)',
    riskOfBias: { level: 0, justification: 'Estudios con bajo riesgo de sesgo global evaluados mediante Cochrane RoB 2.' },
    inconsistency: { level: 0, justification: 'Homogeneidad estadística y clínica óptima (I² = 0%, p = 0.68).' },
    indirectness: { level: 0, justification: 'Población, intervención y comparador directos según el protocolo PICO.' },
    imprecision: { level: 0, justification: 'Tamaño muestral acumulado (>12,000) supera el tamaño óptimo de información (OIS) e IC 95% estrecho.' },
    publicationBias: { level: 0, justification: 'Funnel plot simétrico y prueba de Egger sin asimetría significativa (p = 0.42).' },
    largeEffect: { level: 0, justification: 'Efecto clínico relevante pero sin requerir ascenso.' },
    doseResponse: { level: 0, justification: 'No aplica.' },
    residualConfounding: { level: 0, justification: 'No aplica para ECAs.' },
    overallCertainty: 'high',
    informativeStatement: 'Los inhibidores de SGLT2 reducen la mortalidad por todas las causas en pacientes con IC-FEr (Certeza Alta).',
    footnotes: [],
  },
  {
    id: 'g2',
    outcomeName: 'Hospitalización por insuficiencia cardíaca',
    importance: 'critical',
    studyType: 'rct',
    studyCount: 5,
    participantCount: 12450,
    effectEstimate: 'RR 0.70 (IC 95%: 0.63 a 0.78)',
    baselineRisk: '165 por 1,000',
    interventionRisk: '116 por 1,000',
    riskDifference: '49 menos por 1,000 (IC 95%: 36 a 61 menos)',
    riskOfBias: { level: 0, justification: 'Ensayos doble ciego con enmascaramiento y adecuada ocultación de la aleatorización.' },
    inconsistency: { level: 0, justification: 'Efectos consistentes en todas las cohortes (I² = 12%).' },
    indirectness: { level: 0, justification: 'Medición directa de ingresos hospitalarios protocolizados.' },
    imprecision: { level: 0, justification: 'Límites de confianza precisos y superioridad estadística contundente.' },
    publicationBias: { level: 0, justification: 'Sin evidencia de reporte selectivo en registros clínicos.' },
    largeEffect: { level: 0, justification: '' },
    doseResponse: { level: 0, justification: '' },
    residualConfounding: { level: 0, justification: '' },
    overallCertainty: 'high',
    informativeStatement: 'Los inhibidores de SGLT2 reducen las hospitalizaciones por insuficiencia cardíaca (Certeza Alta).',
    footnotes: [],
  },
  {
    id: 'g3',
    outcomeName: 'Calidad de vida relacionada con la salud (KCCQ-TSS)',
    importance: 'important',
    studyType: 'rct',
    studyCount: 4,
    participantCount: 8920,
    effectEstimate: 'Diferencia de Medias: +2.41 puntos (IC 95%: 1.54 a 3.28)',
    baselineRisk: 'Escala de 0 a 100 puntos',
    interventionRisk: 'Incremento promedio +2.41',
    riskDifference: 'Mejora clínica modesta',
    riskOfBias: { level: 0, justification: 'Bajo riesgo en asignación y mediciones autorreportadas enmascaradas.' },
    inconsistency: { level: 0, justification: 'Heterogeneidad moderada (I² = 38%), pero todos los estudios favorecen la intervención.' },
    indirectness: { level: 0, justification: 'Cuestionario validado internacionalmente (Kansas City Cardiomyopathy Questionnaire).' },
    imprecision: { level: -1, justification: 'El límite inferior y superior del IC 95% se sitúa por debajo de la mínima diferencia clínicamente importante (MCID = 5 puntos).' },
    publicationBias: { level: 0, justification: 'Búsqueda exhaustiva sin indicios de sesgo de publicación.' },
    largeEffect: { level: 0, justification: '' },
    doseResponse: { level: 0, justification: '' },
    residualConfounding: { level: 0, justification: '' },
    overallCertainty: 'moderate',
    informativeStatement: 'Los inhibidores de SGLT2 probablemente mejoran ligeramente la calidad de vida en pacientes con IC-FEr (Certeza Moderada).',
    footnotes: ['Imprecisión degradada en 1 nivel: El intervalo de confianza no alcanza el umbral de relevancia clínica mínima (MCID = 5 puntos KCCQ).'],
  },
  {
    id: 'g4',
    outcomeName: 'Eventos adversos graves (Cetoacidosis euglucémica)',
    importance: 'critical',
    studyType: 'rct',
    studyCount: 5,
    participantCount: 12450,
    effectEstimate: 'RR 1.34 (IC 95%: 0.52 a 3.47)',
    baselineRisk: '1.2 por 1,000',
    interventionRisk: '1.6 por 1,000',
    riskDifference: '0.4 más por 1,000 (IC 95%: 0.6 menos a 3.0 más)',
    riskOfBias: { level: 0, justification: 'Comité de adjudicación de eventos ciego e independiente.' },
    inconsistency: { level: 0, justification: 'Baja frecuencia de eventos en todos los brazos.' },
    indirectness: { level: 0, justification: 'Diagnóstico confirmado por laboratorio.' },
    imprecision: { level: -2, justification: 'Número total de eventos muy bajo (<30 eventos) con intervalo de confianza del 95% sumamente amplio que abarca tanto beneficio como perjuicio sustancial.' },
    publicationBias: { level: 0, justification: 'Reporte riguroso de seguridad según directrices ICH-GCP.' },
    largeEffect: { level: 0, justification: '' },
    doseResponse: { level: 0, justification: '' },
    residualConfounding: { level: 0, justification: '' },
    overallCertainty: 'low',
    informativeStatement: 'La evidencia es incierta sobre el efecto en cetoacidosis; los inhibidores de SGLT2 podrían asociarse a una ligera variación no concluyente (Certeza Baja).',
    footnotes: ['Imprecisión degradada en 2 niveles: Número escaso de eventos (n < 30) e IC 95% que cruza ampliamente la unidad con gran imprecisión.'],
  },
];
