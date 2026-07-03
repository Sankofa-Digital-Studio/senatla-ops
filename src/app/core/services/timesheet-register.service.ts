import { Injectable } from '@angular/core';
import { Employee, Site } from '../models/app.models';
import { TimesheetRegisterRow, TimesheetRegisterSummary } from '../models/timesheet.models';

@Injectable({ providedIn: 'root' })
export class TimesheetRegisterService {
  buildRows(employees: Employee[], sites: Site[], workDate: string): TimesheetRegisterRow[] {
    const siteNames = new Map(sites.map((site) => [site.id, site.name]));

    return employees
      .map((employee) => {
        const log = employee.logs[workDate];
        return {
          employeeId: employee.id,
          employeeName: `${employee.surname}, ${employee.firstName}`,
          employeeRole: employee.role,
          siteId: employee.siteId,
          siteName: siteNames.get(employee.siteId) || 'Unassigned site',
          workDate,
          status: log?.status || 'pending',
          reason: log?.reason || null,
          comment: log?.comment?.trim() || '',
          isFlagged: Boolean(log?.isFlagged),
          hasEvidence: Boolean(log?.evidence?.photoDataUrl),
          capturedAt: log?.evidence?.capturedAt ? new Date(log.evidence.capturedAt) : null,
        } satisfies TimesheetRegisterRow;
      })
      .sort((left, right) => left.employeeName.localeCompare(right.employeeName));
  }

  summarize(rows: TimesheetRegisterRow[]): TimesheetRegisterSummary {
    const summary = rows.reduce(
      (result, row) => {
        result[row.status] += 1;
        if (row.isFlagged) result.flagged += 1;
        if (row.hasEvidence) result.evidence += 1;
        return result;
      },
      { present: 0, absent: 0, pending: 0, flagged: 0, evidence: 0 },
    );
    const completed = summary.present + summary.absent;

    return {
      total: rows.length,
      ...summary,
      completionPercent: rows.length ? Math.round((completed / rows.length) * 100) : 0,
    };
  }

  toCsv(rows: TimesheetRegisterRow[]): string {
    const header = ['Work date', 'Employee', 'Role', 'Site', 'Status', 'Reason', 'Comment', 'Flagged', 'Evidence'];
    const records = rows.map((row) => [
      row.workDate,
      row.employeeName,
      row.employeeRole,
      row.siteName,
      row.status,
      row.reason || '',
      row.comment,
      row.isFlagged ? 'Yes' : 'No',
      row.hasEvidence ? 'Yes' : 'No',
    ]);

    return [header, ...records].map((record) => record.map((value) => this.escapeCsv(value)).join(',')).join('\r\n');
  }

  toDateKey(value: Date): string {
    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private escapeCsv(value: string): string {
    return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }
}
