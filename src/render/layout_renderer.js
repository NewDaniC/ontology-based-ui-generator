import * as rdflib from 'rdflib';
import { serializeOntologies } from '../lib/index.js';

const LAYOUT_QUERIES = {
  // Query to get the main layout structure
  GET_LAYOUT: `
    PREFIX layout: <http://www.cedri.com/SmartLEM-Layout#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?layout ?header ?sidebar ?footer ?contentArea WHERE {
      ?layout rdf:type layout:Layout .
      OPTIONAL { ?layout layout:hasHeader ?header }
      OPTIONAL { ?layout layout:hasSidebar ?sidebar }
      OPTIONAL { ?layout layout:hasFooter ?footer }
      OPTIONAL { ?layout layout:hasContentArea ?contentArea }
    }
  `,

  // Query to get header properties
  GET_HEADER: `
    PREFIX layout: <http://www.cedri.com/SmartLEM-Layout#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?header ?title ?height ?isFixed WHERE {
      ?header rdf:type layout:Header .
      OPTIONAL { ?header layout:hasTitle ?title }
      OPTIONAL { ?header layout:hasHeight ?height }
      OPTIONAL { ?header layout:isFixed ?isFixed }
    }
  `,

  // Query to get sidebar properties
  GET_SIDEBAR: `
    PREFIX layout: <http://www.cedri.com/SmartLEM-Layout#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?sidebar ?width ?isFixed WHERE {
      ?sidebar rdf:type layout:Sidebar .
      OPTIONAL { ?sidebar layout:hasWidth ?width }
      OPTIONAL { ?sidebar layout:isFixed ?isFixed }
    }
  `,

  // Query to get footer properties
  GET_FOOTER: `
    PREFIX layout: <http://www.cedri.com/SmartLEM-Layout#>
    PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
    SELECT ?footer ?text ?height ?isFixed WHERE {
      ?footer rdf:type layout:Footer .
      OPTIONAL { ?footer layout:hasText ?text }
      OPTIONAL { ?footer layout:hasHeight ?height }
      OPTIONAL { ?footer layout:isFixed ?isFixed }
    }
  `
};

/**
 * Runs a SPARQL SELECT query and returns results
 */
async function runQuery(store, query, variables) {
  return new Promise((resolve, reject) => {
    const results = [];
    const q = rdflib.SPARQLToQuery(query, false, store);
    
    store.query(q, (result) => {
      if (result) {
        const row = {};
        variables.forEach(v => {
          row[v] = result[`?${v}`]?.value || null;
        });
        results.push(row);
      }
    }, undefined, () => resolve(results));
  });
}

/**
 * Loads the layout ontology and extracts layout configuration
 */
export async function loadLayoutOntology(layoutUrl = '/ontologies/SmartLEM_UI/SmartLEM-Layout.ttl') {
  const store = rdflib.graph();
  
  console.log('Loading layout ontology:', layoutUrl);
  await serializeOntologies(store, layoutUrl);

  // Extract header config
  const headerResults = await runQuery(store, LAYOUT_QUERIES.GET_HEADER, ['header', 'title', 'height', 'isFixed']);
  const headerConfig = headerResults[0] || {};

  // Extract sidebar config
  const sidebarResults = await runQuery(store, LAYOUT_QUERIES.GET_SIDEBAR, ['sidebar', 'width', 'isFixed']);
  const sidebarConfig = sidebarResults[0] || {};

  // Extract footer config
  const footerResults = await runQuery(store, LAYOUT_QUERIES.GET_FOOTER, ['footer', 'text', 'height', 'isFixed']);
  const footerConfig = footerResults[0] || {};

  return {
    headerTitle: headerConfig.title || 'SmartLEM',
    headerHeight: parseInt(headerConfig.height) || 64,
    sidebarWidth: parseInt(sidebarConfig.width) || 200,
    footerText: footerConfig.text || 'SmartLEM',
    footerHeight: parseInt(footerConfig.height) || 50,
  };
}

/**
 * Discovers available views by loading the manifest.json file
 * Returns array of view objects with name and path
 */
export async function discoverViews(baseDir = '/ontologies/SmartLEM_UI/') {
  try {
    // Load manifest.json that lists all available views
    const manifestUrl = `${baseDir}manifest.json`;
    const response = await fetch(manifestUrl);
    
    if (!response.ok) {
      console.warn('No manifest.json found at', manifestUrl);
      return [];
    }
    
    const manifest = await response.json();
    const views = [];
    
    for (const view of manifest.views || []) {
      // Skip layout file
      if (view.filename === 'SmartLEM-Layout.ttl') continue;
      
      views.push({
        name: view.name || view.filename.replace('SmartLEM-', '').replace('.ttl', ''),
        path: `${baseDir}${view.filename}`,
        filename: view.filename,
      });
    }

    // Sort views alphabetically by name
    views.sort((a, b) => a.name.localeCompare(b.name));

    console.log('Views discovered from manifest:', views);
    return views;
  } catch (error) {
    console.error('Error discovering views:', error);
    return [];
  }
}
