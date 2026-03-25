# SpotSlsk

Since spotify prices are too high, Spotify restricted API usage and I don't want to pay for digital info, I took matters in my own hand and build spotify playlist downloader type. 

What is Lossless? (FLAC files)
Lossless audio is best audio quality you can get and even Spotify limits audio quality to 320kbps. Lossless audio is a type of audio compression that preserves the original quality of the audio file. It is a type of audio compression that does not lose any information from the original audio file. It is a type of audio compression that does not lose any information from the original audio file.

A command-line tool that bridges Spotify playlists with Soulseek. Scrape tracks from any Spotify playlist and automatically search & download them as lossless FLAC files through a local [slskd](https://github.com/slskd/slskd) instance.

## Demo

<video src="assets/demo.mov" controls width="100%"></video>

## How It Works

### Step 1 — Extract Playlists from Spotify

`SpotifyPlaylist.js` uses Puppeteer to open the Spotify web player, scroll through your playlists, and extract every track — no API key or Premium account required. Spotify login is handled via browser (cookies are saved for future runs).

### Step 2 — Download from Soulseek

`index.js` reads the extracted playlist JSON and searches for each track on the Soulseek network via slskd:

- **Smart Search** — Up to 3 search attempts per track with progressively relaxed queries:
  - `{artist} {song} flac`
  - `{song} {artist} flac`
  - `{song} flac`
- **Intelligent Matching** — Validates that filenames contain the full song title as a phrase, avoiding false positives.
- **Best File Selection** — Prioritizes FLAC files from users with free upload slots and fastest speeds.
- **Auto Retry** — Failed tracks are written to `Playlists/retry.json` for easy re-runs.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/)
- A Soulseek account
- A Spotify account (free or premium)

## Installation

### 1. Run slskd via Docker

```bash
docker run -d \
  --name slskd \
  -p 5030:5030 \
  -p 5031:5031 \
  -p 50300:50300 \
  -v $(pwd)/slskd:/app \
  -e SLSKD_SLSK_USERNAME=your_soulseek_username \
  -e SLSKD_SLSK_PASSWORD=your_soulseek_password \
  -e SLSKD_USERNAME=admin \
  -e SLSKD_PASSWORD=admin \
  ghcr.io/slskd/slskd:latest
```

The slskd web UI will be available at `http://localhost:5030`. Downloaded files are saved to `./slskd/downloads/`.

### 2. Install SpotSlsk

```bash
git clone https://github.com/yourusername/spotslsk.git
cd spotslsk
npm install
```

## Usage

### 1. Extract Spotify playlists

```bash
node SpotifyPlaylist.js
```

On first run, a browser window opens for Spotify login. After that, paste playlist URLs one at a time. Each playlist is saved as a JSON file in `Playlists/` named after the playlist.

### 2. Download FLAC files

```bash
# Download from a specific playlist
node index.js Playlists/SORROW.json

# Retry failed downloads (default)
npm start
```

### 3. Retry failed tracks

After each run, tracks that weren't found are saved to `Playlists/retry.json`. Simply run again:

```bash
npm start
```

## Configuration

Update the slskd credentials in `index.js` if your login differs from the defaults:

```js
const client = await loginToken("admin", "admin");
```

The slskd base URL can be changed in `utils/login.js`.

## Project Structure

```
├── SpotifyPlaylist.js        # Spotify playlist scraper (Puppeteer)
├── index.js                  # Soulseek download pipeline
├── utils/
│   ├── login.js              # slskd authentication
│   ├── soulseekUtils.js      # Search, file selection, and download logic
│   └── textCleanUp.js        # Query cleaning and filename matching
├── assets/
│   └── demo.mov              # Puppeteer scraping demo
└── Playlists/                # Extracted playlist JSON files
```
