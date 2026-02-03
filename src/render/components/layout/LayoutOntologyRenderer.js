import * as rdflib from 'rdflib';

/**
 * Loads the layout ontology and extracts layout configuration.
 * This function is generic and works with any ontology that follows the layout pattern:
 * - Classes: Layout, Header, Sidebar, Footer, ContentArea
 * - Properties: hasTitle, hasHeight, hasWidth, hasText, hasPadding, isFixed
 * The function discovers individuals dynamically by their rdf:type.
 */
export async function loadLayoutOntology(layoutUrl = '/ontologies/SmartLEM_UI/SmartLEM-Layout.ttl') {
  const store = rdflib.graph();
  
  // Standard namespaces used in all layout ontologies
  const RDF = rdflib.Namespace('http://www.w3.org/1999/02/22-rdf-syntax-ns#');
  
  console.log('Loading layout ontology:', layoutUrl); // Console comment
  
  // Fetch the ontology to extract the base namespace dynamically
  const cacheBustedUrl = layoutUrl.includes('?') ? `${layoutUrl}&_ts=${Date.now()}` : `${layoutUrl}?_ts=${Date.now()}`;
  const response = await fetch(cacheBustedUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Failed to fetch layout ontology: ${response.statusText}`);
  }
  const turtleContent = await response.text();
  
  // Extract the base namespace from the ontology (from @base or @prefix layout:)
  const baseMatch = turtleContent.match(/@base\s+<([^>]+)>/);
  const layoutPrefixMatch = turtleContent.match(/@prefix\s+layout:\s+<([^>]+)>/);
  const LAYOUT_NS = baseMatch?.[1] || layoutPrefixMatch?.[1] || 'http://example.org/layout#';

  console.log('Detected layout namespace:', LAYOUT_NS); // Console comment
  
  const ns = rdflib.Namespace(LAYOUT_NS);
  
  // Parse the ontology into the store
  rdflib.parse(turtleContent, store, LAYOUT_NS, 'text/turtle');

  // Helper function to find an individual by its rdf:type class
  const findIndividualByType = (className) => {
    const classNode = ns(className);
    const individuals = store.each(undefined, RDF('type'), classNode);
    return individuals.length > 0 ? individuals[0] : null;
  };

  // Discover individuals dynamically by their class type
  const headerNode = findIndividualByType('Header');
  const sidebarNode = findIndividualByType('Sidebar');
  const footerNode = findIndividualByType('Footer');
  const contentAreaNode = findIndividualByType('ContentArea');

  // Console comment
  console.log('Discovered Header:', headerNode?.value);
  console.log('Discovered Sidebar:', sidebarNode?.value);
  console.log('Discovered Footer:', footerNode?.value);
  console.log('Discovered ContentArea:', contentAreaNode?.value);

  // Extract properties from discovered individuals
  const headerTitle = headerNode ? store.any(headerNode, ns('hasTitle')) : null;
  const headerHeight = headerNode ? store.any(headerNode, ns('hasHeight')) : null;
  const headerIsFixed = headerNode ? store.any(headerNode, ns('isFixed')) : null;
  
  const sidebarWidth = sidebarNode ? store.any(sidebarNode, ns('hasWidth')) : null;
  
  const footerText = footerNode ? store.any(footerNode, ns('hasText')) : null;
  const footerHeight = footerNode ? store.any(footerNode, ns('hasHeight')) : null;
  const footerIsFixed = footerNode ? store.any(footerNode, ns('isFixed')) : null;
  
  const contentAreaPadding = contentAreaNode ? store.any(contentAreaNode, ns('hasPadding')) : null;

  const toBool = (value, fallback = true) => {
    if (!value) return fallback;
    const normalized = String(value.value).toLowerCase();
    return normalized === 'true' || normalized === '1';
  };

  const toNumber = (value, fallback) => {
    if (!value) return fallback;
    const parsed = Number.parseInt(value.value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
  };

  // Build result with generic fallback messages
  const result = {
    headerTitle: headerTitle?.value || 'Define layout:hasTitle in ontology',
    headerHeight: toNumber(headerHeight, 64),
    headerIsFixed: toBool(headerIsFixed, true),
    sidebarWidth: toNumber(sidebarWidth, 200),
    footerText: footerText?.value || 'Define layout:hasText in ontology',
    footerHeight: toNumber(footerHeight, 50),
    footerIsFixed: toBool(footerIsFixed, true),
    contentAreaPadding: toNumber(contentAreaPadding, 24),
  };

  console.log('Final layout config:', result); // Console comment
  return result;
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

  console.log('Views discovered from manifest:', views); // Console comment
    return views;
  } catch (error) {
  console.error('Error discovering views:', error); // Console comment
    return [];
  }
}
