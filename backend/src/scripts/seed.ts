import bcrypt from "bcrypt";
import { prisma } from "../shared/prisma";

const RUBRICA_INICIAL = [
  { clave: "formacion_academica", etiqueta: "2.1 Formación", orden: 1, puntajeMaximo: 10 },
  { clave: "experiencia_laboral", etiqueta: "2.2 Experiencia laboral", orden: 2, puntajeMaximo: 10 },
  { clave: "experiencia_grupos", etiqueta: "2.3 Experiencia con grupos/colectiva", orden: 3, puntajeMaximo: 20 },
  { clave: "oficios", etiqueta: "2.4.1 Oficios", orden: 4, puntajeMaximo: 10 },
  { clave: "lenguajes_digitales", etiqueta: "2.4.2 Lenguajes digitales", orden: 5, puntajeMaximo: 10 },
  { clave: "lenguajes_artisticos", etiqueta: "2.4.3 Lenguajes Artísticos y Expresivos", orden: 6, puntajeMaximo: 10 },
  { clave: "otros_lenguajes", etiqueta: "2.4.4 Otros Lenguajes", orden: 7, puntajeMaximo: 10 },
  { clave: "motivacion_personal", etiqueta: "3 Motivación Personal", orden: 8, puntajeMaximo: 20 },
];

async function seedSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL;
  const password = process.env.SUPERADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Definí SUPERADMIN_EMAIL y SUPERADMIN_PASSWORD en el .env antes de correr el seed.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.usuario.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      nombre: "Super",
      apellido: "Admin",
      rol: "SUPERADMIN",
    },
  });

  console.log(`Superadmin listo: ${email}`);
}

async function seedRubricaInicial() {
  for (const campo of RUBRICA_INICIAL) {
    await prisma.campoFormulario.upsert({
      where: { clave: campo.clave },
      update: {},
      create: {
        clave: campo.clave,
        etiqueta: campo.etiqueta,
        tipoDato: "TEXTO_LARGO",
        esIdentificatorio: false,
        esEvaluable: true,
        puntajeMaximo: campo.puntajeMaximo,
        orden: campo.orden,
      },
    });
  }

  console.log(`Rúbrica inicial lista: ${RUBRICA_INICIAL.length} criterios evaluables.`);
}

async function main() {
  await seedSuperadmin();
  await seedRubricaInicial();
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
