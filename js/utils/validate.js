// Validaciones de formulario. Cada función devuelve '' si el valor es válido o el mensaje de error.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TELEFONO_VE = /^(?:\+?58|0)?(412|414|416|422|424|426)\d{7}$/;

export function validateRequired(value, label = 'este campo') {
  return value.trim() ? '' : `Escribe ${label}.`;
}

export function validateName(value, label) {
  const v = value.trim();
  if (!v) return `Escribe tu ${label}.`;
  if (v.length < 2) return `Tu ${label} debe tener al menos 2 letras.`;
  return '';
}

export function validateCedula(tipo, numero) {
  if (!['V', 'E'].includes(tipo)) return 'Elige V o E.';
  const n = numero.trim();
  if (!n) return 'Escribe tu número de cédula.';
  if (!/^\d{6,9}$/.test(n)) return 'La cédula debe tener entre 6 y 9 dígitos, sin puntos.';
  return '';
}

export function validateEmail(value) {
  const v = value.trim();
  if (!v) return 'Escribe tu correo electrónico.';
  if (!EMAIL.test(v)) return 'Revisa el correo: debe tener el formato nombre@dominio.com.';
  return '';
}

export function validatePhone(value) {
  const v = value.replace(/[\s-]/g, '');
  if (!v) return 'Escribe tu teléfono.';
  if (!TELEFONO_VE.test(v)) return 'Usa un móvil venezolano, por ejemplo 0414 1234567.';
  return '';
}

export function validatePassword(value) {
  if (value.length < 8) return 'La contraseña debe tener al menos 8 caracteres.';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'Incluye al menos una letra y un número.';
  return '';
}
