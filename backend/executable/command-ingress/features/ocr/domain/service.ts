// features/ocr/domain/service.ts
import { UploadedFile } from 'express-fileupload';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

export class OcrService {
    async handleImages(images: UploadedFile[]): Promise<any> {
        const uploadDir = path.join(__dirname, '../../../uploads_ocr');
        await fs.mkdir(uploadDir, { recursive: true });

        const savedPaths: string[] = [];

        for (const img of images) {
            const savePath = path.join(uploadDir, img.name);
            await img.mv(savePath);
            savedPaths.push(savePath);
        }

        return await this.runOCR(savedPaths);
    }

    async runOCR(imagePaths: string[]): Promise<any> {
        const scriptPath = path.join(__dirname, '../pythonScript/process_OCR.py');
        const args = [scriptPath, ...imagePaths];

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