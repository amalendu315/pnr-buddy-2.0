// "use client";

// import { useState } from "react";
// import axios from "axios";
// import { Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
// import { toast } from "react-hot-toast";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";

// type Airline = "spicejet" | "indigo";

// export default function AirlineFormatPage() {
//   const [airline, setAirline] = useState<Airline>("spicejet");
//   const [email, setEmail] = useState("");
//   const [file, setFile] = useState<File | null>(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const submit = async (event: React.FormEvent) => {
//     event.preventDefault();
//     if (!file) return toast.error("Please select an Excel file");
//     if (airline === "spicejet" && !email.trim())
//       return toast.error("Enter the SpiceJet email address");

//     setIsLoading(true);
//     const formData = new FormData();
//     formData.append("file", file);
//     formData.append("airline", airline);
//     formData.append("email", email);

//     try {
//       const response = await axios.post(
//         "/api/airline-format/convert",
//         formData,
//         { responseType: "blob" },
//       );
//       const url = URL.createObjectURL(response.data);
//       const link = document.createElement("a");
//       link.href = url;
//       link.download = `${airline === "spicejet" ? "SpiceJet" : "Indigo"}-formatted.xlsx`;
//       link.click();
//       URL.revokeObjectURL(url);
//       toast.success("Formatted workbook downloaded");
//     } catch (error) {
//       let message = "Unable to format workbook";
//       if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
//         try {
//           message =
//             JSON.parse(await error.response.data.text()).error ?? message;
//         } catch {
//           // Keep the fallback message when the server response is not JSON
//         }
//       }
//       toast.error(message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="w-full max-w-3xl px-4 py-12 mx-auto">
//       <Card className="border-0 shadow-2xl ring-1 ring-slate-900/5">
//         <CardHeader className="border-b border-slate-100 bg-slate-50/70">
//           <CardTitle className="flex items-center gap-3 text-2xl text-slate-800">
//             <FileSpreadsheet className="h-7 w-7 text-teal-600" />
//             Airline File Formatter
//           </CardTitle>
//           <CardDescription>
//             Convert a full-sector workbook into the selected airline format.
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="pt-6">
//           <form onSubmit={submit} className="space-y-6">
//             <div className="space-y-2">
//               <label
//                 htmlFor="airline"
//                 className="text-sm font-semibold text-slate-700"
//               >
//                 Airline
//               </label>
//               <Select
//                 value={airline}
//                 onValueChange={(value) => setAirline(value as Airline)}
//               >
//                 <SelectTrigger id="airline" className="bg-white">
//                   <SelectValue />
//                 </SelectTrigger>
//                 <SelectContent position="popper">
//                   <SelectItem value="spicejet">SpiceJet</SelectItem>
//                   <SelectItem value="indigo">Indigo</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {airline === "spicejet" && (
//               <div className="space-y-2">
//                 <label
//                   htmlFor="email"
//                   className="text-sm font-semibold text-slate-700"
//                 >
//                   Email for output rows
//                 </label>
//                 <Input
//                   id="email"
//                   type="email"
//                   value={email}
//                   onChange={(event) => setEmail(event.target.value)}
//                   placeholder="airlines@example.com"
//                 />
//               </div>
//             )}

//             <div className="space-y-2">
//               <label
//                 htmlFor="workbook"
//                 className="text-sm font-semibold text-slate-700"
//               >
//                 Input workbook
//               </label>
//               <label
//                 htmlFor="workbook"
//                 className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center transition-colors hover:border-teal-500 hover:bg-teal-50"
//               >
//                 <Upload className="h-8 w-8 text-teal-600" />
//                 <span className="text-sm font-medium text-slate-700">
//                   {file?.name ?? "Choose an .xlsx or .xls file"}
//                 </span>
//                 <input
//                   id="workbook"
//                   type="file"
//                   accept=".xlsx,.xls"
//                   className="sr-only"
//                   onChange={(event) => setFile(event.target.files?.[0] ?? null)}
//                 />
//               </label>
//             </div>

//             <Button
//               type="submit"
//               disabled={isLoading}
//               className="w-full bg-teal-600 py-6 text-base hover:bg-teal-700"
//             >
//               {isLoading ? (
//                 <>
//                   <Loader2 className="animate-spin mr-2" /> Formatting
//                   workbook...
//                 </>
//               ) : (
//                 <>
//                   <Download className="mr-2" /> Download formatted file
//                 </>
//               )}
//             </Button>
//           </form>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
"use client";

import { useState } from "react";
import axios from "axios";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  CheckCircle2,
  PlaneTakeoff,
  Clock,
  Map,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Airline = "spicejet" | "indigo";

