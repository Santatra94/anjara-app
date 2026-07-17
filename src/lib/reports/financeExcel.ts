import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { FinanceReportData } from './financePdf'

function fmtAr(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' Ar'
}

function fmtDate(dateStr: string): string {
  try {
    return format(new Date(dateStr + 'T00:00:00'), 'd MMM yyyy', { locale: fr })
  } catch {
    return dateStr
  }
}

function getCategorieLabel(cat: string): string {
  const labels: Record<string, string> = {
    MATIERES_PREMIERES: 'Matieres premieres',
    SALAIRES: 'Salaires',
    TRANSPORT: 'Transport',
    LOYER: 'Loyer',
    MARKETING: 'Marketing',
    CHARBON: 'Charbon',
    ELECTRICITE: 'Electricite',
    AUTRES: 'Autres',
  }
  return labels[cat] || cat
}

function buildResumeSheet(data: FinanceReportData): XLSX.WorkSheet {
  const rows: (string | number)[][] = []

  rows.push(['ANJARA -- Rapport Financier'])
  rows.push([data.societe_nom])
  rows.push(['Periode : ' + fmtDate(data.periode_debut) + ' au ' + fmtDate(data.periode_fin)])
  rows.push(['Genere le ' + format(new Date(), 'd MMM yyyy a HH:mm', { locale: fr })])
  rows.push([])

  rows.push(['INDICATEURS CLES', '', ''])
  rows.push(['Indicateur', 'Valeur', ''])
  rows.push(['Solde global', fmtAr(data.solde_global), ''])
  rows.push(['Benefice net periode', fmtAr(data.benefice_net), ''])
  rows.push(['CA de la periode', fmtAr(data.ca_periode), ''])
  rows.push(['Marge brute', fmtAr(data.marge_brute), ''])
  rows.push(['Depenses periode', fmtAr(data.total_depenses_periode), ''])
  rows.push([])

  rows.push(['DETAIL DU SOLDE GLOBAL', '', ''])
  rows.push(['Type de flux', 'Montant', ''])
  rows.push(['Encaissements totaux', fmtAr(data.total_encaissements), ''])
  rows.push(['Recouvrements totaux', fmtAr(data.total_recouvrements), ''])
  rows.push(['Injections caisse', fmtAr(data.total_injections), ''])
  rows.push(['Retraits caisse', '-' + fmtAr(data.total_retraits), ''])
  rows.push(['Depenses totales', '-' + fmtAr(data.total_depenses_global), ''])
  rows.push(['SOLDE FINAL', fmtAr(data.solde_global), ''])
  rows.push([])

  const categoriesEntries = Object.entries(data.depenses_par_categorie)
    .sort((a, b) => b[1] - a[1])

  if (categoriesEntries.length > 0) {
    rows.push(['REPARTITION DEPENSES PAR CATEGORIE', '', ''])
    rows.push(['Categorie', 'Montant', '%'])
    categoriesEntries.forEach(([cat, montant]) => {
      const pct = data.total_depenses_periode > 0
        ? Math.round((montant / data.total_depenses_periode) * 100)
        : 0
      rows.push([getCategorieLabel(cat), fmtAr(montant), pct + ' %'])
    })
    rows.push(['TOTAL', fmtAr(data.total_depenses_periode), '100 %'])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 32 }, { wch: 22 }, { wch: 10 }]
  return ws
}
function buildProduitsSheet(data: FinanceReportData): XLSX.WorkSheet {
  const rows: (string | number)[][] = []

  rows.push(['Benefice par produit -- ' + data.societe_nom])
  rows.push([fmtDate(data.periode_debut) + ' au ' + fmtDate(data.periode_fin)])
  rows.push([])

  rows.push(['Produit', 'Categorie', 'Qte vendue', 'CA', 'Cout matieres', 'Benefice'])

  data.benefice_produits.forEach(p => {
    rows.push([
      p.nom,
      p.categorie,
      p.quantite,
      fmtAr(p.ca),
      fmtAr(p.cout),
      fmtAr(p.benefice),
    ])
  })

  rows.push([])
  rows.push([
    'TOTAL',
    '',
    '',
    fmtAr(data.ca_periode),
    fmtAr(data.depenses_matieres),
    fmtAr(data.marge_brute),
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 28 },
    { wch: 20 },
    { wch: 12 },
    { wch: 20 },
    { wch: 20 },
    { wch: 20 },
  ]
  return ws
}

function buildMouvementsSheet(data: FinanceReportData): XLSX.WorkSheet {
  const rows: (string | number)[][] = []

  rows.push(['Mouvements de caisse -- ' + data.societe_nom])
  rows.push([fmtDate(data.periode_debut) + ' au ' + fmtDate(data.periode_fin)])
  rows.push([])

  rows.push(['Date', 'Type', 'Libelle', 'Montant'])

  data.mouvements_recents.forEach(m => {
    rows.push([
      fmtDate(m.date_mouvement),
      m.type_mouvement === 'INJECTION' ? 'Injection' : 'Retrait',
      m.libelle,
      (m.type_mouvement === 'INJECTION' ? '+' : '-') + fmtAr(m.montant),
    ])
  })

  rows.push([])
  rows.push(['Total injections', '', '', '+' + fmtAr(data.total_injections)])
  rows.push(['Total retraits', '', '', '-' + fmtAr(data.total_retraits)])

  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [
    { wch: 16 },
    { wch: 12 },
    { wch: 36 },
    { wch: 20 },
  ]
  return ws
}

export function generateFinanceExcel(data: FinanceReportData): void {
  const wb = XLSX.utils.book_new()

  wb.Props = {
    Title: 'Rapport Financier Anjara',
    Subject: data.societe_nom,
    Author: 'Anjara ERP',
    CreatedDate: new Date(),
  }

  XLSX.utils.book_append_sheet(wb, buildResumeSheet(data), 'Resume')
  XLSX.utils.book_append_sheet(wb, buildProduitsSheet(data), 'Produits')
  XLSX.utils.book_append_sheet(wb, buildMouvementsSheet(data), 'Mouvements')

  const filename =
    'rapport-finance-' +
    data.societe_nom.replace(/\s+/g, '-').toLowerCase() +
    '-' + data.periode_debut +
    '-au-' + data.periode_fin +
    '.xlsx'

  XLSX.writeFile(wb, filename)
}