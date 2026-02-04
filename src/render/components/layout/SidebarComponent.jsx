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
  // Generate menu items from views
  const menuItems = views.map((view) => ({
    key: view.path,
    icon: <FileOutlined />,
    label: view.name,
  }));

  // When header is fixed: use position fixed with top offset
  // When header is not fixed: use position sticky to "stick" below the header instantly
  const sidebarStyle = headerIsFixed
    ? {
        position: 'fixed',
        top: headerHeight,
        bottom: footerIsFixed ? footerHeight : 0,
        left: 0,
        overflowY: 'auto',
      }
    : {
        position: 'sticky',
        top: 0,
        height: `calc(100vh - ${footerIsFixed ? footerHeight : 0}px)`,
        left: 0,
        overflowY: 'auto',
      };

  return (
    <Layout.Sider
      width={width}
      style={{
        background: '#001529',
        //background: '#ffffffff',
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
          //background: '#ffffffff',
          borderRight: 'none',
        }}
      />
    </Layout.Sider>
  );
}
