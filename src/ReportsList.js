import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from './api-config';
import reportStorage from './Services/reportStorage';

const ReportsList = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Get reports from local storage
      const localReports = reportStorage.getAllReports();
      
      // Also try to fetch from API if implemented
      try {
        // Get all carbon footprints first
        const footprintsResponse = await api.get('/carbon-footprints');
        const footprints = footprintsResponse.data;
        
        // For each footprint, get its reports
        const apiReports = [];
        for (const footprint of footprints) {
          try {
            const reportsResponse = await api.get(`/carbon-footprints/${footprint.id}/reports`);
            const footprintReports = reportsResponse.data.map(report => ({
              ...report,
              footprintName: footprint.name,
              source: 'api'
            }));
            apiReports.push(...footprintReports);
          } catch (err) {
            console.log(`No reports found for footprint ${footprint.id}`);
          }
        }
        
        // Combine local and API reports
        const allReports = [
          ...localReports.map(r => ({ ...r, source: 'local' })),
          ...apiReports
        ];
        
        // Remove duplicates based on reportId
        const uniqueReports = allReports.filter((report, index, self) =>
          index === self.findIndex((r) => r.reportId === report.reportId)
        );
        
        setReports(uniqueReports);
      } catch (err) {
        console.error('Error fetching reports from API:', err);
        // Fall back to just local reports
        setReports(localReports.map(r => ({ ...r, source: 'local' })));
      }
      
    } catch (err) {
      setError('Failed to load reports');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteReport = (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      const result = reportStorage.deleteReport(reportId);
      if (result.success) {
        fetchReports(); // Refresh the list
      } else {
        alert('Failed to delete report');
      }
    }
  };

  const downloadReport = async (report) => {
    try {
      // Re-generate the PDF from the saved data
      const { generateReportPDF } = await import('./utils/pdfExportUtil');
      
      // Create a temporary div to render the report content
      const tempDiv = document.createElement('div');
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);
      
      // Generate the PDF
      const pdf = await generateReportPDF(report, tempDiv, {});
      
      // Download it
      const fileName = `${report.reportId}_${report.companyName?.replace(/\s+/g, '_')}.pdf`;
      pdf.save(fileName);
      
      // Clean up
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report. The report data may be incomplete.');
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    if (filter === 'local') return report.source === 'local';
    if (filter === 'api') return report.source === 'api';
    return report.reportType === filter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Saved Reports</h1>
        <p className="text-gray-600">View and manage your carbon footprint compliance reports</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setFilter('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={() => setFilter('standard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'standard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setFilter('regulatory')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'regulatory'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Regulatory
          </button>
          <button
            onClick={() => setFilter('tcfd')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              filter === 'tcfd'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            TCFD
          </button>
        </nav>
      </div>

      {filteredReports.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
          <p className="text-gray-500 mb-4">
            You haven't saved any reports yet. Generate a report from your carbon footprint assessments.
          </p>
          <Link
            to="/carbon-footprint/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Carbon Footprint
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredReports.map((report) => (
            <div key={report.reportId} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {report.companyName || 'Unknown Company'}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{report.reportId}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    report.source === 'local' 
                      ? 'bg-gray-100 text-gray-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {report.source === 'local' ? 'Local' : 'Synced'}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium capitalize">{report.reportType || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Generated:</span>
                    <span className="font-medium">{report.formattedDate || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Total Emissions:</span>
                    <span className="font-medium text-blue-600">
                      {report.emissions?.total ? `${Math.round(report.emissions.total).toLocaleString()} tCO2e` : 'N/A'}
                    </span>
                  </div>
                  {report.footprintName && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Project:</span>
                      <span className="font-medium truncate ml-2">{report.footprintName}</span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => downloadReport(report)}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download
                  </button>
                  {report.projectId && (
                    <Link
                      to={`/carbon-footprint/${report.projectId}`}
                      className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-blue-600 shadow-sm text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
                    >
                      View Project
                    </Link>
                  )}
                  <button
                    onClick={() => deleteReport(report.reportId)}
                    className="inline-flex items-center p-2 border border-red-300 rounded-md text-red-600 hover:bg-red-50"
                    title="Delete Report"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsList;