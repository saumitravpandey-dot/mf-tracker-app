export async function GET() {
  return Response.json({
    stocks: [
      { name: 'HDFC Bank', isin: 'INE040A01034', sector: 'Financial Services', weight: 8.2 },
      { name: 'Reliance Industries', isin: 'INE002A01018', sector: 'Energy', weight: 7.1 },
      { name: 'Infosys', isin: 'INE009A01021', sector: 'IT', weight: 6.4 },
      { name: 'ICICI Bank', isin: 'INE090A01021', sector: 'Financial Services', weight: 5.9 },
      { name: 'TCS', isin: 'INE467B01029', sector: 'IT', weight: 5.3 },
      { name: 'Kotak Mahindra Bank', isin: 'INE237A01028', sector: 'Financial Services', weight: 4.1 },
      { name: 'Axis Bank', isin: 'INE238A01034', sector: 'Financial Services', weight: 3.8 },
      { name: 'L&T', isin: 'INE018A01030', sector: 'Industrials', weight: 3.2 },
      { name: 'Bajaj Finance', isin: 'INE296A01024', sector: 'Financial Services', weight: 2.9 },
      { name: 'HUL', isin: 'INE030A01027', sector: 'FMCG', weight: 2.7 },
    ],
    sectors: [
      { sector: 'Financial Services', weight: 31.2 },
      { sector: 'IT', weight: 18.4 },
      { sector: 'Energy', weight: 9.8 },
      { sector: 'FMCG', weight: 8.1 },
      { sector: 'Industrials', weight: 7.3 },
      { sector: 'Healthcare', weight: 6.9 },
      { sector: 'Auto', weight: 5.4 },
      { sector: 'Telecom', weight: 4.2 },
      { sector: 'Materials', weight: 4.7 },
      { sector: 'Others', weight: 4.0 },
    ],
    overlap: [
      { fundA: 'Parag Parikh Flexi Cap', fundB: 'Mirae Asset Large Cap', pct: 42 },
      { fundA: 'Parag Parikh Flexi Cap', fundB: 'Axis Bluechip', pct: 38 },
      { fundA: 'Mirae Asset Large Cap', fundB: 'Axis Bluechip', pct: 67 },
    ],
  })
}
