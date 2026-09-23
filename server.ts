import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Helper to get GoogleGenAI client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_INSTRUCTION = `Eres un asistente experto en metodología de investigación clínica y revisiones sistemáticas, especializado en la declaración PRISMA 2020 (Preferred Reporting Items for Systematic Reviews and Meta-Analyses). Tu objetivo es guiar al usuario y redactar secciones académicas rigurosas.

Para cada interacción, sigue estas pautas metodológicas estrictas:
1. Estructura PICO: Garantiza que los criterios de inclusión y exclusión estén formulados bajo el marco PICO/PECO (Población, Intervención, Comparador, Resultados/Outcomes).
2. Rigor de Directriz: Aplica la lista de verificación PRISMA 2020 (27 ítems) en cada una de las secciones generadas.
3. Tono Académico: Utiliza un lenguaje científico formal, impersonal y preciso (adaptado a norma APA 7 o la revista de destino médica/biomédica).
4. Redacción Modular: No redactes el documento completo de una sola vez. Trabaja sección por sección previa confirmación del usuario:
   - Título y Resumen estructurado (siguiendo PRISMA-A de 12 ítems)
   - Introducción (Justificación científica y Objetivos PICO)
   - Métodos (Estrategias de búsqueda booleanas, criterios de elegibilidad, proceso de selección, extracción de datos y herramientas de riesgo de sesgo como RoB 2, ROBINS-I o Newcastle-Ottawa, síntesis y certeza GRADE)
   - Resultados (Estructuración para el Diagrama de Flujo PRISMA 2020, características de los estudios Tabla 1 y síntesis narrativa o cuantitativa)
   - Discusión, Limitaciones del cuerpo de evidencia y Conclusiones.
5. Control de Datos: No inventes citas ni resultados numéricos (cero alucinaciones). Si faltan datos clave para cumplir con PRISMA (ej. fecha de última búsqueda, número de revisores independientes, nombres de bases consultadas, medidas de heterogeneidad I² o tamaños muestrales), solicítalos explícitamente antes de redactar o indícalos con etiquetas claras de marcador de posición como [PENDIENTE: indicar fecha de corte de búsqueda]. Asegúrate de mantener la trazabilidad de la información en todo momento.

Responde siempre en español formal científico (o en el idioma que el usuario emplee), estructurando las respuestas con claridad, rigor metodológico y encabezados académicos.`;

// API routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Chat endpoint with PRISMA 2020 expert persona
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, picoContext, currentSection } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // Fallback response if API key is not yet set
      return res.json({
        reply: `Como asistente metodológico especializado en **PRISMA 2020** y el marco **PICO**, estoy listo para asistirte en cada fase de tu revisión sistemática.

*(Nota: Para habilitar el procesamiento en tiempo real con Gemini, configura tu GEMINI_API_KEY en el panel de Secrets)*.

### Pautas operativas activas:
1. **Marco PICO**: Verificamos población, intervención, comparador y desenlaces clínicos.
2. **27 Ítems PRISMA 2020**: Monitoreo de cumplimiento de cada recomendación esencial.
3. **Redacción Modular**: Progresamos sección a sección con tu validación previa.
4. **Control Estricto de Datos**: Cero alucinaciones; se marcará cualquier dato numérico o metodológico pendiente.

¿Cuál es el tema de tu revisión sistemática y qué pregunta clínica PICO deseas plantear?`,
      });
    }

    // Build context
    let contextPrompt = '';
    if (picoContext) {
      contextPrompt += `\n[CONTEXTO PICO ACTUAL DEL PROYECTO:
- Población: ${picoContext.population || 'No definida aún'}
- Intervención/Exposición: ${picoContext.intervention || 'No definida aún'}
- Comparador: ${picoContext.comparator || 'No definido aún'}
- Desenlaces (Outcomes): ${picoContext.outcomes || 'No definidos aún'}
- Diseño de estudios: ${picoContext.studyDesign || 'No especificado'}
- Horizonte temporal: ${picoContext.timeframe || 'No especificado'}
- Pregunta clínica: ${picoContext.clinicalQuestion || 'No formulada'}
- Sección activa de trabajo: ${currentSection || 'General'}
]\n`;
    }

    // Prepare contents for Gemini
    const contents: any[] = [];
    if (Array.isArray(messages) && messages.length > 0) {
      for (const m of messages) {
        contents.push({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        });
      }
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: 'Inicia la orientación metodológica para mi revisión sistemática bajo PRISMA 2020.' }],
      });
    }

    // Prepend context to the last user message
    if (contents.length > 0) {
      const lastIndex = contents.length - 1;
      const lastText = contents[lastIndex].parts[0].text;
      contents[lastIndex].parts[0].text = contextPrompt ? `${contextPrompt}\n\n${lastText}` : lastText;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2, // Low temperature for high academic precision and zero hallucination
      },
    });

    const reply = response.text || 'No se pudo generar la respuesta.';
    res.json({ reply });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({
      error: error.message || 'Error en el servidor al procesar la solicitud.',
      reply: 'Ocurrió un error al contactar el servicio metodológico. Por favor, verifica tu conexión y clave API.',
    });
  }
});

