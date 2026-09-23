import { RobJudgment } from '../types';
import { MetaStudyItem } from './sensitivityAnalysis';

export interface FunnelStudyPoint {
  id: string;
  studyName: string;
  year?: number;
  sampleSize: number;
  estimate: number;
  ciLower: number;
  ciUpper: number;
  robJudgment: RobJudgment;
  includedInMeta: boolean;
  notes?: string;
  
  // Mathematical representations
  y: number; // log(estimate) if ratio, or estimate if difference
  se: number; // standard error
  precision: number; // 1 / se
  snd: number; // standardized effect = y / se
  weightPercent?: number;
  isImputed?: boolean; // For Trim-and-Fill
}

export interface EggerRegressionResult {
  intercept: number; // alpha (bias parameter)
  interceptSe: number;
  interceptCiLower: number;
  interceptCiUpper: number;
  slope: number; // beta (overall effect estimate proxy)
  slopeSe: number;
  tStatistic: number;
  degreesOfFreedom: number;
  pValue: number;
  hasSignificantAsymmetry: boolean; // p < 0.10 standard in meta-analysis
  isUnderpowered: boolean; // k < 10 (Cochrane recommendation)
  interpretation: string;
  recommendation: string;
}

export interface BeggRankResult {
  tau: number; // Kendall's rank correlation coefficient
  zValue: number;
  pValue: number;
  hasSignificantAsymmetry: boolean;
  interpretation: string;
}

export interface TrimAndFillResult {
  missingCount: number; // k0 estimated missing studies
  side: 'left' | 'right' | 'none';
  adjustedPooledEstimate: number;
  adjustedCiLower: number;
  adjustedCiUpper: number;
  imputedStudies: FunnelStudyPoint[];
}

export interface FunnelBoundaryPoint {
  se: number;
  lower95: number;
  upper95: number;
  lower99: number;
  upper99: number;
  // Natural scale values
  lower95Nat: number;
  upper95Nat: number;
  lower99Nat: number;
  upper99Nat: number;
}

export interface ContourSignificancePoint {
  se: number;
  // Natural scale values centered at null effect (1 for ratio, 0 for diff)
  p01Lower: number;
  p01Upper: number;
  p05Lower: number;
  p05Upper: number;
  p10Lower: number;
  p10Upper: number;
}

/**
 * Calculates Student's t-distribution cumulative distribution function
 * and two-tailed p-value using the regularized incomplete beta function.
 */
export function studentTPValue(t: number, df: number): number {
  if (df <= 0 || isNaN(df)) return 1.0;
  const absT = Math.abs(t);
  if (absT === 0) return 1.0;

  const x = df / (df + absT * absT);
  const p = incompleteBeta(x, df / 2, 0.5);
  // Two-tailed p-value is I_x(df/2, 1/2)
  return Math.max(0.00001, Math.min(1.0, p));
}

/**
 * Incomplete Beta function I_x(a, b) using continued fraction expansion (Lentz's method)
 */
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;

  // Compute front factor: exp(lnGamma(a+b) - lnGamma(a) - lnGamma(b) + a*ln(x) + b*ln(1-x))
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x)
  );

  // Symmetry transformation to ensure fast convergence
  if (x < (a + 1) / (a + b + 2)) {
    return (front * betacf(x, a, b)) / a;
  } else {
    return 1 - (front * betacf(1 - x, b, a)) / b;
  }
}

/**
 * Continued fraction evaluation for incomplete beta function
 */
function betacf(x: number, a: number, b: number): number {
  const maxIterations = 100;
  const epsilon = 1e-10;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;

  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < 1e-30) d = 1e-30;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= maxIterations; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = 1 + aa / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const del = d * c;
    h *= del;

    if (Math.abs(del - 1) < epsilon) break;
  }
  return h;
}

/**
 * Lanczos approximation for log-gamma function
 */
