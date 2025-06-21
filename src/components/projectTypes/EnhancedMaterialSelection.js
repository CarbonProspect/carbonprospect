import React, { useState } from 'react';
import IntegratedMaterialSelection from './IntegratedMaterialSelection';
import CustomMaterialManager from './CustomMaterialManager';

const EnhancedMaterialSelection = ({
  standardMaterials,
  customMaterials,
  materialVolumes,
  materialBlends,
  onMaterialVolumeChange,
  onBlendChange,
  onAddCustomMaterial,
  onUpdateCustomMaterial,
  onDeleteCustomMaterial
}) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('materials');
  
  // Material categories with units
  const materialCategories = [
    { id: 'concrete', name: 'Concrete', units: [
      { id: 'm3', name: 'm³', conversionFactor: 1 },
      { id: 'tonnes', name: 'tonnes', conversionFactor: 2.4 } // Assuming 2.4 tonnes per m³
    ]},
    { id: 'steel', name: 'Steel', units: [
      { id: 'tonnes', name: 'tonnes', conversionFactor: 1 },
      { id: 'kg', name: 'kg', conversionFactor: 0.001 } // 1 kg = 0.001 tonnes
    ]},
    { id: 'timber', name: 'Timber', units: [
      { id: 'm3', name: 'm³', conversionFactor: 1 },
      { id: 'tonnes', name: 'tonnes', conversionFactor: 0.6 }, // Assuming 0.6 tonnes per m³
      { id: 'kg', name: 'kg', conversionFactor: 0.0006 } // 1 kg = 0.0006 m³ (approximate)
    ]},
    { id: 'insulation', name: 'Insulation', units: [
      { id: 'm3', name: 'm³', conversionFactor: 1 },
      { id: 'm2', name: 'm² (100mm thick)', conversionFactor: 0.1 } // 1 m² of 100mm thickness = 0.1 m³
    ]},
    { id: 'glass', name: 'Glass', units: [
      { id: 'tonnes', name: 'tonnes', conversionFactor: 1 },
      { id: 'm2', name: 'm² (10mm thick)', conversionFactor: 0.025 }, // Assuming 2.5 tonnes per m³, 10mm thickness
      { id: 'kg', name: 'kg', conversionFactor: 0.001 } // 1 kg = 0.001 tonnes
    ]}
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-4">
        <ul className="flex -mb-px">
          <li className="mr-1">
            <button
              className={`inline-block py-2 px-4 font-medium text-sm rounded-t-lg ${
                activeTab === 'materials'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('materials')}
            >
              Material Selection & Volumes
            </button>
          </li>
          <li className="mr-1">
            <button
              className={`inline-block py-2 px-4 font-medium text-sm rounded-t-lg ${
                activeTab === 'custom'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('custom')}
            >
              Custom Materials
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      {activeTab === 'materials' && (
        <IntegratedMaterialSelection
          materialCategories={materialCategories}
          standardMaterials={standardMaterials}
          customMaterials={customMaterials}
          initialMaterialVolumes={materialVolumes}
          initialBlends={materialBlends}
          onMaterialVolumeChange={onMaterialVolumeChange}
          onBlendChange={onBlendChange}
        />
      )}
      
      {activeTab === 'custom' && (
        <CustomMaterialManager
          materials={[...standardMaterials, ...customMaterials]}
          materialCategories={materialCategories}
          onAddCustomMaterial={onAddCustomMaterial}
          onUpdateMaterial={onUpdateCustomMaterial}
          onDeleteCustomMaterial={onDeleteCustomMaterial}
        />
      )}
    </div>
  );
};

export default EnhancedMaterialSelection;