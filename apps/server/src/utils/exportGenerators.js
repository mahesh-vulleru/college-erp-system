/**
 * Multi-Format Institutional Export Generators
 * Zero-dependency generators for CSV (RFC 4180), Excel (SpreadsheetML), and PDF (PDF-1.4 binary stream)
 */

/**
 * Escapes XML strings for SpreadsheetML
 */
function escapeXml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Escapes CSV values according to RFC 4180
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates an RFC 4180 CSV string with UTF-8 BOM for Microsoft Excel compatibility
 */
function generateCsv(headers, rows) {
  const headerLine = headers.map(escapeCsvValue).join(',');
  const rowLines = rows.map((row) => row.map(escapeCsvValue).join(','));
  // \uFEFF is UTF-8 Byte Order Mark for Excel
  return '\uFEFF' + [headerLine, ...rowLines].join('\r\n');
}

/**
 * Generates an Excel XML SpreadsheetML document natively compatible with MS Excel, LibreOffice, and Numbers
 */
function generateSpreadsheetML(title, headers, rows) {
  const safeTitle = escapeXml((title || 'Report').slice(0, 31));
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\r\n';
  xml += '<?mso-application progid="Excel.Sheet"?>\r\n';
  xml += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\r\n';
  xml += ' xmlns:o="urn:schemas-microsoft-com:office:office"\r\n';
  xml += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\r\n';
  xml += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\r\n';
  xml += ' xmlns:html="http://www.w3.org/TR/REC-html40">\r\n';
  xml += ' <Styles>\r\n';
  xml += '  <Style ss:ID="Default" ss:Name="Normal"><Font ss:FontName="Calibri" ss:Size="11" ss:Color="#1E293B"/></Style>\r\n';
  xml += '  <Style ss:ID="HeaderStyle">\r\n';
  xml += '   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>\r\n';
  xml += '   <Interior ss:Color="#0F766E" ss:Pattern="Solid"/>\r\n';
  xml += '   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>\r\n';
  xml += '  </Style>\r\n';
  xml += '  <Style ss:ID="TitleStyle">\r\n';
  xml += '   <Font ss:FontName="Calibri" ss:Size="14" ss:Bold="1" ss:Color="#0F766E"/>\r\n';
  xml += '  </Style>\r\n';
  xml += '  <Style ss:ID="DateStyle">\r\n';
  xml += '   <Font ss:FontName="Calibri" ss:Size="10" ss:Italic="1" ss:Color="#64748B"/>\r\n';
  xml += '  </Style>\r\n';
  xml += ' </Styles>\r\n';
  xml += ` <Worksheet ss:Name="${safeTitle}">\r\n`;
  xml += '  <Table>\r\n';

  // Title Row
  xml += '   <Row>\r\n';
  xml += `    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">${escapeXml(title || 'Apex Engineering College Report')}</Data></Cell>\r\n`;
  xml += '   </Row>\r\n';

  // Generation timestamp
  xml += '   <Row>\r\n';
  xml += `    <Cell ss:StyleID="DateStyle"><Data ss:Type="String">Generated on: ${new Date().toLocaleString()} | Principal & Academic Council</Data></Cell>\r\n`;
  xml += '   </Row>\r\n';
  xml += '   <Row></Row>\r\n';

  // Column Headers
  xml += '   <Row ss:StyleID="HeaderStyle">\r\n';
  for (const h of headers) {
    xml += `    <Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>\r\n`;
  }
  xml += '   </Row>\r\n';

  // Data Rows
  for (const row of rows) {
    xml += '   <Row>\r\n';
    for (const val of row) {
      const isNum = typeof val === 'number' && !isNaN(val);
      xml += `    <Cell><Data ss:Type="${isNum ? 'Number' : 'String'}">${escapeXml(val)}</Data></Cell>\r\n`;
    }
    xml += '   </Row>\r\n';
  }

  xml += '  </Table>\r\n';
  xml += ' </Worksheet>\r\n';
  xml += '</Workbook>';

  return xml;
}

/**
 * Escapes text for PDF string literals: replaces backslash and parens
 */
function escapePdfText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Generates a valid %PDF-1.4 text stream document with institutional header, summary, and tabular layout
 */
