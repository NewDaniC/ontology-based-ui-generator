import { Card, Table, Typography, Tag } from 'antd';

const { Title, Text } = Typography;

export default function TableComponent({ table, bm, parameters }) {
  const tableName = table?.split('#')[1] || table?.split('/').pop() || 'Table';
  const bmName = bm?.split('#')[1] || bm?.split('/').pop() || 'Unknown';
  
  // Search for parameters corresponding to the business model
  const bmParams = parameters?.[bmName] || [];

  const columns = [
    {
      title: 'Parameter',
      dataIndex: 'label',
      key: 'label',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (text) => <Tag color="blue">{text}</Tag>
    }
  ];

  const dataSource = bmParams.map((param, index) => ({
    key: index,
    label: param.label,
    type: param.type
  }));

  return (
    <Card 
      title={<Title level={4} style={{ margin: 0 }}>{tableName}</Title>}
      style={{ marginBottom: 16 }}
    >
      {dataSource.length > 0 ? (
        <Table 
          columns={columns} 
          dataSource={dataSource} 
          pagination={false}
          size="small"
        />
      ) : (
        <Text type="secondary">No parameters were found for this Business Model.
        </Text>
      )}
    </Card>
  );
}