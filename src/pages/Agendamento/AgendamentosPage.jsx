
import React, { useState, useEffect } from "react";
import { Button, Container } from "react-bootstrap";
import api from '../../services/api';

import ContentHeader from '../../components/share/ContentHeader';
import AgendamentoForm from "../../components/agendamentos/AgendamentoForm";
import AgendamentoList from "../../components/agendamentos/AgendamentoList";

export default function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const carregarAgendamentos = async () => {
    const res = await api.get('/agendamentos');
    setAgendamentos(res.data);
  };

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  const handleEditar = (agendamento) => {
    setEditItem(agendamento);
    setShowForm(true);
  };

  const handleFechar = () => {
    setEditItem(null);
    setShowForm(false);
    carregarAgendamentos();
  };

  return (
    <>
    <ContentHeader title="Agendamentos" />

    <Container className="mt-4">
      <h2>Agendamentos</h2>
      <Button className="mb-3" onClick={() => setShowForm(true)}>Novo Agendamento</Button>
      
      {showForm && (
        <AgendamentoForm agendamento={editItem} onClose={handleFechar} />
      )}
      
      <AgendamentoList agendamentos={agendamentos} onEdit={handleEditar} onDelete={carregarAgendamentos} />
    </Container>
    </>

  );
}
