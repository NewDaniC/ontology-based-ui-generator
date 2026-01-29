import { useEffect, useState, useCallback } from 'react';
import * as rdflib from 'rdflib';
import { ConfigProvider, Spin, Alert, Typography } from 'antd';
import enUS from 'antd/locale/en_US';

import { serializeOntologies, findEndpoints } from './lib/index.js';
import { renderUI } from './render/ui_renderer.js';
import { loadLayoutOntology, discoverViews } from './render/layout_renderer.js';
import UIRenderer from './render/UIRenderer.jsx';
import MainLayout from './render/components/layout/MainLayout.jsx';

const { Paragraph } = Typography;

function App() {
  // Layout state
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [views, setViews] = useState([]);
  const [selectedView, setSelectedView] = useState(null);
  
  // View content state
  const [uiElements, setUiElements] = useState(null);
  const [apiEndpoints, setApiEndpoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load layout and discover views on mount
  useEffect(() => {
    async function initializeLayout() {
      try {
        setLoading(true);
        setError(null);

        // Load layout configuration from ontology
        console.log('Loading layout configuration...');
        const config = await loadLayoutOntology();
        setLayoutConfig(config);
        console.log('Layout config loaded:', config);

        // Discover available views
        console.log('Discovering available views...');
        const discoveredViews = await discoverViews();
        setViews(discoveredViews);
        console.log('Views discovered:', discoveredViews);

        // Select first view by default if available
        if (discoveredViews.length > 0) {
          setSelectedView(discoveredViews[0].path);
        }

      } catch (err) {
        console.error('Error initializing layout:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    initializeLayout();
  }, []);

  // Load view content when selected view changes
  useEffect(() => {
    if (!selectedView) return;

    async function loadViewContent() {
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

        // Load and process the selected view
        console.log('Loading view:', selectedView);
        const elements = await renderUI(selectedView);
        console.log('UI elements found:', elements);
        setUiElements(elements);

      } catch (err) {
        console.error('Error loading view:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadViewContent();
  }, [selectedView]);

  // Handle view selection from sidebar
  const handleViewSelect = useCallback((viewPath) => {
    console.log('View selected:', viewPath);
    setSelectedView(viewPath);
  }, []);

  // Show loading state while initializing layout
  if (!layoutConfig) {
    return (
      <ConfigProvider locale={enUS}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          background: '#f0f2f5'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
            <Paragraph style={{ marginTop: 16 }}>Loading SmartLEM...</Paragraph>
          </div>
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider locale={enUS}>
      <MainLayout
        layoutConfig={layoutConfig}
        views={views}
        selectedView={selectedView}
        onViewSelect={handleViewSelect}
      >
        {error ? (
          <Alert
            title="Error loading view"
            description={error}
            type="error"
            showIcon
            style={{ margin: 24 }}
          />
        ) : (
          <UIRenderer 
            uiElements={uiElements} 
            apiEndpoints={apiEndpoints}
            loading={loading}
            error={null}
          />
        )}
      </MainLayout>
    </ConfigProvider>
  );
}

export default App;