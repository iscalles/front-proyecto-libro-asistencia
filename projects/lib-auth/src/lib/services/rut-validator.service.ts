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


  validateRut(rut: string): boolean {
    if (!rut || typeof rut !== 'string') {
      return false;
    }

    const cleanedRut = this.cleanRut(rut);

    if (!this.isValidFormat(cleanedRut)) {
      return false;
    }

    const parts = cleanedRut.split('-');
    const rutNumber = parts[0];
    const providedDigit = parts[1].toUpperCase();

    const calculatedDigit = this.calculateVerifierDigit(rutNumber);


    return providedDigit === calculatedDigit;
  }

  private cleanRut(rut: string): string {
    return rut
      .trim()
      .replace(/\./g, '')
      .replace(/\s/g, '');
  }


  private isValidFormat(rut: string): boolean {
    const rutRegex = /^\d{7,8}-[0-9k]$/i;
    return rutRegex.test(rut);
  }


  private calculateVerifierDigit(rutNumber: string): string {
    const multipliers = [2, 3, 4, 5, 6, 7];
    let sum = 0;


    let multiplierIndex = 0;
    for (let i = rutNumber.length - 1; i >= 0; i--) {
      const digit = parseInt(rutNumber[i], 10);
      const multiplier = multipliers[multiplierIndex % multipliers.length];
      sum += digit * multiplier;
      multiplierIndex++;
    }


    const remainder = sum % 11;
    const verifierDigit = 11 - remainder;


    if (verifierDigit === 11) {
      return '0';
    } else if (verifierDigit === 10) {
      return 'K';
    } else {
      return verifierDigit.toString();
    }
  }


  // Reformatea un RUT mientras se escribe, sin requerir que ya tenga guión:
  // inserta los puntos de mil y separa el dígito verificador en cada tecleo
  // (ej: "123456789" -> "12.345.678-9").
  formatearEnVivo(valor: string): string {
    const limpio = valor.replace(/[^0-9kK]/g, '').toUpperCase().slice(0, 9);
    if (limpio.length <= 1) return limpio;

    const verificador = limpio.slice(-1);
    const numero = limpio.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `${numero}-${verificador}`;
  }

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
