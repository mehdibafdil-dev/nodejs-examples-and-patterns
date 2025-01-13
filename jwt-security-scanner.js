const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');

class JWTSecurityScanner {
  constructor(token, options = {}) {
    this.token = token;
    this.issues = [];
    this.severityLevels = {
      HIGH: '🔴 HIGH',
      MEDIUM: '🟡 MEDIUM',
      LOW: '🟢 LOW'
    };
    this.options = {
      checkCommonSecrets: true,
      checkAlgorithm: true,
      checkExpiration: true,
      checkTokenLength: true,
      checkSignature: true,
      ...options
    };
  }

  async scan() {
    try {
      const [header, payload] = this.token.split('.');
      const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString());
      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString());

      await Promise.all([
        this.checkAlgorithmVulnerabilities(decodedHeader),
        this.checkExpirationIssues(decodedPayload),
        this.checkPayloadSecurity(decodedPayload),
        this.checkTokenStrength(),
        this.checkCommonSecretKeys(),
        this.checkSignatureStrength(decodedHeader)
      ]);

      return this.generateReport();
    } catch (error) {
      throw new Error(`Invalid JWT format: ${error.message}`);
    }
  }

  async checkAlgorithmVulnerabilities(header) {
    if (!this.options.checkAlgorithm) return;

    // Check for 'none' algorithm
    if (header.alg.toLowerCase() === 'none') {
      this.addIssue(
        'Algorithm Vulnerability',
        'Token uses "none" algorithm which is highly insecure',
        this.severityLevels.HIGH,
        'Use HS256 or RS256 algorithm'
      );
    }

    // Check for weak algorithms
    const weakAlgorithms = ['HS1', 'RS1', 'ES1'];
    if (weakAlgorithms.some(alg => header.alg.includes(alg))) {
      this.addIssue(
        'Weak Algorithm',
        `Token uses weak algorithm: ${header.alg}`,
        this.severityLevels.HIGH,
        'Use stronger algorithms like HS256, RS256, or ES256'
      );
    }
  }

  async checkExpirationIssues(payload) {
    if (!this.options.checkExpiration) return;

    if (!payload.exp) {
      this.addIssue(
        'Missing Expiration',
        'Token does not have an expiration claim',
        this.severityLevels.HIGH,
        'Add "exp" claim to token payload'
      );
    } else {
      const expirationDate = new Date(payload.exp * 1000);
      const now = new Date();
      const monthsUntilExpiration = (expirationDate - now) / (1000 * 60 * 60 * 24 * 30);

      if (monthsUntilExpiration > 1) {
        this.addIssue(
          'Long Expiration Time',
          `Token expires in ${Math.round(monthsUntilExpiration)} months`,
          this.severityLevels.MEDIUM,
          'Reduce token expiration time to less than 1 hour for access tokens'
        );
      }
    }
  }

  async checkPayloadSecurity(payload) {
    // Check for sensitive information in payload
    const sensitiveFields = ['password', 'secret', 'apiKey', 'ssn', 'creditCard'];
    const foundSensitiveFields = Object.keys(payload)
      .filter(key => sensitiveFields.some(field => key.toLowerCase().includes(field)));

    if (foundSensitiveFields.length > 0) {
      this.addIssue(
        'Sensitive Data Exposure',
        `Token contains sensitive fields: ${foundSensitiveFields.join(', ')}`,
        this.severityLevels.HIGH,
        'Remove sensitive information from token payload'
      );
    }
  }

  async checkTokenStrength() {
    if (!this.options.checkTokenLength) return;

    if (this.token.length < 50) {
      this.addIssue(
        'Token Length',
        'Token appears to be too short',
        this.severityLevels.MEDIUM,
        'Ensure token contains sufficient claim information and proper signature'
      );
    }
  }

  async checkCommonSecretKeys() {
    if (!this.options.checkCommonSecrets) return;

    const commonSecrets = [
      'secret',
      'your-256-bit-secret',
      'your_secret_key',
      'secret123',
      'mysecretkey'
    ];

    for (const secret of commonSecrets) {
      try {
        jwt.verify(this.token, secret);
        this.addIssue(
          'Weak Secret Key',
          'Token can be verified with a common secret key',
          this.severityLevels.HIGH,
          'Use a strong, unique secret key with high entropy'
        );
        break;
      } catch (error) {
        // Expected error for invalid secrets
      }
    }
  }

  async checkSignatureStrength(header) {
    if (!this.options.checkSignature) return;

    if (header.alg.startsWith('HS')) {
      const signaturePart = this.token.split('.')[2];
      const signatureLength = Buffer.from(signaturePart, 'base64').length * 8;

      if (signatureLength < 256) {
        this.addIssue(
          'Weak Signature',
          `Signature strength (${signatureLength} bits) is below recommended 256 bits`,
          this.severityLevels.HIGH,
          'Use stronger signature algorithm with at least 256-bit key'
        );
      }
    }
  }

  addIssue(title, description, severity, recommendation) {
    this.issues.push({
      title,
      description,
      severity,
      recommendation
    });
  }

  generateReport() {
    const highSeverityCount = this.issues.filter(i => i.severity === this.severityLevels.HIGH).length;
    const mediumSeverityCount = this.issues.filter(i => i.severity === this.severityLevels.MEDIUM).length;
    const lowSeverityCount = this.issues.filter(i => i.severity === this.severityLevels.LOW).length;

    return {
      scanDate: new Date().toISOString(),
      summary: {
        totalIssues: this.issues.length,
        highSeverity: highSeverityCount,
        mediumSeverity: mediumSeverityCount,
        lowSeverity: lowSeverityCount,
        overallRisk: this.calculateOverallRisk(highSeverityCount, mediumSeverityCount, lowSeverityCount)
      },
      issues: this.issues,
      recommendations: this.generateRecommendations()
    };
  }

  calculateOverallRisk(high, medium, low) {
    if (high > 0) return 'HIGH RISK';
    if (medium > 0) return 'MEDIUM RISK';
    if (low > 0) return 'LOW RISK';
    return 'SECURE';
  }

  generateRecommendations() {
    const recommendations = new Set();
    this.issues.forEach(issue => {
      recommendations.add(issue.recommendation);
    });
    return Array.from(recommendations);
  }
}

// Usage Example
const scanner = new JWTSecurityScanner('your.jwt.token');
scanner.scan()
  .then(report => console.log(JSON.stringify(report, null, 2)))
  .catch(error => console.error('Scan failed:', error));

module.exports = JWTSecurityScanner;
