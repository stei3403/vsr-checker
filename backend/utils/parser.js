const cheerio = require('cheerio');

function parseVSR(html) {
  const $ = cheerio.load(html);
  const ecuData = [];
  const dtcData = [];

  // === Extract ECU Info ===
  const rows = $('#ecuInformationTable tr').slice(1);
  rows.each((_, row) => {
    const cells = $(row).find('td');
    if (cells.length === 2 && $(cells[1]).text().includes('No positive response')) {
      ecuData.push({
        ECU: $(cells[0]).text().trim(),
        PartNum: 'N/A',
        SWVersion: 'N/A',
      });
    } else if (cells.length >= 8) {
      ecuData.push({
        ECU: $(cells[0]).text().trim(),
        PartNum: $(cells[3]).text().trim(),
        SWVersion: $(cells[7]).text().trim(),
      });
    }
  });

  // === Extract Metadata ===
  const text = $('body').text();
  const metadata = {
    year: text.match(/Year:\s*(\d{4})/)?.[1] ?? '',
    body: text.match(/Body:\s*([A-Z0-9]+)/)?.[1] ?? '',
    vin: text.match(/VIN:\s*([A-Z0-9]+)/)?.[1] ?? '',
    date: text.match(/Date:\s*([\w\s,:\/]+[AP]M)/)?.[1] ?? ''
  };

  // === Extract DTCs using <h2>DTCs and Environmental Data</h2> as anchor ===
  const dtcHeader = $('h2').filter((_, el) => $(el).text().trim() === 'DTCs and Environmental Data').first();

  if (dtcHeader.length) {
    const dtcTable = dtcHeader.nextAll('table').first();
    const dtcRows = dtcTable.find('tr').slice(1); // Skip header

    dtcRows.each((_, row) => {
      const tds = $(row).find('td');
      if (tds.length >= 5) {
        dtcData.push({
          ecu: $(tds[0]).text().trim(),
          dtcCode: $(tds[1]).text().trim(),
          mil: $(tds[2]).text().trim(),
          status: $(tds[3]).text().trim(),
          description: $(tds[4]).text().trim(),
          snapshot: [] // future-proof
        });
      }
    });

    console.log(`✅ DTCs Extracted: ${dtcData.length}`);
  } else {
    console.log('❌ Could not find DTC header <h2>DTCs and Environmental Data</h2>');
  }

  // ✅ THIS LINE FIXES YOUR ERROR
  return {
    ecuData,
    metadata,
    dtcData
  };
}

module.exports = { parseVSR };
