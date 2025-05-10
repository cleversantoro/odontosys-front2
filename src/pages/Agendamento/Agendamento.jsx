// src/pages/Consulta.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

import ContentHeader from '../../components/share/ContentHeader';
import TabelaConsultas from '../../components/agendamentos/TabelaConsultas';


const Appointment = () => {
    const [agendamentos, setAppointments] = useState([]);
    const [selectedappointment, setSelectedAppointment] = useState(null);

    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);

    useEffect(() => {
        loadAppointments();
    }, []);

    const loadAppointments = async () => {
        try {
            const response = await api.get('/agendamentos');
            setAppointments(response.data);
        } catch (error) {
            console.error('Erro ao buscar consultas:', error);
        }
    };

    const handleRowClick = (agendamentos) => {
        setSelectedAppointment(agendamentos);
        setShow(true);
    };


    return (
        <>
            <ContentHeader title="Consultas" />

            <Button variant="primary" onClick={handleRowClick}>
                Adicionar Consulta
            </Button>


            <div className="container mt-4">
                <TabelaConsultas consultas={agendamentos} />
            </div>

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Detalhes da Consulta</Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    {selectedappointment && (
                        <div className="p-4">
                            <div className="space-y-2">
                                <p><strong>paciente:</strong> {selectedappointment.paciente?.name}</p>
                                <p><strong>profissional:</strong> {selectedappointment.profissional?.name}</p>
                                {/* <p><strong>data:</strong> {new date(selectedappointment.date).tolocaledatestring()}</p> */}
                                <p><strong>status:</strong> {selectedappointment.status}</p>
                                <p><strong>notas:</strong> {selectedappointment.notes}</p>
                                {selectedappointment.patient && (
                                    <div className="mt-4">
                                        <h3 className="font-bold mb-2">informações do paciente</h3>
                                        <p><strong>email:</strong> {selectedappointment.patient.email}</p>
                                        <p><strong>telefone:</strong> {selectedappointment.patient.phone}</p>
                                        <p><strong>cpf:</strong> {selectedappointment.patient.cpf}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                    <Button variant="primary" onClick={handleClose}>Save Changes</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Appointment;