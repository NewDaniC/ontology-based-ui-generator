import { Typography } from 'antd';

const { Title } = Typography;

export default function TitleComponent({ text, level }) {
  // Parse level to integer, default to 1 if not provided or invalid
  const headingLevel = parseInt(level, 10) || 1;

  // Ensure level is between 1 and 5 (Ant Design Title constraint)
  const validLevel = Math.min(Math.max(headingLevel, 1), 5);

  return (
    <Title level={validLevel} style={{ marginBottom: 16 }}>
      {text}
    </Title>
  );
}
