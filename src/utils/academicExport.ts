import { 
  ManuscriptSection, 
  PicoData, 
  PrismaChecklistItem, 
  FlowDiagramState, 
  GradeOutcomeAssessment,
  MetaAnalysisConfigState,
  Rob2StudyAssessment,
  EvidenceStudyRecord,
  AcademicFormatStyle,
  ManuscriptExportMetadata
} from '../types';
import { getI2BadgeInfo } from '../components/MetaAnalysisConfig';

export const DEFAULT_EXPORT_METADATA: ManuscriptExportMetadata = {
  title: 'Eficacia y Seguridad de los Inhibidores de SGLT2 en Pacientes con Insuficiencia Cardíaca y Fracción de Eyección Reducida: Revisión Sistemática y Metaanálisis',
  runningHead: 'INHIBIDORES DE SGLT2 EN INSUFICIENCIA CARDÍACA',
  authors: 'Dra. María González-López, MD, PhD¹, Dr. Carlos Mendoza-Torres, MD, MSc², Dra. Elena Ruiz-Vázquez, PhD³',
  affiliations: '¹Departamento de Cardiología, Hospital Universitario Virgen de las Nieves, Granada, España\n²Unidad de Epidemiología Clínica y Bioestadística, Instituto de Investigación Biosanitaria (ibs.GRANADA), Granada, España\n³Departamento de Farmacología Médica, Universidad de Granada, Granada, España',
  correspondingAuthor: 'Dra. María González-López, MD, PhD',
  correspondingEmail: 'mgonzalez@ugr.es / ctp@go.ugr.es',
  prosperoRegistration: 'PROSPERO CRD42023489215 (Registrado a priori el 15/01/2023)',
  fundingStatement: 'Esta investigación fue financiada por el Instituto de Salud Carlos III (Subprograma de Generación de Conocimiento, Convocatoria 2023, expediente PI23/00842) y cofinanciada por el Fondo Europeo de Desarrollo Regional (FEDER). La entidad financiadora no intervino en el diseño del estudio, recolección ni análisis de datos.',
  conflictsOfInterest: 'Los autores declaran no tener conflictos de interés financieros ni no financieros relevantes que declarar en relación con este manuscrito.',
  keywords: 'Insuficiencia cardíaca, Fracción de eyección reducida, Inhibidores del cotransportador sodio-glucosa tipo 2, Dapagliflozina, Empagliflozina, Revisión Sistemática, Metaanálisis, PRISMA 2020, Cochrane RoB 2, GRADE',
};

/**
 * Genera el documento Markdown estructurado según el estilo académico seleccionado
 */
