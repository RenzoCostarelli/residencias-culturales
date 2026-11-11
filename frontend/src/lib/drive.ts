// Los links que trae el Excel son de distintos formatos de Google Drive
// (open?id=, file/d/.../view, uc?id=, carpetas, etc.) — el id del archivo
// siempre es la tira alfanumérica larga, así que alcanza con extraerla.
export function extraerDriveFileId(url: string): string | null {
  const match = url.match(/[-\w]{25,}/);
  return match ? match[0] : null;
}

export function urlMiniaturaDrive(url: string, tamano = 400): string | null {
  const id = extraerDriveFileId(url);
  if (!id) return null;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${tamano}`;
}
