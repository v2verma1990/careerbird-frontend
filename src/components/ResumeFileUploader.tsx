
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, FileIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResumeFileUploaderProps {
  onFileSelected: (file: File) => void;
  onDataExtracted?: (data: any) => void;
  setIsExtracting?: (isExtracting: boolean) => void;
  disabled?: boolean;
  accept?: string;
  maxSize?: number; // in MB
}

const ResumeFileUploader = ({ 
  onFileSelected,
  onDataExtracted,
  setIsExtracting,
  disabled = false,
  accept = ".pdf,.docx,.doc,.txt",
  maxSize = 5
}: ResumeFileUploaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    // Auto-extract data if callbacks are provided
    if (onDataExtracted && setIsExtracting) {
      try {
        setIsExtracting(true);
        
        // Simulate data extraction (replace with actual API call)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock extracted data
        const mockData = {
          name: "John Doe",
          email: "john.doe@email.com",
          phone: "(555) 123-4567",
          location: "New York, NY",
          title: "Software Engineer",
          summary: "Experienced software engineer with 5+ years of experience...",
          skills: ["JavaScript", "React", "Node.js", "Python"],
          experience: [
            {
              title: "Senior Software Engineer",
              company: "Tech Corp",
              location: "New York, NY",
              startDate: "2020-01",
              endDate: "Present",
              description: "Led development of web applications..."
            }
          ],
          education: [
            {
              degree: "Bachelor of Science in Computer Science",
              institution: "University of Technology",
              location: "New York, NY",
              startDate: "2015-09",
              endDate: "2019-05",
              gpa: "3.8"
            }
          ]
        };
        
        onDataExtracted(mockData);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Extraction Failed",
          description: "Failed to extract data from the resume file.",
        });
      } finally {
        setIsExtracting(false);
      }
    }
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
    onFileSelected(null as any);
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
        className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
          disabled 
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
            : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
        }`}
        onClick={disabled ? undefined : triggerFileInput}
      >
        {fileName ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileIcon className="h-8 w-8 text-blue-600 mr-2" />
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
