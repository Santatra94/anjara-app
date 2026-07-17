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

function makeCell(value: string | number) {
  return { v: value, t: typeof value === 'number' ? 'n' : 's' }
}

function boldCell(value: string | number) {
  return { v: value, t: typeof value === 'number' ? 'n' : 's', s: { font: { bold: true } } }
}

function headerCell(value: string) {
  return {
    v: value,
    t: 's',
    s: {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2563EB' } },
      alignment: { horizontal: 'center' },
    },
  }
}

function subHeaderCell(value: string, colorHex: string) {
  return {
    v: value,
    t: 's',
    s: {
      font: { bold: true, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: colorHex } },
      alignment: { horizontal: 'left' },
    },
  }
}
function buildResumeSheet(data: FinanceReportData): XLSX.WorkSheet {
  const rows: unknown[][] = []

  rows.push([boldCell('ANJARA -- Rapport Financier')])
  rows.push([makeCell(data.societe_nom)])
  rows.push([makeCell(
    'Periode : ' + fmtDate(data.periode_debut) + ' au ' + fmtDate(data.periode_fin)
  )])
  rows.push([makeCell(
    'Genere le ' + format(new Date(), 'd MMM yyyy a HH:mm', { locale: fr })
  )])
  rows.push([])

  rows.push([subHeaderCell('INDICATEURS CLES', '2563EB'), makeCell(''), makeCell('')])
  rows.push([headerCell('Indicateur'), headerCell('Valeur'), headerCell('')])
  rows.push([makeCell('Solde global'), rightCell(fmtAr(data.solde_global)), makeCell('')])
  rows.push([makeCell('Benefice net periode'), rightCell(fmtAr(data.benefice_net)), makeCell('')])
  rows.push([makeCell('CA de la periode'), rightCell(fmtAr(data.ca_periode)), makeCell('')])
  rows.push([makeCell('Marge brute'), rightCell(fmtAr(data.marge_brute)), makeCell('')])
  rows.push([makeCell('Depenses periode'), rightCell(fmtAr(data.total_depenses_periode)), makeCell('')])
  rows.push([])

  rows.push([subHeaderCell('DETAIL DU SOLDE GLOBAL', '3B82F6'), makeCell(''), makeCell('')])
  rows.push([headerCell('Type de flux'), headerCell('Montant'), headerCell('')])
  rows.push([makeCell('Encaissements totaux'), rightCell(fmtAr(data.total_encaissements)), makeCell('')])
  rows.push([makeCell('Recouvrements totaux'), rightCell(fmtAr(data.total_recouvrements)), makeCell('')])
  rows.push([makeCell('Injections caisse'), rightCell(fmtAr(data.total_injections)), makeCell('')])
  rows.push([makeCell('Retraits caisse'), rightCell('-' + fmtAr(data.total_retraits)), makeCell('')])
  rows.push([makeCell('Depenses totales'), rightCell('-' + fmtAr(data.total_depenses_global)), makeCell('')])
  rows.push([boldCell('SOLDE FINAL'), boldCell(fmtAr(data.solde_global)), makeCell('')])
  rows.push([])

  const categoriesEntries = Object.entries(data.depenses_par_categorie)
    .sort((a, b) => b[1] - a[1])

  if (categoriesEntries.length > 0) {
    rows.push([subHeaderCell('REPARTITION DEPENSES PAR CATEGORIE', 'EF4444'), makeCell(''), makeCell('')])
    rows.push([headerCell('Categorie'), headerCell('Montant'), headerCell('%')])
    categoriesEntries.forEach(([cat, montant]) => {
      const pct = data.total_depenses_periode > 0
        ? Math.round((montant / data.total_depenses_periode) * 100)
        : 0
      rows.push([
        makeCell(getCategorieLabel(cat)),
        rightCell(fmtAr(montant)),
        rightCell(pct + ' %'),
      ])
    })
    rows.push([
      boldCell('TOTAL'),
      boldCell(fmtAr(data.total_depenses_periode)),
      boldCell('100 %'),
    ])
  }

  const ws = XLSX.utils.aoa_to_sheet(rows as XLSX.AOA)
  ws['!cols'] = [{ wch: 32 }, { wch: 22 }, { wch: 10 }]
  return ws
}

function buildProduitsSheet(data: FinanceReportData): XLSX.WorkSheet {
  const rows: unknown[][] = []

  rows.push([boldCell('Benefice par produit -- ' + data.societe_nom)])
  rows.push([makeCell(fmtDate(data.periode_debut) + ' au ' + fmtDate(data.periode_fin))])
  rows.push([])

  rows.push([
    headerCell('Produit'),
    headerCell('Categorie'),
    headerCell('Qte vendue'),
    headerCell('CA'),
    headerCell('Cout matieres'),
    headerCell('Benefice'),
  ])

  data.benefice_produits.forEach(p => {
    rows.push([
      makeCell(p.nom),
      makeCell(p.categorie),
      rightCell(String(p.quantite)),
      rightCell(fmtAr(p.ca)),
      rightCell(fmtAr(p.cout)),
      boldCell(fmtAr(p.benefice)),
    ])
  })

  rows.push([])
  rows.push([
    boldCell('TOTAL'),
    makeCell(''),
    makeCell(''),
    boldCell(fmtAr(data.ca_periode)),
    boldCell(fmtAr(data.depenses_matieres)),
    boldCell(fmtAr(data.marge_brute)),
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows as XLSX.AOA)
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
  const rows: unknown[][] = []

  rows.push([boldCell('Mouvements de caisse -- ' + data.societe_nom)])
  rows.push([makeCell(fmtDate(data.periode_debut) + ' au ' + fmtDate(data.periode_fin))])
  rows.push([])

  rows.push([
    headerCell('Date'),
    headerCell('Type'),
    headerCell('Libelle'),
    headerCell('Montant'),
  ])

  data.mouvements_recents.forEach(m => {
    rows.push([
      makeCell(fmtDate(m.date_mouvement)),
      makeCell(m.type_mouvement === 'INJECTION' ? 'Injection' : 'Retrait'),
      makeCell(m.libelle),
      rightCell(
        (m.type_mouvement === 'INJECTION' ? '+' : '-') + fmtAr(m.montant)
      ),
    ])
  })

  rows.push([])
  rows.push([
    boldCell('Total injections'),
    makeCell(''),
    makeCell(''),
    boldCell('+' + fmtAr(data.total_injections)),
  ])
  rows.push([
    boldCell('Total retraits'),
    makeCell(''),
    makeCell(''),
    boldCell('-' + fmtAr(data.total_retraits)),
  ])

  const ws = XLSX.utils.aoa_to_sheet(rows as XLSX.AOA)
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

function rightCell(value: string) {
  return {
    v: value,
    t: 's',
    s: { alignment: { horizontal: 'right' } },
  }
}
