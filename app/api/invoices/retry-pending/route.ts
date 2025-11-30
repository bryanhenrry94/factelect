import { NextResponse } from "next/server";
import { retryPendingAuthorizations } from "@/actions/sri";

/**
 * POST /api/invoices/retry-pending
 * Procesa y reenvía comprobantes con estado "PENDING_AUTHORIZATION" al SRI
 */
export async function POST() {
  try {
    await retryPendingAuthorizations();

    // 3️⃣ Retornar resumen
    return NextResponse.json(
      {
        message: "Retry process completed.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error retrying invoices:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
