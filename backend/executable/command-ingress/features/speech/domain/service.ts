import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { UploadedFile } from 'express-fileupload';

export interface SpeechToTextResult {
    file: string;
    language?: string;
    raw?: string;
    text?: string;
    warning?: string;
    error?: string;
    confidence?: number;
    segments?: { start: number; end: number; text: string }[];
    use_cases?: any[]; // ✅ thêm dòng này
    accepted_use_cases?: any[];
    suggested_use_cases?: any[];
}


export class SpeechToTextService {
    async handleAudio(files: UploadedFile | UploadedFile[], context: string): Promise<SpeechToTextResult[]> {
        const audioFiles = Array.isArray(files) ? files : [files];
        const savedPaths: string[] = [];
        const uploadDir = path.join(process.cwd(), 'uploads_Audio');
        if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

        const allowed = ['.mp3', '.m4a', '.wav', '.flac', '.ogg', '.webm', '.aac'];

        // === 1. Save all uploaded files
        for (const file of audioFiles) {
            let ext = path.extname(file.name || '').toLowerCase();
            if (!ext && (file as any).mimetype) {
                const mime = (file as any).mimetype;
                if (mime === 'audio/mp4') ext = '.m4a';
                else if (mime === 'audio/mpeg') ext = '.mp3';
                else if (mime === 'audio/wav') ext = '.wav';
                else if (mime === 'audio/webm') ext = '.webm';
                else if (mime === 'audio/flac') ext = '.flac';
            }

            if (!allowed.includes(ext)) {
                throw new Error(`Unsupported file: ${file.name}`);
            }

            const safe = file.name.replace(/[^\w.-]/g, '_');
            const unique = `${Date.now()}_${safe}`;
            const dest = path.join(uploadDir, unique);

            await (file as any).mv(dest);
            savedPaths.push(dest);
        }

        // === 2. Chia batch (ví dụ mỗi batch 2 file)
        const batches = this.chunk(savedPaths, 2);

        const allResults: SpeechToTextResult[] = [];

        for (const batch of batches) {
            const batchResult = await this.runPython(batch, context);
            allResults.push(...batchResult);
        }

        // === 3. Cleanup sau 10s
        setTimeout(() => savedPaths.forEach(p => fs.unlink(p, () => { })), 10_000);

        return allResults;
    }

    private chunk<T>(array: T[], size: number): T[][] {
        const result: T[][] = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }


    private runPython(audioPaths: string[], context: string): Promise<SpeechToTextResult[]> {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(__dirname, '../pythonScript/process_STT.py');
            const python = spawn('python', [scriptPath, ...audioPaths, `--context=${context}`]);

            let stdout = '';
            let stderr = '';

            python.stdout.on('data', data => (stdout += data));
            python.stderr.on('data', data => console.error('[PYTHON STDERR]', data.toString()));
            python.on('error', err => reject(err));
            python.on('close', code => {
                if (code !== 0) {
                    return reject(`Python exited with code ${code}: ${stderr || stdout}`);
                }
                try {
                    const parsed = JSON.parse(stdout);
                    resolve(parsed);
                } catch (e) {
                    reject(`JSON parse error: ${stdout}`);
                }
            });
        });
    }
}

