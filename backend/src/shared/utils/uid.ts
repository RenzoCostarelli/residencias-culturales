import { randomInt } from "crypto";

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin caracteres ambiguos (0/O, 1/I)

export function generarUid(): string {
  let codigo = "";
  for (let i = 0; i < 8; i += 1) {
    codigo += ALFABETO[randomInt(ALFABETO.length)];
  }
  return `RES-${codigo}`;
}
