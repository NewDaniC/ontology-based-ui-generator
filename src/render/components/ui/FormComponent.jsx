import { useState } from 'react';
import { Card, Form, Input, InputNumber, Button, Typography, Alert, notification, Upload, DatePicker } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, UploadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// API base URL
const API_BASE_URL = 'http://127.0.0.1:5000';

// Map ontology parameter types to form field types
function getFieldComponent(paramType, paramLabel) {
  const type = paramType?.toLowerCase() || 'str';

  switch (type) {
    case 'float':
    case 'number':
      return <InputNumber style={{ width: '100%' }} step={0.01} placeholder={`Enter ${paramLabel}`} />;
    case 'int':
    case 'integer':
      return <InputNumber style={{ width: '100%' }} step={1} placeholder={`Enter ${paramLabel}`} />;
    case 'uploadfile':
    case 'file':
      return (
        <Upload
          beforeUpload={() => false}
          maxCount={1}
          accept=".json,.csv,.xml,.txt"
        >
          <Button icon={<UploadOutlined />}>Select File</Button>
        </Upload>
      );
    case 'date':
      return <DatePicker style={{ width: '100%' }} placeholder={`Select ${paramLabel}`} />;
    case 'str':
    case 'string':
    default:
      return <Input placeholder={`Enter ${paramLabel}`} />;
  }
}

// Extract endpoint path from BusinessModel URI
// Pattern: http://www.cedri.com/SmartLEM-EC-Operations#CreateEnergyCommunity
// Becomes: /EC_Operations/CreateEnergyCommunity/run
function buildEndpointPath(bmUri) {
  if (!bmUri) return null;

  // Extract the class and name from the URI
  // URI format: http://www.cedri.com/SmartLEM-{Class}#{Name}
  const parts = bmUri.split('#');
  if (parts.length !== 2) return null;

  const basePart = parts[0]; // http://www.cedri.com/SmartLEM-EC-Operations
  const name = parts[1];     // CreateEnergyCommunity

  // Extract class from base (e.g., "EC-Operations" from "SmartLEM-EC-Operations")
  const classMatch = basePart.match(/SmartLEM-(.+)$/);
  if (!classMatch) return null;

  // Convert "EC-Operations" to "EC_Operations"
  const className = classMatch[1].replace(/-/g, '_');

  return `/${className}/${name}/run`;
}

export default function FormComponent({ form, title, bm, parameters }) {
  const [formInstance] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const formName = form?.split('#')[1] || form?.split('/').pop() || 'Form';
  const displayTitle = title || formName;

  // Extract BusinessModel name - try multiple formats to match parameters key
  const bmLocalName = bm?.split('#')[1] || bm?.split('/').pop() || '';

  // Try to find parameters with different key formats
  // Parameters might be indexed as "CreateEnergyCommunity" or "EC_Operations/CreateEnergyCommunity"
  const findParams = () => {
    if (!parameters || !bmLocalName) return [];

    // Direct match
    if (parameters[bmLocalName]) return parameters[bmLocalName];

    // Try with prefix (EC_Operations/Name format)
    for (const key of Object.keys(parameters)) {
      if (key.endsWith(`/${bmLocalName}`) || key === bmLocalName) {
        return parameters[key];
      }
    }

    return [];
  };

  const bmParams = findParams();
  const bmName = bmLocalName;

  // Build endpoint path
  const endpointPath = buildEndpointPath(bm);

  const handleSubmit = async (values) => {
    if (!endpointPath) {
      notification.error({
        message: 'Error',
        description: 'Could not determine API endpoint from BusinessModel',
        duration: 5,
        placement: 'topRight',
      });
      return;
    }

    setLoading(true);

    try {
      // Build a map of param labels to their types
      const paramTypeMap = {};
      bmParams.forEach(p => {
        paramTypeMap[p.label] = p.type?.toLowerCase() || 'str';
      });

      // Separate file params from query params
      const queryParams = new URLSearchParams();
      const formData = new FormData();
      let hasFiles = false;

      Object.entries(values).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;

        const paramType = paramTypeMap[key];
        const isFileType = paramType === 'uploadfile' || paramType === 'file';

        if (isFileType) {
          // File params go to FormData body
          hasFiles = true;
          if (Array.isArray(value) && value[0]?.originFileObj) {
            formData.append(key, value[0].originFileObj);
          } else if (value?.fileList?.[0]?.originFileObj) {
            formData.append(key, value.fileList[0].originFileObj);
          } else if (value instanceof File) {
            formData.append(key, value);
          }
        } else {
          // Non-file params go to query string
          if (value?._d) {
            // Handle DatePicker moment/dayjs object
            queryParams.append(key, value.format('YYYY-MM-DD'));
          } else {
            queryParams.append(key, value);
          }
        }
      });

      // Build URL with query params
      let url = `${API_BASE_URL}${endpointPath}`;
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }

      let fetchOptions = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
        },
      };

      // Add FormData body only if there are files
      if (hasFiles) {
        fetchOptions.body = formData;
        // Don't set Content-Type header - browser will set it with boundary
      }

      console.log('Submitting to:', url, hasFiles ? '(with FormData body)' : '(no body)');

      const response = await fetch(url, fetchOptions);

      const data = await response.json();

      if (response.ok) {
        notification.success({
          message: 'Success',
          description: `Operation completed successfully.`,
          duration: 5,
          placement: 'topRight',
          icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
        });
        // Reset form after successful submission
        formInstance.resetFields();
      } else {
        notification.error({
          message: 'Request Failed',
          description: data.detail || 'An error occurred while processing your request.',
          duration: 5,
          placement: 'topRight',
          icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
        });
      }
    } catch (err) {
      console.error('API Error:', err);
      notification.error({
        message: 'Network Error',
        description: 'Could not connect to the API. Is the server running?',
        duration: 5,
        placement: 'topRight',
        icon: <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
      });
    } finally {
      setLoading(false);
    }
  };

  if (bmParams.length === 0) {
    return (
      <Card
        title={<Title level={4} style={{ margin: 0 }}>{displayTitle}</Title>}
        style={{ marginBottom: 16 }}
      >
        <Alert
          type="warning"
          message="No parameters found"
          description={`Could not find parameters for BusinessModel: ${bmName}`}
        />
      </Card>
    );
  }

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>{displayTitle}</Title>}
      style={{ marginBottom: 16 }}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Endpoint: POST {endpointPath}
      </Text>

      <Form
        form={formInstance}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={loading}
      >
        {bmParams.map((param, index) => {
          const paramType = param.type?.toLowerCase();
          const isFileField = paramType === 'uploadfile' || paramType === 'file';

          return (
            <Form.Item
              key={index}
              name={param.label}
              label={param.label}
              rules={[{ required: true, message: `Please ${isFileField ? 'select' : 'enter'} ${param.label}` }]}
              valuePropName={isFileField ? 'fileList' : 'value'}
              getValueFromEvent={isFileField ? (e) => (Array.isArray(e) ? e : e?.fileList) : undefined}
            >
              {getFieldComponent(param.type, param.label)}
            </Form.Item>
          );
        })}

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {loading ? 'Submitting...' : 'Submit'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
