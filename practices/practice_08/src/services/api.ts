import { TriageRequest, TriageResponse, Issue } from '../types/issue';

const DEFAULT_N8N_WEBHOOK = 'https://n8n-itmo.cyrweb.ru/webhook/test-issue-triage';

export async function triageIssue(
  data: TriageRequest,
  endpoint: string = DEFAULT_N8N_WEBHOOK
): Promise<TriageResponse> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      title: data.title.trim(),
      body: data.body.trim(),
      author: data.author?.trim() || 'contributor',
      action: 'opened',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Ошибка сервиса n8n (${response.status}): ${errorBody || response.statusText}`);
  }

  const rawJson = await response.json();
  const json = Array.isArray(rawJson) ? rawJson[0] : rawJson;
  
  // Format response whether it comes from n8n webhook or mock
  const type = (json.type || 'unknown').toLowerCase();
  const confidence = typeof json.confidence === 'number' ? json.confidence : 0.5;
  const isAmbiguous = type === 'unknown' || confidence < 0.8;
  const label = isAmbiguous ? 'needs-triage' : type;

  return {
    type: (['bug', 'feature', 'task', 'unknown'].includes(type) ? type : 'unknown') as any,
    confidence: confidence,
    reasoning: json.reasoning || (isAmbiguous ? 'Описание расплывчатое, требуется ручной триаж.' : `AI уверенно классифицировал обращение как ${type}.`),
    label: label,
    commentPosted: !isAmbiguous,
    issueId: json.issueId || `#${Math.floor(Math.random() * 900 + 100)}`,
  };
}

export const INITIAL_ISSUES: Issue[] = [
  {
    id: '#4',
    title: '[Bug] Memory leak in WebSocket connection pool',
    body: 'High concurrency leads to java.lang.OutOfMemoryError. Connections are not released back to the pool.',
    author: 'M1kha1l0',
    type: 'bug',
    confidence: 0.95,
    reasoning: 'The issue describes a memory leak resulting in an OutOfMemoryError, which indicates broken behavior in connection pooling.',
    label: 'bug',
    commentPosted: true,
    createdAt: '15 минут назад',
  },
  {
    id: '#6',
    title: '[Feature] Add Prometheus metrics endpoint',
    body: 'Please expose /metrics with latency histograms and active connection counters.',
    author: 'M1kha1l0',
    type: 'feature',
    confidence: 0.95,
    reasoning: 'The issue requests the addition of a new /metrics endpoint, which is a clear request for new functionality.',
    label: 'feature',
    commentPosted: true,
    createdAt: '1 час назад',
  },
  {
    id: '#8',
    title: 'Иногда не работает',
    body: 'Что-то нажимаю и ничего не происходит, почините пожалуйста.',
    author: 'M1kha1l0',
    type: 'unknown',
    confidence: 0.50,
    reasoning: 'Description is completely vague, no error logs or reproduction steps provided.',
    label: 'needs-triage',
    commentPosted: false,
    createdAt: '2 часа назад',
  },
];
