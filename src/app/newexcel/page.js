"use client";
import { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function Home() {
  const [files, setFiles] = useState({ file1: null, file2: null });

  const phoneRegex = /(?:\+251|251|0)?9\d{8}/g;

  const normalizePhone = (raw) => {
    const cleaned = raw.replace(/\s+/g, "").replace(/-/g, "");
    if (/^\+2519\d{8}$/.test(cleaned)) return cleaned;
    if (/^2519\d{8}$/.test(cleaned)) return `+${cleaned}`;
    if (/^09\d{8}$/.test(cleaned)) return `+251${cleaned.slice(1)}`;
    if (/^9\d{8}$/.test(cleaned)) return `+251${cleaned}`;
    return null;
  };

  const extractPhonesFromFile = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    const result = new Set();

    rows.forEach((row) =>
      row.forEach((cell) => {
        const text = String(cell || "");
        const matches = text.match(phoneRegex);
        if (matches) {
          matches.forEach((raw) => {
            const normalized = normalizePhone(raw);
            if (normalized) result.add(normalized);
          });
        }
      })
    );

    return Array.from(result);
  };

  const comparePhones = (list1, list2) => {
    const last8 = (num) => num.slice(-8);
    const map1 = new Map();
    const map2 = new Map();

    list1.forEach((n) => map1.set(last8(n), n));
    list2.forEach((n) => map2.set(last8(n), n));

    const common = [];
    const unique1 = [];
    const unique2 = [];

    for (const [end, num] of map1) {
      if (map2.has(end)) {
        common.push(num);
      } else {
        unique1.push(num);
      }
    }

    for (const [end, num] of map2) {
      if (!map1.has(end)) {
        unique2.push(num);
      }
    }

    return { common, unique1, unique2 };
  };

  const handleCompare = async () => {
    if (!files.file1 || !files.file2) {
      alert("Please upload both Excel files");
      return;
    }

    const list1 = await extractPhonesFromFile(files.file1);
    const list2 = await extractPhonesFromFile(files.file2);

    const { common, unique1, unique2 } = comparePhones(list1, list2);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([["Common"]].concat(common.map((n) => [n]))),
      "Common"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(
        [["UniqueInFile1"]].concat(unique1.map((n) => [n]))
      ),
      "UniqueInFile1"
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(
        [["UniqueInFile2"]].concat(unique2.map((n) => [n]))
      ),
      "UniqueInFile2"
    );

    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "ComparedPhones.xlsx");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center text-center">
      <h1 className="text-2xl font-bold mb-4">📞 Compare Phone Numbers</h1>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Upload First Excel</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFiles({ ...files, file1: e.target.files[0] })}
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-semibold">Upload Second Excel</label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => setFiles({ ...files, file2: e.target.files[0] })}
        />
      </div>

      <button
        onClick={handleCompare}
        className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
      >
        Compare and Download
      </button>

      <p className="mt-4 text-gray-600 max-w-md text-sm">
        Compares Ethiopian numbers from both files. Matches if the last 8 digits
        are the same, even if one starts with <code>09</code>,{" "}
        <code>+2519</code>, or <code>2519</code>.
      </p>
    </div>
  );
}
