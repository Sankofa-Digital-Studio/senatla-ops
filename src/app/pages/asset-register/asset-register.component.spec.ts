import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { resetTestStorage, TEST_APP_PROVIDERS } from '../../test-providers';
import { AuthService } from '../../core/services/auth.service';
import { AssetRegisterComponent } from './asset-register.component';

describe('AssetRegisterComponent', () => {
  let component: AssetRegisterComponent;
  let fixture: ComponentFixture<AssetRegisterComponent>;

  beforeEach(waitForAsync(async () => {
    resetTestStorage();
    await TestBed.configureTestingModule({
      imports: [AssetRegisterComponent],
      providers: TEST_APP_PROVIDERS,
    }).compileComponents();

    await TestBed.inject(AuthService).login('office.admin', 'SenatlaDemo!');
    fixture = TestBed.createComponent(AssetRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the seeded demo assets and supports serial-only identity', async () => {
    await TestBed.inject(AuthService).login('office.admin', 'SenatlaDemo!');
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.service.assets().some((asset) => asset.serialNumber === 'CAT-320-EX-0042')).toBeTrue();
    const serialOnly = component.service.assets().find((asset) => asset.id === 'demo-excavator');
    expect(serialOnly?.vin).toBeUndefined();
    expect(component.assetIdentifier(serialOnly!)).toBe('CAT-320-EX-0042');
  });

  it('separates engineering assets from fleet and general equipment without changing ownership', () => {
    const excavator = component.service.assets().find((asset) => asset.id === 'demo-excavator')!;
    const bakkie = component.service.assets().find((asset) => asset.id === 'demo-bakkie')!;
    const generator = component.service.assets().find((asset) => asset.id === 'demo-generator')!;

    expect(component.assetWorkspace(excavator)).toBe('engineering');
    expect(component.assetWorkspace(bakkie)).toBe('fleet');
    expect(component.assetWorkspace(generator)).toBe('fleet');
    expect(generator.organizationId).toBe(excavator.organizationId);
  });

  it('derives explainable readiness from operational records', () => {
    const excavator = component.service.assets().find((asset) => asset.id === 'demo-excavator')!;
    const compressor = component.service.assets().find((asset) => asset.id === 'demo-compressor')!;
    const loader = component.service.assets().find((asset) => asset.id === 'demo-loader')!;

    expect(component.assetReadiness(excavator)).toBe('attention');
    expect(component.assetReadiness(compressor)).toBe('blocked');
    expect(component.assetReadiness(loader)).toBe('ready');
  });

  it('creates and persists an incomplete registration owned by the signed-in user', async () => {
    component.openRegister();
    component.assetForm.make = 'Toyota';
    component.assetForm.model = '';

    await component.saveRegistrationDraft();

    const draft = component.activeDraft();
    expect(draft).toBeTruthy();
    expect(draft?.ownerName).toBe('Office Admin');
    expect(draft?.state).toBe('draft');
    expect(component.registration.activeDrafts().some((entry) => entry.id === draft?.id)).toBeTrue();
  });

  it('builds renewal and 30-day grace reminder milestones at 7, 5, 3 and 1 days', () => {
    const asset = {
      ...component.service.assets().find((entry) => entry.id === 'demo-bakkie')!,
      licenseExpiry: '2030-06-30',
    };

    const milestones = component.registration.reminderMilestones(asset);

    expect(milestones.length).toBe(10);
    expect(milestones[0].scheduledAt.getDate()).toBe(23);
    expect(milestones.filter((item) => item.phase === 'expiry').length).toBe(4);
    expect(milestones.filter((item) => item.phase === 'grace').length).toBe(6);
    expect(milestones[milestones.length - 1].scheduledAt.getTime() - new Date(2030, 5, 30, 9).getTime()).toBe(30 * 24 * 60 * 60 * 1000);
  });
});
