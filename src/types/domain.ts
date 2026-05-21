export type PromptMode = 'gpt' | 'claude' | 'midjourney' | 'coding' | 'marketing';
export type OptimizerGoal = 'writing' | 'coding' | 'marketing' | 'analysis' | 'image' | 'automation';
export type OptimizerAudience = 'general' | 'beginner' | 'expert' | 'customer' | 'management' | 'developer';
export type OptimizerTone = 'precise' | 'professional' | 'creative' | 'concise' | 'detailed' | 'persuasive';
export type OptimizerFormat = 'markdown' | 'list' | 'table' | 'json' | 'steps' | 'freeform';
export type OptimizerStrength = 'fast' | 'balanced' | 'premium';
export type AiProvider = 'anthropic' | 'local';
export type ThemeMode = 'light' | 'dark' | 'system';
export type LicenseStatus = 'inactive' | 'active' | 'grace' | 'expired';

export interface OptimizerPreferences {
  goal: OptimizerGoal;
  audience: OptimizerAudience;
  tone: OptimizerTone;
  format: OptimizerFormat;
  strength: OptimizerStrength;
  language: 'auto' | 'de' | 'en';
  askClarifyingQuestions: boolean;
}

export interface Prompt {
  id?: string;
  title: string;
  content: string;
  optimizedContent: string;
  categoryId: string;
  tabId: string;
  tags: string[];
  favorite: boolean;
  version: number;
  history: PromptRevision[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptRevision {
  id: string;
  content: string;
  optimizedContent: string;
  createdAt: string;
}

export interface Category {
  id?: string;
  name: string;
  color: string;
  tabId: string;
  position: number;
}

export interface WorkspaceTab {
  id?: string;
  name: string;
  position: number;
}

export interface Settings {
  id: 'app';
  apiKeys: {
    anthropic?: string;
    license?: string;
  };
  theme: ThemeMode;
  language: 'de' | 'en';
  anthropicModel: string;
  license: {
    key?: string;
    token?: string;
    status: LicenseStatus;
    lastValidatedAt?: string;
    graceUntil?: string;
  };
  backup: {
    autoBackup: boolean;
    lastBackupAt?: string;
  };
}

export interface ImportPayload {
  version: string;
  prompts: Array<Partial<Prompt> & { category?: string; tab?: string; optimized?: string }>;
  categories?: Category[];
  tabs?: WorkspaceTab[];
}
