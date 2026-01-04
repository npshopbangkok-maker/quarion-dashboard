import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

// Simple auth token for Shortcuts (set in Vercel env)
const QUICK_SLIP_TOKEN = process.env.QUICK_SLIP_TOKEN || 'quarion-secret-2024';

export async function POST(request: NextRequest) {
  try {
    // Check authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token !== QUICK_SLIP_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get image from form data
    const formData = await request.formData();
    const file = formData.get('image') as File | null;
    const userId = formData.get('user_id') as string || 'shortcut-user';

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Check OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
      });
    }

    // OCR with OpenAI Vision API
    const ocrResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
  "amount": ตัวเลขจำนวนเงิน (number),
  "date": "YYYY-MM-DD" (ปี ค.ศ.! ถ้าเห็นปี พ.ศ. เช่น 2568 ให้ลบ 543),
  "type": "income" หรือ "expense" (ถ้าเป็นการโอนออก/จ่ายเงิน = expense, ถ้ารับเงิน = income),
  "description": "คำอธิบายสั้นๆ เช่น โอนเงินไปบัญชี xxx หรือ รับเงินจาก xxx",
  "bankName": "ชื่อธนาคาร"
}

ถ้าอ่านไม่ได้: {"error": "ไม่สามารถอ่านสลิปได้"}`
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

    if (!ocrResponse.ok) {
      const errorData = await ocrResponse.json();
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || 'OCR failed',
      });
    }

    const ocrResult = await ocrResponse.json();
    const content = ocrResult.choices[0]?.message?.content || '';

    // Parse JSON response
    let slipData;
    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      slipData = JSON.parse(jsonStr);
      
      if (slipData.error) {
        return NextResponse.json({
          success: false,
          error: slipData.error,
        });
      }
    } catch {
      return NextResponse.json({
        success: false,
        error: 'ไม่สามารถอ่านข้อมูลจากสลิปได้',
      });
    }

    // Determine category based on type
    const category = slipData.type === 'income' ? 'รายได้อื่นๆ' : 'ค่าใช้จ่ายทั่วไป';
    
    // Create transaction data
    const transactionData = {
      type: slipData.type || 'expense',
      amount: slipData.amount || 0,
      category: category,
      description: slipData.description || `สลิปจาก ${slipData.bankName || 'ธนาคาร'}`,
      date: slipData.date || new Date().toISOString().split('T')[0],
      created_by: userId,
      slip_url: null as string | null,
    };

    // Upload slip to Supabase Storage
    if (supabase) {
      const fileName = `quick-slip-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
      const filePath = `slips/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('transaction-slips')
        .upload(filePath, buffer, {
          contentType: mimeType,
        });

      if (!uploadError) {
        const { data: urlData } = supabase.storage
          .from('transaction-slips')
          .getPublicUrl(filePath);
        transactionData.slip_url = urlData.publicUrl;
      }

      // Save transaction to database
      const { data: savedTransaction, error: dbError } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        return NextResponse.json({
          success: false,
          error: 'บันทึกข้อมูลไม่สำเร็จ: ' + dbError.message,
        });
      }

      return NextResponse.json({
        success: true,
        message: `บันทึกสำเร็จ! ${slipData.type === 'income' ? 'รายรับ' : 'รายจ่าย'} ฿${slipData.amount?.toLocaleString()}`,
        data: {
          id: savedTransaction.id,
          type: transactionData.type,
          amount: transactionData.amount,
          category: transactionData.category,
          description: transactionData.description,
          date: transactionData.date,
        },
      });
    } else {
      // No Supabase - return OCR result only
      return NextResponse.json({
        success: true,
        message: `อ่านสลิปสำเร็จ (ไม่ได้บันทึก - Supabase ไม่ได้ config)`,
        data: slipData,
      });
    }

  } catch (error) {
    console.error('Quick Slip API Error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

// GET endpoint to test if API is working
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Quick Slip API พร้อมใช้งาน',
    usage: 'POST /api/quick-slip with form-data: image (file), user_id (optional)',
    auth: 'Header: Authorization: Bearer <QUICK_SLIP_TOKEN>',
  });
}
