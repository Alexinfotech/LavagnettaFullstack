/* ==== src/components/Modals/ConfirmDeleteProductModal.jsx ==== */
import React from "react";
import { Modal, Button } from "react-bootstrap";
import { FaTrashAlt, FaExclamationTriangle } from "react-icons/fa"; // Icone

// Stile opzionale (se non usi un file CSS separato)
// import './ConfirmDeleteProductModal.css'; // Assicurati che il percorso sia corretto se lo usi

const ConfirmDeleteProductModal = ({
  show,
  handleClose,
  productName,
  onConfirm,
}) => {
  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="sm" // Modale piccola
      className="confirm-delete-product-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title className="font-primary text-danger">
          {" "}
          {/* Titolo Caveat Rosso */}
          <FaExclamationTriangle className="me-2" /> {/* Icona Attenzione */}
          Conferma Eliminazione
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="font-secondary text-center">
        {" "}
        {/* Corpo Lato, Testo centrato */}
        Sei sicuro di voler eliminare
        <br />"
        <strong className="font-secondary">
          {productName || "questo prodotto"}
        </strong>
        "?
        <br />
        <small className="text-muted d-block mt-2">
          (L'azione è irreversibile)
        </small>
      </Modal.Body>
      <Modal.Footer>
        {/* Bottone Annulla (Lato) */}
        <Button
          variant="secondary"
          onClick={handleClose}
          className="font-secondary"
        >
          Annulla
        </Button>
        {/* Bottone Elimina (Lato) */}
        <Button variant="danger" onClick={onConfirm} className="font-secondary">
          <FaTrashAlt className="me-1" /> {/* Icona Cestino */}
          Elimina
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConfirmDeleteProductModal;
