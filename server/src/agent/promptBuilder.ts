export interface UserProfileContext {
  name?: string;
  preferredName?: string;
  timezone?: string;
  profession?: string;
  communicationStyle?: string;
  aiPreferences?: string;
}

export interface SystemPromptContext {
  profile?: UserProfileContext | null;
  memories?: string[];
  tasksSummary?: string[];
  availableTools?: string[];
}

export function buildSystemPrompt(context: SystemPromptContext): string {
  const now = new Date().toISOString();
  const userName = context.profile?.preferredName || context.profile?.name || 'User';
  const timezone = context.profile?.timezone || 'UTC';
  const style = context.profile?.communicationStyle || 'concise, direct, highly competent, analytical';

  const sections: string[] = [];

  // 1. Identity & Core Principles
  sections.push(`You are James — a personal AI executive assistant, technical partner, and intelligent digital operating system.
Your mission is to serve ${userName} with exceptional intelligence, accuracy, and operational competence.

### Core Behavioral Guidelines:
- Be direct, context-aware, practical, and precise.
- Do NOT be unnecessarily verbose. Get straight to the point.
- When explaining code or concepts, maintain high technical rigor.
- DISTINGUISH HONESTLY BETWEEN:
  * "I know this." (Verified facts)
  * "I infer this." (Deductions based on available context)
  * "I need more information." (Ambiguous requests)
  * "I performed this action." (Tool call was executed and succeeded)
  * "I cannot currently perform this action." (No tool available or tool failed)
- CRITICAL INTEGRITY RULE: Never claim to have created a task, sent an email, or saved a memory unless an actual tool was called and confirmed in the database.`);

  // 2. Current Context & Time
  sections.push(`### Current System Context:
- Current Timestamp: ${now}
- User Timezone: ${timezone}
- Active User: ${userName}
- Communication Style Preference: ${style}`);

  // 3. User Profile
  if (context.profile) {
    const profileItems = [
      context.profile.profession ? `Profession: ${context.profile.profession}` : null,
      context.profile.aiPreferences ? `AI Preferences: ${context.profile.aiPreferences}` : null,
    ].filter(Boolean);

    if (profileItems.length > 0) {
      sections.push(`### User Profile Details:\n${profileItems.join('\n')}`);
    }
  }

  // 4. Relevant Long-Term Memories
  if (context.memories && context.memories.length > 0) {
    sections.push(
      `### Long-Term Memories & Saved Preferences about ${userName}:\n` +
      context.memories.map((m, idx) => `${idx + 1}. ${m}`).join('\n')
    );
  }

  // 5. Active User Tasks (Phase 3)
  if (context.tasksSummary && context.tasksSummary.length > 0) {
    sections.push(
      `### Active Tasks on Record for ${userName}:\n` +
      context.tasksSummary.map((t, idx) => `${idx + 1}. ${t}`).join('\n')
    );
  }

  // 6. Available Registered Tools
  if (context.availableTools && context.availableTools.length > 0) {
    sections.push(
      `### Registered Tools:\n${context.availableTools.join(', ')}`
    );
  }

  return sections.join('\n\n');
}
