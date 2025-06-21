import React, { useState, useEffect } from 'react';

const MaterialBlender = ({ 
  materialCategory, 
  availableMaterials, 
  onBlendChange,
  currentBlend = []
}) => {
  // Initialize with existing blend or default to a single material with 100%
  const [blendItems, setBlendItems] = useState(
    currentBlend.length > 0 
      ? currentBlend
      : availableMaterials.length > 0 
        ? [{ materialId: availableMaterials[0].id, percentage: 100 }] 
        : []
  );

  // Calculate remaining percentage
  const usedPercentage = blendItems.reduce((sum, item) => sum + item.percentage, 0);
  const remainingPercentage = 100 - usedPercentage;

  // Effect to initialize or update blend when availableMaterials changes
  useEffect(() => {
    if (blendItems.length === 0 && availableMaterials.length > 0) {
      setBlendItems([{ materialId: availableMaterials[0].id, percentage: 100 }]);
    }

    // Validate that all materials in the blend are still available
    if (blendItems.length > 0) {
      const validBlendItems = blendItems.filter(item => 
        availableMaterials.some(m => m.id === item.materialId)
      );

      // If some items were invalid, recalculate percentages
      if (validBlendItems.length !== blendItems.length) {
        if (validBlendItems.length === 0 && availableMaterials.length > 0) {
          // All items were invalid, create a new default
          setBlendItems([{ materialId: availableMaterials[0].id, percentage: 100 }]);
        } else if (validBlendItems.length > 0) {
          // Recalculate percentages to total 100%
          const totalValidPercentage = validBlendItems.reduce((sum, item) => sum + item.percentage, 0);
          const adjustedItems = validBlendItems.map(item => ({
            ...item,
            percentage: Math.round((item.percentage / totalValidPercentage) * 100)
          }));
          
          // Ensure it totals exactly 100%
          if (adjustedItems.length > 0) {
            const calculatedTotal = adjustedItems.reduce((sum, item) => sum + item.percentage, 0);
            if (calculatedTotal !== 100) {
              adjustedItems[0].percentage += (100 - calculatedTotal);
            }
            setBlendItems(adjustedItems);
          }
        }
      }
    }
  }, [availableMaterials]);

  // Handle adding a new material to the blend
  const handleAddMaterial = () => {
    // Find a material not already in blend
    const unusedMaterials = availableMaterials.filter(
      material => !blendItems.some(item => item.materialId === material.id)
    );
    
    if (unusedMaterials.length === 0 || remainingPercentage <= 0) {
      return; // No unused materials or no percentage left
    }
    
    // Add new material with remaining percentage (or split if multiple will be added)
    setBlendItems([
      ...blendItems,
      { materialId: unusedMaterials[0].id, percentage: remainingPercentage }
    ]);
  };

  // Handle removing a material from the blend
  const handleRemoveMaterial = (index) => {
    if (blendItems.length <= 1) {
      return; // Don't remove the last item
    }
    
    const removedPercentage = blendItems[index].percentage;
    const newBlendItems = blendItems.filter((_, i) => i !== index);
    
    // Redistribute the removed percentage to the first remaining item
    if (newBlendItems.length > 0 && removedPercentage > 0) {
      newBlendItems[0].percentage += removedPercentage;
    }
    
    setBlendItems(newBlendItems);
    onBlendChange(newBlendItems);
  };

  // Handle changing material type
  const handleMaterialChange = (index, materialId) => {
    // Ensure this material isn't already used
    if (blendItems.some((item, i) => i !== index && item.materialId === materialId)) {
      return; // Material already used in another slot
    }
    
    const newBlendItems = [...blendItems];
    newBlendItems[index].materialId = materialId;
    
    setBlendItems(newBlendItems);
    onBlendChange(newBlendItems);
  };

  // Handle changing percentage
  const handlePercentageChange = (index, value) => {
    let percentage = Math.min(100, Math.max(1, parseInt(value) || 0));
    
    // Calculate how much this changed
    const oldPercentage = blendItems[index].percentage;
    const delta = percentage - oldPercentage;
    
    // Don't allow changes that would make total > 100%
    if (usedPercentage + delta > 100) {
      percentage = oldPercentage + (100 - usedPercentage);
    }
    
    // Update this item
    const newBlendItems = [...blendItems];
    newBlendItems[index].percentage = percentage;
    
    // If increased, decrease from other items proportionally
    if (delta > 0) {
      const otherItems = newBlendItems.filter((_, i) => i !== index);
      const otherTotal = otherItems.reduce((sum, item) => sum + item.percentage, 0);
      
      if (otherTotal > 0) {
        // Distribute the decrease proportionally
        let remaining = delta;
        
        for (let i = 0; i < newBlendItems.length && remaining > 0; i++) {
          if (i !== index && newBlendItems[i].percentage > 1) {
            const proportion = newBlendItems[i].percentage / otherTotal;
            const decrease = Math.min(newBlendItems[i].percentage - 1, Math.ceil(delta * proportion));
            newBlendItems[i].percentage -= decrease;
            remaining -= decrease;
          }
        }
      }
    }
    
    // Ensure it totals exactly 100%
    const calculatedTotal = newBlendItems.reduce((sum, item) => sum + item.percentage, 0);
    if (calculatedTotal !== 100 && newBlendItems.length > 0) {
      // Find an item other than the one being edited to adjust
      const adjustIndex = index === 0 && newBlendItems.length > 1 ? 1 : 0;
      newBlendItems[adjustIndex].percentage += (100 - calculatedTotal);
    }
    
    setBlendItems(newBlendItems);
    onBlendChange(newBlendItems);
  };

  // Calculate the effective emission factor
  const calculateEffectiveFactor = () => {
    return blendItems.reduce((factor, item) => {
      const material = availableMaterials.find(m => m.id === item.materialId);
      if (material) {
        return factor + (material.factor * (item.percentage / 100));
      }
      return factor;
    }, 0);
  };

  const effectiveFactor = calculateEffectiveFactor();

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700 capitalize">{materialCategory} Blend</h3>
        <div className="text-sm">
          <span className="text-gray-500">Effective Factor:</span>
          <span className={`ml-1 font-medium ${effectiveFactor < 1 ? 'text-green-600' : effectiveFactor > 1 ? 'text-red-600' : 'text-gray-600'}`}>
            {effectiveFactor.toFixed(2)}
          </span>
        </div>
      </div>
      
      <div className="space-y-2">
        {blendItems.map((item, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div className="flex-grow">
              <select
                value={item.materialId}
                onChange={(e) => handleMaterialChange(index, e.target.value)}
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {availableMaterials.map(material => (
                  <option 
                    key={material.id} 
                    value={material.id}
                    disabled={blendItems.some((blendItem, i) => i !== index && blendItem.materialId === material.id)}
                  >
                    {material.name} (Factor: {material.factor.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="w-24">
              <div className="flex items-center border rounded overflow-hidden">
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={item.percentage}
                  onChange={(e) => handlePercentageChange(index, e.target.value)}
                  className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500"
                />
                <div className="px-2 bg-gray-100 text-gray-600">%</div>
              </div>
            </div>
            
            <button
              onClick={() => handleRemoveMaterial(index)}
              disabled={blendItems.length <= 1}
              className={`p-1 rounded-full ${blendItems.length <= 1 ? 'text-gray-300' : 'text-red-500 hover:bg-red-50'}`}
              title="Remove from blend"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
      
      {remainingPercentage > 0 && blendItems.length < availableMaterials.length && (
        <button
          onClick={handleAddMaterial}
          className="w-full p-2 border border-dashed border-blue-300 rounded text-blue-600 hover:bg-blue-50 flex items-center justify-center"
          type="button"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Material to Blend
        </button>
      )}
      
      {/* Progress bar showing blend percentages */}
      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
        {blendItems.map((item, index) => {
          // Find the material to get its color
          const material = availableMaterials.find(m => m.id === item.materialId);
          
          // Determine color based on emission factor
          let color = 'bg-gray-400';
          if (material) {
            if (material.factor < 0.7) color = 'bg-green-500';
            else if (material.factor < 1.0) color = 'bg-green-400';
            else if (material.factor === 1.0) color = 'bg-blue-400';
            else color = 'bg-red-400';
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
      
      <div className="text-xs text-gray-500">
        Blend multiple materials to achieve the optimal balance between performance and emissions.
      </div>
    </div>
  );
};

export default MaterialBlender;