import * as rdflib from 'rdflib';
import { serializeOntologies } from '../lib/index.js';

// Namespaces
const RDF = rdflib.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
const UI = rdflib.Namespace('http://www.cedri.com/OntologyToUI-UserInterface#');

// Element type definitions with their properties to extract
const ELEMENT_TYPES = {
  Label: {
    type: UI('Label'),
    properties: {
      text: UI('hasText'),
    },
  },
  Title: {
    type: UI('Title'),
    properties: {
      text: UI('hasText'),
      level: UI('hasLevel'),
    },
  },
  Table: {
    type: UI('Table'),
    properties: {
      bm: UI('hasBusinessModel'),
    },
  },
  Form: {
    type: UI('Form'),
    properties: {
      title: UI('hasTitle'),
      bm: UI('hasBusinessModel'),
    },
  },
  Image: {
    type: UI('Image'),
    properties: {
      metadata: UI('hasMetadata'),
    },
  },
  Paragraph: {
    type: UI('Paragraph'),
    properties: {
      text: UI('hasText'),
    },
  },
};

// Graph subtypes - all share same properties but have different visualization types
const GRAPH_SUBTYPES = {
  LinePlot: UI('LinePlot'),
  BarPlot: UI('BarPlot'),
  CircularPlot: UI('CircularPlot'),
  Graph: UI('Graph'),  // Generic fallback
};

// Common properties for all graph types
const GRAPH_PROPERTIES = {
  title: UI('hasTitle'),
  legendPosition: UI('hasLegendPosition'),
  independentMetadata: UI('hasIndependentMetadata'),
  dependentMetadata: UI('hasDependentMetadata'),  // Can be multiple
  seriesAliases: UI('hasSeriesAlias'),  // Can be multiple
  bm: UI('hasBusinessModel'),
  xAxisLabel: UI('hasXAxisLabel'),
  yAxisLabel: UI('hasYAxisLabel'),
};

export async function loadUIOntologies(store, uiOntologyUrl) {
  console.log(`Loading UI ontology: ${uiOntologyUrl}`);
  const prefixes = await serializeOntologies(store, uiOntologyUrl);
  return prefixes;
}

// Helper to get single property value from store
function getPropertyValue(store, subject, predicate) {
  const statements = store.statementsMatching(subject, predicate, null);
  return statements.length > 0 ? statements[0].object.value : undefined;
}

// Helper to get ALL values of a property (for multiple dependentMetadata)
function getAllPropertyValues(store, subject, predicate) {
  const statements = store.statementsMatching(subject, predicate, null);
  return statements.map(stmt => stmt.object.value);
}

// Extract elements of a specific type from the store
function extractElementsOfType(store, elementType, config) {
  const elements = [];
  const typeStatements = store.statementsMatching(null, RDF('type'), config.type);

  for (const stmt of typeStatements) {
    const subject = stmt.subject;
    const element = {
      element: subject.value,
      elementType,
    };

    // Extract all defined properties for this element type
    for (const [propName, predicate] of Object.entries(config.properties)) {
      element[propName] = getPropertyValue(store, subject, predicate);
    }

    // Get order property (common to all elements)
    const orderValue = getPropertyValue(store, subject, UI('order'));
    element.order = orderValue ? parseInt(orderValue, 10) : Infinity;

    elements.push(element);
  }

  return elements;
}

// Extract graph elements with subtype detection and multiple dependent metadata support
function extractGraphElements(store) {
  const elements = [];

  // Check each graph subtype
  for (const [graphType, typeUri] of Object.entries(GRAPH_SUBTYPES)) {
    const typeStatements = store.statementsMatching(null, RDF('type'), typeUri);

    for (const stmt of typeStatements) {
      const subject = stmt.subject;
      const element = {
        element: subject.value,
        elementType: 'Graph',
        graphType: graphType,  // LinePlot, BarPlot, CircularPlot, or Graph
      };

      // Extract single-value properties
      for (const [propName, predicate] of Object.entries(GRAPH_PROPERTIES)) {
        if (propName === 'dependentMetadata' || propName === 'seriesAliases') {
          // Get ALL dependent metadata values (for multiple series)
          element[propName] = getAllPropertyValues(store, subject, predicate);
        } else {
          element[propName] = getPropertyValue(store, subject, predicate);
        }
      }

      // Get order property
      const orderValue = getPropertyValue(store, subject, UI('order'));
      element.order = orderValue ? parseInt(orderValue, 10) : Infinity;

      elements.push(element);
    }
  }

  return elements;
}

export async function extractUIElements(store) {
  console.log('Store has', store.statements.length, 'triples');

  // Collect all elements from each type
  const allElements = [];

  // Extract standard element types
  for (const [elementType, config] of Object.entries(ELEMENT_TYPES)) {
    const elements = extractElementsOfType(store, elementType, config);
    console.log(`${elementType} elements found:`, elements.length);
    allElements.push(...elements);
  }

  // Extract graph elements separately (handles subtypes and multiple dependent metadata)
  const graphElements = extractGraphElements(store);
  console.log('Graph elements found:', graphElements.length);
  allElements.push(...graphElements);

  // Sort all elements by order
  const elements = allElements.sort((a, b) => a.order - b.order);
  console.log('Sorted elements:', elements);

  return { elements };
}

export async function renderUI(uiOntologyUrl) {
  const store = rdflib.graph();
  await loadUIOntologies(store, uiOntologyUrl);
  const uiElements = await extractUIElements(store);
  return uiElements;
}
