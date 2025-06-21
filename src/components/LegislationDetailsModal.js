import React from 'react';

function LegislationDetailsModal({ legislation, isOpen, onClose }) {
  if (!isOpen || !legislation) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{legislation.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{legislation.fullName}</p>
              {legislation.lastUpdated && (
                <p className="mt-1 text-xs text-gray-500">
                  Last updated: {new Date(legislation.lastUpdated).toLocaleDateString()}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {/* Description */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Overview</h3>
            <p className="text-gray-700">{legislation.description}</p>
            
            {legislation.notes && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                <div className="flex">
                  <svg className="h-5 w-5 text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.598 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div>
                    <h4 className="text-sm font-medium text-amber-800 mb-1">Recent Updates</h4>
                    <p className="text-sm text-amber-700">{legislation.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Thresholds */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Applicability Thresholds</h3>
            <div className="bg-blue-50 rounded-lg p-4">
              {Object.entries(legislation.thresholds).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/_/g, ' ')}:
                  </span>
                  <span className="text-sm text-gray-900">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Carbon Tax Rate (for Singapore) */}
          {legislation.carbonTaxRate && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Carbon Tax Rates</h3>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Current Rate:</span>
                  <span className="text-sm text-gray-900 font-semibold">{legislation.carbonTaxRate.current}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700">Future Rates:</span>
                  <span className="text-sm text-gray-900">{legislation.carbonTaxRate.future}</span>
                </div>
              </div>
            </div>
          )}

          {/* Reporting Requirements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Reporting Requirements</h3>
            <ul className="space-y-2">
              {legislation.reportingRequirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-gray-700">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Timeline */}
          {legislation.timeline && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Key Deadlines</h3>
              <div className="bg-purple-50 rounded-lg p-4">
                {Object.entries(legislation.timeline).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-sm text-gray-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scope 3 Requirement */}
          {legislation.requiresScope3 !== undefined && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Scope 3 Emissions</h3>
              <div className={`rounded-lg p-4 ${legislation.requiresScope3 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${legislation.requiresScope3 ? 'text-orange-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={legislation.requiresScope3 ? "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.598 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  <span className={`text-sm font-medium ${legislation.requiresScope3 ? 'text-orange-700' : 'text-gray-700'}`}>
                    Scope 3 emissions reporting: {legislation.requiresScope3 ? 'Required' : 'Not required'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Reduction Targets */}
          {legislation.requiresReductionTargets !== undefined && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reduction Targets</h3>
              <div className={`rounded-lg p-4 ${legislation.requiresReductionTargets ? 'bg-blue-50' : 'bg-gray-50'}`}>
                <div className="flex items-center">
                  <svg className={`h-5 w-5 mr-2 ${legislation.requiresReductionTargets ? 'text-blue-500' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={legislation.requiresReductionTargets ? "M13 10V3L4 14h7v7l9-11h-7z" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                  </svg>
                  <span className={`text-sm font-medium ${legislation.requiresReductionTargets ? 'text-blue-700' : 'text-gray-700'}`}>
                    Emission reduction targets: {legislation.requiresReductionTargets ? 'Required' : 'Not required'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Penalties */}
          {legislation.penalties && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Non-Compliance Penalties</h3>
              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.598 0L3.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-800">{legislation.penalties}</p>
                </div>
              </div>
            </div>
          )}

          {/* Why This Applies */}
          {legislation.reason && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Why This Applies to You</h3>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-yellow-800">{legislation.reason}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              {legislation.link && (
                <a
                  href={legislation.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Official Website
                </a>
              )}
              
              {legislation.legislationLink && (
                <a
                  href={legislation.legislationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View Legislation
                </a>
              )}
            </div>
            
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LegislationDetailsModal;