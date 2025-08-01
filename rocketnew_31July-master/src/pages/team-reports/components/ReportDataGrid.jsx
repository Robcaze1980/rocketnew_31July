import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import teamReportsService from '../../../utils/teamReportsService';
import Icon from '../../../components/AppIcon';

const ReportDataGrid = ({ filters }) => {
  const { userProfile } = useAuth();
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!userProfile?.id) return;

      try {
        setLoading(true);
        setError(null);

        const result = await teamReportsService.getTeamPerformanceReport(userProfile.id, filters);

        if (result.success) {
          setReportData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError('Failed to load team performance data');
        console.log('Report data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [userProfile?.id, filters]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...reportData].sort((a, b) => {
      if (a[key] < b[key]) return direction === 'asc' ? -1 : 1;
      if (a[key] > b[key]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setReportData(sortedData);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? 'ChevronUp' : 'ChevronDown';
    }
    return 'ChevronsUpDown';
  };

  const exportData = async (format) => {
    try {
      setError(null);
      const result = await teamReportsService.exportReportData(reportData, format);
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError(`Failed to export ${format.toUpperCase()} file`);
      console.log('Export error:', err);
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = reportData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(reportData.length / itemsPerPage);

  const columns = [
    { key: 'salesperson', label: 'Salesperson', width: 'w-40' },
    { key: 'totalSales', label: 'Sales Count', width: 'w-24', align: 'text-center' },
    { key: 'totalCommission', label: 'Total Commission', width: 'w-32', align: 'text-right', format: 'currency' },
    { key: 'saleCommission', label: 'Sale Comm.', width: 'w-28', align: 'text-right', format: 'currency' },
    { key: 'accessoriesCommission', label: 'Acc. Comm.', width: 'w-28', align: 'text-right', format: 'currency' },
    { key: 'warrantyCommission', label: 'War. Comm.', width: 'w-28', align: 'text-right', format: 'currency' },
    { key: 'serviceCommission', label: 'Svc. Comm.', width: 'w-28', align: 'text-right', format: 'currency' },
    { key: 'spiffBonus', label: 'SPIFF', width: 'w-24', align: 'text-right', format: 'currency' },
    { key: 'conversionRate', label: 'Conv. Rate', width: 'w-26', align: 'text-center', format: 'percentage' },
    { key: 'avgSalePrice', label: 'Avg Sale', width: 'w-28', align: 'text-right', format: 'currency' },
    { key: 'goalAchievement', label: 'Goal %', width: 'w-24', align: 'text-center', format: 'percentage' }
  ];

  const formatValue = (value, format) => {
    switch (format) {
      case 'currency':
        return `$${value.toLocaleString()}`;
      case 'percentage':
        return `${value}%`;
      default:
        return value;
    }
  };

  if (loading) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 bg-muted rounded w-32 animate-pulse"></div>
          <div className="flex space-x-2">
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-muted rounded animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card p-6 rounded-lg border border-red-200 bg-red-50">
        <div className="flex items-center space-x-3">
          <Icon name="AlertCircle" size={20} className="text-red-600" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Failed to load report data</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (reportData.length === 0) {
    return (
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="text-center py-8">
          <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No team data available</h3>
          <p className="text-muted-foreground">
            No team members found matching the current filters, or no sales data available for the selected period.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon name="Table" size={20} className="text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Performance Data Grid</h3>
            <span className="text-sm text-muted-foreground">({reportData.length} team members)</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportData('excel')}
              className="flex items-center space-x-2 px-3 py-2 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-sm font-medium transition-colors"
            >
              <Icon name="FileSpreadsheet" size={16} />
              <span>Excel</span>
            </button>
            <button
              onClick={() => exportData('csv')}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
            >
              <Icon name="FileText" size={16} />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportData('pdf')}
              className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-700 hover:bg-red-100 rounded-md text-sm font-medium transition-colors"
            >
              <Icon name="FileText" size={16} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`${column.width} px-4 py-3 ${column.align || 'text-left'} text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors`}
                  onClick={() => handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    <Icon name={getSortIcon(column.key)} size={14} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((row, index) => (
              <tr key={row.id} className={`border-b border-border hover:bg-muted/30 transition-colors ${index % 2 === 0 ? 'bg-muted/10' : ''}`}>
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 text-sm ${column.align || 'text-left'}`}>
                    <span className={column.key === 'goalAchievement' && row[column.key] > 100 ? 'text-green-600 font-semibold' : 'text-foreground'}>
                      {formatValue(row[column.key], column.format)}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, reportData.length)} of {reportData.length} results
            </p>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDataGrid;