import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Table, Modal } from 'react-bootstrap';
//import ContentHeader from '../../components/share/ContentHeader';
import imgLogoBase64 from '../../app/img/logoBase64';
//import { gerarPDFMake } from './gerarPDFMake';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const Orcamento = () => {
    const [formData, setFormData] = useState({ orcamentoData: '', formasPagamento: '' });
    const [servicosSelecionados, setServicosSelecionados] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [novoServico, setNovoServico] = useState({ quantidade: 1, descricao: '', valor: 0 });

    const servicos = ["Extração", "Restauração", "Canal", "Limpeza", "Implante", "Outros"];

    const calcularTotal = () => servicosSelecionados.reduce((total, item) => total + (item.valor * item.quantidade), 0);

    const handleAdicionarServico = () => {
        setServicosSelecionados(prev => [...prev, novoServico]);
        setNovoServico({ quantidade: 1, descricao: '', valor: 0 });
        setShowModal(false);
    };

    const handleRemoverServico = (index) => {
        const listaAtualizada = [...servicosSelecionados];
        listaAtualizada.splice(index, 1);
        setServicosSelecionados(listaAtualizada);
    };

    const limparFormulario = () => {
        setFormData({ orcamentoData: '', formasPagamento: '' });
        setServicosSelecionados([]);
    };

    const gerarPDF = () => {
        const doc = new jsPDF();

        const gerarCabecalho = (via) => {
            doc.addImage(imgLogoBase64, 'PNG', 10, 8, 30, 30);

            doc.setFontSize(16);
            doc.text('Clínica Odontológica Sorriso Brilhante', 50, 20);
            doc.setFontSize(12);
            doc.text(`Orçamento Odontológico - Via: ${via}`, 50, 30);

            doc.setFontSize(10);
            doc.text(`Data: ${formData.orcamentoData}`, 10, 45);

            // Linha divisória
            doc.line(10, 50, 200, 50);
        };

        const gerarTabelaServicos = (yStart) => {
            if (servicosSelecionados.length === 0) return null;

            const tableResult = 
            autoTable(doc, {
                startY: yStart,
                head: [['Quantidade', 'Serviço', 'Valor Unitário (R$)', 'Subtotal (R$)']],
                body: servicosSelecionados.map(item => [
                    item.quantidade,
                    item.descricao,
                    item.valor.toFixed(2),
                    (item.quantidade * item.valor).toFixed(2),
                ]),
                theme: 'grid'
            });

            return tableResult;
        };

        const gerarRodape = (yStart) => {
            const total = calcularTotal().toFixed(2);
            doc.setFontSize(12);
            doc.text(`Total: R$ ${total}`, 10, yStart);

            doc.text('Formas de Pagamento:', 10, yStart + 10);
            doc.setFontSize(10);
            doc.text(formData.formasPagamento, 10, yStart + 20);

            // Espaço para assinatura
            doc.setFontSize(10);
            doc.text('Assinatura do Paciente: _______________________', 10, yStart + 40);
            doc.text('Assinatura da Clínica: _________________________', 10, yStart + 50);

            // Rodapé
            doc.setFontSize(8);
            doc.text('Clínica Odontológica Sorriso Brilhante - Tel: (11) 1234-5678', 10, 285);
        };

        const criarPaginaOrcamento = (via) => {
            gerarCabecalho(via);
            let yPosTabela = 55;
            const tabela = gerarTabelaServicos(yPosTabela);
            const yFinal = tabela?.finalY || (yPosTabela + 20); // se tabela não existir, soma um valor padrão
            gerarRodape(yFinal + 10);

        };

        // Via Paciente
        criarPaginaOrcamento('Paciente');

        // Via Clínica
        doc.addPage();
        criarPaginaOrcamento('Clínica');

        doc.save('orcamento_odontologico.pdf');
    };


    return (
        <Container className="mt-4">
            {/* <ContentHeader title="Orçamento" /> */}

            <Row className="align-items-end mb-3">
                <Col md={3}>
                    <Form.Group>
                        <Form.Label>Data</Form.Label>
                        <Form.Control
                            type="date"
                            value={formData.orcamentoData}
                            onChange={(e) => setFormData(prev => ({ ...prev, orcamentoData: e.target.value }))}
                        />
                    </Form.Group>
                </Col>
                <Col md="auto">
                    <Button variant="success" onClick={() => setShowModal(true)}>Incluir Serviço +</Button>
                </Col>
                <Col md="auto">
                    <Button variant="primary" onClick={gerarPDF}>Gerar PDF</Button>
                </Col>
                <Col md="auto">
                    <Button variant="warning" onClick={limparFormulario}>Novo Orçamento</Button>
                </Col>
            </Row>

            <Table bordered hover responsive size="sm">
                <thead className="table-primary">
                    <tr>
                        <th>QUANT</th>
                        <th>SERVIÇO</th>
                        <th>VALOR (R$)</th>
                        <th>SUBTOTAL (R$)</th>
                        <th>AÇÕES</th>
                    </tr>
                </thead>
                <tbody>
                    {servicosSelecionados.length > 0 ? (
                        servicosSelecionados.map((item, index) => (
                            <tr key={index}>
                                <td>{item.quantidade}</td>
                                <td>{item.descricao}</td>
                                <td>{item.valor.toFixed(2)}</td>
                                <td>{(item.valor * item.quantidade).toFixed(2)}</td>
                                <td>
                                    <Button variant="danger" size="sm" onClick={() => handleRemoverServico(index)}>Remover</Button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="text-center">Nenhum serviço adicionado</td>
                        </tr>
                    )}
                </tbody>
            </Table>

            <div className="mb-4">
                <h5>Total: R$ {calcularTotal().toFixed(2)}</h5>
            </div>

            <Form.Group className="mb-3">
                <Form.Label>Formas de Pagamento</Form.Label>
                <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.formasPagamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, formasPagamento: e.target.value }))}
                />
            </Form.Group>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Adicionar Serviço</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label>Serviço</Form.Label>
                        <Form.Select
                            value={novoServico.descricao}
                            onChange={(e) => setNovoServico(prev => ({ ...prev, descricao: e.target.value }))}
                        >
                            <option value="">Selecione...</option>
                            {servicos.map((servico, idx) => (
                                <option key={idx} value={servico}>{servico}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Quantidade</Form.Label>
                        <Form.Control
                            type="number"
                            min="1"
                            value={novoServico.quantidade}
                            onChange={(e) => setNovoServico(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 1 }))}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Valor Unitário (R$)</Form.Label>
                        <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            value={novoServico.valor}
                            onChange={(e) => setNovoServico(prev => ({ ...prev, valor: parseFloat(e.target.value) || 0 }))}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
                    <Button variant="success" onClick={handleAdicionarServico}>Adicionar</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default Orcamento;
