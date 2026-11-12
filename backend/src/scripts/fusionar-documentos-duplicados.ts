import { prisma } from "../shared/prisma";

// El formulario de inscripción cambió de redacción entre versiones para los mismos tres documentos
// (ej. "Foto Adjunta" en una hoja vieja, "1. Foto personal: tipo 4×4..." en la hoja actual). Como el
// mapeo de importación compara texto, no reconoció que eran el mismo documento y cada importación
// terminó creando un campo nuevo: un inscripto importado con la hoja vieja tiene la respuesta en el
// campo viejo y aparece como "No subió archivo" en el campo nuevo (y viceversa). Este script fusiona
// cada par: copia la respuesta al campo vigente cuando falta y desactiva el campo viejo para que dejen
// de mostrarse como documentos separados en la preselección. Es idempotente, se puede correr de nuevo
// sin duplicar nada si aparecen más inscriptos con el mismo problema.
const PARES_DUPLICADOS: { vigente: string; viejo: string }[] = [
  {
    vigente: "1. Foto personal: tipo 4×4, color, centrada, de frente y mirando a cámara, con fondo claro y uniforme.",
    viejo: "Foto Adjunta",
  },
  {
    vigente: "2. DNI: frente y dorso, color, en un único archivo PDF legible.",
    viejo: "DNI Adjunto",
  },
  {
    vigente: "3. Título secundario o constancia de alumno regular: frente y dorso, color, QR visible.",
    viejo: "Título Adjunto",
  },
];

async function fusionarPar(etiquetaVigente: string, etiquetaVieja: string) {
  const [vigente, viejo] = await Promise.all([
    prisma.campoFormulario.findFirst({ where: { etiqueta: etiquetaVigente } }),
    prisma.campoFormulario.findFirst({ where: { etiqueta: etiquetaVieja } }),
  ]);

  if (!vigente) {
    console.log(`(sin cambios) no existe el campo vigente "${etiquetaVigente}"`);
    return;
  }
  if (!viejo || viejo.id === vigente.id) {
    console.log(`(sin cambios) no hay campo viejo separado para "${etiquetaVigente}"`);
    return;
  }

  const respuestasViejas = await prisma.respuestaInscripto.findMany({ where: { campoId: viejo.id } });

  let migradas = 0;
  for (const respuesta of respuestasViejas) {
    if (!respuesta.valorTexto) continue;

    const yaTieneVigente = await prisma.respuestaInscripto.findUnique({
      where: { inscriptoId_campoId: { inscriptoId: respuesta.inscriptoId, campoId: vigente.id } },
    });
    if (yaTieneVigente) continue;

    await prisma.respuestaInscripto.create({
      data: { inscriptoId: respuesta.inscriptoId, campoId: vigente.id, valorTexto: respuesta.valorTexto },
    });
    migradas += 1;
  }

  if (viejo.activo) {
    await prisma.campoFormulario.update({ where: { id: viejo.id }, data: { activo: false } });
  }

  console.log(
    `"${etiquetaVieja}" -> "${etiquetaVigente}": ${migradas} respuesta(s) migradas, campo viejo desactivado.`,
  );
}

async function main() {
  for (const par of PARES_DUPLICADOS) {
    await fusionarPar(par.vigente, par.viejo);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
