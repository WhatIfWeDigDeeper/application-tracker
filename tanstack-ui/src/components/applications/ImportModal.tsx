import { useState, useRef } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui";
import { useImportApplications } from "../../queries/applicationMutations";
import { getSampleCsvUrl } from "../../services/api";
import type { ImportResult } from "../../types/application";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importMutation = useImportApplications();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFile(e.target.files?.[0] ?? null);
  };

  const handleImport = () => {
    if (!selectedFile) return;
    importMutation.mutate(selectedFile);
  };

  const handleClose = () => {
    setSelectedFile(null);
    importMutation.reset();
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const result = importMutation.data as ImportResult | undefined;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Applications" size="md">
      {!result ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file to import applications.{" "}
            <a
              href={getSampleCsvUrl()}
              download
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Download template
            </a>
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!selectedFile || importMutation.isPending}
            >
              {importMutation.isPending ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-700">{result.imported}</div>
              <div className="text-sm text-green-600">Imported</div>
            </div>
            <div className="p-3 bg-yellow-50 rounded">
              <div className="text-2xl font-bold text-yellow-700">{result.skipped}</div>
              <div className="text-sm text-yellow-600">Skipped</div>
            </div>
            <div className="p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-700">{result.errors.length}</div>
              <div className="text-sm text-red-600">Errors</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto border rounded p-2">
              {result.errors.map((err, i) => (
                <div key={i} className="text-sm text-red-600 py-1">
                  Row {err.row}: {err.message}
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="primary" onClick={handleClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
