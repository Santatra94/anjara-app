import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths, subDays } from 'date-fns'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
  }

  const { data: profil, error: profilError } = await supabase
    .from('utilisateurs')
    .select('societe_id, role')
    .eq('id', user.id)
    .single()

  if (profilError || !profil) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 403 })
  }

  if (profil.role === 'LIVREUR') {
    return NextResponse.json({ error: 'Acces refuse' }, { status: 403 })
  }

  const societe_id = profil.societe_id
  const type = searchParams.get('type') || 'ce_mois'
  const aujourd_hui = new Date()

  function getDateRange(t: string) {
    if (t === 'aujourd_hui') {
      const d = format(aujourd_hui, 'yyyy-MM-dd')
      return { debut: d, fin: d }
    }
    if (t === 'ce_mois') {
      return {
        debut: format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'),
        fin: format(endOfMonth(aujourd_hui), 'yyyy-MM-dd'),
      }
    }
    if (t === 'mois_precedent') {
      const mp = subMonths(aujourd_hui, 1)
      return {
        debut: format(startOfMonth(mp), 'yyyy-MM-dd'),
        fin: format(endOfMonth(mp), 'yyyy-MM-dd'),
      }
    }
    if (t === 'personnalise') {
      return {
        debut: searchParams.get('debut') || format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'),
        fin: searchParams.get('fin') || format(aujourd_hui, 'yyyy-MM-dd'),
      }
    }
    return {
      debut: format(startOfMonth(aujourd_hui), 'yyyy-MM-dd'),
      fin: format(endOfMonth(aujourd_hui), 'yyyy-MM-dd'),
    }
  }

  const { debut, fin } = getDateRange(type)
  const dateAujourdhui = format(aujourd_hui, 'yyyy-MM-dd')

  const { data: livreurs } = await supabase
    .from('v_performance_livreurs')
    .select('*')
    .eq('societe_id', societe_id)

  const { data: clients } = await supabase
    .from('v_clients_dettes')
    .select('*')
    .eq('societe_id', societe_id)
    .order('dette_actuelle', { ascending: false })
    .limit(5)

  const { data: production } = await supabase
    .from('v_production_du_jour')
    .select('*')
    .eq('societe_id', societe_id)
    .eq('date_jour', dateAujourdhui)
    .maybeSingle()

  const { data: commandes } = await supabase
    
