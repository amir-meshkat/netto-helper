export interface ParseOptions {
  /** Treat a single "." or "," as a decimal separator, never as thousands. Use for percentages. */
  decimalOnly?: boolean;
}

/**
 * Reads a number the way people type it in the Netherlands and elsewhere:
 * "3500", "3.500", "3,500", "€ 3.500,50" and "3,500.50" all work.
 * A single separator followed by exactly three digits is read as thousands ("3.500" = 3500).
 * Returns null when the text holds no number.
 */
export function parseNumber(text: string, options: ParseOptions = {}): number | null {
  let s = text.replace(/,-$/, "").replace(/[^\d.,-]/g, "");
  if (!/\d/.test(s)) return null;

  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    const decimal = lastDot > lastComma ? "." : ",";
    const thousands = decimal === "." ? "," : ".";
    s = s.split(thousands).join("").replace(decimal, ".");
  } else if (lastDot >= 0 || lastComma >= 0) {
    const separator = lastDot >= 0 ? "." : ",";
    const pieces = s.split(separator);
    const looksLikeThousands = pieces.length > 2 || (pieces[1]?.length === 3 && pieces[0] !== "0" && pieces[0] !== "");
    s = !options.decimalOnly && looksLikeThousands ? pieces.join("") : pieces.join(".");
  }

  const value = Number(s);
  return Number.isFinite(value) ? value : null;
}
