import * as rdflib from 'rdflib';
import {
  DEFAULT_PREFIXES,
  extractPrefixesFromTurtle,
  extractPrefixesFromSparql,
  uriToEndpointPath,
  runSelectQuery
} from './utils.js';
import {
  GET_METADATA_QUERY,
  GET_BUSINESS_MODELS_QUERY,
  GET_BUSINESS_MODELS_PARAMETERS_QUERY
} from './queries.js';

/**
 * Loads an ontology into the store and returns extracted prefixes.
 */
export async function serializeOntologies(store, url, baseIRI = 'http://example.org/base#', contentType = 'text/turtle') {
  const cacheBustedUrl = url.includes('?') ? `${url}&_ts=${Date.now()}` : `${url}?_ts=${Date.now()}`; // Cache-busting: force fetch to always load the latest ontology
  const response = await fetch(cacheBustedUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch ontology from ${url}: ${response.statusText}`);
  }
  const data = await response.text();

  try {
    rdflib.parse(data, store, baseIRI, contentType);
  } catch (err) {
    throw new Error(`Failed to parse ontology: ${err.message}`);
  }

  const prefixes = extractPrefixesFromTurtle(data);
  return prefixes;
}

/**
 * Finds endpoints and parameters based on loaded ontologies.
 */
export async function findEndpoints(store, existingPrefixes = {}) {
  const queryPrefixes = extractPrefixesFromSparql(
    GET_METADATA_QUERY +
    GET_BUSINESS_MODELS_QUERY +
    GET_BUSINESS_MODELS_PARAMETERS_QUERY
  );

  const allPrefixes = { ...DEFAULT_PREFIXES, ...existingPrefixes, ...queryPrefixes };

  // 1. Metadata Endpoints
  const metadataRows = await runSelectQuery(store, GET_METADATA_QUERY, ['m']);
  const metadata = metadataRows
    .filter(row => row.m)
    .map(row => uriToEndpointPath(row.m, allPrefixes));

  // 2. Business Model Endpoints
  const bmRows = await runSelectQuery(store, GET_BUSINESS_MODELS_QUERY, ['bm']);
  const businessModels = bmRows
    .filter(row => row.bm)
    .map(row => uriToEndpointPath(row.bm, allPrefixes));

  // 3. Parameters
  const bmParamRows = await runSelectQuery(
    store,
    GET_BUSINESS_MODELS_PARAMETERS_QUERY,
    ['bm', 'pl', 'pt']
  );

  const parameters = {};
  bmParamRows.forEach((row) => {
    if (!row.bm) return;
    const bmName = uriToEndpointPath(row.bm, allPrefixes);
    if (!parameters[bmName]) parameters[bmName] = [];
    parameters[bmName].push({
      label: String(row.pl),
      type: String(row.pt)
    });
  });

  return {
    metadata,
    businessModels,
    parameters
  };
}