import { Employee, Site } from '../models/app.models';
import { TimesheetRegisterService } from './timesheet-register.service';

describe('TimesheetRegisterService', () => {
  const service = new TimesheetRegisterService();
  const sites: Site[] = [{ id: 'site-1', name: 'Workshop', location: 'Yard', isActive: true }];
  const employees: Employee[] = [
    {
      id: 'employee-1',
      firstName: 'Anele',
      surname: 'Zulu',
      idNumber: '9001015009087',
      role: 'Operator',
      siteId: 'site-1',
      startDate: '2026-01-01',
      basicRate: 500,
      salaryAdvances: 0,
      financials: {},
      adjustments: {},
      logs: {
        '2026-06-27': {
          date: '2026-06-27',
          status: 'present',
          comment: 'Pump inspection, completed',
          isFlagged: true,
          evidence: { photoDataUrl: 'data:image/png;base64,proof', capturedAt: new Date('2026-06-27T06:30:00Z') },
        },
      },
    },
    {
      id: 'employee-2',
      firstName: 'Busi',
      surname: 'Mokoena',
      idNumber: '9101015009088',
      role: 'Driver',
      siteId: 'site-1',
      startDate: '2026-01-01',
      basicRate: 450,
      salaryAdvances: 0,
      financials: {},
      adjustments: {},
      logs: {},
    },
  ];

  it('projects employee logs into stable register rows', () => {
    const rows = service.buildRows(employees, sites, '2026-06-27');

    expect(rows.map((row) => row.employeeName)).toEqual(['Mokoena, Busi', 'Zulu, Anele']);
    expect(rows[0].status).toBe('pending');
    expect(rows[1].siteName).toBe('Workshop');
    expect(rows[1].hasEvidence).toBeTrue();
  });

  it('summarizes register completion and exceptions', () => {
    const summary = service.summarize(service.buildRows(employees, sites, '2026-06-27'));

    expect(summary).toEqual({ total: 2, present: 1, absent: 0, pending: 1, flagged: 1, evidence: 1, completionPercent: 50 });
  });

  it('exports CSV with escaped operational notes', () => {
    const csv = service.toCsv(service.buildRows(employees, sites, '2026-06-27'));

    expect(csv).toContain('Work date,Employee,Role,Site,Status,Reason,Comment,Flagged,Evidence');
    expect(csv).toContain('"Pump inspection, completed"');
  });
});
