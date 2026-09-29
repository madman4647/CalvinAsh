import { useState, useRef } from 'react';
import { FiUpload, FiFile, FiX } from 'react-icons/fi';

export default function FileUpload({ accept = '*', maxSize = 5, onFileSelect, label = 'Upload File' }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const maxBytes = maxSize * 1024 * 1024;

  const handleFile = (f) => {
    setError('');
    if (f.size > maxBytes) {
      setError(`File size must be under ${maxSize}MB`);
      return;
    }
    setFile(f);
    onFileSelect && onFileSelect(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleChange = (e) => {
    const f = e.target.files[0];
    if (f) handleFile(f);
  };

  const removeFile = () => {
    setFile(null);
    onFileSelect && onFileSelect(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {file ? (
          <div className="flex items-center justify-center space-x-3">
            <FiFile className="text-primary-600 text-xl" />
            <span className="text-sm text-gray-700">{file.name}</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile();
              }}
              className="text-red-500 hover:text-red-700"
            >
              <FiX />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <FiUpload className="mx-auto text-3xl text-gray-400" />
            <p className="text-sm text-gray-500">
              Drag & drop or <span className="text-primary-600 font-medium">browse</span>
            </p>
            <p className="text-xs text-gray-400">Max {maxSize}MB</p>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
