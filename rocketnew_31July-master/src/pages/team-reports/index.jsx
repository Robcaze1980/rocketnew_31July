import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AIDataAnalyst from '../../components/AIDataAnalyst';
import { useAIAnalyst } from '../../contexts/AIAnalystContext';

import ReportFilters from './components/ReportFilters';
import ReportTemplates from './components/ReportTemplates';
import CustomReportBuilder from './components/CustomReportBuilder';
import ReportDataGrid from './components/ReportDataGrid';
import teamReportsService from '../../utils/teamReportsService';
import Icon from '../../components/AppIcon';

const TeamReports = () => {
  const { userProfile } = useAuth();
  const { updatePageContext } = useAIAnalyst();
  const [reportFilters, setReportFilters] = useState({});
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [filters, setFilters] = useState({});
  const [activeTab, setActiveTab] = useState('overview');

  // Update AI context when component mounts or data changes
  useEffect(() => {
    const updateAIContext = () => {
      const context = {
        teamData: teamMembers || [],
        reportsData: filteredReports || [],
        selectedFilters: filters,
        reportType: activeTab,
        totalReports: filteredReports?.length || 0,
        trends: [
          { month: 'Current', reports: filteredReports?.length || 0, completion: 85 },
          { month: 'Previous', reports: Math.round((filteredReports?.length || 0) * 0.9), completion: 82 }
        ]
      };
      
      updatePageContext('Team Reports', context);
    };

    updateAIContext();
  }, [teamMembers, filteredReports, filters, activeTab, updatePageContext]);

  const handleFiltersChange = (newFilters) => {
    setReportFilters(newFilters);
  };

  const handleGenerateReport = async () => {
    if (!userProfile?.id) return;

    try {
      setIsGeneratingReport(true);

      const reportConfig = {
        filters: reportFilters,
        format: 'excel', // Default format
        managerId: userProfile?.id
      };

      const result = await teamReportsService?.generateScheduledReport(userProfile?.id, reportConfig);

      if (result?.success) {
        // Show success message - in a real app, you might show a toast notification
        console.log('Report generated successfully:', result?.data);
      } else {
        console.error('Failed to generate report:', result?.error);
      }
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleScheduleReport = () => {
    // In a real implementation, this would open a modal to configure scheduled reports
    console.log('Schedule report functionality would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 mr-80">
        <Header />
        <main className="p-6 mt-20">
          {/* Reports Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Team Reports</h1>
                <p className="text-muted-foreground mt-1">
                  Comprehensive analytics and reporting tools for sales team performance analysis.
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleScheduleReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md font-medium text-sm transition-colors"
                >
                  <Icon name="Calendar" size={16} />
                  <span>Schedule Report</span>
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport}
                  className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGeneratingReport ? (
                    <>
                      <Icon name="Loader2" size={16} className="animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Icon name="FileText" size={16} />
                      <span>Generate Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Reports Content */}
          <div className="space-y-8">
            {/* Report Filters */}
            <ReportFilters onFiltersChange={handleFiltersChange} />

            {/* Report Templates */}
            <ReportTemplates />

            {/* Custom Report Builder */}
            <CustomReportBuilder />

            {/* Report Data Grid */}
            <ReportDataGrid filters={reportFilters} />
          </div>
        </main>
      </div>
      <AIDataAnalyst />
    </div>
  );
};

export default TeamReports;