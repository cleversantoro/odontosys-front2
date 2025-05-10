import React, { useEffect, useState } from "react";
import { Table, Button, Container, Pagination, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import PacienteDetalhesModal from "./PacienteDetalhes";
import ToastConfirmacao from "../../components/share/ToastConfirmacao";
import ContentHeader from "../../components/share/ContentHeader";
import "./cadastroPaciente.css";

export default function PacientesLista() {
  const [pacientes, setPacientes] = useState([]);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [showModalDetalhes, setShowModalDetalhes] = useState(false);
  const [toastDelete, setToastDelete] = useState({ show: false, id: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); 
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  const fetchPacientes = async () => {
    try {
      const res = await api.get('/pacientes');
      setPacientes(res.data);
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
    }
  };

  useEffect(() => {
    fetchPacientes();
  }, []);

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/pacientes/${toastDelete.id}`);
      setToastDelete({ show: false, id: null });
      fetchPacientes();
    } catch (error) {
      console.error('Erro ao excluir paciente:', error);
    }
  };

  const filteredPacientes = pacientes.filter((p) =>
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPacientes.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <ContentHeader title="Pacientes" />
      <Container className="mt-4">
        <div className="d-flex justify-content-between mb-3 align-items-center">
          <h2>Lista de Pacientes</h2>
          <Button onClick={() => navigate('/pacientes/cadastrar')}>+ Novo Paciente</Button>
        </div>

        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reseta para página 1 na busca
            }}
          />
        </Form.Group>

        <Table striped bordered hover>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Nascimento</th>
              <th>Sexo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((p) => (
              <tr key={p.id}>
                <td>{p.nome}</td>
                <td>{p.email}</td>
                <td>{new Date(p.dataNascimento).toLocaleDateString()}</td>
                <td>{p.sexo}</td>
                <td>
                  <Button variant="info" size="sm" onClick={() => { setPacienteSelecionado(p); setShowModalDetalhes(true); }}>Visualizar</Button>{" "}
                  <Button variant="warning" size="sm" onClick={() => navigate(`/pacientes/cadastrar/${p.id}`)}>Editar</Button>{" "}
                  <Button variant="danger" size="sm" onClick={() => setToastDelete({ show: true, id: p.id })}>Excluir</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>

        <Pagination className="justify-content-center">
          {[...Array(Math.ceil(filteredPacientes.length / itemsPerPage)).keys()].map(number => (
            <Pagination.Item key={number + 1} onClick={() => paginate(number + 1)} active={number + 1 === currentPage}>
              {number + 1}
            </Pagination.Item>
          ))}
        </Pagination>

        {showModalDetalhes && (
          <PacienteDetalhesModal
            paciente={pacienteSelecionado}
            show={showModalDetalhes}
            handleClose={() => setShowModalDetalhes(false)}
          />
        )}

        <ToastConfirmacao
          show={toastDelete.show}
          onHide={() => setToastDelete({ show: false, id: null })}
          onConfirm={handleDeleteConfirm}
          mensagem="Tem certeza que deseja excluir este paciente?"
        />
      </Container>
    </>
  );
}
