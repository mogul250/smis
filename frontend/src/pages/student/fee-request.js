import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  FiPlus, 
  FiDollarSign, 
  FiFileText, 
  FiCalendar, 
  FiUser,
  FiSend,
  FiInfo,
  FiCheckCircle,
  FiClock,
  FiX
} from 'react-icons/fi';

const StudentFeeRequest = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [formData, setFormData] = useState({
    fee_type: '',
    amount: '',
    description: '',
    due_date: '',
    priority: 'normal',
    supporting_documents: null
  });

  // Mock data for recent requests
  const [recentRequests] = useState([
    {
      id: 1,
      fee_type: 'Library Fine',
      amount: 25.00,
      description: 'Late return of textbooks',
      status: 'approved',
      requested_date: '2024-09-15',
      processed_date: '2024-09-16'
    },
    {
      id: 2,
      fee_type: 'Lab Equipment',
      amount: 150.00,
      description: 'Replacement for damaged microscope lens',
      status: 'pending',
      requested_date: '2024-09-20',
      processed_date: null
    },
    {
      id: 3,
      fee_type: 'Parking Permit',
      amount: 50.00,
      description: 'Monthly parking permit for October',
      status: 'rejected',
      requested_date: '2024-09-10',
      processed_date: '2024-09-12'
    }
  ]);

  if (!user || user.role !== 'student') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. Student access required.</Alert>
      </div>
    );
  }

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      // Validate form
      if (!formData.fee_type || !formData.amount || !formData.description) {
        throw new Error('Please fill in all required fields');
      }

      if (parseFloat(formData.amount) <= 0) {
        throw new Error('Amount must be greater than 0');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Success
      setSubmitMessage({
        type: 'success',
        text: 'Fee request submitted successfully! You will receive a notification once it\'s processed.'
      });

      // Reset form
      setFormData({
        fee_type: '',
        amount: '',
        description: '',
        due_date: '',
        priority: 'normal',
        supporting_documents: null
      });

    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error.message || 'Failed to submit fee request. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return FiCheckCircle;
      case 'pending': return FiClock;
      case 'rejected': return FiX;
      default: return FiFileText;
    }
  };

  const feeTypes = [
    'Library Fine',
    'Lab Equipment',
    'Parking Permit',
    'Sports Equipment',
    'Textbook Replacement',
    'ID Card Replacement',
    'Transcript Fee',
    'Certificate Fee',
    'Other'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <main className="lg:pl-64 pt-16 min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fee Request</h1>
              <p className="text-gray-600">Submit requests for additional fees or charges</p>
            </div>

            {submitMessage && (
              <Alert 
                variant={submitMessage.type}
                dismissible
                onDismiss={() => setSubmitMessage(null)}
              >
                {submitMessage.text}
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Fee Request Form */}
              <Card className="p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <FiPlus className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">New Fee Request</h2>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fee Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="fee_type"
                      value={formData.fee_type}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select fee type</option>
                      {feeTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="number"
                        name="amount"
                        value={formData.amount}
                        onChange={handleInputChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Provide details about the fee request..."
                      rows={4}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Due Date
                    </label>
                    <div className="relative">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="date"
                        name="due_date"
                        value={formData.due_date}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="low">Low</option>
                      <option value="normal">Normal</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Supporting Documents
                    </label>
                    <input
                      type="file"
                      name="supporting_documents"
                      onChange={handleInputChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 5MB)
                    </p>
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={isSubmitting}
                      className="w-full"
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FiSend className="w-4 h-4 mr-2" />
                          Submit Request
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Recent Requests & Info */}
              <div className="space-y-6">
                {/* Info Card */}
                <Card className="p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <FiInfo className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Important Information</h3>
                  </div>
                  <div className="space-y-3 text-sm text-gray-600">
                    <p>• Fee requests are reviewed within 2-3 business days</p>
                    <p>• Approved fees will be added to your student account</p>
                    <p>• You will receive email notifications about status changes</p>
                    <p>• Supporting documents help expedite the review process</p>
                    <p>• Contact the Finance Office for urgent requests</p>
                  </div>
                </Card>

                {/* Recent Requests */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h3>
                  <div className="space-y-3">
                    {recentRequests.map(request => {
                      const StatusIcon = getStatusIcon(request.status);
                      return (
                        <div key={request.id} className="p-3 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{request.fee_type}</span>
                            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                              request.status === 'approved' ? 'bg-green-100 text-green-800' :
                              request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              <StatusIcon className="w-3 h-3" />
                              <span className="capitalize">{request.status}</span>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>${request.amount.toFixed(2)}</span>
                            <span>{new Date(request.requested_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentFeeRequest;
