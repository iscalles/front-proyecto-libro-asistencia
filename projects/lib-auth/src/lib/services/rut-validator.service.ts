import { Injectable } from '@angular/core';

/**
 * ServicioValidadorRut
 * Valida el formato del RUT chileno (Rol Único Tributario) y dígito verificador
 * utilizando el algoritmo de módulo 11
 */
@Injectable({
  providedIn: 'root'
})
export class ServicioValidadorRut {
  constructor() {}

  /**
   * Validates a Chilean RUT
   * Accepts formats: 12345678-9, 12345678-k, 12.345.678-9
   * @param rut The RUT string to validate
   * @returns true if valid, false otherwise
   */
  validateRut(rut: string): boolean {
    if (!rut || typeof rut !== 'string') {
      return false;
    }

    // Clean the RUT: remove spaces, dots, and convert to uppercase
    const cleanedRut = this.cleanRut(rut);

    // Check if format is valid (XXXXXXXX-X)
    if (!this.isValidFormat(cleanedRut)) {
      return false;
    }

    // Split RUT number and verifier digit
    const parts = cleanedRut.split('-');
    const rutNumber = parts[0];
    const providedDigit = parts[1].toUpperCase();

    // Calculate the correct verifier digit
    const calculatedDigit = this.calculateVerifierDigit(rutNumber);

    // Compare
    return providedDigit === calculatedDigit;
  }

  /**
   * Clean the RUT: remove dots, spaces, and normalize
   */
  private cleanRut(rut: string): string {
    return rut
      .trim()
      .replace(/\./g, '')
      .replace(/\s/g, '');
  }

  /**
   * Check if RUT has valid format (XXXXXXXX-X)
   */
  private isValidFormat(rut: string): boolean {
    const rutRegex = /^\d{7,8}-[0-9k]$/i;
    return rutRegex.test(rut);
  }

  /**
   * Calculate the verifier digit using the modulo 11 algorithm
   * Reference: https://es.wikipedia.org/wiki/Rol_%C3%9Anico_Tributario
   */
  private calculateVerifierDigit(rutNumber: string): string {
    const multipliers = [2, 3, 4, 5, 6, 7];
    let sum = 0;

    // Process the RUT number from right to left
    let multiplierIndex = 0;
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      const digit = parseInt(rutNumber[i], 10);
      const multiplier = multipliers[multiplierIndex % multipliers.length];
      sum += digit * multiplier;
      multiplierIndex++;
    }

    // Calculate remainder
    const remainder = sum % 11;
    const verifierDigit = 11 - remainder;

    // Format the result
    if (verifierDigit === 11) {
      return '0';
    } else if (verifierDigit === 10) {
      return 'K';
    } else {
      return verifierDigit.toString();
    }
  }

  /**
   * Format RUT for display (XX.XXX.XXX-X)
   */
  formatRut(rut: string): string {
    const cleanedRut = this.cleanRut(rut);
    
    if (!this.isValidFormat(cleanedRut)) {
      return rut;
    }

    const [rutNumber, verifier] = cleanedRut.split('-');
    const reversedRut = rutNumber.split('').reverse().join('');
    const formatted = reversedRut.replace(/(\d{3})/g, '$1.').replace(/\.$/, '');
    
    return `${formatted.split('').reverse().join('')}-${verifier}`;
  }
}