function generateTextPdf(title, subtitle, headers, rows) {
  const safeTitle = escapePdfText(title || 'Institutional Report');
  const safeSubtitle = escapePdfText(subtitle || 'Apex Engineering College - Principal Executive Summary');
  const genDate = escapePdfText(`Generated on: ${new Date().toLocaleString()}`);

  const pageHeight = 792;
  const pageWidth = 612;
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  // Calculate column widths
  const colCount = Math.max(1, headers.length);
  const colWidth = Math.floor(contentWidth / colCount);

  // Build stream content
  let stream = '';

  // Header band (teal fill)
  stream += 'q\n';
  stream += '0.059 0.463 0.431 rg\n'; // #0F766E
  stream += `${margin} ${pageHeight - 95} ${contentWidth} 55 re\n`;
  stream += 'f\n';
  stream += 'Q\n';

  // Header Text
  stream += 'BT\n';
  stream += '/F1 16 Tf\n';
  stream += '1 1 1 rg\n'; // White text
  stream += `${margin + 15} ${pageHeight - 65} Td\n`;
  stream += `(${safeTitle}) Tj\n`;
  stream += 'ET\n';

  stream += 'BT\n';
  stream += '/F1 9 Tf\n';
  stream += '0.85 0.95 0.93 rg\n'; // Light teal
  stream += `${margin + 15} ${pageHeight - 82} Td\n`;
  stream += `(${safeSubtitle}) Tj\n`;
  stream += 'ET\n';

  // Timestamp
  stream += 'BT\n';
  stream += '/F1 8 Tf\n';
  stream += '0.4 0.45 0.5 rg\n'; // Slate gray
  stream += `${margin} ${pageHeight - 110} Td\n`;
  stream += `(${genDate} | Apex Engineering College ERP) Tj\n`;
  stream += 'ET\n';

  // Table Header Background (Light gray)
  const tableTopY = pageHeight - 130;
  stream += 'q\n';
  stream += '0.94 0.96 0.98 rg\n'; // #F1F5F9
  stream += `${margin} ${tableTopY - 18} ${contentWidth} 20 re\n`;
  stream += 'f\n';
  stream += 'Q\n';

  // Table Headers
  stream += 'BT\n';
  stream += '/F1 9 Tf\n';
  stream += '0.06 0.1 0.15 rg\n'; // Dark navy text
  for (let c = 0; c < headers.length; c++) {
    const colX = margin + c * colWidth + 5;
    const colY = tableTopY - 14;
    const safeH = escapePdfText(String(headers[c]).slice(0, 18));
    if (c === 0) {
      stream += `${colX} ${colY} Td\n`;
    } else {
      stream += `${colWidth} 0 Td\n`;
    }
    stream += `(${safeH}) Tj\n`;
  }
  stream += 'ET\n';

  // Table Data Rows
  let currentY = tableTopY - 32;
  const maxRowsOnPage = 28;
  const renderRows = rows.slice(0, maxRowsOnPage);

  for (let r = 0; r < renderRows.length; r++) {
    const row = renderRows[r];

    // Alternating row background
    if (r % 2 === 1) {
      stream += 'q\n';
      stream += '0.98 0.98 0.99 rg\n';
      stream += `${margin} ${currentY - 4} ${contentWidth} 16 re\n`;
      stream += 'f\n';
      stream += 'Q\n';
    }

    // Row cell text
    stream += 'BT\n';
    stream += '/F1 8 Tf\n';
    stream += '0.15 0.2 0.25 rg\n';

    for (let c = 0; c < row.length; c++) {
      const colX = margin + c * colWidth + 5;
      const safeVal = escapePdfText(String(row[c] !== null && row[c] !== undefined ? row[c] : '').slice(0, 20));
      if (c === 0) {
        stream += `${colX} ${currentY} Td\n`;
      } else {
        stream += `${colWidth} 0 Td\n`;
      }
      stream += `(${safeVal}) Tj\n`;
    }
    stream += 'ET\n';

    currentY -= 17;
  }

  // Footer Note
  stream += 'BT\n';
  stream += '/F1 8 Tf\n';
  stream += '0.5 0.5 0.5 rg\n';
  stream += `${margin} 30 Td\n`;
  stream += `(Confidential Document - For Authorized Academic & Administrative Use Only - Total Records: ${rows.length}) Tj\n`;
  stream += 'ET\n';

  // Build PDF Objects
  const streamLength = Buffer.byteLength(stream, 'utf8');

  let pdf = '%PDF-1.4\n';
  const offsets = [];

  // Object 1: Catalog
  offsets.push(pdf.length);
  pdf += '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';

  // Object 2: Pages
  offsets.push(pdf.length);
  pdf += '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';

  // Object 3: Page
  offsets.push(pdf.length);
  pdf += `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;

  // Object 4: Font
  offsets.push(pdf.length);
  pdf += '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

  // Object 5: Content Stream
  offsets.push(pdf.length);
  pdf += `5 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`;

  // Cross-reference table
  const startXref = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${offsets.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }

  // Trailer
  pdf += 'trailer\n';
  pdf += `<< /Size ${offsets.length + 1} /Root 1 0 R >>\n`;
  pdf += 'startxref\n';
  pdf += `${startXref}\n`;
  pdf += '%%EOF\n';

  return Buffer.from(pdf, 'utf8');
}


/**
 * Express Response Dispatcher for Multi-Format Reports (CSV, XLSX, PDF)
 */
function sendFormattedReport(res, { title, filenameBase, headers, rows, format }) {
  const timestamp = new Date().toISOString().split('T')[0];
  const fmt = (format || 'csv').toLowerCase();

  if (fmt === 'xlsx' || fmt === 'excel') {
    const xml = generateSpreadsheetML(title, headers, rows);
    res.setHeader('Content-Type', 'application/vnd.ms-excel; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${timestamp}.xlsx"`);
    return res.status(200).send(xml);
  }

  if (fmt === 'pdf') {
    const pdfBuf = generateTextPdf(title, 'Apex Engineering College - Central Report', headers, rows);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${timestamp}.pdf"`);
    return res.status(200).send(pdfBuf);
  }

  // Default: CSV
  const csv = generateCsv(headers, rows);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${timestamp}.csv"`);
  return res.status(200).send(csv);
}

module.exports = {
  generateCsv,
  generateSpreadsheetML,
  generateTextPdf,
  sendFormattedReport
};