// Draft specific section endpoint
app.post('/api/draft-section', async (req, res) => {
  try {
    const { sectionKey, picoData, currentContent, userInstructions } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY no configurada. Añádela en Settings > Secrets.',
      });
    }

    const draftPrompt = `Actúa como redactor científico metodólogo experto en PRISMA 2020.
Genera la propuesta de redacción formal para la sección: "${sectionKey}".
Contexto PICO de la investigación:
- Población: ${picoData?.population || 'Pendiente de definir'}
- Intervención: ${picoData?.intervention || 'Pendiente de definir'}
- Comparador: ${picoData?.comparator || 'Pendiente de definir'}
- Desenlaces: ${picoData?.outcomes || 'Pendiente de definir'}
- Diseño de estudios: ${picoData?.studyDesign || 'Ensayos Clínicos Aleatorizados'}
- Horizonte temporal: ${picoData?.timeframe || 'No especificado'}
- Pregunta clínica: ${picoData?.clinicalQuestion || 'No formulada'}

Instrucciones adicionales del usuario:
${userInstructions || 'Redacta siguiendo estrictamente los ítems PRISMA 2020 aplicables a esta sección.'}

Contenido previo existente (si lo hay):
${currentContent || 'Ninguno'}

REGLAS CRÍTICAS DE CONTROL DE DATOS Y PRISMA 2020:
1. No inventes datos estadísticos numéricos (como p-valores, intervalos de confianza o porcentajes de heterogeneidad específicos) si no han sido provistos. Usa marcadores explícitos: [PENDIENTE: insertar valor de I²], [PENDIENTE: n total de pacientes], [PENDIENTE: fecha exacta de búsqueda].
2. Aplica rigurosamente los ítems correspondientes a esta sección.
3. Emplea tono científico formal, voz impersonal ("Se realizó...", "Se consideraron...") adaptado a directrices de revistas biomédicas y norma APA 7.
4. Incluye al final una breve lista de verificación de "Datos requeridos del investigador" para completar la trazabilidad.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: draftPrompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      },
    });

    res.json({ text: response.text || '' });
  } catch (error: any) {
    console.error('Error in /api/draft-section:', error);
    res.status(500).json({ error: error.message || 'Error al redactar la sección.' });
  }
});

// Generate Boolean search strategies according to PRISMA 2020 Item 7
app.post('/api/generate-search-strategy', async (req, res) => {
  try {
    const { picoData, databases } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY no configurada.' });
    }

    const prompt = `Como especialista en búsquedas bibliográficas médicas (Information Specialist) siguiendo PRISMA 2020 Ítem 7 y la directriz PRISMA-S:
