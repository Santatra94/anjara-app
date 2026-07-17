import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type BeneficeProduit = {
  nom: string
  categorie: string
  ca: number
  cout: number
  benefice: number
  quantite: number
}

type MouvementCaisse = {
  id: string
  type_mouvement: 'INJECTION' | 'RETRAIT'
  montant: number
  libelle: string
  date_mouvement: string
}

export interface FinanceReportData {
  societe_nom: string
  periode_debut: string
  periode_fin: string
  periode_type: string
  solde_global: number
  total_encaissements: number
  total_recouvrements: number
  total_injections: number
  total_retraits: number
  total_depenses_global: number
  ca_periode: number
  total_depenses_periode: number
  depenses_matieres: number
  depenses_hors_matieres: number
  marge_brute: number
  benefice_net: number
  depenses_par_categorie: Record<string, number>
  benefice_produits: BeneficeProduit[]
  mouvements_recents: MouvementCaisse[]
}

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
}export function generateFinancePdf(data: FinanceReportData): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let y = 20

  // -- HEADER --
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageWidth, 35, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('ANJARA', 14, 18)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Rapport Financier', 14, 26)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(data.societe_nom, pageWidth - 14, 18, { align: 'right' })

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'Periode : ' + fmtDate(data.periode_debut) + ' - ' + fmtDate(data.periode_fin),
    pageWidth - 14,
    26,
    { align: 'right' }
  )

  y = 45

  // -- CARTES STATS --
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text("Vue d'ensemble", 14, y)
  y += 8

  const cards = [
    { label: 'Solde global', value: fmtAr(data.solde_global), color: [59, 130, 246] as [number, number, number] },
    { label: 'Benefice net', value: fmtAr(data.benefice_net), color: [16, 185, 129] as [number, number, number] },
    { label: 'CA de la periode', value: fmtAr(data.ca_periode), color: [139, 92, 246] as [number, number, number] },
    { label: 'Depenses periode', value: fmtAr(data.total_depenses_periode), color: [239, 68, 68] as [number, number, number] },
  ]

  const cardWidth = (pageWidth - 28 - 15) / 4
  const cardHeight = 22

  cards.forEach((card, i) => {
    const x = 14 + i * (cardWidth + 5)
    doc.setFillColor(...card.color)
    doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.text(card.label, x + 3, y + 6)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text(card.value, x + 3, y + 15)
  })

  y += cardHeight + 10
    // -- DETAIL SOLDE --
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Detail du solde global', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Type de flux', 'Montant']],
    body: [
      ['Encaissements totaux', fmtAr(data.total_encaissements)],
      ['Recouvrements totaux', fmtAr(data.total_recouvrements)],
      ['Injections', fmtAr(data.total_injections)],
      ['Retraits', '-' + fmtAr(data.total_retraits)],
      ['Depenses totales', '-' + fmtAr(data.total_depenses_global)],
      [
        { content: 'SOLDE', styles: { fontStyle: 'bold' } },
        { content: fmtAr(data.solde_global), styles: { fontStyle: 'bold' } },
      ],
    ],
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: { 1: { halign: 'right' } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10

  // -- REPARTITION DEPENSES --
  const categoriesEntries = Object.entries(data.depenses_par_categorie)
    .sort((a, b) => b[1] - a[1])

  if (categoriesEntries.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Repartition des depenses par categorie', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Categorie', 'Montant', '%']],
      body: categoriesEntries.map(([cat, montant]) => {
        const pct = data.total_depenses_periode > 0
          ? Math.round((montant / data.total_depenses_periode) * 100)
          : 0
        return [getCategorieLabel(cat), fmtAr(montant), pct + ' %']
      }),
      theme: 'striped',
      headStyles: { fillColor: [239, 68, 68], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      margin: { left: 14, right: 14 },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }
    // -- BENEFICE PAR PRODUIT --
  if (data.benefice_produits.length > 0) {
    if (y > 200) { doc.addPage(); y = 20 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Benefice par produit', 14, y)
    y += 2

    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text('Marge brute periode : ' + fmtAr(data.marge_brute), 14, y + 4)
    y += 6

    autoTable(doc, {
      startY: y,
      head: [['Produit', 'Categorie', 'Qte', 'CA', 'Cout', 'Benefice']],
      body: data.benefice_produits.map(p => [
        p.nom,
        p.categorie,
        String(p.quantite),
        fmtAr(p.ca),
        fmtAr(p.cout),
        fmtAr(p.benefice),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right', fontStyle: 'bold' },
      },
      margin: { left: 14, right: 14 },
    })

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  // -- MOUVEMENTS RECENTS --
  if (data.mouvements_recents.length > 0) {
    if (y > 220) { doc.addPage(); y = 20 }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Mouvements de caisse recents', 14, y)
    y += 4

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Libelle', 'Montant']],
      body: data.mouvements_recents.slice(0, 10).map(m => [
        fmtDate(m.date_mouvement),
        m.type_mouvement === 'INJECTION' ? 'Injection' : 'Retrait',
        m.libelle,
        (m.type_mouvement === 'INJECTION' ? '+' : '-') + fmtAr(m.montant),
      ]),
      theme: 'striped',
      headStyles: { fillColor: [100, 116, 139], fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 },
    })
  }

  // -- FOOTER --
  const totalPages = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    const footerText = 'Genere par Anjara le ' + format(new Date(), 'd MMM yyyy a HH:mm', { locale: fr })
    doc.text(footerText, 14, doc.internal.pageSize.getHeight() - 8)
    doc.text(
      'Page ' + i + ' / ' + totalPages,
      pageWidth - 14,
      doc.internal.pageSize.getHeight() - 8,
      { align: 'right' }
    )
  }

  // -- TELECHARGEMENT --
  const filename =
    'rapport-finance-' +
    data.societe_nom.replace(/\s+/g, '-').toLowerCase() +
    '-' + data.periode_debut +
    '-au-' + data.periode_fin +
    '.pdf'
  doc.save(filename)
    }
