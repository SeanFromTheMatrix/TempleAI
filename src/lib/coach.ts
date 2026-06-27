import { supabase } from './supabase';

// Client side of the coach service (Master Build Spec §5.2 / §7). The Edge Function owns the
// model, memory, and safety; this module just (a) loads the one persistent thread and (b) sends a
// turn. `functions.invoke` automatically attaches the signed-in user's JWT, which the function
// uses to scope every read/write to that user (RLS).

export type CoachCard = {
  kind: 'session';
  session_id: string;
  title: string;
  done: number;
  total: number;
  duration: number | null;
};

export type ThreadMessage = {
  id: string;
  sender: 'coach' | 'user';
  text: string;
  card: CoachCard | null;
  created_at: string;
};

export type CoachReply = {
  reply: string;
  card: CoachCard | null;
  flagged: boolean;
  model: string;
  message_id: string | null;
  created_at: string | null;
};

// Load the user's single coach thread, oldest→newest. Empty until the first turn is sent.
export async function getThreadMessages(userId: string): Promise<ThreadMessage[]> {
  const { data: thread } = await supabase
    .from('coach_threads')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  if (!thread?.id) return [];

  const { data } = await supabase
    .from('messages')
    .select('id, sender, text, card, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true });
  return (data as ThreadMessage[]) ?? [];
}

// Send one turn. Throws on transport/function error so the UI can surface it and roll back the
// optimistic bubble. The function persists both the user turn and the coach reply.
export async function sendCoachMessage(message: string): Promise<CoachReply> {
  const { data, error } = await supabase.functions.invoke('coach', { body: { message } });
  if (error) throw error;
  if (!data || (data as any).error) {
    throw new Error((data as any)?.error ?? 'coach_unavailable');
  }
  return data as CoachReply;
}