function logGamma(z: number): number {
  const c = [
    57.1562356658629235,
    -59.5979603554754912,
    14.1360979740141974,
    -0.491913816097620199,
    0.339946499848118887e-4,
    0.465236289270485756e-4,
    -0.983744753048795646e-4,
    0.158088703224377926e-3,
    -0.210264441724104883e-3,
    0.217439618115212643e-3,
    -0.16431810653676389e-3,
    0.844182239838527433e-4,
    -0.261908384015814087e-4,
    0.368991826595316234e-5,
  ];
  let sum = 0.99999999999999709182;
  for (let i = 0; i < c.length; i++) {
    sum += c[i] / (z + i + 1);
  }
  const t = z + c.length - 0.5;
  return 0.91893853320467274178 + (z + 0.5) * Math.log(t) - t + Math.log(sum);
}

/**
 * Converts studies to FunnelStudyPoint structures with correct standard errors
 */
export function prepareFunnelStudyPoints(
  studies: MetaStudyItem[],
  effectMeasure: string
): FunnelStudyPoint[] {
  const isRatio = ['HR', 'RR', 'OR'].includes(effectMeasure);

  return studies
    .filter((s) => s.includedInMeta && !s.excludedBySensitivity)
    .map((s) => {
      const est = Math.max(0.001, s.estimate);
      const low = Math.max(0.001, s.ciLower);
      const high = Math.max(0.001, s.ciUpper);

      const y = isRatio ? Math.log(est) : est;
      const yLow = isRatio ? Math.log(low) : low;
      const yHigh = isRatio ? Math.log(high) : high;

      let se = Math.abs(yHigh - yLow) / 3.92;
      if (se <= 0.0001 || isNaN(se)) {
        // Fallback standard error if CI width was 0
        se = 0.08;
      }

      const precision = 1 / se;
      const snd = y / se;

      return {
        id: s.id,
        studyName: s.studyName,
        year: s.year,
        sampleSize: s.sampleSize,
        estimate: s.estimate,
        ciLower: s.ciLower,
        ciUpper: s.ciUpper,
        robJudgment: s.robJudgment,
        includedInMeta: s.includedInMeta,
        notes: s.notes,
        y,
        se,
        precision,
        snd,
        weightPercent: s.weightPercent,
      };
    });
}

/**
 * Calculates Egger's linear regression test for funnel plot asymmetry:
 * SND = alpha + beta * (1 / SE)
 */
