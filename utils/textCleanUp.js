function normalize(str) {
    return str.toLowerCase().replace(/[_\-\.]/g, ' ').replace(/\s+/g, ' ').trim();
  }

function cleanQuery(track){
    const name = track.name
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .replace(/\s*\[.*?\]\s*/g, ' ')
    .replace(/\s*-\s*From\s+".*?"/gi, '')
    .replace(/\s*-\s*(Jhankar Beats|Happy|With Dialogue|Part| \d+).*$/i, '')
    .replace(/feat\..*/i, '')
    .trim();
    const firstArtist = track.artist.split(',')[0].trim();
    return `${firstArtist} ${name}`;
}

function filenameMatches(filepath, songName) {
  const name = normalize(filepath.split('\\').pop().replace(/\.\w+$/, ''));
  const song = normalize(songName);
  const escaped = song.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`);
  return re.test(name);
}

module.exports = { normalize, cleanQuery, filenameMatches };