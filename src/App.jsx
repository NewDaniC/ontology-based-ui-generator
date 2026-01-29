import { useEffect, useState } from 'react';
import * as rdflib from 'rdflib';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';

import { serializeOntologies, findEndpoints } from './lib/index.js';
import { renderUI } from './render/ui_renderer.js';
import UIRenderer from './render/UIRenderer.jsx';

function App() {
  const [uiElements, setUiElements] = useState(null);
  const [apiEndpoints, setApiEndpoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadOntologies() {
      try {
        setLoading(true);
        setError(null);

        const store = rdflib.graph();
        const prefixes = {};

        // Load business ontologies (EC Models)
        const ecModelsUrl = '/ontologies/SmartLEM_API/BusinessModels/SmartLEM-ECModels.ttl';
        console.log('Loading business ontology:', ecModelsUrl);
        
        const p1 = await serializeOntologies(store, ecModelsUrl);
        Object.assign(prefixes, p1);

        // Generate API endpoints
        const endpoints = await findEndpoints(store, prefixes);
        console.log('Endpoints found:', endpoints);
        setApiEndpoints(endpoints);

        // Load and process UI
        const uiOntologyUrl = '/ontologies/SmartLEM_UI/SmartLEM-EC_View.ttl';
        console.log('Loading UI ontology:', uiOntologyUrl);
        
        const elements = await renderUI(uiOntologyUrl);
        console.log('UI elements found:', elements);
        setUiElements(elements);

      } catch (err) {
        console.error('Error loading ontologies:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadOntologies();
  }, []);

  return (
    <ConfigProvider locale={enUS}>
      <UIRenderer 
        uiElements={uiElements} 
        apiEndpoints={apiEndpoints}
        loading={loading}
        error={error}
      />
    </ConfigProvider>
  );
}

export default App;