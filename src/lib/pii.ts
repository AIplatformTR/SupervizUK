export interface RedactionResult {
  redactedText: string;
  replacementsCount: number;
  detectedItems: string[];
}

/**
 * Lightweight client-side PII redactor for UK educational psychology notes.
 * Replaces explicit pupil name (if provided), UK postcodes, dates of birth,
 * emails, and UK phone numbers before sending text to AI.
 */
export function redactPII(
  text: string,
  pupilName?: string,
  alias = "Pupil A"
): RedactionResult {
  let result = text;
  const detectedItems: string[] = [];

  if (pupilName && pupilName.trim().length >= 2) {
    const parts = pupilName
      .trim()
      .split(/\s+/)
      .filter((p) => p.length >= 2);
    for (const part of parts) {
      const escaped = part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "gi");
      if (re.test(result)) {
        detectedItems.push(`Name ("${part}")`);
        result = result.replace(re, alias);
      }
    }
  }

  // Emails
  const emailRe = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
  if (emailRe.test(result)) {
    detectedItems.push("Email address");
    result = result.replace(emailRe, "[EMAIL REDACTED]");
  }

  // UK Postcodes
  const postcodeRe = /\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/gi;
  if (postcodeRe.test(result)) {
    detectedItems.push("UK Postcode");
    result = result.replace(postcodeRe, "[POSTCODE REDACTED]");
  }

  // UK Phone numbers
  const phoneRe = /\b(?:\+44\s?7\d{3}|\(?07\d{3}\)?)\s?\d{3}\s?\d{3}\b/g;
  if (phoneRe.test(result)) {
    detectedItems.push("Phone number");
    result = result.replace(phoneRe, "[PHONE REDACTED]");
  }

  // Dates of birth (DD/MM/YYYY or DD.MM.YYYY)
  const dobRe = /\b(0?[1-9]|[12]\d|3[01])[\/.-](0?[1-9]|1[0-2])[\/.-](19|20)\d{2}\b/g;
  if (dobRe.test(result)) {
    detectedItems.push("Date / DOB");
    result = result.replace(dobRe, "[DATE REDACTED]");
  }

  return {
    redactedText: result,
    replacementsCount: detectedItems.length,
    detectedItems,
  };
}
