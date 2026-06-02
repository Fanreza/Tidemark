import { writeFileSync } from 'fs'

const lines = [
  'TIDEMARK',
  '',
  'SERVICE AGREEMENT',
  '',
  'Date: May 15, 2025',
  'Agreement No: TM-2025-001',
  '',
  'PARTIES',
  '',
  'This Service Agreement is entered into between:',
  '',
  'Client: Acme Corporation',
  'Address: 123 Business Ave, Jakarta 10110',
  'Represented by: John Doe, CEO',
  '',
  'Service Provider: PT Teknologi Maju',
  'Address: 456 Tech Park, Surabaya 60271',
  'Represented by: Jane Smith, Director',
  '',
  'SCOPE OF WORK',
  '',
  '1. The Service Provider agrees to deliver software',
  '   development services as outlined in Schedule A.',
  '',
  '2. Project duration: June 1, 2025 to November 30, 2025.',
  '',
  '3. Total contract value: USD 48,000',
  '   Payment terms: Monthly installments of USD 8,000.',
  '',
  'CONFIDENTIALITY',
  '',
  'Both parties agree to keep all project details,',
  'technical specifications, and business information',
  'strictly confidential for a period of 3 years.',
  '',
  'SIGNATURES',
  '',
  'By signing below, both parties agree to the terms',
  'and conditions of this agreement.',
  '',
  'Client:                    Service Provider:',
  '',
  '_____________________      _____________________',
  'John Doe                   Jane Smith',
  'Acme Corporation           PT Teknologi Maju',
  '',
  'Date: _______________      Date: _______________',
]

function escape(s) {
  return s.split('\\').join('\\\\').split('(').join('\\(').split(')').join('\\)')
}

let stream = 'BT\n/F1 10 Tf\n72 720 Td\n14 TL\n'
for (const line of lines) {
  stream += '(' + escape(line) + ') Tj T*\n'
}
stream += 'ET'

const slen = Buffer.byteLength(stream, 'latin1')

const o1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
const o2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n'
const o3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n'
const o4 = `4 0 obj\n<< /Length ${slen} >>\nstream\n${stream}\nendstream\nendobj\n`
const o5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n'

const hdr = '%PDF-1.4\n'
const p1 = hdr.length
const p2 = p1 + o1.length
const p3 = p2 + o2.length
const p4 = p3 + o3.length
const p5 = p4 + o4.length
const xrefPos = p5 + o5.length

const pad = n => String(n).padStart(10, '0')
const xref = `xref\n0 6\n0000000000 65535 f \n${pad(p1)} 00000 n \n${pad(p2)} 00000 n \n${pad(p3)} 00000 n \n${pad(p4)} 00000 n \n${pad(p5)} 00000 n \n`
const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`

const pdf = hdr + o1 + o2 + o3 + o4 + o5 + xref + trailer
writeFileSync('public/sample-agreement.pdf', pdf, 'latin1')
console.log('Created: public/sample-agreement.pdf')
