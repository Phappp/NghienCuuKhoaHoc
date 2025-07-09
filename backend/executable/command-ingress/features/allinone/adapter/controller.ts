import { Request, Response } from 'express';
import { UploadedFile } from 'express-fileupload';
import { AllInOneService } from '../domain/service';

const service = new AllInOneService();

interface RequestWithFiles extends Request {
  files: { [fieldname: string]: UploadedFile | UploadedFile[] };
}

export const handleAllInOne = async (req: Request, res: Response) => {
  const reqWithFiles = req as RequestWithFiles;
  const files = reqWithFiles.files;
  const context = req.body.context || '';

  if (!files || Object.keys(files).length === 0) {
    return res.status(400).json({ error: 'Chưa có tệp nào được gửi lên.' });
  }

  try {
    const result = await service.handle(files, context);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
