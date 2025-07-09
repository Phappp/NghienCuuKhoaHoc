// features/insight/domain/service.ts
import path from 'path';
import { spawn } from 'child_process';

export class InsightService {
  /**
   * Phân tích metadata chuẩn từ văn bản đầu vào
   */
  async extractMetadata(text: string): Promise<any> {
    return this.runPython(text, 'default');
  }

  /**
   * Phân tích metadata nâng cao + gợi ý use case
   */
  async extractWithSuggestion(text: string): Promise<any> {
    return this.runPython(text, 'all');
  }

  /**
   * Hàm dùng chung để gọi Python script với chế độ linh hoạt
   */
  private runPython(text: string, mode: 'default' | 'all'): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, '../pythonScript/process_metadata.py');
      const args = [scriptPath, `--mode=${mode}`, text];
      const python = spawn('python', args);

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', () => {
        try {
          const cleaned = stdout
            .replace(/```json|```/g, '')
            .replace(/^\uFEFF/, '')
            .trim();

          const parsed = JSON.parse(cleaned);
          resolve(parsed);
        } catch (err) {
          console.error('[Python STDOUT]', stdout);
          console.error('[Python STDERR]', stderr);
          reject(`Lỗi parse JSON từ Python: ${stderr || stdout}`);
        }
      });

      python.on('error', (err) => {
        reject(`Không thể khởi động Python script: ${err.message}`);
      });
    });
  }
}
