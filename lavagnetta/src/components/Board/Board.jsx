/* ==== src/components/Board/Board.jsx (v45 - Logica Scroll Header CORRETTA) ==== */
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { FaTrashAlt, FaCheck, FaTimes, FaPlus } from "react-icons/fa";
import { Spinner } from "react-bootstrap";
// Importa le azioni
import { addItem as addItemAction } from "./actions/addItem";
import { deleteItem as deleteItemAction } from "./actions/deleteItem";
import { toggleBought as toggleBoughtAction } from "./actions/toggleBought";
import { updateItemName as updateItemNameAction } from "./actions/updateItemName";
import ConfirmDeleteProductModal from "./Modals/ConfirmDeleteProductModal";
import { useLayout } from "../../contexts/LayoutContext";
import { toast } from "react-toastify";
import "./Board.css"; // Assicurati che il CSS sia importato

const DEFAULT_BOARD_UI_BACKGROUND = "/images/blackboard.jpg";
const LONG_PRESS_DURATION = 700;

// --- FUNZIONI HELPER ---

// Funzione helper per abbreviare username (mostra solo la prima parola)
const getShortUsername = (username) => {
  if (!username || typeof username !== "string") {
    return "";
  }
  return username.split(" ")[0];
};

// Funzione helper per ottenere un colore distintivo basato sull'ID utente
const USER_COLORS = [
  "#4CAF50", // Verde Vivace
  "#2196F3", // Blu Brillante
  "#FFEB3B", // Giallo Limone (Buon contrasto su scuro)
  "#E91E63", // Rosa Acceso
  "#00BCD4", // Ciano Chiaro
  "#FF9800", // Arancione
  "#9C27B0", // Viola Intenso
  "#009688", // Teal
  "#CDDC39", // Lime
  "#FF5722", // Arancione Scuro/Rosso Mattone
  "#673AB7", // Viola Scuro
  "#8BC34A", // Verde Chiaro
];

const getColorForUserId = (userId) => {
  const id = Number(userId);
  if (isNaN(id) || id <= 0) {
    return "#FFFFFF"; // Colore di default (bianco) per ID non validi o null
  }
  const index = Math.abs(id) % USER_COLORS.length;
  return USER_COLORS[index];
};

