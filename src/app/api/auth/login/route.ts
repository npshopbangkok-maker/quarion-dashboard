import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอก username และ password' },
        { status: 400 }
      );
    }

    const user = authenticate(username, password);

    if (user) {
      return NextResponse.json({
        success: true,
        user,
        message: 'เข้าสู่ระบบสำเร็จ'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Username หรือ Password ไม่ถูกต้อง' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' },
      { status: 500 }
    );
  }
}
