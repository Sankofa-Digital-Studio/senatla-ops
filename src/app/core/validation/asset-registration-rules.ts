import { VehicleAsset } from '../models/app.models';

export interface AssetRegistrationValidationResult {
  readonly isValid: boolean;
  readonly canComplete: boolean;
  readonly identifierProvided: boolean;
  readonly missingFields: string[];
  readonly messages: string[];
  readonly blocker: string;
}

const REQUIRED_FIELDS: Array<{ key: keyof VehicleAsset; label: string }> = [
  { key: 'make', label: 'Make' },
  { key: 'model', label: 'Model' },
  { key: 'assetClass', label: 'Asset class' },
  { key: 'custodianName', label: 'Custodian' },
  { key: 'type', label: 'Operating category' },
  { key: 'status', label: 'Status' },
  { key: 'lifecycleState', label: 'Lifecycle' },
  { key: 'licenseExpiry', label: 'Compliance / licence date' },
  { key: 'assignedSiteId', label: 'Assigned site' },
];

export function hasAssetRegistrationText(value: unknown) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value);
}

export function validateAssetRegistration(asset: VehicleAsset, detailsVerified = false): AssetRegistrationValidationResult {
  const identifierProvided = hasAssetRegistrationText(asset.registrationNumber)
    || hasAssetRegistrationText(asset.serialNumber)
    || hasAssetRegistrationText(asset.vin);
  const missingFields = REQUIRED_FIELDS
    .filter((field) => !hasAssetRegistrationText(asset[field.key]))
    .map((field) => field.label);

  if (!identifierProvided) missingFields.unshift('One identifier: number plate, VIN or serial number');

  const messages = missingFields.map((field) => field + ' is required.');
  if (!detailsVerified && missingFields.length === 0) {
    messages.push('Captured image and asset details must be verified before save.');
  }

  return {
    isValid: missingFields.length === 0,
    canComplete: missingFields.length === 0 && detailsVerified,
    identifierProvided,
    missingFields,
    messages,
    blocker: messages[0] || '',
  };
}
