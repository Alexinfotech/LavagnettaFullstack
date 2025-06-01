/* ==== src/components/GroupDashboard/Modals/ConfirmLeaveGroupModal.jsx (v1) ==== */
import React, { useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { FaSignOutAlt } from "react-icons/fa"; // Icona per abbandonare

// Modale semplice di conferma (senza input)
const ConfirmLeaveGroupModal = ({
  show,
  handleClose,
  groupName,
  onConfirm,
}) => {
  const [isLeaving, setIsLeaving] = useState(false);

  // Reset stato loading quando la modale viene chiusa dall'esterno
  const handleExited = () => {
    setIsLeaving(false);
  };

  const handleConfirmClick = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    try {
      await onConfirm();
      // Non chiudiamo la modale qui, la logica chiamante (GroupDetail)
      // navigherà via in caso di successo, smontando la modale.
      // Se onConfirm fallisce, l'errore viene gestito nel context
      // e lo stato isLeaving viene resettato in handleExited.
    } catch (error) {
      // L'errore è già gestito nel context (toast), qui resettiamo solo lo stato
      console.error("Errore conferma abbandono (modal):", error);
      setIsLeaving(false); // Resetta lo stato in caso di errore non catturato da onConfirm
    }
    // Non resettare isLeaving qui in caso di successo,
    // altrimenti l'utente vede lo spinner sparire prima della navigazione
  };

  return (
    <Modal
      show={show}
      onHide={handleClose} // Permette chiusura standard
      onExited={handleExited} // Resetta stato quando chiusa
      centered
      backdrop="static" // Non chiude cliccando fuori
      keyboard={false} // Non chiude premendo Esc
      className="confirm-leave-group-modal" // Classe per stile opzionale
    >
      <Modal.Header closeButton>
        <Modal.Title className="font-primary text-warning">
          {" "}
          {/* Colore Warning */}
          <FaSignOutAlt className="me-2" /> Conferma Abbandono Gruppo
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="font-secondary">
        {" "}
        {/* Corpo modale Lato */}
        Sei sicuro di voler abbandonare il gruppo "
        <strong className="font-secondary">{groupName || "N/D"}</strong>"?
        <br />
        Non potrai più accedere alle sue lavagne o interagire con i membri.
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={handleClose}
          disabled={isLeaving}
          className="font-secondary"
        >
          Annulla
        </Button>
        <Button
          variant="warning" // Bottone Warning (o Danger se preferisci)
          onClick={handleConfirmClick}
          disabled={isLeaving}
          className="font-secondary"
        >
          {isLeaving ? (
            <Spinner as="span" animation="border" size="sm" className="me-1" />
          ) : null}
          Sì, Abbandona
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmLeaveGroupModal;
