# SpotSlsk

A command-line tool that bridges Spotify playlists with Soulseek. Extract tracks from any public Spotify playlist and automatically search & download them as lossless FLAC files through a local [slskd](https://github.com/slskd/slskd) instance.

## How It Works

1. **Playlist Extraction** — Fetches track metadata (song name, artist) from Spotify's embed page. No API key or Premium account required.
2. **Smart Search** — For each track, performs up to 3 search attempts on the Soulseek network with progressively relaxed queries:
   - `{artist} {song} flac`
   - `{song} {artist} flac`
   - `{song} flac`
3. **Intelligent Matching** — Validates that search results actually match the requested song using normalized phrase matching against filenames, avoiding false positives.
4. **Best File Selection** — Prioritizes results with free upload slots and fastest upload speeds.
5. **Auto Retry** — Failed/skipped tracks are automatically written to `Playlists/retry.json` for easy re-runs.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [slskd](https://github.com/slskd/slskd) running locally (default: `http://localhost:5030`)
- A configured Soulseek account in slskd

## Installation

```bash
git clone https://github.com/yourusername/spotslsk.git
cd spotslsk
npm install
```

## Configuration

Update the slskd credentials in `index.js` if your login differs from the defaults:

```js
const client = await loginToken("admin", "admin");
```

The slskd base URL can be changed in `utils/login.js`.

## Usage

### Download from a playlist JSON

```bash
# Uses Playlists/retry.json by default
npm start

# Or specify a playlist file
node index.js Playlists/OLD.json
```

### Playlist JSON format

Each playlist file is a JSON array of tracks:

```json
[
  { "name": "Gimme More", "artist": "Britney Spears" },
  { "name": "Into You", "artist": "Ariana Grande" }
]
```

You can create these manually or scrape them from Spotify using the embed endpoint.

### Retry failed downloads

After each run, any tracks that weren't found are saved to `Playlists/retry.json`. Simply run again:

```bash
npm start
```

## Project Structure

```
├── index.js                  # Entry point — orchestrates the download pipeline
├── utils/
│   ├── login.js              # slskd authentication
│   ├── soulseekUtils.js      # Search, file selection, and download logic
│   └── textCleanUp.js        # Query cleaning and filename matching
└── Playlists/                # Playlist JSON files
```