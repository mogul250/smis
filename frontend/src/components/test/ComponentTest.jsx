import React from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import DataTable from '../common/DataTable';
import Modal from '../common/Modal';
import Alert from '../common/Alert';
import LoadingSpinner from '../common/LoadingSpinner';
import Badge from '../common/Badge';
import { 
  FiPlus, 
  FiEdit, 
  FiEye, 
  FiUsers, 
  FiSearch,
  FiRefreshCw,
  FiGraduationCap,
  FiCalendar,
  FiMail,
  FiPhone,
  FiMapPin,
  FiBook
} from 'react-icons/fi';

const ComponentTest = () => {
  return (
    <div className="p-4">
      <h1>Component Test</h1>
      
      {/* Test each component individually */}
      <div className="space-y-4">
        <Card>
          <p>Card Test</p>
        </Card>
        
        <Button>Button Test</Button>
        
        <Button icon={FiPlus}>Button with Icon</Button>
        
        <Input placeholder="Input Test" />
        
        <Select>
          <option>Select Test</option>
        </Select>
        
        <Badge variant="success">Badge Test</Badge>
        
        <LoadingSpinner />
        
        <Alert variant="info">Alert Test</Alert>
        
        <DataTable 
          columns={[{ header: 'Test', accessor: 'test' }]} 
          data={[{ test: 'Test Data' }]} 
        />
        
        {/* Test icons directly */}
        <div className="flex space-x-2">
          <FiPlus className="w-5 h-5" />
          <FiEdit className="w-5 h-5" />
          <FiEye className="w-5 h-5" />
          <FiUsers className="w-5 h-5" />
          <FiSearch className="w-5 h-5" />
          <FiRefreshCw className="w-5 h-5" />
          <FiGraduationCap className="w-5 h-5" />
          <FiCalendar className="w-5 h-5" />
          <FiMail className="w-5 h-5" />
          <FiPhone className="w-5 h-5" />
          <FiMapPin className="w-5 h-5" />
          <FiBook className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
};

export default ComponentTest;