// --- COMPONENTE BOARD ---
const Board = ({
  selectedBoard,
  hideSubHeader,
  showSubHeader,
  onDataRefreshNeeded,
}) => {
  const { isSubHeaderHidden } = useLayout();

  // Stati UI
  const [items, setItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [productIndexToDelete, setProductIndexToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  // Refs
  const inputRef = useRef(null);
  const productListContainerRef = useRef(null);
  const lastScrollTopRef = useRef(0);
  const longPressTimerRef = useRef(null);

  // --- SINCRONIZZAZIONE E RESET STATI ---
  useEffect(() => {
    if (selectedBoard && Array.isArray(selectedBoard.products)) {
      const processedProducts = selectedBoard.products.map((p) => ({
        ...p,
        is_purchased: !!p.is_purchased,
      }));
      if (JSON.stringify(processedProducts) !== JSON.stringify(items)) {
        setItems(processedProducts);
      }
    } else if (items.length > 0) {
      setItems([]);
    }
    setEditingIndex(null);
    setEditedName("");
    setNewItemName("");
    setActionLoading(null);
    if (productListContainerRef.current)
      productListContainerRef.current.scrollTop = 0;
    lastScrollTopRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard?.id, selectedBoard?.products]);

  // Effetto separato per gestire lo stato iniziale dell'header basato su selectedBoard
  useEffect(() => {
    // Mostra sempre l'header quando la board (o le sue props necessarie) cambiano
    if (showSubHeader && typeof showSubHeader === "function") {
      // console.log("[Board Effect] Showing sub-header on board change/mount.");
      showSubHeader();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBoard?.id, showSubHeader]); // Dipende solo da ID e funzione showSubHeader

  // --- GESTIONE SCROLL HEADER (LOGICA CORRETTA) ---
  useEffect(() => {
    const listElement = productListContainerRef.current;
    if (
      !listElement ||
      typeof hideSubHeader !== "function" ||
      typeof showSubHeader !== "function"
    ) {
      return; // Esce se elementi o funzioni non sono pronti
    }

    const handleScroll = () => {
      if (!listElement) return;

      const currentScrollTop = listElement.scrollTop;
      const lastScrollTop = lastScrollTopRef.current;

      // Determina se l'utente ha scrollato fino in cima (con una piccola tolleranza)
      const isAtTop = currentScrollTop <= 5;

      // Determina la direzione dello scroll
      const isScrollingDown = currentScrollTop > lastScrollTop;

      // Soglia minima di scroll verso il basso per nascondere l'header
      const scrollDownThreshold = 20; // Nascondi solo dopo aver scrollato un po'

      // console.log(`Scroll: Top=${currentScrollTop}, Last=${lastScrollTop}, Down=${isScrollingDown}, AtTop=${isAtTop}, Hidden=${isSubHeaderHidden}`); // Per Debug

      // CONDIZIONE PER NASCONDERE:
      // Sta scrollando verso il basso OLTRE la soglia E l'header è attualmente VISIBILE
      if (
        isScrollingDown &&
        currentScrollTop > scrollDownThreshold &&
        !isSubHeaderHidden
      ) {
        // console.log("Hiding sub-header (scrolling down)");
        hideSubHeader();
      }
      // CONDIZIONE PER MOSTRARE:
      // È tornato IN CIMA alla lista E l'header è attualmente NASCOSTO
      else if (isAtTop && isSubHeaderHidden) {
        // console.log("Showing sub-header (returned to top)");
        showSubHeader();
      }

      // Aggiorna la posizione dell'ultimo scroll per il prossimo evento
      lastScrollTopRef.current = Math.max(0, currentScrollTop); // Assicura che non sia mai < 0
    };

    // Imposta la posizione iniziale di riferimento dello scroll
    lastScrollTopRef.current = listElement.scrollTop;

    // Aggiunge l'event listener
    listElement.addEventListener("scroll", handleScroll, { passive: true });

    // Funzione di cleanup: rimuove l'event listener
    return () => {
      if (listElement) {
        listElement.removeEventListener("scroll", handleScroll);
      }
      // Importante: assicurati che l'header sia mostrato quando il componente viene smontato
      // o quando le dipendenze cambiano (es. cambio board), nel caso fosse rimasto nascosto.
      // Lo facciamo già nell'altro useEffect che dipende da selectedBoard.id, quindi qui potrebbe essere ridondante
      // ma per sicurezza lo lasciamo commentato se serve
      // if (typeof showSubHeader === 'function' && isSubHeaderHidden) {
      //    console.log("Cleanup: Ensuring sub-header is visible on unmount/deps change");
      //    showSubHeader();
      // }
    };
  }, [hideSubHeader, showSubHeader, isSubHeaderHidden]); // Le dipendenze sono le funzioni e lo stato di visibilità

  // --- CALCOLO PERMESSI PRODOTTI ---
  const permissions = useMemo(() => {
    const role = selectedBoard?.userRoleInGroup;
    const isGroupCtx = !!selectedBoard?.isGroupContext;
    const isDefaultGroupBoard = !!selectedBoard?.isDefaultGroupBoard;
    let canAdd = false,
      canEdit = false,
      canDelete = false,
      canToggle = false;
    if (!isGroupCtx) {
      canAdd = true;
      canEdit = true;
      canDelete = true;
      canToggle = true;
    } // Board personale
    else {
      // Board di gruppo
      if (role === "admin" || role === "level1") {
        canAdd = true;
        canEdit = true;
        canDelete = true;
        canToggle = true;
      } else if (role === "level2") {
        canAdd = !isDefaultGroupBoard;
        canEdit = false;
        canDelete = false;
        canToggle = true;
      }
    }
    const canLongPressEdit = canEdit; // Long press richiede permesso di edit
    return { canAdd, canEdit, canDelete, canToggle, canLongPressEdit };
  }, [selectedBoard]); // Ricalcola solo se selectedBoard cambia

  // --- FUNZIONI AZIONI PRODOTTI (Callbacks Memoizzate) ---
  const handleAddItem = useCallback(() => {
    if (!selectedBoard || actionLoading || !permissions.canAdd) {
      if (!permissions.canAdd)
        toast.warn("Non hai i permessi per aggiungere prodotti qui.");
      return;
    }
    const trimmedName = newItemName.trim();
    if (!trimmedName) {
      toast.info("Inserisci un nome per il prodotto.");
      return;
    }
    setActionLoading("add");
    addItemAction(
      trimmedName,
      items,
      setItems,
      setNewItemName,
      selectedBoard,
      null,
      onDataRefreshNeeded
    )
      .then(() => {
        if (inputRef.current) inputRef.current.focus();
      })
      .catch((err) => {
        console.error("[Board] Errore da handleAddItem:", err);
      })
      .finally(() => {
        setActionLoading(null);
      });
  }, [
    newItemName,
    items,
    selectedBoard,
    permissions.canAdd,
    onDataRefreshNeeded,
    actionLoading,
    setNewItemName, // Aggiunta dipendenza mancante
  ]);

  const handleDeleteItem = useCallback(
    (index) => {
      if (!selectedBoard || actionLoading || !permissions.canDelete) {
        if (!permissions.canDelete)
          toast.warn("Non hai i permessi per eliminare prodotti.");
        return;
      }
      const itemToDelete = items[index];
      if (!itemToDelete) return;
      setProductIndexToDelete(index);
      setShowConfirmDelete(true);
    },
    [items, selectedBoard, permissions.canDelete, actionLoading]
  );

  const executeDelete = useCallback(() => {
    if (productIndexToDelete === null || !selectedBoard || actionLoading)
      return;
    const itemToDelete = items[productIndexToDelete];
    if (!itemToDelete?.id) {
      console.error("[Board] executeDelete: Item o ID non trovato");
      setShowConfirmDelete(false);
      setProductIndexToDelete(null);
      return;
    }
    setActionLoading(`delete-${itemToDelete.id}`);
    setShowConfirmDelete(false);
    deleteItemAction(
      productIndexToDelete,
      [...items],
      setItems,
      selectedBoard,
      onDataRefreshNeeded
    )
      .catch((err) => {
        console.error("[Board] Errore da executeDelete:", err);
      })
      .finally(() => {
        setActionLoading(null);
        setProductIndexToDelete(null);
      });
  }, [
    productIndexToDelete,
    items,
    selectedBoard,
    onDataRefreshNeeded,
    actionLoading,
    // permissions.canDelete // Aggiunta dipendenza (anche se già bloccata in handleDeleteItem)
  ]);

  const handleToggleBought = useCallback(
    (index) => {
      const itemToToggle = items[index];
      if (
        !selectedBoard ||
        !itemToToggle ||
        actionLoading ||
        !permissions.canToggle
      ) {
        if (!permissions.canToggle)
          toast.warn("Non hai i permessi per segnare/desegnare prodotti.");
        return;
      }
      setActionLoading(`toggle-${itemToToggle.id}`);
      toggleBoughtAction(
        index,
        [...items],
        setItems,
        selectedBoard,
        onDataRefreshNeeded
      )
        .catch((err) => {
          console.error(
            `[Board] Errore da handleToggleBought per indice ${index}:`,
            err
          );
        })
        .finally(() => {
          setActionLoading(null);
        });
    },
    [
      items,
      selectedBoard,
      permissions.canToggle,
      onDataRefreshNeeded,
      actionLoading,
    ]
  );

  const cancelEdit = useCallback(() => {
    setEditingIndex(null);
    setEditedName("");
  }, []);

  const handleUpdateItemName = useCallback(
    (index) => {
      const itemToUpdate = items[index];
      if (
        !selectedBoard ||
        !itemToUpdate?.id ||
        !permissions.canEdit ||
        actionLoading
      ) {
        if (!permissions.canEdit)
          toast.warn("Non hai i permessi per modificare i nomi.");
        return;
      }
      const trimmedName = editedName.trim();
      if (!trimmedName || trimmedName === itemToUpdate.name) {
        cancelEdit();
        return;
      }
      // Non serve actionLoading qui, UI esce subito da edit
      updateItemNameAction(
        index,
        trimmedName,
        [...items],
        setItems,
        setEditingIndex, // Passa la funzione corretta
        setEditedName, // Passa la funzione corretta
        selectedBoard,
        onDataRefreshNeeded
      )
        .then(() => {
          cancelEdit(); // Chiudi la modalità edit solo se l'azione ha successo
        })
        .catch((err) => {
          console.error(
            `[Board] Errore da handleUpdateItemName per indice ${index}:`,
            err
          );
          // Non chiamare cancelEdit() qui, potrebbe essere necessario lasciare l'utente in edit mode per riprovare
        });
      // Il finally è stato rimosso perché `cancelEdit` è chiamato nel .then()
    },
    [
      editedName,
      items,
      selectedBoard,
      permissions.canEdit,
      onDataRefreshNeeded,
      actionLoading,
      cancelEdit,
      setEditingIndex, // Aggiunta dipendenza
      setEditedName, // Aggiunta dipendenza
    ]
  );

  // --- GESTIONE INPUT ---
  const handleInputChange = (e) => setNewItemName(e.target.value);
  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      newItemName.trim() !== "" &&
      permissions.canAdd &&
      !actionLoading
    ) {
      e.preventDefault();
      handleAddItem();
    }
  };

  // --- GESTIONE MODIFICA + LONG PRESS ---
  const startEditMode = useCallback(
    (index) => {
      if (editingIndex === index || actionLoading || !permissions.canEdit) {
        if (!permissions.canEdit)
          toast.warn("Non hai i permessi per modificare questo prodotto.");
        return;
      }
      setEditingIndex(index);
      setEditedName(items[index]?.name || "");
    },
    [items, editingIndex, permissions.canEdit, actionLoading]
  );

  const handlePressStart = useCallback(
    (index) => {
      if (
        editingIndex === index ||
        actionLoading ||
        !permissions.canLongPressEdit
      )
        return;
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = setTimeout(() => {
        startEditMode(index);
        longPressTimerRef.current = null;
      }, LONG_PRESS_DURATION);
    },
    [editingIndex, permissions.canLongPressEdit, startEditMode, actionLoading]
  );

  const handlePressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);
  const handlePressLeave = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  // Click/Tap gestisce toggle e annulla long press
  const handleItemClick = useCallback(
    (index, event) => {
      if (editingIndex === index) return;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (editingIndex === null && !actionLoading && permissions.canToggle) {
        handleToggleBought(index);
      }
    },
    [editingIndex, actionLoading, permissions.canToggle, handleToggleBought]
  );

  // --- RENDERING ---
  if (!selectedBoard || !selectedBoard.id) return null;

  const backgroundToApply =
    selectedBoard.userBackground ||
    selectedBoard.background ||
    DEFAULT_BOARD_UI_BACKGROUND;
  const backgroundImageUrl = `/images/${backgroundToApply}`;
  const topSectionClass = `board-top-section ${isSubHeaderHidden ? "board-top-section--sticky-top" : ""}`;
  const productListContainerClass = `product-list-container scrollable-list ${isSubHeaderHidden ? "sub-header-is-hidden" : ""}`;

  return (
    <div className="board-layout-wrapper">
      {/* Area Input Aggiunta (Rimane fissa in alto sotto il sub-header) */}
      <div className={topSectionClass}>
        {" "}
        {/* Classe dinamica rimossa, diventa statico */}
        <div className="add-item-area">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              value={newItemName}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="form-control add-item-input font-secondary"
              placeholder={
                permissions.canAdd
                  ? "Aggiungi prodotto..."
                  : "Aggiunta non permessa"
              }
              aria-label="Aggiungi prodotto"
              disabled={!permissions.canAdd || !!actionLoading}
              title={
                permissions.canAdd
                  ? "Aggiungi prodotto alla lavagna"
                  : selectedBoard.isGroupContext &&
                      selectedBoard.userRoleInGroup === "level2" &&
                      selectedBoard.isDefaultGroupBoard
                    ? "I Contributor non possono aggiungere prodotti sulla lavagna di default."
                    : "Non hai i permessi per aggiungere."
              }
              autoComplete="off"
            />
            {/* -------- INIZIO BLOCCO DA COMMENTARE/ELIMINARE -------- */}
            {/*
            <button
              className="btn btn-add-item"
              onClick={handleAddItem}
              disabled={
                !permissions.canAdd ||
                newItemName.trim() === "" ||
                !!actionLoading
              }
              title={permissions.canAdd ? "Aggiungi" : "Azione non permessa"}
              aria-label="Aggiungi prodotto"
            >
              {actionLoading === "add" ? (
                <Spinner animation="border" size="sm" />
              ) : (
                <FaPlus />
              )}
            </button>
                      {/* -------- FINE BLOCCO DA COMMENTARE/ELIMINARE -------- */}
          </div>
          {!permissions.canAdd && selectedBoard.isGroupContext && (
            <small className="permission-warning-text d-block text-center mt-1 font-secondary">
              {selectedBoard.userRoleInGroup === "level2" &&
              selectedBoard.isDefaultGroupBoard
                ? "I Contributor non possono aggiungere prodotti sulla lavagna di default."
                : "Permesso di aggiungere prodotti negato."}
            </small>
          )}
        </div>
      </div>

      {/* Lista Prodotti Scrollabile */}
      <div ref={productListContainerRef} className={productListContainerClass}>
        {items.length === 0 ? (
          <p className="no-items-message font-primary text-shadow-chalk">
            La lavagna è vuota...
          </p>
        ) : (
          <ul className="product-list">
            {items.map((item, index) => {
              const isLoadingToggle = actionLoading === `toggle-${item.id}`;
              const isLoadingDelete = actionLoading === `delete-${item.id}`;
              const isCurrentlyEditing = editingIndex === index;
              const isCurrentlyLoading = isLoadingToggle || isLoadingDelete;
              const canToggleItem =
                !isCurrentlyLoading &&
                !isCurrentlyEditing &&
                permissions.canToggle;
              const canTriggerLongPress =
                !isCurrentlyLoading &&
                !isCurrentlyEditing &&
                permissions.canLongPressEdit;
              const canDeleteItem =
                !isCurrentlyLoading &&
                !isCurrentlyEditing &&
                permissions.canDelete;

              const showModifier =
                selectedBoard.isGroupContext === true &&
                item.lastModifiedByUsername;
              const shortUsername = showModifier
                ? getShortUsername(item.lastModifiedByUsername)
                : "";
              const userColor = showModifier
                ? getColorForUserId(item.last_modified_by)
                : "#FFFFFF";

              return (
                <li
                  key={item.id || `item-${index}`}
                  className={`product-item-wrapper ${isCurrentlyEditing ? "editing" : ""} ${item.is_purchased ? "purchased" : ""} ${isCurrentlyLoading ? "loading-item" : ""}`}
                >
                  {!isCurrentlyEditing ? (
                    <>
                      <span
                        className="item-name-container"
                        onClick={
                          canToggleItem
                            ? (e) => handleItemClick(index, e)
                            : undefined
                        }
                        onTouchStart={
                          canTriggerLongPress
                            ? () => handlePressStart(index)
                            : undefined
                        }
                        onTouchEnd={
                          canTriggerLongPress ? handlePressEnd : undefined
                        }
                        onTouchCancel={
                          canTriggerLongPress ? handlePressLeave : undefined
                        }
                        onMouseDown={
                          canTriggerLongPress
                            ? () => handlePressStart(index)
                            : undefined
                        }
                        onMouseUp={
                          canTriggerLongPress ? handlePressEnd : undefined
                        }
                        onMouseLeave={
                          canTriggerLongPress ? handlePressLeave : undefined
                        }
                        title={
                          canToggleItem
                            ? canTriggerLongPress
                              ? item.is_purchased
                                ? "Clicca per deselezionare (Tieni premuto per modificare)"
                                : "Clicca per selezionare (Tieni premuto per modificare)"
                              : item.is_purchased
                                ? "Clicca per deselezionare"
                                : "Clicca per selezionare"
                            : "Visualizzazione"
                        }
                        style={{
                          touchAction: "manipulation",
                          cursor: canToggleItem ? "pointer" : "default",
                        }}
                      >
                        <span className="item-name font-primary text-shadow-chalk">
                          {isLoadingToggle && (
                            <Spinner
                              animation="grow"
                              size="sm"
                              variant="light"
                              className="me-2"
                            />
                          )}
                          {item.name}
                        </span>
                        {showModifier && (
                          <small
                            className="modifier-username ms-2"
                            style={{
                              color: userColor,
                              fontWeight: 500,
                            }}
                            title={item.lastModifiedByUsername}
                          >
                            ({item.is_purchased ? "✓ " : ""}
                            {shortUsername})
                          </small>
                        )}
                      </span>

                      <button
                        className="btn-icon delete-button"
                        onClick={() => handleDeleteItem(index)}
                        aria-label={`Elimina ${item.name}`}
                        disabled={!canDeleteItem || !!actionLoading}
                        title={
                          canDeleteItem ? "Elimina prodotto" : "Permesso negato"
                        }
                      >
                        {isLoadingDelete ? (
                          <Spinner animation="border" size="sm" />
                        ) : (
                          <FaTrashAlt />
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="edit-mode-controls">
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleUpdateItemName(index);
                          else if (e.key === "Escape") cancelEdit();
                        }}
                        autoFocus
                        className="form-control edit-input font-secondary"
                        aria-label={`Modifica nome di ${items[index]?.name}`}
                        disabled={!!actionLoading}
                      />
                      <button
                        onClick={() => handleUpdateItemName(index)}
                        className="btn-icon save-button"
                        aria-label="Salva modifiche"
                        title="Salva Modifiche"
                        disabled={
                          !editedName.trim() ||
                          editedName.trim() === items[index]?.name ||
                          !!actionLoading
                        }
                        onMouseDown={(e) => e.preventDefault()} // Previene perdita focus input su click
                      >
                        <FaCheck />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="btn-icon cancel-button"
                        aria-label="Annulla modifiche"
                        title="Annulla Modifiche"
                        disabled={!!actionLoading}
                        onMouseDown={(e) => e.preventDefault()} // Previene perdita focus input su click
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Livello Sfondo */}
      <div
        className="board-background-layer"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
        aria-hidden="true"
      >
        <img
          src={backgroundImageUrl}
          alt=""
          style={{ display: "none" }}
          onError={(e) => {
            console.warn("Errore caricamento sfondo:", backgroundImageUrl);
            // Potresti voler impostare uno sfondo di fallback qui se l'immagine non carica
            // e.target.parentElement.style.backgroundImage = `url(/images/${DEFAULT_BOARD_UI_BACKGROUND})`;
          }}
        />
      </div>

      {/* Modale Conferma Delete */}
      {showConfirmDelete && (
        <ConfirmDeleteProductModal
          show={showConfirmDelete}
          handleClose={() => {
            setShowConfirmDelete(false);
            setProductIndexToDelete(null);
          }}
          productName={
            productIndexToDelete !== null && items[productIndexToDelete]
              ? items[productIndexToDelete].name
              : "questo elemento"
          }
          onConfirm={executeDelete}
        />
      )}
    </div>
  );
};

export default Board;
