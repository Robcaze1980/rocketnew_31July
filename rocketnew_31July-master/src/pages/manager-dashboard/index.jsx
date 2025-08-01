import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BarChart3, TrendingUp, Users, FileText, AlertTriangle, DollarSign, Target, Car, ShoppingCart } from 'lucide-react';

import Sidebar from '../../components/ui/Sidebar';
import AIDataAnalyst from '../../components/AIDataAnalyst';
import { useAIAnalyst } from '../../contexts/AIAnalystContext';

import ManagerDashboardOverview from './components/ManagerDashboardOverview';
import TeamPerformanceCharts from './components/TeamPerformanceCharts';

import TeamMemberCards from './components/TeamMemberCards';
import AdvancedAnalytics from './components/AdvancedAnalytics';
import Icon from '../../components/AppIcon';

// New components for Phase 1
import DoubleClaimAlerts from './components/DoubleClaimAlerts';
import ProductProfitabilityAnalysis from './components/ProductProfitabilityAnalysis';
import PerformanceGraphs from './components/PerformanceGraphs';
import EnhancedKPIGrid from './components/EnhancedKPIGrid';
import SalesTeamPerformance from './components/SalesTeamPerformance';

import managerService from '../../utils/managerService';

const ManagerDashboard = () => {
  const { user, userProfile } = useAuth();
  const { updatePageContext } = useAIAnalyst();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [doubleClaimAlerts, setDoubleClaimAlerts] = useState([]);
  const [alertCount, setAlertCount] = useState(0);
  const [teamData, setTeamData] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});

  // Phase 1: Enhanced tab structure with unified dashboard
  const tabs = [
    { id: 'overview', name: 'Unified Dashboard', icon: BarChart3, description: 'Complete management overview with KPIs and alerts' },
    { id: 'performance', name: 'Performance Graphs', icon: TrendingUp, description: 'Revenue, commissions, and sales trends' },
    { id: 'profitability', name: 'Product Profitability', icon: DollarSign, description: 'Warranty, maintenance, and accessories analysis' },
    { id: 'team', name: 'Team Management', icon: Users, description: 'Team member performance and management' },
    { id: 'alerts', name: 'Double Claim Alerts', icon: AlertTriangle, description: 'Unresolved claims and priority alerts', badge: alertCount },
    { id: 'reports', name: 'Advanced Analytics', icon: FileText, description: 'Detailed reports and insights' }
  ];

  // Enhanced loading function with error handling
  const loadDoubleClaimAlerts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Verify manager access first
      await managerService?.verifyManagerAccess?.(user?.id);

      // Get team members with defensive programming
      const teamMembers = await managerService?.getTeamMembers?.(user?.id);
      const teamMemberIds = teamMembers?.map(member => member?.id)?.filter(Boolean) || [];
      
      // Set team data for AI context
      setTeamData(teamMembers || []);
      
      // Check for double claims across all team sales
      const alertPromises = teamMemberIds?.map(async (memberId) => {
        try {
          const salesData = await managerService?.getTeamMemberSales?.(memberId);
          if (salesData && Array.isArray(salesData)) {
            return salesData?.filter(sale => sale?.status === 'pending')?.map(sale => ({
              ...sale,
              teamMember: teamMembers?.find(member => member?.id === memberId)
            })) || [];
          }
          return [];
        } catch (err) {
          console.error(`Error fetching sales for member ${memberId}:`, err);
          return [];
        }
      }) || [];

      const allPendingSales = (await Promise.all(alertPromises))?.flat() || [];
      
      // Group by stock number to find potential conflicts
      const stockGroups = {};
      allPendingSales?.forEach(sale => {
        if (sale?.stock_number) {
          if (!stockGroups?.[sale?.stock_number]) {
            stockGroups[sale.stock_number] = [];
          }
          stockGroups?.[sale?.stock_number]?.push(sale);
        }
      });

      // Find actual conflicts
      const conflicts = Object.entries(stockGroups)?.filter(([stockNumber, sales]) => sales?.length > 1)?.map(([stockNumber, sales]) => ({
          stockNumber,
          sales,
          priority: 'high',
          createdAt: Math.min(...(sales?.map(s => new Date(s?.created_at || 0)?.getTime()) || [0]))
        })) || [];

      setDoubleClaimAlerts(conflicts);
      setAlertCount(conflicts?.length || 0);

      // Calculate performance metrics for AI context
      const totalSales = teamMembers?.reduce((sum, member) => sum + (member?.total_sales || 0), 0) || 0;
      const totalRevenue = teamMembers?.reduce((sum, member) => sum + (member?.total_revenue || 0), 0) || 0;
      const totalCommission = teamMembers?.reduce((sum, member) => sum + (member?.total_commission || 0), 0) || 0;
      
      const topPerformer = teamMembers?.reduce((top, member) => 
        (member?.total_sales || 0) > (top?.total_sales || 0) ? member : top, 
        teamMembers?.[0] || {}
      );

      const metrics = {
        teamData: teamMembers || [],
        topPerformer,
        teamAverage: {
          sales: Math.round(totalSales / (teamMembers?.length || 1)),
          revenue: Math.round(totalRevenue / (teamMembers?.length || 1)),
          commission: Math.round(totalCommission / (teamMembers?.length || 1))
        },
        trends: [
          { month: 'Current', sales: totalSales, revenue: totalRevenue, conversion: 85 },
          { month: 'Previous', sales: Math.round(totalSales * 0.9), revenue: Math.round(totalRevenue * 0.9), conversion: 82 }
        ],
        goals: teamMembers?.map(member => ({
          team_member: member,
          sales_target: (member?.total_sales || 0) * 1.2,
          revenue_target: (member?.total_revenue || 0) * 1.15
        })) || []
      };

      setPerformanceMetrics(metrics);

      // Update AI context with dashboard data
      updatePageContext('Dashboard', metrics);

    } catch (err) {
      setError(err?.message || 'Failed to load manager dashboard');
      console.error('Manager dashboard loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load double claim alerts on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeData = async () => {
      if (isMounted) {
        await loadDoubleClaimAlerts();
      }
    };

    initializeData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  // Real-time updates for double claim alerts with defensive programming
  useEffect(() => {
    let channel = null;

    if (user?.id && managerService?.subscribeToTeamUpdates) {
      try {
        channel = managerService?.subscribeToTeamUpdates?.(user?.id, () => {
          // Reload alerts when team sales are updated
          if (user?.id) {
            loadDoubleClaimAlerts()?.catch(err => {
              console.error('Error reloading alerts:', err);
            });
          }
        });
      } catch (error) {
        console.error('Error setting up real-time subscription:', error);
      }
    }

    return () => {
      if (channel && managerService?.unsubscribeChannel) {
        try {
          managerService?.unsubscribeChannel?.(channel);
        } catch (error) {
          console.error('Error unsubscribing from channel:', error);
        }
      }
    };
  }, [user?.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 mr-80">
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
              <div className="grid grid-cols-4 gap-6">
                {[...Array(6)]?.map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
        <AIDataAnalyst />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <div className="ml-64 mr-80">
          <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Access Error</h2>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  loadDoubleClaimAlerts()?.catch(err => {
                    setError(err?.message || 'Retry failed');
                  });
                }}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </main>
        </div>
        <AIDataAnalyst />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="ml-64 mr-80">
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Enhanced Header with Alert Summary */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Manager Dashboard</h1>
              <p className="text-muted-foreground mt-1">
                Welcome back, {userProfile?.full_name || 'Manager'}. Complete management overview with unified KPIs and alerts.
              </p>
              {alertCount > 0 && (
                <div className="mt-2 flex items-center space-x-2">
                  <AlertTriangle size={16} className="text-amber-500" />
                  <span className="text-sm text-amber-700">
                    {alertCount} unresolved double claim alert{alertCount !== 1 ? 's' : ''} requiring attention
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-medium rounded-full">
                {userProfile?.role === 'admin' ? 'Administrator' : 'Sales Manager'}
              </div>
              {alertCount > 0 && (
                <button
                  onClick={() => setActiveTab('alerts')}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <AlertTriangle size={16} />
                  <span>View Alerts ({alertCount})</span>
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Tab Navigation with Descriptions */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8 overflow-x-auto">
                {tabs?.map((tab) => {
                  const Icon = tab?.icon;
                  return (
                    <button
                      key={tab?.id}
                      onClick={() => setActiveTab(tab?.id)}
                      className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap relative ${
                        activeTab === tab?.id
                          ? 'border-blue-500 text-blue-600' :'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon size={16} />
                      <span>{tab?.name}</span>
                      {tab?.badge > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {tab?.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
            <div className="mt-2">
              <p className="text-sm text-gray-600">
                {tabs?.find(tab => tab?.id === activeTab)?.description || ''}
              </p>
            </div>
          </div>

          {/* Tab Content with Error Boundaries */}
          <div className="space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* New Enhanced Department KPIs Layout */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Enhanced Department KPIs</h2>
                  
                  {/* Main Grid Layout - 3 Columns */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Section - 2/3 width (2 columns) */}
                    <div className="lg:col-span-2">
                      <EnhancedKPIGrid />
                    </div>
                    
                    {/* Right Section - 1/3 width (1 column) */}
                    <div className="lg:col-span-1">
                      <SalesTeamPerformance />
                    </div>
                  </div>
                </div>
                
                {/* Quick Double Claim Alerts Summary */}
                {alertCount > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle size={20} className="text-amber-600" />
                        <h3 className="text-lg font-medium text-amber-800">
                          Priority Alerts: {alertCount} Double Claim{alertCount !== 1 ? 's' : ''} Detected
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab('alerts')}
                        className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 text-sm"
                      >
                        View All Alerts
                      </button>
                    </div>
                    <div className="mt-3">
                      <p className="text-amber-700 text-sm">
                        Recent claims table shows {doubleClaimAlerts?.slice(0, 3)?.map(alert => alert?.stockNumber)?.join(', ') || 'N/A'}
                        {alertCount > 3 && ` and ${alertCount - 3} more`} requiring immediate attention.
                      </p>
                    </div>
                  </div>
                )}

                {/* Recent Claims Table with Quick Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ManagerDashboardOverview showRecentClaims={true} />
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Quick Stats</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Today's Sales</span>
                          <span className="font-medium">12</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Pending Reviews</span>
                          <span className="font-medium text-amber-600">5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Team Performance</span>
                          <span className="font-medium text-green-600">95%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                <PerformanceGraphs />
              </div>
            )}

            {activeTab === 'profitability' && (
              <div className="space-y-6">
                <ProductProfitabilityAnalysis />
              </div>
            )}

            {activeTab === 'team' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Team Management</h2>
                <TeamMemberCards />
              </div>
            )}

            {activeTab === 'alerts' && (
              <div className="space-y-6">
                <DoubleClaimAlerts 
                  alerts={doubleClaimAlerts} 
                  onAlertsUpdate={(updatedAlerts) => {
                    setDoubleClaimAlerts(updatedAlerts || []);
                    setAlertCount(updatedAlerts?.length || 0);
                  }} 
                />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-6">
                <AdvancedAnalytics />
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Detailed Reports & Analytics</h2>
                  <TeamPerformanceCharts />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <AIDataAnalyst />
    </div>
  );
};

export default ManagerDashboard;
