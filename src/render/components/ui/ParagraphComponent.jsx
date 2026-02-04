import { Typography } from 'antd';

const { Paragraph, Text } = Typography;

export default function ParagraphComponent({ text }) {
  return (
    <Paragraph
      style={{
        fontSize: 15,
        color: '#595959',
        margin: '12px 0',
        lineHeight: 1.6
      }}
    >
      {text}
    </Paragraph>
  );
}
