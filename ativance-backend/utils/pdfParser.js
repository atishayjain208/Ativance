const fs       = require('fs');
const path     = require('path');
const pdfParse = require('pdf-parse');

/**
 * extractTextFromPDF(filePath)
 *
 * Reads a PDF from disk and returns its extracted plain text.
 *
 * @param {string} filePath  Absolute or relative path to the PDF file.
 * @returns {Promise<string>}  The raw text content of the PDF.
 * @throws  Will throw a descriptive Error if the file cannot be read or parsed.
 */
const extractTextFromPDF = async (filePath) => {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(__dirname, '..', filePath);

  // Validate the file exists before attempting to read it
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`PDF file not found at path: ${absolutePath}`);
  }

  const buffer = fs.readFileSync(absolutePath);
  const data   = await pdfParse(buffer);

  // data.text is the concatenated plain text of all pages
  const text = (data.text || '').trim();

  if (!text) {
    throw new Error('PDF appears to be empty or image-only with no extractable text.');
  }

  return text;
};

module.exports = { extractTextFromPDF };
