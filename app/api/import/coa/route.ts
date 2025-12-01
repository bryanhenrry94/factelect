import { NextResponse } from "next/server";
import { importCOAFromSupabase } from "@/actions/import-coa";

export async function GET() {
  const result = await importCOAFromSupabase();

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}