Diseña una estrategia de búsqueda booleana rigurosa y completa basada en los siguientes componentes PICO:
- Población: ${picoData?.population}
- Intervención: ${picoData?.intervention}
- Comparador (si aplica para la búsqueda): ${picoData?.comparator}
- Desenlaces clave: ${picoData?.outcomes}
- Tipos de estudio: ${picoData?.studyDesign}

Bases de datos solicitadas: ${databases ? databases.join(', ') : 'PubMed/MEDLINE, Embase, Cochrane CENTRAL'}.

Para cada base de datos:
1. Proporciona la sintaxis exacta línea por línea utilizando tesauros (MeSH con [Mesh], Emtree con /exp), descriptores de texto libre con truncamientos (*), campos de título/resumen ([tiab], :ti,ab).
2. Muestra los bloques conceptuales combinados con OR dentro de cada concepto, y unidos con AND entre conceptos.
3. Aplica los filtros metodológicos validados adecuados (ej. filtro de ensayos clínicos de Cochrane).
4. Explica brevemente las decisiones de indexación y cómo se recomienda someterla a revisión por pares mediante la lista de verificación PRESS (Peer Review of Electronic Search Strategies).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    res.json({ strategy: response.text || '' });
  } catch (error: any) {
    console.error('Error in /api/generate-search-strategy:', error);
    res.status(500).json({ error: error.message || 'Error al generar la estrategia de búsqueda.' });
  }
});

// Audit drafted text against PRISMA 2020 items
app.post('/api/audit-checklist', async (req, res) => {
  try {
    const { sectionName, sectionText, prismaItemNumbers } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ error: 'GEMINI_API_KEY no configurada.' });
    }

    const prompt = `Realiza una auditoría metodológica experta de calidad según la directriz PRISMA 2020 para la sección "${sectionName}".
Ítems PRISMA a evaluar: ${prismaItemNumbers ? prismaItemNumbers.join(', ') : 'Todos los aplicables'}.

Texto redactado por el usuario:
"""
${sectionText}
"""

Evalúa con el máximo rigor académico:
1. **Cumplimiento por Ítem**: Indica si cada ítem PRISMA está "Cumplido", "Parcialmente cumplido" o "No reportado / Ausente".
2. **Elementos esenciales omitidos**: Señala qué elementos específicos de la directriz PRISMA 2020 faltan (ej. falta indicar fecha de búsqueda, falta especificar si los revisores fueron independientes en el cribado, falta describir el método de resolución de discrepancias, o falta definir umbrales de relevancia clínica).
3. **Control de sesgos y alucinaciones**: Revisa si existen afirmaciones sin trazabilidad o datos no justificados.
4. **Recomendaciones de corrección**: Sugiere exactamente qué frases o párrafos incorporar para superar la revisión por pares de una revista de alto impacto (Q1/Q2).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
      },
    });

    res.json({ audit: response.text || '' });
  } catch (error: any) {
    console.error('Error in /api/audit-checklist:', error);
    res.status(500).json({ error: error.message || 'Error al auditar el cumplimiento PRISMA.' });
  }
});

// Standardized Evidence Extraction from PDF (PRISMA 2020 Items 10a, 10b, 17)
app.post('/api/extract-pdf-matrix', async (req, res) => {
  try {
    const { fileBase64, fileName, mimeType, articleText, picoContext } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({ 
        error: 'GEMINI_API_KEY no configurada. Añádela en Settings > Secrets para extraer datos automáticamente con IA.' 
      });
    }

    if (!fileBase64 && !articleText) {
      return res.status(400).json({ 
        error: 'Debe adjuntar un archivo PDF o ingresar el texto del artículo para realizar la extracción.' 
      });
    }

    // Build extraction instructions
    const promptText = `Actúa como metodólogo senior de revisiones sistemáticas PRISMA 2020 y especialista en extracción estandarizada de datos clínicos (Ítems 10a, 10b y 17 de PRISMA 2020).

