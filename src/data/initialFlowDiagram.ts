import { FlowDiagramState } from '../types';

export const INITIAL_FLOW_DIAGRAM: FlowDiagramState = {
  databasesIdentified: [
    { id: '1', name: 'PubMed / MEDLINE', count: 1420 },
    { id: '2', name: 'Embase (Elsevier)', count: 1850 },
    { id: '3', name: 'Cochrane Library (CENTRAL)', count: 640 },
    { id: '4', name: 'Web of Science Core Collection', count: 720 },
  ],
  registersIdentified: [
    { id: '5', name: 'ClinicalTrials.gov', count: 85 },
    { id: '6', name: 'WHO ICTRP', count: 42 },
  ],
  duplicatesRemoved: 1120,
  automationExcludedPreScreening: 0,
  otherRemovedPreScreening: 0,
  recordsScreened: 3637,
  recordsExcludedScreening: 3485,
  reportsSought: 152,
  reportsNotRetrieved: 7,
  reportsAssessed: 145,
  reportsExcludedReasons: [
    { id: 'r1', reason: 'Intervención o dosis no concordante con el protocolo', count: 48 },
    { id: 'r2', reason: 'Población no elegible (edad o criterios de gravedad)', count: 36 },
    { id: 'r3', reason: 'Diseño no controlado o sin grupo comparador activo', count: 29 },
    { id: 'r4', reason: 'Desenlaces no medidos o incompatibles', count: 14 },
  ],
  newStudiesIncluded: 18,
  newReportsIncluded: 22,
  otherSourcesIdentified: [
    { id: 'o1', name: 'Búsqueda inversa de citas (Snowballing)', count: 28 },
    { id: 'o2', name: 'Sitios web de organizaciones y literatura gris', count: 15 },
  ],
  otherReportsSought: 43,
  otherReportsNotRetrieved: 4,
  otherReportsAssessed: 39,
  otherReportsExcludedReasons: [
    { id: 'or1', reason: 'Resúmenes de congresos sin datos primarios completos', count: 22 },
    { id: 'or2', reason: 'Población pediátrica', count: 14 },
  ],
  otherStudiesIncluded: 3,
  previousStudiesCount: 0,
  totalStudiesIncluded: 21,
  totalReportsIncluded: 25,
};
