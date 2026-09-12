import { NextRequest } from "next/server";
import { getCase, subscribe } from "@/lib/store";
import type { Case } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ caseId: string }> }) {
  const { caseId } = await params;

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | null = null;
  let keepAlive: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (c: Case) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(c)}\n\n`));
      };

      try {
        const current = await getCase(caseId);
        if (current) send(current);
      } catch (err) {
        // Named "config_error" (not "error") — EventSource reserves the
        // "error" event name for transport-level failures, so a same-named
        // application event would collide with source.onerror.
        controller.enqueue(
          encoder.encode(`event: config_error\ndata: ${JSON.stringify({ error: (err as Error).message })}\n\n`),
        );
      }

      unsubscribe = subscribe(caseId, send);

      keepAlive = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);
    },
    cancel() {
      if (unsubscribe) unsubscribe();
      if (keepAlive) clearInterval(keepAlive);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
