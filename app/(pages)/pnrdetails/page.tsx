// "use client";

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { toast } from "react-hot-toast";
// import {
//   Loader2,
//   Plane,
//   Copy,
//   Trash2,
//   AlertCircle,
//   Search,
//   Terminal,
//   Sparkles,
//   Settings,
//   Plus,
//   X,
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
//   CardFooter,
// } from "@/components/ui/card";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Textarea } from "@/components/ui/textarea";
// import { Input } from "@/components/ui/input";
// import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";

// export default function PnrDetailsPage() {
//   const [isLoading, setIsLoading] = useState(false);
//   const [pnrs, setPnrs] = useState("");
//   const [airline, setAirline] = useState("akasa");
//   const [customEmail, setCustomEmail] = useState(""); // For one-time email
//   const [flightData, setFlightData] = useState<string | null>(null);
//   const [errors, setErrors] = useState<string | null>(null);

//   // Settings State
//   const [savedEmails, setSavedEmails] = useState<string[]>([]);
//   const [newEmail, setNewEmail] = useState("");
//   const [isSettingsOpen, setIsSettingsOpen] = useState(false);

//   // Fetch saved emails when modal opens
//   useEffect(() => {
//     if (isSettingsOpen) {
//       axios.get("/api/config/emails").then((res) => {
//         setSavedEmails(res.data.emails);
//       });
//     }
//   }, [isSettingsOpen]);

//   const handleAddEmail = async () => {
//     if (!newEmail) return;
//     try {
//       const res = await axios.post("/api/config/emails", { email: newEmail });
//       setSavedEmails(res.data.emails);
//       setNewEmail("");
//       toast.success("Email added to permanent list");
//     } catch (e) {
//       toast.error("Failed to add email");
//     }
//   };

//   const handleDeleteEmail = async (email: string) => {
//     try {
//       const res = await axios.delete("/api/config/emails", { data: { email } });
//       setSavedEmails(res.data.emails);
//       toast.success("Email removed");
//     } catch (e) {
//       toast.error("Failed to remove email");
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setErrors(null);
//     setFlightData(null);

//     const pnrArray = pnrs
//       .split("\n")
//       .map((pnr) => pnr.trim().replace(/"/g, ""))
//       .filter((pnr) => pnr);

//     if (pnrArray.length === 0) {
//       toast.error("Please enter at least one PNR");
//       setIsLoading(false);
//       return;
//     }

//     try {
//       const response = await axios.post("/api/pnr/fetch", {
//         airline,
//         pnrs: pnrArray,
//         customEmail, // Send the transient email
//       });

//       const data = response.data;

//       if (data.results) {
//         setFlightData(data.results);
//         toast.success("Data fetched successfully!");
//       }

//       if (data.errors && data.errors.length > 0) {
//         setErrors(data.errors.join("\n"));
//         if (!data.results) toast.error("Errors occurred.");
//       }
//     } catch (err: any) {
//       const errorMsg =
//         err.response?.data?.message || err.message || "Error fetching data.";
//       setErrors(errorMsg);
//       toast.error("Failed to fetch data");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleCopy = () => {
//     if (flightData) {
//       navigator.clipboard
//         .writeText(flightData)
//         .then(() => toast.success("Copied to clipboard!"))
//         .catch(() => toast.error("Failed to copy"));
//     }
//   };

//   const handleClear = () => {
//     setFlightData(null);
//     setErrors(null);
//     setPnrs("");
//     setCustomEmail("");
//     toast.success("Cleared");
//   };

//   return (
//     <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl mx-auto px-6 py-12 items-start justify-center">
//       {/* LEFT COLUMN: CONTROLS */}
//       <Card className="w-full xl:w-100 border-0 shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-slate-900/5">
//         <CardHeader className="pb-4 bg-linear-to-b from-slate-50 to-white rounded-t-xl border-b border-slate-100">
//           <div className="flex items-center justify-between mb-1">
//             <div className="flex items-center gap-3">
//               <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm">
//                 <Plane className="w-6 h-6" />
//               </div>
//               <div>
//                 <CardTitle className="text-xl font-bold text-slate-800">
//                   Flight Search
//                 </CardTitle>
//                 <CardDescription className="text-slate-500 font-medium">
//                   Retrieve live PNR details
//                 </CardDescription>
//               </div>
//             </div>

