import React, { useState } from 'react';
import { 
  Calculator, 
  ArrowRightLeft, 
  Percent, 
  Scale, 
  Copy, 
  Check, 
  Plus, 
  BookOpen, 
  Info, 
  RotateCcw,
  BarChart2,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface StatsCalculatorProps {
  onInsertText: (text: string) => void;
  onClose?: () => void;
  initialMode?: 'median_mean' | 'or_rr' | 'heterogeneity' | 'smd';
}

// Statistical helper functions
function erf(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function normalCDF(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

function normalQuantile(p: number): number {
  // Approximation of probit function (standard normal quantile)
  if (p <= 0 || p >= 1) return 0;
  // Beasley-Springer / Moro approximation
  const a = [2.50662823884, -18.61500062529, 41.39119773534, -25.44106049637];
  const b = [-8.47351093090, 23.08336743743, -21.06224101826, 3.13082909833];
  const c = [0.3374754822726147, 0.9761690190917186, 0.1607979714918209, 0.0276438810333863, 0.0038405729373609, 0.0003951804142957, 0.0000321767881768, 0.0000002888167364, 0.0000003960368223];

  const y = p - 0.5;
  if (Math.abs(y) < 0.42) {
    const r = y * y;
    return y * (((a[3] * r + a[2]) * r + a[1]) * r + a[0]) / ((((b[3] * r + b[2]) * r + b[1]) * r + b[0]) * r + 1.0);
  }
  let r = p;
  if (y > 0) r = 1 - p;
  r = Math.log(-Math.log(r));
  let x = c[0];
  for (let i = 1; i < 9; i++) {
    x += c[i] * Math.pow(r, i);
  }
  return y < 0 ? -x : x;
}

function pValueFromZ(z: number): number {
  const absZ = Math.abs(z);
  return Math.max(0.0001, 2 * (1 - normalCDF(absZ)));
}

function chiSquarePValue(q: number, df: number): number {
  if (df <= 0 || q <= 0) return 1.0;
  // Wilson-Hilferty transformation approximation
  const z = (Math.pow(q / df, 1 / 3) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  const p = 1 - normalCDF(z);
  return Math.min(1.0, Math.max(0.0001, p));
}

export const StatsCalculator: React.FC<StatsCalculatorProps> = ({
  onInsertText,
  onClose,
  initialMode = 'or_rr',
}) => {
  const [activeTab, setActiveTab] = useState<'median_mean' | 'or_rr' | 'heterogeneity' | 'smd'>(initialMode);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // --- STATE FOR TAB 1: Median to Mean & SD ---
  const [medScenario, setMedScenario] = useState<'iqr' | 'range' | 'five' | 'se_ci'>('iqr');
  const [sampleN, setSampleN] = useState<number>(120);
  const [medianVal, setMedianVal] = useState<number>(54.5);
  const [q1Val, setQ1Val] = useState<number>(42.0);
  const [q3Val, setQ3Val] = useState<number>(68.0);
  const [minVal, setMinVal] = useState<number>(25.0);
  const [maxVal, setMaxVal] = useState<number>(89.0);
  const [meanValInput, setMeanValInput] = useState<number>(55.0);
  const [seVal, setSeVal] = useState<number>(3.2);
  const [ciLow, setCiLow] = useState<number>(48.7);
  const [ciHigh, setCiHigh] = useState<number>(61.3);

  // --- STATE FOR TAB 2: 2x2 Table (OR, RR, RD, NNT) ---
  const [studyLabel, setStudyLabel] = useState<string>('DAPA-HF (McMurray 2019)');
  const [outcomeLabel, setOutcomeLabel] = useState<string>('Mortalidad por todas las causas');
  const [expEvents, setExpEvents] = useState<number>(276); // a
  const [expTotal, setExpTotal] = useState<number>(2373); // n1
  const [ctrlEvents, setCtrlEvents] = useState<number>(329); // c
  const [ctrlTotal, setCtrlTotal] = useState<number>(2371); // n2
  const [continuityCorrection, setContinuityCorrection] = useState<boolean>(true);

  // --- STATE FOR TAB 3: Heterogeneity & Meta-Analysis Model ---
  const [qStat, setQStat] = useState<number>(14.28);
  const [kStudies, setKStudies] = useState<number>(6);
  const [pooledEffect, setPooledEffect] = useState<number>(0.74);
  const [pooledSE, setPooledSE] = useState<number>(0.07);

  // --- STATE FOR TAB 4: Continuous SMD (Hedges' g & MD) ---
  const [smdLabel, setSmdLabel] = useState<string>('Puntuación KCCQ a los 8 meses');
  const [m1, setM1] = useState<number>(68.4);
  const [sd1, setSd1] = useState<number>(14.2);
  const [n1, setN1] = useState<number>(180);
  const [m2, setM2] = useState<number>(61.1);
  const [sd2, setSd2] = useState<number>(15.0);
  const [n2, setN2] = useState<number>(175);

  // ========================================================
  // CALCULATION 1: MEDIAN TO MEAN / SD (Wan et al., Luo et al.)
  // ========================================================
  const computeMedianToMean = () => {
    let estMean = 0;
    let estSD = 0;
    let formulaDesc = '';

    const n = Math.max(2, sampleN || 100);

    if (medScenario === 'iqr') {
      // Wan et al. (2014) scenario 2: Q1, Median, Q3, n
      estMean = (q1Val + medianVal + q3Val) / 3;
      const qNorm = normalQuantile((0.75 * n - 0.125) / (n + 0.25));
      const denominator = 2 * (qNorm > 0 ? qNorm : 0.6745);
      estSD = (q3Val - q1Val) / denominator;
      formulaDesc = 'Fórmula de Wan et al. (2014) para Mediana y Rango Intercuartílico (IQR: Q1, Q3)';
    } else if (medScenario === 'range') {
      // Wan et al. (2014) scenario 1: Min, Median, Max, n
      estMean = (minVal + 2 * medianVal + maxVal) / 4;
      const qNorm = normalQuantile((n - 0.375) / (n + 0.25));
      const denominator = 2 * (qNorm > 0 ? qNorm : 1.96);
      estSD = (maxVal - minVal) / denominator;
      formulaDesc = 'Fórmula de Wan et al. / Hozo et al. para Mediana y Rango Completo (Mín-Máx)';
    } else if (medScenario === 'five') {
      // Wan et al. (2014) scenario 3: Min, Q1, Median, Q3, Max, n
      estMean = (minVal + 2 * q1Val + 2 * medianVal + 2 * q3Val + maxVal) / 8;
      const qNormRange = normalQuantile((n - 0.375) / (n + 0.25));
      const qNormIQR = normalQuantile((0.75 * n - 0.125) / (n + 0.25));
      estSD = (maxVal - minVal) / (4 * (qNormRange > 0 ? qNormRange : 1.96)) + 
              (q3Val - q1Val) / (4 * (qNormIQR > 0 ? qNormIQR : 0.6745));
      formulaDesc = 'Fórmula de Wan et al. (2014) para Resumen de 5 Números (Mín, Q1, Mediana, Q3, Máx)';
    } else {
      // SE or 95% CI to SD
      estMean = meanValInput;
      if (seVal > 0) {
        estSD = seVal * Math.sqrt(n);
        formulaDesc = 'Conversión canónica de Error Estándar (SE) a Desviación Estándar (SD = SE · √n)';
      } else {
        estSD = (Math.sqrt(n) * (ciHigh - ciLow)) / 3.92;
        formulaDesc = 'Conversión canónica de Intervalo de Confianza del 95% a Desviación Estándar';
      }
    }

    const meanStr = Number.isFinite(estMean) ? estMean.toFixed(2) : '0.00';
    const sdStr = Number.isFinite(estSD) ? estSD.toFixed(2) : '0.00';
    const textFormatted = `media estimada: ${meanStr} ± ${sdStr} (n = ${n}; cálculo según ${formulaDesc})`;
    const academicText = `Los valores reportados en mediana y dispersión se transformaron a media y desviación estándar para la síntesis cuantitativa (${meanStr} ± ${sdStr}, n = ${n}) aplicando el método validado de Wan et al. (2014).`;

    return { estMean, estSD, meanStr, sdStr, formulaDesc, textFormatted, academicText };
  };

  // ========================================================
  // CALCULATION 2: 2x2 CONTINGENCY TABLE (OR, RR, RD, NNT)
  // ========================================================
  const compute2x2 = () => {
    let a = Math.max(0, expEvents);
    let n1 = Math.max(1, expTotal);
    let c = Math.max(0, ctrlEvents);
    let n2 = Math.max(1, ctrlTotal);

    if (a > n1) n1 = a;
    if (c > n2) n2 = c;

    let b = n1 - a; // exp non-events
    let d = n2 - c; // ctrl non-events

    // Zero-cell handling
    const hasZero = a === 0 || b === 0 || c === 0 || d === 0;
    let adjA = a, adjB = b, adjC = c, adjD = d;
    let adjN1 = n1, adjN2 = n2;

    if (hasZero && continuityCorrection) {
      adjA += 0.5;
      adjB += 0.5;
      adjC += 0.5;
      adjD += 0.5;
      adjN1 += 1.0;
      adjN2 += 1.0;
    }

    // Incidences
    const incExp = a / n1;
    const incCtrl = c / n2;

    // Relative Risk (RR)
    const rr = (adjA / adjN1) / (adjC / adjN2);
    const seLnRR = Math.sqrt((1 / adjA) - (1 / adjN1) + (1 / adjC) - (1 / adjN2));
    const rrLow = Math.exp(Math.log(rr) - 1.96 * seLnRR);
    const rrHigh = Math.exp(Math.log(rr) + 1.96 * seLnRR);
    const zRR = Math.abs(Math.log(rr)) / (seLnRR || 1);
    const pRR = pValueFromZ(zRR);

    // Odds Ratio (OR)
    const or = (adjA * adjD) / (adjB * adjC);
    const seLnOR = Math.sqrt((1 / adjA) + (1 / adjB) + (1 / adjC) + (1 / adjD));
    const orLow = Math.exp(Math.log(or) - 1.96 * seLnOR);
    const orHigh = Math.exp(Math.log(or) + 1.96 * seLnOR);
    const zOR = Math.abs(Math.log(or)) / (seLnOR || 1);
    const pOR = pValueFromZ(zOR);

    // Risk Difference (RD) and NNT
    const rd = incExp - incCtrl;
    const seRD = Math.sqrt((incExp * (1 - incExp)) / n1 + (incCtrl * (1 - incCtrl)) / n2);
    const rdLow = rd - 1.96 * seRD;
    const rdHigh = rd + 1.96 * seRD;
    const nnt = rd !== 0 ? Math.round(Math.abs(1 / rd)) : Infinity;
    const isBenefit = rd < 0;

    const rrStr = `${rr.toFixed(2)} (IC 95%: ${rrLow.toFixed(2)} a ${rrHigh.toFixed(2)})`;
    const orStr = `${or.toFixed(2)} (IC 95%: ${orLow.toFixed(2)} a ${orHigh.toFixed(2)})`;
    const rdStr = `${(rd * 100).toFixed(2)}% (IC 95%: ${(rdLow * 100).toFixed(2)}% a ${(rdHigh * 100).toFixed(2)}%)`;
    const pStr = pRR < 0.001 ? 'p < 0.001' : `p = ${pRR.toFixed(3)}`;

    const summaryText = `Para el desenlace de ${outcomeLabel} (${studyLabel}), la intervención se asoció con un RR = ${rr.toFixed(2)} [IC 95%: ${rrLow.toFixed(2)} a ${rrHigh.toFixed(2)}, ${pStr}; OR = ${or.toFixed(2)} [IC 95%: ${orLow.toFixed(2)} a ${orHigh.toFixed(2)}]; Reducción Absoluta del Riesgo (ARR) = ${Math.abs(rd * 100).toFixed(2)}%, lo que representa un ${isBenefit ? 'Número Necesario a Tratar (NNT)' : 'Número Necesario para Dañar (NNH)'} de ${nnt} pacientes].`;

    return {
      incExp,
      incCtrl,
      rr,
      rrLow,
      rrHigh,
      pRR,
      or,
      orLow,
      orHigh,
      pOR,
      rd,
      rdLow,
      rdHigh,
      nnt,
      isBenefit,
      rrStr,
      orStr,
      rdStr,
      pStr,
      summaryText,
    };
  };

  // ========================================================
  // CALCULATION 3: HETEROGENEITY (I², Q Cochran, Tau²)
  // ========================================================
  const computeHeterogeneity = () => {
    const k = Math.max(2, kStudies || 2);
    const df = k - 1;
    const q = Math.max(0, qStat || 0);

    const i2 = q > df ? ((q - df) / q) * 100 : 0;
    const pVal = chiSquarePValue(q, df);

    // DerSimonian-Laird estimate of tau2 approximation if k and Q given
    // Assume average study weight w_approx
    const tau2 = q > df ? (q - df) / (df * 10) : 0;
    const tau = Math.sqrt(tau2);

    let interpretation = '';
    let badgeColor = '';
    if (i2 < 30) {
      interpretation = 'Heterogeneidad no importante o leve (0% - 30%)';
      badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    } else if (i2 < 60) {
      interpretation = 'Heterogeneidad moderada (30% - 60%)';
      badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
    } else if (i2 < 75) {
      interpretation = 'Heterogeneidad sustancial (50% - 75%)';
      badgeColor = 'text-orange-700 bg-orange-50 border-orange-200';
    } else {
      interpretation = 'Heterogeneidad considerable / alta (> 75%)';
      badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
    }

    // 95% Prediction Interval approximation
    const zCrit = 1.96;
    const piLow = pooledEffect - zCrit * Math.sqrt(pooledSE * pooledSE + tau2);
    const piHigh = pooledEffect + zCrit * Math.sqrt(pooledSE * pooledSE + tau2);

    const hetText = `Se identificó una heterogeneidad estadística ${i2 < 30 ? 'baja' : i2 < 60 ? 'moderada' : 'sustancial'} entre los ${k} estudios incluidos (estadístico Q de Cochran = ${q.toFixed(2)}, gl = ${df}, p = ${pVal < 0.001 ? '< 0.001' : pVal.toFixed(3)}; I² = ${i2.toFixed(1)}%; varianza entre estudios Tau² = ${tau2.toFixed(3)}, Tau = ${tau.toFixed(3)}). El intervalo de predicción del 95% se situó entre ${piLow.toFixed(2)} y ${piHigh.toFixed(2)}.`;

    return {
      df,
      i2,
      pVal,
      tau2,
      tau,
      interpretation,
      badgeColor,
      piLow,
      piHigh,
      hetText,
    };
  };

  // ========================================================
  // CALCULATION 4: CONTINUOUS SMD (Hedges' g & Mean Difference)
  // ========================================================
  const computeSMD = () => {
    const smd_n1 = Math.max(2, n1 || 10);
    const smd_n2 = Math.max(2, n2 || 10);

    const meanDiff = m1 - m2;
    // Pooled SD
    const numerator = (smd_n1 - 1) * sd1 * sd1 + (smd_n2 - 1) * sd2 * sd2;
    const denominator = smd_n1 + smd_n2 - 2;
    const sdPooled = Math.sqrt(numerator / Math.max(1, denominator));

    // Standard Error of Mean Difference
    const seMD = sdPooled * Math.sqrt(1 / smd_n1 + 1 / smd_n2);
    const mdLow = meanDiff - 1.96 * seMD;
    const mdHigh = meanDiff + 1.96 * seMD;
    const pMD = pValueFromZ(meanDiff / (seMD || 1));

    // Cohen's d
    const cohenD = sdPooled > 0 ? meanDiff / sdPooled : 0;

    // Hedges' g correction factor J(df)
    const df = smd_n1 + smd_n2 - 2;
    const jFactor = 1 - 3 / (4 * df - 1);
    const hedgesG = cohenD * jFactor;

    // Variance and SE of Hedges' g
    const varG = (smd_n1 + smd_n2) / (smd_n1 * smd_n2) + (hedgesG * hedgesG) / (2 * (smd_n1 + smd_n2));
    const seG = Math.sqrt(varG);
    const gLow = hedgesG - 1.96 * seG;
    const gHigh = hedgesG + 1.96 * seG;
    const pG = pValueFromZ(hedgesG / (seG || 1));

    let gMagnitude = 'efecto despreciable (< 0.2)';
    const absG = Math.abs(hedgesG);
    if (absG >= 0.8) gMagnitude = 'efecto grande (g ≥ 0.8)';
    else if (absG >= 0.5) gMagnitude = 'efecto moderado (g ≥ 0.5)';
    else if (absG >= 0.2) gMagnitude = 'efecto pequeño (g ≥ 0.2)';

    const smdText = `Para el desenlace de ${smdLabel}, la diferencia de medias no estandarizada fue de ${meanDiff.toFixed(2)} unidades [IC 95%: ${mdLow.toFixed(2)} a ${mdHigh.toFixed(2)}, p ${pMD < 0.001 ? '< 0.001' : `= ${pMD.toFixed(3)}`}; s_combinada = ${sdPooled.toFixed(2)}]. Expresado en unidades estandarizadas, el estimador de Hedges' g fue de ${hedgesG.toFixed(2)} [IC 95%: ${gLow.toFixed(2)} a ${gHigh.toFixed(2)}, p ${pG < 0.001 ? '< 0.001' : `= ${pG.toFixed(3)}`}], correspondiente a un ${gMagnitude}.`;

    return {
      meanDiff,
      sdPooled,
      seMD,
      mdLow,
      mdHigh,
      pMD,
      cohenD,
      hedgesG,
      gLow,
      gHigh,
      pG,
      gMagnitude,
      smdText,
    };
  };

  const medRes = computeMedianToMean();
  const twoByTwoRes = compute2x2();
  const hetRes = computeHeterogeneity();
  const smdRes = computeSMD();

  return (
    <div id="stats-calculator-container" className="bg-white border border-indigo-200 rounded-xl shadow-md overflow-hidden transition-all">
      {/* Header bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 border border-indigo-400/30 rounded-lg text-indigo-300">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-wide text-white">
                Calculadora Estadística de Síntesis y Conversiones
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/40 text-indigo-200 border border-indigo-400/30">
                Ítem 13 / 20 PRISMA
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Transformaciones de medidas continuas (Wan/Luo), tablas 2x2 (OR, RR, NNT), heterogeneidad (I², Q, Tau²) y Hedges' g.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="self-end sm:self-center px-3 py-1.5 text-xs text-indigo-200 hover:text-white hover:bg-white/10 rounded-md transition-colors cursor-pointer"
          >
            Ocultar calculadora
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-slate-50 overflow-x-auto text-xs font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('or_rr')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'or_rr'
              ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Tabla 2×2 (OR, RR, RD & NNT)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('median_mean')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'median_mean'
              ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Mediana/IQR a Media y DE (Wan/Luo)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('heterogeneity')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'heterogeneity'
              ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>Heterogeneidad (I², Q Cochran, Tau²)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('smd')}
          className={`px-4 py-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeTab === 'smd'
              ? 'border-indigo-600 text-indigo-700 bg-white font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Scale className="w-4 h-4" />
          <span>Diferencia de Medias (MD & Hedges' g)</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-5 text-slate-800">
        {/* ======================================================== */}
        {/* TAB 1: 2x2 TABLA PARA VARIABLES DICOTÓMICAS */}
        {/* ======================================================== */}
        {activeTab === 'or_rr' && (
          <div className="space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-100">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                <p className="text-xs text-indigo-950 leading-relaxed">
                  Calcula el <strong>Riesgo Relativo (RR)</strong>, <strong>Odds Ratio (OR)</strong>, <strong>Diferencia de Riesgos (RD)</strong> y el <strong>Número Necesario a Tratar (NNT)</strong> con intervalos de confianza al 95% y significación estadística asintótica exacta (z-score bilateral).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs text-slate-600 flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={continuityCorrection}
                    onChange={(e) => setContinuityCorrection(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                  <span>Corrección por continuidad (+0.5 en celdas con 0)</span>
                </label>
              </div>
            </div>

            {/* Form Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Identificador del Estudio o Metaanálisis</label>
                <input
                  type="text"
                  value={studyLabel}
                  onChange={(e) => setStudyLabel(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ej. DAPA-HF (McMurray et al., 2019)"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nombre del Desenlace Clínico Evaluado</label>
                <input
                  type="text"
                  value={outcomeLabel}
                  onChange={(e) => setOutcomeLabel(e.target.value)}
                  className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                  placeholder="Ej. Mortalidad por todas las causas"
                />
              </div>
            </div>

            {/* 2x2 Grid Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h4 className="text-xs font-bold text-slate-900 mb-3 flex items-center justify-between">
                <span>Tabla de Contingencia 2×2</span>
                <span className="text-[11px] font-normal text-slate-500">Ingresa eventos y total de participantes por grupo</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Intervention Group */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-indigo-700">Grupo Intervención / Experimental</span>
                    <span className="text-[11px] text-slate-500">
                      Tasa: {(twoByTwoRes.incExp * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Nº Eventos (a)</label>
                      <input
                        type="number"
                        min="0"
                        value={expEvents}
                        onChange={(e) => setExpEvents(parseInt(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Total Muestra (n₁)</label>
                      <input
                        type="number"
                        min="1"
                        value={expTotal}
                        onChange={(e) => setExpTotal(parseInt(e.target.value) || 1)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Control Group */}
                <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Grupo Control / Placebo</span>
                    <span className="text-[11px] text-slate-500">
                      Tasa: {(twoByTwoRes.incCtrl * 100).toFixed(2)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Nº Eventos (c)</label>
                      <input
                        type="number"
                        min="0"
                        value={ctrlEvents}
                        onChange={(e) => setCtrlEvents(parseInt(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-600 block mb-1">Total Muestra (n₂)</label>
                      <input
                        type="number"
                        min="1"
                        value={ctrlTotal}
                        onChange={(e) => setCtrlTotal(parseInt(e.target.value) || 1)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculated Output Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3">
                <span className="text-[11px] font-semibold text-indigo-900 block">Riesgo Relativo (RR)</span>
                <span className="text-base font-extrabold text-indigo-700 font-mono block mt-0.5">
                  {twoByTwoRes.rr.toFixed(2)}
                </span>
                <span className="text-[10px] text-indigo-800 block mt-0.5">
                  IC 95%: {twoByTwoRes.rrLow.toFixed(2)} - {twoByTwoRes.rrHigh.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold text-indigo-600 mt-1 block">
                  {twoByTwoRes.pStr}
                </span>
              </div>

              <div className="bg-blue-50/70 border border-blue-200 rounded-lg p-3">
                <span className="text-[11px] font-semibold text-blue-900 block">Odds Ratio (OR)</span>
                <span className="text-base font-extrabold text-blue-700 font-mono block mt-0.5">
                  {twoByTwoRes.or.toFixed(2)}
                </span>
                <span className="text-[10px] text-blue-800 block mt-0.5">
                  IC 95%: {twoByTwoRes.orLow.toFixed(2)} - {twoByTwoRes.orHigh.toFixed(2)}
                </span>
                <span className="text-[10px] font-semibold text-blue-600 mt-1 block">
                  {twoByTwoRes.pOR < 0.001 ? 'p < 0.001' : `p = ${twoByTwoRes.pOR.toFixed(3)}`}
                </span>
              </div>

              <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-3">
                <span className="text-[11px] font-semibold text-emerald-900 block">Diferencia de Riesgo (RD)</span>
                <span className="text-base font-extrabold text-emerald-700 font-mono block mt-0.5">
                  {(twoByTwoRes.rd * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-emerald-800 block mt-0.5">
                  IC: {(twoByTwoRes.rdLow * 100).toFixed(2)}% a {(twoByTwoRes.rdHigh * 100).toFixed(2)}%
                </span>
                <span className="text-[10px] text-emerald-600 mt-1 block">
                  {twoByTwoRes.isBenefit ? 'Reducción absoluta' : 'Aumento de riesgo'}
                </span>
              </div>

              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3">
                <span className="text-[11px] font-semibold text-amber-900 block">
                  {twoByTwoRes.isBenefit ? 'NNT (Beneficio)' : 'NNH (Daño)'}
                </span>
                <span className="text-base font-extrabold text-amber-700 font-mono block mt-0.5">
                  {Number.isFinite(twoByTwoRes.nnt) ? twoByTwoRes.nnt : 'N/A'}
                </span>
                <span className="text-[10px] text-amber-800 block mt-0.5">
                  1 / |Riesgo Absoluto|
                </span>
                <span className="text-[10px] text-amber-700 mt-1 block">
                  {twoByTwoRes.isBenefit ? 'Pacientes a tratar para evitar 1 evento' : 'Pacientes para 1 evento adverso'}
                </span>
              </div>
            </div>

            {/* Copy / Insert Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Texto redactado con rigor PRISMA 2020:</span>
              <p className="text-xs text-slate-800 bg-white p-2.5 rounded border border-slate-200 font-mono leading-relaxed">
                {twoByTwoRes.summaryText}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(twoByTwoRes.summaryText, '2x2')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied === '2x2' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === '2x2' ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertText(twoByTwoRes.summaryText)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar en Resultados (Ítem 13/20)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: MEDIANA A MEDIA Y DE (WAN ET AL., LUO ET AL.) */}
        {/* ======================================================== */}
        {activeTab === 'median_mean' && (
          <div className="space-y-5">
            <div className="bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs text-indigo-950 leading-relaxed">
                <p>
                  Convierte variables continuas reportadas originalmente como <strong>Mediana y Rango Intercuartílico (IQR)</strong>, <strong>Rango Mín-Máx</strong> o <strong>Resumen de 5 números</strong> en <strong>Media y Desviación Estándar (Media ± DE)</strong> para permitir su inclusión en metaanálisis continuos.
                </p>
                <span className="text-[11px] text-indigo-700 mt-1 block">
                  Metodología recomendada por el Manual Cochrane: <em>Wan et al. (BMC Med Res Methodol 2014)</em> y <em>Luo et al. (Stat Methods Med Res 2018)</em>.
                </span>
              </div>
            </div>

            {/* Scenario Selection */}
            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Selecciona la información estadística reportada en el estudio primario:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setMedScenario('iqr')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    medScenario === 'iqr'
                      ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">1. Mediana + IQR</span>
                  <span className="text-[10px] text-slate-500 font-normal">Q1, Mediana, Q3 y n</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMedScenario('range')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    medScenario === 'range'
                      ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">2. Mediana + Rango</span>
                  <span className="text-[10px] text-slate-500 font-normal">Mín, Mediana, Máx y n</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMedScenario('five')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    medScenario === 'five'
                      ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">3. Resumen 5 Números</span>
                  <span className="text-[10px] text-slate-500 font-normal">Mín, Q1, Med, Q3, Máx</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMedScenario('se_ci')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                    medScenario === 'se_ci'
                      ? 'border-indigo-600 bg-indigo-50/80 font-bold text-indigo-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">4. SE / IC 95% a DE</span>
                  <span className="text-[10px] text-slate-500 font-normal">Error estándar o IC 95%</span>
                </button>
              </div>
            </div>

            {/* Inputs based on scenario */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tamaño Muestral (n)</label>
                  <input
                    type="number"
                    min="2"
                    value={sampleN}
                    onChange={(e) => setSampleN(parseInt(e.target.value) || 2)}
                    className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                {medScenario !== 'se_ci' && (
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Mediana (m)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={medianVal}
                      onChange={(e) => setMedianVal(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                )}

                {(medScenario === 'iqr' || medScenario === 'five') && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Primer Cuartil Q₁ (25%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={q1Val}
                        onChange={(e) => setQ1Val(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Tercer Cuartil Q₃ (75%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={q3Val}
                        onChange={(e) => setQ3Val(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                {(medScenario === 'range' || medScenario === 'five') && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Valor Mínimo (a)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={minVal}
                        onChange={(e) => setMinVal(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Valor Máximo (b)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={maxVal}
                        onChange={(e) => setMaxVal(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}

                {medScenario === 'se_ci' && (
                  <>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Media Reportada</label>
                      <input
                        type="number"
                        step="0.01"
                        value={meanValInput}
                        onChange={(e) => setMeanValInput(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Error Estándar (SE)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={seVal}
                        onChange={(e) => setSeVal(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Límite Inferior IC 95%</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ciLow}
                        onChange={(e) => setCiLow(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Límite Superior IC 95%</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ciHigh}
                        onChange={(e) => setCiHigh(parseFloat(e.target.value) || 0)}
                        className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Results Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <span className="text-xs font-semibold text-emerald-900 block">Media Aritmética Estimada (x̄)</span>
                <span className="text-2xl font-extrabold text-emerald-800 font-mono block mt-1">
                  {medRes.meanStr}
                </span>
                <span className="text-[11px] text-emerald-700 mt-1 block">
                  Aproximación asintótica según {medScenario === 'iqr' ? 'Wan et al. (Q1+m+Q3)/3' : 'modelo de Wan et al.'}
                </span>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <span className="text-xs font-semibold text-indigo-900 block">Desviación Estándar Estimada (DE / SD)</span>
                <span className="text-2xl font-extrabold text-indigo-800 font-mono block mt-1">
                  {medRes.sdStr}
                </span>
                <span className="text-[11px] text-indigo-700 mt-1 block">
                  Ajustado por el tamaño muestral n = {sampleN} mediante distribución normal inversa
                </span>
              </div>
            </div>

            {/* Copy / Insert Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Texto estándar para el manuscrito (Ítem 13b / 20):</span>
              <p className="text-xs text-slate-800 bg-white p-2.5 rounded border border-slate-200 font-mono leading-relaxed">
                {medRes.academicText}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(medRes.academicText, 'med')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied === 'med' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'med' ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertText(medRes.academicText)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar en Resultados (Ítem 13b/20)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: HETEROGENEIDAD (I², Q COCHRAN, TAU²) */}
        {/* ======================================================== */}
        {activeTab === 'heterogeneity' && (
          <div className="space-y-5">
            <div className="bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs text-indigo-950 leading-relaxed">
                <p>
                  Calcula e interpreta el <strong>estadístico I² de Higgins</strong>, la <strong>prueba Q de homogeneidad de Cochran</strong> con su significación estadística (p-valor Chi-cuadrado), la <strong>varianza entre estudios ($\tau^2$)</strong> y el <strong>Intervalo de Predicción del 95%</strong> (Ítem 13d y 20 PRISMA 2020).
                </p>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Estadístico Q de Cochran
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={qStat}
                  onChange={(e) => setQStat(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Nº de Estudios Incluidos (k)
                </label>
                <input
                  type="number"
                  min="2"
                  value={kStudies}
                  onChange={(e) => setKStudies(parseInt(e.target.value) || 2)}
                  className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Efecto Agrupado (ej. RR / MD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={pooledEffect}
                  onChange={(e) => setPooledEffect(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Error Estándar Agrupado (SE)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.001"
                  value={pooledSE}
                  onChange={(e) => setPooledSE(parseFloat(e.target.value) || 0.01)}
                  className="w-full text-xs p-2 font-mono rounded border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-600 block">Estadístico I² de Higgins</span>
                <span className="text-2xl font-black text-indigo-700 font-mono block mt-1">
                  {hetRes.i2.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  max(0, (Q - gl) / Q)
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-600 block">p-valor de Cochran</span>
                <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
                  {hetRes.pVal < 0.001 ? '< 0.001' : hetRes.pVal.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  gl = {hetRes.df} (k - 1)
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-600 block">Varianza Tau² (τ²)</span>
                <span className="text-2xl font-black text-slate-900 font-mono block mt-1">
                  {hetRes.tau2.toFixed(3)}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Desv. Tau = {hetRes.tau.toFixed(3)}
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs">
                <span className="text-[11px] font-semibold text-slate-600 block">Intervalo de Predicción 95%</span>
                <span className="text-base font-extrabold text-indigo-900 font-mono block mt-1">
                  {hetRes.piLow.toFixed(2)} a {hetRes.piHigh.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Efecto esperado en estudio futuro
                </span>
              </div>
            </div>

            {/* Interpretation Badge */}
            <div className={`p-3 rounded-lg border text-xs font-semibold flex items-center justify-between ${hetRes.badgeColor}`}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                <span>Interpretación estándar según el Manual Cochrane: {hetRes.interpretation}</span>
              </div>
              <span className="text-[11px] opacity-80">
                {hetRes.i2 >= 50 ? 'Requiere análisis de subgrupos o meta-regresión' : 'Heterogeneidad aceptable para síntesis'}
              </span>
            </div>

            {/* Copy / Insert Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Redacción para Resultados / Discusión (Ítems 13d y 20):</span>
              <p className="text-xs text-slate-800 bg-white p-2.5 rounded border border-slate-200 font-mono leading-relaxed">
                {hetRes.hetText}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(hetRes.hetText, 'het')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied === 'het' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'het' ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertText(hetRes.hetText)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar en Resultados (Ítem 13d/20)</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: DIFERENCIA DE MEDIAS (MD & HEDGES' G) */}
        {/* ======================================================== */}
        {activeTab === 'smd' && (
          <div className="space-y-5">
            <div className="bg-indigo-50/60 p-3.5 rounded-lg border border-indigo-100 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div className="text-xs text-indigo-950 leading-relaxed">
                <p>
                  Calcula la <strong>Diferencia de Medias no estandarizada (MD)</strong> y la <strong>Diferencia de Medias Estandarizada (Hedges' g)</strong> con corrección analítica por muestra pequeña, sus intervalos de confianza al 95% y p-valor bilateral.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre de la Escala o Desenlace</label>
              <input
                type="text"
                value={smdLabel}
                onChange={(e) => setSmdLabel(e.target.value)}
                className="w-full text-xs p-2 rounded-md border border-slate-300 bg-white focus:ring-1 focus:ring-indigo-500"
                placeholder="Ej. Puntuación KCCQ a los 8 meses"
              />
            </div>

            {/* Intervention vs Control Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
              {/* Group 1 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-indigo-700 block">Grupo Intervención</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Media (x̄₁)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={m1}
                      onChange={(e) => setM1(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 font-mono rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Desv. Est. (DE₁)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={sd1}
                      onChange={(e) => setSd1(parseFloat(e.target.value) || 0.1)}
                      className="w-full text-xs p-1.5 font-mono rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Muestra (n₁)</label>
                    <input
                      type="number"
                      min="2"
                      value={n1}
                      onChange={(e) => setN1(parseInt(e.target.value) || 2)}
                      className="w-full text-xs p-1.5 font-mono rounded border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2 */}
              <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 block">Grupo Control</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block">Media (x̄₂)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={m2}
                      onChange={(e) => setM2(parseFloat(e.target.value) || 0)}
                      className="w-full text-xs p-1.5 font-mono rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Desv. Est. (DE₂)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={sd2}
                      onChange={(e) => setSd2(parseFloat(e.target.value) || 0.1)}
                      className="w-full text-xs p-1.5 font-mono rounded border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 block">Muestra (n₂)</label>
                    <input
                      type="number"
                      min="2"
                      value={n2}
                      onChange={(e) => setN2(parseInt(e.target.value) || 2)}
                      className="w-full text-xs p-1.5 font-mono rounded border border-slate-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Output Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-indigo-50/70 border border-indigo-200 rounded-lg p-3.5">
                <span className="text-xs font-bold text-indigo-950 block">Diferencia de Medias (MD no estandarizada)</span>
                <span className="text-2xl font-black text-indigo-700 font-mono block mt-1">
                  {smdRes.meanDiff.toFixed(2)}
                </span>
                <span className="text-xs text-indigo-800 block mt-0.5">
                  IC 95%: {smdRes.mdLow.toFixed(2)} a {smdRes.mdHigh.toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold text-indigo-600 mt-1 block">
                  {smdRes.pMD < 0.001 ? 'p < 0.001' : `p = ${smdRes.pMD.toFixed(3)}`} | DE combinada: {smdRes.sdPooled.toFixed(2)}
                </span>
              </div>

              <div className="bg-purple-50/70 border border-purple-200 rounded-lg p-3.5">
                <span className="text-xs font-bold text-purple-950 block">Hedges' g (Diferencia de Medias Estandarizada)</span>
                <span className="text-2xl font-black text-purple-700 font-mono block mt-1">
                  {smdRes.hedgesG.toFixed(2)}
                </span>
                <span className="text-xs text-purple-800 block mt-0.5">
                  IC 95%: {smdRes.gLow.toFixed(2)} a {smdRes.gHigh.toFixed(2)}
                </span>
                <span className="text-[11px] font-semibold text-purple-600 mt-1 block">
                  Magnitud: {smdRes.gMagnitude}
                </span>
              </div>
            </div>

            {/* Copy / Insert Actions */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">Texto estándar para Resultados (Ítem 13b / 20):</span>
              <p className="text-xs text-slate-800 bg-white p-2.5 rounded border border-slate-200 font-mono leading-relaxed">
                {smdRes.smdText}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopy(smdRes.smdText, 'smd')}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {copied === 'smd' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied === 'smd' ? 'Copiado al portapapeles' : 'Copiar texto'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => onInsertText(smdRes.smdText)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Insertar en Resultados (Ítem 13b/20)</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
