import { Document, Page, pdfjs } from 'react-pdf';
import { useState } from 'react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import './PDFViewer.css';

// Set workerSrc for pdfjs
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  fileUrl: string;
}

export default function PDFViewer({ fileUrl }: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isHtml, setIsHtml] = useState(false);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
    setError(null);
  }

  function onDocumentLoadError(err: Error) {
    console.error("Error loading PDF:", err);
    setError(err.message);
    
    // Check if this might be HTML content instead of a PDF
    fetch(fileUrl)
      .then(response => response.text())
      .then(text => {
        if (text.includes("<!DOCTYPE html>") || text.includes("<html>")) {
          console.log("Detected HTML content instead of PDF");
          setIsHtml(true);
        }
      })
      .catch(err => {
        console.error("Error checking content type:", err);
      });
  }

  return (
    <div className="pdf-viewer-container">
      {isHtml ? (
        <iframe
          src={fileUrl}
          title="Resume Preview"
          className="resume-preview"
        />
      ) : (
        <>
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div>Loading PDF...</div>}
            error={<div>Failed to load PDF as a standard PDF document.</div>}
          >
            {!error && <Page pageNumber={pageNumber} width={800} />}
          </Document>
          {numPages && !error && (
            <div className="pdf-viewer-controls">
              <button onClick={() => setPageNumber(p => Math.max(1, p - 1))} disabled={pageNumber <= 1}>
                Previous
              </button>
              <span className="pdf-viewer-page-info">
                Page {pageNumber} of {numPages}
              </span>
              <button onClick={() => setPageNumber(p => Math.min(numPages!, p + 1))} disabled={pageNumber >= numPages!}>
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
