export interface PdfTextResult {
  text: string;
  error?: string;
}

import workerSrc from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  loadPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = workerSrc;
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

/**
 * Extracts the text layer from every page of a PDF resume.
 * This is what gets sent to Groq instead of the raw file, since
 * (unlike Puter) Groq's chat API can't read a PDF file reference directly.
 */
export async function extractResumeText(file: File): Promise<PdfTextResult> {
  try {
    const lib = await loadPdfJs();

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;

    const pageTexts: string[] = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      pageTexts.push(pageText);
    }

    const text = pageTexts.join("\n\n").replace(/\s+/g, " ").trim();

    if (!text) {
      return {
        text: "",
        error:
          "No selectable text found in this PDF. It may be a scanned image without a text layer.",
      };
    }

    return { text };
  } catch (err) {
    return {
      text: "",
      error: `Failed to extract text from PDF: ${err}`,
    };
  }
}