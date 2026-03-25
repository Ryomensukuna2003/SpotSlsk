const fs = require('fs');
const { loginToken } = require('./utils/login');
const { searchAndDownload } = require('./utils/soulseekUtils');


async function main() {
    // Read file
  const playlistFile = process.argv[2] || 'Playlists/retry.json';
  const tracks = JSON.parse(fs.readFileSync(playlistFile, 'utf-8'));
  console.log(`Downloading ${tracks.length} tracks from ${playlistFile}\n`);

  // Login to Soulseek
  const client = await loginToken("admin", "admin");
  const results = [];

  // Download tracks
  for (let i = 0; i < tracks.length; i++) {
    const result = await searchAndDownload(client, tracks[i], i, tracks.length);
    results.push(result);
  }

  // Print results
  const queued = results.filter(r => r.status === 'queued').length;
  const failed = results.filter(r => r.status !== 'queued');

  console.log(`\nDone! Queued: ${queued}, Failed/Skipped: ${failed.length}`);

  // If there are failed tracks, write them to a file
  if (failed.length > 0) {
    console.log('\n── FAILED / SKIPPED ──────────────────────────────');
    for (const r of failed) {
      const reason = r.status === 'error' ? `ERR: ${r.error}` : 'NOT FOUND';
      console.log(`  ${r.track.artist} - ${r.track.name}  [${reason}]`);
    }
    console.log('──────────────────────────────────────────────────');

    const retryTracks = failed.map(r => r.track);
    fs.writeFileSync('Playlists/retry.json', JSON.stringify(retryTracks, null, 2));
    console.log(`\nWrote ${retryTracks.length} failed tracks to Playlists/retry.json`);
  }
}

main();