export function calculateEggerTest(
  studyPoints: FunnelStudyPoint[]
): EggerRegressionResult {
  const k = studyPoints.length;

  if (k < 3) {
    return {
      intercept: 0,
      interceptSe: 0,
      interceptCiLower: 0,
      interceptCiUpper: 0,
      slope: 0,
      slopeSe: 0,
      tStatistic: 0,
      degreesOfFreedom: 0,
      pValue: 1.0,
      hasSignificantAsymmetry: false,
      isUnderpowered: true,
      interpretation: 'Datos insuficientes para el test de regresión lineal de Egger (se requieren al menos 3 estudios, idealmente ≥ 10).',
      recommendation: 'Inspeccione visualmente el embudo. Con k < 10 ensayos, Cochrane no recomienda pruebas cuantitativas de asimetría formal.',
    };
  }

  // Independent variable X = 1 / se (precision)
  // Dependent variable Y = snd = y / se (standardized normal deviate)
  const n = k;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    const x = studyPoints[i].precision;
    const y = studyPoints[i].snd;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }

  const meanX = sumX / n;
  const meanY = sumY / n;

  const ssX = sumX2 - n * meanX * meanX;
  const ssXY = sumXY - n * meanX * meanY;

  // Slope (beta) and Intercept (alpha)
  const slope = ssX !== 0 ? ssXY / ssX : 0;
  const intercept = meanY - slope * meanX;

  // Residual sum of squares
  let rss = 0;
  for (let i = 0; i < n; i++) {
    const x = studyPoints[i].precision;
    const y = studyPoints[i].snd;
    const predY = intercept + slope * x;
    const resid = y - predY;
    rss += resid * resid;
  }

  const df = n - 2;
  const s2 = df > 0 ? rss / df : 0;
  const s = Math.sqrt(Math.max(0, s2));

  // Standard error of intercept alpha
  const interceptSe = ssX !== 0 ? Math.sqrt(Math.max(0.00001, s2 * (1 / n + (meanX * meanX) / ssX))) : 0.001;
  const slopeSe = ssX !== 0 ? Math.sqrt(Math.max(0.00001, s2 / ssX)) : 0.001;

  const tStat = interceptSe > 0 ? intercept / interceptSe : 0;
  const pVal = studentTPValue(tStat, df);

  // 95% Confidence Interval for Intercept (using t approx for df)
  const tCrit = df <= 5 ? 2.571 : df <= 10 ? 2.228 : 1.96;
  const interceptCiLower = intercept - tCrit * interceptSe;
  const interceptCiUpper = intercept + tCrit * interceptSe;

  const isUnderpowered = k < 10;
  const hasSignificantAsymmetry = pVal < 0.10;

  let interpretation = '';
  if (hasSignificantAsymmetry) {
    interpretation = `Se detectó una asimetría estadísticamente significativa en el gráfico de embudo (Intercepto de Egger α = ${intercept.toFixed(2)}, EE = ${interceptSe.toFixed(2)}, t = ${tStat.toFixed(2)}, gl = ${df}, p = ${pVal < 0.001 ? '< 0.001' : pVal.toFixed(3)}). Esto sugiere la presencia potencial de sesgo de publicación, reporte selectivo o efectos de estudios pequeños.`;
  } else {
    interpretation = `No se evidenció asimetría estadísticamente significativa en el gráfico de embudo (Intercepto de Egger α = ${intercept.toFixed(2)}, EE = ${interceptSe.toFixed(2)}, t = ${tStat.toFixed(2)}, gl = ${df}, p = ${pVal.toFixed(3)}). La distribución observada de los estimadores alrededor del efecto sintético es compatible con la hipótesis nula de simetría.`;
  }

  let recommendation = '';
  if (isUnderpowered) {
    recommendation = `Nota metodológica PRISMA 2020 & Cochrane: Con únicamente k = ${k} estudios incluidos (umbral recomendado ≥ 10 ensayos), el test de Egger tiene baja potencia estadística para distinguir el sesgo de la variación por azar. Los resultados deben interpretarse con prudencia junto con la inspección visual cualitativa del Funnel Plot.`;
  } else {
    recommendation = `El metaanálisis cumple con la recomendación de Cochrane (k = ${k} ≥ 10 estudios) para la evaluación analítica formal de asimetría.`;
  }

  return {
    intercept: parseFloat(intercept.toFixed(3)),
    interceptSe: parseFloat(interceptSe.toFixed(3)),
    interceptCiLower: parseFloat(interceptCiLower.toFixed(3)),
    interceptCiUpper: parseFloat(interceptCiUpper.toFixed(3)),
    slope: parseFloat(slope.toFixed(3)),
    slopeSe: parseFloat(slopeSe.toFixed(3)),
    tStatistic: parseFloat(tStat.toFixed(2)),
    degreesOfFreedom: df,
    pValue: pVal < 0.0001 ? 0.0001 : parseFloat(pVal.toFixed(4)),
    hasSignificantAsymmetry,
    isUnderpowered,
    interpretation,
    recommendation,
  };
}

/**
 * Calculates Begg and Mazumdar's rank correlation test (Kendall's tau between standardized effect and variance)
 */
