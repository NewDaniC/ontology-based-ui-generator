import { Layout, Typography } from 'antd';

const { Title } = Typography;

export default function HeaderComponent({ title, height, fixed }) {
  const fixedStyle = fixed
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
      }
    : { position: 'static' };

  return (
    <Layout.Header
      style={{
        height: height,
        background: '#001529',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        ...fixedStyle,
      }}
    >
      <Title 
        level={4} 
        style={{ 
          margin: 0, 
          color: '#fff',
          fontWeight: 600,
        }}
      >
        {title}
      </Title>
    </Layout.Header>
  );
}
