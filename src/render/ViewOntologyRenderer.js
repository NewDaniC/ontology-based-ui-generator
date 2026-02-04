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
  Graph: {
    type: UI('Graph'),
    properties: {
      title: UI('hasTitle'),
      legendPosition: UI('hasLegendPosition'),
      independentMetadata: UI('hasIndependentMetadata'),
      dependentMetadata: UI('hasDependentMetadata'),
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

export async function loadUIOntologies(store, uiOntologyUrl) {
  console.log(`Loading UI ontology: ${uiOntologyUrl}`);
  const prefixes = await serializeOntologies(store, uiOntologyUrl);
  return prefixes;
}

// Helper to get property value from store
function getPropertyValue(store, subject, predicate) {
  const statements = store.statementsMatching(subject, predicate, null);
  return statements.length > 0 ? statements[0].object.value : undefined;
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

export async function extractUIElements(store) {
  console.log('Store has', store.statements.length, 'triples');

  // Collect all elements from each type
  const allElements = [];

  for (const [elementType, config] of Object.entries(ELEMENT_TYPES)) {
    const elements = extractElementsOfType(store, elementType, config);
    console.log(`${elementType} elements found:`, elements.length);
    allElements.push(...elements);
  }

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
