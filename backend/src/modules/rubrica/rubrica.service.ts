import { AppError } from "../../shared/errors";
import { prisma, type RolEspecialCampo, type TipoDatoCampo } from "../../shared/prisma";
import { slugify } from "../../shared/utils/slug";

async function generarClaveUnica(etiqueta: string): Promise<string> {
  const base = slugify(etiqueta) || "campo";
  let clave = base;
  let sufijo = 1;

  while (await prisma.campoFormulario.findUnique({ where: { clave } })) {
    sufijo += 1;
    clave = `${base}_${sufijo}`;
  }

  return clave;
}

async function liberarRolEspecial(rol: RolEspecialCampo) {
  await prisma.campoFormulario.updateMany({
    where: { rolEspecial: rol },
    data: { rolEspecial: null },
  });
}

export async function listarCampos() {
  const campos = await prisma.campoFormulario.findMany({ orderBy: { orden: "asc" } });
  const sumaEvaluable = campos
    .filter((campo) => campo.esEvaluable && campo.activo)
    .reduce((acc, campo) => acc + Number(campo.puntajeMaximo ?? 0), 0);

  return { campos, sumaEvaluable, esValida: sumaEvaluable === 100 };
}

export async function validarRubrica() {
  const { sumaEvaluable, esValida } = await listarCampos();
  return { sumaEvaluable, esValida };
}

export type DatosCampo = {
  clave?: string;
  etiqueta: string;
  tipoDato: TipoDatoCampo;
  esIdentificatorio?: boolean;
  esEvaluable?: boolean;
  puntajeMaximo?: number;
  rolEspecial?: RolEspecialCampo;
  orden?: number;
};

export async function crearCampo(data: DatosCampo) {
  let clave = data.clave;
  if (clave) {
    const existente = await prisma.campoFormulario.findUnique({ where: { clave } });
    if (existente) {
      throw new AppError(409, "Ya existe un campo con esa clave");
    }
  } else {
    clave = await generarClaveUnica(data.etiqueta);
  }

  if (data.rolEspecial) {
    await liberarRolEspecial(data.rolEspecial);
  }

  return prisma.campoFormulario.create({
    data: {
      clave,
      etiqueta: data.etiqueta,
      tipoDato: data.tipoDato,
      esIdentificatorio: data.esIdentificatorio ?? false,
      esEvaluable: data.esEvaluable ?? false,
      puntajeMaximo: data.puntajeMaximo,
      rolEspecial: data.rolEspecial,
      orden: data.orden ?? 0,
    },
  });
}

export type DatosActualizarCampo = Partial<{
  etiqueta: string;
  tipoDato: TipoDatoCampo;
  esIdentificatorio: boolean;
  esEvaluable: boolean;
  puntajeMaximo: number | null;
  rolEspecial: RolEspecialCampo | null;
  orden: number;
  activo: boolean;
}>;

export async function actualizarCampo(id: string, data: DatosActualizarCampo) {
  const campo = await prisma.campoFormulario.findUnique({ where: { id } });
  if (!campo) {
    throw new AppError(404, "Campo no encontrado");
  }

  const cambiaPuntaje =
    data.puntajeMaximo !== undefined && Number(data.puntajeMaximo) !== Number(campo.puntajeMaximo);
  const cambiaEvaluable = data.esEvaluable !== undefined && data.esEvaluable !== campo.esEvaluable;

  if (cambiaPuntaje || cambiaEvaluable) {
    const tieneEvaluaciones = await prisma.evaluacionDetalle.findFirst({ where: { campoId: id } });
    if (tieneEvaluaciones) {
      throw new AppError(
        409,
        "No se puede modificar el puntaje de un criterio que ya tiene evaluaciones registradas",
      );
    }
  }

  if (data.rolEspecial) {
    await liberarRolEspecial(data.rolEspecial);
  }

  return prisma.campoFormulario.update({ where: { id }, data });
}
