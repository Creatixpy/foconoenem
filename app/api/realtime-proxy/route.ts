import { NextRequest, NextResponse } from 'next/server';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/db/server';

export const runtime = 'nodejs';

const encoder = new TextEncoder();
const STREAM_HEADERS = {
  'Content-Type': 'text/event-stream',
  Connection: 'keep-alive',
  'Cache-Control': 'no-cache, no-transform',
  'Transfer-Encoding': 'chunked',
};

/**
 * Proxy SSE-only para Supabase Realtime. O runtime Node.js da App Router ainda não aceita upgrade
 * direto para WebSocket nesta rota, então o backend mantém a conexão websocket com o Realtime e
 * retransmite para o navegador via Server-Sent Events com EventSource.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topicId = searchParams.get('topicId');
  const postId = searchParams.get('postId') ?? undefined;

  if (!topicId) {
    return NextResponse.json({ error: 'topicId é obrigatório.' }, { status: 400 });
  }

  // I02: Use server client with user's auth context instead of admin
  const supabase = await createServerClient();

  let cleanupRef: (() => void) | null = null;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const send = (event: string, payload: unknown) => {
        if (closed) {
          return;
        }
        const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload);
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${serialized}\n\n`));
      };

      let channel: RealtimeChannel | null = null;
      const commentFilter = postId ? `post_id=eq.${postId}` : undefined;
      const heartbeat = setInterval(() => {
        send('ping', { ts: Date.now() });
      }, 30000);

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        request.signal.removeEventListener('abort', onAbort);
        if (channel) {
          try {
            supabase.removeChannel(channel);
          } catch (removeError) {
            console.error('Erro ao remover canal Realtime', removeError);
          }
        }
        controller.close();
      };
      cleanupRef = cleanup;

      const onAbort = () => cleanup();
      request.signal.addEventListener('abort', onAbort, { once: true });

      channel = supabase
        .channel(`community-feed-${topicId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'community_posts', filter: `topic_id=eq.${topicId}` },
          (payload) => send('post_insert', { new: payload.new })
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'community_comments',
            ...(commentFilter ? { filter: commentFilter } : {}),
          },
          (payload) => send('comment_insert', { new: payload.new })
        );

      channel.subscribe((status, error) => {
        send('status', { status, topicId, postId });
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          send('proxy_error', { message: error?.message ?? 'Erro ao assinar canal Realtime.' });
          cleanup();
        }
        if (status === 'CLOSED') {
          cleanup();
        }
      });
    },
    cancel() {
      cleanupRef?.();
    },
  });

  return new Response(stream, { headers: STREAM_HEADERS });
}
