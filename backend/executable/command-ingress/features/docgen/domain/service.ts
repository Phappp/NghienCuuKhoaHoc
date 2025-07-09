import fs from 'fs/promises';
import path from 'path';

export type UseCase = {
  role: string;
  goal: string | { main?: string; main_goal?: string; primary?: string; sub?: string[]; sub_goal?: string; alternative_goal?: string; secondary?: string };
  tasks: string[];
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
  context?: string;
  priority?: string;
  feedback?: string;
  rules?: string[];
  triggers?: string[];
};

export type DocumentSection = {
  id: string;
  type: 'usecase' | 'userstory';
  role: string;
  goal: string;
  content: string;
  raw: Record<string, any>;
};

export class DocumentGeneratorService {
  private normalizeGoal(goal: any): string {
    if (typeof goal === 'string') return goal;
    return goal?.main || goal?.main_goal || goal?.primary || '[Missing Goal]';
  }

  private formatGoalBlock(goal: any): string {
    if (typeof goal === 'string') return goal;
    const main = goal?.main || goal?.main_goal || goal?.primary || '[Missing Goal]';
    const subs: string[] = [];
    if (Array.isArray(goal?.sub)) subs.push(...goal.sub);
    if (goal?.sub_goal) subs.push(goal.sub_goal);
    if (goal?.alternative_goal) subs.push(goal.alternative_goal);
    if (goal?.secondary) subs.push(goal.secondary);
    return subs.length > 0 ? `${main}
- ${subs.join('\n- ')}` : main;
  }

  private joinIfArray(arr: any[], prefix = '- '): string {
    return Array.isArray(arr) && arr.length ? `${prefix}${arr.join(`\n${prefix}`)}` : '';
  }

  async generate(useCases: UseCase[], options: { useCaseSpec?: boolean; userStory?: boolean }) {
    let result = '';

    for (const uc of useCases) {
      const goalBlock = this.formatGoalBlock(uc.goal);
      const goalStr = this.normalizeGoal(uc.goal);
      const title = `## ${goalBlock} (${uc.role})\n`;

      if (options.useCaseSpec) {
        result += `${title}`;
        result += `**Actor:** ${uc.role}\n`;
        result += `**Goal:** ${goalBlock}\n`;
        result += `**Priority:** ${uc.priority || 'medium'}\n`;
        result += `**Context:** ${uc.context || ''}\n`;
        result += `\n### Tasks\n${this.joinIfArray(uc.tasks)}\n`;
        if (uc.inputs) result += `\n### Inputs\n\`\`\`json\n${JSON.stringify(uc.inputs, null, 2)}\n\`\`\`\n`;
        if (uc.outputs) result += `\n### Outputs\n\`\`\`json\n${JSON.stringify(uc.outputs, null, 2)}\n\`\`\`\n`;
        if (Array.isArray(uc.rules)) result += `\n### Rules\n${this.joinIfArray(uc.rules)}\n`;
        if (Array.isArray(uc.triggers)) result += `\n### Triggers\n${this.joinIfArray(uc.triggers)}\n`;
        if (uc.feedback) result += `\n### Feedback\n${uc.feedback}\n`;
        result += '\n---\n';
      }

      if (options.userStory) {
        result += `\n### User Story: ${goalStr}\n`;
        result += `> **As a** ${uc.role}\n> **I want to** ${goalStr}\n> **So that** I can achieve my goal.\n\n`;
        result += `#### Acceptance Criteria\n${this.joinIfArray(uc.tasks, '- [ ] ')}\n`;
        if (uc.feedback) result += `\n#### Feedback\n${uc.feedback}\n`;
        if (uc.priority) result += `\n#### Priority\n${uc.priority}\n`;
        if (Array.isArray(uc.triggers)) result += `\n#### Triggers\n${this.joinIfArray(uc.triggers)}\n`;
        result += '\n---\n';
      }
    }

    const filePath = path.join(__dirname, '../../../output/usecase_doc.md');
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, result, 'utf-8');
    return filePath;
  }

  async generateToJson(useCases: UseCase[], options: { useCaseSpec?: boolean; userStory?: boolean }): Promise<DocumentSection[]> {
    const result: DocumentSection[] = [];
    let ucIndex = 1, usIndex = 1;

    for (const uc of useCases) {
      const goalBlock = this.formatGoalBlock(uc.goal);
      const goalStr = this.normalizeGoal(uc.goal);

      if (options.useCaseSpec) {
        const id = `UC-${String(ucIndex).padStart(3, '0')}`;
        const content = `## Use Case: ${goalBlock}\n**Actor:** ${uc.role}\n**Priority:** ${uc.priority || 'medium'}\n**Context:** ${uc.context || ''}\n` +
          `\n### Tasks\n${this.joinIfArray(uc.tasks)}` +
          (uc.inputs ? `\n### Inputs\n\`\`\`json\n${JSON.stringify(uc.inputs, null, 2)}\n\`\`\`` : '') +
          (uc.outputs ? `\n### Outputs\n\`\`\`json\n${JSON.stringify(uc.outputs, null, 2)}\n\`\`\`` : '') +
          (Array.isArray(uc.rules) ? `\n### Rules\n${this.joinIfArray(uc.rules)}` : '') +
          (Array.isArray(uc.triggers) ? `\n### Triggers\n${this.joinIfArray(uc.triggers)}` : '') +
          (uc.feedback ? `\n### Feedback\n${uc.feedback}` : '');

        result.push({ id, type: 'usecase', role: uc.role, goal: goalStr, content, raw: uc });
        ucIndex++;
      }

      if (options.userStory) {
        const id = `US-${String(usIndex).padStart(3, '0')}`;
        const content = `### User Story: ${goalStr}\n> **As a** ${uc.role}\n> **I want to** ${goalStr}\n> **So that** I can achieve my goal.\n\n` +
          `#### Acceptance Criteria\n${this.joinIfArray(uc.tasks, '- [ ] ')}` +
          (uc.feedback ? `\n#### Feedback\n${uc.feedback}` : '') +
          (uc.priority ? `\n#### Priority\n${uc.priority}` : '') +
          (Array.isArray(uc.triggers) ? `\n#### Triggers\n${this.joinIfArray(uc.triggers)}` : '');

        result.push({ id, type: 'userstory', role: uc.role, goal: goalStr, content, raw: uc });
        usIndex++;
      }
    }

    const jsonPath = path.join(__dirname, '../../../output/usecase_doc.json');
    await fs.mkdir(path.dirname(jsonPath), { recursive: true });
    await fs.writeFile(jsonPath, JSON.stringify(result, null, 2), 'utf-8');
    return result;
  }
}


