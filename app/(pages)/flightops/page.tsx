"use client";

import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Loader2,
  UploadCloud,
  CheckCircle,
  FileText,
  Copy,
  Trash2,
  AlertTriangle,
  Activity,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function FlightOpsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [flightData, setFlightData] = useState<string[]>([]);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Auto-detect airline for UI display
  const detectedAirline = selectedFile
    ? selectedFile.name.toLowerCase().includes("akasa") ||
      selectedFile.name.toLowerCase().includes("qp")
      ? "Akasa Air"
      : selectedFile.name.toLowerCase().includes("spicejet") ||
        selectedFile.name.toLowerCase().includes("sg")
      ? "SpiceJet"
      : "Unknown / Other"
    : null;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setFlightData([]); // Clear previous results on new file
      setErrors(null);
    }
  };

  // Drag & Drop Handlers
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      setSelectedFile(event.dataTransfer.files[0]);
      setFlightData([]);
      setErrors(null);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) return;

    // Client-side validation before sending
    const filename = selectedFile.name.toLowerCase();
    let airline = "";
    if (filename.includes("akasa") || filename.includes("qp"))
      airline = "akasa";
    else if (filename.includes("spicejet") || filename.includes("sg"))
      airline = "spicejet";
    else {
      toast.error("Unsupported airline file. Please check filename.");
      return;
    }

    setIsLoading(true);
    setErrors(null);
    setFlightData([]);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("airline", airline);

    try {
      // Sending to our Next.js API
      const response = await axios.post("/api/flightops/status", formData);
      const data = response.data;

      if (data.results) {
        setFlightData(data.results);
        toast.success(`Processed ${data.results.length} records successfully!`);
      }

      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors);
        toast.error("Some records failed to process.");
      }
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Error processing file";
      setErrors([msg]);
      toast.error("Upload failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (flightData.length > 0) {
      const textToCopy = flightData.join("\n");

      // Check if the modern API is available (Secure Context)
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard
          .writeText(textToCopy)
          .then(() => toast.success("Copied to clipboard"))
          .catch(() => toast.error("Failed to copy"));
      } else {
        // Fallback for HTTP Hosting (EC2 IP Address)
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;

        // Make it invisible but part of the DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
          const successful = document.execCommand("copy");
          if (successful) {
            toast.success("Copied to clipboard");
          } else {
            toast.error("Failed to copy");
          }
        } catch (err) {
          console.error("Fallback copy failed", err);
          toast.error("Failed to copy");
        }

        document.body.removeChild(textArea);
      }
    }
  };

  const handleClear = () => {
    setFlightData([]);
    setErrors(null);
    setSelectedFile(null);
    toast.success("Cleared workspace");
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl px-6 py-12 items-start justify-center">
      {/* LEFT: Upload Card */}
      <Card className="w-full xl:w-112.5 shadow-2xl border-0 ring-1 ring-slate-900/5 bg-white/95 backdrop-blur">
        <CardHeader className="bg-linear-to-br from-slate-50 to-white border-b border-slate-100 pb-6">
          <CardTitle className="flex items-center gap-2 text-xl font-bold text-slate-800">
            <Activity className="w-6 h-6 text-indigo-600" />
            Check Flight Status
          </CardTitle>
          <CardDescription>
            Upload manifest to verify flight operations (Good/Bad).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Drag Drop Area */}
            <div
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-64 rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer bg-slate-50",
                isDragging
                  ? "border-indigo-500 bg-indigo-50 scale-[1.02]"
                  : "border-slate-300 hover:border-indigo-400 hover:bg-slate-100",
                selectedFile ? "border-teal-500 bg-teal-50/30" : ""
              )}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                type="file"
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
              />

              <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
                {selectedFile ? (
                  <>
                    <div className="bg-teal-100 p-3 rounded-full text-teal-600 shadow-sm animate-in zoom-in">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-teal-800 break-all px-4">
                        {selectedFile.name}
                      </p>
                      {detectedAirline && (
                        <Badge
                          variant="secondary"
                          className="mt-2 bg-teal-200/50 text-teal-800 hover:bg-teal-200"
                        >
                          {detectedAirline} detected
                        </Badge>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 shadow-sm">
                      <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Click or drag file here
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports Akasa & SpiceJet files
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !selectedFile}
              className={cn(
                "w-full h-12 text-md font-semibold transition-all shadow-lg",
                isLoading
                  ? "bg-slate-800"
                  : "bg-linear-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 hover:shadow-teal-500/25"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing Status...
                </>
              ) : (
                "Fetch Status"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* RIGHT: Status Feed */}
      {/* RIGHT: Status Feed */}
      {/* FIXED: Uses fixed responsive height (h-[600px] xl:h-[800px]) instead of min/max to ensure scroll area works */}
      <Card className="w-full xl:flex-1 border-0 shadow-2xl bg-white ring-1 ring-slate-900/5 flex flex-col h-[600px] xl:h-[800px]">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-200 rounded-md text-slate-700">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg text-slate-800">
                  Status Feed
                </CardTitle>
                <CardDescription className="text-xs">
                  {flightData.length > 0
                    ? `${flightData.length} records found`
                    : "Waiting for input..."}
                </CardDescription>
              </div>
            </div>

            {(flightData.length > 0 || errors) && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClear}
                  className="h-9"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleCopy}
                  className="bg-slate-800 text-white h-9"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy All
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {/* FIXED: Added flex-1, min-h-0, and overflow-hidden to constrain children */}
        <CardContent className="p-0 flex-1 min-h-0 relative bg-slate-50/30 overflow-hidden">
          {/* FIXED: ScrollArea set to h-full to fill the constrained flex parent */}
          <ScrollArea className="h-full w-full p-4">
            {/* Empty State */}
            {flightData.length === 0 && !errors && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3 mt-20">
                <Activity className="w-16 h-16 text-slate-200" />
                <p>Upload a file to see flight status logs here.</p>
              </div>
            )}

            {/* Loading State Overlay */}
            {isLoading && (
              <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-[1px] flex flex-col items-center justify-center">
                <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
                <p className="mt-4 text-sm font-semibold text-teal-800">
                  Analyzing Flight Ops...
                </p>
              </div>
            )}

            {/* Errors */}
            {errors && (
              <Alert
                variant="destructive"
                className="mb-4 bg-red-50 border-red-200"
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Process Error</AlertTitle>
                <AlertDescription className="whitespace-pre-wrap font-mono text-xs">
                  {errors.join("\n")}
                </AlertDescription>
              </Alert>
            )}

            {/* Data List */}
            {flightData.length > 0 && (
              <div className="space-y-2">
                {flightData.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    <span className="font-mono text-sm text-slate-700 break-all leading-relaxed">
                      {result}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