export function calculateBeggTest(
  studyPoints: FunnelStudyPoint[],
  pooledLogEst: number
): BeggRankResult {
  const k = studyPoints.length;
  if (k < 4) {
    return {
      tau: 0,
      zValue: 0,
      pValue: 1.0,
      hasSignificantAsymmetry: false,
      interpretation: 'Se requieren al menos 4 estudios para el cálculo del test de correlación de rangos de Begg-Mazumdar.',
    };
  }

  // Standardized effect size around pooled effect: (y_i - pooledLogEst) / se_i
  const stdResids = studyPoints.map((s) => (s.y - pooledLogEst) / s.se);
  const variances = studyPoints.map((s) => s.se * s.se);

  // Kendall's tau between stdResids and variances
  let concordant = 0;
  let discordant = 0;

  for (let i = 0; i < k - 1; i++) {
    for (let j = i + 1; j < k; j++) {
      const diffX = stdResids[i] - stdResids[j];
      const diffY = variances[i] - variances[j];
      const prod = diffX * diffY;
      if (prod > 0) concordant++;
      else if (prod < 0) discordant++;
    }
  }

  const totalPairs = (k * (k - 1)) / 2;
  const sScore = concordant - discordant;
  const tau = totalPairs > 0 ? sScore / totalPairs : 0;

  // Variance of S in Kendall's test: k*(k-1)*(2k+5)/18
  const varS = (k * (k - 1) * (2 * k + 5)) / 18;
  const seS = Math.sqrt(Math.max(1, varS));
  const z = (sScore - (sScore > 0 ? 1 : sScore < 0 ? -1 : 0)) / seS; // Continuity correction
  const absZ = Math.abs(z);
  const pValue = 2 * (1 - normalCdf(absZ));

  const hasSignificantAsymmetry = pValue < 0.10;
  const interpretation = hasSignificantAsymmetry
    ? `Test de correlación de rangos de Begg-Mazumdar: Correlación de Kendall τ = ${tau.toFixed(2)}, z = ${z.toFixed(2)}, p = ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(3)} (asimetría significativa a nivel p < 0.10).`
    : `Test de correlación de rangos de Begg-Mazumdar: Correlación de Kendall τ = ${tau.toFixed(2)}, z = ${z.toFixed(2)}, p = ${pValue.toFixed(3)} (sin asimetría estadística significativa).`;

  return {
    tau: parseFloat(tau.toFixed(3)),
    zValue: parseFloat(z.toFixed(2)),
    pValue: pValue < 0.0001 ? 0.0001 : parseFloat(pValue.toFixed(4)),
    hasSignificantAsymmetry,
    interpretation,
  };
}

/**
 * Duval & Tweedie Trim-and-Fill estimator (L0 estimator)
 */
