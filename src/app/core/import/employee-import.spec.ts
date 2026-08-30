import { stageEmployeeCsv } from './employee-import';

describe('stageEmployeeCsv', () => {
  const csv = [
    'SENATLA EMPLOYEES,,,,,,,',
    'TARGET,,,,,,,',
    'Names,ID No,Company No,Designation,Emp.Start Date,Rate P/D,Xtream Safety,Shirt Size',
    'Anele Zulu,9001015009087,EMP-001,Excavator Op,01/08/2026,R 650.00,"First Aid Level 1, HIRA",L',
    'Names,ID No,Company No,Designation,Emp.Start Date,Rate P/D,Xtream Safety,Shirt Size',
  ].join('\n');

  it('maps every supplied Senatla field and preserves future columns', () => {
    const rows = stageEmployeeCsv(csv, 'site-1');
    expect(rows.length).toBe(1);
    expect(rows[0].status).toBe('ready');
    expect(rows[0].employee).toEqual(jasmine.objectContaining({
      firstName: 'Anele', surname: 'Zulu', idNumber: '9001015009087', companyNumber: 'EMP-001',
      designation: 'Excavator Op', role: 'Operator', startDate: '2026-08-01', basicRate: 650, payRateUnit: 'daily',
    }));
    expect(rows[0].employee.safetyQualifications).toEqual(['First Aid Level 1', 'HIRA']);
    expect(rows[0].employee.additionalFields).toEqual({ shirt_size: 'L' });
  });

  it('blocks duplicates and requires explicit site assignment', () => {
    const rows = stageEmployeeCsv(csv, '', [{
      id: 'existing', firstName: 'Existing', surname: 'Worker', idNumber: '9001015009087', companyNumber: 'EMP-001',
      role: 'Operator', siteId: 'site-1', startDate: '2026-01-01', basicRate: 500, salaryAdvances: 0,
      financials: {}, logs: {}, adjustments: {},
    }]);
    expect(rows[0].status).toBe('error');
    expect(rows[0].errors.join(' ')).toContain('duplicates');
    expect(rows[0].errors.join(' ')).toContain('Select a site');
  });

  it('treats company numbers case-insensitively when checking duplicates', () => {
    const rows = stageEmployeeCsv(csv, 'site-1', [{
      id: 'existing', firstName: 'Existing', surname: 'Worker', idNumber: '8001015009087', companyNumber: 'emp-001',
      role: 'Operator', siteId: 'site-1', startDate: '2026-01-01', basicRate: 500, salaryAdvances: 0,
      financials: {}, logs: {}, adjustments: {},
    }]);

    expect(rows[0].status).toBe('error');
    expect(rows[0].errors).toContain('Company number duplicates an existing or staged employee.');
  });

  it('accepts formatted existing ID numbers when checking duplicates', () => {
    const rows = stageEmployeeCsv(csv, 'site-1', [{
      id: 'existing', firstName: 'Existing', surname: 'Worker', idNumber: '900101-5009-087', companyNumber: 'EMP-777',
      role: 'Operator', siteId: 'site-1', startDate: '2026-01-01', basicRate: 500, salaryAdvances: 0,
      financials: {}, logs: {}, adjustments: {},
    }]);

    expect(rows[0].status).toBe('error');
    expect(rows[0].errors).toContain('ID number duplicates an existing or staged employee.');
  });
});
