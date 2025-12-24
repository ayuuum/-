export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface Profile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  plan_type: 'trial' | 'basic' | 'standard' | 'pro' | 'enterprise';
  generation_count: number;
  subscription_ends_at?: string;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  original_url: string;
  generated_url?: string;
  status: GenerationStatus;
  prompt?: string;
  style: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface AppState {
  profile: Profile | null;
  generations: Generation[];
  isGenerating: boolean;
  setProfile: (profile: Profile | null) => void;
  setGenerations: (generations: Generation[]) => void;
  addGeneration: (generation: Generation) => void;
  updateGeneration: (id: string, updates: Partial<Generation>) => void;
  setIsGenerating: (isGenerating: boolean) => void;
}
