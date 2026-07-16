import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

function isAuthorized(role: string | undefined): boolean {
  return role === 'ADMIN' || role === 'GERANT'
}

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

  if (!isAuthorized(profil.role)) {
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

  // UNE SEULE requete SQL au lieu de 7
  const { data, error } = await supabase.rpc('fn_dashboard_admin', {
    p_societe_id: societe_id,
    p_debut: debut,
    p_fin: fin,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // La fonction retourne un JSONB complet
  return NextResponse.json({
    ...data,
    nb_commandes_jour: data.nb_commandes_total,
    periode: { debut, fin, type },
  })
}