export default function AirlineFormatPage() {
  const [airline, setAirline] = useState<Airline>("spicejet");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return toast.error("Please select an Excel file");
    if (airline === "spicejet" && !email.trim())
      return toast.error("Enter the SpiceJet email address");

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("airline", airline);
    formData.append("email", email);

    try {
      const response = await axios.post(
        "/api/airline-format/convert",
        formData,
        { responseType: "blob" },
      );
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${airline === "spicejet" ? "SpiceJet" : "Indigo"}-formatted.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Workbook processed successfully!");
    } catch (error) {
      let message = "Unable to format workbook";
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        try {
          message =
            JSON.parse(await error.response.data.text()).error ?? message;
        } catch {
          // Keep the fallback message
        }
      }
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-[#f8fafc] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      {/* Main Container - Horizontal Split */}
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row overflow-hidden">
        {/* Left Information Panel */}
        <div className="md:w-2/5 bg-slate-900 p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-teal-500 rounded-full blur-3xl opacity-10 pointer-events-none" />

          <div>
            <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-xl backdrop-blur-sm mb-6 border border-white/10">
              <FileSpreadsheet className="h-6 w-6 text-teal-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
              Airline Format{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                Pro
              </span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
              Transform raw flight manifests into standardized, airline-specific
              layouts in seconds.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 mt-1">
                  <Map className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">
                    Smart Sector Mapping
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Auto-detects and converts city names to official airport
                    codes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 mt-1">
                  <PlaneTakeoff className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">
                    Route Calculation
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Dynamically calculates non-stop and multi-stop flight
                    routes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="p-2 bg-teal-500/10 rounded-lg text-teal-400 mt-1">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-white text-sm font-medium">
                    Data Sanitization
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Strips unwanted columns and formats strict dates & times.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-xs text-slate-500 font-medium">
            Flight Operations Tooling v2.0
          </div>
        </div>

        {/* Right Action Panel (The Form) */}
        <div className="md:w-3/5 p-8 lg:p-12">
          <form
            onSubmit={submit}
            className="h-full flex flex-col justify-center space-y-8"
          >
            <div className="space-y-6">
              {/* Airline Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="airline"
                  className="text-sm font-semibold text-slate-900"
                >
                  Select Target Airline
                </label>
                <Select
                  value={airline}
                  onValueChange={(value) => setAirline(value as Airline)}
                >
                  <SelectTrigger
                    id="airline"
                    className="h-12 bg-slate-50 border-slate-200 text-slate-900 focus:ring-teal-500/20 focus:border-teal-500 rounded-xl transition-all"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="bg-white z-50 rounded-xl border-slate-200 shadow-xl"
                  >
                    <SelectItem
                      value="spicejet"
                      className="rounded-lg cursor-pointer my-1 font-medium"
                    >
                      SpiceJet Layout
                    </SelectItem>
                    <SelectItem
                      value="indigo"
                      className="rounded-lg cursor-pointer my-1 font-medium"
                    >
                      Indigo Layout
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional Email Field */}
              <div
                className={`transition-all duration-300 ease-in-out ${airline === "spicejet" ? "opacity-100 h-[72px]" : "opacity-0 h-0 overflow-hidden m-0"}`}
              >
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-900 flex items-center justify-between"
                  >
                    <span>Default Email ID</span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      SpiceJet Only
                    </span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="e.g. operations@spicejet.com"
                    className="h-12 bg-slate-50 border-slate-200 focus-visible:ring-teal-500/20 focus-visible:border-teal-500 rounded-xl transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* File Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-900">
                  Source Workbook
                </label>
                <label
                  htmlFor="workbook"
                  className={`group relative flex flex-col items-center justify-center w-full min-h-[140px] cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 ${
                    file
                      ? "border-teal-500 bg-teal-50/50"
                      : "border-slate-300 bg-slate-50 hover:border-teal-400 hover:bg-slate-100/50"
                  }`}
                >
                  {file ? (
                    <div className="flex flex-col items-center text-teal-700">
                      <div className="h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center mb-3">
                        <CheckCircle2 className="h-6 w-6 text-teal-600" />
                      </div>
                      <span className="text-sm font-semibold">{file.name}</span>
                      <span className="text-xs text-teal-600/70 mt-1">
                        Ready to process
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-slate-500 group-hover:text-teal-600 transition-colors">
                      <div className="h-12 w-12 bg-white shadow-sm border border-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:shadow-md transition-all">
                        <Upload className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium">
                        Click to browse or drag file here
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        Supports .xlsx and .xls
                      </span>
                    </div>
                  )}
                  <input
                    id="workbook"
                    type="file"
                    accept=".xlsx,.xls"
                    className="sr-only"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] ?? null)
                    }
                  />
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-base font-semibold shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" /> Processing
                  Data...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Download className="h-5 w-5" /> Convert & Download File
                </span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}