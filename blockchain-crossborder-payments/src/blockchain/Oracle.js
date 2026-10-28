const crypto = require('crypto');

/**
 * Foreign Exchange (FX) Oracle for Cross-Border Payments.
 * Simulates trusted off-chain financial data providers (e.g. Reuters, Bloomberg, Chainlink FX).
 */
class FXOracle {
  constructor() {
    this.oracleId = 'ORACLE_CURRENCY_CONSORTIUM_MAIN';
    this.privateKey = 'CONSORTIUM_ORACLE_HMAC_SECRET_KEY';
    
    // Base rates relative to 1 USD
    this.ratesToUSD = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.45,
      JPY: 154.20,
      CAD: 1.37,
      AUD: 1.52,
      SGD: 1.35,
      AED: 3.67
    };

    this.lastUpdated = new Date().toISOString();
  }

  /**
   * Retrieves the exchange rate between two currencies with cryptographic attestation.
   */
  getExchangeRate(fromCurrency, toCurrency) {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (!this.ratesToUSD[from] || !this.ratesToUSD[to]) {
      throw new Error(`Unsupported currency corridor: ${from} to ${to}`);
    }

    // Rate = (1 USD in target currency) / (1 USD in source currency)
    const rate = this.ratesToUSD[to] / this.ratesToUSD[from];
    const timestamp = new Date().toISOString();

    const payload = `${this.oracleId}:${from}:${to}:${rate.toFixed(4)}:${timestamp}`;
    const signature = crypto
      .createHmac('sha256', this.privateKey)
      .update(payload)
      .digest('hex');

    return {
      oracleId: this.oracleId,
      fromCurrency: from,
      toCurrency: to,
      rate: Number(rate.toFixed(4)),
      timestamp,
      signature
    };
  }

  /**
   * Calculates converted amount and returns signed quote.
   */
  convert(amount, fromCurrency, toCurrency) {
    const quote = this.getExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = Number((amount * quote.rate).toFixed(2));
    
    return {
      ...quote,
      originalAmount: amount,
      convertedAmount
    };
  }

  /**
   * Verifies an oracle quote's signature.
   */
  verifyQuote(quote) {
    const payload = `${this.oracleId}:${quote.fromCurrency}:${quote.toCurrency}:${Number(quote.rate).toFixed(4)}:${quote.timestamp}`;
    const expected = crypto
      .createHmac('sha256', this.privateKey)
      .update(payload)
      .digest('hex');
    return expected === quote.signature;
  }

  /**
   * Allows consortium admin or simulation to update exchange rates.
   */
  updateRate(currency, rateAgainstUSD) {
    const curr = currency.toUpperCase();
    if (curr === 'USD') return;
    this.ratesToUSD[curr] = Number(rateAgainstUSD);
    this.lastUpdated = new Date().toISOString();
  }

  getAllRates() {
    return {
      base: 'USD',
      rates: { ...this.ratesToUSD },
      lastUpdated: this.lastUpdated,
      oracleId: this.oracleId
    };
  }
}

module.exports = new FXOracle();
