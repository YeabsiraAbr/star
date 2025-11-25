"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { saveAs } from "file-saver";

const DEFAULT_HEADER_HINTS = ["phone", "number", "ticket", "id"];

const DELIMITER_OPTIONS = [
  { value: "auto", label: "Auto detect" },
  { value: ",", label: "Comma (,)" },
  { value: ";", label: "Semicolon (;)" },
  { value: "\t", label: "Tab (\\t)" },
  { value: "|", label: "Pipe (|)" },
];

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "number") {
    // Preserve leading zeros by forcing string conversion without scientific notation
    return value.toString();
  }

  return String(value).trim();
};

const canonicalizeValue = (value) => {
  if (!value) {
    return "";
  }

  const digitsOnly = value.replace(/[^\d]/g, "");
  if (!digitsOnly) {
    return value;
  }

  const firstNineIndex = digitsOnly.indexOf("9");
  if (firstNineIndex === -1) {
    return digitsOnly;
  }

  const canonical = digitsOnly.slice(firstNineIndex);
  return canonical || digitsOnly;
};

const shouldDropHeader = (rows) => {
  if (!rows.length) {
    return false;
  }

  const first = normalizeValue(rows[0]);
  if (!first) {
    return true;
  }

  const lower = first.toLowerCase();
  return DEFAULT_HEADER_HINTS.some((hint) => lower.includes(hint));
};

async function readExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = event.target.result;
        let workbook;

        try {
          workbook = XLSX.read(data, {
            type: "binary",
            cellDates: true,
            cellNF: false,
            cellText: false,
          });
        } catch (binaryError) {
          const buffer = new Uint8Array(data);
          workbook = XLSX.read(buffer, {
            type: "array",
            cellDates: true,
            cellNF: false,
            cellText: false,
          });
        }

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        if (!worksheet) {
          reject(new Error("No worksheet found in the Excel file."));
          return;
        }

        const rawRows = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: true,
          defval: null,
        });

        resolve(rawRows.map((row) => (Array.isArray(row) ? row[0] : row)));
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () =>
      reject(new Error("Failed to read the Excel file. Please try again."));

    reader.readAsBinaryString(file);
  });
}

const resolveDelimiterValue = (option) => {
  if (!option || option === "auto") {
    return "";
  }
  return option;
};

async function readCsvFile(file, delimiterOption = "auto") {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      worker: true,
      step: undefined,
      complete: (results) => {
        if (results.errors?.length) {
          reject(
            new Error(
              results.errors[0]?.message ||
                "Failed to parse CSV file. Please confirm the format."
            )
          );
          return;
        }

        resolve(
          results.data.map((row) => {
            if (Array.isArray(row)) {
              return row[0];
            }
            return row;
          })
        );
      },
      error: (error) => {
        reject(
          new Error(
            error?.message ||
              "Failed to parse CSV file. Please confirm the format."
          )
        );
      },
      skipEmptyLines: true,
      delimiter: resolveDelimiterValue(delimiterOption),
    });
  });
}

async function extractColumnValues(file, options = {}) {
  const extension = file.name.split(".").pop()?.toLowerCase();

  let rows;

  if (extension === "csv") {
    rows = await readCsvFile(file, options.delimiter);
  } else if (extension === "xlsx" || extension === "xls") {
    rows = await readExcelFile(file);
  } else {
    throw new Error("Unsupported file type. Please upload CSV or Excel files.");
  }

  const values = rows.map(normalizeValue).filter((value) => value !== "");

  let filteredValues = values;

  if (shouldDropHeader(filteredValues)) {
    filteredValues = filteredValues.slice(1);
  }

  return filteredValues.map((original) => ({
    original,
    canonical: canonicalizeValue(original),
  }));
}

const chunkArray = (array, size = 100000) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

