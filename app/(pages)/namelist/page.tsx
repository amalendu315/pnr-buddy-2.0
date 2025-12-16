"use client";

import React, { useState } from "react";
import axios from "axios";
import { Loader2, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "react-hot-toast";

const fileCodeInfo = {
  "i.xlsx": "Indigo",
  "g.xlsx": "GoAir",
  "s.xlsx": "Spicejet",
  "a.xlsx": "AirAsia",
  "q.xlsx": "Akasa",
  "t.xlsx": "ThaiAirAsia",
  "d.xlsx": "Druk Air",
  "b.xlsx": "Bhutan Airlines",
  "e.xlsx": "Air India Domestic",
  "f.xlsx": "Air India International",
  "h.xlsx": "Air India Express International",
  "l.xlsx": "Air Arabia",
};

export default function NamelistPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>("Select File");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setFileName(event.target.files[0].name);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      toast.error("Please select a file first!");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("PNR", selectedFile);

    try {
      // Pointing to our internal Next.js API route (we will create this next)
      const response = await axios.post("/api/namelist/convert", formData, {
        responseType: "arraybuffer",
      });

      const fileData = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(fileData);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName.split(" ")[0]} Namelist.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove(); // Clean up
      toast.success("File converted successfully!");
    } catch (error) {
      console.error("Error converting file:", error);
      toast.error("Failed to convert file. Please check the format.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row justify-center items-start gap-8 w-full max-w-5xl px-4 mt-10">
      {/* Left: Upload Form Card */}
      <Card className="w-full md:w-112.5 shadow-lg">
        <CardHeader className="flex flex-col items-center">
          {/* Keeping your logo logic if you have the file in public/assets */}
          {/* <img src="/assets/logo5.png" alt="Logo" className="w-[180px] mb-4" /> */}
          <CardTitle className="text-2xl font-bold text-gray-800">
            Upload Namelist
          </CardTitle>
          <CardDescription>Select your PNR file to process</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 items-center"
          >
            {/* File Display Area */}
            <div className="w-full bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-center text-blue-700 font-semibold text-center min-h-15">
              {fileName}
            </div>

            {/* Hidden Input + Custom Label Button */}
            <input
              className="hidden"
              type="file"
              id="PNR"
              name="PNR"
              accept=".xlsx,.xls,.csv" // added acceptance for better UX
              onChange={handleFileChange}
            />
            <label
              htmlFor="PNR"
              className="flex items-center gap-2 cursor-pointer bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-md transition-all font-medium shadow-sm active:scale-95"
            >
              <Upload className="w-5 h-5" />
              UPLOAD FILE
            </label>

            <p className="text-gray-400 text-sm">Example: "ATU87B G.xlsx"</p>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !selectedFile}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-6 text-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Download Converted File"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Right: Info Table Card */}
      <Card className="w-full md:w-100 shadow-md bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            File Code Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-25">Code</TableHead>
                <TableHead>Airline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(fileCodeInfo).map(([key, value]) => (
                <TableRow key={key}>
                  <TableCell className="font-medium text-gray-700">
                    {key}
                  </TableCell>
                  <TableCell className="text-gray-600">{value}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
