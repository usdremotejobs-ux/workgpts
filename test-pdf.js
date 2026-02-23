const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

async function testExtraction() {
    const data = new Uint8Array(fs.readFileSync(process.argv[2]));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map(item => item.str)
            .join("  ");
        fullText += pageText + "  ";
    }

    let cleanText = fullText
        .replace(/Page \d+ of \d+/g, '') // remove page numbers
        .replace(/Contact[\s\S]*?(?=Top Skills)/i, '') // sometimes there's a contact sidebar
        .replace(/ {2,}/g, '\n') // Turn 2+ spaces into new lines!
        .replace(/\n\s*\n/g, '\n') // remove empty lines
        .trim();

    const lines = cleanText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    console.log("=== RAW PDF TEXT ===");
    console.log(lines.slice(0, 30).join('\n'));
    console.log("====================");
}

testExtraction().catch(console.error);
