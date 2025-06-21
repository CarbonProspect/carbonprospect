// Local storage service for reports
class ReportStorageService {
  constructor() {
    this.storageKey = 'carbonProspectReports';
  }

  // Save report to local storage
  saveReport(reportData) {
    try {
      const reports = this.getAllReports();
      const reportToSave = {
        ...reportData,
        id: reportData.reportId || `REP-${Date.now()}`,
        savedAt: new Date().toISOString(),
        status: 'saved'
      };
      
      // Add or update report
      const existingIndex = reports.findIndex(r => r.id === reportToSave.id);
      if (existingIndex >= 0) {
        reports[existingIndex] = reportToSave;
      } else {
        reports.push(reportToSave);
      }
      
      localStorage.setItem(this.storageKey, JSON.stringify(reports));
      return { success: true, reportId: reportToSave.id };
    } catch (error) {
      console.error('Error saving report:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all saved reports
  getAllReports() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading reports:', error);
      return [];
    }
  }

  // Get specific report
  getReport(reportId) {
    const reports = this.getAllReports();
    return reports.find(r => r.id === reportId);
  }

  // Delete report
  deleteReport(reportId) {
    try {
      const reports = this.getAllReports();
      const filtered = reports.filter(r => r.id !== reportId);
      localStorage.setItem(this.storageKey, JSON.stringify(filtered));
      return { success: true };
    } catch (error) {
      console.error('Error deleting report:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new ReportStorageService();