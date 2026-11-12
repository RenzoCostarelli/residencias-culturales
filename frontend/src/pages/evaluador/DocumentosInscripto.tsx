import { useState } from "react";
import { urlMiniaturaDrive } from "../../lib/drive";
import { Card } from "../../components/ui/Card";
import type { DocumentoPreseleccion } from "../../types";

// Compartido entre la preselección (valida los documentos) y la evaluación (los muestra como referencia).
export function SeccionDocumentos({ documentos }: { documentos: DocumentoPreseleccion[] }) {
  const conArchivo = documentos.filter((d) => d.url);
  if (!conArchivo.length) {
    return null;
  }

  const foto = conArchivo.find((d) => d.esFoto);
  const otros = conArchivo.filter((d) => !d.esFoto);

  return (
    <Card>
      <div className="flex flex-wrap items-start gap-6">
        {foto && <FotoInscripto documento={foto} />}
        {otros.length > 0 && (
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-sm font-medium text-text">Documentos adjuntos</p>
            <ul className="flex flex-col gap-1">
              {otros.map((d) => (
                <li key={d.campoId}>
                  <a
                    href={d.url ?? undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {d.etiqueta} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}

function FotoInscripto({ documento }: { documento: DocumentoPreseleccion }) {
  const [error, setError] = useState(false);
  const miniatura = documento.url ? urlMiniaturaDrive(documento.url) : null;

  if (error || !miniatura || !documento.url) {
    return (
      <a href={documento.url ?? undefined} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">
        Ver {documento.etiqueta} ↗
      </a>
    );
  }

  return (
    <a href={documento.url} target="_blank" rel="noreferrer" className="flex-none">
      <img
        src={miniatura}
        alt={documento.etiqueta}
        onError={() => setError(true)}
        className="h-32 w-32 rounded-md border border-border object-cover"
      />
    </a>
  );
}
