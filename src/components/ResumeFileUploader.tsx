import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeFileUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

const ResumeFileUploader = ({ 
  onFileSelected, 
  disabled = false,
  accept = ".pdf,.docx,.doc,.txt",
  maxSize = 5
}: ResumeFileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedTypes = accept.split(',').map(type => 
      type.trim().replace('.', '').toLowerCase()
    );
    
    if (fileExtension && !acceptedTypes.includes(fileExtension)) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: `Please upload ${accept.replace(/\./g, '')} files only.`,
      });
      return;
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `Please upload a file smaller than ${maxSize}MB.`,
      });
      return;
    }

    setFileName(file.name);
    setFileSize((file.size / 1024 / 1024).toFixed(2) + " MB");
    onFileSelected(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFileName(null);
    setFileSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled}
        aria-label="Upload resume file"
      />
      <div 
        className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-primary/50 hover:bg-gray-50" 
        onClick={disabled ? undefined : triggerFileInput}
      >
        {fileName ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileIcon className="h-8 w-8 text-primary mr-2" />
              <div className="text-left">
                <p className="text-sm font-medium">{fileName}</p>
                {fileSize && <p className="text-xs text-gray-500">{fileSize}</p>}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="text-gray-500 hover:text-red-500"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-sm font-medium">
              Click to upload your resume file
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Supported formats: {accept.replace(/\./g, '')} (Max {maxSize}MB)
            </p>
          </div>
        )}
      </div>
      {!fileName && (
        <div className="mt-4 flex justify-center">
          <Button 
            type="button" 
            onClick={triggerFileInput} 
            disabled={disabled}
            variant="outline"
            className="w-full max-w-xs"
          >
            Select Resume File
          </Button>
        </div>
      )}
    </div>
  );
};

export default ResumeFileUploader;
