// scrape-vegasx.mjs
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(__dirname, 'scraped-assets');
const url = 'https://vegas-x.org/';

const staticExtensions = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.mp3',
  '.wav',
  '.ogg',
  '.css',
  '.js',
  '.json',
  '.woff',
  '.woff2',
  '.ttf',
];

const isStatic = (request) => {
  const u = new URL(request.url());
  return staticExtensions.some((ext) => u.pathname.toLowerCase().endsWith(ext));
};

await mkdir(outputDir, { recursive: true });

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();

// Перехват и сохранение ответов для статических файлов
page.on('response', async (response) => {
  try {
    const request = response.request();
    if (!isStatic(request)) return;

    const urlPath = new URL(response.url()).pathname;
    const filename = urlPath.split('/').filter(Boolean).join('_');
    const filePath = path.join(outputDir, filename || 'index');

    const buffer = await response.buffer();
    await writeFile(filePath, buffer);
    console.log('saved', filePath);
  } catch (err) {
    console.warn('skip', response.url(), err.message);
  }
});

await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
await new Promise((res) => setTimeout(res, 2000));
await browser.close();

console.log('Done. Files in', outputDir);
