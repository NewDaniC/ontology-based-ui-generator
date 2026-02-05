import { useState } from 'react';
import { Card, Form, InputNumber, Button, Typography, Alert, Spin } from 'antd';
import Plot from 'react-plotly.js';

const { Title, Text } = Typography;

// API base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

// Map graph types from ontology to Plotly types
const PLOTLY_TYPE_MAP = {
  LinePlot: 'scatter',
  BarPlot: 'bar',
  CircularPlot: 'pie',
  Graph: 'scatter',  // Default fallback
};

// Map graph types to Plotly mode (for scatter plots)
const PLOTLY_MODE_MAP = {
  LinePlot: 'lines+markers',
  BarPlot: undefined,  // Not used for bar
  CircularPlot: undefined,  // Not used for pie
  Graph: 'lines+markers',
};

// Default colors for multiple series
const SERIES_COLORS = [
  '#1f77b4',  // Blue
  '#ff7f0e',  // Orange
  '#2ca02c',  // Green
  '#d62728',  // Red
  '#9467bd',  // Purple
  '#8c564b',  // Brown
  '#e377c2',  // Pink
  '#7f7f7f',  // Gray
];

// Extract the local name from a URI
// e.g., "http://www.cedri.com/SmartLEM-Weather#Temperature2m_R" -> "Temperature2m_R"
function extractLocalName(uri) {
  if (!uri) return null;
  const hashIndex = uri.lastIndexOf('#');
  if (hashIndex !== -1) {
    return uri.substring(hashIndex + 1);
  }
  const slashIndex = uri.lastIndexOf('/');
  if (slashIndex !== -1) {
    return uri.substring(slashIndex + 1);
  }
  return uri;
}

// Convert metadata local name to API JSON key
// e.g., "Temperature2m_R" -> "temperature_2m"
// This handles the naming convention differences between ontology and API
function metadataToJsonKey(metadataName) {
  if (!metadataName) return null;

  // Remove "_R" suffix if present (ontology naming convention)
  let key = metadataName.replace(/_R$/, '');

  // Convert CamelCase to snake_case and lowercase
  // Handle special cases like "2m" -> "_2m"
  key = key
    .replace(/([a-z])(\d)/g, '$1_$2')  // number after letter: add underscore
    .replace(/([A-Z])/g, '_$1')         // uppercase: add underscore before
    .toLowerCase()
    .replace(/^_/, '');                 // remove leading underscore

  return key;
}

// Find the actual key in an object using case-insensitive matching
// Returns the actual key name or null if not found
function findKeyIgnoreCase(obj, searchKey) {
  if (!obj || !searchKey) return null;
  const lowerSearchKey = searchKey.toLowerCase();
  const actualKey = Object.keys(obj).find(k => k.toLowerCase() === lowerSearchKey);
  return actualKey || null;
}

// Get value from object using case-insensitive key matching
function getValueIgnoreCase(obj, searchKey) {
  const actualKey = findKeyIgnoreCase(obj, searchKey);
  return actualKey ? obj[actualKey] : undefined;
}

// Generate display label for a series from metadata name
// e.g., "Temperature2m_R" -> "Temperature 2m"
function generateSeriesLabel(metadataName) {
  if (!metadataName) return 'Unknown';

  // Remove "_R" suffix
  let label = metadataName.replace(/_R$/, '');

  // Add space before numbers and uppercase letters
  label = label
    .replace(/(\d+)/g, ' $1')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .replace(/\s+/g, ' ');

  return label;
}

// Parse alias entries in the format "MetadataLocalName=Display Label".
function parseSeriesAliases(seriesAliases) {
  const aliasMap = {};
  const aliases = Array.isArray(seriesAliases) ? seriesAliases : [seriesAliases].filter(Boolean);

  aliases.forEach((entry) => {
    if (typeof entry !== 'string') return;

    const separatorIndex = entry.indexOf('=');
    if (separatorIndex === -1) return;

    const rawKey = entry.slice(0, separatorIndex).trim();
    const displayLabel = entry.slice(separatorIndex + 1).trim();
    if (!rawKey || !displayLabel) return;

    const metadataLocalName = extractLocalName(rawKey);
    const jsonKey = metadataToJsonKey(metadataLocalName || rawKey);

    aliasMap[rawKey] = displayLabel;
    if (metadataLocalName) aliasMap[metadataLocalName] = displayLabel;
    if (jsonKey) aliasMap[jsonKey] = displayLabel;
  });

  return aliasMap;
}

// Extract endpoint path from BusinessModel URI
function buildEndpointPath(bmUri) {
  if (!bmUri) return null;

  const parts = bmUri.split('#');
  if (parts.length !== 2) return null;

  const basePart = parts[0];
  const name = parts[1];

  const classMatch = basePart.match(/SmartLEM-(.+)$/);
  if (!classMatch) return null;

  const className = classMatch[1].replace(/-/g, '_');
  return `/${className}/${name}/run`;
}

