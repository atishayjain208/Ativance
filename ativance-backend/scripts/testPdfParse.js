const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');

const run = async () => {
  try {
    const targetFile = 'uploads/6a5a55fb279b7aba2abb369b_1784312778015.pdf';
    const absolutePath = path.resolve(__dirname, '..', targetFile);
    console.log(`Attempting to parse file: ${absolutePath}`);
    
    if (!fs.existsSync(absolutePath)) {
      console.error('File does not exist!');
      return;
    }

    const buffer = fs.readFileSync(absolutePath);
    const parser = new PDFParse(new Uint8Array(buffer));
    const data = await parser.getText();

    console.log('--- Extracted Text Preview ---');
    console.log((data.text || '').substring(0, 500));
    console.log('------------------------------');
    console.log(`Success! Total characters: ${(data.text || '').length}`);
  } catch (err) {
    console.error('Failed to parse PDF:');
    console.error(err);
  }
};

run();
