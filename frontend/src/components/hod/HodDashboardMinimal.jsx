import React from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import { FiUsers, FiRefreshCw } from 'react-icons/fi';

const HodDashboardMinimal = () => {
  return (
    <div className="p-6">
      <h1>HOD Dashboard Minimal Test</h1>
      
      {/* Test basic components */}
      <Card className="p-4 mb-4">
        <h2>Test Card</h2>
        <p>This is a test card</p>
      </Card>
      
      {/* Test Button without icon */}
      <Button className="mb-4">
        Simple Button
      </Button>
      
      {/* Test Button with icon */}
      <Button 
        className="mb-4"
        icon={FiUsers}
      >
        Button with Icon
      </Button>
      
      {/* Test the problematic icon */}
      <Button 
        variant="outline"
        size="sm"
        icon={FiRefreshCw}
      >
        Refresh Button
      </Button>
      
      {/* Test icon directly */}
      <div className="mt-4">
        <FiUsers className="w-6 h-6 mr-2" />
        <FiRefreshCw className="w-6 h-6" />
      </div>
    </div>
  );
};

export default HodDashboardMinimal;
