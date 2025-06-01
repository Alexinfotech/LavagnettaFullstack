/* ==== src/components/GroupDashboard/Modals/ConfirmDeleteGroupModal.jsx (v3 - Testo Avviso Spostato) ==== */
import React, { useState, useRef } from "react";
import { Modal, Button, Form, Alert, Spinner } from "react-bootstrap";
import { FaTrashAlt } from "react-icons/fa";

const ConfirmDeleteGroupModal = ({
  show,
  handleClose,
  groupName,
  onConfirm,
}) => {
  const [confirmationInput, setConfirmationInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const inputRef = useRef(null);

  const handleExited = () => {
    setConfirmationInput("");
    setIsDeleting(false);
  };
  const handleEntered = () => {
    if (inputRef.current) inputRef.current.focus();
  };

  const handleConfirmClick = async () => {
    if (confirmationInput !== groupName || isDeleting) return;
    setIsDeleting(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error("Errore conf elim (modal):", error);
      setIsDeleting(false);
    }
  };

  const isConfirmationMatching = confirmationInput === groupName;
  const canConfirm = isConfirmationMatching && !isDeleting;

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      backdrop="static"
      keyboard={false}
      onExited={handleExited}
      onEntered={handleEntered}
      className="confirm-delete-group-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="font-primary text-danger">
          <FaTrashAlt className="me-2" /> Conferma Eliminazione Gruppo
        </Modal.Title>
      </Modal.Header>
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          if (canConfirm) handleConfirmClick();
        }}
      >
        <Modal.Body>
          <Alert variant="danger" className="font-secondary">
            <Alert.Heading className="font-primary">Attenzione!</Alert.Heading>
            <p>
              {" "}
              Stai per eliminare definitivamente il gruppo "
              <strong className="font-secondary">{groupName || "N/D"}</strong>".
            </p>
            {/* Testo Spostato Qui */}
            <p className="mb-3">
              {" "}
              {/* Aggiunto margine sotto */}
              L'eliminazione del gruppo è definitiva e irreversibile.
            </p>
            <hr />{" "}
            <p className="mb-0">
              Per confermare, digita il nome esatto del gruppo:
            </p>
          </Alert>

          <Form.Group controlId="deleteConfirmationInput" className="mt-3">
            <Form.Control
              ref={inputRef}
              type="text"
              className="font-secondary"
              placeholder={groupName || "Nome gruppo"}
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              isInvalid={confirmationInput !== "" && !isConfirmationMatching}
              aria-describedby="confirmationHelp"
              autoComplete="off"
            />
            <Form.Text id="confirmationHelp" muted className="font-secondary">
              {" "}
              Inserisci "{groupName}" per abilitare l'eliminazione.{" "}
            </Form.Text>
            <Form.Control.Feedback type="invalid">
              Il nome inserito non corrisponde.
            </Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isDeleting}
            className="font-secondary"
          >
            Annulla
          </Button>
          <Button
            variant="danger"
            type="submit"
            disabled={!canConfirm}
            className="font-secondary"
          >
            {isDeleting ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                className="me-1"
              />
            ) : null}
            Elimina Definitivamente
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ConfirmDeleteGroupModal;