Analiza rigurosamente el documento científico adjunto y extrae los 6 elementos clave para la Matriz de Evidencia estandarizada:
1. **Autor y Año**: Primer autor et al. y año de publicación (ej. "McMurray et al., 2019" o "Packer et al., 2020").
2. **Diseño del estudio y tamaño de la muestra ($N$)**: Tipo de diseño metodológico exacto (ej. "Ensayo clínico aleatorizado, doble ciego, controlado con placebo, multicéntrico") y tamaño de la muestra total analizado ($N = X,XXX$).
3. **Población (Criterios de inclusión/exclusión)**: Características demográficas y clínicas clave, criterios principales de inclusión (diagnóstico, estadios, marcadores clínicos) y criterios principales de exclusión (pérdidas funcionales, comorbilidades graves, contraindicaciones).
4. **Intervención / Comparador**: Intervención activa (dosis, posología y frecuencia) frente al comparador (placebo o fármaco control), indicando si se administra sobre tratamiento estándar.
5. **Resultados principales (Outcomes primarios con sus valores estadísticos)**: Desenlaces primarios con valores numéricos y medidas de efecto completas (Hazard Ratio HR, Risk Ratio RR, Odds Ratio OR o diferencias de medias MD con sus respectivos IC 95% y valores de p exactos).
6. **Conclusión principal del autor**: Síntesis directa de la conclusión expresada por los investigadores respecto al desenlace primario.

REGLA CRÍTICA DE CONTROL DE DATOS Y CERO ALUCINACIONES:
Si algún dato específico (diseño, N muestral, dosis, valor p, IC 95% o criterio de exclusión) no está explícito en el texto del artículo, indica obligatoriamente "No reportado". Jamás inventes estimadores de efecto ni cifras estadísticas.

${picoContext ? `Contexto PICO de referencia:
- Población buscada: ${picoContext.population || 'No definida'}
- Intervención: ${picoContext.intervention || 'No definida'}
- Comparador: ${picoContext.comparator || 'No definido'}
- Desenlaces de interés: ${picoContext.outcomes || 'No definidos'}` : ''}`;

    const parts: any[] = [];

    if (fileBase64) {
      const cleanBase64 = fileBase64.includes(';base64,')
        ? fileBase64.split(';base64,')[1]
        : fileBase64;

      parts.push({
        inlineData: {
          mimeType: mimeType || 'application/pdf',
          data: cleanBase64,
        },
      });
    }

    if (articleText) {
      parts.push({
        text: `[TEXTO / RESUMEN DEL ARTÍCULO CIENTÍFICO PROPORCIONADO]:\n${articleText}`,
      });
    }

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1, // High deterministic precision
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            authorAndYear: {
              type: Type.STRING,
              description: 'Autor y Año del artículo, ej. "McMurray et al., 2019". Si no se indica, "No reportado".',
            },
            studyDesignAndSampleSize: {
              type: Type.STRING,
              description: 'Diseño del estudio y tamaño de la muestra (N), ej. "Ensayo clínico aleatorizado, doble ciego (N = 4,744)". Si no se indica, "No reportado".',
            },
            population: {
              type: Type.STRING,
              description: 'Población con criterios de inclusión y exclusión. Si falta, indicar "No reportado".',
            },
            interventionComparator: {
              type: Type.STRING,
              description: 'Intervención activa y comparador con dosis. Si falta, indicar "No reportado".',
            },
            mainResults: {
              type: Type.STRING,
              description: 'Resultados principales con valores estadísticos: p, IC 95%, OR/RR/HR. Si falta, indicar "No reportado".',
            },
            authorConclusion: {
              type: Type.STRING,
              description: 'Conclusión principal del autor. Si falta, indicar "No reportado".',
            },
          },
          required: [
            'authorAndYear',
            'studyDesignAndSampleSize',
            'population',
            'interventionComparator',
            'mainResults',
            'authorConclusion',
          ],
        },
      },
    });

    const rawJsonText = response.text || '{}';
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(rawJsonText);
    } catch (parseErr) {
      console.error('Failed to parse Gemini JSON output:', parseErr, rawJsonText);
      parsedData = {
        authorAndYear: 'No reportado',
        studyDesignAndSampleSize: 'No reportado',
        population: 'No reportado',
        interventionComparator: 'No reportado',
        mainResults: 'No reportado',
        authorConclusion: 'No reportado',
      };
    }

    const record = {
      id: `study-${Date.now()}`,
      fileName: fileName || 'Artículo_PDF_Extraído.pdf',
      authorAndYear: parsedData.authorAndYear || 'No reportado',
      studyDesignAndSampleSize: parsedData.studyDesignAndSampleSize || 'No reportado',
      population: parsedData.population || 'No reportado',
      interventionComparator: parsedData.interventionComparator || 'No reportado',
      mainResults: parsedData.mainResults || 'No reportado',
      authorConclusion: parsedData.authorConclusion || 'No reportado',
      isExtractedWithAi: true,
      extractedAt: new Date().toISOString(),
    };

    // Construct Markdown table row
    const markdownRow = `| **${record.authorAndYear}** | ${record.studyDesignAndSampleSize} | ${record.population} | ${record.interventionComparator} | ${record.mainResults} | ${record.authorConclusion} |`;

    res.json({
      success: true,
      record,
      markdownRow,
    });
  } catch (error: any) {
    console.error('Error in /api/extract-pdf-matrix:', error);
    res.status(500).json({ 
      error: error.message || 'Error al procesar el archivo PDF o extraer los datos del estudio.' 
    });
  }
});

// Identify, Harmonize & Compare Outcomes / Variables (PRISMA 2020 Items 10b, 13a, 17)
app.post('/api/identify-outcomes', async (req, res) => {
  try {
    const { picoContext, evidenceStudies, customQuery } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: 'GEMINI_API_KEY no configurada. Añádela en Settings > Secrets para identificar y armonizar variables automáticamente con IA.',
      });
    }

    const studiesSummary = Array.isArray(evidenceStudies)
      ? evidenceStudies
          .map(
            (s: any, idx: number) =>
              `[ESTUDIO ${idx + 1}]:
