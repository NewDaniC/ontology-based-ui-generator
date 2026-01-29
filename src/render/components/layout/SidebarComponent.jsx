import { Layout, Menu } from 'antd';
import { FileOutlined } from '@ant-design/icons';

export default function SidebarComponent({ 
  views = [], 
  selectedView, 
  onViewSelect, 
  width = 200, 
  headerHeight = 64, 
  footerHeight = 50 
}) {
  // Generate menu items from views
  const menuItems = views.map((view, index) => ({
    key: view.path,
    icon: <FileOutlined />,
    label: view.name,
  }));

  return (
    <Layout.Sider
      width={width}
      style={{
        background: '#001529',
        position: 'fixed',
        top: headerHeight,
        bottom: footerHeight,
        left: 0,
        overflowY: 'auto',
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
