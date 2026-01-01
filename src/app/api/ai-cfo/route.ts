import { NextRequest, NextResponse } from 'next/server';

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  incomeByCategory: { [key: string]: number };
  expenseByCategory: { [key: string]: number };
  monthlyTrend: { month: string; income: number; expense: number; profit: number }[];
  recentTransactions: { date: string; type: string; amount: number; category: string }[];
}

export async function POST(request: NextRequest) {
  try {
    const { mode, data, question } = await request.json();

    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      return NextResponse.json({
        success: false,
        error: 'OPENAI_API_KEY not configured',
      });
    }

    const summary = data as TransactionSummary;

    // Build context about financial data
    const financialContext = `
คุณคือ AI CFO (Chief Financial Officer) ที่ปรึกษาการเงินส่วนตัวของธุรกิจ
ข้อมูลทางการเงินปัจจุบัน:

📊 สรุปภาพรวม:
- รายรับรวม: ฿${summary.totalIncome.toLocaleString()}
- รายจ่ายรวม: ฿${summary.totalExpense.toLocaleString()}
- กำไรสุทธิ: ฿${summary.profit.toLocaleString()} (${summary.profit >= 0 ? 'กำไร' : 'ขาดทุน'})
- อัตรากำไร: ${summary.totalIncome > 0 ? ((summary.profit / summary.totalIncome) * 100).toFixed(1) : 0}%

📈 รายรับแยกตามหมวดหมู่:
${Object.entries(summary.incomeByCategory).map(([cat, amt]) => `- ${cat}: ฿${amt.toLocaleString()}`).join('\n') || '- ไม่มีข้อมูล'}

📉 รายจ่ายแยกตามหมวดหมู่:
${Object.entries(summary.expenseByCategory).map(([cat, amt]) => `- ${cat}: ฿${amt.toLocaleString()}`).join('\n') || '- ไม่มีข้อมูล'}

📅 แนวโน้มรายเดือน (ล่าสุด):
${summary.monthlyTrend.slice(-3).map(m => `- ${m.month}: รับ ฿${m.income.toLocaleString()} / จ่าย ฿${m.expense.toLocaleString()} / กำไร ฿${m.profit.toLocaleString()}`).join('\n') || '- ไม่มีข้อมูล'}
`;

    let systemPrompt = '';
    let userPrompt = '';

    if (mode === 'insight') {
      systemPrompt = `${financialContext}

คุณต้องวิเคราะห์ข้อมูลและให้คำแนะนำเชิงกลยุทธ์ ตอบเป็นภาษาไทย กระชับ ชัดเจน
ให้คำตอบเป็น JSON format ดังนี้:
{
  "summary": "สรุปสถานะการเงินใน 1-2 ประโยค",
  "healthScore": ตัวเลข 1-100 (คะแนนสุขภาพการเงิน),
  "insights": [
    { "type": "positive|warning|danger|tip", "title": "หัวข้อ", "detail": "รายละเอียด" }
  ],
  "recommendations": ["คำแนะนำ 1", "คำแนะนำ 2", "คำแนะนำ 3"]
}

ให้ insights อย่างน้อย 3-5 ข้อ และ recommendations 3 ข้อ
type: positive=ดี, warning=ควรระวัง, danger=อันตราย, tip=เคล็ดลับ`;

      userPrompt = 'วิเคราะห์สถานะการเงินและให้คำแนะนำ';
    } else {
      // Chat mode
      systemPrompt = `${financialContext}

คุณคือ AI CFO ที่ปรึกษาการเงินที่เป็นมิตร ตอบคำถามเกี่ยวกับการเงินของธุรกิจ
- ตอบเป็นภาษาไทย กระชับ เข้าใจง่าย
- ใช้ข้อมูลที่มีในการตอบ
- ถ้าไม่มีข้อมูลเพียงพอ ให้บอกตรงๆ
- ให้คำแนะนำที่ปฏิบัติได้จริง
- ใช้ emoji เพื่อความเป็นมิตร`;

      userPrompt = question || 'สรุปสถานะการเงินให้หน่อย';
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API Error:', errorData);
      return NextResponse.json({
        success: false,
        error: errorData.error?.message || 'API error',
      });
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';

    if (mode === 'insight') {
      try {
        // Parse JSON response
        let jsonStr = content.trim();
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        }
        const insightData = JSON.parse(jsonStr);
        return NextResponse.json({ success: true, mode: 'insight', data: insightData });
      } catch (e) {
        console.error('JSON parse error:', e);
        return NextResponse.json({ 
          success: true, 
          mode: 'chat', 
          data: { message: content } 
        });
      }
    } else {
      return NextResponse.json({ 
        success: true, 
        mode: 'chat', 
        data: { message: content } 
      });
    }

  } catch (error) {
    console.error('AI CFO Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request', success: false },
      { status: 500 }
    );
  }
}
