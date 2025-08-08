import React, { useState, useEffect } from 'react';
import Select from '../../../components/ui/Select';
import { Checkbox } from '../../../components/ui/Checkbox';
import Icon from '../../../components/AppIcon';
import salesService from '../../../utils/salesService';
import { useAuth } from '../../../contexts/AuthContext';

const SharedSaleSection = ({ sharedSale, onSharedSaleChange, error }) => {
  const { user } = useAuth();
  const [salesPartners, setSalesPartners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Fetch salespeople from database
  useEffect(() => {
    const fetchSalespeople = async () => {
      try {
        setLoadError(null);
        setLoading(true);

        // Prefer reliable AuthContext user id for exclusion
        const currentUserId = user?.id || undefined;

        const result = await salesService?.getSalespeople(currentUserId);
        if (result?.success) {
          const partners = (result?.data || [])?.map((u) => ({
            id: u?.id,
            value: u?.id,
            label: `${u?.full_name} - ${u?.email}`,
          }));
          setSalesPartners(partners);
          if (!partners?.length) {
            setLoadError('No members available to select. Ask your admin to add team members with role "member".');
          }
        } else {
          console.error('Failed to fetch salespeople:', result?.error);
          setLoadError(result?.error || 'Failed to fetch salespeople');
        }
      } catch (error) {
        console.error('Error fetching salespeople:', error);
        setLoadError('Error fetching salespeople');
      } finally {
        setLoading(false);
      }
    };

    fetchSalespeople();
  }, [user?.id]);

  // Only allow 50/50 split (hide other options)
  const splitOptions = [
    { value: '50-50', label: '50% - 50% (Equal Split)' }
  ];

  const handleSharedSaleToggle = (checked) => {
    onSharedSaleChange?.({
      ...sharedSale,
      isShared: checked,
      partnerId: checked ? sharedSale?.partnerId : null,
      // Hard enforce 50% when shared is enabled
      splitPercentage: checked ? 50 : 50
    });
  };

  const handlePartnerChange = (value) => {
    onSharedSaleChange?.({
      ...sharedSale,
      partnerId: value
    });
  };

  const handleSplitChange = (value) => {
    const yourPercentage = parseInt(value?.split('-')?.[0]);
    onSharedSaleChange?.({
      ...sharedSale,
      splitPercentage: yourPercentage
    });
  };

  const getPartnerPercentage = () => {
    return sharedSale?.splitPercentage ? 100 - sharedSale?.splitPercentage : 0;
  };

  // Convert splitPercentage to split string format for Select component
  const getSplitValue = () => {
    if (sharedSale?.splitPercentage) {
      const partnerPercentage = 100 - sharedSale?.splitPercentage;
      return `${sharedSale?.splitPercentage}-${partnerPercentage}`;
    }
    return '';
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <Icon name="Users" size={20} className="text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Shared Sale</h3>
      </div>
      <div className="space-y-6">
        <Checkbox
          label="This is a shared sale"
          description="Check if you're splitting commission with another salesperson"
          checked={sharedSale?.isShared || false}
          onChange={(e) => handleSharedSaleToggle(e?.target?.checked)}
        />

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        {sharedSale?.isShared && (
          <div className="space-y-6 pl-6 border-l-2 border-primary/20">
            <Select
              label="Sales Partner"
              placeholder={
                loading
                  ? "Loading salespeople..."
                  : loadError
                  ? "Unable to load members"
                  : "Select your sales partner"
              }
              options={salesPartners}
              value={sharedSale?.partnerId || ''}
              onChange={handlePartnerChange}
              required
              searchable
              disabled={loading || !!loadError}
            />
            {loadError && (
              <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2 text-sm">
                {loadError}
              </div>
            )}

            <Select
              label="Commission Split"
              placeholder="50% - 50% (Equal Split)"
              options={splitOptions}
              value={getSplitValue()}
              // Disable changes since only 50/50 is allowed
              onChange={() => {}}
              required
              disabled
              description="Split is fixed at 50% - 50%"
            />

            {sharedSale?.splitPercentage && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Icon name="Calculator" size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Commission Split Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon name="User" size={14} className="text-blue-600" />
                      <span className="font-medium text-blue-800">Your Share</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{sharedSale?.splitPercentage}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <Icon name="UserCheck" size={14} className="text-blue-600" />
                      <span className="font-medium text-blue-800">Partner Share</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900">{getPartnerPercentage()}%</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-blue-700">
                  <p>• Commission will be automatically calculated based on this split</p>
                  <p>• Both parties will receive separate commission records</p>
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <Icon name="AlertTriangle" size={16} className="text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Important Notes</p>
                  <ul className="space-y-1 text-amber-700">
                    <li>• Your partner will be notified about this shared sale</li>
                    <li>• Both parties must approve the commission split</li>
                    <li>• Changes to split ratio require manager approval</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SharedSaleSection;
