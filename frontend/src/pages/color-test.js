import React from 'react';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FiPalette, FiEye, FiCheck } from 'react-icons/fi';

const ColorTestPage = () => {
  const colorShades = [
    { name: 'green-50', value: 'hsl(89.3, 80.4%, 95%)', class: 'bg-green-50' },
    { name: 'green-100', value: 'hsl(89.3, 80.4%, 85%)', class: 'bg-green-100' },
    { name: 'green-200', value: 'hsl(89.3, 80.4%, 75%)', class: 'bg-green-200' },
    { name: 'green-300', value: 'hsl(89.3, 80.4%, 65%)', class: 'bg-green-300' },
    { name: 'green-400', value: 'hsl(89.3, 80.4%, 55%)', class: 'bg-green-400' },
    { name: 'green-500', value: 'hsl(89.3, 80.4%, 45%)', class: 'bg-green-500' },
    { name: 'green-600', value: 'hsl(89.3, 80.4%, 35%)', class: 'bg-green-600' },
    { name: 'green-700', value: 'hsl(89.3, 80.4%, 25%)', class: 'bg-green-700' },
    { name: 'green-800', value: 'hsl(89.3, 80.4%, 15%)', class: 'bg-green-800' },
    { name: 'green-900', value: 'hsl(89.3, 80.4%, 10%)', class: 'bg-green-900', isUserColor: true },
  ];

  const primaryColors = [
    { name: 'primary-green-dark', value: 'hsl(89.3, 80.4%, 10%)', class: 'bg-primary-green-dark', isUserColor: true },
    { name: 'primary-green', value: 'hsl(89.3, 80.4%, 25%)', class: 'bg-primary-green' },
    { name: 'primary-green-light', value: 'hsl(89.3, 80.4%, 35%)', class: 'bg-primary-green-light' },
  ];

  return (
    <Layout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Color Palette Test</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">
              Testing the new custom green color scheme based on HSL(89.3, 80.4%, 10%)
            </p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Button
              variant="primary"
              size="sm"
              icon={FiPalette}
              className="bg-primary-green hover:bg-green-600 text-white text-xs sm:text-sm"
            >
              Primary Button
            </Button>
          </div>
        </div>

        {/* User's Specified Color */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FiCheck className="w-5 h-5 text-primary-green mr-2" />
            Your Specified Color
          </h3>
          <div className="bg-primary-green-dark rounded-lg p-8 text-center">
            <div className="text-white font-bold text-xl mb-2">HSL(89.3, 80.4%, 10%)</div>
            <div className="text-green-100 text-sm">This is your custom dark green color</div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <strong>Usage:</strong> This color is used as the darkest shade in the green palette and as `primary-green-dark`.
          </div>
        </Card>

        {/* Primary Colors */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Primary Colors</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {primaryColors.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`${color.class} rounded-lg h-20 flex items-center justify-center relative`}>
                  {color.isUserColor && (
                    <div className="absolute top-2 right-2">
                      <FiCheck className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="text-white font-medium text-sm">{color.name}</span>
                </div>
                <div className="text-xs text-gray-600 font-mono">{color.value}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Full Color Palette */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Green Palette</h3>
          <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4">
            {colorShades.map((color) => (
              <div key={color.name} className="space-y-2">
                <div className={`${color.class} rounded-lg h-16 flex items-end justify-center p-2 relative`}>
                  {color.isUserColor && (
                    <div className="absolute top-1 right-1">
                      <FiCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                  <span className={`text-xs font-medium ${
                    color.name.includes('50') || color.name.includes('100') || color.name.includes('200') 
                      ? 'text-gray-800' 
                      : 'text-white'
                  }`}>
                    {color.name.split('-')[1]}
                  </span>
                </div>
                <div className="text-xs text-gray-600 text-center">{color.name}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Component Examples */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Component Examples</h3>
          <div className="space-y-6">
            {/* Buttons */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Buttons</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary" className="bg-primary-green hover:bg-green-600">Primary</Button>
                <Button variant="outline" className="border-primary-green text-primary-green hover:bg-green-50">Outline</Button>
                <Button variant="ghost" className="text-primary-green hover:bg-green-50">Ghost</Button>
              </div>
            </div>

            {/* Status Indicators */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Status Indicators</h4>
              <div className="flex flex-wrap gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">Success</span>
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-sm font-medium">Active</span>
                <span className="px-3 py-1 bg-green-900 text-white rounded-full text-sm font-medium">Dark</span>
              </div>
            </div>

            {/* Icons */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Icons</h4>
              <div className="flex items-center space-x-4">
                <FiEye className="w-6 h-6 text-green-500" />
                <FiCheck className="w-6 h-6 text-green-600" />
                <FiPalette className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </div>
        </Card>

        {/* Color Information */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Color Information</h3>
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-600">
              The new color palette is based on your specified HSL color: <code className="bg-gray-100 px-2 py-1 rounded">HSL(89.3, 80.4%, 10%)</code>
            </p>
            <ul className="text-gray-600 mt-4 space-y-2">
              <li><strong>Hue:</strong> 89.3° (Yellow-green range)</li>
              <li><strong>Saturation:</strong> 80.4% (Highly saturated)</li>
              <li><strong>Lightness:</strong> 10% (Very dark)</li>
            </ul>
            <p className="text-gray-600 mt-4">
              This color is used throughout the application for primary elements, active states, and success indicators.
              The palette maintains the same hue and saturation while varying the lightness for different use cases.
            </p>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default ColorTestPage;
