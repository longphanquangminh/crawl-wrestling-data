import axios from 'axios';
import * as cheerio from 'cheerio';
import { BASE_URL } from './constants/index.js';
import { readFile, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const FILE_PATH = join(__dirname, '../storage/filteredRecordData.json');

export async function scrapeLinks(url) {
  try {
    console.log('url', url);
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    return $('.TableContents .TCol.TColSeparator a')
      .map((index, el) => {
        const tempValue = $(el).attr('href');
        const result = `${BASE_URL}/${tempValue}&page=11`;

        if (index === 0) {
          console.log('Sample href', tempValue);
          console.log('Sample full link', result);
        }

        return result;
      })
      .get()
      .filter(Boolean);
  } catch (error) {
    console.error('Scraping error:', error.message);
    return [];
  }
}

export async function fetchPages(links, batchSize = 5) {
  const temp = [];

  for (let i = 0; i < links.length; i += batchSize) {
    const batch = links.slice(i, i + batchSize);

    console.log(`Fetching batch: ${i + 1} - ${i + batch.length}`);

    const responses = await Promise.allSettled(batch.map(link => axios.get(link).then(res => res.data)));

    temp.push(...responses.map(res => (res.status === 'fulfilled' ? res.value : `Error: ${res.reason}`)));

    // Optional delay to avoid rate-limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const tempIdx = [];
  const rawJsonRecordData = await readFile(FILE_PATH, 'utf-8');
  const jsonRecordData = JSON.parse(rawJsonRecordData || '{}');

  const filteredTemp = temp.filter((item, index) => {
    const $ = cheerio.load(item);
    const rows = $('tr:not(.THeaderRow)').toArray();

    for (let i = 0; i < rows.length; i++) {
      const el = rows[i];
      const firstCol = $(el).find('td.TCol.TColSeparator').first();
      const hasToday = firstCol.find('.TextHighlightBold').length > 0;

      if (hasToday) {
        const rightCol = $(el).find('td.TCol.TColSeparator').eq(1);
        const hasIndieTitle = rightCol.text().slice(0, 3) !== 'WWE';

        if (hasIndieTitle) {
          tempIdx.push(index);
          return true;
        }
      }
    }

    jsonRecordData[links[index]] = true;
    return false;
  });

  await writeFile(FILE_PATH, JSON.stringify(jsonRecordData, null, 2), 'utf-8');

  const results = filteredTemp.map((item, index) => {
    const $ = cheerio.load(item);
    const name = $('.TextHeader').first().text().trim();
    return `${name} - ${links[tempIdx[index]]?.replace(/'/g, '%27')}`;
  });

  return results;
}
