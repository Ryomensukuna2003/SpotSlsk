const axios = require('axios');

const BASE = "http://localhost:5030";

async function test() {
  // 1. search
  const res = await axios.post(`${BASE}/api/v0/searches`, {
    searchText: "Travis Scott Goosebumps FLAC"
  });

  const searchId = res.data.id;
  console.log("Search ID:", searchId);

  // 2. wait + fetch results
  await new Promise(r => setTimeout(r, 3000));

  const results = await axios.get(`${BASE}/api/v0/searches/${searchId}`);

  console.log("Results:", results.data.results.slice(0, 3));
}

test();