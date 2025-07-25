"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Papa from "papaparse";

export default function ExcelCsvSplitter() {
  const [chunkSize, setChunkSize] = useState(100000);
  const [loading, setLoading] = useState(false);
  const [fileNamePrefix, setFileNamePrefix] = useState("Newchunk");

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

  const handleCsvUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let rows = [];
    let chunkIndex = 1;
    setLoading(true);

    Papa.parse(file, {
      worker: true,
      step: async function (results, parser) {
        const value = results.data[0];
        if (value) {
          rows.push([value]);
          if (rows.length === chunkSize) {
            parser.pause();
            await exportChunkAsync(rows.slice(), chunkIndex++);
            rows = [];
            parser.resume();
          }
        }
      },
      complete: async function () {
        if (rows.length > 0) {
          await exportChunkAsync(rows, chunkIndex++);
        }
        setLoading(false);
      },
      error: function (err) {
        console.error("PapaParse error:", err);
        setLoading(false);
        alert("Failed to parse the CSV file.");
      },
    });
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-xl shadow-md dark:bg-gray-900">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">
        📞 CSV to Excel Splitter (up to 3M Phones)
      </h2>

      <input
        type="number"
        min={1}
        value={chunkSize}
        onChange={(e) => setChunkSize(Number(e.target.value))}
        placeholder="Enter chunk size (e.g. 50000)"
        className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 mb-4 w-full"
      />

      <input
        type="text"
        value={fileNamePrefix}
        onChange={(e) => setFileNamePrefix(e.target.value)}
        placeholder="File prefix (e.g. chunk)"
        className="border border-gray-300 dark:border-gray-700 rounded px-4 py-2 mb-4 w-full"
      />

      <input
        type="file"
        accept=".csv"
        onChange={handleCsvUpload}
        className="mb-4 block w-full"
      />

      {loading && (
        <p className="text-blue-600 dark:text-blue-400">
          🔄 Splitting and downloading chunks...
        </p>
      )}
    </div>
  );
}
