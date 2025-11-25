"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Papa from "papaparse";

export default function ExcelCsvSplitter() {
  const [chunkSize, setChunkSize] = useState(600000);
  const [loading, setLoading] = useState(false);
  const [fileNamePrefix, setFileNamePrefix] = useState("Newchunk");
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const exportChunkAsync = async (dataChunk, index) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const header = [["Phone"]];
        const finalData = header.concat(dataChunk);
        const ws = XLSX.utils.aoa_to_sheet(finalData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Chunk_${index}`);
        const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([wbout], { type: "application/octet-stream" });
        saveAs(blob, `${fileNamePrefix}_${index}.xlsx`);
        resolve();
      }, 0);
    });
  };

  const handleExcelUpload = async (file) => {
    console.log("Starting Excel upload handler");
    setLoading(true);
    setProgress("Reading Excel file...");
    setError("");

    const reader = new FileReader();
    reader.onload = async (e) => {
      console.log("FileReader onload triggered");
      try {
        const data = e.target.result;
        console.log("Data loaded, length:", data ? data.length : 0);

        // Try multiple read methods for better compatibility
        let workbook;
        try {
          console.log("Attempting to read as binary string...");
          // Try reading as binary string first (works better for large files)
          workbook = XLSX.read(data, {
            type: "binary",
            cellDates: true,
            cellNF: false,
            cellText: false,
          });
          console.log("Successfully read as binary string");
        } catch (err1) {
          console.log("Binary string failed, trying array buffer:", err1);
          try {
            // Fallback to array buffer
            const arrayBuffer = new Uint8Array(data);
            workbook = XLSX.read(arrayBuffer, {
              type: "array",
              cellDates: true,
              cellNF: false,
              cellText: false,
            });
            console.log("Successfully read as array buffer");
          } catch (err2) {
            console.error("Both read methods failed:", err2);
            throw new Error(
              "Unable to read Excel file. Please ensure it's a valid .xlsx or .xls file."
            );
          }
        }

        // Get the first sheet
        console.log("Workbook sheets:", workbook.SheetNames);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          throw new Error("No worksheet found in the Excel file.");
        }

        console.log("Worksheet found:", firstSheetName);
        setProgress("Parsing Excel data...");

        // Convert to array of arrays with raw values
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: true,
          defval: null,
        });

        console.log("JSON data length:", jsonData.length);
        console.log("First 3 rows:", jsonData.slice(0, 3));

        if (!jsonData || jsonData.length === 0) {
          throw new Error("Excel file appears to be empty.");
        }

        // Remove header row if it exists and filter out empty rows
        const dataRows = jsonData
          .slice(1)
          .filter((row) => row && row[0] && String(row[0]).trim() !== "");

        console.log("Valid data rows found:", dataRows.length);
        console.log("First 3 data rows:", dataRows.slice(0, 3));

        if (dataRows.length === 0) {
          throw new Error("No valid data rows found in the Excel file.");
        }

        setProgress(
          `Found ${dataRows.length.toLocaleString()} rows. Splitting into chunks...`
        );

        const totalChunks = Math.ceil(dataRows.length / chunkSize);

        // Split into chunks and export
        let chunkIndex = 1;
        for (let i = 0; i < dataRows.length; i += chunkSize) {
          const chunk = dataRows
            .slice(i, i + chunkSize)
            .map((row) => [String(row[0]).trim()]);

          setProgress(
            `Exporting chunk ${chunkIndex} of ${totalChunks} (${chunk.length.toLocaleString()} rows)...`
          );

          await exportChunkAsync(chunk, chunkIndex++);

          // Small delay to prevent UI freezing
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        setProgress(
          `✅ Complete! Created ${totalChunks} file(s) from ${dataRows.length.toLocaleString()} rows.`
        );
        setLoading(false);
        setFileInputKey(Date.now()); // Reset file input
        setTimeout(() => setProgress(""), 5000);
      } catch (error) {
        console.error("Excel parsing error:", error);
        const errorMsg =
          error.message ||
          "Failed to parse the Excel file. Please check the file format.";
        setError(errorMsg);
        setLoading(false);
        setProgress("");
      }
    };

    reader.onerror = () => {
      console.error("FileReader error");
      setError("Failed to read the file. Please try again.");
      setLoading(false);
      setProgress("");
    };

    // Read as binary string for better large file support
    console.log("Starting to read file as binary string");
    reader.readAsBinaryString(file);
  };

  const handleCsvUpload = (file) => {
    console.log("Starting CSV upload handler");
    setLoading(true);
    setProgress("Reading CSV file...");
    setError("");

    Papa.parse(file, {
      complete: async function (results) {
        console.log("CSV parse complete");
        try {
          console.log(
            "CSV results data length:",
            results.data ? results.data.length : 0
          );

          if (!results.data || results.data.length === 0) {
            throw new Error("CSV file appears to be empty.");
          }

          console.log("First 3 CSV rows:", results.data.slice(0, 3));

          // Filter out empty rows and get only the first column
          const dataRows = results.data
            .slice(1) // Skip header if exists
            .filter((row) => row && row[0] && String(row[0]).trim() !== "")
            .map((row) => [String(row[0]).trim()]);

          console.log("Valid CSV data rows found:", dataRows.length);
          console.log("First 3 data rows:", dataRows.slice(0, 3));

          if (dataRows.length === 0) {
            throw new Error("No valid data rows found in the CSV file.");
          }

          setProgress(
            `Found ${dataRows.length.toLocaleString()} rows. Splitting into chunks...`
          );

          const totalChunks = Math.ceil(dataRows.length / chunkSize);

          // Split into chunks and export
          let chunkIndex = 1;
          for (let i = 0; i < dataRows.length; i += chunkSize) {
            const chunk = dataRows.slice(i, i + chunkSize);

            setProgress(
              `Exporting chunk ${chunkIndex} of ${totalChunks} (${chunk.length.toLocaleString()} rows)...`
            );

            await exportChunkAsync(chunk, chunkIndex++);

            // Small delay to prevent UI freezing
            await new Promise((resolve) => setTimeout(resolve, 100));
          }

          setProgress(
            `✅ Complete! Created ${totalChunks} file(s) from ${dataRows.length.toLocaleString()} rows.`
          );
          setLoading(false);
          setFileInputKey(Date.now()); // Reset file input
          setTimeout(() => setProgress(""), 5000);
        } catch (error) {
          console.error("CSV parsing error:", error);
          const errorMsg =
            error.message ||
            "Failed to parse the CSV file. Please check the file format.";
          setError(errorMsg);
          setLoading(false);
          setProgress("");
        }
      },
      error: function (err) {
        console.error("PapaParse error:", err);
        setError(
          "Failed to parse the CSV file. Please ensure it's a valid CSV file."
        );
        setLoading(false);
        setProgress("");
      },
      skipEmptyLines: true,
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      console.log("No file selected");
      return;
    }

    console.log("File selected:", file.name, "Size:", file.size, "bytes");

    // Clear previous error and progress
    setError("");
    setProgress("");

    const fileExtension = file.name.split(".").pop().toLowerCase();
    console.log("File extension:", fileExtension);

    if (fileExtension === "csv") {
      console.log("Processing as CSV");
      handleCsvUpload(file);
    } else if (fileExtension === "xlsx" || fileExtension === "xls") {
      console.log("Processing as Excel");
      handleExcelUpload(file);
    } else {
      setError("Please upload a valid CSV or Excel file (.csv, .xlsx, .xls)");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        📞 Excel/CSV File Splitter
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Upload an Excel (.xlsx, .xls) or CSV file and split it into chunks of
        your desired size
      </p>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Chunk Size (rows per file)
        </label>
        <input
          type="number"
          min={1}
          value={chunkSize}
          onChange={(e) => setChunkSize(Number(e.target.value))}
          placeholder="Enter chunk size (e.g. 500000)"
          className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 w-full dark:bg-gray-800 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Example: Enter 500000 to split 1,000,000 rows into 2 files
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Output File Prefix
        </label>
        <input
          type="text"
          value={fileNamePrefix}
          onChange={(e) => setFileNamePrefix(e.target.value)}
          placeholder="File prefix (e.g. chunk)"
          className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 w-full dark:bg-gray-800 dark:text-white"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select File
        </label>
        <input
          key={fileInputKey}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileUpload}
          disabled={loading}
          className="block w-full text-sm text-gray-900 dark:text-gray-300 
                     file:mr-4 file:py-2 file:px-4
                     file:rounded file:border-0
                     file:text-sm file:font-semibold
                     file:bg-blue-50 file:text-blue-700
                     hover:file:bg-blue-100
                     dark:file:bg-blue-900 dark:file:text-blue-300"
        />
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400 font-medium">
            ❌ {error}
          </p>
        </div>
      )}

      {loading && (
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
          <p className="text-blue-600 dark:text-blue-400 font-medium">
            🔄 {progress || "Processing..."}
          </p>
        </div>
      )}

      {!loading && progress && !error && (
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900 rounded-lg">
          <p className="text-green-600 dark:text-green-400 font-medium">
            {progress}
          </p>
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          📋 Instructions:
        </h3>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
          <li>Supports Excel (.xlsx, .xls) and CSV files</li>
          <li>Default chunk size is 500,000 rows</li>
          <li>For 1M rows with 500K chunk size = 2 files</li>
          <li>Files will download automatically as they're created</li>
          <li>Each file will have a "Phone" header column</li>
        </ul>
      </div>
    </div>
  );
}
