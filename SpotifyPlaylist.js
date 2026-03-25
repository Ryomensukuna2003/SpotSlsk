const puppeteer = require('puppeteer');
const fs = require('fs');
const readline = require('readline');

const COOKIE_FILE = '.spotify-cookies.json';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function login(browser) {
  const page = await browser.newPage();
  await page.goto('https://accounts.spotify.com/en/login', { waitUntil: 'networkidle2' });

  console.log('\nSpotify login opened in browser. Please log in...');
  await page.waitForFunction(
    () => window.location.hostname === 'open.spotify.com',
    { timeout: 120000 }
  );
  console.log('Logged in!\n');

  const cookies = await browser.cookies();
  fs.writeFileSync(COOKIE_FILE, JSON.stringify(cookies, null, 2));
  await page.close();
}

async function getPlaylistTracks(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  await page.waitForSelector('[data-testid="tracklist-row"]', { timeout: 15000 }).catch(() => {});


  const name = await page.evaluate(() => {
    return document.querySelector('[data-testid="entityTitle"] h1')?.textContent?.trim() || 'Unknown';
  });

  const seen = new Map();
  let stableRounds = 0;
  let prevSize = 0;

  while (stableRounds < 8) {
    const visible = await page.evaluate(() => {
      const rows = document.querySelectorAll('[data-testid="tracklist-row"]');
      return Array.from(rows).map(row => {
        const idx = row.getAttribute('aria-rowindex') || row.querySelector('[data-testid="tracklist-row"]')?.getAttribute('aria-rowindex');
        const titleEl = row.querySelector('[data-testid="internal-track-link"] div');
        const artistEls = row.querySelectorAll('span a[href*="/artist/"]');
        return {
          index: idx,
          name: titleEl?.textContent?.trim() || '',
          artist: Array.from(artistEls).map(a => a.textContent.trim()).join(', ') || 'Unknown'
        };
      }).filter(t => t.name);
    });

    for (const track of visible) {
      const key = `${track.name}|||${track.artist}`;
      if (!seen.has(key)) seen.set(key, track);
    }

    if (seen.size === prevSize) {
      stableRounds++;
    } else {
      stableRounds = 0;
      prevSize = seen.size;
      process.stdout.write(`\r  Scrolling... ${seen.size} tracks collected`);
    }

    await page.mouse.move(640, 450);
    await page.mouse.wheel({ deltaY: 300 });
    await new Promise(r => setTimeout(r, 1200));
  }

  const tracks = Array.from(seen.values()).map(t => ({ name: t.name, artist: t.artist }));
  process.stdout.write(`\r  Found ${tracks.length} tracks in "${name}"                \n`);
  await page.close();
  return { name, tracks };
}

async function main() {
  if (!fs.existsSync('Playlists')) fs.mkdirSync('Playlists');

  const browser = await puppeteer.launch({ headless: false });

  if (fs.existsSync(COOKIE_FILE)) {
    const cookies = JSON.parse(fs.readFileSync(COOKIE_FILE, 'utf-8'));
    await browser.setCookie(...cookies);
    console.log('Loaded saved session.');
  } else {
    await login(browser);
  }

  const testPage = await browser.newPage();
  await testPage.goto('https://open.spotify.com', { waitUntil: 'networkidle2' });
  const loggedIn = await testPage.evaluate(() => !document.querySelector('[data-testid="login-button"]'));
  await testPage.close();

  if (!loggedIn) {
    console.log('Session expired, logging in again...');
    fs.unlinkSync(COOKIE_FILE);
    await login(browser);
  }

  while (true) {
    const url = await askQuestion('\nSpotify playlist URL (or "done" to exit): ');

    if (url.trim().toLowerCase() === 'done') break;

    if (!url.includes('/playlist/')) {
      console.log('Invalid URL — must be a Spotify playlist link.');
      continue;
    }

    try {
      const { name, tracks } = await getPlaylistTracks(browser, url.trim());
      const filename = `Playlists/${name.replace(/[\/\\?%*:|"<>]/g, '_')}.json`;
      fs.writeFileSync(filename, JSON.stringify(tracks, null, 2));
      console.log(`  Saved to ${filename}`);
    } catch (err) {
      console.error('Error:', err.message);
    }
  }

  await browser.close();
  rl.close();
}

main();
