import { Layout } from 'antd';

export default function FooterComponent({ text = 'SmartLEM', height = 50 }) {
  const year = new Date().getFullYear();
  
  return (
    <Layout.Footer
      style={{
        textAlign: 'center',
        background: '#001529',
        color: '#fff',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: height,
        lineHeight: `${height}px`,
        padding: 0,
        zIndex: 1000,
      }}
    >
      {text} © {year}
    </Layout.Footer>
  );
}