//             {/* EMAIL CONFIG DIALOG */}
//             <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
//               <DialogTrigger asChild>
//                 <Button variant="ghost" size="icon" className="text-slate-400 hover:text-indigo-600">
//                   <Settings className="w-5 h-5" />
//                 </Button>
//               </DialogTrigger>
//               <DialogContent className="max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Manage Saved Emails</DialogTitle>
//                   <DialogDescription>
//                     These emails will be used automatically for all searches.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="flex gap-2 mt-4">
//                   <Input 
//                     placeholder="Add new email..." 
//                     value={newEmail} 
//                     onChange={(e) => setNewEmail(e.target.value)} 
//                   />
//                   <Button onClick={handleAddEmail} size="icon">
//                     <Plus className="w-4 h-4" />
//                   </Button>
//                 </div>
//                 <div className="mt-4 max-h-[300px] overflow-y-auto space-y-2">
//                   {savedEmails.map((email) => (
//                     <div key={email} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100 text-sm">
//                       <span className="truncate">{email}</span>
//                       <Button 
//                         variant="ghost" 
//                         size="sm" 
//                         className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
//                         onClick={() => handleDeleteEmail(email)}
//                       >
//                         <X className="w-3 h-3" />
//                       </Button>
//                     </div>
//                   ))}
//                 </div>
//               </DialogContent>
//             </Dialog>

//           </div>
//         </CardHeader>

//         <CardContent className="pt-6">
//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Airline Select */}
//             <div className="space-y-3">
//               <label className="text-sm font-semibold text-slate-700 ml-1">
//                 Select Airline
//               </label>
//               <Select value={airline} onValueChange={setAirline}>
//                 <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all">
//                   <SelectValue placeholder="Select airline" />
//                 </SelectTrigger>
//                 <SelectContent position="popper" className="max-h-60">
//                   <SelectItem value="akasa">Akasa Air</SelectItem>
//                   <SelectItem value="spicejet">SpiceJet</SelectItem>
//                   <SelectItem value="airasia">AirAsia</SelectItem>
//                 </SelectContent>
//               </Select>
//             </div>

//             {/* Custom One-Time Email */}
//             <div className="space-y-3">
//               <label className="text-sm font-semibold text-slate-700 ml-1 flex justify-between">
//                 <span>One-Time Email (Optional)</span>
//                 <span className="text-xs font-normal text-slate-400">Checked first</span>
//               </label>
//               <Input
//                 value={customEmail}
//                 onChange={(e) => setCustomEmail(e.target.value)}
//                 placeholder="Specific email for this search..."
//                 className="h-11 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
//               />
//             </div>

//             {/* PNR Textarea */}
//             <div className="space-y-3">
//               <div className="flex justify-between items-end">
//                 <label className="text-sm font-semibold text-slate-700 ml-1">
//                   PNR List
//                 </label>
//                 <Badge
//                   variant="secondary"
//                   className="bg-slate-100 text-slate-500 hover:bg-slate-200"
//                 >
//                   Batch Mode
//                 </Badge>
//               </div>
//               <div className="relative group">
//                 <Textarea
//                   value={pnrs}
//                   onChange={(e) => setPnrs(e.target.value)}
//                   placeholder={`PNR1\nPNR2\nPNR3`}
//                   className="min-h-50 font-mono text-sm bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all p-4 leading-relaxed tracking-wide placeholder:text-slate-300"
//                 />
//                 <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
//                   <Badge
//                     variant="outline"
//                     className="text-[10px] text-slate-400 border-slate-200 bg-white"
//                   >
//                     One per line
//                   </Badge>
//                 </div>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3 pt-2">
//               <Button
//                 type="submit"
//                 disabled={isLoading}
//                 className={cn(
//                   "flex-1 h-12 text-md font-semibold shadow-lg transition-all duration-300",
//                   isLoading
//                     ? "bg-slate-800 cursor-not-allowed"
//                     : "bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25 active:scale-[0.98]"
//                 )}
//               >
//                 {isLoading ? (
//                   <>
//                     <Loader2 className="w-5 h-5 mr-2 animate-spin" />
//                     Fetching...
//                   </>
//                 ) : (
//                   <>
//                     <Search className="w-5 h-5 mr-2" />
//                     Fetch Data
//                   </>
//                 )}
//               </Button>

//               <Button
//                 type="button"
//                 variant="outline"
//                 onClick={handleClear}
//                 className="h-12 w-12 px-0 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
//                 title="Clear Form"
//               >
//                 <Trash2 className="w-5 h-5" />
//               </Button>
//             </div>
//           </form>
//         </CardContent>
//       </Card>

