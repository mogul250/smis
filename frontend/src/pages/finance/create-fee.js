import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../hooks/useApi';
import { financeAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Alert } from '../../components/ui/alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { 
  FiDollarSign, 
  FiUser, 
  FiCalendar, 
  FiFileText, 
  FiSave,
  FiArrowLeft,
  FiSearch
} from 'react-icons/fi';

const CreateFee = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    student_id: '',
    fee_type: '',
    amount: '',
    due_date: '',
    description: '',
    status: 'unpaid',
    paid_date: '',
    payment_method: '',
    transaction_id: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [isCustomFeeType, setIsCustomFeeType] = useState(false);
  const [customFeeType, setCustomFeeType] = useState('');

  // Fetch students for selection
  const { data: studentsData, loading: studentsLoading } = useApi(
    () => financeAPI.getAllStudents({ search: searchTerm }),
    [searchTerm],
    { fallbackData: { students: [] } }
  );

  const { loading: creating, execute: createFee } = useAsyncOperation();

  const students = studentsData?.students || [];

  const feeTypes = [
    { value: 'tuition', label: 'Tuition Fee' },
    { value: 'library', label: 'Library Fee' },
    { value: 'lab', label: 'Laboratory Fee' },
    { value: 'examination', label: 'Examination Fee' },
    { value: 'registration', label: 'Registration Fee' },
    { value: 'activity', label: 'Activity Fee' },
    { value: 'transport', label: 'Transport Fee' },
    { value: 'hostel', label: 'Hostel Fee' },
    { value: 'fine', label: 'Fine' },
    { value: 'other', label: 'Other' },
    { value: 'custom', label: 'Custom Fee Type...' }
  ];

  const statusOptions = [
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'debit_card', label: 'Debit Card' },
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'cheque', label: 'Cheque' },
    { value: 'online_payment', label: 'Online Payment' }
  ];

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setFormData(prev => ({
      ...prev,
      student_id: student.id
    }));
    setShowStudentSearch(false);
    setSearchTerm('');
  };

  const handleFeeTypeChange = (value) => {
    if (value === 'custom') {
      setIsCustomFeeType(true);
      setFormData(prev => ({ ...prev, fee_type: '' }));
    } else {
      setIsCustomFeeType(false);
      setCustomFeeType('');
      setFormData(prev => ({ ...prev, fee_type: value }));
    }
  };

  const handleCustomFeeTypeChange = (value) => {
    setCustomFeeType(value);
    setFormData(prev => ({ ...prev, fee_type: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.fee_type || !formData.amount || !formData.due_date) {
      setActionMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    // Validate payment fields if status is paid
    if (formData.status === 'paid') {
      if (!formData.paid_date || !formData.payment_method || !formData.transaction_id) {
        setActionMessage({ 
          type: 'error', 
          text: 'For paid fees, please provide paid date, payment method, and transaction ID' 
        });
        return;
      }
    }

    try {
      await createFee(async () => {
        const feeData = {
          studentId: parseInt(formData.student_id),
          type: formData.fee_type,
          amount: parseFloat(formData.amount),
          dueDate: formData.due_date,
          description: formData.description || '',
          status: formData.status,
          paidDate: formData.status === 'paid' ? formData.paid_date : null,
          paymentMethod: formData.status === 'paid' ? formData.payment_method : null,
          transactionId: formData.status === 'paid' ? formData.transaction_id : null
        };
        
        console.log('Sending fee data:', feeData); // Debug log
        console.log('API endpoint will be: POST /api/finance/fees'); // Debug log
        
        const response = await financeAPI.createFee(feeData);
        console.log('Fee creation response:', response); // Debug log
        
        setActionMessage({ type: 'success', text: 'Fee created successfully!' });
        
        // Reset form
        setFormData({
          student_id: '',
          fee_type: '',
          amount: '',
          due_date: '',
          description: '',
          status: 'unpaid',
          paid_date: '',
          payment_method: '',
          transaction_id: ''
        });
        setSelectedStudent(null);
        setIsCustomFeeType(false);
        setCustomFeeType('');
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/finance/fees');
        }, 2000);
      });
    } catch (error) {
      console.error('Fee creation error:', error); // Debug log
      console.error('Error response:', error.response); // Debug log
      console.error('Error message:', error.message); // Debug log
      
      let errorMessage = 'Failed to create fee';
      
      if (error.response) {
        // Server responded with error status
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        // Something else happened
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setActionMessage({ 
        type: 'error', 
        text: errorMessage 
      });
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64 pt-16">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="flex items-center space-x-2"
                >
                  <FiArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Create New Fee</h1>
                  <p className="text-gray-600">Add a new fee entry for a student</p>
                </div>
              </div>
            </div>

            {actionMessage && (
              <Alert variant={actionMessage.type === 'error' ? 'destructive' : 'default'}>
                {actionMessage.text}
              </Alert>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FiDollarSign className="w-5 h-5" />
                  <span>Fee Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Student Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="student">Student *</Label>
                    {selectedStudent ? (
                      <div className="flex items-center justify-between p-3 border rounded-md bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <FiUser className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedStudent.first_name} {selectedStudent.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {selectedStudent.student_id} • {selectedStudent.email}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedStudent(null);
                            setFormData(prev => ({ ...prev, student_id: '' }));
                            setShowStudentSearch(true);
                          }}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="relative">
                          <Input
                            placeholder="Search for a student..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => setShowStudentSearch(true)}
                            className="pl-10"
                          />
                          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        
                        {showStudentSearch && (
                          <div className="border rounded-md bg-white shadow-lg max-h-60 overflow-y-auto">
                            {studentsLoading ? (
                              <div className="p-4 text-center">
                                <LoadingSpinner size="sm" />
                              </div>
                            ) : students.length > 0 ? (
                              students.map((student) => (
                                <button
                                  key={student.id}
                                  type="button"
                                  onClick={() => handleStudentSelect(student)}
                                  className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 flex items-center space-x-3"
                                >
                                  <FiUser className="w-4 h-4 text-gray-400" />
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {student.first_name} {student.last_name}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      ID: {student.student_id} • {student.email}
                                    </p>
                                  </div>
                                </button>
                              ))
                            ) : (
                              <div className="p-4 text-center text-gray-500">
                                {searchTerm ? 'No students found' : 'Start typing to search students'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fee Type */}
                    <div className="space-y-2">
                      <Label htmlFor="fee_type">Fee Type *</Label>
                      {!isCustomFeeType ? (
                        <Select 
                          value={formData.fee_type} 
                          onValueChange={handleFeeTypeChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select fee type" />
                          </SelectTrigger>
                          <SelectContent>
                            {feeTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="space-y-2">
                          <Input
                            placeholder="Enter custom fee type..."
                            value={customFeeType}
                            onChange={(e) => handleCustomFeeTypeChange(e.target.value)}
                            required
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsCustomFeeType(false);
                              setCustomFeeType('');
                              setFormData(prev => ({ ...prev, fee_type: '' }));
                            }}
                            className="text-sm"
                          >
                            ← Back to dropdown
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount ($) *</Label>
                      <div className="relative">
                        <Input
                          id="amount"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={formData.amount}
                          onChange={(e) => handleInputChange('amount', e.target.value)}
                          className="pl-8"
                          required
                        />
                        <FiDollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <div className="relative">
                      <Input
                        id="due_date"
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => handleInputChange('due_date', e.target.value)}
                        min={getTodayDate()}
                        className="pl-10"
                        required
                      />
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <div className="relative">
                      <textarea
                        id="description"
                        placeholder="Optional description or notes about this fee..."
                        value={formData.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <FiFileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  {/* Payment Status Section */}
                  <div className="pt-6 border-t">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Payment Method - Only show if status is paid */}
                      {formData.status === 'paid' && (
                        <div className="space-y-2">
                          <Label htmlFor="payment_method">Payment Method *</Label>
                          <Select value={formData.payment_method} onValueChange={(value) => handleInputChange('payment_method', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              {paymentMethods.map((method) => (
                                <SelectItem key={method.value} value={method.value}>
                                  {method.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Payment Details - Only show if status is paid */}
                    {formData.status === 'paid' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        {/* Paid Date */}
                        <div className="space-y-2">
                          <Label htmlFor="paid_date">Paid Date *</Label>
                          <div className="relative">
                            <Input
                              id="paid_date"
                              type="date"
                              value={formData.paid_date}
                              onChange={(e) => handleInputChange('paid_date', e.target.value)}
                              max={getTodayDate()}
                              className="pl-10"
                              required
                            />
                            <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          </div>
                        </div>

                        {/* Transaction ID */}
                        <div className="space-y-2">
                          <Label htmlFor="transaction_id">Transaction ID *</Label>
                          <Input
                            id="transaction_id"
                            placeholder="Enter transaction ID..."
                            value={formData.transaction_id}
                            onChange={(e) => handleInputChange('transaction_id', e.target.value)}
                            required
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end space-x-4 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={creating || !formData.student_id || !formData.fee_type || !formData.amount || !formData.due_date}
                      className="flex items-center space-x-2"
                    >
                      {creating ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <FiSave className="w-4 h-4" />
                      )}
                      <span>{creating ? 'Creating...' : 'Create Fee'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateFee;
