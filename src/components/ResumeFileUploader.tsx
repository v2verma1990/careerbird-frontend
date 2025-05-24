import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeFileUploaderProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
}

const ResumeFileUploader = ({ onFileSelected, disabled = false }: ResumeFileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (file.type !== "application/pdf") {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload a PDF file.",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
      });
      return;
    }

    setFileName(file.name);
    onFileSelected(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
        disabled={disabled}
        aria-label="Upload resume PDF"
      />
      <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:bg-gray-50 transition-colors" onClick={disabled ? undefined : triggerFileInput}>
        <Upload className="h-12 w-12 text-gray-400 mb-2" />
        <p className="text-lg font-medium">Click to upload your resume</p>
        <p className="text-sm text-gray-500">PDF files only (max 5MB)</p>
        {fileName ? (
          <div className="mt-4 bg-blue-50 p-2 rounded-md w-full max-w-md">
            <span className="text-sm font-medium text-center truncate block">{fileName}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-4 flex justify-center">
        <Button 
          type="button" 
          onClick={triggerFileInput} 
          disabled={disabled}
          variant="outline"
          className="w-full max-w-xs"
        >
          Select Resume PDF
        </Button>
      </div>
    </div>
  );
};

export default ResumeFileUploader;
