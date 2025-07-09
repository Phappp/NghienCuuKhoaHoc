// E:\PROJECT\frontend\src\utils\usecaseFormatter.js

export function formatUseCasesMarkdown(useCases = []) {
  return useCases.map((uc, index) => {
    const ucId = `US-${(index + 1).toString().padStart(3, '0')}`;
    const actor = uc.role || 'Người dùng';
    const priority = uc.priority || 'medium';
    const goal = uc.goal || 'Không xác định';
    const reason = uc.reason || 'đạt được mục tiêu của tôi.'; // Thêm một trường lý do nếu có

    // Sử dụng bảng Markdown cho User Story -> Dễ đọc hơn nhiều
    const userStoryTable = `
| Vai trò (As a) | Mong muốn (I want to) | Lợi ích (So that) |
| :--- | :--- | :--- |
| **${actor}** | ${goal} | ${reason} |
`;

    const tasks = (uc.tasks || []).map(t => `- [ ] ${t}`).join('\n') || '_Không có tiêu chí chấp nhận cụ thể_';
    const rules = (uc.rules || []).map(r => `- ${r}`).join('\n') || '_Không có quy tắc nghiệp vụ_';
    const triggers = (uc.triggers || []).map(t => `- ${t}`).join('\n') || '_Không có điều kiện kích hoạt_';
    const feedback = uc.feedback ? `> ${uc.feedback.replace(/\n/g, '\n> ')}` : '_Không có phản hồi từ người dùng_';

    return `
## ${ucId} – ${goal}

### 🧑 User Story
${userStoryTable}

### ✅ Tiêu chí chấp nhận (Acceptance Criteria)
${tasks}

### 📜 Quy tắc nghiệp vụ (Rules)
${rules}

### ⚡️ Điều kiện kích hoạt (Triggers)
${triggers}

### 🔥 Mức ưu tiên (Priority): \`${priority}\`

### 💬 Phản hồi gốc (Original Feedback)
${feedback}
`;
  }).join('\n---\n');
}