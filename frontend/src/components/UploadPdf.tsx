import { shrinkText } from "@/lib/utils";
import { CloudUpload } from "lucide-react";
import React, { useCallback, useState } from "react";
import toast from "react-hot-toast";

interface UploadPdfProps {
  onUpload?: (file: File) => void;
  file?: File | null;
}

const UploadPdf: React.FC<UploadPdfProps> = ({ onUpload, file }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    const maxSize = 10 * 1024 * 1024;

    if (!file.name.toLowerCase().endsWith(".json")) {
      toast.error("Only JSON files are allowed");
      return;
    }

    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    onUpload && onUpload(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0] as File);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0] as File);
    }
  };

  return (
    <div className="flex cta text-white items-center justify-center flex-col gap-6 w-full">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 gap-4 sm:justify-between flex-wrap sm:flex-nowrap items-center border-dashed rounded-md w-full p-36 text-center transition-all duration-200 ${
          isDragOver
            ? "bg-green-500/20 backdrop-blur-md border border-green-500/30"
            : file
            ? "bg-blue-100/10 backdrop-blur-sm border border-white/20"
            : "border-warning-150"
        }`}
      >
        <div className="gap-4">
          <div className="flex m-auto justify-center">
            <CloudUpload className="w-10 h-10 " />
          </div>

          {file ? (
            <div className="flex text-center gap-2 flex-col">
              <p className="text-lg font-semibold text-primary-300 whitespace-pre-line">
                File Selected: {shrinkText(file.name, 20)}
              </p>
              <p className="text-sm pb-1 text-primary-300">
                Size: {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div className="text-center mx-auto gap-2 sm:max-w-72 ">
              <p className="text-sm font-semibold text-primary-300 whitespace-pre-line">
                Supported formats: JSON | Max size: 10MB
              </p>
              <p className="text-sm pb-1 text-primary-300">
                Drag and Drop a JSON file here or
              </p>
            </div>
          )}
        </div>
        <div>
          <input
            type="file"
            id="file-input"
            className="hidden"
            accept=".json"
            onChange={handleFileInputChange}
          />
          <label
            htmlFor="file-input"
            className="inline-block px-8 py-2 bg-white border border-warning-150 text-black rounded-md font-semibold cursor-pointer hover:bg-neutral-50 hover:border-neutral-400 transition-all duration-200"
          >
            Choose File
          </label>
        </div>
      </div>
    </div>
  );
};

export default UploadPdf;
