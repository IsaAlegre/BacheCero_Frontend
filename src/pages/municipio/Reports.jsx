import { useState } from 'react'
import {
  createNews, deleteNews, editNews, generateNews, listNewsAdmin, publishNews, useLiveState, useSession,
} from '../../api'
import Notice from '../../components/Notice'
import { Badge, Button, Card, CardTitle, Icon, Input, Spinner } from '../../components/ui'
import { formatDate } from '../../lib/format'
import PageHeader from './PageHeader'

const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

export default function Reports() {
  const session = useSession('municipio')
  if (session?.rol !== 'administrador') {
    return (
      <div>
        <PageHeader title="Informes y novedades" subtitle="Publicaciones del municipio para los vecinos." />
        <Notice icon="lock" tone="warn" title="Solo para administradores">
          Los informes y novedades los redacta y publica un administrador. Tu cuenta es de operador.
        </Notice>
      </div>
    )
  }
  return <ReportsAdmin />
}

function ReportsAdmin() {
  const { data: items, error: loadError } = useLiveState(listNewsAdmin)
  const [editing, setEditing] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const run = async (fn) => {
    setBusy(true)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e.message)
      return null
    } finally {
      setBusy(false)
    }
  }

  if (!items && loadError) return <Notice tone="warn" icon="alert">{loadError.message}</Notice>
  if (!items) return <Spinner />

  const drafts = items.filter((n) => n.status === 'borrador')
  const published = items.filter((n) => n.status === 'publicado')

  return (
    <div>
      <PageHeader title="Informes y novedades" subtitle="Todo nace como borrador: nada llega a los vecinos sin que un administrador lo publique." />

      {error && <Notice tone="warn" icon="alert" className="mb-4">{error}</Notice>}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-4">
          {editing && (
            <Editor
              key={editing.id ?? 'nuevo'}
              initial={editing}
              busy={busy}
              onCancel={() => setEditing(null)}
              onSave={async (titulo, contenido) => {
                const ok = await run(() => (editing.id
                  ? editNews(editing.id, titulo, contenido)
                  : createNews(titulo, contenido)))
                if (ok) setEditing(null)
              }}
            />
          )}

          <Card>
            <CardTitle action={!editing && (
              <Button size="sm" variant="secondary" onClick={() => setEditing({ title: '', text: '' })}>
                <Icon name="pencil" className="size-4" /> Nuevo borrador
              </Button>
            )}>
              Borradores ({drafts.length})
            </CardTitle>
            {drafts.length === 0 && <p className="text-sm text-muted">No hay borradores. Generá el informe de un mes o escribí uno nuevo.</p>}
            <div className="space-y-3">
              {drafts.map((n) => (
                <NewsItem key={n.id} n={n}>
                  <Button size="sm" variant="success" disabled={busy} onClick={() => run(() => publishNews(n.id))}>
                    <Icon name="check" className="size-4" /> Aprobar y publicar
                  </Button>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => setEditing(n)}>
                    <Icon name="pencil" className="size-4" /> Editar
                  </Button>
                  <Button size="sm" variant="danger" disabled={busy}
                    onClick={() => window.confirm('¿Eliminar este borrador?') && run(() => deleteNews(n.id))}>
                    Eliminar
                  </Button>
                </NewsItem>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle>Publicadas ({published.length})</CardTitle>
            {published.length === 0 && <p className="text-sm text-muted">Todavía no se publicó ninguna novedad.</p>}
            <div className="space-y-3">
              {published.map((n) => (
                <NewsItem key={n.id} n={n}>
                  <Button size="sm" variant="danger" disabled={busy}
                    onClick={() => window.confirm('¿Eliminar esta novedad? Los vecinos dejan de verla.') && run(() => deleteNews(n.id))}>
                    Eliminar
                  </Button>
                </NewsItem>
              ))}
            </div>
          </Card>
        </div>

        <Generator busy={busy} onGenerate={(anio, mes) => run(() => generateNews(anio, mes))} />
      </div>
    </div>
  )
}

function Generator({ busy, onGenerate }) {
  const now = new Date()
  const [value, setValue] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`)
  const [anio, mes] = value.split('-').map(Number)
  const max = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return (
    <Card className="self-start">
      <CardTitle>Informe mensual con IA</CardTitle>
      <p className="mb-3 text-sm text-muted">
        Un modelo de lenguaje redacta el informe con los datos del mes: tickets resueltos, reparaciones iniciadas
        y reportes recibidos por barrio. Solo recibe cifras agregadas, nunca fotos ni datos personales.
      </p>
      <Input label="Mes" type="month" min="2024-01" max={max} value={value} onChange={(e) => setValue(e.target.value)} />
      <Button className="mt-3" block disabled={busy || !anio || !mes} onClick={() => onGenerate(anio, mes)}>
        <Icon name="cpu" className="size-4" /> {busy ? 'Generando…' : `Generar borrador de ${MONTHS[mes - 1] ?? ''}`}
      </Button>
      <p className="mt-3 text-xs text-muted">El resultado queda como borrador para revisarlo y corregirlo antes de publicar.</p>
    </Card>
  )
}

function Editor({ initial, busy, onCancel, onSave }) {
  const [title, setTitle] = useState(initial.title)
  const [text, setText] = useState(initial.text)
  const titleError = title.trim().length < 3 ? 'Entre 3 y 150 caracteres' : null
  const textError = text.trim().length < 10 ? 'Al menos 10 caracteres' : null
  return (
    <Card>
      <CardTitle>{initial.id ? 'Editar borrador' : 'Nuevo borrador'}</CardTitle>
      <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); onSave(title.trim(), text.trim()) }}>
        <Input label="Título" maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} hint={titleError} />
        <Input label="Contenido" as="textarea" rows={10} maxLength={10000} value={text} onChange={(e) => setText(e.target.value)} hint={textError} />
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy || titleError || textError}>Guardar borrador</Button>
          <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
        </div>
      </form>
    </Card>
  )
}

function NewsItem({ n, children }) {
  return (
    <article className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        {n.origin === 'ia' && <Badge tone="info"><Icon name="cpu" className="size-3.5" /> Redactado con IA</Badge>}
        <span>
          {n.status === 'publicado'
            ? `Publicado ${formatDate(n.at)}${n.approvedBy ? ` · aprobó ${n.approvedBy}` : ''}`
            : `Creado ${formatDate(n.createdAt)} · ${n.author}`}
        </span>
      </div>
      <h3 className="mt-2 font-bold leading-snug">{n.title}</h3>
      <p className="mt-1 line-clamp-6 whitespace-pre-line text-sm text-muted">{n.text}</p>
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </article>
  )
}
