import React, { useState } from 'react';
import axios from 'axios';
import { UploadCloud, FileType, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import clsx from 'clsx';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [sourceType, setSourceType] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const name = selectedFile.name.toLowerCase();
      if (name.includes('sap')) setSourceType('SAP');
      else if (name.includes('utility') || name.includes('bill')) setSourceType('UTILITY');
      else if (name.includes('concur') || name.includes('travel')) setSourceType('CONCUR');
      else setSourceType(null); // Force manual selection if not matched
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    if (!sourceType) {
      toast.error("Please select a data source type above.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('company_id', 1); // Mock company
    formData.append('source_type', sourceType);

    try {
      const response = await axios.post('http://localhost:8000/api/ingest/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(response.data.message);
      setFile(null);
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Data Ingestion</h2>
        <p className="text-muted-foreground mt-2 text-lg">Upload raw exports from client systems to normalize and ingest.</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {['SAP', 'UTILITY', 'CONCUR'].map(type => (
              <button
                key={type}
                onClick={() => setSourceType(type)}
                className={clsx(
                  "p-5 rounded-xl border-2 text-left transition-all duration-200 relative overflow-hidden group",
                  sourceType === type 
                    ? "border-primary bg-primary/5 shadow-sm" 
                    : "border-border hover:border-primary/30 hover:bg-slate-50"
                )}
              >
                {sourceType === type && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                )}
                <FileType className={clsx(
                  "w-8 h-8 mb-3",
                  sourceType === type ? "text-primary" : "text-muted-foreground group-hover:text-primary/70"
                )} />
                <h3 className={clsx(
                  "font-semibold text-lg",
                  sourceType === type ? "text-primary" : "text-foreground"
                )}>
                  {type === 'SAP' ? 'SAP ERP' : type === 'UTILITY' ? 'Utility Portal' : 'Concur Travel'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {type === 'SAP' ? 'Fuel & Procurement' : type === 'UTILITY' ? 'Electricity Bills' : 'Business Flights'}
                </p>
              </button>
            ))}
          </div>

          <div className="relative group">
            <input
              type="file"
              onChange={handleFileChange}
              accept=".csv"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={clsx(
              "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 flex flex-col items-center justify-center",
              file ? "border-primary bg-primary/5" : "border-border group-hover:border-primary/50 group-hover:bg-slate-50"
            )}>
              <div className={clsx(
                "w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform duration-300",
                file ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-primary/10 text-primary group-hover:scale-110"
              )}>
                {file ? <CheckCircle2 className="w-8 h-8" /> : <UploadCloud className="w-8 h-8" />}
              </div>
              <h4 className="text-xl font-semibold text-foreground mb-2">
                {file ? file.name : "Click or drag file to this area to upload"}
              </h4>
              <p className="text-muted-foreground">
                {file ? `${(file.size / 1024).toFixed(2)} KB` : "Support for a single or bulk CSV upload."}
              </p>
            </div>
          </div>

        </div>
        
        <div className="px-8 py-5 bg-slate-50 border-t border-border flex justify-end">
          <button
            onClick={handleUpload}
            disabled={!file || !sourceType || loading}
            className="flex items-center px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
          >
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <UploadCloud className="w-5 h-5 mr-2" />}
            {loading ? 'Ingesting...' : 'Ingest Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
