import React from 'react';
import Button from '../../../components/ui/Button';

const ActionButtons = ({ 
  onSave, 
  onDelete,
  onCancel, 
  hasChanges, 
  saving = false,
  deleting = false
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            onClick={onSave}
            disabled={!hasChanges || saving || deleting}
            loading={saving}
            iconName="Save"
            iconPosition="left"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
          
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={saving || deleting}
          >
            Cancel
          </Button>
        </div>

        <Button
          variant="destructive"
          onClick={onDelete}
          disabled={saving || deleting}
          loading={deleting}
          iconName="Trash2"
          iconPosition="left"
        >
          {deleting ? 'Deleting...' : 'Delete Sale'}
        </Button>
      </div>

      {hasChanges && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            You have unsaved changes. Make sure to save before leaving this page.
          </p>
        </div>
      )}
    </div>
  );
};

export default ActionButtons;