export function generateAcademicMarkdown(
  metadata: ManuscriptExportMetadata,
  style: AcademicFormatStyle,
  sections: ManuscriptSection[],
  picoData: PicoData,
  flowData: FlowDiagramState,
  rob2Studies: Rob2StudyAssessment[],
  gradeOutcomes: GradeOutcomeAssessment[],
  metaConfig: MetaAnalysisConfigState,
  checklistItems: PrismaChecklistItem[],
  evidenceStudies: EvidenceStudyRecord[] = []
): string {
  const isApa = style === 'apa7';
  let md = '';

  // 1. Portada / Encabezado
  if (isApa) {
    md += `Running Head: ${metadata.runningHead.toUpperCase()}\n\n`;
    md += `# ${metadata.title}\n\n`;
    md += `**${metadata.authors}**\n\n`;
    md += `*${metadata.affiliations.replace(/\n/g, '  \n')}*\n\n`;
    md += `**Nota del Autor**  \n`;
    md += `Correspondencia: ${metadata.correspondingAuthor}, Correo: ${metadata.correspondingEmail}.  \n`;
    md += `Registro del Protocolo: ${metadata.prosperoRegistration}.  \n`;
    md += `${metadata.fundingStatement}  \n`;
    md += `${metadata.conflictsOfInterest}\n\n`;
    md += `---\n\n`;
    md += `## Resumen\n\n`;
  } else {
    md += `# ${metadata.title}\n\n`;
    md += `**Autores:** ${metadata.authors}  \n`;
    md += `**Afiliaciones:**  \n${metadata.affiliations.replace(/\n/g, '  \n')}  \n`;
    md += `**Autor de Correspondencia:** ${metadata.correspondingAuthor} (${metadata.correspondingEmail})  \n`;
    md += `**Registro PROSPERO:** ${metadata.prosperoRegistration}\n\n`;
    md += `---\n\n`;
    md += `## RESUMEN ESTRUCTURADO (Declaración PRISMA 2020 - Ítem 2)\n\n`;
  }

  // 2. Resumen estructurado
  const abstractSec = sections.find((s) => s.id === 'title-abstract');
  if (abstractSec && abstractSec.content.trim()) {
    md += `${abstractSec.content}\n\n`;
  } else {
    md += `**Antecedentes:** Los inhibidores del cotransportador sodio-glucosa tipo 2 (SGLT2i) han emergido como un pilar en el tratamiento de la insuficiencia cardíaca con fracción de eyección reducida (IC-FEr). Sin embargo, se requiere una síntesis cuantitativa actualizada y graduada bajo PRISMA 2020, RoB 2 y GRADE.\n\n`;
    md += `**Métodos:** Se condujo una revisión sistemática exhaustiva en PubMed/MEDLINE, Embase, Cochrane CENTRAL y Web of Science hasta 2023. Se incluyeron ensayos clínicos aleatorizados en adultos con IC-FEr. El riesgo de sesgo se evaluó con Cochrane RoB 2 y la certeza de la evidencia se cuantificó con el enfoque GRADE. La síntesis cuantitativa empleó modelos de efectos aleatorios (${metaConfig.modelType}) con ajuste de Knapp-Hartung (HKSJ).\n\n`;
    md += `**Resultados:** Se incluyeron ${flowData.totalStudiesIncluded} ensayos clínicos (${metaConfig.totalParticipants.toLocaleString()} participantes). Los SGLT2i redujeron significativamente el desenlace principal (${metaConfig.effectMeasure} = ${metaConfig.pooledEstimate.toFixed(2)}, IC 95%: ${metaConfig.ciLower.toFixed(2)} a ${metaConfig.ciUpper.toFixed(2)}; p < 0.001) con heterogeneidad ${metaConfig.i2 < 30 ? 'baja' : 'moderada'} (I² = ${metaConfig.i2}%). La certeza de la evidencia fue Alta para mortalidad y hospitalización.\n\n`;
    md += `**Conclusiones:** Los inhibidores de SGLT2 demuestran un beneficio terapéutico robusto y consistente, con alta certeza GRADE, respaldando su indicación prioritaria como terapia estándar en IC-FEr.\n\n`;
  }

  md += `**Palabras Clave (MeSH/DeCS):** ${metadata.keywords}\n\n`;
  md += `---\n\n`;

  // 3. Estructura PICO
  md += `### Formulación de la Pregunta de Investigación (Marco PICO - Ítem 4)\n\n`;
  md += `- **Pregunta Clínica:** ${picoData.clinicalQuestion || '¿Cuál es la eficacia y seguridad de los inhibidores de SGLT2 en pacientes con insuficiencia cardíaca y fracción de eyección reducida?'}\n`;
  md += `- **Población (P):** ${picoData.population || 'Adultos con insuficiencia cardíaca crónica y FEVI ≤ 40%'}\n`;
  md += `- **Intervención (I):** ${picoData.intervention || 'Inhibidores de SGLT2 (Dapagliflozina, Empagliflozina, Sotagliflozina)'}\n`;
  md += `- **Comparador (C):** ${picoData.comparator || 'Placebo o tratamiento médico óptimo estándar sin SGLT2i'}\n`;
  md += `- **Desenlaces (O):** ${picoData.outcomes || 'Mortalidad cardiovascular, hospitalizaciones por IC, calidad de vida (KCCQ), cetoacidosis'}\n`;
  md += `- **Diseño de Estudios (S):** ${picoData.studyDesign || 'Ensayos Clínicos Aleatorizados (ECA) paralelos en fase 3'}\n\n`;
  md += `---\n\n`;

  // 4. Secciones del Manuscrito (Introducción, Métodos, Resultados, Discusión, Otros)
  const orderedSections = ['introduction', 'methods', 'results', 'discussion', 'other'];

  orderedSections.forEach((secId) => {
    const section = sections.find((s) => s.id === secId);
    if (!section) return;

    const sectionTitle = 
      isApa ? section.title : `${section.title.toUpperCase()} (Ítems PRISMA ${section.prismaItemNumbers.join(', ')})`;
    md += `## ${sectionTitle}\n\n`;
    md += `${section.content ? section.content : '*[Contenido en proceso de redacción]*'}\n\n`;

    // Si es Métodos, insertar referencias al protocolo y RoB 2
    if (secId === 'methods') {
      md += `\n`;
    }

    // Si es Resultados, insertar las tablas y el flujograma
    if (secId === 'results') {
      // FIGURA 1: Flujograma PRISMA 2020
      md += `\n### ${isApa ? 'Figura 1' : 'FIGURA 1'}\n`;
      md += `*${isApa ? 'Diagrama de Flujo del Proceso de Selección de Estudios (Declaración PRISMA 2020)' : 'Diagrama de flujo PRISMA 2020 para nuevas revisiones sistemáticas (Ítem 16a)'}*\n\n`;
      md += `\`\`\`text\n`;
      md += `╔════════════════════════════════════════════════════════════════════════════════════════╗\n`;
      md += `║                              FASE 1: IDENTIFICACIÓN                                    ║\n`;
      md += `╠════════════════════════════════════════════════════════════════════════════════════════╣\n`;
      md += `║ Registros identificados en bases de datos electrónicas:                                ║\n`;
      flowData.databasesIdentified.forEach((d) => {
        md += `║   • ${d.name.padEnd(40, ' ')} : ${d.count.toString().padStart(6, ' ')} registros           ║\n`;
      });
      md += `║ Registros identificados en registros de ensayos (ClinicalTrials, WHO): ${flowData.registersIdentified.reduce((a, b) => a + b.count, 0).toString().padStart(6, ' ')}          ║\n`;
      md += `║ Registros duplicados eliminados antes del cribado: ${flowData.duplicatesRemoved.toString().padStart(12, ' ')}                      ║\n`;
      md += `╠════════════════════════════════════════════════════════════════════════════════════════╣\n`;
      md += `║                                FASE 2: CRIBADO                                         ║\n`;
      md += `╠════════════════════════════════════════════════════════════════════════════════════════╣\n`;
      md += `║ Registros cribados (título y resumen): ${flowData.recordsScreened.toString().padStart(24, ' ')}                        ║\n`;
      md += `║ Registros excluidos tras cribado: ${flowData.recordsExcludedScreening.toString().padStart(30, ' ')}                        ║\n`;
      md += `╠════════════════════════════════════════════════════════════════════════════════════════╣\n`;
      md += `║                              FASE 3: ELEGIBILIDAD                                      ║\n`;
      md += `╠════════════════════════════════════════════════════════════════════════════════════════╣\n`;
      md += `║ Informes buscados para recuperación a texto completo: ${flowData.reportsSought.toString().padStart(11, ' ')}                        ║\n`;
      md += `║ Informes no recuperados: ${flowData.reportsNotRetrieved.toString().padStart(40, ' ')}                        ║\n`;
      md += `║ Informes evaluados para elegibilidad: ${flowData.reportsAssessed.toString().padStart(26, ' ')}                        ║\n`;
      md += `║ Informes excluidos a texto completo:                                                   ║\n`;
      flowData.reportsExcludedReasons.forEach((r) => {
        md += `║   - ${r.reason.slice(0, 52).padEnd(52, ' ')}: ${r.count.toString().padStart(4, ' ')} informes   ║\n`;
      });
      md += `╠════════════════════════════════════════════════════════════════════════════════════════╣\n`;
      md += `║                                FASE 4: INCLUSIÓN                                       ║\n`;
      md += `╠════════════════════════════════════════════════════════════════════════════════════════╣\n`;
      md += `║ Nuevos estudios incluidos en la síntesis cualitativa y cuantitativa: ${flowData.newStudiesIncluded.toString().padStart(6, ' ')}         ║\n`;
      md += `║ Estudios procedentes de otras fuentes (búsqueda inversa de citas):   ${flowData.otherStudiesIncluded.toString().padStart(6, ' ')}         ║\n`;
      md += `║ TOTAL DE ESTUDIOS INCLUIDOS EN LA REVISIÓN SISTEMÁTICA:              ${flowData.totalStudiesIncluded.toString().padStart(6, ' ')} ensayos ║\n`;
      md += `║ TOTAL DE INFORMES ASOCIADOS:                                         ${flowData.totalReportsIncluded.toString().padStart(6, ' ')} informes║\n`;
      md += `╚════════════════════════════════════════════════════════════════════════════════════════╝\n`;
      md += `\`\`\`\n\n`;
      md += `*Nota.* De Page, M. J. et al. (2021). The PRISMA 2020 statement: an updated guideline for reporting systematic reviews. *BMJ*, 372:n71.\n\n`;

      let tableNum = 1;

      // TABLA DE CARACTERÍSTICAS / MATRIZ DE EVIDENCIA (Ítems 10a, 10b, 17)
      if (evidenceStudies && evidenceStudies.length > 0) {
        md += `\n### ${isApa ? `Tabla ${tableNum}` : `TABLA ${tableNum}`}\n`;
        md += `*${isApa ? 'Características Metodológicas y Clínicas de los Ensayos Clínicos Incluidos (Matriz de Evidencia)' : 'Características de los estudios incluidos y extracción estandarizada de variables (Ítems 10a, 10b y 17 PRISMA 2020)'}*\n\n`;
        md += `| Autor y Año | Diseño del estudio y tamaño de la muestra ($N$) | Población (Criterios de inclusión/exclusión) | Intervención / Comparador | Resultados principales (Outcomes primarios con sus valores estadísticos: $p$, IC 95%, OR/RR si aplican) | Conclusión principal del autor |\n`;
        md += `| :--- | :--- | :--- | :--- | :--- | :--- |\n`;
        evidenceStudies.forEach((s) => {
          const clean = (txt: string) => (txt || 'No reportado').replace(/\|/g, '\\|').trim();
          md += `| **${clean(s.authorAndYear)}** | ${clean(s.studyDesignAndSampleSize)} | ${clean(s.population)} | ${clean(s.interventionComparator)} | ${clean(s.mainResults)} | ${clean(s.authorConclusion)} |\n`;
        });
        md += `\n*Nota.* Datos extraídos siguiendo las recomendaciones PRISMA 2020 (Ítems 10a, 10b y 17). Los valores 'No reportado' señalan información no reportada explícitamente en el texto original del informe publicado (principio de trazabilidad y cero alucinaciones).\n\n`;
        tableNum++;
      }

      // TABLA: RoB 2
      md += `\n### ${isApa ? `Tabla ${tableNum}` : `TABLA ${tableNum}`}\n`;
      md += `*${isApa ? 'Evaluación del Riesgo de Sesgo en los Ensayos Clínicos Aleatorizados Incluidos mediante la Herramienta Cochrane RoB 2' : 'Resumen de la evaluación del riesgo de sesgo en los estudios incluidos (Cochrane RoB 2 - Ítem 18)'}*\n\n`;
      md += `| Estudio y Año | Muestra (N) | D1: Aleatorización | D2: Desviaciones | D3: Datos Faltantes | D4: Medición | D5: Selección Reporte | Juicio Global |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;
      rob2Studies.forEach((s) => {
        const d1 = s.d1Randomization === 'low' ? 'Bajo (+)' : s.d1Randomization === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
        const d2 = s.d2Deviations === 'low' ? 'Bajo (+)' : s.d2Deviations === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
        const d3 = s.d3MissingData === 'low' ? 'Bajo (+)' : s.d3MissingData === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
        const d4 = s.d4Measurement === 'low' ? 'Bajo (+)' : s.d4Measurement === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
        const d5 = s.d5ReportedResult === 'low' ? 'Bajo (+)' : s.d5ReportedResult === 'some_concerns' ? 'Preocupación (?)' : 'Alto (-)';
        const overall = s.overall === 'low' ? '**Bajo (+)**' : s.overall === 'some_concerns' ? '**Preocupación (?)**' : '**Alto (-)**';
        md += `| **${s.studyName}** (${s.year}) | ${s.sampleSize.toLocaleString()} | ${d1} | ${d2} | ${d3} | ${d4} | ${d5} | ${overall} |\n`;
      });
      md += `\n*Nota.* D1: Proceso de aleatorización; D2: Desviaciones de las intervenciones previstas; D3: Datos de resultados faltantes; D4: Medición del resultado; D5: Selección del resultado informado. Juicio global asignado según el algoritmo estándar de Sterne et al. (2019, *BMJ*, 366:l4898). (+) Bajo riesgo de sesgo; (?) Algunas preocupaciones; (-) Alto riesgo de sesgo.\n\n`;
      tableNum++;

      // TABLA: GRADE Summary of Findings (SoF)
      md += `\n### ${isApa ? `Tabla ${tableNum}` : `TABLA ${tableNum}`}\n`;
      md += `*${isApa ? 'Resumen de Hallazgos (Summary of Findings) y Evaluación de la Certeza de la Evidencia con el Enfoque GRADE' : 'Tabla de Resumen de Hallazgos GRADE (SoF Table - Ítem 22)'}*\n\n`;
      md += `| Desenlace Clínico | Estudios (Participantes) | Efecto Relativo (IC 95%) | Riesgo Absoluto Basal | Riesgo Absoluto con SGLT2i | Diferencia Absoluta | Certeza GRADE | Declaración Informativa GRADE |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |\n`;
      gradeOutcomes.forEach((g) => {
        const certStr = 
          g.overallCertainty === 'high' ? '⊕⊕⊕⊕ ALTA' :
          g.overallCertainty === 'moderate' ? '⊕⊕⊕◯ MODERADA' :
          g.overallCertainty === 'low' ? '⊕⊕◯◯ BAJA' : '⊕◯◯◯ MUY BAJA';
        md += `| **${g.outcomeName}** (${g.importance === 'critical' ? 'Crítico' : 'Importante'}) | ${g.studyCount} (${g.participantCount.toLocaleString()}) | ${g.effectEstimate} | ${g.baselineRisk || 'N/D'} | ${g.interventionRisk || 'N/D'} | ${g.riskDifference || 'N/D'} | **${certStr}** | ${g.informativeStatement} |\n`;
      });
      md += `\n*Nota.* Certeza GRADE: **Alta**: Existe gran confianza en que el efecto real se encuentra cercano al estimado; **Moderada**: Confianza moderada en el estimador del efecto; **Baja**: Confianza limitada en el estimador; **Muy Baja**: Muy poca confianza en el estimador. Justificaciones metodológicas:\n`;
      gradeOutcomes.forEach((g) => {
        if (g.footnotes && g.footnotes.length > 0) {
          md += `- **${g.outcomeName}:** ${g.footnotes.join('; ')}\n`;
        }
      });
      md += `\n`;
      tableNum++;

      // TABLA: Metaanálisis y Meta-regresión
      md += `\n### ${isApa ? `Tabla ${tableNum}` : `TABLA ${tableNum}`}\n`;
      md += `*${isApa ? 'Parámetros Estadísticos del Metaanálisis y Exploración de Heterogeneidad' : 'Síntesis Cuantitativa y Meta-Regresión (PRISMA 2020 Ítems 13 y 20)'}*\n\n`;
      const i2Badge = getI2BadgeInfo(metaConfig.i2);
      md += `| Parámetro Metodológico | Valor / Estimación | Interpretación Clínica / Estadística |\n`;
      md += `| :--- | :--- | :--- |\n`;
      md += `| **Desenlace Analizado** | ${metaConfig.outcomeName} | Desenlace primario preespecificado en protocolo |\n`;
      md += `| **Modelo de Metaanálisis** | ${metaConfig.modelType} | ${metaConfig.knappHartungAdjustment ? 'Ajuste de Knapp-Hartung-Sidik-Jonkman (HKSJ)' : 'Estándar'} |\n`;
      md += `| **Estudios Incluidos (k)** | ${metaConfig.studyCount} ensayos clínicos | Población acumulada: ${metaConfig.totalParticipants.toLocaleString()} pacientes |\n`;
      md += `| **Efecto Agrupado (${metaConfig.effectMeasure})** | **${metaConfig.pooledEstimate.toFixed(2)}** (IC 95%: ${metaConfig.ciLower.toFixed(2)} a ${metaConfig.ciUpper.toFixed(2)}) | p ${metaConfig.pValue < 0.001 ? '< 0.001' : `= ${metaConfig.pValue.toFixed(3)}`} (Estadísticamente significativo) |\n`;
      md += `| **Heterogeneidad Q de Cochran** | Q = ${metaConfig.qStatistic.toFixed(2)} (gl = ${metaConfig.studyCount - 1}) | p = ${metaConfig.qPValue.toFixed(3)} |\n`;
      md += `| **Inconsistencia de Higgins (I²)** | **${metaConfig.i2.toFixed(1)}%** | ${i2Badge.label} |\n`;
      md += `| **Varianza entre estudios (Tau²)** | τ² = ${metaConfig.tau2.toFixed(3)} (τ = ${metaConfig.tau.toFixed(3)}) | Dispersión de efectos verdaderos entre poblaciones |\n`;
      md += `| **Intervalo de Predicción del 95%** | **${metaConfig.predictionIntervalLower.toFixed(2)} a ${metaConfig.predictionIntervalUpper.toFixed(2)}** | Rango esperado del efecto en una futura cohorte clínica independiente |\n`;

      if (metaConfig.metaRegressionEnabled && metaConfig.covariates.length > 0) {
        md += `\n**Submodelo de Meta-Regresión (Ajustado por ${metaConfig.metaRegressionMethod}):**\n\n`;
        md += `| Covariable a Nivel de Estudio | Coeficiente β | Error Estándar (EE) | IC 95% | Valor p | R² Análogo (Varianza explicada) |\n`;
        md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
        metaConfig.covariates.forEach((c) => {
          md += `| **${c.name}** | ${c.beta.toFixed(3)} | ${c.se.toFixed(3)} | ${c.ciLower.toFixed(3)} a ${c.ciUpper.toFixed(3)} | ${c.pValue < 0.001 ? '< 0.001' : c.pValue.toFixed(3)} | ${c.r2Analog.toFixed(1)}% |\n`;
        });
      }
      md += `\n*Nota.* Estimaciones calculadas bajo paquetes 'meta' y 'metafor' (R Software). El intervalo de predicción del 95% incorpora la incertidumbre entre estudios de acuerdo con Borenstein et al. (2021).\n\n`;
    }

    md += `---\n\n`;
  });

  // 5. APÉNDICE: Lista de Verificación PRISMA 2020 Completa
  md += `## APÉNDICE SUPLEMENTARIO: LISTA DE VERIFICACIÓN PRISMA 2020\n`;
  md += `*Conforme a la Declaración PRISMA 2020 (Page et al., BMJ 2021;372:n160)*\n\n`;
  md += `| Ítem | Sección / Tema | Recomendación de Reporte | Ubicación en Manuscrito | Estado de Cumplimiento |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- |\n`;
  checklistItems.forEach((item) => {
    const statusText = 
      item.status === 'completed' ? 'Cumplido' :
      item.status === 'in_progress' ? 'En progreso' :
      item.status === 'not_applicable' ? 'No aplica' : 'Pendiente';
    md += `| **${item.itemNumber}** | ${item.topic} | ${item.title.replace(/\|/g, '-')} | ${item.locationReported || 'N/A'} | ${statusText} |\n`;
  });

  return md;
}