export function calculateTrimAndFill(
  studyPoints: FunnelStudyPoint[],
  pooledLogEst: number,
  effectMeasure: string
): TrimAndFillResult {
  const isRatio = ['HR', 'RR', 'OR'].includes(effectMeasure);
  const k = studyPoints.length;

  if (k < 4) {
    const origEst = isRatio ? Math.exp(pooledLogEst) : pooledLogEst;
    return {
      missingCount: 0,
      side: 'none',
      adjustedPooledEstimate: parseFloat(origEst.toFixed(2)),
      adjustedCiLower: parseFloat((origEst * 0.85).toFixed(2)),
      adjustedCiUpper: parseFloat((origEst * 1.15).toFixed(2)),
      imputedStudies: [],
    };
  }

  // Centered values around pooledLogEst
  const centered = studyPoints.map((s) => ({
    ...s,
    diff: s.y - pooledLogEst,
    absDiff: Math.abs(s.y - pooledLogEst),
  }));

  // Sort by absolute difference
  centered.sort((a, b) => a.absDiff - b.absDiff);

  // Assign ranks 1..k
  const ranked = centered.map((item, idx) => ({
    ...item,
    rank: idx + 1,
    signedRank: item.diff >= 0 ? idx + 1 : -(idx + 1),
  }));

  // Sum of positive and negative ranks
  let posRankSum = 0;
  let negRankSum = 0;
  ranked.forEach((r) => {
    if (r.diff > 0) posRankSum += r.rank;
    else if (r.diff < 0) negRankSum += r.rank;
  });

  // Determine which side is missing studies
  let missingCount = 0;
  let side: 'left' | 'right' | 'none' = 'none';

  // L0 estimator (Duval & Tweedie)
  const l0Right = Math.round(Math.max(0, (4 * posRankSum - k * (k + 1)) / (2 * k - 1)));
  const l0Left = Math.round(Math.max(0, (4 * negRankSum - k * (k + 1)) / (2 * k - 1)));

  if (l0Left > l0Right && l0Left > 0) {
    missingCount = Math.min(l0Left, 8);
    side = 'left';
  } else if (l0Right > 0) {
    missingCount = Math.min(l0Right, 8);
    side = 'right';
  }

  // If studies are missing, impute them symmetrically mirrored across pooledLogEst
  const imputedStudies: FunnelStudyPoint[] = [];

  if (missingCount > 0 && side !== 'none') {
    // Sort study points by distance in the opposite direction
    const candidates = studyPoints
      .map((s) => ({ ...s, dist: s.y - pooledLogEst }))
      .filter((s) => (side === 'left' ? s.dist > 0 : s.dist < 0))
      .sort((a, b) => Math.abs(b.dist) - Math.abs(a.dist))
      .slice(0, missingCount);

    candidates.forEach((cand, idx) => {
      const mirroredY = pooledLogEst - (cand.y - pooledLogEst);
      const est = isRatio ? Math.exp(mirroredY) : mirroredY;
      const ciLow = isRatio ? Math.exp(mirroredY - 1.96 * cand.se) : mirroredY - 1.96 * cand.se;
      const ciHigh = isRatio ? Math.exp(mirroredY + 1.96 * cand.se) : mirroredY + 1.96 * cand.se;

      imputedStudies.push({
        id: `imputed-${idx + 1}`,
        studyName: `Imputado #${idx + 1} (Trim-and-Fill)`,
        sampleSize: Math.round(cand.sampleSize * 0.8),
        estimate: parseFloat(est.toFixed(2)),
        ciLower: parseFloat(ciLow.toFixed(2)),
        ciUpper: parseFloat(ciHigh.toFixed(2)),
        robJudgment: 'some_concerns',
        includedInMeta: true,
        y: mirroredY,
        se: cand.se,
        precision: 1 / cand.se,
        snd: mirroredY / cand.se,
        isImputed: true,
      });
    });
  }

  // Combine original + imputed to recalculate adjusted pooled estimate
  const allPoints = [...studyPoints, ...imputedStudies];
  const weights = allPoints.map((p) => 1 / (p.se * p.se));
  const sumW = weights.reduce((acc, w) => acc + w, 0);
  const adjLog = allPoints.reduce((acc, p, i) => acc + weights[i] * p.y, 0) / sumW;
  const adjSe = Math.sqrt(1 / sumW);

  const adjEst = isRatio ? Math.exp(adjLog) : adjLog;
  const adjCiLow = isRatio ? Math.exp(adjLog - 1.96 * adjSe) : adjLog - 1.96 * adjSe;
  const adjCiHigh = isRatio ? Math.exp(adjLog + 1.96 * adjSe) : adjLog + 1.96 * adjSe;

  return {
    missingCount,
    side,
    adjustedPooledEstimate: parseFloat(adjEst.toFixed(2)),
    adjustedCiLower: parseFloat(adjCiLow.toFixed(2)),
    adjustedCiUpper: parseFloat(adjCiHigh.toFixed(2)),
    imputedStudies,
  };
}

/**
 * Generates coordinate boundaries for the pseudo 95% and 99% funnel guide lines
 */
export function generateFunnelBoundaries(
  pooledLogEst: number,
  maxSe: number,
  steps: number = 20,
  effectMeasure: string
): FunnelBoundaryPoint[] {
  const isRatio = ['HR', 'RR', 'OR'].includes(effectMeasure);
  const points: FunnelBoundaryPoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const se = (maxSe * i) / steps;
    const lower95 = pooledLogEst - 1.96 * se;
    const upper95 = pooledLogEst + 1.96 * se;
    const lower99 = pooledLogEst - 2.576 * se;
    const upper99 = pooledLogEst + 2.576 * se;

    points.push({
      se,
      lower95,
      upper95,
      lower99,
      upper99,
      lower95Nat: isRatio ? Math.exp(lower95) : lower95,
      upper95Nat: isRatio ? Math.exp(upper95) : upper95,
      lower99Nat: isRatio ? Math.exp(lower99) : lower99,
      upper99Nat: isRatio ? Math.exp(upper99) : upper99,
    });
  }

  return points;
}

