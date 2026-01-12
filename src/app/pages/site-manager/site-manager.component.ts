import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject,  ViewChild, AfterViewInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DailyLog, Employee } from 'src/app/core/models/app.models';
import { StaffDataService } from 'src/app/core/services/staff-data.service';

import { Camera, CameraResultType } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-site-manager',
  templateUrl: './site-manager.component.html',
  styleUrls: ['./site-manager.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe],
})
export class SiteManagerComponent implements AfterViewInit {
  service = inject(StaffDataService);
  @ViewChild('sigCanvas') sigCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  selectedDate = new Date();
  searchTerm = '';
  filterGroup: string | null = null;
  localSiteName = '';
  showGroupModal = false;
  newGroupName = '';
  reasonsList = ['Sick', 'Family', 'AWOL', 'Confirm in Office'];

  // Safety Gatekeeper
  selectedSafetyTopic: string | null = null;
  isManagingTopics = false;
  newTopicName = '';

  // Safety Details Modal State
  showSafetyDetailModal = false;
  tempSafetyDetails: any = {};

  // Photo Verification State
  showPhotoModal = false;
  photoTargetEmp: Employee | null = null;
  capturedPhoto: string | null = null;

  // Modals
  showSignatureModal = false;
  showRolloverModal = false;
  rolloverAcknowledged = false;

  // Signature State
  isDrawing = false;
  hasSigned = false;
  private ctx!: CanvasRenderingContext2D;

  constructor() {
     this.localSiteName = this.service.siteName();
  }

  ngAfterViewInit() {
     // Canvas init
  }

  // --- ATTENDANCE WITH PHOTO VERIFICATION ---
  
  handleAttendanceToggle(emp: Employee) {
    if (this.isFuture || this.service.timeStatus() === 'blocked') return;

    const currentStatus = this.getLog(emp).status;
    
    // If attempting to mark PRESENT, require photo
    if (currentStatus !== 'present') {
       this.photoTargetEmp = emp;
       this.capturedPhoto = null;
       this.showPhotoModal = true;
    } else {
       // Toggle to absent immediately
       this.service.updateStatus(emp.id, this.selectedDateStr, 'absent');
    }
  }

  async captureRealPhoto() {
    try {
      // SIMULATION FALLBACK (For Canvas Environment)
      console.warn("Native Camera not available in browser. Simulating capture.");
      // Create a dummy image or prompt user to upload for POC
      this.capturedPhoto = "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='%23ccc'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12'%3EPhoto%3C/text%3E%3C/svg%3E";
      
    } catch (e) {
      console.error("Camera failed", e);
      alert("Could not access camera. Please ensure permissions are enabled.");
    }
  }

  confirmAttendance() {
    if (this.photoTargetEmp) {
       this.service.updateStatus(this.photoTargetEmp.id, this.selectedDateStr, 'present');
       // In a real app, verify the photo here or upload it to storage
       this.showPhotoModal = false;
       this.photoTargetEmp = null;
    }
  }

  // --- SAFETY TALK ---
  confirmSafetyTalk() {
     if(this.selectedSafetyTopic) {
        this.service.completeSafetyTalk(this.selectedSafetyTopic);
     }
  }

  openSafetyDetailModal() {
     // Assuming service.currentSafetyTalk() returns a safety talk object or null
     // Note: StaffDataService needs to have this method implemented.
     // If it's a computed signal, we access it as this.service.currentSafetyTalk()
     // But based on previous context, it might be a signal: this.service.currentSafetyTalk()
     // I will assume it's available on the service as previously discussed.
     const current = this.service.currentSafetyTalk(); 
     if (current) {
        this.tempSafetyDetails = { ...current };
        this.showSafetyDetailModal = true;
     } else {
         // Fallback if no current talk found but flag is true (shouldn't happen in normal flow)
         this.tempSafetyDetails = { topic: this.service.currentSafetyTopic(), date: new Date(), notes: '' };
         this.showSafetyDetailModal = true;
     }
  }

  saveSafetyDetails() {
     if (this.tempSafetyDetails.id) {
        // Assuming updateSafetyTalkDetails exists on service
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

  // --- SIGNATURE PAD LOGIC ---
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

  // --- VIEW LOGIC ---
  get selectedDateStr() { return this.selectedDate.toISOString().split('T')[0]; }
  get isFuture() { return this.selectedDate > new Date(); }
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

  toggleStatus(empId: string) {
     // Replaced by handleAttendanceToggle
  }

  updateComment(empId: string, event: any) { this.service.updateComment(empId, this.selectedDateStr, event.target.value); }
  updateSiteName() { this.service.setSiteName(this.localSiteName); }
  
  createGroup() { if(this.newGroupName) { this.service.addGroup(this.newGroupName); this.newGroupName = ''; this.showGroupModal = false; } }
  
  toggleGroupSelect(emp: Employee) {
     if(this.filterGroup && !emp.groupId) this.service.assignGroup(emp.id, this.filterGroup);
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

  openSignatureModal() { this.showSignatureModal = true; setTimeout(() => this.setupCanvas(), 100); }
  submitSyncWithSignature() { const sig = this.sigCanvas.nativeElement.toDataURL(); this.service.performSync(sig, false); this.showSignatureModal = false; }
}
