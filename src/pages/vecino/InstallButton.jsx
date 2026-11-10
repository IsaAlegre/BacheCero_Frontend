import { useState } from 'react'
import { promptInstall, useInstall } from '../../lib/install'
import { Button, Card, Icon } from '../../components/ui'

export default function InstallButton() {
  const mode = useInstall()
  const [showSteps, setShowSteps] = useState(false)
  if (!mode || mode === 'installed') return null

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-navy-50 text-navy dark:bg-navy-500/25 dark:text-navy-100">
          <Icon name="download" />
        </span>
        <div className="min-w-0 flex-1 basis-40">
          <p className="font-bold">Instalá Bache Cero</p>
          <p className="text-sm text-muted">Tenela a mano en la pantalla de inicio.</p>
        </div>
        <Button variant="secondary" size="sm" className="max-[399px]:w-full"
          onClick={() => (mode === 'prompt' ? promptInstall() : setShowSteps((v) => !v))}
          aria-expanded={mode === 'ios' ? showSteps : undefined}>
          Instalar app
        </Button>
      </div>
      {mode === 'ios' && showSteps && (
        <ol className="space-y-2 rounded-xl bg-surface-2 p-3 text-sm">
          <li className="flex items-center gap-2">
            <b>1.</b> Tocá <Icon name="share" className="size-4" /> <b>Compartir</b> en la barra de Safari.
          </li>
          <li className="flex items-center gap-2">
            <b>2.</b> Elegí <Icon name="plusSquare" className="size-4" /> <b>“Agregar a inicio”</b>.
          </li>
          <li className="flex items-center gap-2"><b>3.</b> Tocá <b>Agregar</b>.</li>
        </ol>
      )}
    </Card>
  )
}
