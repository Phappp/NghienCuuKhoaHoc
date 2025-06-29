import { UploadedFile } from 'express-fileupload';

declare module 'express-serve-static-core' {
    interface Request {
        files?: {
            image?: UploadedFile | UploadedFile[];
            [fieldname: string]: UploadedFile | UploadedFile[] | undefined;
        };
    }
}
