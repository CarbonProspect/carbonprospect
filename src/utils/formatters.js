// Helper function to format currency
export const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD',
      maximumFractionDigits: 0 
    }).format(value);
  };
  
  // Function to get the project size label based on project type
  export const getProjectSizeLabel = (projectType) => {
    switch(projectType) {
      case 'livestock':
        return 'Herd Size (animals)';
      case 'renewable':
        return 'Capacity (MW)';
      case 'construction':
        return 'Building Size (sqm)';
      default:
        return 'Project Size (hectares)';
    }
  };
  
  // Helper function to get project type label
  export const getProjectTypeLabel = (projectType) => {
    switch(projectType) {
      case 'livestock': return 'Herd';
      case 'renewable': return 'Capacity';
      case 'forestry': return 'Forestry';
      case 'soil': return 'Soil';
      case 'bluecarbon': return 'Ecosystem';
      case 'redd': return 'Forest Conservation';
      case 'construction': return 'Building';
      default: return 'Project';
    }
  };