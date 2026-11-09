import { useNavigate, useParams } from 'react-router-dom'
import { Card, Spinner } from '../../components/ui'
import CaseDetail from './CaseDetail'
import { useRanked } from './useRanked'

export default function TicketPage() {
  const { id } = useParams()
  const nav = useNavigate()
  const ranked = useRanked()
  if (!ranked) return <Spinner />
  const c = ranked.find((x) => x.id === id)
  if (!c) return <Card>No encontramos el ticket #{id}.</Card>
  return <CaseDetail c={c} onBack={() => nav('/municipio/tickets')} backLabel="Volver a tickets" />
}
