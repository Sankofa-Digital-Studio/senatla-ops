import { CommonModule, DatePipe } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DailyLog, Employee } from 'src/app/core/models/app.models';
import { StaffDataService } from 'src/app/core/services/staff-data.service';

@Component({
  selector: 'app-site-manager',
  templateUrl: './site-manager.component.html',
  styleUrls: ['./site-manager.component.scss'],
  imports: [CommonModule, FormsModule, DatePipe],
})
export class SiteManagerComponent  {
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

  selectedSafetyTopic: string | null = null;
  
  isManagingTopics = false;
  newTopicName = '';
  editingTopicIndex: number | null = null;
  editedTopicName = '';

  showSignatureModal = false;
  showRolloverModal = false;
  rolloverAcknowledged = false;

  isDrawing = false;
  hasSigned = false;
  private ctx!: CanvasRenderingContext2D;

  constructor() {
     this.localSiteName = this.service.siteName();
     const timeStatus = this.service.timeStatus();
     if ((timeStatus === 'late_window' || timeStatus === 'critical_late') && this.service.unsyncedChanges()) {
        this.showRolloverModal = true;
     }
  }

  ngAfterViewInit() {
     // Canvas init handled when modal opens
  }

  confirmSafetyTalk() {
     if(this.selectedSafetyTopic) {
        this.service.completeSafetyTalk(this.selectedSafetyTopic);
     }
  }

  toggleManageTopics() {
    this.isManagingTopics = !this.isManagingTopics;
    this.newTopicName = '';
    this.editingTopicIndex = null;
  }

  addTopic() {
    if (this.newTopicName) {
      this.service.addSafetyTopic(this.newTopicName);
      this.newTopicName = '';
    }
  }

  deleteTopic(topic: string) {
    if (confirm(`Remove "${topic}" from the list?`)) {
      this.service.removeSafetyTopic(topic);
      if (this.selectedSafetyTopic === topic) {
         this.selectedSafetyTopic = null;
      }
    }
  }

  startEditingTopic(index: number, topic: string) {
    this.editingTopicIndex = index;
    this.editedTopicName = topic;
  }

  saveEditedTopic(oldTopic: string) {
    if (this.editedTopicName) {
      this.service.updateSafetyTopic(oldTopic, this.editedTopicName);
      if (this.selectedSafetyTopic === oldTopic) {
         this.selectedSafetyTopic = this.editedTopicName;
      }
      this.editingTopicIndex = null;
    }
  }

  cancelEdit() {
    this.editingTopicIndex = null;
    this.editedTopicName = '';
  }

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
     this.isDrawing = true;
     this.hasSigned = true; 
     const pos = this.getPos(e);
     this.ctx.beginPath();
     this.ctx.moveTo(pos.x, pos.y);
     e.preventDefault();
  }

  draw(e: MouseEvent | TouchEvent) {
     if (!this.isDrawing) return;
     const pos = this.getPos(e);
     this.ctx.lineTo(pos.x, pos.y);
     this.ctx.stroke();
     e.preventDefault();
  }

  stopDrawing() {
     this.isDrawing = false;
  }

  clearSignature() {
     if (!this.ctx) return;
     this.ctx.clearRect(0, 0, this.sigCanvas.nativeElement.width, this.sigCanvas.nativeElement.height);
     this.hasSigned = false;
  }

  getPos(e: MouseEvent | TouchEvent) {
     const canvas = this.sigCanvas.nativeElement;
     const rect = canvas.getBoundingClientRect();
     const clientX = (e instanceof MouseEvent) ? e.clientX : e.touches[0].clientX;
     const clientY = (e instanceof MouseEvent) ? e.clientY : e.touches[0].clientY;
     return {
        x: clientX - rect.left,
        y: clientY - rect.top
     };
  }

  getSignatureData(): string {
     return this.sigCanvas.nativeElement.toDataURL();
  }

  get selectedDateStr() { return this.selectedDate.toISOString().split('T')[0]; }
  get todayStr() { return new Date().toISOString().split('T')[0]; }
  get isFuture() { return this.selectedDateStr > this.todayStr; }
  get isFutureLimit() { return false; }
  getLog(emp: Employee): DailyLog { return emp.logs[this.selectedDateStr] || { date: this.selectedDateStr, status: 'pending' }; }
  getGroupName(id: string) { return this.service.groups().find(g => g.id === id)?.name || 'Unknown'; }
  
  filteredEmployees() {
     return this.service.employees().filter(e => {
        const matchesSearch = e.firstName.toLowerCase().includes(this.searchTerm.toLowerCase()) || e.role.toLowerCase().includes(this.searchTerm.toLowerCase());
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
     if (this.isFuture) return;
     const currentStatus = this.service.employees().find(e => e.id === empId)?.logs[this.selectedDateStr]?.status || 'pending';
     const newStatus = currentStatus === 'present' ? 'absent' : 'present';
     this.service.updateStatus(empId, this.selectedDateStr, newStatus);
  }

  updateComment(empId: string, event: any) { this.service.updateComment(empId, this.selectedDateStr, event.target.value); }
  updateSiteName() { this.service.setSiteName(this.localSiteName); }
  
  createGroup() {
     if(this.newGroupName) { this.service.addGroup(this.newGroupName); this.newGroupName = ''; this.showGroupModal = false; }
  }
  
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

  openSignatureModal() {
     this.showSignatureModal = true;
     setTimeout(() => this.setupCanvas(), 100);
  }

  submitSyncWithSignature() {
     const sig = this.getSignatureData();
     this.service.performSync(sig, false);
     this.showSignatureModal = false;
  }

  confirmRollover() {
     this.showRolloverModal = false;
     this.openSignatureModal();
  }
}
