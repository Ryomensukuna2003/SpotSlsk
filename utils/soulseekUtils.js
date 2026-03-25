const { cleanQuery, filenameMatches } = require('./textCleanUp');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function searchAndDownload(client, track, index, total) {
    // Clean up the track name
    const label = `[${index + 1}/${total}]`;
    const cleanName = cleanQuery(track);
    const firstArtist = track.artist.split(',')[0].trim();
    const queries = [
      `${firstArtist} ${cleanName} flac`,
      `${cleanName} ${firstArtist} flac`,
      `${cleanName} flac`
    ];
  
    // Search for the track
    try {
      for (let q = 0; q < queries.length; q++) {
        const query = queries[q];
        const attempt = q === 0 ? '' : ` (attempt ${q + 1})`;
        console.log(`${label}${attempt} Searching: ${query}`);
  
        const best = await trySearch(client, query, cleanName);
        if (best) {
          const shortName = best.filename.split('\\').pop();
          console.log(`${label} OK: → ${shortName}`);
          await client.post(`/api/v0/transfers/downloads/${encodeURIComponent(best.username)}`, [{
            filename: best.filename,
            size: best.size
          }]);
          return { track, status: 'queued', file: shortName };
        }
      }
  
      console.log(`${label} SKIP (no FLAC found after ${queries.length} attempts)`);
      return { track, status: 'not_found' };
  
    } catch (err) {
      console.log(`${label} ERR: ${err.message}`);
      return { track, status: 'error', error: err.message };
    }
  }

  async function pickBestFile(responses, songName) {
    const candidates = [];
    for (const resp of responses) {
      for (const file of resp.files) {
        if (file.isLocked) continue;
        const ext = file.filename.split('.').pop().toLowerCase();
        if (ext !== 'flac') continue;
        if (!filenameMatches(file.filename, songName)) continue;
        candidates.push({
          username: resp.username,
          filename: file.filename,
          size: file.size,
          bitRate: file.bitRate || 0,
          hasFreeSlot: resp.hasFreeUploadSlot,
          speed: resp.uploadSpeed || 0
        });
      }
    }
    if (candidates.length === 0) return null;
  
    candidates.sort((a, b) => {
      const aSlot = a.hasFreeSlot ? 1 : 0;
      const bSlot = b.hasFreeSlot ? 1 : 0;
      if (aSlot !== bSlot) return bSlot - aSlot;
      return b.speed - a.speed;
    });
  
    return candidates[0];
  }
  

  async function waitForSearch(client, searchId) {
    await sleep(15000);
    for (let i = 0; i < 10; i++) {
      const res = await client.get(`/api/v0/searches/${searchId}`);
      if (res.data.state.includes('Completed') && res.data.fileCount > 0) return;
      if (res.data.state.includes('Completed') && i >= 2) return;
      await sleep(3000);
    }
  }

  async function trySearch(client, query, mustContain) {
    const searchRes = await client.post('/api/v0/searches', { searchText: query });
    await waitForSearch(client, searchRes.data.id);
    const results = await client.get(`/api/v0/searches/${searchRes.data.id}/responses`);
    return pickBestFile(results.data, mustContain);
  }


  module.exports = { searchAndDownload, trySearch };