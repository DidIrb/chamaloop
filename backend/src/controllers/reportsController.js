const { pool } = require('../config/database');
const {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType, BorderStyle,
} = require('docx');
const PDFDocument = require('pdfkit');

// Helper — fetch report data for a given month/year
const fetchReportData = async (year, month) => {
  const [config] = await pool.query('SELECT * FROM chama_config LIMIT 1');

  const [rounds] = await pool.query(
    `SELECT r.*, m.name as recipient_name
     FROM rounds r
     JOIN members m ON r.recipient_member_id = m.member_id
     WHERE r.status = 'completed'
       AND YEAR(r.date_conducted) = ?
       AND MONTH(r.date_conducted) = ?
     ORDER BY r.round_number ASC`,
    [year, month]
  );

  const roundsWithContributions = await Promise.all(rounds.map(async (round) => {
    const [contributions] = await pool.query(
      `SELECT c.*, m.name, m.phone_number
       FROM contributions c
       JOIN members m ON c.member_id = m.member_id
       WHERE c.round_id = ?
       ORDER BY m.rotation_order ASC`,
      [round.round_id]
    );
    const totalFines = contributions.reduce((sum, c) => sum + parseFloat(c.fine_amount || 0), 0);
    return { ...round, contributions, totalFines };
  }));

  const [allMembers] = await pool.query('SELECT * FROM members ORDER BY rotation_order ASC');

  return { config: config[0], rounds: roundsWithContributions, members: allMembers };
};

const monthName = (month) => [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
][month - 1];

// GET /api/reports/word?year=2025&month=10
const generateWordReport = async (req, res) => {
  const year = parseInt(req.query.year);
  const month = parseInt(req.query.month);

  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Valid year and month are required.' });
  }

  try {
    const { config, rounds, members } = await fetchReportData(year, month);
    const period = `${monthName(month)} ${year}`;
    const totalPayout = rounds.reduce((s, r) => s + parseFloat(r.payout_amount || 0), 0);
    const totalFines = rounds.reduce((s, r) => s + r.totalFines, 0);

    const borderStyle = {
      style: BorderStyle.SINGLE, size: 1, color: '999999',
    };
    const cellBorder = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle };

    const headerCell = (text) => new TableCell({
      borders: cellBorder,
      shading: { fill: 'E6F7F1' },
      children: [new Paragraph({
        children: [new TextRun({ text, bold: true, size: 20, color: '0F6E56' })],
      })],
    });

    const dataCell = (text, center = false) => new TableCell({
      borders: cellBorder,
      children: [new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text: String(text ?? '—'), size: 20 })],
      })],
    });

    // Build rounds sections
    const roundSections = [];
    if (rounds.length === 0) {
      roundSections.push(new Paragraph({
        children: [new TextRun({ text: 'No completed rounds recorded for this period.', italics: true, color: '777777', size: 20 })],
      }));
    } else {
      for (const round of rounds) {
        roundSections.push(
          new Paragraph({
            text: `Round ${round.round_number} — Recipient: ${round.recipient_name}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  headerCell('Member'), headerCell('Phone'), headerCell('Status'),
                  headerCell('M-Pesa Code'), headerCell('Amount (KES)'), headerCell('Fine (KES)'),
                ],
              }),
              ...round.contributions.map(c => new TableRow({
                children: [
                  dataCell(c.name), dataCell(c.phone_number),
                  dataCell(c.status.charAt(0).toUpperCase() + c.status.slice(1)),
                  dataCell(c.mpesa_code || '—'),
                  dataCell(Number(c.amount_paid).toLocaleString(), true),
                  dataCell(parseFloat(c.fine_amount) > 0 ? Number(c.fine_amount).toLocaleString() : '—', true),
                ],
              })),
            ],
          }),
          new Paragraph({
            spacing: { before: 120 },
            children: [
              new TextRun({ text: `Payout: KES ${Number(round.payout_amount).toLocaleString()}`, bold: true }),
              new TextRun({ text: `   |   Total fines: KES ${round.totalFines.toLocaleString()}` }),
              new TextRun({ text: `   |   Date: ${new Date(round.date_conducted).toLocaleDateString('en-KE')}` }),
            ],
          })
        );
      }
    }

    // Members summary table
    const memberRows = members.map(m => new TableRow({
      children: [
        dataCell(m.rotation_order, true), dataCell(m.name),
        dataCell(m.phone_number), dataCell(m.business_name || '—'),
        dataCell(m.business_location || '—'),
      ],
    }));

    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            children: [new TextRun({ text: config?.chama_name || 'ChamaLoop', bold: true, size: 36, color: '0F6E56' })],
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Monthly Report — ${period}`, size: 28, color: '333333' })],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Generated on ${new Date().toLocaleDateString('en-KE')}`, size: 18, color: '777777' })],
            spacing: { after: 400 },
          }),

          new Paragraph({ text: 'Summary', heading: HeadingLevel.HEADING_2, spacing: { after: 160 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [headerCell('Total rounds completed'), dataCell(rounds.length, true)] }),
              new TableRow({ children: [headerCell('Total payout'), dataCell(`KES ${totalPayout.toLocaleString()}`, true)] }),
              new TableRow({ children: [headerCell('Total fines collected'), dataCell(`KES ${totalFines.toLocaleString()}`, true)] }),
              new TableRow({ children: [headerCell('Total members'), dataCell(members.length, true)] }),
            ],
          }),

          new Paragraph({ text: 'Round Details', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 160 } }),
          ...roundSections,

          new Paragraph({ text: 'Member Directory', heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 160 } }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({ children: [headerCell('#'), headerCell('Name'), headerCell('Phone'), headerCell('Business'), headerCell('Location')] }),
              ...memberRows,
            ],
          }),

          new Paragraph({
            spacing: { before: 600 },
            children: [new TextRun({ text: 'This report was generated automatically by ChamaLoop.', italics: true, size: 18, color: '999999' })],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="ChamaLoop_Report_${period.replace(' ', '_')}.docx"`);
    res.send(buffer);

  } catch (error) {
    console.error('Word report error:', error);
    return res.status(500).json({ message: 'Failed to generate Word report.' });
  }
};

