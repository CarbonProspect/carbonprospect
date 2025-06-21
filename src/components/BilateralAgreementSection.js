import React, { useState, useEffect } from 'react';
import { getBilateralMarketData } from '../ComplianceMarketManager';
import { getValidToken } from '../AuthSystem';

const BilateralAgreementSection = ({ 
  selectedAgreements = [], 
  onAgreementsChange,
  documents = {
    mou: [],
    intent: [],
    noObjection: [],
    authorization: []
  },
  onDocumentsChange
}) => {
  const [loading, setLoading] = useState(false);
  const [agreements, setAgreements] = useState([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  
  // Load agreements from ComplianceMarketManager
  useEffect(() => {
    setLoading(true);
    // Get available agreements from the same manager used elsewhere in the app
    const marketsData = getBilateralMarketData();
    setAgreements(marketsData);
    setLoading(false);
  }, []);
  
  const handleAgreementToggle = (agreementId) => {
    let newSelectedAgreements;
    
    if (selectedAgreements.includes(agreementId)) {
      newSelectedAgreements = selectedAgreements.filter(id => id !== agreementId);
    } else {
      newSelectedAgreements = [...selectedAgreements, agreementId];
    }
    
    onAgreementsChange(newSelectedAgreements);
  };
  
  const handleDocumentUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (20MB max)
    if (file.size > 20 * 1024 * 1024) {
      alert("File exceeds the 20MB limit");
      return;
    }
    
    setUploadingDoc(true);
    
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document', file);
      formData.append('docType', docType);
      
      // Get token for authentication - use getValidToken for consistency with other components
      const token = getValidToken();
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }
      
      // Upload document to server
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Failed to upload document: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Create document object
      const newDoc = {
        id: data.id || `doc-${Date.now()}`,
        name: file.name,
        url: data.url,
        uploadDate: new Date().toISOString().split('T')[0],
        size: file.size
      };
      
      // Update documents state
      const updatedDocuments = {
        ...documents,
        [docType]: [...(documents[docType] || []), newDoc]
      };
      
      onDocumentsChange(updatedDocuments);
      setUploadingDoc(false);
    } catch (err) {
      console.error("Error uploading document:", err);
      alert("Failed to upload document. Please try again.");
      setUploadingDoc(false);
    }
  };
  
  const removeDocument = (docType, docId) => {
    const updatedDocuments = {
      ...documents,
      [docType]: (documents[docType] || []).filter(doc => doc.id !== docId)
    };
    
    onDocumentsChange(updatedDocuments);
  };
  
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
      <div className="px-6 py-5">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Bilateral Agreements & Documentation</h2>
        
        {/* Agreements Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Select Applicable Agreements</h3>
          <p className="text-gray-500 mb-3 text-sm">
            Please select all bilateral agreements and/or MoUs that your project falls under.
          </p>
          
          {agreements.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              {agreements.map(agreement => (
                <div 
                  key={agreement.id}
                  className={`border rounded-md p-4 transition-colors ${
                    selectedAgreements.includes(agreement.id) 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {agreement.name}: {agreement.buyingParty} - {agreement.hostCountry}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        Type: {agreement.type || 'Bilateral Agreement'}
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        agreement.status === 'Active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {agreement.status || 'Active'}
                      </span>
                      
                      <input
                        type="checkbox"
                        checked={selectedAgreements.includes(agreement.id)}
                        onChange={() => handleAgreementToggle(agreement.id)}
                        className="ml-4 h-5 w-5 text-green-600 rounded border-gray-300 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic">No agreements available</div>
          )}
        </div>
        
        {/* Documentation Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-700 mb-3">Required Documentation</h3>
          <p className="text-gray-500 mb-4 text-sm">
            Please upload all relevant documentation for your project under Article 6 of the Paris Agreement.
          </p>
          
          {/* MoU Documentation */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Memorandum of Understanding (MoU) Acknowledgment</h4>
            <p className="text-sm text-gray-500 mb-3">
              Documentation acknowledging the relevant MoU(s) for your project.
            </p>
            
            {documents.mou && documents.mou.length > 0 ? (
              <ul className="mb-4 divide-y divide-gray-200 border rounded-md overflow-hidden">
                {documents.mou.map(doc => (
                  <li key={doc.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} · Uploaded {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('mou', doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            
            <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="mou-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                    <span>Upload MoU document</span>
                    <input 
                      id="mou-upload" 
                      name="mou-upload" 
                      type="file" 
                      className="sr-only" 
                      onChange={(e) => handleDocumentUpload(e, 'mou')}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, PNG, JPG up to 20MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Letter of Intent (LoI) */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Letter of Intent (LoI)</h4>
            <p className="text-sm text-gray-500 mb-3">
              Letter indicating intentions to collaborate on specific carbon credit projects.
            </p>
            
            {documents.intent && documents.intent.length > 0 ? (
              <ul className="mb-4 divide-y divide-gray-200 border rounded-md overflow-hidden">
                {documents.intent.map(doc => (
                  <li key={doc.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} · Uploaded {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('intent', doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            
            <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="intent-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                    <span>Upload Letter of Intent</span>
                    <input 
                      id="intent-upload" 
                      name="intent-upload" 
                      type="file" 
                      className="sr-only" 
                      onChange={(e) => handleDocumentUpload(e, 'intent')}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, PNG, JPG up to 20MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Letter of No Objection (LoNo) */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Letter of No Objection (LoNo)</h4>
            <p className="text-sm text-gray-500 mb-3">
              Host country confirmation that there are no objections to the proposed project.
            </p>
            
            {documents.noObjection && documents.noObjection.length > 0 ? (
              <ul className="mb-4 divide-y divide-gray-200 border rounded-md overflow-hidden">
                {documents.noObjection.map(doc => (
                  <li key={doc.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} · Uploaded {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('noObjection', doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            
            <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="noObjection-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                    <span>Upload Letter of No Objection</span>
                    <input 
                      id="noObjection-upload" 
                      name="noObjection-upload" 
                      type="file" 
                      className="sr-only" 
                      onChange={(e) => handleDocumentUpload(e, 'noObjection')}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, PNG, JPG up to 20MB
                </p>
              </div>
            </div>
          </div>
          
          {/* Letter of Authorization (LoA) */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-700 mb-2">Letter of Authorization (LoA)</h4>
            <p className="text-sm text-gray-500 mb-3">
              Formal authorization for the transfer of Internationally Transferred Mitigation Outcomes (ITMOs).
            </p>
            
            {documents.authorization && documents.authorization.length > 0 ? (
              <ul className="mb-4 divide-y divide-gray-200 border rounded-md overflow-hidden">
                {documents.authorization.map(doc => (
                  <li key={doc.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(doc.size)} · Uploaded {doc.uploadDate}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('authorization', doc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            
            <div className="flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
              <div className="space-y-1 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="flex text-sm text-gray-600">
                  <label htmlFor="authorization-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none">
                    <span>Upload Letter of Authorization</span>
                    <input 
                      id="authorization-upload" 
                      name="authorization-upload" 
                      type="file" 
                      className="sr-only" 
                      onChange={(e) => handleDocumentUpload(e, 'authorization')}
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">
                  PDF, DOCX, PNG, JPG up to 20MB
                </p>
                {uploadingDoc && (
                  <div className="mt-2 flex justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-green-500"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Documentation Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-700 mb-3">Documentation Status</h4>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  documents.mou && documents.mou.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {documents.mou && documents.mou.length > 0 ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white font-medium">1</span>
                  )}
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium">MoU Acknowledgment</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  documents.intent && documents.intent.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {documents.intent && documents.intent.length > 0 ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white font-medium">2</span>
                  )}
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium">Letter of Intent</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  documents.noObjection && documents.noObjection.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {documents.noObjection && documents.noObjection.length > 0 ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white font-medium">3</span>
                  )}
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium">Letter of No Objection</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  documents.authorization && documents.authorization.length > 0 ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {documents.authorization && documents.authorization.length > 0 ? (
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-white font-medium">4</span>
                  )}
                </div>
                <div className="ml-3">
                  <span className="text-sm font-medium">Letter of Authorization</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BilateralAgreementSection;