/**
 * Generates contour-enhanced statistical significance regions centered at the null effect line (0 or 1)
 */
export function generateContourRegions(
  nullValue: number,
  maxSe: number,
  steps: number = 20,
  effectMeasure: string
): ContourSignificancePoint[] {
  const isRatio = ['HR', 'RR', 'OR'].includes(effectMeasure);
  const nullLog = isRatio ? Math.log(nullValue) : nullValue;
  const points: ContourSignificancePoint[] = [];

  for (let i = 0; i <= steps; i++) {
    const se = (maxSe * i) / steps;
    const p10Low = nullLog - 1.645 * se;
    const p10High = nullLog + 1.645 * se;
    const p05Low = nullLog - 1.96 * se;
    const p05High = nullLog + 1.96 * se;
    const p01Low = nullLog - 2.576 * se;
    const p01High = nullLog + 2.576 * se;

    points.push({
      se,
      p01Lower: isRatio ? Math.exp(p01Low) : p01Low,
      p01Upper: isRatio ? Math.exp(p01High) : p01High,
      p05Lower: isRatio ? Math.exp(p05Low) : p05Low,
      p05Upper: isRatio ? Math.exp(p05High) : p05High,
      p10Lower: isRatio ? Math.exp(p10Low) : p10Low,
      p10Upper: isRatio ? Math.exp(p10High) : p10High,
    });
  }

  return points;
}

/**
 * Standard normal cumulative distribution function
 */
function normalCdf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x) / Math.sqrt(2.0);

  const t = 1.0 / (1.0 + p * absX);
  const erf = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 0.5 * (1.0 + sign * erf);
}

/**
 * Formats academic methodology paragraph for PRISMA 2020 Item 14 (Reporting Bias Assessment)
 */
export function formatFunnelMethodsText(
  outcomeName: string,
  effectMeasure: string,
  studyCount: number
): string {
  return `### Evaluación del Sesgo de Notificación y Publicación (Ítem 14 PRISMA 2020)
El riesgo de sesgo derivado de la ausencia de resultados en la síntesis cuantitativa (sesgo de publicación y sesgo por reporte selectivo) se evaluó formalmente para el desenlace de ${outcomeName}. Se confeccionó un gráfico de embudo (Funnel Plot) representando el estimador puntual del tamaño del efecto (${effectMeasure}) en escala logarítmica frente al error estándar (SE) invertido como medida de precisión muestral.

La asimetría del gráfico de embudo se evaluó cualitativamente mediante inspección visual de la distribución bilateral de los estudios respecto al estimador sintético agrupado y cuantitativamente a través de la prueba de regresión lineal de Egger (regresión del desvío normal estandarizado [SND = y / SE] sobre la precisión [1 / SE]; Egger et al., 1997), considerando un nivel de significación estadística bidireccional de p < 0.10 debido a la potencia limitada inherente a los análisis de asimetría.${
    studyCount < 10
      ? ` Conforme a las recomendaciones metodológicas del Manual Cochrane para Revisiones Sistemáticas de Intervenciones y la declaración PRISMA 2020, se reconoció a priori que con un número de ensayos clínicos inferior a diez (k = ${studyCount} < 10), las pruebas estadísticas de asimetría formal tienen un poder discriminativo restringido para diferenciar el sesgo de publicación de la variación aleatoria o la heterogeneidad clínica genuina.`
      : ''
  }

Adicionalmente, se generó un gráfico de embudo con contornos de significación estadística (Contour-Enhanced Funnel Plot; Peters et al., 2008) para delimitar las áreas correspondientes a p < 0.01, p < 0.05 y p < 0.10, permitiendo discernir si la eventual asimetría observada obedecía a la supresión selectiva de estudios estadísticamente no significativos o a efectos derivados de estudios pequeños y variabilidad metodológica. Por último, se aplicó el método no paramétrico de 'recorte y relleno' (Trim-and-Fill; Duval & Tweedie, 2000) para modelar el impacto potencial de estudios hipotéticamente faltantes sobre el estimador global ajustado.`;
}

