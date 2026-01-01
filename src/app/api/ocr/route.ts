import { NextRequest, NextResponse } from 'next/server';
import { parseSlipText } from '@/lib/ocr';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type;
    const imageDataUrl = `data:${mimeType};base64,${base64}`;

    // Use Tesseract.js for OCR (server-side)
    // For production, consider using Google Cloud Vision or AWS Textract
    let extractedText = '';
    
    try {
      // Dynamic import for Tesseract
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(
        imageDataUrl,
        'tha+eng', // Thai and English
        {
          logger: (m) => console.log(m),
        }
      );
      extractedText = result.data.text;
    } catch (ocrError) {
      console.error('OCR Error:', ocrError);
      // Fallback: try to parse any text we can find
      extractedText = '';
    }

    // Parse the extracted text
    const slipData = parseSlipText(extractedText);

    return NextResponse.json({
      success: true,
      data: slipData,
      rawText: extractedText,
    });
  } catch (error) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}
