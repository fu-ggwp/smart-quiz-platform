"use client";

import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle, Download, FileCheck, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ExcelImporter({ onQuestionsImported, onCancel }) {
  const [file, setFile] = useState(null);
  const [parsedQuestions, setParsedQuestions] = useState([]);
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState({ total: 0, valid: 0, invalid: 0 });
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      processExcel(selectedFile);
    }
    // Reset file input value to allow uploading the same file again
    e.target.value = "";
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  // Download template file for teacher
  const downloadTemplate = () => {
    const headers = [
      "Question Text",
      "Option 1",
      "Option 2",
      "Option 3",
      "Option 4",
      "Option 5",
      "Correct Option",
      "Explanation",
      "Chapter"
    ];

    const sampleData = [
      [
        "What is the capital of France?",
        "Berlin",
        "Madrid",
        "Paris",
        "Rome",
        "",
        "3",
        "Paris is the capital of France.",
        "Europe"
      ],
      [
        "Water boils at 100 degrees Celsius under standard atmospheric conditions.",
        "True",
        "False",
        "",
        "",
        "",
        "1",
        "It is a scientific fact.",
        "Physics"
      ],
      [
        "Which of the following are prime numbers?",
        "2",
        "4",
        "5",
        "8",
        "9",
        "1, 3",
        "Both 2 and 5 are prime numbers. For questions with multiple correct options, enter their indexes separated by commas (e.g., '1, 3').",
        "Number Theory"
      ]
    ];

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
    XLSX.writeFile(workbook, "study_set_import_template.xlsx");
  };

  // Parse and validate Excel sheet
  const processExcel = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        if (rows.length < 2) {
          setErrors(["The Excel file is empty or missing headers."]);
          return;
        }

        const headers = rows[0].map(h => String(h || "").trim().toLowerCase());
        const dataRows = rows.slice(1);

        const textIdx = headers.indexOf("question text");
        const correctIdx = headers.indexOf("correct option");
        const explanationIdx = headers.indexOf("explanation");
        const chapterIdx = headers.indexOf("chapter");

        const optionIndices = [];
        headers.forEach((h, idx) => {
          if (h.startsWith("option")) {
            optionIndices.push({ index: idx, name: rows[0][idx] });
          }
        });

        const headerErrors = [];
        if (textIdx === -1) {
          headerErrors.push("Missing required column: 'Question Text'");
        }
        if (correctIdx === -1) {
          headerErrors.push("Missing required column: 'Correct Option'");
        }
        if (optionIndices.length < 2) {
          headerErrors.push("You must include at least two option columns (e.g., 'Option 1', 'Option 2').");
        }

        if (headerErrors.length > 0) {
          setErrors(headerErrors);
          return;
        }

        const validList = [];
        const errorList = [];

        dataRows.forEach((row, rowIdx) => {
          const rowNum = rowIdx + 2;
          
          if (row.filter(cell => cell !== null && cell !== undefined && cell !== "").length === 0) {
            return;
          }

          const correctStr = String(row[correctIdx] || "").trim();
          const correctVals = correctStr.split(/[\s,;]+/).map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));

          const qText = String(row[textIdx] || "").trim();
          const explanation = row[explanationIdx] ? String(row[explanationIdx]).trim() : "";
          const chapter = row[chapterIdx] ? String(row[chapterIdx]).trim() : "";

          const options = [];
          optionIndices.forEach((optCol) => {
            const val = row[optCol.index];
            const text = val !== undefined && val !== null ? String(val).trim() : "";
            if (text !== "") {
              options.push({ option_text: text, is_correct: false });
            }
          });

          if (!qText) {
            errorList.push({ row: rowNum, message: "'Question Text' is empty." });
            return;
          }
          if (options.length < 2) {
            errorList.push({ row: rowNum, message: "A question must have at least 2 non-empty options." });
            return;
          }
          if (correctVals.length === 0) {
            errorList.push({
              row: rowNum,
              message: `Missing or invalid 'Correct Option' value: '${row[correctIdx] || ""}'.`
            });
            return;
          }

          let hasInvalidIndex = false;
          correctVals.forEach(val => {
            if (val < 1 || val > options.length) {
              hasInvalidIndex = true;
            }
          });

          if (hasInvalidIndex) {
            errorList.push({ 
              row: rowNum, 
              message: `Invalid 'Correct Option' value: '${correctStr}'. It must be numbers between 1 and ${options.length} (e.g. '1, 3').` 
            });
            return;
          }
          
          correctVals.forEach(val => {
            options[val - 1].is_correct = true;
          });

          validList.push({
            question_text: qText,
            explanation,
            chapter,
            options
          });
        });

        setParsedQuestions(validList);
        setErrors(errorList);
        setStats({
          total: validList.length + errorList.length,
          valid: validList.length,
          invalid: errorList.length
        });
      } catch (err) {
        console.error("Excel processing failed:", err);
        setErrors([{ row: "File", message: "Failed to read Excel structure. Please ensure it is a valid file." }]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportClick = () => {
    if (parsedQuestions.length > 0) {
      onQuestionsImported(parsedQuestions);
    }
  };

  const hasErrors = errors.length > 0;
  
  // Dynamic styling based on upload state
  let uploadIcon = <Upload className="size-6" />;
  let iconBgClass = "bg-muted text-primary";
  let uploadBorderClass = "border-border hover:border-ring bg-muted/20";
  
  if (file) {
    if (hasErrors) {
      uploadIcon = <FileX className="size-6 text-rose-600" />;
      iconBgClass = "bg-rose-100";
      uploadBorderClass = "border-rose-300 hover:border-rose-400 bg-rose-50/10";
    } else {
      uploadIcon = <FileCheck className="size-6 text-emerald-600" />;
      iconBgClass = "bg-emerald-100";
      uploadBorderClass = "border-emerald-300 hover:border-emerald-400 bg-emerald-50/10";
    }
  }

  return (
    <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-lg">
      <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Import Questions from Excel</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Upload an Excel file to bulk-import multiple choice questions directly.
          </p>
        </div>
      </div>

      <div 
        onClick={triggerFileSelect}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition mb-6 ${uploadBorderClass}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".xlsx, .xls, .csv" 
          onChange={handleFileChange}
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`p-3 rounded-full transition-all duration-300 ${iconBgClass}`}>
            {uploadIcon}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {file ? file.name : "Click to upload or drag & drop"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supports Excel (.xlsx, .xls) and CSV files
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between bg-muted/40 p-4 rounded-xl border border-border mb-6">
        <div className="flex items-center gap-3">
          <FileSpreadsheet className="size-5 text-emerald-600" />
          <div className="text-xs">
            <p className="font-semibold text-foreground">Excel Import Template</p>
            <p className="text-muted-foreground">Download the correct format sheet template.</p>
          </div>
        </div>
        <Button onClick={downloadTemplate} variant="outline" size="sm" type="button" className="gap-2">
          <Download size={14} />
          Template
        </Button>
      </div>

      {file && (
        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-muted p-3 rounded-xl text-center">
              <p className="text-xs text-muted-foreground font-semibold">Total Rows</p>
              <p className="text-lg font-bold text-foreground mt-1">{stats.total}</p>
            </div>
            <div className="bg-emerald-50 text-emerald-900 p-3 rounded-xl text-center border border-emerald-100">
              <p className="text-xs text-emerald-700 font-semibold">Valid Rows</p>
              <p className="text-lg font-bold text-emerald-800 mt-1">{stats.valid}</p>
            </div>
            <div className="bg-rose-50 text-rose-900 p-3 rounded-xl text-center border border-rose-100">
              <p className="text-xs text-rose-700 font-semibold">Error Rows</p>
              <p className="text-lg font-bold text-rose-800 mt-1">{stats.invalid}</p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="border border-rose-100 bg-rose-50/50 p-4 rounded-xl max-h-[180px] overflow-y-auto">
              <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-2">
                <AlertTriangle size={16} />
                <span>Import Errors Detected:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-rose-700 list-disc pl-4">
                {errors.map((err, idx) => (
                  <li key={idx}>
                    {typeof err === "string"
                      ? err
                      : `${err.row ? `Row ${err.row}: ` : ""}${err.message}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stats.valid > 0 && errors.length === 0 && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-100 text-sm">
              <CheckCircle size={18} className="text-emerald-600" />
              <span>All rows look healthy and ready to import!</span>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button onClick={onCancel} variant="outline" size="sm" type="button">
          Cancel
        </Button>
        <Button
          onClick={handleImportClick}
          disabled={parsedQuestions.length === 0}
          size="sm"
          type="button"
        >
          Import {parsedQuestions.length > 0 ? `(${parsedQuestions.length})` : ""} Questions
        </Button>
      </div>
    </div>
  );
}