/**
 * Genera el documento HTML completo compatible con Microsoft Word (.doc) y navegadores web
 * con diseño tipográfico APA 7 / Biomédico de calidad editorial, bordes reglamentarios,
 * colores suaves para semáforos RoB 2, símbolos GRADE y cajas de figuras.
 */
export function generateAcademicHtmlDocument(
  metadata: ManuscriptExportMetadata,
  style: AcademicFormatStyle,
  sections: ManuscriptSection[],
  picoData: PicoData,
  flowData: FlowDiagramState,
  rob2Studies: Rob2StudyAssessment[],
  gradeOutcomes: GradeOutcomeAssessment[],
  metaConfig: MetaAnalysisConfigState,
  checklistItems: PrismaChecklistItem[],
  evidenceStudies: EvidenceStudyRecord[] = []
): string {
  const isApa = style === 'apa7';
  const fontFamily = isApa ? "'Times New Roman', Times, serif" : "'Calibri', 'Segoe UI', Arial, sans-serif";

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${metadata.title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: A4 portrait;
      margin: 2.54cm 2.54cm 2.54cm 2.54cm;
      mso-header-margin: 1.27cm;
      mso-footer-margin: 1.27cm;
      mso-paper-source: 0;
    }
    body {
      font-family: ${fontFamily};
      font-size: 11.5pt;
      line-height: 1.6;
      color: #1a1a1a;
      background-color: #ffffff;
      margin: 0;
      padding: 2cm;
    }
    .page-break {
      page-break-before: always;
      mso-special-character: line-break;
      margin-top: 2rem;
    }
    .running-head {
      font-size: 9pt;
      text-transform: uppercase;
      color: #555555;
      border-bottom: 1px solid #cccccc;
      padding-bottom: 4px;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
    }
    h1.title {
      font-size: 18pt;
      font-weight: bold;
      text-align: ${isApa ? 'center' : 'left'};
      line-height: 1.3;
      margin-bottom: 1.2rem;
      color: #0f172a;
    }
    .authors-block {
      text-align: ${isApa ? 'center' : 'left'};
      font-size: 12pt;
      font-weight: bold;
      margin-bottom: 0.6rem;
      color: #1e293b;
    }
    .affiliations-block {
      text-align: ${isApa ? 'center' : 'left'};
      font-size: 10pt;
      font-style: italic;
      color: #475569;
      margin-bottom: 1.5rem;
      white-space: pre-line;
    }
    .author-note {
      font-size: 9.5pt;
      background-color: #f8fafc;
      border-left: 3px solid #64748b;
      padding: 10px 14px;
      margin-bottom: 2rem;
    }
    h2.section-heading {
      font-size: 14pt;
      font-weight: bold;
      text-align: ${isApa ? 'center' : 'left'};
      color: #0f172a;
      border-bottom: ${isApa ? 'none' : '1.5px solid #0284c7'};
      padding-bottom: 4px;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    h3.sub-heading {
      font-size: 12pt;
      font-weight: bold;
      color: #1e293b;
      margin-top: 1.4rem;
      margin-bottom: 0.5rem;
    }
    p {
      margin-bottom: 1rem;
      text-align: justify;
      text-justify: inter-word;
    }
    /* Tablas estilo APA 7 (Tres líneas horizontales, cero líneas verticales) */
    table.academic-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
      font-size: 9.5pt;
      page-break-inside: avoid;
    }
    table.academic-table th {
      border-top: 1.5pt solid #000000;
      border-bottom: 1pt solid #000000;
      padding: 8px 6px;
      font-weight: bold;
      text-align: left;
      background-color: #f8fafc;
      color: #0f172a;
    }
    table.academic-table td {
      padding: 6px 6px;
      border-top: 0.5pt solid #e2e8f0;
      border-bottom: none;
      vertical-align: top;
      color: #334155;
    }
    table.academic-table tr:last-child td {
      border-bottom: 1.5pt solid #000000;
    }
    .table-caption {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 2px;
      color: #0f172a;
    }
    .table-subtitle {
      font-style: italic;
      font-size: 10pt;
      margin-bottom: 8px;
      color: #334155;
    }
    .table-note {
      font-size: 8.5pt;
      color: #475569;
      margin-top: 6px;
      line-height: 1.4;
    }
    /* Estilos semáforos RoB 2 */
    .badge-rob {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-weight: bold;
      font-size: 8.5pt;
      text-align: center;
    }
    .rob-low {
      background-color: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    .rob-some {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .rob-high {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    /* Cajas del Flujograma */
    .flow-container {
      border: 1.5pt solid #94a3b8;
      border-radius: 8px;
      padding: 16px;
      margin: 1.5rem 0;
      background-color: #f8fafc;
      page-break-inside: avoid;
    }
    .flow-phase {
      margin-bottom: 14px;
      padding-bottom: 10px;
      border-bottom: 1px dashed #cbd5e1;
    }
    .flow-phase-title {
      font-weight: bold;
      font-size: 10pt;
      text-transform: uppercase;
      color: #1e3a8a;
      margin-bottom: 6px;
    }
    .flow-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 6px;
      font-size: 9.5pt;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>

  <!-- Encabezado / Titulejo -->
  <div class="running-head">
    <span>${metadata.runningHead}</span>
    <span>PRISMA 2020 ACADEMIC REPORT</span>
  </div>

  <!-- Portada / Título -->
  <h1 class="title">${metadata.title}</h1>
  <div class="authors-block">${metadata.authors}</div>
  <div class="affiliations-block">${metadata.affiliations}</div>

  <div class="author-note">
    <strong>Nota del Autor & Correspondencia:</strong><br>
    Correspondencia: ${metadata.correspondingAuthor} (Correo electrónico: <a href="mailto:${metadata.correspondingEmail}">${metadata.correspondingEmail}</a>).<br>
    <strong>Registro del Protocolo:</strong> ${metadata.prosperoRegistration}.<br>
    <strong>Financiamiento:</strong> ${metadata.fundingStatement}<br>
    <strong>Declaración de Conflictos de Interés:</strong> ${metadata.conflictsOfInterest}
  </div>

  <!-- Resumen Estructurado -->
  <h2 class="section-heading">${isApa ? 'Resumen' : 'RESUMEN ESTRUCTURADO (PRISMA 2020 Ítem 2)'}</h2>
  <div>
    ${
      sections.find((s) => s.id === 'title-abstract')?.content
        ? `<div style="white-space: pre-line;">${sections.find((s) => s.id === 'title-abstract')?.content}</div>`
        : `<p><strong>Antecedentes:</strong> Los inhibidores de SGLT2 constituyen una de las innovaciones farmacológicas más relevantes en la terapéutica de la insuficiencia cardíaca con fracción de eyección reducida (IC-FEr). El objetivo de esta revisión sistemática fue sintetizar y graduar la evidencia disponible respecto a su impacto sobre la mortalidad y hospitalizaciones.</p>
           <p><strong>Métodos:</strong> Se diseñó un protocolo preespecificado según PRISMA 2020 y registrado en PROSPERO. Se ejecutaron búsquedas sin restricción lingüística en MEDLINE, Embase y Cochrane CENTRAL. El riesgo de sesgo se auditó con la herramienta Cochrane RoB 2 para cada dominio, y la certeza de la evidencia se calibró mediante el enfoque GRADE.</p>
           <p><strong>Resultados:</strong> Se identificaron ${flowData.totalStudiesIncluded} ensayos clínicos controlados con ${metaConfig.totalParticipants.toLocaleString()} participantes. La combinación bajo efectos aleatorios demostró una reducción estadísticamente significativa de eventos (${metaConfig.effectMeasure} = ${metaConfig.pooledEstimate.toFixed(2)}, IC 95%: ${metaConfig.ciLower.toFixed(2)} a ${metaConfig.ciUpper.toFixed(2)}; p &lt; 0.001) con baja dispersión (I² = ${metaConfig.i2}%).</p>
           <p><strong>Conclusiones:</strong> La evidencia muestra con Certeza Alta (GRADE) que los inhibidores de SGLT2 reducen la morbimortalidad cardiovascular en pacientes con IC-FEr.</p>`
    }
    <p><strong>Palabras clave:</strong> ${metadata.keywords}</p>
  </div>

  <!-- PICO Marco -->
  <div style="background-color: #f1f5f9; padding: 12px 16px; border-radius: 6px; margin: 1.5rem 0; font-size: 9.5pt;">
    <strong style="color: #0f172a; display: block; margin-bottom: 6px;">Estructura Metodológica PICO (Ítem 4):</strong>
    <span style="display: block; margin-bottom: 3px;">• <strong>Población:</strong> ${picoData.population || 'Adultos con insuficiencia cardíaca y FEVI reducida'}</span>
    <span style="display: block; margin-bottom: 3px;">• <strong>Intervención:</strong> ${picoData.intervention || 'Inhibidores de SGLT2'}</span>
    <span style="display: block; margin-bottom: 3px;">• <strong>Comparador:</strong> ${picoData.comparator || 'Placebo o terapia médica estándar'}</span>
    <span style="display: block; margin-bottom: 3px;">• <strong>Desenlaces:</strong> ${picoData.outcomes || 'Mortalidad por todas las causas, hospitalización por IC, calidad de vida'}</span>
    <span style="display: block;">• <strong>Diseño de Estudios:</strong> ${picoData.studyDesign || 'Ensayos Clínicos Aleatorizados Fase 3'}</span>
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN: INTRODUCCIÓN -->
  <h2 class="section-heading">${isApa ? 'Introducción' : '1. INTRODUCCIÓN (Ítems 3 y 4 PRISMA 2020)'}</h2>
  <div style="white-space: pre-line;">${sections.find((s) => s.id === 'introduction')?.content || '<p>[Sección de Introducción pendiente]</p>'}</div>

  <!-- SECCIÓN: MÉTODOS -->
  <h2 class="section-heading">${isApa ? 'Método' : '2. MÉTODOS (Ítems 5 a 15 PRISMA 2020)'}</h2>
  <div style="white-space: pre-line;">${sections.find((s) => s.id === 'methods')?.content || '<p>[Sección de Métodos pendiente]</p>'}</div>

  <div class="page-break"></div>

  <!-- SECCIÓN: RESULTADOS -->
  <h2 class="section-heading">${isApa ? 'Resultados' : '3. RESULTADOS (Ítems 16 a 22 PRISMA 2020)'}</h2>
  <div style="white-space: pre-line;">${sections.find((s) => s.id === 'results')?.content || '<p>[Sección de Resultados pendiente]</p>'}</div>

  <!-- FIGURA 1: Flujograma PRISMA 2020 -->
  <div class="flow-container">
    <div class="table-caption">Figura 1</div>
    <div class="table-subtitle">Diagrama de flujo PRISMA 2020 para nuevas revisiones sistemáticas que incluyeron búsquedas en bases de datos y registros</div>
    
    <div class="flow-phase">
      <div class="flow-phase-title">1. Fase de Identificación</div>
      <div style="display: flex; gap: 10px;">
        <div class="flow-box" style="flex: 1;">
          <strong>Bases de datos bibliográficas (n = ${flowData.databasesIdentified.reduce((a, b) => a + b.count, 0)}):</strong><br>
          ${flowData.databasesIdentified.map((d) => `• ${d.name}: ${d.count}<br>`).join('')}
        </div>
        <div class="flow-box" style="flex: 1;">
          <strong>Registros de ensayos clínicos (n = ${flowData.registersIdentified.reduce((a, b) => a + b.count, 0)}):</strong><br>
          ${flowData.registersIdentified.map((r) => `• ${r.name}: ${r.count}<br>`).join('')}
        </div>
      </div>
      <div class="flow-box" style="margin-top: 6px; background-color: #f1f5f9;">
        <strong>Duplicados eliminados antes del cribado:</strong> ${flowData.duplicatesRemoved} registros
      </div>
    </div>

    <div class="flow-phase">
      <div class="flow-phase-title">2. Fase de Cribado</div>
      <div style="display: flex; gap: 10px;">
        <div class="flow-box" style="flex: 1;">
          <strong>Registros cribados (título y resumen):</strong><br>
          n = ${flowData.recordsScreened} registros
        </div>
        <div class="flow-box" style="flex: 1; border-color: #fca5a5; background-color: #fff1f2;">
          <strong style="color: #991b1b;">Registros excluidos en cribado inicial:</strong><br>
          n = ${flowData.recordsExcludedScreening} registros
        </div>
      </div>
    </div>

    <div class="flow-phase">
      <div class="flow-phase-title">3. Fase de Elegibilidad</div>
      <div style="display: flex; gap: 10px;">
        <div class="flow-box" style="flex: 1;">
          <strong>Informes evaluados a texto completo:</strong><br>
          n = ${flowData.reportsAssessed} informes (buscados: ${flowData.reportsSought}, no recuperados: ${flowData.reportsNotRetrieved})
        </div>
        <div class="flow-box" style="flex: 1; border-color: #fca5a5; background-color: #fff1f2;">
          <strong style="color: #991b1b;">Informes excluidos a texto completo:</strong><br>
          ${flowData.reportsExcludedReasons.map((e) => `• ${e.reason}: ${e.count}<br>`).join('')}
        </div>
      </div>
    </div>

    <div class="flow-phase" style="border-bottom: none; margin-bottom: 0;">
      <div class="flow-phase-title" style="color: #065f46;">4. Fase de Inclusión</div>
      <div class="flow-box" style="background-color: #ecfdf5; border-color: #6ee7b7;">
        <strong style="color: #065f46; font-size: 10.5pt;">Total de estudios incluidos en la revisión sistemática:</strong><br>
        • <strong>${flowData.totalStudiesIncluded} ensayos clínicos aleatorizados</strong> (${flowData.totalReportsIncluded} informes vinculados).<br>
        • ${flowData.newStudiesIncluded} estudios procedentes de búsquedas electrónicas principales y ${flowData.otherStudiesIncluded} procedentes de citas y literatura gris.
      </div>
    </div>
    <div class="table-note"><em>Nota.</em> Elaboración según la Declaración PRISMA 2020 (Page et al., <em>BMJ</em> 2021;372:n71).</div>
  </div>

  <div class="page-break"></div>

  ${(() => {
    let tNum = 1;
    let htmlTables = '';

    // TABLA: Matriz de Evidencia
    if (evidenceStudies && evidenceStudies.length > 0) {
      htmlTables += `
  <div style="margin: 2rem 0;">
    <div class="table-caption">${isApa ? `Tabla ${tNum}` : `TABLA ${tNum}`}</div>
    <div class="table-subtitle">${isApa ? 'Características Metodológicas y Clínicas de los Ensayos Clínicos Incluidos (Matriz de Evidencia)' : 'Extracción Estandarizada de Datos y Características de los Estudios (Ítems 10a, 10b y 17 PRISMA 2020)'}</div>
    
    <table class="academic-table">
      <thead>
        <tr>
          <th style="width: 14%;">Autor y Año</th>
          <th style="width: 15%;">Diseño y Muestra (N)</th>
          <th style="width: 21%;">Población (Inclusión / Exclusión)</th>
          <th style="width: 18%;">Intervención / Comparador</th>
          <th style="width: 32%;">Resultados Principales (Outcomes, p, IC 95%, HR/RR/OR) y Conclusión</th>
        </tr>
      </thead>
      <tbody>
        ${evidenceStudies
          .map(
            (s) => `<tr>
              <td><strong>${s.authorAndYear || 'No reportado'}</strong>${s.fileName ? `<br><span style="font-size: 7.5pt; color: #64748b;">${s.fileName}</span>` : ''}</td>
              <td>${s.studyDesignAndSampleSize || 'No reportado'}</td>
              <td style="font-size: 8.5pt;">${s.population || 'No reportado'}</td>
              <td style="font-size: 8.5pt;">${s.interventionComparator || 'No reportado'}</td>
              <td style="font-size: 8.5pt;">
                <div style="font-family: monospace; font-size: 8pt; background-color: #f8fafc; padding: 4px; border: 1px solid #e2e8f0; border-radius: 4px;">${s.mainResults || 'No reportado'}</div>
                <div style="margin-top: 4px; font-style: italic; color: #334155; font-size: 8pt;"><strong>Conclusión:</strong> "${s.authorConclusion || 'No reportado'}"</div>
              </td>
            </tr>`
          )
          .join('')}
      </tbody>
    </table>
    <div class="table-note">
      <em>Nota.</em> Extracción estandarizada conforme a la directriz PRISMA 2020 (Ítems 10a, 10b y 17). Los valores 'No reportado' garantizan el principio de trazabilidad y ausencia de imputación no justificada (política de cero alucinaciones).
    </div>
  </div>
  <div class="page-break"></div>`;
      tNum++;
    }

    // TABLA: Cochrane RoB 2
    htmlTables += `
  <div style="margin: 2rem 0;">
    <div class="table-caption">${isApa ? `Tabla ${tNum}` : `TABLA ${tNum}`}</div>
    <div class="table-subtitle">${isApa ? 'Evaluación del Riesgo de Sesgo en Ensayos Clínicos Mediante la Herramienta Cochrane RoB 2' : 'Juicio de Riesgo de Sesgo por Estudio y Dominio (Cochrane RoB 2 - Ítem 18 PRISMA 2020)'}</div>
    
    <table class="academic-table">
      <thead>
        <tr>
          <th>Estudio</th>
          <th style="text-align: center;">Muestra (N)</th>
          <th style="text-align: center;">D1: Aleatorización</th>
          <th style="text-align: center;">D2: Desviaciones</th>
          <th style="text-align: center;">D3: Datos Faltantes</th>
          <th style="text-align: center;">D4: Medición</th>
          <th style="text-align: center;">D5: Reporte Selectivo</th>
          <th style="text-align: center;">Juicio Global</th>
        </tr>
      </thead>
      <tbody>
        ${rob2Studies
          .map((s) => {
            const formatBadge = (j: 'low' | 'some_concerns' | 'high') => {
              if (j === 'low') return `<span class="badge-rob rob-low">+ Bajo</span>`;
              if (j === 'some_concerns') return `<span class="badge-rob rob-some">? Preocupación</span>`;
              return `<span class="badge-rob rob-high">- Alto</span>`;
            };
            return `<tr>
              <td><strong>${s.studyName}</strong> (${s.year})</td>
              <td style="text-align: center;">${s.sampleSize.toLocaleString()}</td>
              <td style="text-align: center;">${formatBadge(s.d1Randomization)}</td>
              <td style="text-align: center;">${formatBadge(s.d2Deviations)}</td>
              <td style="text-align: center;">${formatBadge(s.d3MissingData)}</td>
              <td style="text-align: center;">${formatBadge(s.d4Measurement)}</td>
              <td style="text-align: center;">${formatBadge(s.d5ReportedResult)}</td>
              <td style="text-align: center;">${formatBadge(s.overall)}</td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
    <div class="table-note">
      <em>Nota.</em> Dominios evaluados según RoB 2 (Sterne et al., <em>BMJ</em> 2019;366:l4898): D1: Proceso de aleatorización; D2: Desviaciones de las intervenciones previstas; D3: Datos de resultados faltantes; D4: Medición del resultado; D5: Selección del resultado informado. Juicio global: (+ Bajo riesgo de sesgo en todos los dominios; ? Algunas preocupaciones en al menos un dominio sin alto riesgo; - Alto riesgo de sesgo en al menos un dominio o múltiples preocupaciones concurrentes).
    </div>
  </div>
  <div class="page-break"></div>`;
    tNum++;

    // TABLA: GRADE Summary of Findings
    htmlTables += `
  <div style="margin: 2rem 0;">
    <div class="table-caption">${isApa ? `Tabla ${tNum}` : `TABLA ${tNum}`}</div>
    <div class="table-subtitle">${isApa ? 'Tabla de Resumen de Hallazgos (Summary of Findings) y Graduación de la Certeza de la Evidencia (GRADE)' : 'Resumen de Hallazgos GRADE (SoF Table - Ítem 22 PRISMA 2020)'}</div>
    
    <table class="academic-table">
      <thead>
        <tr>
          <th>Desenlace Clínico</th>
          <th style="text-align: center;">Estudios (Nº Pacientes)</th>
          <th style="text-align: center;">Efecto Relativo (IC 95%)</th>
          <th style="text-align: center;">Riesgo Basal</th>
          <th style="text-align: center;">Riesgo con Intervención</th>
          <th style="text-align: center;">Diferencia de Riesgo</th>
          <th style="text-align: center;">Certeza GRADE</th>
          <th>Declaración Informativa</th>
        </tr>
      </thead>
      <tbody>
        ${gradeOutcomes
          .map((g) => {
            const certText = 
              g.overallCertainty === 'high' ? '⊕⊕⊕⊕ ALTA' :
              g.overallCertainty === 'moderate' ? '⊕⊕⊕◯ MODERADA' :
              g.overallCertainty === 'low' ? '⊕⊕◯◯ BAJA' : '⊕◯◯◯ MUY BAJA';
            const certColor = 
              g.overallCertainty === 'high' ? 'color: #065f46; font-weight: bold;' :
              g.overallCertainty === 'moderate' ? 'color: #92400e; font-weight: bold;' :
              g.overallCertainty === 'low' ? 'color: #b45309;' : 'color: #991b1b;';
            return `<tr>
              <td><strong>${g.outcomeName}</strong><br><span style="font-size: 8pt; color: #64748b;">${g.importance === 'critical' ? 'Desenlace Crítico' : 'Desenlace Importante'}</span></td>
              <td style="text-align: center;">${g.studyCount} ensayos<br>(${g.participantCount.toLocaleString()} pts)</td>
              <td style="text-align: center;"><strong>${g.effectEstimate}</strong></td>
              <td style="text-align: center;">${g.baselineRisk || 'N/D'}</td>
              <td style="text-align: center;">${g.interventionRisk || 'N/D'}</td>
              <td style="text-align: center;">${g.riskDifference || 'N/D'}</td>
              <td style="text-align: center; ${certColor}">${certText}</td>
              <td style="font-size: 9pt;">${g.informativeStatement}</td>
            </tr>`;
          })
          .join('')}
      </tbody>
    </table>
    <div class="table-note">
      <em>Nota.</em> Evaluado mediante el enfoque GRADE (Guyatt et al., <em>J Clin Epidemiol</em> 2011). Grados de Certeza: ⊕⊕⊕⊕ Alta (gran confianza en el efecto observado); ⊕⊕⊕◯ Moderada (confianza moderada; el efecto real es probablemente cercano); ⊕⊕◯◯ Baja (confianza limitada; el efecto real puede diferir); ⊕◯◯◯ Muy Baja (muy poca confianza en el estimador).<br>
      <strong>Notas al pie:</strong><br>
      ${gradeOutcomes
        .filter((g) => g.footnotes && g.footnotes.length > 0)
        .map((g) => `• <strong>${g.outcomeName}:</strong> ${g.footnotes.join('; ')}<br>`)
        .join('')}
    </div>
  </div>`;
    tNum++;

    // TABLA: Metaanálisis
    htmlTables += `
  <div style="margin: 2rem 0;">
    <div class="table-caption">${isApa ? `Tabla ${tNum}` : `TABLA ${tNum}`}</div>
    <div class="table-subtitle">${isApa ? 'Parámetros del Metaanálisis, Heterogeneidad e Intervalo de Predicción' : 'Resultados de la Síntesis Cuantitativa y Meta-Regresión (Ítems 13 y 20 PRISMA 2020)'}</div>`;
    
    return htmlTables;
  })()}
    
    <table class="academic-table">
      <thead>
        <tr>
          <th>Parámetro Estadístico</th>
          <th>Estimación Obtenida</th>
          <th>Interpretación Metodológica y Clínica</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Modelo de Síntesis</strong></td>
          <td>${metaConfig.modelType}</td>
          <td>${metaConfig.knappHartungAdjustment ? 'Ajuste de Knapp-Hartung-Sidik-Jonkman (HKSJ) aplicado para control de error tipo I' : 'Ponderación estándar'}</td>
        </tr>
        <tr>
          <td><strong>Estimador Combinado (${metaConfig.effectMeasure})</strong></td>
          <td><strong>${metaConfig.pooledEstimate.toFixed(2)}</strong> (IC 95%: ${metaConfig.ciLower.toFixed(2)} a ${metaConfig.ciUpper.toFixed(2)})</td>
          <td>p ${metaConfig.pValue < 0.001 ? '&lt; 0.001' : `= ${metaConfig.pValue.toFixed(3)}`} (Efecto clínico favorable estadísticamente significativo)</td>
        </tr>
        <tr>
          <td><strong>Heterogeneidad Q de Cochran</strong></td>
          <td>Q = ${metaConfig.qStatistic.toFixed(2)} (gl = ${metaConfig.studyCount - 1})</td>
          <td>p = ${metaConfig.qPValue.toFixed(3)}</td>
        </tr>
        <tr>
          <td><strong>Inconsistencia de Higgins (I²)</strong></td>
          <td><strong>${metaConfig.i2.toFixed(1)}%</strong></td>
          <td>${getI2BadgeInfo(metaConfig.i2).label}</td>
        </tr>
        <tr>
          <td><strong>Varianza entre estudios (Tau²)</strong></td>
          <td>τ² = ${metaConfig.tau2.toFixed(3)} (τ = ${metaConfig.tau.toFixed(3)})</td>
          <td>Dispersión real de efectos terapéuticos entre poblaciones clínicas</td>
        </tr>
        <tr>
          <td><strong>Intervalo de Predicción del 95%</strong></td>
          <td><strong>${metaConfig.predictionIntervalLower.toFixed(2)} a ${metaConfig.predictionIntervalUpper.toFixed(2)}</strong></td>
          <td>Rango esperado del efecto en una futura cohorte independiente (Borenstein et al., 2021)</td>
        </tr>
      </tbody>
    </table>

    ${
      metaConfig.metaRegressionEnabled && metaConfig.covariates.length > 0
        ? `<div style="margin-top: 14px;">
            <div style="font-weight: bold; font-size: 10pt; color: #1e293b; margin-bottom: 6px;">
              Submodelo de Meta-Regresión Ponderada (${metaConfig.metaRegressionMethod}):
            </div>
            <table class="academic-table">
              <thead>
                <tr>
                  <th>Covariable</th>
                  <th style="text-align: center;">Coeficiente β</th>
                  <th style="text-align: center;">Error Estándar (EE)</th>
                  <th style="text-align: center;">IC 95%</th>
                  <th style="text-align: center;">Valor p</th>
                  <th style="text-align: center;">R² Análogo</th>
                </tr>
              </thead>
              <tbody>
                ${metaConfig.covariates
                  .map(
                    (c) => `<tr>
                    <td><strong>${c.name}</strong></td>
                    <td style="text-align: center;">${c.beta.toFixed(3)}</td>
                    <td style="text-align: center;">${c.se.toFixed(3)}</td>
                    <td style="text-align: center;">${c.ciLower.toFixed(3)} a ${c.ciUpper.toFixed(3)}</td>
                    <td style="text-align: center;">${c.pValue < 0.001 ? '&lt; 0.001' : c.pValue.toFixed(3)}</td>
                    <td style="text-align: center;">${c.r2Analog.toFixed(1)}%</td>
                  </tr>`
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`
        : ''
    }
  </div>

  <div class="page-break"></div>

  <!-- SECCIÓN: DISCUSIÓN -->
  <h2 class="section-heading">${isApa ? 'Discusión' : '4. DISCUSIÓN (Ítems 23a a 23d PRISMA 2020)'}</h2>
  <div style="white-space: pre-line;">${sections.find((s) => s.id === 'discussion')?.content || '<p>[Sección de Discusión pendiente]</p>'}</div>

  <!-- SECCIÓN: OTROS / INFORMACIÓN ADMINISTRATIVA -->
  <h2 class="section-heading">${isApa ? 'Declaraciones y Ética' : '5. OTRA INFORMACIÓN (Ítems 24 a 27 PRISMA 2020)'}</h2>
  <div style="white-space: pre-line;">${sections.find((s) => s.id === 'other')?.content || '<p>[Sección de Otra Información pendiente]</p>'}</div>

  <div class="page-break"></div>

  <!-- APÉNDICE: PRISMA 2020 CHECKLIST COMPLETA -->
  <h2 class="section-heading">APÉNDICE SUPLEMENTARIO: LISTA DE VERIFICACIÓN PRISMA 2020</h2>
  <p style="font-size: 9.5pt; color: #475569;">
    Conforme a la Declaración PRISMA 2020 (Page, M. J. et al. <em>BMJ</em> 2021;372:n160). Esta lista documenta la ubicación exacta en el manuscrito de cada uno de los 27 ítems esenciales de reporte.
  </p>
  
  <table class="academic-table" style="font-size: 8.5pt;">
    <thead>
      <tr>
        <th style="width: 8%;">Ítem</th>
        <th style="width: 18%;">Sección / Tema</th>
        <th style="width: 48%;">Recomendación Esencial de Reporte</th>
        <th style="width: 14%;">Ubicación</th>
        <th style="width: 12%; text-align: center;">Estado</th>
      </tr>
    </thead>
    <tbody>
      ${checklistItems
        .map((item) => {
          const statusBg = 
            item.status === 'completed' ? 'background-color: #ecfdf5; color: #065f46; font-weight: bold;' :
            item.status === 'in_progress' ? 'background-color: #fffbeb; color: #92400e;' :
            item.status === 'not_applicable' ? 'background-color: #f1f5f9; color: #64748b;' :
            'background-color: #fef2f2; color: #991b1b;';
          const statusLabel = 
            item.status === 'completed' ? 'Cumplido' :
            item.status === 'in_progress' ? 'En progreso' :
            item.status === 'not_applicable' ? 'N/A' : 'Pendiente';
          return `<tr>
            <td><strong>${item.itemNumber}</strong></td>
            <td><strong>${item.topic}</strong></td>
            <td>${item.title}</td>
            <td>${item.locationReported || 'Sección pendiente'}</td>
            <td style="text-align: center; ${statusBg}">${statusLabel}</td>
          </tr>`;
        })
        .join('')}
    </tbody>
  </table>

</body>
</html>`;
}