- Autor y Año: ${s.authorAndYear}
- Muestra y Diseño: ${s.studyDesignAndSampleSize}
- Población: ${s.population}
- Intervención y Control: ${s.interventionComparator}
- Resultados Reportados: ${s.mainResults}
- Conclusión: ${s.authorConclusion}`
          )
          .join('\n\n')
      : 'No se suministraron estudios en la matriz de evidencia.';

    const promptText = `Eres un epidemiólogo clínico y metodólogo senior especializado en síntesis de evidencia bajo PRISMA 2020 y directrices Cochrane.
Tu misión es actuar como IDENTIFICADOR, ARMONIZADOR Y ANALIZADOR DE DESENLACES (OUTCOMES) Y VARIABLES CLÍNICAS comparables entre estudios primarios.

Contexto PICO del proyecto:
- Población: ${picoContext?.population || 'No especificada'}
- Intervención: ${picoContext?.intervention || 'No especificada'}
- Comparador: ${picoContext?.comparator || 'No especificado'}
- Desenlaces de interés preespecificados: ${picoContext?.outcomes || 'No especificados'}
- Pregunta clínica: ${picoContext?.clinicalQuestion || 'No formulada'}

${customQuery ? `Instrucción / Foco específico del usuario: "${customQuery}"\n` : ''}

Estudios primarios disponibles en la Matriz de Evidencia:
"""
${studiesSummary}
"""

Analiza exhaustivamente cada estudio y genera un listado riguroso y exhaustivo de Desenlaces Clínicos y Variables Candidatas para comparar y analizar (Ítems 10b, 13a y 17 de PRISMA 2020).
Debes identificar:
1. Desenlaces Primarios (Compuestos cardiovasculares mayores, mortalidad, eventos clínicos duros).
2. Desenlaces Secundarios (Hospitalizaciones individuales, deterioro de órganos diana como función renal, calidad de vida PROMs como KCCQ o EQ-5D).
3. Desenlaces de Seguridad y Eventos Adversos (Reacciones adversas graves, hipoglucemias, cetoacidosis, hipotensión, suspensiones del tratamiento).
4. Variables Moduladoras y de Subgrupo (Diabetes basal, FEVI, estadios de filtrado glomerular, clase funcional).

