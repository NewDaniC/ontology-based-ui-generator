import { Typography, Spin, Alert } from 'antd';
import LabelComponent from './LabelComponent';
import TitleComponent from './TitleComponent';
import TableComponent from './TableComponent';
import FormComponent from './FormComponent';
import ParagraphComponent from './ParagraphComponent';

const { Paragraph } = Typography;

// Component map for dynamic rendering based on element type
const COMPONENT_MAP = {
  Label: ({ element }) => (
    <LabelComponent
      key={element.element}
      label={element.element}
      text={element.text}
    />
  ),
  Title: ({ element }) => (
    <TitleComponent
      key={element.element}
      text={element.text}
      level={element.level}
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
  Form: ({ element, apiEndpoints }) => (
    <FormComponent
      key={element.element}
      form={element.element}
      title={element.title}
      bm={element.bm}
      parameters={apiEndpoints?.parameters}
    />
  ),
  Paragraph: ({ element }) => (
    <ParagraphComponent
      key={element.element}
      text={element.text}
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

  const { elements = [] } = uiElements;

  if (elements.length === 0) {
    return null;
  }

  return (
    <div style={{
      background: 'white',
      padding: 24,
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {elements.map((element) => renderElement(element, apiEndpoints))}
    </div>
  );
}
