import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useDocumentStore } from '../store/documentStore';
import { documentApi } from '../services/api';
import toast from 'react-hot-toast';

const DocumentUpload: React.FC = () => {
  const {
    documents,
    isUploading,
    uploadProgress,
    addDocument,
    updateDocument,
    removeDocument,
    setIsUploading,
    updateUploadProgress,
  } = useDocumentStore();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setIsUploading(true);

      for (const file of acceptedFiles) {
        const documentId = addDocument({
          filename: file.name,
          size: file.size,
          type: file.type,
          processed: false,
          chunks: 0,
          status: 'uploading',
        });

        try {
          // Upload file
          const response = await documentApi.uploadDocument(file, progress => {
            updateUploadProgress(documentId, progress);
          });

          // Update document status
          updateDocument(documentId, {
            status: 'processing',
          });

          // Process document
          const processResponse = await documentApi.processDocument(
            response.fileId
          );

          updateDocument(documentId, {
            status: 'completed',
            processed: true,
            chunks: processResponse.chunks,
            category: processResponse.category,
          });

          toast.success(`${file.name} uploaded and processed successfully`);
        } catch (error) {
          console.error('Upload error:', error);
          updateDocument(documentId, {
            status: 'error',
            error: error instanceof Error ? error.message : 'Upload failed',
          });
          toast.error(`Failed to upload ${file.name}`);
        }
      }

      setIsUploading(false);
    },
    [addDocument, updateDocument, setIsUploading, updateUploadProgress]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
    },
    multiple: true,
    disabled: isUploading,
  });

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await documentApi.deleteDocument(documentId);
      removeDocument(documentId);
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Loader2 className="w-5 h-5 animate-spin text-primary-600" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Processed';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Document Management
        </h2>
        <p className="text-gray-600">
          Upload PDF and text files to build your knowledge base. Documents are
          automatically processed, chunked, and indexed for semantic search.
        </p>
      </div>

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer mb-8 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : isUploading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload
          className={`w-12 h-12 mx-auto mb-4 ${
            isDragActive ? 'text-primary-600' : 'text-gray-400'
          }`}
        />

        {isDragActive ? (
          <div>
            <p className="text-lg font-medium text-primary-600 mb-2">
              Drop files here to upload
            </p>
            <p className="text-sm text-primary-500">
              Supported formats: PDF, TXT
            </p>
          </div>
        ) : isUploading ? (
          <div>
            <p className="text-lg font-medium text-gray-500 mb-2">
              Uploading files...
            </p>
            <p className="text-sm text-gray-400">
              Please wait while files are being processed
            </p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag & drop files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supported formats: PDF, TXT (max 10MB per file)
            </p>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Uploaded Documents ({documents.length})
          </h3>
          {documents.length > 0 && (
            <div className="text-sm text-gray-500">
              {documents.filter(doc => doc.status === 'completed').length}{' '}
              processed
            </div>
          )}
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No documents uploaded yet</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map(document => (
              <div
                key={document.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    {getStatusIcon(document.status)}

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {document.filename}
                      </h4>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                        <span>{formatFileSize(document.size)}</span>
                        <span>•</span>
                        <span>{getStatusText(document.status)}</span>
                        {document.chunks > 0 && (
                          <>
                            <span>•</span>
                            <span>{document.chunks} chunks</span>
                          </>
                        )}
                        {document.category && (
                          <>
                            <span>•</span>
                            <span className="bg-primary-100 text-primary-800 px-2 py-0.5 rounded">
                              {document.category}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Progress bar for uploading files */}
                    {(document.status === 'uploading' ||
                      document.status === 'processing') &&
                      uploadProgress[document.id] !== undefined && (
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${uploadProgress[document.id] || 0}%`,
                            }}
                          />
                        </div>
                      )}

                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      disabled={
                        document.status === 'uploading' ||
                        document.status === 'processing'
                      }
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {document.error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{document.error}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
