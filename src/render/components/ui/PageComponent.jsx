import { Card, Typography, Tag } from 'antd';
import { FileOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function PageComponent({ page, representation }) {
  const pageName = page?.split('#')[1] || page?.split('/').pop() || 'Page';
  const repName = representation?.split('#')[1] || representation?.split('/').pop();

  return (
    <Card 
      style={{ marginBottom: 16, borderLeft: '4px solid #52c41a' }}
      size="small"
    >
      <Space>
        <FileOutlined style={{ fontSize: 20, color: '#52c41a' }} />
        <div>
          <Title level={5} style={{ margin: 0 }}>{pageName}</Title>
          {repName && (
            <Text type="secondary">
              Representation: <Tag>{repName}</Tag>
            </Text>
          )}
        </div>
      </Space>
    </Card>
  );
}