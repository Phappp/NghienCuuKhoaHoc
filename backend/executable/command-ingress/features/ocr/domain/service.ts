// features/ocr/domain/service.ts
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';
import fsExtra from 'fs-extra';

export class OcrService {
    async handleImages(images: UploadedFile[], llmKey?: string, llmEndpoint?: string): Promise<any> {
        const uploadDir = path.join(__dirname, '../../../uploads_ocr');
        await fs.mkdir(uploadDir, { recursive: true });

        const savedPaths: string[] = [];

        for (const img of images) {
            const savePath = path.join(uploadDir, img.name);
            await img.mv(savePath);
            savedPaths.push(savePath);
        }

        // ✅ Truyền key xuống Python
        const result = await this.runOCR(savedPaths, llmKey, llmEndpoint);

        // 🧹 Tự động dọn dẹp thư mục sau khi xử lý xong
        try {
            await fsExtra.emptyDir(uploadDir); // Hoặc fsExtra.remove(uploadDir) để xóa luôn
        } catch (e) {
            console.warn('⚠️ Không thể dọn thư mục uploads_ocr:', e);
        }

        return result;
    }


    async runOCR(imagePaths: string[], llmKey?: string, llmEndpoint?: string): Promise<any> {
        const scriptPath = path.join(__dirname, '../pythonScript/process_OCR.py');
        const args = [scriptPath, ...imagePaths];
        if (llmKey && llmEndpoint) {
            args.push('--llm_key', llmKey, '--llm_endpoint', llmEndpoint);
        }

        return new Promise((resolve, reject) => {
            const python = spawn('python', args);

            let result = '';
            let error = '';

            python.stdout.on('data', (data) => result += data.toString());
            python.stderr.on('data', (data) => error += data.toString());

            python.on('close', (code) => {
                if (code !== 0) return reject(new Error(error));
                try {
                    const parsed = JSON.parse(result);
                    resolve(parsed);
                } catch (e) {
                    reject(new Error('Invalid JSON from OCR script'));
                }
            });

            python.on('error', (err) => reject(err));
        });
    }
}
export default OcrService;