// GET /api/reports/pdf?year=2025&month=10
const generatePdfReport = async (req, res) => {
  const year = parseInt(req.query.year);
  const month = parseInt(req.query.month);

  if (!year || !month || month < 1 || month > 12) {
    return res.status(400).json({ message: 'Valid year and month are required.' });
  }

  try {
    const { config, rounds, members } = await fetchReportData(year, month);
    const period = `${monthName(month)} ${year}`;
    const totalPayout = rounds.reduce((s, r) => s + parseFloat(r.payout_amount || 0), 0);
    const totalFines = rounds.reduce((s, r) => s + r.totalFines, 0);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="ChamaLoop_Report_${period.replace(' ', '_')}.pdf"`);
    doc.pipe(res);

    const GREEN = '#0F6E56';
    const LIGHT_GREEN = '#E6F7F1';
    const GREY = '#777777';
    const pageWidth = doc.page.width - 100;

    // Header
    doc.fontSize(22).fillColor(GREEN).font('Helvetica-Bold').text(config?.chama_name || 'ChamaLoop');
    doc.fontSize(14).fillColor('#333333').font('Helvetica').text(`Monthly Report — ${period}`);
    doc.fontSize(10).fillColor(GREY).text(`Generated on ${new Date().toLocaleDateString('en-KE')}`);
    doc.moveDown(1.5);

    // Summary box
    doc.fontSize(13).fillColor(GREEN).font('Helvetica-Bold').text('Summary');
    doc.moveDown(0.3);
    const summaryItems = [
      ['Total rounds completed', rounds.length],
      ['Total payout', `KES ${totalPayout.toLocaleString()}`],
      ['Total fines collected', `KES ${totalFines.toLocaleString()}`],
      ['Total members', members.length],
    ];
    summaryItems.forEach(([label, value], i) => {
      const y = doc.y;
      const bg = i % 2 === 0 ? LIGHT_GREEN : '#ffffff';
      doc.rect(50, y, pageWidth, 20).fill(bg);
      doc.fillColor('#333').font('Helvetica').fontSize(10)
        .text(label, 56, y + 5, { width: pageWidth / 2 })
        .font('Helvetica-Bold')
        .text(String(value), 56 + pageWidth / 2, y + 5, { width: pageWidth / 2, align: 'right' });
      doc.y = y + 20;
    });
    doc.moveDown(1.5);

    // Round details
    doc.fontSize(13).fillColor(GREEN).font('Helvetica-Bold').text('Round Details');
    doc.moveDown(0.5);

    if (rounds.length === 0) {
      doc.fontSize(10).fillColor(GREY).font('Helvetica-Oblique').text('No completed rounds recorded for this period.');
    } else {
      for (const round of rounds) {
        doc.fontSize(11).fillColor('#1a1a1a').font('Helvetica-Bold')
          .text(`Round ${round.round_number} — Recipient: ${round.recipient_name}`);
        doc.fontSize(9).fillColor(GREY).font('Helvetica')
          .text(`Date: ${new Date(round.date_conducted).toLocaleDateString('en-KE')}   |   Payout: KES ${Number(round.payout_amount).toLocaleString()}   |   Fines: KES ${round.totalFines.toLocaleString()}`);
        doc.moveDown(0.3);

        // Contribution table headers
        const cols = [140, 90, 60, 90, 70, 60];
        const headers = ['Member', 'Phone', 'Status', 'M-Pesa Code', 'Amount', 'Fine'];
        const startX = 50;
        let x = startX;
        const headerY = doc.y;
        doc.rect(startX, headerY, pageWidth, 16).fill(LIGHT_GREEN);
        headers.forEach((h, idx) => {
          doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(9).text(h, x + 3, headerY + 4, { width: cols[idx] });
          x += cols[idx];
        });
        doc.y = headerY + 16;

        round.contributions.forEach((c, ci) => {
          if (doc.y > 720) { doc.addPage(); }
          const rowY = doc.y;
          const bg = ci % 2 === 0 ? '#fafafa' : '#ffffff';
          doc.rect(startX, rowY, pageWidth, 16).fill(bg);
          x = startX;
          const cells = [
            c.name, c.phone_number,
            c.status.charAt(0).toUpperCase() + c.status.slice(1),
            c.mpesa_code || '—',
            `KES ${Number(c.amount_paid).toLocaleString()}`,
            parseFloat(c.fine_amount) > 0 ? `KES ${Number(c.fine_amount).toLocaleString()}` : '—',
          ];
          cells.forEach((val, idx) => {
            doc.fillColor('#333').font('Helvetica').fontSize(9).text(val, x + 3, rowY + 4, { width: cols[idx] });
            x += cols[idx];
          });
          doc.y = rowY + 16;
        });
        doc.moveDown(1);
      }
    }

    // Member directory
    if (doc.y > 650) doc.addPage();
    doc.moveDown(0.5);
    doc.fontSize(13).fillColor(GREEN).font('Helvetica-Bold').text('Member Directory');
    doc.moveDown(0.3);
    const mCols = [30, 150, 100, 140, 100];
    const mHeaders = ['#', 'Name', 'Phone', 'Business', 'Location'];
    let mx = 50;
    const mHeaderY = doc.y;
    doc.rect(50, mHeaderY, pageWidth, 16).fill(LIGHT_GREEN);
    mHeaders.forEach((h, i) => {
      doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(9).text(h, mx + 3, mHeaderY + 4, { width: mCols[i] });
      mx += mCols[i];
    });
    doc.y = mHeaderY + 16;
    members.forEach((m, mi) => {
      if (doc.y > 720) doc.addPage();
      const ry = doc.y;
      doc.rect(50, ry, pageWidth, 16).fill(mi % 2 === 0 ? '#fafafa' : '#ffffff');
      mx = 50;
      [m.rotation_order, m.name, m.phone_number, m.business_name || '—', m.business_location || '—'].forEach((val, i) => {
        doc.fillColor('#333').font('Helvetica').fontSize(9).text(String(val), mx + 3, ry + 4, { width: mCols[i] });
        mx += mCols[i];
      });
      doc.y = ry + 16;
    });

    // Footer
    doc.moveDown(2);
    doc.fontSize(9).fillColor(GREY).font('Helvetica-Oblique')
      .text('This report was generated automatically by ChamaLoop.', { align: 'center' });

    doc.end();

  } catch (error) {
    console.error('PDF report error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ message: 'Failed to generate PDF report.' });
    }
  }
};

module.exports = { generateWordReport, generatePdfReport };
