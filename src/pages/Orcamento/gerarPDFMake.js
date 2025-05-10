import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export const gerarPDFMake = (servicosSelecionados, formData, calcularTotal, imgLogoBase64) => {
  const servicos = servicosSelecionados.map(item => ([
    item.quantidade.toString(),
    item.descricao,
    `R$ ${item.valor.toFixed(2)}`,
    `R$ ${(item.quantidade * item.valor).toFixed(2)}`
  ]));

  const total = calcularTotal().toFixed(2);

  const gerarPagina = (via) => [
    {
      image: imgLogoBase64,
      width: 50
    },
    { text: 'Clínica Odontológica Sorriso Brilhante', style: 'header' },
    { text: `Orçamento Odontológico - Via: ${via}`, style: 'subheader' },
    { text: `Data: ${formData.orcamentoData}`, style: 'small' },
    { text: ' ' },
    {
      table: {
        headerRows: 1,
        widths: ['auto', '*', 'auto', 'auto'],
        body: [
          ['Quantidade', 'Serviço', 'Valor Unitário (R$)', 'Subtotal (R$)'],
          ...servicos
        ]
      }
    },
    { text: `Total: R$ ${total}`, style: 'total' },
    { text: 'Formas de Pagamento:', style: 'subheader' },
    { text: formData.formasPagamento || '---' },
    { text: '\nAssinatura do Paciente: _______________________' },
    { text: 'Assinatura da Clínica: _________________________' },
    { text: '\nClínica Odontológica Sorriso Brilhante - Tel: (11) 1234-5678', style: 'footer' },
    { text: '\n\n' }
  ];

  const docDefinition = {
    content: [
      ...gerarPagina('Paciente'),
      { text: '', pageBreak: 'after' },
      ...gerarPagina('Clínica')
    ],
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 10, 0, 5] },
      subheader: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
      total: { fontSize: 12, bold: true, margin: [0, 10, 0, 5] },
      small: { fontSize: 10 },
      footer: { fontSize: 8, alignment: 'center' }
    }
  };

  pdfMake.createPdf(docDefinition).download("orcamento_odontologico.pdf");
};
