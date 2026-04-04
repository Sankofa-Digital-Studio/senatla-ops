import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, ViewChild, inject, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DailyLog, Employee } from 'src/app/core/models/app.models';
import { StaffDataService } from 'src/app/core/services/staff-data.service';

@Component({
  selector: 'app-site-manager',
  templateUrl: './site-manager.component.html',
  styleUrls: ['./site-manager.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
})
export class SiteManagerComponent {
  service = inject(StaffDataService);
  @ViewChild('sigCanvas') sigCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('photoInput') photoInput!: ElementRef<HTMLInputElement>;

  selectedDate = new Date(this.service.currentTime());
  searchTerm = '';
  filterGroup: string | null = null;
  localSiteName = '';
  showGroupModal = false;
  newGroupName = '';
  reasonsList: Array<NonNullable<DailyLog['reason']>> = ['Sick', 'Family', 'AWOL', 'Confirm in Office'];

  selectedSafetyTopic: string | null = null;
  isManagingTopics = false;
  newTopicName = '';

  showSafetyDetailModal = false;
  tempSafetyDetails: any = {};

  showPhotoModal = false;
  photoTargetEmp: Employee | null = null;
  capturedPhoto: string | null = null;
  capturedLocationLabel = 'Location not captured yet.';
  locationWarning = '';

  showSignatureModal = false;
  showRolloverModal = false;
  rolloverAcknowledged = false;

  isDrawing = false;
  hasSigned = false;
  private ctx!: CanvasRenderingContext2D;
  readonly latestSyncRecord = computed(() => this.service.syncHistory()[0] || null);
  readonly recentAttendanceAudit = computed(() => this.service.attendanceAuditTrail().slice(0, 6));

  constructor() {
    this.localSiteName = this.service.siteName();
  }


  handleAttendanceToggle(emp: Employee) {
    if (this.isFuture || this.service.timeStatus() === 'blocked') return;

    const currentStatus = this.getLog(emp).status;
    if (currentStatus !== 'present') {
      this.photoTargetEmp = emp;
      this.capturedPhoto = null;
      this.capturedLocationLabel = 'Location not captured yet.';
      this.locationWarning = '';
      this.showPhotoModal = true;
      setTimeout(() => this.photoInput?.nativeElement?.click(), 50);
    } else {
      this.service.updateStatus(emp.id, this.selectedDateStr, 'absent');
    }
  }

  triggerPhotoInput() {
    this.photoInput?.nativeElement?.click();
  }

  async onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.capturedPhoto = await this.readAsDataUrl(file);
    await this.captureLocation();
  }

  async captureLocation() {
    if (!navigator.geolocation) {
      this.locationWarning = 'Browser geolocation is unavailable on this device.';
      this.capturedLocationLabel = 'Proceeding without GPS fix.';
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      this.capturedLocationLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      this.locationWarning = '';
    } catch {
      this.locationWarning = 'Location capture failed. Attendance can continue, but the log will show no GPS proof.';
      this.capturedLocationLabel = 'No GPS fix captured.';
    }
  }

  confirmAttendance() {
    if (!this.photoTargetEmp || !this.capturedPhoto) {
      return;
    }

    const evidence = { photoDataUrl: this.capturedPhoto, capturedAt: new Date(this.service.currentTime()), location: this.parseLocation() };
    this.service.updateStatus(this.photoTargetEmp.id, this.selectedDateStr, 'present', evidence);
    this.closePhotoModal();
  }

  closePhotoModal() {
    this.showPhotoModal = false;
    this.photoTargetEmp = null;
    this.capturedPhoto = null;
    this.capturedLocationLabel = 'Location not captured yet.';
    this.locationWarning = '';
    if (this.photoInput?.nativeElement) {
      this.photoInput.nativeElement.value = '';
    }
  }

  confirmSafetyTalk() {
    if (this.selectedSafetyTopic) {
      this.service.completeSafetyTalk(this.selectedSafetyTopic);
    }
  }

  openSafetyDetailModal() {
    const current = this.service.currentSafetyTalk();
    this.tempSafetyDetails = current
      ? { ...current }
      : { topic: this.service.currentSafetyTopic(), date: new Date(this.service.currentTime()), notes: '' };
    this.showSafetyDetailModal = true;
  }

  saveSafetyDetails() {
    if (this.tempSafetyDetails.id) {
      this.service.updateSafetyTalkDetails(
        this.tempSafetyDetails.id,
        this.tempSafetyDetails.notes,
        this.tempSafetyDetails.photoUrl
      );
    }
    this.showSafetyDetailModal = false;
  }

  toggleManageTopics() { this.isManagingTopics = !this.isManagingTopics; this.newTopicName = ''; }
  addTopic() { if (this.newTopicName) { this.service.addSafetyTopic(this.newTopicName); this.newTopicName = ''; } }
  deleteTopic(topic: string) { if (confirm(`Remove "${topic}"?`)) { this.service.removeSafetyTopic(topic); if (this.selectedSafetyTopic === topic) this.selectedSafetyTopic = null; } }

  setupCanvas() {
    if (!this.sigCanvas) return;
    const canvas = this.sigCanvas.nativeElement;
    const container = this.canvasContainer.nativeElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    this.ctx = canvas.getContext('2d')!;
    this.ctx.lineWidth = 3;
    this.ctx.lineCap = 'round';
    this.ctx.strokeStyle = '#000';
  }

  startDrawing(e: MouseEvent | TouchEvent) {
    this.isDrawing = true; this.hasSigned = true;
    const pos = this.getPos(e);
    this.ctx.beginPath(); this.ctx.moveTo(pos.x, pos.y); e.preventDefault();
  }

  draw(e: MouseEvent | TouchEvent) {
    if (!this.isDrawing) return;
    const pos = this.getPos(e);
    this.ctx.lineTo(pos.x, pos.y); this.ctx.stroke(); e.preventDefault();
  }

  stopDrawing() { this.isDrawing = false; }
  clearSignature() { if (!this.ctx) return; this.ctx.clearRect(0, 0, this.sigCanvas.nativeElement.width, this.sigCanvas.nativeElement.height); this.hasSigned = false; }
  getPos(e: MouseEvent | TouchEvent) { const canvas = this.sigCanvas.nativeElement; const rect = canvas.getBoundingClientRect(); const clientX = (e instanceof MouseEvent) ? e.clientX : e.touches[0].clientX; const clientY = (e instanceof MouseEvent) ? e.clientY : e.touches[0].clientY; return { x: clientX - rect.left, y: clientY - rect.top }; }

  get selectedDateStr() { return this.toDateKey(this.selectedDate); }
  get isFuture() { return this.selectedDateStr > this.toDateKey(this.service.currentTime()); }
  get isFutureLimit() { return false; }
  getLog(emp: Employee): DailyLog { return emp.logs[this.selectedDateStr] || { date: this.selectedDateStr, status: 'pending' }; }
  getGroupName(id: string) { return this.service.groups().find(g => g.id === id)?.name || 'Unknown'; }

  filteredEmployees() {
    return this.service.employees().filter(e => {
      const matchesSearch = e.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) || e.surname.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesGroup = this.filterGroup ? e.groupId === this.filterGroup : true;
      return matchesSearch && matchesGroup;
    });
  }

  changeDate(days: number) {
    const newDate = new Date(this.selectedDate);
    newDate.setDate(this.selectedDate.getDate() + days);
    this.selectedDate = newDate;
  }

  updateComment(empId: string, event: any) { this.service.updateComment(empId, this.selectedDateStr, event.target.value); }
  updateSiteName() { this.service.setSiteName(this.localSiteName); }
  createGroup() { if (this.newGroupName) { this.service.addGroup(this.newGroupName); this.newGroupName = ''; this.showGroupModal = false; } }

  toggleGroupSelect(emp: Employee) {
    if (this.filterGroup && !emp.groupId) this.service.assignGroup(emp.id, this.filterGroup);
    else if (emp.groupId) this.service.assignGroup(emp.id, undefined);
  }

  handleSync() {
    const status = this.service.timeStatus();
    if (status === 'late_window' || status === 'critical_late') {
      this.showRolloverModal = true;
    } else {
      this.openSignatureModal();
    }
  }

  continueLateSync() {
    if (!this.rolloverAcknowledged) {
      return;
    }
    this.showRolloverModal = false;
    this.openSignatureModal();
  }

  openSignatureModal() {
    this.showSignatureModal = true;
    setTimeout(() => this.setupCanvas(), 100);
  }

  submitSyncWithSignature() {
    const sig = this.sigCanvas.nativeElement.toDataURL();
    this.service.performSync(sig, this.rolloverAcknowledged);
    this.showSignatureModal = false;
    this.rolloverAcknowledged = false;
  }

  private parseLocation() {
    if (this.capturedLocationLabel.includes(',')) {
      const [latitude, longitude] = this.capturedLocationLabel.split(',').map((value) => Number(value.trim()));
      if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
        return { latitude, longitude };
      }
    }
    return null;
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  private toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

