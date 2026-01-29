import { Card, Typography, Space, Tag, Divider } from 'antd';
import { ApiOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function EndpointsComponent({ apiEndpoints }) {
  const { metadata = [], parameters = {} } = apiEndpoints || {};

  return (
    <Card 
      title={
        <Space>
          <span>API Endpoints</span>
        </Space>
      }
      style={{ marginTop: 24 }}
    >
      {/* Metadata Endpoints */}
      {metadata.length > 0 && (
        <>
          <Title level={5}>Metadata Endpoints:</Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {metadata.map((endpoint, idx) => (
              <div 
                key={idx}
                style={{
                  fontFamily: 'monospace',
                  background: '#f5f5f5',
                  padding: '8px 12px',
                  borderRadius: 4,
                  border: '1px solid #d9d9d9'
                }}
              >
                <Tag color="green">GET</Tag>
                <Text code>localhost:5000/{endpoint}</Text>
              </div>
            ))}
          </Space>
          <Divider />
        </>
      )}

      {/* Business Model Endpoints */}
      {Object.keys(parameters).length > 0 && (
        <>
          <Title level={5}>Business Model Endpoints:</Title>
          <Space orientation="vertical" style={{ width: '100%' }}>
            {Object.entries(parameters).map(([bmName, params], idx) => {
              const paramString = params.map(p => `${p.label}=<${p.type}>`).join('&');
              return (
                <div 
                  key={idx}
                  style={{
                    fontFamily: 'monospace',
                    background: '#f5f5f5',
                    padding: '8px 12px',
                    borderRadius: 4,
                    border: '1px solid #d9d9d9',
                    wordBreak: 'break-all'
                  }}
                >
                  <Tag color="blue">POST</Tag>
                  <Text code>localhost:5000/{bmName}/run?{paramString}</Text>
                </div>
              );
            })}
          </Space>
        </>
      )}

      {metadata.length === 0 && Object.keys(parameters).length === 0 && (
        <Text type="secondary">No endpoints found.</Text>
      )}
    </Card>
  );
}