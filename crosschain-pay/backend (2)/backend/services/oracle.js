/**
 * FX Oracle Service for CrossChain Pay.
 * Note: Uses clearly labelled sample exchange rates for this educational prototype.
 */
class OracleService {
  constructor() {
    this.sampleRatesToUSD = {
      USD: 1.0,
      INR: 83.45,
      GBP: 0.79,
      EUR: 0.92,
      JPY: 154.20,
      CAD: 1.37,
      AUD: 1.52,
      SGD: 1.35,
      AED: 3.67
    };
  }

  getEstimate(amountUSD, destinationCurrency) {
    const dest = (destinationCurrency || 'USD').toUpperCase();
    const rate = this.sampleRatesToUSD[dest];

    if (!rate) {
      throw new Error(`Unsupported destination currency: ${dest}`);
    }

    const numAmount = Number(amountUSD) || 0;
    const convertedAmount = Number((numAmount * rate).toFixed(2));
    
    // Enterprise cross-border payment fee is $0.00 for consortium blockchain networks
    const estimatedFee = 0.00;

    return {
      sourceCurrency: 'USD',
      destinationCurrency: dest,
      rate,
      amountUSD: numAmount,
      convertedAmount,
      estimatedFee,
      isSampleRate: true,
      rateDisclaimer: 'Sample benchmark exchange rate for educational prototype testing. Not live commercial banking rates.',
      timestamp: new Date().toISOString()
    };
  }

  getAllRates() {
    return {
      base: 'USD',
      isSampleRate: true,
      rateDisclaimer: 'Sample benchmark exchange rates for educational prototype.',
      rates: { ...this.sampleRatesToUSD },
      lastUpdated: new Date().toISOString()
    };
  }
}

module.exports = new OracleService();