//       {/* RIGHT COLUMN: RESULTS */}
//       <Card className="w-full xl:flex-1 border-0 shadow-2xl bg-white/95 backdrop-blur ring-1 ring-slate-900/5 flex flex-col min-h-150 max-h-225">
//         <CardHeader className="border-b border-slate-100 bg-white/50 px-6 py-5">
//           <div className="flex justify-between items-center">
//             <div className="flex items-center gap-3">
//               <div className="p-2 bg-slate-100 rounded-md text-slate-600">
//                 <Terminal className="w-5 h-5" />
//               </div>
//               <div>
//                 <CardTitle className="text-lg font-bold text-slate-800">
//                   Console Output
//                 </CardTitle>
//                 <CardDescription className="text-xs font-medium text-slate-400">
//                   JSON / Text Response
//                 </CardDescription>
//               </div>
//             </div>

//             {flightData && (
//               <Button
//                 size="sm"
//                 variant="outline"
//                 onClick={handleCopy}
//                 className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 font-semibold transition-all"
//               >
//                 <Copy className="w-4 h-4 mr-2" />
//                 Copy Data
//               </Button>
//             )}
//           </div>
//         </CardHeader>

//         <CardContent className="grow p-0 overflow-hidden relative bg-slate-50/50">
//           {/* Empty State */}
//           {!flightData && !errors && !isLoading && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-4">
//               <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
//                 <Sparkles className="w-10 h-10 text-slate-300" />
//               </div>
//               <div className="text-center">
//                 <h3 className="text-slate-600 font-semibold text-lg">
//                   Ready to Process
//                 </h3>
//                 <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
//                   Enter PNR numbers on the left panel to start retrieving flight
//                   information.
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* Loading State */}
//           {isLoading && (
//             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-[2px]">
//               <div className="relative">
//                 <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
//                 <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
//               </div>
//               <p className="mt-6 text-indigo-900 font-semibold animate-pulse text-lg">
//                 Communicating with Airline...
//               </p>
//               <p className="text-sm text-indigo-400 mt-1">
//                 This may take a few seconds
//               </p>
//             </div>
//           )}

//           {/* Error Display */}
//           {errors && (
//             <div className="p-6">
//               <Alert
//                 variant="destructive"
//                 className="bg-red-50 border-red-200 text-red-900 shadow-sm"
//               >
//                 <AlertCircle className="h-5 w-5 text-red-600" />
//                 <AlertTitle className="text-lg font-bold ml-2">
//                   Process Failed
//                 </AlertTitle>
//                 <AlertDescription className="whitespace-pre-wrap font-mono text-sm mt-3 ml-2 text-red-700 bg-red-100/50 p-3 rounded-md border border-red-200">
//                   {errors}
//                 </AlertDescription>
//               </Alert>
//             </div>
//           )}

//           {/* Success Data Display (Terminal Style) */}
//           {flightData && (
//             <div className="h-full overflow-auto custom-scrollbar bg-slate-900 text-slate-50 p-6 font-mono text-sm leading-relaxed selection:bg-indigo-500/30">
//               <pre className="whitespace-pre-wrap break-all shadow-none outline-none">
//                 {flightData}
//               </pre>
//             </div>
//           )}
//         </CardContent>

//         {flightData && (
//           <CardFooter className="bg-white border-t border-slate-100 py-3 flex justify-between items-center text-xs text-slate-400">
//             <div className="flex items-center gap-2">
//               <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
//               <span>Sync Complete</span>
//             </div>
//             <span>{flightData.length} chars</span>
//           </CardFooter>
//         )}
//       </Card>
//     </div>
//   );
// }

