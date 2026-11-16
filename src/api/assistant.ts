import api from './client';
import type { AssistantAnswer, AssistantTurn } from '../types';

/**
 * Optional conversational layer. The backend answers greetings and off-topic
 * questions locally, and falls back to a local provider if no AI key works.
 */
export async function askAssistant(
  question: string,
  history: AssistantTurn[] = []
): Promise<AssistantAnswer> {
  const { data } = await api.post<AssistantAnswer>('/assistant', { question, history });
  return data;
}
