/* ==== src/components/GroupDashboard/CreateGroupModal/CreateGroupModal.jsx (VERIFICATO) ==== */
import React, { useState, useRef } from "react";
import { Modal, Button, Form, Spinner, Alert } from "react-bootstrap";
import { useGroup } from "../../../contexts/GroupContext";

const CreateGroupModal = ({ show, handleClose }) => {
  const { createGroup } = useGroup();
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleExited = () => {
    setGroupName("");
    setError("");
    setLoading(false);
  };
  const handleEntered = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = groupName.trim();
    if (!trimmedName) {
      setError("Il nome del gruppo è obbligatorio.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const newGroup = await createGroup({ name: trimmedName });
      if (newGroup) {
        handleClose();
      } else {
        throw new Error("Creazione gruppo fallita (risposta non valida).");
      }
    } catch (err) {
      const apiError =
        err.response?.data?.message || err.message || "Errore sconosciuto.";
      setError(apiError);
      console.error("Errore creazione gruppo (modal):", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      onExited={handleExited}
      onEntered={handleEntered}
      centered
      backdrop="static"
      keyboard={false}
      className="create-group-modal"
    >
      <Modal.Header closeButton>
        {/* Titolo Caveat Ocra */}
        <Modal.Title className="font-primary text-accent">
          Crea Nuovo Gruppo
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {error && (
            <Alert variant="danger" className="text-center font-secondary mb-3">
              {error}
            </Alert>
          )}
          <Form.Group controlId="createGroupNameModal">
            <Form.Label className="font-secondary">Nome Gruppo</Form.Label>
            <Form.Control
              ref={inputRef}
              type="text"
              className="font-secondary"
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (error) setError("");
              }}
              isInvalid={!!error && !groupName.trim()}
              placeholder="Nome del tuo nuovo gruppo"
              required
            />
            <Form.Control.Feedback type="invalid">
              Il nome è obbligatorio.
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="font-secondary"
          >
            Annulla
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={loading || !groupName.trim()}
            className="font-secondary"
          >
            {loading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-1"
              />
            ) : null}
            Crea Gruppo
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateGroupModal;
