import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { asyncHandler } from '../middleware/errorHandler';
import { DocumentProcessor } from '../services/documentProcessor';
import { AzureSearchService } from '../services/azure';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const documentProcessor = new DocumentProcessor();
const azureSearchService = new AzureSearchService();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `File type ${fileExt} not supported. Allowed types: ${allowedTypes.join(
            ', '
          )}`
        )
      );
    }
  },
});

// In-memory store for document metadata (in production, use a database)
const documentStore = new Map<
  string,
  {
    id: string;
    filename: string;
    originalName: string;
    size: number;
    type: string;
    uploadedAt: Date;
    processed: boolean;
    chunks: number;
    category?: string;
    status: 'uploaded' | 'processing' | 'completed' | 'error';
    error?: string;
  }
>();

// Upload document
router.post(
  '/upload',
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileId = uuidv4();
    const documentInfo = {
      id: fileId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date(),
      processed: false,
      chunks: 0,
      status: 'uploaded' as const,
    };

    documentStore.set(fileId, documentInfo);

    res.json({
      fileId,
      filename: req.file.originalname,
      size: req.file.size,
    });
  })
);

// Process uploaded document
router.post(
  '/process/:fileId',
  asyncHandler(async (req, res) => {
    const { fileId } = req.params;
    const documentInfo = documentStore.get(fileId);

    if (!documentInfo) {
      return res.status(404).json({ error: 'Document not found' });
    }

    if (documentInfo.processed) {
      return res.json({
        chunks: documentInfo.chunks,
        category: documentInfo.category,
        processed: true,
      });
    }

    try {
      // Update status to processing
      documentStore.set(fileId, { ...documentInfo, status: 'processing' });

      const filePath = path.join(
        __dirname,
        '../../uploads',
        documentInfo.filename
      );

      // Process the document
      const processResult = await documentProcessor.processDocument(filePath, {
        filename: documentInfo.originalName,
        fileId,
      });

      // Upload processed chunks to Azure Search
      await azureSearchService.uploadDocuments(processResult.chunks);

      // Update document info
      const updatedInfo = {
        ...documentInfo,
        processed: true,
        chunks: processResult.chunks.length,
        category: processResult.category,
        status: 'completed' as const,
      };
      documentStore.set(fileId, updatedInfo);

      // Clean up uploaded file
      try {
        await fs.unlink(filePath);
      } catch (cleanupError) {
        console.warn('Failed to cleanup uploaded file:', cleanupError);
      }

      res.json({
        chunks: processResult.chunks.length,
        category: processResult.category,
        processed: true,
      });
    } catch (error) {
      console.error('Document processing error:', error);

      // Update status to error
      documentStore.set(fileId, {
        ...documentInfo,
        status: 'error',
        error: error instanceof Error ? error.message : 'Processing failed',
      });

      throw error;
    }
  })
);

// Get all documents
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const documents = Array.from(documentStore.values()).map(doc => ({
      id: doc.id,
      filename: doc.originalName,
      size: doc.size,
      type: doc.type,
      uploadedAt: doc.uploadedAt.toISOString(),
      processed: doc.processed,
      chunks: doc.chunks,
      category: doc.category,
      status: doc.status,
      error: doc.error,
    }));

    res.json({ documents });
  })
);

// Delete document
router.delete(
  '/:documentId',
  asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const documentInfo = documentStore.get(documentId);

    if (!documentInfo) {
      return res.status(404).json({ error: 'Document not found' });
    }

    try {
      // Delete from Azure Search (you would implement this based on your indexing strategy)
      // await azureSearchService.deleteDocument(documentId);

      // Remove from store
      documentStore.delete(documentId);

      // Clean up file if it still exists
      const filePath = path.join(
        __dirname,
        '../../uploads',
        documentInfo.filename
      );
      try {
        await fs.unlink(filePath);
      } catch (fileError) {
        // File might already be deleted, that's okay
        console.warn('File cleanup warning:', fileError);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Document deletion error:', error);
      throw error;
    }
  })
);

// Get document by ID
router.get(
  '/:documentId',
  asyncHandler(async (req, res) => {
    const { documentId } = req.params;
    const documentInfo = documentStore.get(documentId);

    if (!documentInfo) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json({
      id: documentInfo.id,
      filename: documentInfo.originalName,
      size: documentInfo.size,
      type: documentInfo.type,
      uploadedAt: documentInfo.uploadedAt.toISOString(),
      processed: documentInfo.processed,
      chunks: documentInfo.chunks,
      category: documentInfo.category,
      status: documentInfo.status,
      error: documentInfo.error,
    });
  })
);

export default router;
