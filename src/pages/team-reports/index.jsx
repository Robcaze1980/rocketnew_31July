import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Header from '../../components/ui/Header';
import Sidebar from '../../components/ui/Sidebar';
import AIDataAnalyst from '../../components/AIDataAnalyst';
import { useAIAnalyst } from '../../contexts/AIAnalystContext';

import ReportFilters from './components/ReportFilters';
import ReportDataGrid from './components/ReportDataGrid';
import teamReportsService from '../../utils/teamReportsService';
import Icon from '../../components/AppIcon';

const TeamReports = () => {
  const { userProfile } = useAuth();
  const { updatePageContext } = useAIAnalyst();
  const [reportFilters, setReportFilters] = useState({});
  const [teamMembers, setTeamMembers] = useState([]);
  const [activeSalesperson, setActiveSalesperson] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load team members
  useEffect(() => {
    const loadTeamMembers = async () => {
      if (!userProfile?.id) return;

      try {
        setLoading(true);
        
        // Get team members
        const membersResult = await teamReportsService.getTeamMembersForFilters(userProfile.id);
        if (membersResult.success) {
          setTeamMembers(membersResult.data || []);
          // Set the first salesperson as active by default
          if (membersResult.data?.length > 0) {
            setActiveSalesperson(membersResult.data[0]);
          }
        }
      } catch (error) {
        console.error('Error loading team members:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTeamMembers();
  }, [userProfile?.id]);

  const handleFiltersChange = (newFilters) => {
    setReportFilters(newFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 mr-80">
        <Header />
        <main className="p-6 mt-20">
          {/* Reports Header */}
          <div className="mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Report by Salesperson</h1>
              <p className="text-muted-foreground mt-1">
                View individual performance reports for each sales team member.
              </p>
            </div>
          </div>

          {/* Salesperson Tabs */}
          <div className="mb-6">
            <div className="border-b border-border">
              <nav className="-mb-px flex space-x-8 overflow-x-auto pb-2">
                {teamMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setActiveSalesperson(member)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeSalesperson?.id === member.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                    }`}
                  >
                    {member.full_name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Reports Content */}
          <div className="space-y-6">
            {/* Report Filters */}
            <ReportFilters onFiltersChange={handleFiltersChange} />

            {/* Report Data Grid for Active Salesperson */}
            {activeSalesperson && (
              <div className="bg-card rounded-lg border border-border">
                <div className="p-4 border-b border-border bg-muted/50">
                  <h3 className="text-lg font-semibold text-foreground">
                    {activeSalesperson.full_name} - Performance Report
                  </h3>
                </div>
                <div className="p-4">
                  <ReportDataGrid filters={{...reportFilters, salesperson: activeSalesperson.id}} />
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Loading sales team...</span>
              </div>
            )}

            {/* No Team Members */}
            {!loading && teamMembers.length === 0 && (
              <div className="text-center py-8">
                <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No team members found</h3>
                <p className="text-muted-foreground">
                  You don't have any sales team members assigned to you yet.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
      <AIDataAnalyst />
    </div>
  );
};

export default TeamReports;
