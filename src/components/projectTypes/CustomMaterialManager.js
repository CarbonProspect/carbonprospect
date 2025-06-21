import React, { useState } from 'react';

const CustomMaterialManager = ({
  materials,
  materialCategories = [
    { id: 'concrete', name: 'Concrete', units: [{ id: 'm3', name: 'm³' }, { id: 'tonnes', name: 'tonnes' }] },
    { id: 'steel', name: 'Steel', units: [{ id: 'tonnes', name: 'tonnes' }, { id: 'kg', name: 'kg' }] },
    { id: 'timber', name: 'Timber', units: [{ id: 'm3', name: 'm³' }, { id: 'tonnes', name: 'tonnes' }, { id: 'kg', name: 'kg' }] },
    { id: 'insulation', name: 'Insulation', units: [{ id: 'm3', name: 'm³' }, { id: 'm2', name: 'm² (100mm thick)' }] },
    { id: 'glass', name: 'Glass', units: [{ id: 'tonnes', name: 'tonnes' }, { id: 'm2', name: 'm² (10mm thick)' }, { id: 'kg', name: 'kg' }] }
  ],
  onAddCustomMaterial,
  onUpdateMaterial,
  onDeleteCustomMaterial
}) => {
  // Filter to get just custom materials
  const customMaterials = materials.filter(material => material.isCustom);
  
  // State for adding new custom material
  const [showAddForm, setShowAddForm] = useState(false);
  
  // State for the new material being added
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    category: 'concrete',
    factor: 0.5,
    description: '',
    volume: 0,
    unit: 'm3'
  });
  
  // State for editing mode
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  
  // State for the material being edited
  const [editMaterial, setEditMaterial] = useState({
    name: '',
    category: '',
    factor: 0,
    description: '',
    unit: ''
  });
  
  // Handle add form input changes
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setNewMaterial({
      ...newMaterial,
      [name]: name === 'factor' ? parseFloat(value) || 0 : value
    });
  };
  
  // Handle edit form input changes
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditMaterial({
      ...editMaterial,
      [name]: name === 'factor' ? parseFloat(value) || 0 : value
    });
  };
  
  // Handle add material submission
  const handleAddMaterial = (e) => {
    e.preventDefault();
    
    if (!newMaterial.name.trim()) return;
    
    onAddCustomMaterial({
      ...newMaterial,
      // Include unit info
      preferredUnit: newMaterial.unit
    });
    
    // Reset form
    setNewMaterial({
      name: '',
      category: 'concrete',
      factor: 0.5,
      description: '',
      volume: 0,
      unit: 'm3'
    });
    
    setShowAddForm(false);
  };
  
  // Start editing a material
  const handleStartEdit = (material) => {
    setEditingMaterialId(material.id);
    setEditMaterial({
      name: material.name,
      category: material.category,
      factor: material.factor,
      description: material.description || '',
      unit: material.preferredUnit || materialCategories.find(c => c.id === material.category)?.units[0]?.id || 'm3'
    });
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setEditingMaterialId(null);
  };
  
  // Submit edit changes
  const handleSubmitEdit = (e, materialId) => {
    e.preventDefault();
    
    if (!editMaterial.name.trim()) return;
    
    onUpdateMaterial(materialId, {
      ...editMaterial,
      preferredUnit: editMaterial.unit
    });
    setEditingMaterialId(null);
  };
  
  // Handle material deletion
  const handleDeleteMaterial = (materialId) => {
    if (window.confirm('Are you sure you want to delete this custom material?')) {
      onDeleteCustomMaterial(materialId);
    }
  };
  
  // Get the factor color based on emission factor value
  const getFactorColor = (factor) => {
    if (factor < 0.3) return 'text-green-600';
    if (factor < 0.7) return 'text-green-500';
    if (factor < 1.0) return 'text-yellow-600';
    return 'text-red-500';
  };

  // Get units for a specific category
  const getUnitsForCategory = (categoryId) => {
    const category = materialCategories.find(c => c.id === categoryId);
    return category ? category.units : [{ id: 'm3', name: 'm³' }];
  };
  
  return (
    <div className="space-y-6">
      {/* Custom materials table */}
      <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg border">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Custom Materials</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            type="button"
          >
            Add Custom Material
          </button>
        </div>
        
        {customMaterials.length > 0 ? (
          <div className="border-t border-gray-200">
            <ul className="divide-y divide-gray-200">
              {customMaterials.map(material => (
                <li key={material.id} className="px-4 py-4">
                  {editingMaterialId === material.id ? (
                    <form onSubmit={(e) => handleSubmitEdit(e, material.id)} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700">
                            Material Name
                          </label>
                          <input
                            type="text"
                            id="edit-name"
                            name="name"
                            value={editMaterial.name}
                            onChange={handleEditInputChange}
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700">
                            Category
                          </label>
                          <select
                            id="edit-category"
                            name="category"
                            value={editMaterial.category}
                            onChange={(e) => {
                              const newCategory = e.target.value;
                              const newUnits = getUnitsForCategory(newCategory);
                              const defaultUnit = newUnits[0]?.id || 'm3';
                              
                              setEditMaterial({
                                ...editMaterial,
                                category: newCategory,
                                unit: defaultUnit
                              });
                            }}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {materialCategories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="edit-factor" className="block text-sm font-medium text-gray-700">
                            Emission Factor (compared to standard)
                          </label>
                          <input
                            type="number"
                            id="edit-factor"
                            name="factor"
                            value={editMaterial.factor}
                            onChange={handleEditInputChange}
                            min="0.01"
                            max="2.0"
                            step="0.01"
                            required
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            0.5 = 50% of standard emissions, 1.0 = same as standard
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="edit-unit" className="block text-sm font-medium text-gray-700">
                            Preferred Unit
                          </label>
                          <select
                            id="edit-unit"
                            name="unit"
                            value={editMaterial.unit}
                            onChange={handleEditInputChange}
                            className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            {getUnitsForCategory(editMaterial.category).map(unit => (
                              <option key={unit.id} value={unit.id}>{unit.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">
                            Description (optional)
                          </label>
                          <textarea
                            id="edit-description"
                            name="description"
                            value={editMaterial.description}
                            onChange={handleEditInputChange}
                            rows="2"
                            className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={handleCancelEdit}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="flex justify-between">
                        <div>
                          <h4 className="text-lg font-medium">{material.name}</h4>
                          <div className="mt-1 flex items-center">
                            <span className="text-sm text-gray-500 capitalize">{material.category}</span>
                            <span className="mx-2 text-gray-300">|</span>
                            <span className={`text-sm font-medium ${getFactorColor(material.factor)}`}>
                              Factor: {material.factor.toFixed(2)}
                              {material.factor < 1.0 ? 
                                ` (${((1 - material.factor) * 100).toFixed(0)}% reduction)` : 
                                ` (${((material.factor - 1) * 100).toFixed(0)}% increase)`}
                            </span>
                            {material.preferredUnit && (
                              <>
                                <span className="mx-2 text-gray-300">|</span>
                                <span className="text-sm text-gray-500">
                                  Measured in: {
                                    getUnitsForCategory(material.category).find(u => u.id === material.preferredUnit)?.name || 
                                    material.preferredUnit
                                  }
                                </span>
                              </>
                            )}
                          </div>
                          {material.description && (
                            <p className="mt-2 text-sm text-gray-600">{material.description}</p>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStartEdit(material)}
                            className="text-blue-600 hover:text-blue-800"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteMaterial(material.id)}
                            className="text-red-600 hover:text-red-800"
                            type="button"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p>No custom materials yet. Add your first custom material to start.</p>
          </div>
        )}
      </div>
      
      {/* Add material form dialog */}
      {showAddForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-10">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Custom Material</h3>
            
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Material Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={newMaterial.name}
                  onChange={handleAddInputChange}
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g., Bio-based Concrete Mix"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={newMaterial.category}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      const newUnits = getUnitsForCategory(newCategory);
                      const defaultUnit = newUnits[0]?.id || 'm3';
                      
                      setNewMaterial({
                        ...newMaterial,
                        category: newCategory,
                        unit: defaultUnit
                      });
                    }}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {materialCategories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                    Preferred Unit
                  </label>
                  <select
                    id="unit"
                    name="unit"
                    value={newMaterial.unit}
                    onChange={handleAddInputChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    {getUnitsForCategory(newMaterial.category).map(unit => (
                      <option key={unit.id} value={unit.id}>{unit.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="factor" className="block text-sm font-medium text-gray-700">
                  Emission Factor (compared to standard)
                </label>
                <input
                  type="number"
                  id="factor"
                  name="factor"
                  value={newMaterial.factor}
                  onChange={handleAddInputChange}
                  min="0.01"
                  max="2.0"
                  step="0.01"
                  required
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                />
                <p className="mt-1 text-xs text-gray-500">
                  0.5 = 50% of standard emissions, 1.0 = same as standard
                </p>
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={newMaterial.description}
                  onChange={handleAddInputChange}
                  rows="2"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                  placeholder="Add details about this material..."
                />
              </div>
              
              <div>
                <label htmlFor="volume" className="block text-sm font-medium text-gray-700">
                  Initial Volume (optional)
                </label>
                <div className="flex">
                  <input
                    type="number"
                    id="volume"
                    name="volume"
                    value={newMaterial.volume}
                    onChange={handleAddInputChange}
                    min="0"
                    step="0.1"
                    className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md rounded-r-none"
                  />
                  <span className="inline-flex items-center px-3 mt-1 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm rounded-r-md">
                    {getUnitsForCategory(newMaterial.category).find(u => u.id === newMaterial.unit)?.name || newMaterial.unit}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Add Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomMaterialManager;