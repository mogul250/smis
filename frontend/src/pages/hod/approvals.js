import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncOperation } from '../../hooks/useApi';
import { hodAPI } from '../../services/api';
import Header from '../../components/common/Header';
import Sidebar from '../../components/common/Sidebar';
import Card from '../../components/common/Card';

import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import Alert from '../../components/common/Alert';


const ApprovalsPage = () => {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const { loading: processing, execute: processApproval } = useAsyncOperation();

  // Mock data for demonstration
  const mockApprovals = [
    {
      id: 1,
      type: 'grade',
      title: 'Grade Entry - CS101',
      description: 'Grade submission for Computer Science 101 - Final Exam',
      teacher: 'Dr. John Smith',
      student: 'Alice Johnson',
      grade: 'A',
      submitted_at: '2024-01-15T10:30:00Z',
      status: 'pending'
    },
    {
      id: 2,
      type: 'grade',
      title: 'Grade Entry - MATH201',
      description: 'Grade submission for Mathematics 201 - Midterm Exam',
      teacher: 'Prof. Jane Doe',
      student: 'Bob Wilson',
      grade: 'B+',
      submitted_at: '2024-01-14T14:20:00Z',
      status: 'pending'
    }
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleApproval = async (approvalId, approve) => {
    try {
      await processApproval(() => hodAPI.approveActivity({
        activityType: 'grade',
        activityId: approvalId,
        approve
      }));
      setActionMessage({
        type: 'success',
        text: `Request ${approve ? 'approved' : 'rejected'} successfully!`
      });
      setTimeout(() => setActionMessage(null), 5000);
    } catch (error) {
      setActionMessage({
        type: 'error',
        text: 'Error processing approval. Please try again.'
      });
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  // Check authorization
  if (!user || user.role !== 'hod') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="error">Access denied. HOD access required.</Alert>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Approvals - HOD Dashboard</title>
      </Head>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Approvals</h1>
                  <p className="text-gray-600 mt-1">
                    Review and approve department activities and requests
                  </p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="px-3 py-1.5 text-sm border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Refresh
                </button>
              </div>

              {/* Action Message */}
              {actionMessage && (
                <Alert
                  variant={actionMessage.type === 'success' ? 'success' : 'error'}
                  dismissible
                  onDismiss={() => setActionMessage(null)}
                >
                  {actionMessage.text}
                </Alert>
              )}

              <Card className="overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Pending Approvals</h3>
                </div>

                <Table>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head>Request</Table.Head>
                      <Table.Head>Teacher</Table.Head>
                      <Table.Head>Details</Table.Head>
                      <Table.Head>Status</Table.Head>
                      <Table.Head>Actions</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {mockApprovals.map((approval) => (
                      <Table.Row key={approval.id}>
                        <Table.Cell>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {approval.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              {approval.description}
                            </div>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="text-sm text-gray-900">
                            {approval.teacher}
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="text-sm text-gray-900">
                            Student: {approval.student}<br />
                            Grade: <strong>{approval.grade}</strong>
                          </div>
                        </Table.Cell>
                        <Table.Cell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        </Table.Cell>
                        <Table.Cell>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleApproval(approval.id, true)}
                              disabled={processing}
                              className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproval(approval.id, false)}
                              disabled={processing}
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
};

export default ApprovalsPage;
