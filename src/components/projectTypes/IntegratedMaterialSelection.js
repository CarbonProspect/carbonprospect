import React, { useState, useEffect } from 'react';

const IntegratedMaterialSelection = ({ 
  materialCategories = [
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
  ],
  standardMaterials = [],
  customMaterials = [],
  initialMaterialVolumes = {},
  initialBlends = {},
  onMaterialVolumeChange,
  onBlendChange
}) => {
  // State for total volumes per material category
  const [materialVolumes, setMaterialVolumes] = useState(initialMaterialVolumes || {
    concrete: 0,
    steel: 0,
    timber: 0,
    insulation: 0,
    glass: 0
  });
  
  // State for which categories have expanded blend view - initialize with all collapsed
  const [expandedCategories, setExpandedCategories] = useState({
    concrete: false,
    steel: false,
    timber: false,
    insulation: false,
    glass: false
  });
  
  // State for material blends
  const [blends, setBlends] = useState(initialBlends || {
    concrete: [{ materialId: 'concrete_standard', percentage: 100 }],
    steel: [{ materialId: 'steel_standard', percentage: 100 }],
    timber: [{ materialId: 'timber_standard', percentage: 100 }],
    insulation: [{ materialId: 'insulation_standard', percentage: 100 }],
    glass: [{ materialId: 'glass_standard', percentage: 100 }]
  });
  
  // State for selected unit for each material category
  const [selectedUnits, setSelectedUnits] = useState({
    concrete: 'm3',
    steel: 'tonnes',
    timber: 'm3',
    insulation: 'm3',
    glass: 'tonnes'
  });

  // Emission factors (kg CO2e per unit) for baseline calculations
  const emissionFactors = {
    concrete: 300, // kg CO2e per m3
    steel: 2000, // kg CO2e per tonne
    timber: 250, // kg CO2e per m3
    glass: 800, // kg CO2e per tonne
    insulation: 100 // kg CO2e per m3
  };

  // Calculate effective factors for each material type
  const calculateEffectiveFactor = (category) => {
    const categoryBlend = blends[category] || [];
    return categoryBlend.reduce((factor, item) => {
      const material = [...standardMaterials, ...customMaterials].find(m => m.id === item.materialId);
      if (material) {
        return factor + (material.factor * (item.percentage / 100));
      }
      return factor;
    }, 0);
  };

  // Calculate emissions reduction for a category
  const calculateEmissionsReduction = (category) => {
    const volume = materialVolumes[category] || 0;
    if (volume <= 0) return { tonnes: 0, percentage: 0 };
    
    // Convert volume to base unit if needed
    const baseUnit = materialCategories.find(c => c.id === category)?.units[0]?.id || selectedUnits[category];
    const conversionFactor = getConversionFactor(category, selectedUnits[category], baseUnit);
    const baseVolume = volume * conversionFactor;
    
    // Calculate baseline emissions (standard material)
    const baselineEmissions = (baseVolume * emissionFactors[category]) / 1000; // tonnes CO2e
    
    // Calculate reduced emissions based on effective factor
    const effectiveFactor = calculateEffectiveFactor(category);
    const reducedEmissions = baselineEmissions * effectiveFactor;
    
    // Calculate savings
    const savings = baselineEmissions - reducedEmissions;
    const savingsPercentage = baselineEmissions > 0 ? (savings / baselineEmissions) * 100 : 0;
    
    return {
      tonnes: savings,
      percentage: savingsPercentage
    };
  };

  // Get all available materials for a category
  const getAvailableMaterialsForCategory = (category) => {
    return [
      ...standardMaterials.filter(m => m.category === category),
      ...customMaterials.filter(m => m.category === category)
    ];
  };
  
  // Toggle expanded state for a category
  const toggleCategoryExpanded = (categoryId) => {
    setExpandedCategories(prevState => ({
      ...prevState,
      [categoryId]: !prevState[categoryId]
    }));
  };
  
  // Get conversion factor between units
  const getConversionFactor = (category, fromUnit, toUnit) => {
    const categoryConfig = materialCategories.find(c => c.id === category);
    if (!categoryConfig) return 1;
    
    const fromUnitConfig = categoryConfig.units.find(u => u.id === fromUnit);
    const toUnitConfig = categoryConfig.units.find(u => u.id === toUnit);
    
    if (!fromUnitConfig || !toUnitConfig) return 1;
    
    // Convert via base unit
    return fromUnitConfig.conversionFactor / toUnitConfig.conversionFactor;
  };

  // Handle volume change for a material
  const handleVolumeChange = (category, volume) => {
    const newVolume = parseFloat(volume) || 0;
    
    setMaterialVolumes({
      ...materialVolumes,
      [category]: newVolume
    });
    
    if (onMaterialVolumeChange) {
      // Convert to base unit for consistent storage
      const baseUnit = materialCategories.find(c => c.id === category)?.units[0]?.id || selectedUnits[category];
      const conversionFactor = getConversionFactor(category, selectedUnits[category], baseUnit);
      const baseVolume = newVolume * conversionFactor;
      
      onMaterialVolumeChange(category, baseVolume, {
        displayUnit: selectedUnits[category],
        displayVolume: newVolume
      });
    }
  };
  
  // Handle blend change for a category
  const handleBlendChange = (category, newBlend) => {
    setBlends({
      ...blends,
      [category]: newBlend
    });
    
    if (onBlendChange) {
      onBlendChange(category, newBlend);
    }
  };
  
  // Get style based on emission factor
  const getFactorStyle = (factor) => {
    if (factor < 0.5) return 'text-green-600';
    if (factor < 0.8) return 'text-green-500';
    if (factor < 1.0) return 'text-yellow-600';
    return 'text-red-500';
  };

  // Get style for emissions reduction percentage
  const getReductionStyle = (percentage) => {
    if (percentage <= 0) return 'text-gray-500';
    if (percentage > 50) return 'text-green-600 font-medium';
    if (percentage > 20) return 'text-green-500';
    if (percentage > 5) return 'text-green-400';
    return 'text-gray-500';
  };

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {materialCategories.map(category => {
          const effectiveFactor = calculateEffectiveFactor(category.id);
          const availableMaterials = getAvailableMaterialsForCategory(category.id);
          const isExpanded = expandedCategories[category.id];
          const categoryBlend = blends[category.id] || [];
          const emissionsReduction = calculateEmissionsReduction(category.id);
          
          return (
            <div key={category.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium capitalize">{category.name}</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500">Effective Factor:</span>
                    <span className={`ml-1 font-medium ${getFactorStyle(effectiveFactor)}`}>
                      {effectiveFactor.toFixed(2)}
                    </span>
                  </div>
                  
                  {materialVolumes[category.id] > 0 && emissionsReduction.percentage !== 0 && (
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">Emissions Reduction:</span>
                      <span className={`ml-1 ${getReductionStyle(emissionsReduction.percentage)}`}>
                        {emissionsReduction.percentage.toFixed(1)}% ({emissionsReduction.tonnes.toFixed(1)} tonnes)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-end space-x-3 mb-4">
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Volume
                  </label>
                  <div className="flex">
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={materialVolumes[category.id] || 0}
                      onChange={(e) => handleVolumeChange(category.id, e.target.value)}
                      className="w-full p-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <select
                      value={selectedUnits[category.id]}
                      onChange={(e) => {
                        setSelectedUnits({
                          ...selectedUnits,
                          [category.id]: e.target.value
                        });
                      }}
                      className="p-2 border border-l-0 rounded-r bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {category.units.map(unit => (
                        <option key={unit.id} value={unit.id}>{unit.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={() => toggleCategoryExpanded(category.id)}
                  className={`px-3 py-2 border rounded-md ${
                    isExpanded ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                  } hover:bg-blue-100 transition-colors duration-200`}
                >
                  {isExpanded ? 'Hide Blend' : 'Blend Material'}
                </button>
              </div>
              
              {/* Progress bar showing blend percentages */}
              <div className="h-6 w-full bg-gray-200 rounded-md overflow-hidden mb-2">
                {categoryBlend.map((item, index) => {
                  // Find the material to get its color
                  const material = availableMaterials.find(m => m.id === item.materialId);
                  
                  // Determine color based on emission factor
                  let color = 'bg-gray-400';
                  if (material) {
                    if (material.factor < 0.5) color = 'bg-green-500';
                    else if (material.factor < 0.8) color = 'bg-green-400';
                    else if (material.factor === 1.0) color = 'bg-blue-400';
                    else if (material.factor > 1.0) color = 'bg-red-400';
                    else color = 'bg-yellow-400';
                  }
                  
                  return (
                    <div
                      key={index}
                      className={`h-full ${color} transition-all duration-300`}
                      style={{
                        width: `${item.percentage}%`,
                        float: 'left'
                      }}
                      title={`${material?.name || 'Unknown'}: ${item.percentage}%`}
                    />
                  );
                })}
              </div>
              
              {/* Material blend details (visible when expanded) */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="text-sm font-medium">Material Blend</h5>
                    <div className="text-xs text-gray-500">
                      {materialVolumes[category.id] > 0 
                        ? `Total: ${materialVolumes[category.id]} ${category.units.find(u => u.id === selectedUnits[category.id])?.name || ''}`
                        : 'Set volume above'}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {categoryBlend.map((item, index) => {
                      const material = availableMaterials.find(m => m.id === item.materialId);
                      
                      // Calculate emissions reduction for this specific material
                      let materialSavings = '';
                      if (material && material.factor !== 1.0 && materialVolumes[category.id] > 0) {
                        const volume = (item.percentage / 100) * materialVolumes[category.id];
                        const baseUnit = materialCategories.find(c => c.id === category.id)?.units[0]?.id || selectedUnits[category.id];
                        const conversionFactor = getConversionFactor(category.id, selectedUnits[category.id], baseUnit);
                        const baseVolume = volume * conversionFactor;
                        
                        const standardEmissions = (baseVolume * emissionFactors[category.id]) / 1000;
                        const actualEmissions = standardEmissions * material.factor;
                        const savings = standardEmissions - actualEmissions;
                        
                        if (savings > 0) {
                          materialSavings = `Saves ${savings.toFixed(1)} tonnes CO₂e (${((1 - material.factor) * 100).toFixed(0)}%)`;
                        } else if (savings < 0) {
                          materialSavings = `Adds ${Math.abs(savings).toFixed(1)} tonnes CO₂e (${((material.factor - 1) * 100).toFixed(0)}%)`;
                        }
                      }
                      
                      return (
                        <div key={index} className="flex items-center space-x-2">
                          <div className="flex-grow">
                            <select
                              value={item.materialId}
                              onChange={(e) => {
                                const newBlend = [...categoryBlend];
                                newBlend[index].materialId = e.target.value;
                                handleBlendChange(category.id, newBlend);
                              }}
                              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              {availableMaterials.map(material => (
                                <option 
                                  key={material.id} 
                                  value={material.id}
                                  disabled={categoryBlend.some((blend, i) => i !== index && blend.materialId === material.id)}
                                >
                                  {material.name} (Factor: {material.factor.toFixed(2)})
                                </option>
                              ))}
                            </select>
                            {materialSavings && (
                              <div className={`text-xs mt-1 ${material && material.factor < 1.0 ? 'text-green-600' : material && material.factor > 1.0 ? 'text-red-600' : 'text-gray-500'}`}>
                                {materialSavings}
                              </div>
                            )}
                          </div>
                          
                          <div className="w-28">
                            <div className="flex items-center border rounded overflow-hidden">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={item.percentage}
                                onChange={(e) => {
                                  let newPercentage = Math.max(1, parseInt(e.target.value) || 0);
                                  
                                  if (newPercentage === item.percentage) return;
                                  
                                  const newBlend = [...categoryBlend];
                                  newBlend[index].percentage = newPercentage;
                                  
                                  handleBlendChange(category.id, newBlend);
                                }}
                                className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500"
                              />
                              <div className="px-2 bg-gray-100 text-gray-600">%</div>
                            </div>
                          </div>
                          
                          <div className="w-32 text-sm flex items-center">
                            {materialVolumes[category.id] > 0 && (
                              <span className="text-gray-500">
                                {((item.percentage / 100) * materialVolumes[category.id]).toFixed(1)} {category.units.find(u => u.id === selectedUnits[category.id])?.name || ''}
                              </span>
                            )}
                          </div>
                          
                          <button
                            onClick={() => {
                              if (categoryBlend.length <= 1) return;
                              
                              const newBlend = categoryBlend.filter((_, i) => i !== index);
                              handleBlendChange(category.id, newBlend);
                            }}
                            disabled={categoryBlend.length <= 1}
                            className={`p-1 rounded-full ${categoryBlend.length <= 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
                            title="Remove from blend"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Show validation message if total isn't 100% */}
                  {(() => {
                    const totalPercentage = categoryBlend.reduce((sum, item) => sum + item.percentage, 0);
                    return totalPercentage !== 100 ? (
                      <div className="mt-2 text-red-600 text-sm font-medium">
                        Total: {totalPercentage}% (must equal 100%)
                      </div>
                    ) : null;
                  })()}
                  
                  {categoryBlend.length < availableMaterials.length && (
                    <button
                      onClick={() => {
                        // Check if current total is 100% before allowing new material
                        const currentTotal = categoryBlend.reduce((sum, item) => sum + item.percentage, 0);
                        if (currentTotal !== 100) {
                          // Don't add new material if percentages don't sum to 100
                          return;
                        }
                        
                        // Find an unused material
                        const usedMaterialIds = categoryBlend.map(item => item.materialId);
                        const unusedMaterial = availableMaterials.find(m => !usedMaterialIds.includes(m.id));
                        
                        if (!unusedMaterial) return;
                        
                        // Take a small percentage from existing items (e.g., 10%)
                        const newPercentage = 10;  
                        const newBlend = [...categoryBlend];
                        
                        // Reduce percentages proportionally
                        let remaining = newPercentage;
                        const totalPercentage = newBlend.reduce((sum, item) => sum + item.percentage, 0);
                        
                        for (let i = 0; i < newBlend.length && remaining > 0; i++) {
                          const reduction = Math.min(
                            newBlend[i].percentage - 1, 
                            Math.ceil((newBlend[i].percentage / totalPercentage) * newPercentage)
                          );
                          
                          if (reduction > 0) {
                            newBlend[i].percentage -= reduction;
                            remaining -= reduction;
                          }
                        }
                        
                        // If couldn't take full amount, adjust first item
                        if (remaining > 0 && newBlend.length > 0) {
                          newBlend[0].percentage -= remaining;
                        }
                        
                        // Add new material
                        newBlend.push({
                          materialId: unusedMaterial.id,
                          percentage: newPercentage
                        });
                        
                        handleBlendChange(category.id, newBlend);
                      }}
                      disabled={categoryBlend.reduce((sum, item) => sum + item.percentage, 0) !== 100 || categoryBlend.length >= availableMaterials.length}
                      className={`mt-3 w-full p-2 border border-dashed border-blue-300 rounded text-blue-600 hover:bg-blue-50 flex items-center justify-center ${
                        (categoryBlend.reduce((sum, item) => sum + item.percentage, 0) !== 100 || categoryBlend.length >= availableMaterials.length) ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      type="button"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Material to Blend
                    </button>
                  )}
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <p>Individual volumes are calculated based on the total volume and blend percentages.</p>
                    <p className="mt-1 italic">Tip: Blend multiple materials to achieve the optimal balance between performance and emissions.</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default IntegratedMaterialSelection;