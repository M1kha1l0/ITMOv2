export type IssueType = 'bug' | 'feature' | 'task' | 'unknown';

export interface Issue {
  id: string;
  title: string;
  body: string;
  author: string;
  type: IssueType;
  confidence: number;
  reasoning: string;
  label: string;
  commentPosted: boolean;
  createdAt: string;
}

export interface TriageRequest {
  title: string;
  body: string;
  author?: string;
}

export interface TriageResponse {
  type: IssueType;
  confidence: number;
  reasoning: string;
  label: string;
  commentPosted: boolean;
  issueId?: string;
}

export interface FormErrors {
  title?: string;
  body?: string;
}
