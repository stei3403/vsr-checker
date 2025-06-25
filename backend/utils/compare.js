// === PART NUMBER LOGIC ===

function getSuffix(pn) {
  if (typeof pn !== 'string') return '';
  return pn.trim().toUpperCase().slice(-2);
}

function isAlphaSuffix(suffix) {
  return /^[A-Z]{2}$/.test(suffix);
}

function comparePartNumbers(reported, expected) {
  if (!reported || !expected || reported.includes('Negative response') || reported === 'N/A') {
    return '❌ Not Found';
  }

  const suffixR = getSuffix(reported);
  const suffixE = getSuffix(expected);

  if (!isAlphaSuffix(suffixR) || !isAlphaSuffix(suffixE)) {
    return '❌ Not Found';
  }

  if (suffixR === suffixE) return '✅ Match';
  return suffixR > suffixE ? '💜 Newer' : '⚠️ Older';
}

// === SOFTWARE VERSION LOGIC ===

function extractCleanVersion(value) {
  if (typeof value !== 'string') return null;

  // Clean and simplify
  const firstLine = value.split('\n')[0].trim();

  // Reject if the string includes known invalid phrases
  if (/data not found|no application software/i.test(firstLine)) return null;

  // Extract dotted version like 7.1.10, 24.45.00, etc.
  const dottedMatch = firstLine.match(/\d+\.\d+\.\d+/);
  if (dottedMatch) return dottedMatch[0];

  // If no dotted version, fallback to a long number (but only as a last resort)
  const numericMatch = firstLine.match(/\d{6,}/);
  return numericMatch ? numericMatch[0] : null;
}


function compareSWVersions(reported, expected) {
  const r = extractCleanVersion(reported);
  const e = extractCleanVersion(expected);

  if (!r || !e) return '❌ Not Found';

  if (r === e) return '✅ Match';

  return r > e ? '💜 Newer' : '⚠️ Older';
}

// === MAIN COMPARISON DRIVER ===

function compareToMaster(vsrList, masterList) {
  return vsrList.map(vsr => {
    const match = masterList.find(m => m.ECU === vsr.ECU);
    const expectedPart = match?.PartNum || 'N/A';
    const expectedSW = match?.SWVersion || 'N/A';

    return {
      ECU: vsr.ECU,
      ReportedPartNum: vsr.PartNum,
      ExpectedPartNum: expectedPart,
      PartStatus: comparePartNumbers(vsr.PartNum, expectedPart),
      ReportedSW: vsr.SWVersion,
      ExpectedSW: expectedSW,
      SWStatus: compareSWVersions(vsr.SWVersion, expectedSW),
      Priority: match?.Priority ?? 'N/A',
      FIOwner: match?.FIOwner ?? 'N/A',
      SubsystemOwner: match?.SubsystemOwner ?? 'N/A'
    };
  });
}

module.exports = {
  comparePartNumbers,
  compareSWVersions,
  compareToMaster
};
