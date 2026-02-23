import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

// Ensure the worker uses the matching version
if (typeof window !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
}

export interface ParsedProfile {
    headline: string;
    summary: string;
    experience: string;
}

export async function extractTextFromPDF(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        // The items array contains the text pieces
        // We join with double spaces so that visual blocks stay separated, which is crucial for LinkedIn's layout.
        const pageText = textContent.items
            .map((item: any) => item.str)
            .join("  ");
        fullText += pageText + "  ";
    }

    return fullText;
}

export function parseLinkedInText(rawText: string): ParsedProfile {
    // 1. Clean noise: Remove extra spaces, empty lines, and standard PDF footers like "Page 1 of 3"
    let cleanText = rawText
        .replace(/Page \d+ of \d+/ig, '') // remove page numbers
        .replace(/ {2,}/g, '\n') // Turn visual spaces (2+) into actual line breaks
        .replace(/\n\s*\n/g, '\n') // remove empty lines
        .trim();

    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    let headline = "";
    let summary = "";
    let experience = "";

    // Find section indices
    const summaryIdx = lines.findIndex(l => /^Summary$/i.test(l));
    const experienceIdx = lines.findIndex(l => /^Experience$/i.test(l));

    // In LinkedIn PDFs, the Name, Headline, and Location appear immediately before the first section (Summary or Experience).
    const firstSectionIdx = summaryIdx !== -1 ? summaryIdx : experienceIdx;

    if (firstSectionIdx >= 2) {
        // Name is usually 3 lines above, Headline is 2 lines above the first section
        // Depending on if location is present, it might shift by 1. We grab the block above.
        const name = lines[firstSectionIdx - 3] || "";
        const title = lines[firstSectionIdx - 2] || lines[firstSectionIdx - 1] || "";
        headline = name ? `${name} | ${title}` : title;
    }

    // Find where the experience section ends
    const nextSectionIndices = [
        lines.findIndex(l => /^Education$/i.test(l)),
        lines.findIndex(l => /^Certifications?$/i.test(l)),
        lines.findIndex(l => /^Languages?$/i.test(l)),
        lines.findIndex(l => /^Skills$/i.test(l)),
        lines.length
    ].filter(idx => idx > experienceIdx); // only consider sections that appear AFTER experience

    const endOfExperienceIdx = Math.min(...nextSectionIndices);

    // Extract Summary if it exists
    if (summaryIdx !== -1) {
        const endOfSummary = experienceIdx !== -1 ? experienceIdx : lines.length;
        if (endOfSummary > summaryIdx) {
            summary = lines.slice(summaryIdx + 1, endOfSummary).join('\n');
        }
    }

    // Extract Experience if it exists
    if (experienceIdx !== -1 && endOfExperienceIdx > experienceIdx) {
        const expLines = lines.slice(experienceIdx + 1, endOfExperienceIdx);

        // Remove lines that look like single dates or locations which waste tokens
        // e.g. "January 2020 - Present (3 years)"
        const filteredExpLines = expLines.filter(line => {
            const isDateLine = /january|february|march|april|may|june|july|august|september|october|november|december/i.test(line) && /\d{4}/.test(line);
            if (isDateLine) return false;
            return true;
        });

        experience = filteredExpLines.join('\n');
    }

    return {
        headline: headline.trim(),
        summary: summary.trim(),
        experience: experience.trim()
    };
}
