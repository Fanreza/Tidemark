// Generate a two-party agreement PDF with two clearly labeled signature blocks.
// Run: node scripts/gen-2sign-pdf.mjs
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { writeFileSync } from 'fs'

const doc = await PDFDocument.create()
const page = doc.addPage([612, 792]) // US Letter
const { width } = page.getSize()

const font = await doc.embedFont(StandardFonts.Helvetica)
const bold = await doc.embedFont(StandardFonts.HelveticaBold)

const ink = rgb(0.12, 0.12, 0.12)
const muted = rgb(0.4, 0.4, 0.4)
const margin = 72

function text(s, x, y, size = 11, f = font, color = ink) {
  page.drawText(s, { x, y, size, font: f, color })
}

let y = 720

// ── Header ──────────────────────────────────────────────────────────────────
text('TIDEMARK', margin, y, 10, bold, muted)
y -= 30
text('MUTUAL AGREEMENT', margin, y, 18, bold)
y -= 22
text('Two-Party Service Agreement', margin, y, 11, font, muted)
y -= 14
text('Agreement No: TM-2025-002      Date: May 20, 2025', margin, y, 9, font, muted)

// ── Parties ───────────────────────────────────────────────────────────────────
y -= 36
text('PARTIES', margin, y, 12, bold)
y -= 20
for (const line of [
  'This Agreement is entered into between two parties who each agree to the',
  'terms set out below and confirm their acceptance by signing in the marked',
  'areas at the bottom of this document.',
  '',
  'Party A: Acme Corporation — represented by John Doe, CEO.',
  'Party B: PT Teknologi Maju — represented by Jane Smith, Director.',
]) {
  text(line, margin, y, 11)
  y -= 16
}

// ── Terms ─────────────────────────────────────────────────────────────────────
y -= 14
text('TERMS', margin, y, 12, bold)
y -= 20
for (const line of [
  '1. Both parties agree to collaborate on the project described in Schedule A.',
  '2. The engagement runs from June 1, 2025 to November 30, 2025.',
  '3. Total contract value: USD 48,000, paid in monthly installments.',
  '4. All project information is kept confidential for a period of 3 years.',
  '5. This Agreement becomes effective only when BOTH parties have signed.',
]) {
  text(line, margin, y, 11)
  y -= 16
}

// ── Signature blocks ───────────────────────────────────────────────────────────
const blockY = 150
const lineY = blockY + 40
const colW = (width - margin * 2 - 40) / 2
const leftX = margin
const rightX = margin + colW + 40

text('SIGNATURES', margin, blockY + 90, 12, bold)
text('Each party signs in their own box below.', margin, blockY + 74, 9, font, muted)

for (const [x, label, who] of [
  [leftX, 'Party A', 'John Doe — Acme Corporation'],
  [rightX, 'Party B', 'Jane Smith — PT Teknologi Maju'],
]) {
  // signature area box
  page.drawRectangle({
    x, y: lineY - 6, width: colW, height: 56,
    borderColor: rgb(0.7, 0.7, 0.7), borderWidth: 1,
    color: rgb(0.98, 0.98, 0.98),
  })
  text(`Sign here — ${label}`, x + 8, lineY + 34, 8, font, muted)
  // signature line
  page.drawLine({
    start: { x, y: lineY - 16 }, end: { x: x + colW, y: lineY - 16 },
    thickness: 1, color: ink,
  })
  text(who, x, lineY - 30, 9, font, muted)
  text('Date: ______________', x, lineY - 46, 9, font, muted)
}

const bytes = await doc.save()
writeFileSync('public/two-party-agreement.pdf', bytes)
console.log('Created: public/two-party-agreement.pdf')
