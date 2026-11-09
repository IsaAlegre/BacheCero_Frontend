import QrCode from '../../components/QrCode'
import { Card } from '../../components/ui'

// En escritorio, en lugar de "Instalar app": QR para abrir la app en el celular.
// VITE_APP_URL permite fijar la URL pública (por ejemplo, la del deploy).
export default function AppQr() {
  const url = import.meta.env.VITE_APP_URL || `${window.location.origin}/vecino`
  const local = /^(localhost|127\.|\[::1\])/.test(new URL(url).hostname)
  return (
    <Card className="flex items-center gap-5">
      <QrCode value={url} className="size-36 shrink-0 ring-1 ring-line" label="Código QR para abrir Bache Cero en el celular" />
      <div className="min-w-0">
        <p className="text-lg font-bold">Abrila en tu celular</p>
        <p className="mt-1 text-sm text-muted">Escaneá el código con la cámara para reportar desde la calle y, si querés, instalarla.</p>
        <p className="mt-2 break-all font-mono text-xs text-muted">{url}</p>
        {local && (
          <p className="mt-2 rounded-lg bg-amber-100 px-2 py-1 text-xs text-amber-900 dark:bg-amber-400/15 dark:text-amber-100">
            Este link usa localhost y no abre desde el celular. Entrá por la IP de la red (la que muestra <code>npm run dev</code> como “Network”) o configurá <code>VITE_APP_URL</code>.
          </p>
        )}
      </div>
    </Card>
  )
}
