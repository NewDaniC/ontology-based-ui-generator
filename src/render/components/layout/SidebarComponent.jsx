import { useEffect, useState } from 'react';
import { Layout, Menu } from 'antd';
import { FileOutlined } from '@ant-design/icons';

export default function SidebarComponent({ 
  views, 
  selectedView, 
  onViewSelect, 
  width, 
  headerHeight, 
  footerHeight,
  headerIsFixed,
  footerIsFixed
}) {
  const [dynamicTop, setDynamicTop] = useState(headerHeight);

  useEffect(() => {
    if (headerIsFixed) {
      setDynamicTop(headerHeight);
      return undefined;
    }

    const handleScroll = () => {
      const nextTop = Math.max(0, headerHeight - window.scrollY);
      setDynamicTop(nextTop);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [headerIsFixed, headerHeight]);

  // Sidebar always stays below header and above footer
  // top: follows header while scrolling when header is not fixed
  // bottom: footerHeight if footer is fixed, otherwise 0 (goes to bottom of page)
  const topOffset = headerIsFixed ? headerHeight : dynamicTop;
  const bottomOffset = footerIsFixed ? footerHeight : 0;

  // Generate menu items from views
  const menuItems = views.map((view, index) => ({
    key: view.path,
    icon: <FileOutlined />,
    label: view.name,
  }));

  // Sidebar is always fixed
  const sidebarStyle = {
    position: 'fixed',
    top: topOffset,
    bottom: bottomOffset,
    left: 0,
    overflowY: 'auto',
  };

  return (
    <Layout.Sider
      width={width}
      style={{
        background: '#001529',
        ...sidebarStyle,
      }}
    >
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedView]}
        onClick={({ key }) => onViewSelect(key)}
        items={menuItems}
        style={{
          background: '#001529',
          borderRight: 'none',
        }}
      />
    </Layout.Sider>
  );
}
