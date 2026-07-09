import * as XLSX from 'xlsx';

export const COLUMN_HEADERS = [
  'Session #',
  'Event',
  'Break #',
  'Date',
  'Time',
  'Full Timestamp',
  'Status After',
];

export function rowToPlainObject(record) {
  return {
    'Session #': record.session_number,
    'Event': record.event_name,
    'Break #': record.break_number ?? '',
    'Date': record.date,
    'Time': record.time,
    'Full Timestamp': record.full_timestamp,
    'Status After': record.status_after,
  };
}

export function exportToCSV(records, filename = 'audit_log.csv') {
  const rows = records.map(rowToPlainObject);
  const headers = COLUMN_HEADERS;
  const csvLines = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = row[h] ?? '';
          const str = String(val);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    ),
  ];
  const csv = csvLines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToExcel(records, filename = 'audit_log.xlsx') {
  const rows = records.map(rowToPlainObject);
  const ws = XLSX.utils.json_to_sheet(rows, { header: COLUMN_HEADERS });
  // Set column widths
  ws['!cols'] = COLUMN_HEADERS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Audit Log');
  XLSX.writeFile(wb, filename);
}

export function printAuditLog(records, title = 'Audit Log') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rows = records.map(rowToPlainObject);
  const tableHead = COLUMN_HEADERS.map((h) => `<th>${h}</th>`).join('');
  const tableBody = rows
    .map(
      (row) =>
        `<tr>${COLUMN_HEADERS.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 24px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .subtitle { color: #666; font-size: 13px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 8px 10px; text-align: left; }
        th { background: #1e293b; color: white; font-weight: 600; }
        tr:nth-child(even) { background: #f8fafc; }
        .footer { margin-top: 20px; font-size: 11px; color: #999; }
      </style>
    </head>
    <body>
      <h1>Steve's Timestamp System — ${title}</h1>
      <div class="subtitle">Generated: ${new Date().toLocaleString()} — ${records.length} record(s)</div>
      <table>
        <thead><tr>${tableHead}</tr></thead>
        <tbody>${tableBody}</tbody>
      </table>
      <div class="footer">Steve's Timestamp System</div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 300);
}