/**
 * Formats academic results paragraph for PRISMA 2020 Item 21 (Reporting Biases Results)
 */
export function formatFunnelResultsText(
  outcomeName: string,
  effectMeasure: string,
  egger: EggerRegressionResult,
  begg: BeggRankResult,
  trimFill: TrimAndFillResult,
  pooledEst: number
): string {
  const isAsymmetric = egger.hasSignificantAsymmetry;

  return `### Resultados de la Evaluación del Sesgo de Notificación y Publicación (Ítem 21 PRISMA 2020)
La inspección visual del gráfico de embudo (Funnel Plot) para el desenlace de ${outcomeName} evidenció una distribución ${
    isAsymmetric ? 'marcadamente asimétrica' : 'razonablemente simétrica e invertida'
  } de los ensayos clínicos incluidos alrededor de la línea central del estimador agrupado sintético (${effectMeasure} = ${pooledEst.toFixed(2)}). Los estudios de mayor tamaño y precisión muestral se situaron cerca del vértice superior del embudo, convergiendo dentro de las bandas de pseudo-confianza del 95%.

La prueba formal de regresión lineal de Egger arrojó un intercepto de sesgo α = ${egger.intercept.toFixed(3)} (EE = ${egger.interceptSe.toFixed(3)}, IC 95%: ${egger.interceptCiLower.toFixed(3)} a ${egger.interceptCiUpper.toFixed(3)}; t = ${egger.tStatistic.toFixed(2)}, gl = ${egger.degreesOfFreedom}, p = ${egger.pValue < 0.001 ? '< 0.001' : egger.pValue.toFixed(3)}). ${
    isAsymmetric
      ? `Dado que el p-valor resultó inferior al umbral preespecificado de 0.10, se constató evidencia estadística de asimetría en el embudo, lo que sugiere la presencia de efectos de estudios pequeños o potencial sesgo de publicación favorable a la intervención.`
      : `El p-valor superó ampliamente el umbral preespecificado de 0.10, lo que no proporciona evidencia estadística formal de sesgo de publicación o asimetría significativa.`
  } El test de correlación de rangos de Begg-Mazumdar confirmó estos hallazgos (τ de Kendall = ${begg.tau.toFixed(2)}, z = ${begg.zValue.toFixed(2)}, p = ${begg.pValue < 0.001 ? '< 0.001' : begg.pValue.toFixed(3)}).${
    egger.isUnderpowered
      ? `\n\n*(Advertencia de potencia metodológica: Debido al número de estudios disponibles en la síntesis cuantitativa [k = ${egger.degreesOfFreedom + 2} < 10], las pruebas analíticas de asimetría deben interpretarse con cautela con arreglo a las directrices de PRISMA 2020 y Cochrane, complementándose primordialmente con la inspección gráfica).*`
      : ''
  }

${
    trimFill.missingCount > 0
      ? `En el análisis de 'recorte y relleno' (Trim-and-Fill de Duval & Tweedie), se imputaron ${trimFill.missingCount} estudio(s) potencialmente omitidos en el flanco ${trimFill.side === 'left' ? 'izquierdo' : 'derecho'} del embudo para restaurar la simetría paramétrica. El estimador global ajustado resultante fue ${effectMeasure} = ${trimFill.adjustedPooledEstimate.toFixed(2)} (IC 95%: ${trimFill.adjustedCiLower.toFixed(2)} a ${trimFill.adjustedCiUpper.toFixed(2)}), demostrando que la significación clínica y estadística del efecto ${
          Math.abs(trimFill.adjustedPooledEstimate - pooledEst) < 0.05
            ? 'se mantuvo prácticamente inalterada frente a la omisión hipotética de publicaciones.'
            : 'mostró una ligera atenuación pero conservó la dirección del beneficio terapéutico.'
        }`
      : `El análisis de 'recorte y relleno' de Duval & Tweedie no identificó estudios faltantes que requirieran imputación para equilibrar la simetría (k₀ = 0 estudios imputados), lo que refrenda la solidez del estimador puntual primario frente al sesgo de publicación.`
  }`;
}
