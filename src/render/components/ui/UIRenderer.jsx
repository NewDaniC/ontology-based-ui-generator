import { Typography, Divider, Spin, Alert } from 'antd';
import LabelComponent from './LabelComponent';
import TableComponent from './TableComponent';
import EndpointsComponent from './EndpointsComponent';
import PageComponent from './PageComponent';

const { Title, Paragraph } = Typography;

// Component map for dynamic rendering based on element type
const COMPONENT_MAP = {
  Label: ({ element }) => (
    <LabelComponent
      key={element.element}
      label={element.element}
      text={element.text}
    />
  ),
  Table: ({ element, apiEndpoints }) => (
    <TableComponent
      key={element.element}
      table={element.element}
      bm={element.bm}
      parameters={apiEndpoints?.parameters}
    />
  ),
  // Add new element types here following the pattern:
  // TypeName: ({ element, apiEndpoints }) => <TypeComponent {...props} />
};

function renderElement(element, apiEndpoints) {
  const Component = COMPONENT_MAP[element.elementType];
  if (!Component) {
    console.warn(`Unknown element type: ${element.elementType}`);
    return null;
  }
  return <Component key={element.element} element={element} apiEndpoints={apiEndpoints} />;
}

export default function UIRenderer({ uiElements, apiEndpoints, loading, error }) {
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 50 }}>
        <Spin size="large" />
        <Paragraph style={{ marginTop: 16 }}>Loading view...</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        title="Error loading view"
        description={error}
        type="error"
        showIcon
        style={{ margin: 24 }}
      />
    );
  }

  if (!uiElements) {
    return null;
  }

  const { pages = [], elements = [], endpoints = [] } = uiElements;
  const shouldRenderEndpoints = Array.isArray(endpoints) ? endpoints.length > 0 : Boolean(endpoints);

  return (
    <div style={{
      background: 'white',
      padding: 24,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Pages (containers) */}
      {pages.length > 0 && (
        <>
          <Title level={3}>Pages</Title>
          {pages.map((page, idx) => (
            <PageComponent
              key={idx}
              page={page.page}
              representation={page.representation}
            />
          ))}
          <Divider />
        </>
      )}

      {/* UI Elements - rendered in ontology-defined order */}
      {elements.length > 0 && (
        <>
          {elements.map((element) => renderElement(element, apiEndpoints))}
          <Divider />
        </>
      )}

      {/* Endpoints */}
      {shouldRenderEndpoints && (
        <>
          <Title level={3}>API Endpoints</Title>
          <EndpointsComponent apiEndpoints={apiEndpoints} />
        </>
      )}
    </div>
  );
}