export default function GraphComponent({
  graph,
  title,
  graphType = 'LinePlot',
  bm,
  xAxis,
  yAxes = [],
  seriesAliases = [],
  xAxisLabel,
  yAxisLabel,
  legendPosition = 'bottom',
  parameters,
}) {
  const [formInstance] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [plotData, setPlotData] = useState(null);

  const graphName = graph?.split('#')[1] || graph?.split('/').pop() || 'Graph';
  const displayTitle = title || graphName;

  // Extract BusinessModel name
  const bmLocalName = bm?.split('#')[1] || bm?.split('/').pop() || '';

  // Find parameters for this BusinessModel
  const findParams = () => {
    if (!parameters || !bmLocalName) return [];
    if (parameters[bmLocalName]) return parameters[bmLocalName];
    for (const key of Object.keys(parameters)) {
      if (key.endsWith(`/${bmLocalName}`) || key === bmLocalName) {
        return parameters[key];
      }
    }
    return [];
  };

  const bmParams = findParams();
  const endpointPath = buildEndpointPath(bm);
  const seriesAliasMap = parseSeriesAliases(seriesAliases);

  // Process API response data into Plotly format
  const processDataForPlot = (apiData) => {
    console.log('=== DEBUG: Processing API Data ===');
    console.log('Raw API Data:', apiData);
    console.log('Is Array:', Array.isArray(apiData));

    // Get the x-axis key from metadata URI
    const xMetadataName = extractLocalName(xAxis);
    const xKey = metadataToJsonKey(xMetadataName);
    console.log('X-axis metadata name:', xMetadataName);
    console.log('X-axis JSON key:', xKey);

    // Ensure yAxes is an array
    const yAxisArray = Array.isArray(yAxes) ? yAxes : [yAxes].filter(Boolean);
    console.log('Y-axes URIs:', yAxisArray);

    // Handle different data structures:
    // 1. Array of objects: [{timestamp: ..., temp: ...}, ...]
    // 2. Object with arrays: {timestamp: [...], temp: [...]}
    let xValues = [];
    let yValuesMap = {};

    if (Array.isArray(apiData)) {
      // API returns array of objects - extract values from each object
      console.log('Data format: Array of objects, length:', apiData.length);

      // Sample first item to see available keys
      if (apiData.length > 0) {
        const keys = Object.keys(apiData[0]);
        console.log('First item keys:', keys);
        console.log('First item sample:', JSON.stringify(apiData[0], null, 2));

        // Find the actual key for x-axis (case-insensitive)
        const actualXKey = findKeyIgnoreCase(apiData[0], xKey);
        console.log(`Looking for "${xKey}", found actual key: "${actualXKey}"`);
        console.log(`Value for "${actualXKey}":`, apiData[0][actualXKey]);
      }

      // Extract x values using case-insensitive key matching
      xValues = apiData.map(item => getValueIgnoreCase(item, xKey));
      console.log('X values extracted:', xValues.length, 'items, first value:', xValues[0]);

      // Pre-extract y values for each series using case-insensitive key matching
      yAxisArray.forEach((yMetadataUri) => {
        const yMetadataName = extractLocalName(yMetadataUri);
        const yKey = metadataToJsonKey(yMetadataName);
        yValuesMap[yKey] = apiData.map(item => getValueIgnoreCase(item, yKey));
        console.log(`Y-axis "${yKey}" first value:`, yValuesMap[yKey][0]);
      });
    } else {
      // API returns object with arrays
      console.log('Data format: Object with arrays');
      xValues = apiData[xKey] || [];

      // If the data is nested (e.g., in a 'data' property), try to find it
      if (xValues.length === 0 && apiData.data) {
        xValues = apiData.data[xKey] || [];
      }

      yAxisArray.forEach((yMetadataUri) => {
        const yMetadataName = extractLocalName(yMetadataUri);
        const yKey = metadataToJsonKey(yMetadataName);
        yValuesMap[yKey] = apiData[yKey] || apiData.data?.[yKey] || [];
      });
    }

    console.log('X values count:', xValues.length);

    // Build traces for each y-axis metadata
    const traces = yAxisArray.map((yMetadataUri, index) => {
      const yMetadataName = extractLocalName(yMetadataUri);
      const yKey = metadataToJsonKey(yMetadataName);
      const aliasLabel = seriesAliasMap[yMetadataUri] || seriesAliasMap[yMetadataName] || seriesAliasMap[yKey];
      const seriesLabel = aliasLabel || generateSeriesLabel(yMetadataName);
      const yValues = yValuesMap[yKey] || [];

      console.log(`Series ${index}: metadata=${yMetadataName}, jsonKey=${yKey}, values=${yValues.length}`);

      const plotlyType = PLOTLY_TYPE_MAP[graphType] || 'scatter';
      const plotlyMode = PLOTLY_MODE_MAP[graphType];

      const trace = {
        x: xValues,
        y: yValues,
        type: plotlyType,
        name: seriesLabel,
        marker: { color: SERIES_COLORS[index % SERIES_COLORS.length] },
      };

      if (plotlyMode) {
        trace.mode = plotlyMode;
      }

      // For pie charts, use different structure
      if (graphType === 'CircularPlot') {
        return {
          values: yValues,
          labels: xValues,
          type: 'pie',
          name: seriesLabel,
        };
      }

      return trace;
    });

    console.log('Final traces:', traces);
    return traces;
  };

  const handleSubmit = async (values) => {
    if (!endpointPath) {
      setError('Could not determine API endpoint from BusinessModel');
      return;
    }

    setLoading(true);
    setError(null);
    setPlotData(null);

    try {
      // Build query params
      const queryParams = new URLSearchParams();
      Object.entries(values).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, value);
        }
      });

      let url = `${API_BASE_URL}${endpointPath}`;
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }

      console.log('Fetching data from:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
      });

      const data = await response.json();

      if (response.ok) {
        const traces = processDataForPlot(data);
        setPlotData(traces);
      } else {
        setError(data.detail || 'An error occurred while fetching data.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError('Could not connect to the API. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  // Generate axis labels
  const xLabel = xAxisLabel || generateSeriesLabel(extractLocalName(xAxis)) || 'X Axis';
  const yLabel = yAxisLabel || 'Value';
  const selectedLegendPosition = legendPosition === 'bottom' ? 'bottom' : 'right';

  const legendPresets = {
    bottom: {
      legend: { orientation: 'h', x: 0.5, y: -0.28, xanchor: 'center', yanchor: 'top' },
      margin: { l: 80, r: 40, t: 80, b: 140 },
    },
    right: {
      legend: { orientation: 'v', x: 1.02, y: 0.5, xanchor: 'left', yanchor: 'middle' },
      margin: { l: 80, r: 220, t: 80, b: 80 },
    },
  };
  const selectedLegend = legendPresets[selectedLegendPosition];

  // Plotly layout configuration
  const layout = {
    title: {
      text: displayTitle,
      font: { size: 18 },
    },
    xaxis: {
      title: {
        text: xLabel,
        standoff: 16,
      },
      automargin: true,
    },
    yaxis: {
      title: {
        text: yLabel,
        standoff: 12,
      },
      automargin: true,
    },
    legend: selectedLegend.legend,
    autosize: true,
    margin: selectedLegend.margin,
  };

  const plotConfig = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
  };

  if (bmParams.length === 0) {
    return (
      <Card
        title={<Title level={4} style={{ margin: 0 }}>{displayTitle}</Title>}
        style={{ marginBottom: 16 }}
      >
        <Alert
          type="warning"
          message="No parameters found"
          description={`Could not find parameters for BusinessModel: ${bmLocalName}`}
        />
      </Card>
    );
  }

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>{displayTitle}</Title>}
      style={{ marginBottom: 16 }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Graph Type: {graphType} | Endpoint: POST {endpointPath}
      </Text>

      {/* Parameter input form */}
      <Form
        form={formInstance}
        layout="inline"
        onFinish={handleSubmit}
        disabled={loading}
        style={{ marginBottom: 16 }}
      >
        {bmParams.map((param, index) => (
          <Form.Item
            key={index}
            name={param.label}
            label={param.label}
            rules={[{ required: true, message: `Enter ${param.label}` }]}
          >
            <InputNumber style={{ width: 150 }} placeholder={param.label} />
          </Form.Item>
        ))}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            {loading ? 'Loading...' : 'Load Data'}
          </Button>
        </Form.Item>
      </Form>

      {/* Error display */}
      {error && (
        <Alert
          type="error"
          message="Error"
          description={error}
          style={{ marginBottom: 16 }}
          closable
          onClose={() => setError(null)}
        />
      )}

      {/* Loading spinner */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <Text style={{ display: 'block', marginTop: 16 }}>Loading data...</Text>
        </div>
      )}

      {/* Plot display */}
      {plotData && !loading && (
        <div style={{ width: '100%', minHeight: 400 }}>
          <Plot
            data={plotData}
            layout={layout}
            config={plotConfig}
            style={{ width: '100%', height: '100%' }}
            useResizeHandler={true}
          />
        </div>
      )}

      {/* Initial state - no data yet */}
      {!plotData && !loading && !error && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          background: '#fafafa',
          borderRadius: 8,
          border: '1px dashed #d9d9d9'
        }}>
          <Text type="secondary">
            Enter the parameters above and click "Load Data" to display the graph.
          </Text>
        </div>
      )}
    </Card>
  );
}
