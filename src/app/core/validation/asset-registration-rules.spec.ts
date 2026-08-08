import { VehicleAsset } from '../models/app.models';
import { validateAssetRegistration } from './asset-registration-rules';

const completeAsset: VehicleAsset = {
  id: 'asset-1',
  organizationId: '00000000-0000-4000-8000-000000000001',
  registrationNumber: '',
  serialNumber: 'SER-001',
  vin: '',
  make: 'CAT',
  model: '320',
  type: 'Yellow Metal',
  assetClass: 'Excavator',
  custodianName: 'Site Team',
  licenseExpiry: '2030-01-31',
  status: 'Active',
  lifecycleState: 'active',
  assignedSiteId: 'site-1',
};

describe('asset registration rules', () => {
  it('requires one identifier and all operational fields', () => {
    const result = validateAssetRegistration({ ...completeAsset, serialNumber: '', make: '', assignedSiteId: undefined });

    expect(result.isValid).toBeFalse();
    expect(result.identifierProvided).toBeFalse();
    expect(result.missingFields).toContain('One identifier: number plate, VIN or serial number');
    expect(result.missingFields).toContain('Make');
    expect(result.missingFields).toContain('Assigned site');
  });

  it('separates complete details from verified completion', () => {
    const ready = validateAssetRegistration(completeAsset);
    const verified = validateAssetRegistration(completeAsset, true);

    expect(ready.isValid).toBeTrue();
    expect(ready.canComplete).toBeFalse();
    expect(ready.messages).toContain('Captured image and asset details must be verified before save.');
    expect(verified.canComplete).toBeTrue();
    expect(verified.messages).toEqual([]);
  });
});
