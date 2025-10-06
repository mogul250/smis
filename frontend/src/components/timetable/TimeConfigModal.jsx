import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Clock, Coffee, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';

const TimeConfigModal = ({ isOpen, onClose, onSave, initialConfig = null }) => {
  const [config, setConfig] = useState({
    periods: [
      { id: 1, name: 'Period 1', startTime: '08:00', endTime: '09:00' },
      { id: 2, name: 'Period 2', startTime: '09:00', endTime: '10:00' },
      { id: 3, name: 'Break', startTime: '10:00', endTime: '10:15', isBreak: true },
      { id: 4, name: 'Period 3', startTime: '10:15', endTime: '11:15' },
      { id: 5, name: 'Period 4', startTime: '11:15', endTime: '12:15' },
      { id: 6, name: 'Lunch Break', startTime: '12:15', endTime: '13:00', isBreak: true },
      { id: 7, name: 'Period 5', startTime: '13:00', endTime: '14:00' },
      { id: 8, name: 'Period 6', startTime: '14:00', endTime: '15:00' },
    ],
    schoolName: 'Default School',
    academicYear: '2024-2025'
  });

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  const addPeriod = () => {
    const lastPeriod = config.periods[config.periods.length - 1];
    const newId = Math.max(...config.periods.map(p => p.id)) + 1;
    const newPeriod = {
      id: newId,
      name: `Period ${newId}`,
      startTime: lastPeriod ? lastPeriod.endTime : '08:00',
      endTime: lastPeriod ? addMinutes(lastPeriod.endTime, 60) : '09:00',
      isBreak: false
    };

    setConfig(prev => ({
      ...prev,
      periods: [...prev.periods, newPeriod]
    }));
  };

  const addBreak = () => {
    const lastPeriod = config.periods[config.periods.length - 1];
    const newId = Math.max(...config.periods.map(p => p.id)) + 1;
    const newBreak = {
      id: newId,
      name: 'Break',
      startTime: lastPeriod ? lastPeriod.endTime : '10:00',
      endTime: lastPeriod ? addMinutes(lastPeriod.endTime, 15) : '10:15',
      isBreak: true
    };

    setConfig(prev => ({
      ...prev,
      periods: [...prev.periods, newBreak]
    }));
  };

  const removePeriod = (id) => {
    setConfig(prev => ({
      ...prev,
      periods: prev.periods.filter(p => p.id !== id)
    }));
  };

  const updatePeriod = (id, field, value) => {
    setConfig(prev => ({
      ...prev,
      periods: prev.periods.map(p => 
        p.id === id ? { ...p, [field]: value } : p
      )
    }));
  };

  const addMinutes = (time, minutes) => {
    const [hours, mins] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60);
    const newMins = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
  };

  const handleSave = () => {
    // Validate periods
    const sortedPeriods = [...config.periods].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Check for overlaps
    for (let i = 0; i < sortedPeriods.length - 1; i++) {
      if (sortedPeriods[i].endTime > sortedPeriods[i + 1].startTime) {
        alert('Periods cannot overlap. Please check your time settings.');
        return;
      }
    }

    onSave(config);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary-green" />
            Time Period Configuration
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* School Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School Name
              </label>
              <Input
                value={config.schoolName}
                onChange={(e) => setConfig(prev => ({ ...prev, schoolName: e.target.value }))}
                placeholder="Enter school name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Year
              </label>
              <Input
                value={config.academicYear}
                onChange={(e) => setConfig(prev => ({ ...prev, academicYear: e.target.value }))}
                placeholder="e.g., 2024-2025"
              />
            </div>
          </div>

          {/* Periods Configuration */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Time Periods</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addBreak}
                  className="flex items-center gap-2"
                >
                  <Coffee className="h-4 w-4" />
                  Add Break
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPeriod}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Period
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {config.periods.map((period, index) => (
                  <motion.div
                    key={period.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={cn(
                      "grid grid-cols-1 md:grid-cols-5 gap-4 p-4 rounded-lg border",
                      period.isBreak 
                        ? "bg-orange-50 border-orange-200" 
                        : "bg-blue-50 border-blue-200"
                    )}
                  >
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Name
                      </label>
                      <Input
                        value={period.name}
                        onChange={(e) => updatePeriod(period.id, 'name', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        value={period.startTime}
                        onChange={(e) => updatePeriod(period.id, 'startTime', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={period.endTime}
                        onChange={(e) => updatePeriod(period.id, 'endTime', e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`break-${period.id}`}
                          checked={period.isBreak}
                          onChange={(e) => updatePeriod(period.id, 'isBreak', e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`break-${period.id}`} className="text-xs text-gray-600">
                          Break
                        </label>
                      </div>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePeriod(period.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {config.periods
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map((period) => (
                      <div
                        key={period.id}
                        className={cn(
                          "p-3 rounded-lg text-sm",
                          period.isBreak
                            ? "bg-orange-100 border border-orange-200 text-orange-800"
                            : "bg-blue-100 border border-blue-200 text-blue-800"
                        )}
                      >
                        <div className="font-medium">{period.name}</div>
                        <div className="text-xs opacity-80">
                          {period.startTime} - {period.endTime}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-primary-green hover:bg-green-600">
            Save Configuration
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default TimeConfigModal;
