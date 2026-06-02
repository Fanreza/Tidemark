import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export interface SignatureField {
  x_pct: number
  y_pct: number
  page?: number
}

export function usePdfSigner() {
  async function embedSignature(
    pdfBytes: ArrayBuffer,
    opts: {
      signerEmail: string
      signerWallet?: string
      txHash?: string
      signedAt?: string
      field?: SignatureField
    },
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()

    const pageIndex = opts.field?.page && opts.field.page > 0
      ? Math.min(opts.field.page - 1, pages.length - 1)
      : pages.length - 1
    const targetPage = pages[pageIndex]!
    const { width, height } = targetPage.getSize()

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    const boxW = 240
    const boxH = 76

    let x: number
    let y: number

    if (opts.field) {
      x = (opts.field.x_pct / 100) * width - boxW / 2
      y = height - (opts.field.y_pct / 100) * height - boxH / 2
    } else {
      const margin = 28
      x = width - boxW - margin
      y = margin
    }

    x = Math.max(4, Math.min(x, width - boxW - 4))
    y = Math.max(4, Math.min(y, height - boxH - 4))

    targetPage.drawRectangle({
      x: x + 2, y: y - 2,
      width: boxW, height: boxH,
      color: rgb(0.75, 0.75, 0.75),
      opacity: 0.35,
    })

    targetPage.drawRectangle({
      x, y, width: boxW, height: boxH,
      color: rgb(0.96, 1, 0.97),
      borderColor: rgb(0.18, 0.64, 0.36),
      borderWidth: 1.5,
    })

    targetPage.drawRectangle({
      x, y, width: 4, height: boxH,
      color: rgb(0.18, 0.64, 0.36),
    })

    targetPage.drawText('Digitally Signed', {
      x: x + 12, y: y + boxH - 18,
      size: 9, font: boldFont,
      color: rgb(0.1, 0.45, 0.22),
    })

    const dateStr = opts.signedAt
      ? new Date(opts.signedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
      : new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })

    targetPage.drawText(`By: ${opts.signerEmail}`, {
      x: x + 12, y: y + boxH - 33,
      size: 7.5, font,
      color: rgb(0.15, 0.15, 0.15),
    })

    targetPage.drawText(`Date: ${dateStr}`, {
      x: x + 12, y: y + boxH - 47,
      size: 7.5, font,
      color: rgb(0.15, 0.15, 0.15),
    })

    if (opts.txHash) {
      const shortHash = `${opts.txHash.slice(0, 18)}...${opts.txHash.slice(-6)}`
      targetPage.drawText(`TX: ${shortHash}`, {
        x: x + 12, y: y + boxH - 61,
        size: 6.5, font,
        color: rgb(0.45, 0.45, 0.45),
      })
    }

    targetPage.drawText('Tidemark · Verified on blockchain', {
      x: x + 12, y: y + 8,
      size: 5.5, font,
      color: rgb(0.6, 0.6, 0.6),
    })

    return pdfDoc.save()
  }

  async function embedDrawnSignature(
    pdfBytes: ArrayBuffer,
    opts: {
      dataUrl: string
      x_pct: number
      y_pct: number
      page?: number
      signerEmail: string
      txHash?: string
      signedAt: string
    },
  ): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.load(pdfBytes)
    const pages = pdfDoc.getPages()
    const pageIndex = opts.page != null
      ? Math.max(0, Math.min(opts.page, pages.length - 1))
      : 0
    const targetPage = pages[pageIndex]!
    const { width, height } = targetPage.getSize()

    // Convert data URL to PNG bytes
    const base64 = opts.dataUrl.split(',')[1]!
    const binaryStr = atob(base64)
    const imgBytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) {
      imgBytes[i] = binaryStr.charCodeAt(i)
    }

    const pngImage = await pdfDoc.embedPng(imgBytes)

    const imgW = 160
    const imgH = 60

    // Browser top-left → PDF bottom-left
    let x = (opts.x_pct / 100) * width - imgW / 2
    let y = height - (opts.y_pct / 100) * height - imgH / 2

    x = Math.max(4, Math.min(x, width - imgW - 4))
    y = Math.max(4, Math.min(y, height - imgH - 4))

    // Just the drawn signature image — nothing else
    targetPage.drawImage(pngImage, { x, y, width: imgW, height: imgH })

    // Thin underline below signature
    targetPage.drawRectangle({
      x, y: y - 1,
      width: imgW, height: 0.75,
      color: rgb(0.3, 0.3, 0.3),
    })

    return pdfDoc.save()
  }

  return { embedSignature, embedDrawnSignature }
}