Para cada desenlace:
- Proporciona una definición operativa armonizada para evitar sesgo de agregación heterogénea.
- Mapea exactamente cuáles estudios de la lista lo reportan (con el valor textual y numérico extraído de sus resultados) y cuáles no lo reportan ("No reportado").
- Evalúa rigurosamente la elegibilidad para metaanálisis cuantitativo (canMetaAnalyze: true si al menos 2 estudios reportan la misma métrica combinable; de lo contrario false con recomendación de síntesis narrativa).

POLÍTICA DE CERO ALUCINACIONES:
No inventes datos numéricos ni atribuyas desenlaces a estudios que no los mencionan. Si un estudio no lo evaluó, márcalo como reported: false y reportedText: "No reportado".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.15,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            outcomes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  domain: { type: Type.STRING },
                  category: {
                    type: Type.STRING,
                    enum: ['primary', 'secondary', 'safety', 'subgroup'],
                  },
                  variableType: {
                    type: Type.STRING,
                    enum: ['time_to_event', 'dichotomous', 'continuous'],
                  },
                  preferredEffectMeasure: {
                    type: Type.STRING,
                    enum: ['HR', 'RR', 'OR', 'MD', 'SMD', 'RD'],
                  },
                  clinicalDefinition: { type: Type.STRING },
                  measurementTimepoint: { type: Type.STRING },
                  importance: {
                    type: Type.STRING,
                    enum: ['critical', 'important'],
                  },
                  cosAlignment: { type: Type.STRING },
                  studiesMapping: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        studyId: { type: Type.STRING },
                        studyName: { type: Type.STRING },
                        reported: { type: Type.BOOLEAN },
                        reportedText: { type: Type.STRING },
                        numericEstimate: { type: Type.NUMBER },
                        ciLower: { type: Type.NUMBER },
                        ciUpper: { type: Type.NUMBER },
                        sampleSize: { type: Type.NUMBER },
                        isEligibleForMetaAnalysis: { type: Type.BOOLEAN },
                        extractedNotes: { type: Type.STRING },
                      },
                      required: ['studyName', 'reported', 'reportedText', 'isEligibleForMetaAnalysis'],
                    },
                  },
                  synthesisEligibility: {
                    type: Type.OBJECT,
                    properties: {
                      eligibleStudiesCount: { type: Type.NUMBER },
                      canMetaAnalyze: { type: Type.BOOLEAN },
                      recommendedSynthesis: {
                        type: Type.STRING,
                        enum: ['meta_analysis_random', 'meta_analysis_fixed', 'narrative_synthesis'],
                      },
                      methodologicalJustification: { type: Type.STRING },
                    },
                    required: ['eligibleStudiesCount', 'canMetaAnalyze', 'recommendedSynthesis', 'methodologicalJustification'],
                  },
                },
                required: [
                  'id',
                  'name',
                  'domain',
                  'category',
                  'variableType',
                  'preferredEffectMeasure',
                  'clinicalDefinition',
                  'measurementTimepoint',
                  'importance',
                  'studiesMapping',
                  'synthesisEligibility',
                ],
              },
            },
            methodologicalSummary: {
              type: Type.STRING,
              description: 'Resumen metodológico global de la armonización de variables según PRISMA 2020.',
            },
          },
          required: ['outcomes'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"outcomes":[]}');
    res.json({
      success: true,
      outcomes: parsed.outcomes || [],
      methodologicalSummary: parsed.methodologicalSummary || '',
    });
  } catch (error: any) {
    console.error('Error in /api/identify-outcomes:', error);
    res.status(500).json({
      error: error.message || 'Error al identificar y armonizar desenlaces con IA.',
    });
  }
});


// Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PRISMA 2020 server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
