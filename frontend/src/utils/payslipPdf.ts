import jsPDF from 'jspdf';

export const COMPANY_ADDRESS = '7 FLOOR UNIT 706 B WING, AMBIVALI, SAHAKAR NAGAR, Mumbai, Maharashtra, 400053-India.';

interface PayslipData {
  header: Record<string, any>;
  earnings: Array<{ PAY_COMP_DESC: string; PAY_COMP_AMT: number }>;
  deductions: Array<{ PAY_COMP_DESC: string; PAY_COMP_AMT: number }>;
  grossEarnings: number;
  grossDeductions: number;
  netSalary: number;
  period: string;
  words: string;
  logoUrl?: string;
}

// Draw text directly into the PDF so it stays sharp at any print resolution.
export async function createPayslipPDF(data: PayslipData): Promise<jsPDF> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const { header } = data;
  const left = 15, right = 195, middle = 105;
  let y = 19;
  const money = (value: number) => Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  });
  const text = (value: unknown, x: number, top: number, bold = false, size = 9, align: 'left' | 'center' | 'right' = 'left') => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(size);
    pdf.text(String(value ?? '-'), x, top, { align });
  };
  pdf.setProperties({ title: `Payslip - ${data.period}`, subject: 'Employee salary slip' });
  pdf.setDrawColor(70);
  pdf.setLineWidth(0.2);
  if (data.logoUrl) {
    // A failed logo must not prevent access to the salary document.
    try {
      const response = await fetch(data.logoUrl);
      if (!response.ok) throw new Error('Company logo unavailable');
      const blob = await response.blob();
      const image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      const properties = pdf.getImageProperties(image);
      const width = Math.min(64, 13 * properties.width / properties.height);
      pdf.addImage(image, 'PNG', left, y - 6, width, width * properties.height / properties.width);
      y += 16;
    } catch {
      text('BAYANAT TECHNOLOGY PRIVATE LTD', 105, y, true, 14, 'center');
      y += 8;
    }
  } else {
    text('BAYANAT TECHNOLOGY PRIVATE LTD', 105, y, true, 14, 'center');
    y += 8;
  }
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  const address = pdf.splitTextToSize(COMPANY_ADDRESS, 175);
  pdf.text(address, 105, y, { align: 'center' });
  y += address.length * 4 + 5;
  text(`Salary Slip for ${data.period}`, 105, y, true, 12, 'center');
  y += 5;
  pdf.line(left, y, right, y);
  y += 8;
  const fields = [
    ['Employee Code', header.EMPLOYEE_CODE || header.EMPLOYEE_ID, 'Employee Name', header.RPT_NAME],
    ['Designation', header.DESG_NAME, 'Division', header.DIV_NAME],
    ['Department', header.DEPT_NAME, 'Section', header.SECTION_NAME],
    ['Period', data.period, 'Currency', header.CURR_NAME],
    ['Bank Name', header.SALARY_BANK_CODE || header.MAIN_BANK, 'Account No.', header.SALARY_ACCT_NO],
    ['Mode of Payment', header.PAYMENT_MODE, '', '']
  ];
  fields.forEach(row => {
    let height = 7;
    [left, middle + 3].forEach((x, index) => {
      if (!row[index * 2]) return;
      text(row[index * 2], x, y, true);
      pdf.setFont('helvetica', 'normal');
      const lines = pdf.splitTextToSize(String(row[index * 2 + 1] || '-'), 52);
      pdf.text(lines, x + 34, y);
      height = Math.max(height, lines.length * 4 + 3);
    });
    y += height;
  });
  y += 2;
  const tableHeader = () => {
    pdf.rect(left, y, right - left, 7);
    pdf.line(middle, y, middle, y + 7);
    pdf.line(82, y, 82, y + 7);
    pdf.line(172, y, 172, y + 7);
    text('Earnings', left + 2, y + 4.8, true);
    text('Amount', 103, y + 4.8, true, 9, 'right');
    text('Deductions', middle + 2, y + 4.8, true);
    text('Amount', right - 2, y + 4.8, true, 9, 'right');
    y += 7;
  };
  tableHeader();
  for (let i = 0; i < Math.max(data.earnings.length, data.deductions.length, 5); i++) {
    const earning = data.earnings[i], deduction = data.deductions[i];
    pdf.setFont('helvetica', 'normal');
    const el = pdf.splitTextToSize(earning?.PAY_COMP_DESC || '', 62);
    const dl = pdf.splitTextToSize(deduction?.PAY_COMP_DESC || (i === 0 && !data.deductions.length ? 'No deductions for this period' : ''), 62);
    const height = Math.max(el.length, dl.length, 1) * 4 + 2.5;
    if (y + height > 260) { pdf.addPage(); y = 20; tableHeader(); }
    pdf.rect(left, y, right - left, height);
    [82, middle, 172].forEach(x => pdf.line(x, y, x, y + height));
    pdf.text(el, left + 2, y + 4.5);
    pdf.text(dl, middle + 2, y + 4.5);
    if (earning) text(money(earning.PAY_COMP_AMT), middle - 2, y + 4.5, false, 9, 'right');
    if (deduction) text(money(deduction.PAY_COMP_AMT), right - 2, y + 4.5, false, 9, 'right');
    y += height;
  }
  if (y + 8 > 270) { pdf.addPage(); y = 20; }
  pdf.rect(left, y, right - left, 8);
  pdf.line(middle, y, middle, y + 8);
  text('Total Earnings', left + 2, y + 5.2, true);
  text(money(data.grossEarnings), middle - 2, y + 5.2, true, 9, 'right');
  text('Total Deductions', middle + 2, y + 5.2, true);
  text(money(data.grossDeductions), right - 2, y + 5.2, true, 9, 'right');
  y += 8;
  pdf.setFont('helvetica', 'bold');
  const words = pdf.splitTextToSize(`In words: ${data.words}`, 174);
  const height = 14 + words.length * 4;
  if (y + height > 280) { pdf.addPage(); y = 20; }
  pdf.rect(left, y, right - left, height);
  text(`Net Pay: ${header.CURR_NAME || 'INR'} ${money(data.netSalary)}`, left + 2, y + 6, true, 11);
  pdf.setFontSize(9);
  pdf.text(words, left + 2, y + 12);
  y += height + 7;
  text('This is a system generated salary slip. No signature required.', 105, y, false, 9, 'center');
  return pdf;
}
