import { Employee } from '../models/app.models';

export type EmployeeImportStatus = 'ready' | 'warning' | 'error';
export interface EmployeeImportRow { sourceRow: number; status: EmployeeImportStatus; employee: Employee; errors: string[]; warnings: string[]; }
const knownHeaders = new Set(['names', 'id_no', 'company_no', 'designation', 'emp_start_date', 'rate_p_d', 'xtream_safety']);

export function stageEmployeeCsv(text: string, siteId: string, existing: Employee[] = []): EmployeeImportRow[] {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) throw new Error('CSV must contain a header and at least one employee row.');
  const headerIndex = lines.findIndex((line) => splitCsv(line).some((value) => normalizeHeader(value) === 'id_no'));
  if (headerIndex < 0) throw new Error('No employee header row was found. Expected at least ID No.');
  const headers = splitCsv(lines[headerIndex]).map(normalizeHeader);
  const seenIds = new Set(existing.map((employee) => digits(employee.idNumber)).filter((idNumber) => /^\d{13}$/.test(idNumber)));
  const seenCompanyNumbers = new Set(existing.map((employee) => normalizeCompanyNumber(employee.companyNumber)).filter(isPresent));
  return lines.slice(headerIndex + 1).map((line, index) => ({ values: splitCsv(line), sourceRow: headerIndex + index + 2 }))
    .filter(({ values }) => !isRepeatedHeader(values))
    .map(({ values, sourceRow }) => {
      const raw = mapRow(headers, values);
      const errors: string[] = [];
      const warnings: string[] = [];
      const { firstName, surname } = splitName(raw['names'] || '');
      const idNumber = digits(raw['id_no'] || '');
      const companyNumber = (raw['company_no'] || '').trim();
      const normalizedCompanyNumber = normalizeCompanyNumber(companyNumber);
      const designation = (raw['designation'] || '').trim();
      const startDate = normalizeDate(raw['emp_start_date'] || '');
      const basicRate = normalizeRate(raw['rate_p_d'] || '');
      if (!firstName || !surname) errors.push('A first name and surname are required.');
      if (!/^\d{13}$/.test(idNumber)) errors.push('ID number must contain 13 digits.');
      else if (seenIds.has(idNumber)) errors.push('ID number duplicates an existing or staged employee.');
      if (!companyNumber) warnings.push('Company number is missing.');
      else if (seenCompanyNumbers.has(normalizedCompanyNumber)) errors.push('Company number duplicates an existing or staged employee.');
      if (!designation) warnings.push('Designation is missing.');
      if (!startDate) errors.push('Employee start date is invalid or missing.');
      if (basicRate === null) errors.push('Daily rate is invalid or missing.');
      if (!siteId) errors.push('Select a site before importing.');
      if (/^\d{13}$/.test(idNumber)) seenIds.add(idNumber);
      if (normalizedCompanyNumber) seenCompanyNumbers.add(normalizedCompanyNumber);
      const additionalFields = collectAdditionalFields(headers, raw);
      const employee: Employee = {
        id: '', firstName, surname, idNumber, companyNumber: companyNumber || undefined,
        role: categoryForDesignation(designation), designation: designation || undefined, siteId, startDate: startDate || '',
        basicRate: basicRate ?? 0, payRateUnit: 'daily', safetyQualifications: splitQualifications(raw['xtream_safety'] || ''),
        additionalFields, salaryAdvances: 0, financials: { travel: 0, housing: 0, advance: 0 }, logs: {}, adjustments: {}, employmentStatus: 'active',
      };
      return { sourceRow, status: errors.length ? 'error' : warnings.length ? 'warning' : 'ready', employee, errors, warnings };
    });
}
function mapRow(headers: string[], values: string[]) {
  const raw: Record<string, string> = {};
  headers.forEach((header, column) => {
    if (header) raw[header] = (values[column] || '').trim();
  });
  return raw;
}

function collectAdditionalFields(headers: string[], raw: Record<string, string>) {
  const additionalFields: Record<string, string> = {};
  headers
    .filter((header) => !knownHeaders.has(header) && raw[header])
    .forEach((header) => {
      additionalFields[header] = raw[header];
    });
  return additionalFields;
}

function splitCsv(line: string) { const values: string[] = []; let value = ''; let quoted = false; for (let index = 0; index < line.length; index += 1) { const char = line[index]; if (char === '"' && line[index + 1] === '"') { value += '"'; index += 1; } else if (char === '"') quoted = !quoted; else if (char === ',' && !quoted) { values.push(value.trim()); value = ''; } else value += char; } values.push(value.trim()); return values; }
function normalizeHeader(value: string) { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
function isRepeatedHeader(values: string[]) { return values.some((value) => normalizeHeader(value) === 'id_no') && values.some((value) => normalizeHeader(value) === 'designation'); }
function digits(value: string) { return value.replace(/\D/g, ''); }
function normalizeCompanyNumber(value: string | undefined) { return value?.trim().toLowerCase() || ''; }
function isPresent<T>(value: T | null | undefined | ''): value is T { return Boolean(value); }
function splitName(value: string) { const parts = value.trim().replace(/\s+/g, ' ').split(' ').filter(Boolean); return { firstName: parts.slice(0, -1).join(' '), surname: parts[parts.length - 1] || '' }; }
function normalizeRate(value: string) { const parsed = Number(value.replace(/[^0-9.-]/g, '')); return Number.isFinite(parsed) && parsed >= 0 ? parsed : null; }
function normalizeDate(value: string) { const text = value.trim(); if (!text) return null; if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text; const match = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/); if (match) return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`; const serial = Number(text); if (Number.isInteger(serial) && serial > 20000 && serial < 80000) return new Date(Date.UTC(1899, 11, 30 + serial)).toISOString().slice(0, 10); return null; }
function splitQualifications(value: string) { return value.split(/[.,;]+/).map((item) => item.trim()).filter((item) => item && item !== '-'); }
function categoryForDesignation(value: string): Employee['role'] { const role = value.toLowerCase(); if (/safety|hse|she\b/.test(role)) return 'Safety Rep'; if (/operator|excavator|loader|truck|driver/.test(role)) return 'Operator'; if (/foreman|supervisor|manager|leader/.test(role)) return 'Foreman'; return 'General Worker'; }
