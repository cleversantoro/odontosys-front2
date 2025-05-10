import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { Calendar, momentLocalizer } from 'react-big-calendar';
// import { format, parseISO } from 'date-fns';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Container, Modal, Form, Button } from 'react-bootstrap';
import api from '../../services/api';
import 'moment/locale/pt-br';
// import { ptBR } from 'date-fns/locale';


moment.locale('pt-br');
const localizer = momentLocalizer(moment);


// const localizer = {
//   format: (date, formatStr) => format(date, formatStr, { locale: ptBR }),
//   parse: parseISO,
//   startOfWeek: () => 0,
//   getDay: date => date.getDay(),
// };


export default function ConsultasAgenda() {
  const [consultas, setConsultas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [formData, setFormData] = useState({ pacienteId: '', profissionalId: '', data: '', hora: '', status: 'Agendado', obs: '' });

  useEffect(() => {
    carregarConsultas();
  }, []);

  const carregarConsultas = async () => {
    try {
      const res = await api.get('/consultas/completa');
      setConsultas(res.data);
    } catch (error) {
      console.error('Erro ao carregar consultas:', error);
    }
  };

  const handleOpenModal = (consulta) => {
    const dataValida = consulta?.data_agendamento && !isNaN(new Date(consulta.data_agendamento));
    const hora = dataValida ? new Date(consulta.data_agendamento).toISOString().slice(11, 16) : '';
  
    setFormData({
      pacienteId: consulta.pacienteId || '',
      profissionalId: consulta.profissionalId || '',
      data: dataValida ? consulta.data_agendamento.slice(0, 10) : '',
      hora,
      status: consulta.situacao || 'Agendado',
      obs: consulta.obs || '',
    });
  
    setConsultaSelecionada(consulta);
    setShowModal(true);
  };
  

  const handleCloseModal = () => {
    setShowModal(false);
    setConsultaSelecionada(null);
  };

  const handleSave = async () => {
    const dataCompleta = `${formData.data}T${formData.hora}:00.000Z`;
    const payload = { ...formData, data: dataCompleta };
    try {
      if (consultaSelecionada) {
        await api.put(`/consultas/${consultaSelecionada.id}`, payload);
      }
      carregarConsultas();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar consulta:', error);
    }
  };

  const eventos = consultas.map(c => ({
    id: c.id,
    title: `${c.nome_paciente} - ${c.nome_profissional}`,
    start: new Date(c.data_agendamento),
    end: new Date(new Date(c.data_agendamento).getTime() + 30 * 60000), // assume 30min por padrão
    resource: {
      status: c.situacao,
      paciente: c.nome_paciente,
      profissional: c.nome_profissional,
    },
  }));
  

  const estilosEvento = ({ event }) => {
    if (!event || !event.resource) return {};
  
    let backgroundColor = '#0d6efd';
    if (event.resource.situacao === 'Cancelado') backgroundColor = '#dc3545';
    if (event.resource.situacao === 'Concluído') backgroundColor = '#198754';
    if (event.resource.situacao === 'Confirmado') backgroundColor = '#ffc107';
  
    return {
      style: {
        backgroundColor,
        color: 'white',
        borderRadius: '5px',
        padding: '2px 4px',
      }
    };
  };
  

  return (
    <Container className="mt-4">
      <h4>Agenda de Consultas</h4>
      <Calendar
        localizer={localizer}
        events={eventos}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 600 }}
        eventPropGetter={estilosEvento}
        onSelectEvent={(event) => handleOpenModal(event.resource)}
      />

      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton><Modal.Title>Editar Consulta</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-2">
              <Form.Label>Paciente ID</Form.Label>
              <Form.Control type="number" value={formData.pacienteId} onChange={e => setFormData({ ...formData, pacienteId: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Profissional ID</Form.Label>
              <Form.Control type="number" value={formData.profissionalId} onChange={e => setFormData({ ...formData, profissionalId: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Data</Form.Label>
              <Form.Control type="date" value={formData.data} onChange={e => setFormData({ ...formData, data: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Hora</Form.Label>
              <Form.Control type="time" value={formData.hora} onChange={e => setFormData({ ...formData, hora: e.target.value })} />
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Status</Form.Label>
              <Form.Select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                <option>Agendado</option>
                <option>Concluído</option>
                <option>Cancelado</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-2">
              <Form.Label>Observações</Form.Label>
              <Form.Control as="textarea" rows={2} value={formData.obs} onChange={e => setFormData({ ...formData, obs: e.target.value })} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>Salvar</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
