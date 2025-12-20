import { NextResponse } from 'next/server';

// This is a deprecated route. We keep it here to prevent build errors
// until the file can be properly deleted.
export async function GET() {
  return NextResponse.json({ message: "This endpoint is deprecated." }, { status: 410 });
}