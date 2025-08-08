import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const BulkActionsToolbar = ({ selectedCount, onBulkAction, onClearSelection }) => {
  return (
    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} className="text-primary" />
            <span className="text-sm font-medium text-foreground">
              {selectedCount} sale{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('export')}
              iconName="Download"
              iconPosition="left"
            >
              Export Selected
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('updateStatus')}
              iconName="Edit"
              iconPosition="left"
            >
              Update Status
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onBulkAction('adjustCommission')}
              iconName="DollarSign"
              iconPosition="left"
            >
              Adjust Commission
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          iconName="X"
          iconPosition="left"
        >
          Clear Selection
        </Button>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;