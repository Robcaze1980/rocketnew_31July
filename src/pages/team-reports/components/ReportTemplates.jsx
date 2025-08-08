import React from 'react';
import Icon from '../../../components/AppIcon';

const ReportTemplates = () => {
  const reportTemplates = [
    {
      id: 'monthly_summary',
      name: 'Monthly Team Summary',
      description: 'Comprehensive overview of team performance, sales, and commissions for the selected month.',
      icon: 'Calendar',
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      metrics: ['Total Sales', 'Team Commissions', 'Individual Performance', 'Goal Achievement']
    },
    {
      id: 'quarterly_review',
      name: 'Quarterly Performance Review',
      description: 'Detailed quarterly analysis with trends, comparisons, and performance insights.',
      icon: 'TrendingUp',
      color: 'text-green-600 bg-green-50 border-green-200',
      metrics: ['Quarterly Trends', 'YoY Comparison', 'Top Performers', 'Growth Metrics']
    },
    {
      id: 'commission_audit',
      name: 'Commission Audit Report',
      description: 'Detailed breakdown of all commission calculations and payments for audit purposes.',
      icon: 'DollarSign',
      color: 'text-amber-600 bg-amber-50 border-amber-200',
      metrics: ['Commission Breakdown', 'Payment History', 'Adjustments', 'Validation']
    },
    {
      id: 'individual_evaluation',
      name: 'Individual Salesperson Evaluation',
      description: 'In-depth performance analysis for individual team members with actionable insights.',
      icon: 'User',
      color: 'text-purple-600 bg-purple-50 border-purple-200',
      metrics: ['Personal KPIs', 'Goal Progress', 'Skill Assessment', 'Development Areas']
    },
    {
      id: 'sales_funnel',
      name: 'Sales Funnel Analysis',
      description: 'Conversion rates and pipeline analysis to identify bottlenecks and opportunities.',
      icon: 'Funnel',
      color: 'text-teal-600 bg-teal-50 border-teal-200',
      metrics: ['Lead Conversion', 'Pipeline Health', 'Lost Opportunities', 'Win Rates']
    },
    {
      id: 'executive_summary',
      name: 'Executive Summary',
      description: 'High-level dashboard for executives with key metrics and strategic insights.',
      icon: 'BarChart3',
      color: 'text-red-600 bg-red-50 border-red-200',
      metrics: ['Revenue Overview', 'Strategic KPIs', 'Market Performance', 'Forecast']
    }
  ];

  const generateReport = (templateId) => {
    // In a real implementation, this would trigger report generation
    console.log(`Generating report: ${templateId}`);
  };

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Icon name="FileText" size={20} className="text-primary" />
          <h3 className="text-lg font-semibold text-foreground">Report Templates</h3>
        </div>
        <button className="text-sm text-primary hover:text-primary/80 font-medium">
          Create Custom Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTemplates.map((template) => (
          <div key={template.id} className={`border rounded-lg p-6 hover:shadow-md transition-all duration-200 ${template.color}`}>
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${template.color}`}>
                <Icon name={template.icon} size={20} />
              </div>
              <button
                onClick={() => generateReport(template.id)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name="Play" size={16} />
              </button>
            </div>

            <h4 className="text-lg font-semibold text-foreground mb-2">{template.name}</h4>
            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>

            <div className="space-y-2 mb-4">
              <h5 className="text-xs font-medium text-foreground uppercase tracking-wide">Includes:</h5>
              <div className="flex flex-wrap gap-1">
                {template.metrics.map((metric, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded-md"
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex space-x-2">
              <button
                onClick={() => generateReport(template.id)}
                className="flex-1 px-3 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md text-sm font-medium transition-colors"
              >
                Generate
              </button>
              <button className="px-3 py-2 bg-muted text-foreground hover:bg-muted/80 rounded-md text-sm font-medium transition-colors">
                Preview
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-semibold text-foreground">Recent Reports</h4>
          <button className="text-sm text-primary hover:text-primary/80 font-medium">
            View All
          </button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Monthly Team Summary - January 2025', date: '2 hours ago', size: '2.4 MB' },
            { name: 'Commission Audit Report - Q4 2024', date: '1 day ago', size: '1.8 MB' },
            { name: 'Individual Evaluation - John Doe', date: '3 days ago', size: '856 KB' }
          ].map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-md">
              <div className="flex items-center space-x-3">
                <Icon name="FileText" size={16} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">{report.name}</p>
                  <p className="text-xs text-muted-foreground">{report.date} • {report.size}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button className="text-sm text-primary hover:text-primary/80">Download</button>
                <button className="text-sm text-muted-foreground hover:text-foreground">
                  <Icon name="MoreHorizontal" size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReportTemplates;