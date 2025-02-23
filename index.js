import { scrapeLinks, fetchPages } from './src/scraper.js';
import { BASE_URL } from './src/constants/index.js';
import { join } from 'path';
import { getFileData } from './src/processFileData.js';

const URL = `${BASE_URL}/?id=8&nr=1&page=15`;

const FILE_PATH = join(process.cwd(), 'storage/filteredRecordData.json');

(async () => {
  const links = await scrapeLinks(URL);

  if (links.length === 0) {
    console.log('No links found.');
    return;
  }

  const isFetchingFromScratch = true;
  let tempBatch = [];

  if (isFetchingFromScratch) {
    tempBatch = links;
  } else {
    const jsonRecordData = await getFileData(FILE_PATH);
    tempBatch = links.filter(item => !jsonRecordData[item]);
  }

  console.log(`Found ${tempBatch.length} necessary links, starting batch requests...`);

  const possibleSize = Math.min(tempBatch.length, 500);

  const results = await fetchPages(tempBatch, possibleSize); // Default batch size = 5

  console.log('results', results);
})();