const UniqueExcelPage = () => {
  const [primaryFileName, setPrimaryFileName] = useState("");
  const [compareFileName, setCompareFileName] = useState("");
  const [primarySet, setPrimarySet] = useState(null);
  const [compareValues, setCompareValues] = useState([]);
  const [uniqueValues, setUniqueValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [delimiterOption, setDelimiterOption] = useState("auto");

  const stats = useMemo(() => {
    const totalPrimary = primarySet?.size ?? 0;
    const totalCompare = compareValues.length;
    const totalUnique = uniqueValues.length;

    return { totalPrimary, totalCompare, totalUnique };
  }, [primarySet, compareValues, uniqueValues]);

  const handlePrimaryUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPrimaryFileName(file.name);
    setStatusMessage("Reading first Excel/CSV file...");
    setErrorMessage("");
    setLoading(true);
    setUniqueValues([]);

    try {
      const values = await extractColumnValues(file, {
        delimiter: delimiterOption,
      });
      const canonicalValues = values.map((item) => item.canonical);
      const nextPrimarySet = new Set(canonicalValues);
      setPrimarySet(nextPrimarySet);
      setStatusMessage(
        `Loaded ${values.length.toLocaleString()} entries from "${file.name}".`
      );

      if (compareValues.length) {
        await computeUniqueValues(nextPrimarySet, compareValues);
      }
    } catch (error) {
      console.error("Primary file processing failed:", error);
      let message =
        error?.message ||
        "Unable to process the first file. Please verify the format.";
      if (
        delimiterOption === "auto" &&
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("unable to auto-detect")
      ) {
        message = `${message} Try selecting the delimiter that matches your file (comma, semicolon, tab, etc.).`;
      }
      setErrorMessage(message);
      setPrimarySet(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCompareUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setCompareFileName(file.name);
    setStatusMessage("Reading second Excel/CSV file...");
    setErrorMessage("");
    setLoading(true);
    setUniqueValues([]);

    try {
      const values = await extractColumnValues(file, {
        delimiter: delimiterOption,
      });
      setCompareValues(values);
      setStatusMessage(
        `Loaded ${values.length.toLocaleString()} entries from "${file.name}".`
      );

      if (primarySet) {
        await computeUniqueValues(primarySet, values);
      }
    } catch (error) {
      console.error("Comparison file processing failed:", error);
      let message =
        error?.message ||
        "Unable to process the second file. Please verify the format.";
      if (
        delimiterOption === "auto" &&
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("unable to auto-detect")
      ) {
        message = `${message} Try selecting the delimiter that matches your file (comma, semicolon, tab, etc.).`;
      }
      setErrorMessage(message);
      setCompareValues([]);
    } finally {
      setLoading(false);
    }
  };

  const computeUniqueValues = async (primary, compare) => {
    if (!primary || !compare?.length) {
      setUniqueValues([]);
      return;
    }

    setStatusMessage("Computing unique records...");
    setLoading(true);

    const targetSet = new Set();
    const uniqueList = [];

    const processChunk = (chunk) => {
      chunk.forEach(({ canonical, original }) => {
        if (!primary.has(canonical) && !targetSet.has(canonical)) {
          targetSet.add(canonical);
          uniqueList.push(original);
        }
      });
    };

    const chunks = chunkArray(compare, 200000);

    for (let i = 0; i < chunks.length; i += 1) {
      processChunk(chunks[i]);

      if (chunks.length > 1) {
        setStatusMessage(
          `Computing unique records... (${i + 1}/${chunks.length} chunks)`
        );
        // Give the UI time to breathe if files are extremely large
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    setUniqueValues(uniqueList);
    setStatusMessage(
      `Found ${uniqueList.length.toLocaleString()} unique record${
        uniqueList.length === 1 ? "" : "s"
      } present in File 2 but not in File 1.`
    );
    setLoading(false);
  };

  const handleDownloadUnique = () => {
    if (!uniqueValues.length) {
      return;
    }

    const header = [["Unique Numbers (File 2 minus File 1)"]];
    const data = uniqueValues.map((value) => [value]);
    const worksheet = XLSX.utils.aoa_to_sheet(header.concat(data));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unique");
    const workbookArray = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const blob = new Blob([workbookArray], {
      type: "application/octet-stream",
    });

    const baseName1 = primaryFileName.replace(/\.[^.]+$/, "");
    const baseName2 = compareFileName.replace(/\.[^.]+$/, "");
    const fileName =
      baseName1 && baseName2
        ? `${baseName2}_minus_${baseName1}_unique.xlsx`
        : "unique-records.xlsx";

    saveAs(blob, fileName);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-900 shadow-xl rounded-3xl p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            🔍 Unique Number Extractor
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Upload two large Excel/CSV files. We&apos;ll locate every number
            that appears in File 2 but not in File 1. Supports millions of
            rows—built to stay responsive while processing big datasets.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="md:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col gap-3">
            <div>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                ⚙️ CSV Delimiter
              </h2>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Choose the delimiter that matches your CSV files. Leave on auto
                detect when you are unsure.
              </p>
            </div>
            <select
              value={delimiterOption}
              onChange={(event) => setDelimiterOption(event.target.value)}
              className="w-full md:w-64 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-950/40 px-4 py-2 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {DELIMITER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              1️⃣ Upload File 1 (baseline)
            </h2>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handlePrimaryUpload}
              disabled={loading}
              className="block w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            {primaryFileName && (
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Loaded <strong>{primaryFileName}</strong> with{" "}
                <strong>{stats.totalPrimary.toLocaleString()}</strong> unique
                entries.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/40 p-5">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
              2️⃣ Upload File 2 (comparison)
            </h2>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleCompareUpload}
              disabled={loading || !primarySet}
              className="block w-full rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {compareFileName && (
              <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                Loaded <strong>{compareFileName}</strong> with{" "}
                <strong>{stats.totalCompare.toLocaleString()}</strong> records.
              </p>
            )}
            {!primarySet && (
              <p className="mt-3 text-xs text-red-600 dark:text-red-400">
                Upload File 1 first so we know what to compare against.
              </p>
            )}
          </div>
        </section>

        {(loading || statusMessage) && (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            {loading && (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                ⏳ {statusMessage || "Processing files..."}
              </p>
            )}
            {!loading && statusMessage && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✅ {statusMessage}
              </p>
            )}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-5">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">
              ❌ {errorMessage}
            </p>
          </div>
        )}

        {uniqueValues.length > 0 && (
          <section className="space-y-5">
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Results
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found <strong>{uniqueValues.length.toLocaleString()}</strong>{" "}
                  unique numbers in File 2 that are absent in File 1.
                </p>
              </div>
              <button
                type="button"
                onClick={handleDownloadUnique}
                className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                ⬇️ Download as Excel
              </button>
            </div>

            <div className="rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-gray-800/80">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                      #
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-300">
                      Number
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 bg-white dark:bg-gray-900">
                  {uniqueValues.slice(0, 100).map((value, index) => (
                    <tr key={`${value}-${index}`}>
                      <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                        {index + 1}
                      </td>
                      <td className="px-4 py-2 text-sm font-mono text-gray-900 dark:text-gray-100">
                        {value}
                      </td>
                    </tr>
                  ))}
                  {uniqueValues.length > 100 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-4 py-3 text-center text-xs text-gray-500 dark:text-gray-400"
                      >
                        Showing first 100 of{" "}
                        {uniqueValues.length.toLocaleString()} results. Download
                        the Excel file to see everything.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            📘 Tips
          </h2>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <li>
              Each file should contain the numbers in the first column. We
              automatically ignore header rows that look like labels.
            </li>
            <li>
              CSV and Excel formats are supported. For massive datasets, prefer
              .xlsx for better accuracy.
            </li>
            <li>
              The download button exports an Excel file containing only the
              numbers unique to File 2.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default UniqueExcelPage;
