import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { formatSize } from '~/lib/puter'

interface FileUploaderProps {
    onfileselect: (file: File) => void;
}

const FileUploader = ({ onfileselect }: FileUploaderProps) => {

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0] || null;
        onfileselect?.(file);
    }, [onfileselect]);

    const {
        getRootProps,
        getInputProps,
        isDragActive,
        isDragReject,
        acceptedFiles,
        fileRejections,
    } = useDropzone({
        onDrop,
        multiple: false,
        accept: { 'application/pdf': ['.pdf'] },
        maxSize: 20 * 1024 * 1024,
    });

    const file = acceptedFiles[0] || null;
    const rejectionMessage = fileRejections[0]?.errors[0]?.message;

    const dropzoneClassName = [
        'uploader-drag-area',
        isDragActive && 'uploader-active',
        isDragReject && 'uploader-reject',
    ]
        .filter(Boolean)
        .join(' ');

    return (
        <div className="w-full gradient-border">
            <div {...getRootProps({ className: dropzoneClassName })}>
                <input {...getInputProps()} />

                {file ? (
                    <div className="uploader-selected-file">
                        <div className="flex flex-col items-start gap-1 text-left">
                            <p className="text-lg font-semibold text-slate-900">{file.name}</p>
                            <p className="text-sm text-slate-500">{formatSize(file.size)}</p>
                        </div>
                        <button className='p-2 cursor-pointer' onClick={(e) => {
                            e.stopPropagation();
                        }}>
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <p className="text-lg font-semibold text-slate-700">
                            {isDragActive ? 'Drop your PDF here' : 'Click to upload'}
                        </p>
                        <p className="text-sm text-slate-500">
                            {isDragActive ? 'Release to upload your file' : 'Drag and drop a PDF file'}
                        </p>
                        <span className="text-sm text-slate-400">PDF only · max 20 MB</span>
                    </div>
                )}
            </div>

            {rejectionMessage && (
                <p className="mt-3 text-sm text-red-500">{rejectionMessage}</p>
            )}
        </div>
    );
}

export default FileUploader;