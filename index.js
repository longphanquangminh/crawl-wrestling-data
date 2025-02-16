import { scrapeLinks, fetchPages } from './src/scraper.js';
import { BASE_URL } from './src/constants/index.js';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const URL = `${BASE_URL}/?id=8&nr=1&page=15`;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILE_PATH = join(__dirname, './storage/filteredRecordData.json');

(async () => {
  const links = await scrapeLinks(URL);

  if (links.length === 0) {
    console.log('No links found.');
    return;
  }

  const rawJsonRecordData = await readFile(FILE_PATH, 'utf8');
  const jsonRecordData = JSON.parse(rawJsonRecordData || '{}');
  const tempBatch = links.filter(item => !jsonRecordData[item]);

  console.log(`Found ${tempBatch.length} necessary links, starting batch requests...`);

  const possibleSize = Math.min(tempBatch.length, 500);

  const results = await fetchPages(tempBatch, possibleSize); // Default batch size = 5

  console.log('results', results);
})();
