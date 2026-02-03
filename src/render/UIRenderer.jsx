import { Typography, Divider, Spin, Alert } from 'antd';
import LabelComponent from './components/LabelComponent';
import TableComponent from './components/TableComponent';
import EndpointsComponent from './components/EndpointsComponent';
import PageComponent from './components/PageComponent';

const { Title, Paragraph } = Typography;

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

  const { pages = [], labels = [], tables = [], endpoints = [] } = uiElements;
  const shouldRenderEndpoints = Array.isArray(endpoints) ? endpoints.length > 0 : Boolean(endpoints);

  return (
    <div style={{ 
      background: 'white', 
      padding: 24, 
      borderRadius: 8,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Pages */}
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

      {/* Labels */}
      {labels.length > 0 && (
        <>
          <Title level={3}>Labels</Title>
          {labels.map((label, idx) => (
            <LabelComponent 
              key={idx} 
              label={label.label} 
              text={label.text} 
            />
          ))}
          <Divider />
        </>
      )}

      {/* Tables */}
      {tables.length > 0 && (
        <>
          <Title level={3}>Tables</Title>
          {tables.map((table, idx) => (
            <TableComponent 
              key={idx} 
              table={table.table} 
              bm={table.bm}
              parameters={apiEndpoints?.parameters}
            />
          ))}
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