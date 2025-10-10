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
import { Alert } from '../../components/ui/alert';
import LoadingSpinner from '../../components/common/LoadingSpinner';
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

const CreateInvoice = () => {
  const router = useRouter();
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

  // Fetch students for selection
  const { data: studentsData, loading: studentsLoading } = useApi(
    () => financeAPI.getAllStudents({ search: searchTerm }),
    [searchTerm],
    { fallbackData: { students: [] } }
  );

  const { loading: creating, execute: createInvoice } = useAsyncOperation();

  const students = studentsData?.students || [];

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

  const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const time = String(now.getTime()).slice(-6);
    return `INV-${year}${month}${day}-${time}`;
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
      await createInvoice(async () => {
        const invoiceData = {
          invoice_number: generateInvoiceNumber(),
          student_id: formData.student_id,
          due_date: formData.due_date,
          notes: formData.notes,
          total_amount: calculateTotal(),
          items: validItems.map(item => ({
            description: item.description,
            amount: parseFloat(item.amount),
            quantity: parseInt(item.quantity) || 1
          }))
        };
        
        await financeAPI.createInvoice(invoiceData);
        setActionMessage({ type: 'success', text: 'Invoice created successfully!' });
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push('/finance/invoices');
        }, 2000);
      });
    } catch (error) {
      setActionMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to create invoice' 
      });
    }
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getDefaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30); // 30 days from today
    return date.toISOString().split('T')[0];
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
                  <h1 className="text-2xl font-bold text-gray-900">Create New Invoice</h1>
                  <p className="text-gray-600">Generate an invoice for a student</p>
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

                    {/* Invoice Number (Auto-generated) */}
                    <div className="space-y-2">
                      <Label>Invoice Number</Label>
                      <div className="p-2 bg-gray-50 rounded-md text-gray-600 text-sm">
                        Auto-generated on creation
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
                  disabled={creating || !formData.student_id || !formData.due_date || calculateTotal() === 0}
                  className="flex items-center space-x-2"
                >
                  {creating ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <FiSave className="w-4 h-4" />
                  )}
                  <span>{creating ? 'Creating...' : 'Create Invoice'}</span>
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateInvoice;
