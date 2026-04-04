import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { VehicleAsset } from '../../core/models/app.models';

@Component({
  selector: 'app-asset-register',
  templateUrl: './asset-register.component.html',
  styleUrls: ['./asset-register.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class AssetRegisterComponent {
  vehicles = signal<VehicleAsset[]>([
    {
      id: '1',
      registrationNumber: 'HDW 492 GP',
      vin: 'WBWA8208082N92',
      make: 'CAT',
      model: 'D8 Dozer',
      type: 'Yellow Metal',
      licenseExpiry: '2026-05-30',
      status: 'Active',
    },
    {
      id: '2',
      registrationNumber: 'KJS 299 FS',
      vin: 'JTEBU248292020',
      make: 'Toyota',
      model: 'Hilux',
      type: 'Light Vehicle',
      licenseExpiry: '2024-12-15',
      status: 'Expired',
    },
  ]);

  showScanModal = false;
  isFormPopulated = false;
  saveError = '';

  tempVehicle: Partial<VehicleAsset> = {};

  totalVehicles = computed(() => this.vehicles().length);
  activeVehicles = computed(() =>
    this.vehicles().filter((vehicle) => vehicle.status === 'Active').length,
  );
  expiredVehicles = computed(() =>
    this.vehicles().filter((vehicle) => this.isExpired(vehicle.licenseExpiry)).length,
  );

  openScanModal() {
    this.showScanModal = true;
    this.isFormPopulated = false;
    this.tempVehicle = {};
    this.saveError = '';
  }

  simulateScan() {
    setTimeout(() => {
      this.tempVehicle = {
        registrationNumber: 'BBC 999 NW',
        vin: 'AHH28282828111',
        make: 'Mercedes',
        model: 'Actros',
        type: 'Heavy Duty',
        licenseExpiry: '2026-11-30',
        status: 'Active',
      };
      this.isFormPopulated = true;
      this.saveError = '';
    }, 1500);
  }

  manualEntry() {
    this.tempVehicle = { status: 'Active', type: 'Heavy Duty' };
    this.isFormPopulated = true;
    this.saveError = '';
  }

  saveVehicle() {
    const registrationNumber = this.cleanText(this.tempVehicle.registrationNumber).toUpperCase();
    const vin = this.cleanText(this.tempVehicle.vin).toUpperCase();
    const make = this.cleanText(this.tempVehicle.make);
    const model = this.cleanText(this.tempVehicle.model);
    const licenseExpiry = this.cleanText(this.tempVehicle.licenseExpiry);
    const type = this.tempVehicle.type;

    if (!registrationNumber || !vin || !make || !model || !licenseExpiry || !type) {
      this.saveError = 'Registration, VIN, make, model, expiry date, and type are required.';
      return;
    }

    if (!this.isValidExpiry(licenseExpiry)) {
      this.saveError = 'Enter a valid license expiry date.';
      return;
    }

    const duplicate = this.vehicles().some(
      (vehicle) => vehicle.registrationNumber?.toUpperCase() === registrationNumber,
    );
    if (duplicate) {
      this.saveError = 'That registration number is already in the register.';
      return;
    }

    const status: VehicleAsset['status'] = this.isExpired(licenseExpiry)
      ? 'Expired'
      : this.tempVehicle.status || 'Active';

    this.vehicles.update((vehicles) => [
      ...vehicles,
      {
        id: Date.now().toString(),
        registrationNumber,
        vin,
        make,
        model,
        type,
        licenseExpiry,
        status,
      },
    ]);
    this.showScanModal = false;
    this.saveError = '';
  }

  getIcon(type: string) {
    if (type === 'Heavy Duty') return '🚛';
    if (type === 'Yellow Metal') return '🚜';
    return '🚗';
  }

  isExpired(dateStr: string) {
    return this.isValidExpiry(dateStr) && new Date(`${dateStr}T00:00:00`) < new Date();
  }

  private cleanText(value: unknown) {
    return typeof value === 'string' ? value.trim() : '';
  }

  private isValidExpiry(dateStr: string) {
    const parsed = new Date(`${dateStr}T00:00:00`);
    return !Number.isNaN(parsed.getTime());
  }
}
