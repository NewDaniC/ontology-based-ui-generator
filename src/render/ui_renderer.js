import * as rdflib from 'rdflib';
import { serializeOntologies } from '../lib/index.js';
import { runSelectQuery } from '../lib/utils.js';

const UI_QUERIES = {
  GET_PAGES: `
    PREFIX ui: <http://www.cedri.com/OntologyToUI-UserInterface#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?page ?representation WHERE {
      ?page rdf:type ui:Page .
      OPTIONAL { ?page ui:hasGraphicRepresentation ?representation }
    }
  `,

  GET_LABELS: `
    PREFIX ui: <http://www.cedri.com/OntologyToUI-UserInterface#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?label ?text WHERE {
      ?label rdf:type ui:Label .
      ?label ui:hasText ?text .
    }
  `,

  GET_TABLES: `
    PREFIX ui: <http://www.cedri.com/OntologyToUI-UserInterface#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?table ?bm WHERE {
      ?table rdf:type ui:Table .
      ?table ui:hasBusinessModel ?bm .
    }
  `
};

export async function loadUIOntologies(store, uiOntologyUrl) {
  console.log(`Loading UI ontology: ${uiOntologyUrl}`);
  const prefixes = await serializeOntologies(store, uiOntologyUrl);
  return prefixes;
}

export async function extractUIElements(store) {
  const pages = await runSelectQuery(store, UI_QUERIES.GET_PAGES, ['page', 'representation']);
  console.log('Pages found:', pages);

  const labels = await runSelectQuery(store, UI_QUERIES.GET_LABELS, ['label', 'text']);
  console.log('Labels found:', labels);

  const tables = await runSelectQuery(store, UI_QUERIES.GET_TABLES, ['table', 'bm']);
  console.log('Tables found:', tables);

  return { pages, labels, tables };
}

export async function renderUI(uiOntologyUrl) {
  const store = rdflib.graph();
  await loadUIOntologies(store, uiOntologyUrl);
  const uiElements = await extractUIElements(store);
  return uiElements;
}