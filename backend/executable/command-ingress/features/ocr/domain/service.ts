// features/ocr/domain/service.ts
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs/promises';
import fsExtra from 'fs-extra';
import { spawn } from 'child_process';

import { InsightService } from '../../insight/domain/service';


export class OcrService {
    private insightService = new InsightService();

    async handleImages(images: UploadedFile[], llmKey?: string, llmEndpoint?: string): Promise<any> {
        const uploadDir = path.join(__dirname, '../../../uploads_ocr');
        await fs.mkdir(uploadDir, { recursive: true });

        const savedPaths: string[] = [];

        for (const img of images) {
            const savePath = path.join(uploadDir, img.name);
            await img.mv(savePath);
            savedPaths.push(savePath);
        }

        const result = await this.runOCR(savedPaths, llmKey, llmEndpoint);

        // 🧠 Nếu có text OCR thành công → gọi Insight để trích use_cases
        if (result && result.text && typeof result.text === 'string' && result.text.length > 5) {
            try {
                const insight = await this.insightService.extractMetadata(result.text);
                result.use_cases = insight.use_cases ?? [];
            } catch (e) {
                console.warn('⚠️ Lỗi khi trích xuất insight:', e);
                result.use_cases = [];
            }
        }

        // 🧹 Dọn thư mục tạm
        try {
            await fsExtra.emptyDir(uploadDir);
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
