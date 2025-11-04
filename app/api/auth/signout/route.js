import { signOut } from '../../../libs/auth-supabase';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    await signOut();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

