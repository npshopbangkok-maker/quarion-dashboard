import { NextRequest, NextResponse } from 'next/server';

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

    // Check if OpenAI API key is configured
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
        data: null,
      });
    }

    // Use OpenAI Vision API to read the slip
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `อ่านสลิปโอนเงินนี้และตอบเป็น JSON เท่านั้น ห้ามมีข้อความอื่น:
{
  "amount": ตัวเลขจำนวนเงิน (number, ไม่มีเครื่องหมาย),
  "date": "YYYY-MM-DD" (ถ้าไม่มีให้ใส่ null),
  "time": "HH:MM" (ถ้าไม่มีให้ใส่ null),
  "bankName": "ชื่อธนาคาร" (ถ้าไม่มีให้ใส่ null),
  "refNumber": "เลขอ้างอิง" (ถ้าไม่มีให้ใส่ null)
}

ถ้าอ่านไม่ได้หรือไม่ใช่สลิป ให้ตอบ: {"error": "ไม่สามารถอ่านสลิปได้"}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json({
        success: false,
        error: 'OpenAI API error',
        data: null,
      });
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';
    
    // Parse the JSON response
    try {
      // Remove markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      
      const slipData = JSON.parse(jsonStr);
      
      if (slipData.error) {
        return NextResponse.json({
          success: false,
          error: slipData.error,
          data: null,
        });
      }

      return NextResponse.json({
        success: true,
        data: {
          amount: slipData.amount || null,
          date: slipData.date || null,
          time: slipData.time || null,
          bankName: slipData.bankName || null,
          refNumber: slipData.refNumber || null,
        },
      });
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError, 'Content:', content);
      return NextResponse.json({
        success: false,
        error: 'ไม่สามารถอ่านข้อมูลจากสลิปได้',
        data: null,
      });
    }
  } catch (error) {
    console.error('OCR API Error:', error);
    return NextResponse.json(
      { error: 'Failed to process image', success: false },
      { status: 500 }
    );
  }
}
