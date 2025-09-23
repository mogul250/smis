import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { adminAPI } from '../../services/apiService';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiSettings, FiSave, FiRefreshCw, FiDatabase, FiShield, FiMail, FiServer } from 'react-icons/fi';

const AdminSystem = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [actionMessage, setActionMessage] = useState(null);
  const [configData, setConfigData] = useState({});

  const { data: systemConfig, loading, error, refetch } = useApi(adminAPI.getSystemConfig);
  const { loading: saving, execute: saveConfig } = useAsyncOperation();

  React.useEffect(() => {
    if (systemConfig) {
      setConfigData(systemConfig);
    }
  }, [systemConfig]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Admin access required.</Alert>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'General Settings', icon: FiSettings },
    { id: 'database', label: 'Database', icon: FiDatabase },
    { id: 'security', label: 'Security', icon: FiShield },
    { id: 'email', label: 'Email Settings', icon: FiMail },
    { id: 'system', label: 'System Info', icon: FiServer }
  ];

  const handleConfigChange = (section, key, value) => {
    setConfigData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSaveConfig = async () => {
    try {
      await saveConfig(() => adminAPI.updateSystemConfig(configData));
      setActionMessage({ type: 'success', text: 'System configuration saved successfully!' });
      refetch();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to save configuration' 
      });
    }
  };

  const handleTestEmailConfig = async () => {
    try {
      await adminAPI.testEmailConfig();
      setActionMessage({ type: 'success', text: 'Test email sent successfully!' });
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to send test email' 
      });
    }
  };

  const handleBackupDatabase = async () => {
    try {
      await adminAPI.backupDatabase();
      setActionMessage({ type: 'success', text: 'Database backup initiated successfully!' });
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to backup database' 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Configuration</h1>
                <p className="text-gray-600 mt-1">Manage system settings, security, and configuration</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={refetch}>
                  Refresh
                </Button>
                <Button 
                  variant="primary" 
                  size="sm"
                  icon={FiSave} 
                  onClick={handleSaveConfig}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            </div>

            {actionMessage && (
              <Alert 
                variant={actionMessage.type}
                dismissible
                onDismiss={() => setActionMessage(null)}
              >
                {actionMessage.text}
              </Alert>
            )}

            {loading ? (
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            ) : error ? (
              <Alert variant="error">
                Failed to load system configuration: {error}
              </Alert>
            ) : (
              <Card>
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors duration-200 ${
                            activeTab === tab.id
                              ? 'border-blue-500 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'general' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Institution Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Institution Name"
                            value={configData.general?.institutionName || ''}
                            onChange={(e) => handleConfigChange('general', 'institutionName', e.target.value)}
                            placeholder="Enter institution name"
                          />
                          <Input
                            label="Institution Code"
                            value={configData.general?.institutionCode || ''}
                            onChange={(e) => handleConfigChange('general', 'institutionCode', e.target.value)}
                            placeholder="Enter institution code"
                          />
                          <Input
                            label="Academic Year"
                            value={configData.general?.academicYear || ''}
                            onChange={(e) => handleConfigChange('general', 'academicYear', e.target.value)}
                            placeholder="e.g., 2024-2025"
                          />
                          <Input
                            label="Current Semester"
                            value={configData.general?.currentSemester || ''}
                            onChange={(e) => handleConfigChange('general', 'currentSemester', e.target.value)}
                            placeholder="e.g., Fall 2024"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Contact Email"
                            type="email"
                            value={configData.general?.contactEmail || ''}
                            onChange={(e) => handleConfigChange('general', 'contactEmail', e.target.value)}
                            placeholder="admin@institution.edu"
                          />
                          <Input
                            label="Contact Phone"
                            value={configData.general?.contactPhone || ''}
                            onChange={(e) => handleConfigChange('general', 'contactPhone', e.target.value)}
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div className="mt-6">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Institution Address
                          </label>
                          <textarea
                            value={configData.general?.address || ''}
                            onChange={(e) => handleConfigChange('general', 'address', e.target.value)}
                            rows={3}
                            className="form-textarea"
                            placeholder="Enter complete institution address..."
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'database' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Status</h3>
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-semibold text-blue-900">Database Information</h4>
                            <div className="flex items-center text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              <span className="text-sm font-medium">Connected</span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-blue-700 font-medium">Database Type:</span>
                                <span className="font-semibold text-blue-900">{configData.database?.type || 'MySQL'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700 font-medium">Database Size:</span>
                                <span className="font-semibold text-blue-900">{configData.database?.size || '2.4 GB'}</span>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span className="text-blue-700 font-medium">Last Backup:</span>
                                <span className="font-semibold text-blue-900">
                                  {configData.database?.lastBackup 
                                    ? new Date(configData.database.lastBackup).toLocaleDateString()
                                    : 'Never'
                                  }
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-blue-700 font-medium">Uptime:</span>
                                <span className="font-semibold text-blue-900">99.9%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Operations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Button variant="primary" onClick={handleBackupDatabase} className="justify-start">
                            <FiDatabase className="w-4 h-4 mr-2" />
                            Create Backup
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <FiRefreshCw className="w-4 h-4 mr-2" />
                            View Backup History
                          </Button>
                          <Button variant="warning" className="justify-start">
                            <FiSettings className="w-4 h-4 mr-2" />
                            Optimize Database
                          </Button>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Backup Frequency (hours)"
                            type="number"
                            value={configData.database?.backupFrequency || '24'}
                            onChange={(e) => handleConfigChange('database', 'backupFrequency', e.target.value)}
                            placeholder="24"
                          />
                          <Input
                            label="Retention Period (days)"
                            type="number"
                            value={configData.database?.retentionPeriod || '30'}
                            onChange={(e) => handleConfigChange('database', 'retentionPeriod', e.target.value)}
                            placeholder="30"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'security' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password Policy
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={configData.security?.requireUppercase || false}
                                onChange={(e) => handleConfigChange('security', 'requireUppercase', e.target.checked)}
                                className="form-checkbox"
                              />
                              <span className="ml-2 text-sm">Require uppercase letters</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={configData.security?.requireNumbers || false}
                                onChange={(e) => handleConfigChange('security', 'requireNumbers', e.target.checked)}
                                className="form-checkbox"
                              />
                              <span className="ml-2 text-sm">Require numbers</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={configData.security?.requireSpecialChars || false}
                                onChange={(e) => handleConfigChange('security', 'requireSpecialChars', e.target.checked)}
                                className="form-checkbox"
                              />
                              <span className="ml-2 text-sm">Require special characters</span>
                            </label>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <Input
                            label="Minimum Password Length"
                            type="number"
                            value={configData.security?.minPasswordLength || '8'}
                            onChange={(e) => handleConfigChange('security', 'minPasswordLength', e.target.value)}
                          />
                          <Input
                            label="Session Timeout (minutes)"
                            type="number"
                            value={configData.security?.sessionTimeout || '60'}
                            onChange={(e) => handleConfigChange('security', 'sessionTimeout', e.target.value)}
                          />
                          <Input
                            label="Max Login Attempts"
                            type="number"
                            value={configData.security?.maxLoginAttempts || '5'}
                            onChange={(e) => handleConfigChange('security', 'maxLoginAttempts', e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={configData.security?.enableTwoFactor || false}
                            onChange={(e) => handleConfigChange('security', 'enableTwoFactor', e.target.checked)}
                            className="form-checkbox"
                          />
                          <span className="ml-2 text-sm font-medium">Enable Two-Factor Authentication</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {activeTab === 'email' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input
                          label="SMTP Server"
                          value={configData.email?.smtpServer || ''}
                          onChange={(e) => handleConfigChange('email', 'smtpServer', e.target.value)}
                        />
                        <Input
                          label="SMTP Port"
                          type="number"
                          value={configData.email?.smtpPort || '587'}
                          onChange={(e) => handleConfigChange('email', 'smtpPort', e.target.value)}
                        />
                        <Input
                          label="Username"
                          value={configData.email?.username || ''}
                          onChange={(e) => handleConfigChange('email', 'username', e.target.value)}
                        />
                        <Input
                          label="Password"
                          type="password"
                          value={configData.email?.password || ''}
                          onChange={(e) => handleConfigChange('email', 'password', e.target.value)}
                        />
                        <Input
                          label="From Email"
                          type="email"
                          value={configData.email?.fromEmail || ''}
                          onChange={(e) => handleConfigChange('email', 'fromEmail', e.target.value)}
                        />
                        <Input
                          label="From Name"
                          value={configData.email?.fromName || ''}
                          onChange={(e) => handleConfigChange('email', 'fromName', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={configData.email?.enableSSL || false}
                            onChange={(e) => handleConfigChange('email', 'enableSSL', e.target.checked)}
                            className="form-checkbox"
                          />
                          <span className="ml-2 text-sm">Enable SSL/TLS</span>
                        </label>
                      </div>

                      <div>
                        <Button variant="outline" onClick={handleTestEmailConfig}>
                          Send Test Email
                        </Button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'system' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-medium text-gray-900 mb-3">System Information</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Version:</span>
                              <span className="font-medium">{configData.system?.version || '1.0.0'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Environment:</span>
                              <span className="font-medium">{configData.system?.environment || 'Production'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Uptime:</span>
                              <span className="font-medium">{configData.system?.uptime || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Last Updated:</span>
                              <span className="font-medium">
                                {configData.system?.lastUpdated 
                                  ? new Date(configData.system.lastUpdated).toLocaleString()
                                  : 'N/A'
                                }
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-medium text-gray-900 mb-3">Performance Metrics</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">CPU Usage:</span>
                              <span className="font-medium">{configData.system?.cpuUsage || '0'}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Memory Usage:</span>
                              <span className="font-medium">{configData.system?.memoryUsage || '0'}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Disk Usage:</span>
                              <span className="font-medium">{configData.system?.diskUsage || '0'}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Active Users:</span>
                              <span className="font-medium">{configData.system?.activeUsers || '0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium text-gray-900 mb-3">System Maintenance</h3>
                        <div className="flex space-x-4">
                          <Button variant="warning">
                            Clear Cache
                          </Button>
                          <Button variant="outline">
                            View System Logs
                          </Button>
                          <Button variant="danger">
                            Restart System
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSystem;
