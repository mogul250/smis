import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../../hooks/useAuth';
import { useApi, useAsyncOperation } from '../../../../hooks/useApi';
import { financeAPI } from '../../../../services/api';
import Header from '../../../../components/common/Header';
import Sidebar from '../../../../components/common/Sidebar';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Alert } from '../../../../components/ui/alert';
import LoadingSpinner from '../../../../components/common/LoadingSpinner';
import { 
  FiFileText, 
  FiUser, 
  FiCalendar, 
  FiDollarSign,
  FiSave,
  FiArrowLeft,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiEdit
} from 'react-icons/fi';

const EditInvoice = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    student_id: '',
    due_date: '',
    notes: ''
  });
  const [invoiceItems, setInvoiceItems] = useState([
    { description: '', amount: '', quantity: 1 }
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentSearch, setShowStudentSearch] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [originalInvoice, setOriginalInvoice] = useState(null);

  // Fetch students for selection
  const { data: studentsData, loading: studentsLoading } = useApi(
    () => financeAPI.getAllStudents({ search: searchTerm }),
    [searchTerm],
    { fallbackData: { students: [] } }
  );

  // Fetch invoice details
  const { data: invoiceData, loading: invoiceLoading, error: invoiceError } = useApi(
    () => id ? financeAPI.getInvoice(id) : null,
    [id],
    { fallbackData: null }
  );

  const { loading: updating, execute: updateInvoice } = useAsyncOperation();

  const students = studentsData?.students || [];

  useEffect(() => {
    if (invoiceData) {
      setOriginalInvoice(invoiceData);
      setFormData({
        student_id: invoiceData.student_id?.toString() || '',
        due_date: invoiceData.due_date || '',
        notes: invoiceData.notes || ''
      });

      // Set selected student
      if (invoiceData.student) {
        setSelectedStudent(invoiceData.student);
      }

      // Set invoice items
      if (invoiceData.items && invoiceData.items.length > 0) {
        setInvoiceItems(invoiceData.items.map(item => ({
          description: item.description || '',
          amount: item.amount?.toString() || '',
          quantity: item.quantity || 1
        })));
      }
    }
  }, [invoiceData]);

  if (!user || user.role !== 'finance') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive">Access denied. Finance access required.</Alert>
      </div>
    );
  }

  if (invoiceLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:ml-64 pt-16">
            <div className="max-w-5xl mx-auto">
              <Card className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </Card>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (invoiceError || !invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:ml-64 pt-16">
            <div className="max-w-5xl mx-auto">
              <Alert variant="destructive">
                Failed to load invoice details. {invoiceError || 'Invoice not found.'}
              </Alert>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Only allow editing of draft invoices
  if (originalInvoice && originalInvoice.status !== 'draft') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-6 lg:ml-64 pt-16">
            <div className="max-w-5xl mx-auto">
              <Alert variant="destructive">
                Only draft invoices can be edited. This invoice has status: {originalInvoice.status}
              </Alert>
            </div>
          </main>
        </div>
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

  const handleItemChange = (index, field, value) => {
    setInvoiceItems(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const addInvoiceItem = () => {
    setInvoiceItems(prev => [...prev, { description: '', amount: '', quantity: 1 }]);
  };

  const removeInvoiceItem = (index) => {
    if (invoiceItems.length > 1) {
      setInvoiceItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculateTotal = () => {
    return invoiceItems.reduce((total, item) => {
      const amount = parseFloat(item.amount) || 0;
      const quantity = parseInt(item.quantity) || 1;
      return total + (amount * quantity);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.due_date) {
      setActionMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    const validItems = invoiceItems.filter(item => 
      item.description.trim() && item.amount && parseFloat(item.amount) > 0
    );

    if (validItems.length === 0) {
      setActionMessage({ type: 'error', text: 'Please add at least one invoice item' });
      return;
    }

    try {
      await updateInvoice(async () => {
        const invoiceUpdateData = {
          student_id: parseInt(formData.student_id),
          due_date: formData.due_date,
          notes: formData.notes,
          total_amount: calculateTotal(),
          items: validItems.map(item => ({
            description: item.description,
            amount: parseFloat(item.amount),
            quantity: parseInt(item.quantity) || 1
          }))
        };
        
        console.log('Updating invoice data:', invoiceUpdateData);
        
        const response = await financeAPI.updateInvoice(id, invoiceUpdateData);
        console.log('Invoice update response:', response);
        
        setActionMessage({ type: 'success', text: 'Invoice updated successfully!' });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/finance/invoices');
        }, 2000);
      });
    } catch (error) {
      console.error('Invoice update error:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to update invoice';
      
      if (error.response) {
        errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
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
          <div className="max-w-5xl mx-auto space-y-6">
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
                  <h1 className="text-2xl font-bold text-gray-900">Edit Invoice</h1>
                  <p className="text-gray-600">Update invoice information</p>
                </div>
              </div>
            </div>

            {actionMessage && (
              <Alert variant={actionMessage.type === 'error' ? 'destructive' : 'default'}>
                {actionMessage.text}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FiUser className="w-5 h-5" />
                    <span>Student Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="student">Student *</Label>
                    {selectedStudent ? (
                      <div className="flex items-center justify-between p-4 border rounded-md bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <FiUser className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {selectedStudent.first_name} {selectedStudent.last_name}
                            </p>
                            <p className="text-sm text-gray-500">
                              ID: {selectedStudent.student_id} • {selectedStudent.email}
                            </p>
                            {selectedStudent.department && (
                              <p className="text-sm text-gray-500">
                                Department: {selectedStudent.department}
                              </p>
                            )}
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
                </CardContent>
              </Card>

              {/* Invoice Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FiFileText className="w-5 h-5" />
                    <span>Invoice Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {/* Invoice Number (Read-only) */}
                    <div className="space-y-2">
                      <Label>Invoice Number</Label>
                      <div className="p-2 bg-gray-50 rounded-md text-gray-600 text-sm">
                        {originalInvoice?.invoice_number || 'Loading...'}
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      placeholder="Optional notes or additional information..."
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Items */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <FiEdit className="w-5 h-5" />
                      <span>Invoice Items</span>
                    </CardTitle>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addInvoiceItem}
                      className="flex items-center space-x-2"
                    >
                      <FiPlus className="w-4 h-4" />
                      <span>Add Item</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoiceItems.map((item, index) => (
                      <div key={index} className="p-4 border rounded-md bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                          <div className="md:col-span-5 space-y-2">
                            <Label>Description *</Label>
                            <Input
                              placeholder="Item description..."
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="md:col-span-2 space-y-2">
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            />
                          </div>
                          
                          <div className="md:col-span-3 space-y-2">
                            <Label>Amount ($) *</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={item.amount}
                                onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                                className="pl-8"
                                required
                              />
                              <FiDollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            </div>
                          </div>
                          
                          <div className="md:col-span-1 space-y-2">
                            <Label>Total</Label>
                            <div className="p-2 bg-white rounded-md text-sm font-medium">
                              ${((parseFloat(item.amount) || 0) * (parseInt(item.quantity) || 1)).toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="md:col-span-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeInvoiceItem(index)}
                              disabled={invoiceItems.length === 1}
                              className="w-full"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Amount */}
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-end">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900">
                          Total Amount: ${calculateTotal().toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {invoiceItems.filter(item => item.description.trim() && item.amount).length} items
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updating || !formData.student_id || !formData.due_date || calculateTotal() === 0}
                  className="flex items-center space-x-2"
                >
                  {updating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  <span>{updating ? 'Updating...' : 'Update Invoice'}</span>
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EditInvoice;
