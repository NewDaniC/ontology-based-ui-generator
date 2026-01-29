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
        <Paragraph style={{ marginTop: 16 }}>Loading ontologies...</Paragraph>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error loading ontologies"
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

  const { pages = [], labels = [], tables = [] } = uiElements;

  return (
    <div style={{ 
      maxWidth: 1200, 
      margin: '0 auto', 
      padding: 24,
      background: '#f0f2f5',
      minHeight: '100vh'
    }}>
      <div style={{ 
        background: 'white', 
        padding: 24, 
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <Title level={2} style={{ textAlign: 'center' }}>
          SmartLEM - UI Generator
        </Title>

        <Divider />

        {/* Páginas */}
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

        {/* Tabelas */}
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
        <Title level={3}>API Endpoints</Title>
        <EndpointsComponent apiEndpoints={apiEndpoints} />
      </div>
    </div>
  );
}