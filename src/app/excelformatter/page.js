"use client";
import { useRef } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Home() {
  const inputRef = useRef();

  const normalizePhone = (raw) => {
    const cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");

    if (/^\+2519\d{8}$/.test(cleaned)) return cleaned;
    if (/^2519\d{8}$/.test(cleaned)) return `+${cleaned}`;
    if (/^09\d{8}$/.test(cleaned)) return `+251${cleaned.slice(1)}`;
    if (/^9\d{8}$/.test(cleaned)) return `+251${cleaned}`;
    return null;
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const phoneRegex = /(?:\+251|251|0)?9\d{8}/g;
    const found = new Set();

    for (const row of rows) {
      for (const cell of row) {
        if (typeof cell !== "string" && typeof cell !== "number") continue;

        const text = String(cell);
        const matches = text.match(phoneRegex);
        if (matches) {
          matches.forEach((raw) => {
            const normalized = normalizePhone(raw);
            if (normalized) found.add(normalized);
          });
        }
      }
    }

    const cleaned = Array.from(found)
      .sort()
      .map((num) => [num]);
    const newSheet = XLSX.utils.aoa_to_sheet([["Phone"], ...cleaned]);
    const newBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newBook, newSheet, "Cleaned");

    const output = XLSX.write(newBook, { type: "array", bookType: "xlsx" });
    const blob = new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "CleanedEthiopianPhones.xlsx");
  };

  return (
    <div className="min-h-screen p-6 bg-white flex flex-col items-center justify-center text-center">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFile}
        className="hidden"
      />
      <button
        onClick={() => inputRef.current.click()}
        className="bg-green-600 text-white px-6 py-3 rounded-md shadow hover:bg-green-700 transition"
      >
        Upload Excel File
      </button>
      {/* <p className="mt-4 text-gray-600 text-sm max-w-md">
        Extracts Ethiopian numbers in formats like <br />
        <code>+2519xxxxxxxx</code>, <code>2519xxxxxxxx</code>,{" "}
        <code>09xxxxxxxx</code>, <code>9xxxxxxxx</code> and converts them all to
        <br />
        <strong>+2519xxxxxxxx</strong>.
      </p> */}
    </div>
  );
}
