// OCR utility for parsing Thai bank transfer slips
// Supports: PromptPay, K-Bank, SCB, Bangkok Bank, Krungthai, etc.

export interface SlipData {
  amount: number | null;
  date: string | null;
  time: string | null;
  senderName: string | null;
  receiverName: string | null;
  bankName: string | null;
  refNumber: string | null;
  rawText: string;
}

// Thai month names to number mapping
const thaiMonths: Record<string, string> = {
  'ม.ค.': '01', 'มกราคม': '01',
  'ก.พ.': '02', 'กุมภาพันธ์': '02',
  'มี.ค.': '03', 'มีนาคม': '03',
  'เม.ย.': '04', 'เมษายน': '04',
  'พ.ค.': '05', 'พฤษภาคม': '05',
  'มิ.ย.': '06', 'มิถุนายน': '06',
  'ก.ค.': '07', 'กรกฎาคม': '07',
  'ส.ค.': '08', 'สิงหาคม': '08',
  'ก.ย.': '09', 'กันยายน': '09',
  'ต.ค.': '10', 'ตุลาคม': '10',
  'พ.ย.': '11', 'พฤศจิกายน': '11',
  'ธ.ค.': '12', 'ธันวาคม': '12',
};

// Bank name detection
const bankPatterns: Record<string, RegExp> = {
  'PromptPay': /พร้อมเพย์|promptpay/i,
  'K-Bank': /กสิกร|kbank|k-bank|kasikorn/i,
  'SCB': /ไทยพาณิชย์|scb|siam commercial/i,
  'Bangkok Bank': /กรุงเทพ|bangkok bank|bbl/i,
  'Krungthai': /กรุงไทย|krungthai|ktb/i,
  'TMB': /ทหารไทย|tmb|ttb/i,
  'Krungsri': /กรุงศรี|krungsri|bay/i,
  'GSB': /ออมสิน|gsb/i,
};

/**
 * Parse amount from OCR text
 * Looks for patterns like: 1,000.00 บาท, THB 1000, ฿1,000
 */
function parseAmount(text: string): number | null {
  // Pattern for Thai Baht amounts
  const patterns = [
    /(?:฿|THB|บาท)\s*([\d,]+(?:\.\d{2})?)/gi,
    /([\d,]+(?:\.\d{2})?)\s*(?:฿|THB|บาท)/gi,
    /จำนวน\s*([\d,]+(?:\.\d{2})?)/gi,
    /amount[:\s]*([\d,]+(?:\.\d{2})?)/gi,
    /ยอดเงิน[:\s]*([\d,]+(?:\.\d{2})?)/gi,
    /โอน[:\s]*([\d,]+(?:\.\d{2})?)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const amountStr = match[1].replace(/,/g, '');
      const amount = parseFloat(amountStr);
      if (amount > 0 && amount < 100000000) { // Reasonable amount range
        return amount;
      }
    }
  }

  // Fallback: find largest number that looks like money
  const numberPattern = /([\d,]+\.\d{2})/g;
  const numbers = text.match(numberPattern);
  if (numbers) {
    const amounts = numbers
      .map(n => parseFloat(n.replace(/,/g, '')))
      .filter(n => n > 0 && n < 100000000)
      .sort((a, b) => b - a);
    if (amounts.length > 0) {
      return amounts[0];
    }
  }

  return null;
}

/**
 * Parse date from OCR text
 * Supports: DD/MM/YYYY, DD-MM-YYYY, DD MMM YYYY (Thai)
 */
function parseDate(text: string): string | null {
  // Pattern: DD/MM/YYYY or DD-MM-YYYY
  const datePattern1 = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
  const match1 = text.match(datePattern1);
  if (match1) {
    let [, day, month, year] = match1;
    if (year.length === 2) {
      year = '25' + year; // Thai Buddhist year
    }
    // Convert Buddhist year to Gregorian if needed
    const yearNum = parseInt(year);
    const gregorianYear = yearNum > 2500 ? yearNum - 543 : yearNum;
    return `${gregorianYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Pattern: DD MMM YYYY (Thai months)
  for (const [thaiMonth, monthNum] of Object.entries(thaiMonths)) {
    const pattern = new RegExp(`(\\d{1,2})\\s*${thaiMonth}\\s*(\\d{2,4})`, 'i');
    const match = text.match(pattern);
    if (match) {
      let [, day, year] = match;
      if (year.length === 2) {
        year = '25' + year;
      }
      const yearNum = parseInt(year);
      const gregorianYear = yearNum > 2500 ? yearNum - 543 : yearNum;
      return `${gregorianYear}-${monthNum}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Parse time from OCR text
 */
function parseTime(text: string): string | null {
  const timePattern = /(\d{1,2})[:\.](\d{2})(?:[:\.](\d{2}))?\s*(?:น\.|น)?/;
  const match = text.match(timePattern);
  if (match) {
    const [, hours, minutes] = match;
    return `${hours.padStart(2, '0')}:${minutes}`;
  }
  return null;
}

/**
 * Parse bank name from OCR text
 */
function parseBank(text: string): string | null {
  for (const [bankName, pattern] of Object.entries(bankPatterns)) {
    if (pattern.test(text)) {
      return bankName;
    }
  }
  return null;
}

/**
 * Parse reference number from OCR text
 */
function parseRefNumber(text: string): string | null {
  const patterns = [
    /(?:ref|อ้างอิง|เลขที่)[:\s]*([A-Z0-9]+)/i,
    /(?:transaction|รายการ)[:\s]*([A-Z0-9]+)/i,
    /([A-Z]{2,}\d{10,})/i, // Common ref format
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

/**
 * Main function to parse slip data from OCR text
 */
export function parseSlipText(rawText: string): SlipData {
  return {
    amount: parseAmount(rawText),
    date: parseDate(rawText),
    time: parseTime(rawText),
    senderName: null, // Would need more complex NLP
    receiverName: null,
    bankName: parseBank(rawText),
    refNumber: parseRefNumber(rawText),
    rawText,
  };
}

/**
 * Extract text from image using browser's built-in OCR (if available)
 * or Tesseract.js
 */
export async function extractTextFromImage(imageBase64: string): Promise<string> {
  // For now, return a placeholder - will be replaced with actual OCR
  // Using Tesseract.js or external API
  return '';
}