"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  Loader2,
  Plane,
  Copy,
  Trash2,
  AlertCircle,
  Search,
  Terminal,
  Sparkles,
  Settings,
  Plus,
  X,
  Mail,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PnrDetailsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [pnrs, setPnrs] = useState("");
  const [airline, setAirline] = useState("akasa");

  // 1. STATE FOR ONE-TIME EMAIL
  const [customEmail, setCustomEmail] = useState("");

  const [flightData, setFlightData] = useState<string | null>(null);
  const [errors, setErrors] = useState<string | null>(null);

  // 2. STATE FOR PERMANENT EMAIL SETTINGS
  const [savedEmails, setSavedEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load saved emails when the settings modal opens
  useEffect(() => {
    if (isSettingsOpen) {
      axios
        .get("/api/config/emails")
        .then((res) => setSavedEmails(res.data.emails))
        .catch(() => toast.error("Could not load saved emails"));
    }
  }, [isSettingsOpen]);

  // Add a permanent email
  const handleAddEmail = async () => {
    if (!newEmail || !newEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    try {
      const res = await axios.post("/api/config/emails", { email: newEmail });
      setSavedEmails(res.data.emails);
      setNewEmail("");
      toast.success("Email saved permanently");
    } catch (e) {
      toast.error("Failed to save email");
    }
  };

  // Remove a permanent email
  const handleDeleteEmail = async (email: string) => {
    try {
      const res = await axios.delete("/api/config/emails", { data: { email } });
      setSavedEmails(res.data.emails);
      toast.success("Email removed");
    } catch (e) {
      toast.error("Failed to remove email");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors(null);
    setFlightData(null);

    const pnrArray = pnrs
      .split("\n")
      .map((pnr) => pnr.trim().replace(/"/g, ""))
      .filter((pnr) => pnr);

    if (pnrArray.length === 0) {
      toast.error("Please enter at least one PNR");
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post("/api/pnr/fetch", {
        airline,
        pnrs: pnrArray,
        customEmail, // Send the one-time email to backend
      });

      const data = response.data;

      if (data.results) {
        setFlightData(data.results);
        toast.success("Data fetched successfully!");
      }

      if (data.errors && data.errors.length > 0) {
        setErrors(data.errors.join("\n"));
        if (!data.results) toast.error("Errors occurred.");
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message || err.message || "Error fetching data.";
      setErrors(errorMsg);
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!flightData) return;

    // Check if the modern API is available (Secure Context)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(flightData);
        toast.success("Copied to clipboard!");
      } catch (err) {
        console.error("Copy failed", err);
        toast.error("Failed to copy");
      }
    } else {
      // Fallback for HTTP (EC2 IP Address)
      const textArea = document.createElement("textarea");
      textArea.value = flightData;

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
          toast.success("Copied to clipboard!");
        } else {
          toast.error("Failed to copy");
        }
      } catch (err) {
        console.error("Fallback copy failed", err);
        toast.error("Failed to copy");
      }

      document.body.removeChild(textArea);
    }
  };

  const handleClear = () => {
    setFlightData(null);
    setErrors(null);
    setPnrs("");
    setCustomEmail("");
    toast.success("Cleared");
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 w-full max-w-7xl mx-auto px-6 py-12 items-start justify-center">
      {/* LEFT COLUMN: CONTROLS */}
      <Card className="w-full xl:w-100 border-0 shadow-2xl bg-white/90 backdrop-blur-sm ring-1 ring-slate-900/5">
        <CardHeader className="pb-4 bg-linear-to-b from-slate-50 to-white rounded-t-xl border-b border-slate-100">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-lg shadow-sm">
                <Plane className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-slate-800">
                  Flight Search
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">
                  Retrieve live PNR details
                </CardDescription>
              </div>
            </div>

            {/* --- SETTINGS DIALOG (PERMANENT EMAILS) --- */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-slate-400 hover:text-indigo-600 transition-colors"
                  title="Manage Saved Emails"
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Manage Saved Emails</DialogTitle>
                  <DialogDescription>
                    These emails are checked automatically for every PNR search.
                  </DialogDescription>
                </DialogHeader>

                {/* Add New Email Section */}
                <div className="flex gap-2 mt-4 items-center">
                  <div className="relative w-full">
                    <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Add new permanent email..."
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    onClick={handleAddEmail}
                    size="icon"
                    className="shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* List of Saved Emails */}
                <div className="mt-4 max-h-75 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {savedEmails.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-4">
                      No custom emails saved yet.
                    </p>
                  ) : (
                    savedEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md border border-slate-100 text-sm group hover:border-slate-200 transition-all"
                      >
                        <span className="truncate text-slate-700 font-medium">
                          {email}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-slate-300 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteEmail(email)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </DialogContent>
            </Dialog>
            {/* ------------------------------------------- */}
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Airline Select */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-700 ml-1">
                Select Airline
              </label>
              <Select value={airline} onValueChange={setAirline}>
                <SelectTrigger className="w-full h-11 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all">
                  <SelectValue placeholder="Select airline" />
                </SelectTrigger>
                <SelectContent position="popper" className="max-h-60">
                  <SelectItem value="akasa">Akasa Air</SelectItem>
                  <SelectItem value="spicejet">SpiceJet</SelectItem>
                  <SelectItem value="airasia">AirAsia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* --- ONE-TIME EMAIL INPUT --- */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-2">
                  One-Time Email
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-slate-400 px-1.5 py-0 h-4"
                  >
                    Optional
                  </Badge>
                </label>
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                <Input
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  placeholder="Check specific email for this search only..."
                  className="h-11 pl-10 bg-slate-50 border-slate-200 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 ml-1">
                This email will be checked <strong>first</strong> before the
                default list.
              </p>
            </div>
            {/* ---------------------------- */}

            {/* PNR Textarea */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-slate-700 ml-1">
                  PNR List
                </label>
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  Batch Mode
                </Badge>
              </div>
              <div className="relative group">
                <Textarea
                  value={pnrs}
                  onChange={(e) => setPnrs(e.target.value)}
                  placeholder={`PNR1\nPNR2\nPNR3`}
                  className="min-h-40 font-mono text-sm bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 resize-none transition-all p-4 leading-relaxed tracking-wide placeholder:text-slate-300"
                />
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Badge
                    variant="outline"
                    className="text-[10px] text-slate-400 border-slate-200 bg-white"
                  >
                    One per line
                  </Badge>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "flex-1 h-12 text-md font-semibold shadow-lg transition-all duration-300",
                  isLoading
                    ? "bg-slate-800 cursor-not-allowed"
                    : "bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25 active:scale-[0.98]"
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Fetch Data
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleClear}
                className="h-12 w-12 px-0 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                title="Clear Form"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* RIGHT COLUMN: RESULTS */}
      {/* RIGHT COLUMN: RESULTS - SCROLL FIXED */}
      {/* Changes made for Scroll:
          1. Removed fixed height limitation on Card so it respects screen or flex. 
          2. Added h-[800px] as a baseline, but max-h for screen fit.
          3. CardContent now has min-h-0 to allow flex shrinking/scrolling.
      */}
      <Card className="w-full xl:flex-1 border-0 shadow-2xl bg-white/95 backdrop-blur ring-1 ring-slate-900/5 flex flex-col h-150 xl:h-187.5">
        <CardHeader className="border-b border-slate-100 bg-white/50 px-6 py-5 shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-md text-slate-600">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                  Console Output
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-400">
                  JSON / Text Response
                </CardDescription>
              </div>
            </div>

            {flightData && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 font-semibold transition-all"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Data
              </Button>
            )}
          </div>
        </CardHeader>

        {/* FIXED: min-h-0 is critical for flex children to scroll.
           Removed 'grow' blindly, replaced with flex-1 and overflow-hidden on container.
        */}
        <CardContent className="flex-1 min-h-0 p-0 relative bg-slate-50/50 overflow-hidden">
          {/* Empty State */}
          {!flightData && !errors && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 space-y-4">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center shadow-inner">
                <Sparkles className="w-10 h-10 text-slate-300" />
              </div>
              <div className="text-center">
                <h3 className="text-slate-600 font-semibold text-lg">
                  Ready to Process
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                  Enter PNR numbers on the left panel to start retrieving flight
                  information.
                </p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 backdrop-blur-[2px]">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin relative z-10" />
              </div>
              <p className="mt-6 text-indigo-900 font-semibold animate-pulse text-lg">
                Communicating with Airline...
              </p>
              <p className="text-sm text-indigo-400 mt-1">
                This may take a few seconds
              </p>
            </div>
          )}

          {/* Error Display */}
          {errors && (
            <div className="p-6 h-full overflow-y-auto">
              <Alert
                variant="destructive"
                className="bg-red-50 border-red-200 text-red-900 shadow-sm"
              >
                <AlertCircle className="h-5 w-5 text-red-600" />
                <AlertTitle className="text-lg font-bold ml-2">
                  Process Failed
                </AlertTitle>
                <AlertDescription className="whitespace-pre-wrap font-mono text-sm mt-3 ml-2 text-red-700 bg-red-100/50 p-3 rounded-md border border-red-200">
                  {errors}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Success Data Display (Terminal Style) - FIXED SCROLLING */}
          {flightData && (
            <div className="h-full w-full overflow-y-auto custom-scrollbar bg-slate-900 text-slate-50 p-6 font-mono text-sm leading-relaxed selection:bg-indigo-500/30">
              <pre className="whitespace-pre-wrap break-all shadow-none outline-none">
                {flightData}
              </pre>
            </div>
          )}
        </CardContent>

        {flightData && (
          <CardFooter className="bg-white border-t border-slate-100 py-3 flex justify-between items-center text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Sync Complete</span>
            </div>
            <span>{flightData.length} chars</span>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}