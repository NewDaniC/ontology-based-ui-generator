import { Typography } from 'antd';

const { Title, Text } = Typography;

export default function LabelComponent({ label, text }) {
  const labelName = label?.split('#')[1] || label?.split('/').pop() || 'Label';
  
  return (
    <div style={{
      background: '#e6f7ff',
      borderLeft: '4px solid #1890ff',
      padding: '12px 16px',
      margin: '12px 0',
      borderRadius: '4px'
    }}>
      <Text type="secondary" style={{ fontSize: 15 }}>{labelName}</Text>
      <Title level={4} style={{ margin: '4px 0 0 0' }}>{text}</Title>
    </div>
  );
}