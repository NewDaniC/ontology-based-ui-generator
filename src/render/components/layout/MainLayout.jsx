import { Layout } from 'antd';
import HeaderComponent from './HeaderComponent';
import SidebarComponent from './SidebarComponent';
import FooterComponent from './FooterComponent';

const { Content } = Layout;

export default function MainLayout({ 
  children, 
  layoutConfig = {},
  views = [],
  selectedView,
  onViewSelect 
}) {
  const {
    headerTitle = 'SmartLEM',
    headerHeight = 64,
    sidebarWidth = 200,
    footerText = 'SmartLEM',
    footerHeight = 50,
  } = layoutConfig;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Header */}
      <HeaderComponent 
        title={headerTitle} 
        height={headerHeight} 
      />

      <Layout>
        {/* Sidebar */}
        <SidebarComponent 
          views={views}
          selectedView={selectedView}
          onViewSelect={onViewSelect}
          width={sidebarWidth}
          headerHeight={headerHeight}
          footerHeight={footerHeight}
        />

        {/* Content Area */}
        <Content
          style={{
            marginLeft: sidebarWidth,
            marginTop: headerHeight,
            marginBottom: footerHeight,
            padding: 24,
            minHeight: `calc(100vh - ${headerHeight}px - ${footerHeight}px)`,
            background: '#f0f2f5',
            overflow: 'auto',
          }}
        >
          {children}
        </Content>
      </Layout>

      {/* Footer */}
      <FooterComponent 
        text={footerText} 
        height={footerHeight} 
      />
    </Layout>
  );
}
