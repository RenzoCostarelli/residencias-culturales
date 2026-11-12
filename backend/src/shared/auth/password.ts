import bcrypt from "bcrypt";
import { randomInt } from "crypto";

const SALT_ROUNDS = 12;

// Sin 0/O ni 1/l/I: la contraseña generada se comparte por chat o se dicta, conviene que no haya
// caracteres que se confundan entre sí.
const ALFABETO_PASSWORD = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generarPasswordAleatoria(longitud = 12): string {
  let password = "";
  for (let i = 0; i < longitud; i += 1) {
    password += ALFABETO_PASSWORD[randomInt(ALFABETO_PASSWORD.length)];
  }
  return password;
}
