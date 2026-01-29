import * as rdflib from 'rdflib';

export const DEFAULT_PREFIXES = {
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  owl: 'http://www.w3.org/2002/07/owl#',
};

// Extract @prefix/prefix lines from Turtle/N3
export function extractPrefixesFromTurtle(text) {
  const map = {};
  const regex = /(?:@prefix|prefix)\s+([A-Za-z0-9_-]*):\s*<([^>]+)>/gi;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const prefix = m[1] || '';
    const ns = m[2];
    map[prefix] = ns;
  }
  return map;
}

// Extract PREFIX lines from SPARQL
export function extractPrefixesFromSparql(text) {
  const map = {};
  const regex = /PREFIX\s+([A-Za-z0-9_-]*):\s*<([^>]+)>/gi;
  let m;
  while ((m = regex.exec(text)) !== null) {
    const prefix = m[1] || '';
    const ns = m[2];
    map[prefix] = ns;
  }
  return map;
}

// Convert URI to endpoint path using prefixes
export function uriToEndpointPath(uri, prefixes = DEFAULT_PREFIXES) {
  if (!uri) return '';

  for (const [prefix, ns] of Object.entries(prefixes)) {
    if (uri.startsWith(ns)) {
      const local = uri.substring(ns.length);
      return prefix ? `${prefix}/${local}` : local;
    }
  }

  // Fallback: last fragment
  const match = uri.match(/([^\/\#]+)$/);
  return match ? match[1] : uri;
}

// SPARQL SELECT helper
export function runSelectQuery(store, sparql, varNames) {
  return new Promise((resolve, reject) => {
    try {
      const query = rdflib.SPARQLToQuery(sparql, false, store);
      const results = [];

      store.query(
        query,
        (binding) => {
          const row = {};
          for (const v of varNames) {
            const term = binding['?' + v] || binding[v];
            row[v] = term && term.value ? term.value : undefined;
          }
          results.push(row);
        },
        undefined,
        () => resolve(results)
      );
    } catch (err) {
      reject(err);
    }
  });
}