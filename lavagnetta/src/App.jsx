/* ==== src/App.jsx (v20 - Scroll Condizionale Corretto) ==== */
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useSwipeable } from "react-swipeable";
import {
  Modal,
  Button,
  Form,
  Spinner as BootstrapSpinner,
} from "react-bootstrap";
import Login from "./components/Auth/Login/Login";
import Register from "./components/Auth/Register/Register";
import Dashboard from "./components/Dashboard/Dashboard";
import Board from "./components/Board/Board";
import PersonalBoardSubHeader from "./components/Header/PersonalBoardSubHeader";
import GroupDashboard from "./components/GroupDashboard/GroupDashboard";
import GroupDetail from "./components/GroupDashboard/GroupDetail/GroupDetail";
import GroupBoardView from "./components/GroupDashboard/GroupDetail/GroupBoardView";
import MainHeader from "./components/MainHeader/MainHeader";
import PrivateRoute from "./components/PrivateRoute/PrivateRoute";
import { GroupProvider } from "./contexts/GroupContext";
import { LayoutProvider, useLayout } from "./contexts/LayoutContext";
import LoadingSpinner from "./components/LoadingSpinner/LoadingSpinner";
import { ToastContainer, toast } from "react-toastify";
import authService from "./services/authService";
import api from "./services/api";
import { FaPlus } from "react-icons/fa";
import StatisticsPage from "./components/Statistics/StatisticsPage";
import { addItem as addItemAction } from "./components/Board/actions/addItem";

import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// --- Layout Globale Protetto ---
const ProtectedLayout = ({ children }) => {
  const { showSubHeader } = useLayout();
  const location = useLocation(); // Usa hook per ottenere il percorso

  // --- MODIFICA: Logica per Scroll Condizionale ---
  // Definisci i percorsi che devono avere lo scroll interno
  const scrollableRoutes = ["/dashboard", "/statistics"];
  // Controlla se il percorso attuale è uno di quelli
  const isScrollableRoute = scrollableRoutes.includes(location.pathname);
  // Determina la classe CSS da applicare al wrapper
  const contentWrapperClass = isScrollableRoute
    ? "content-wrapper scrollable-content" // Applica stile scroll
    : "content-wrapper fixed-content"; // Applica stile fisso (no scroll)
  // --- FINE MODIFICA ---

  return (
    <div className="protected-layout">
      {/* Header Principale (passa showSubHeader) */}
      <MainHeader onHeaderClick={showSubHeader} />
      {/* Contenuto Principale */}
      <main className="main-content">
        {/* Applica la classe calcolata al wrapper del contenuto */}
        <div className={contentWrapperClass}>{children}</div>
      </main>
    </div>
  );
};

// --- Layout Specifico per la Board Personale ---
const PersonalBoardLayout = ({
  selectedBoard,
  setSelectedBoard,
  boards,
  setBoards,
  loadingBoards,
  authStatus,
  fetchPersonalBoards,
}) => {
  // ... (Logica interna di PersonalBoardLayout resta INVARIATA) ...
  const { isSubHeaderHidden, hideSubHeader, showSubHeader } = useLayout();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemNameModal, setNewItemNameModal] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);
  const modalInputRef = useRef(null);

  const handleShowAddModal = useCallback(() => setShowAddModal(true), []);
  const handleCloseAddModal = useCallback(() => {
    setShowAddModal(false);
    setNewItemNameModal("");
    setIsAddingItem(false);
  }, []);
  const handleModalInputChange = useCallback(
    (e) => setNewItemNameModal(e.target.value),
    []
  );

  const handleModalAddItem = useCallback(
    async (event) => {
      event.preventDefault();
      const trimmedName = newItemNameModal.trim();
      if (!selectedBoard || !trimmedName || !fetchPersonalBoards) return;
      setIsAddingItem(true);
      try {
        // Assumiamo che addItemAction ora gestisca l'aggiornamento dello stato o restituisca dati
        await addItemAction(
          trimmedName,
          null, // categoria rimossa?
          null, // onSuccess callback rimossa?
          setNewItemNameModal, // per reset input
          selectedBoard,
          null, // listId
          fetchPersonalBoards // callback per refresh dati
        );
        // Non serve più aggiornare 'items' localmente se fetchPersonalBoards lo fa
        handleCloseAddModal();
      } catch (error) {
        console.error("Errore addItemAction (Modal):", error);
        // Potresti voler mostrare un toast di errore qui
        toast.error("Errore durante l'aggiunta del prodotto.");
      } finally {
        setIsAddingItem(false); // Resetta sempre il loading
      }
    },
    [
      newItemNameModal,
      selectedBoard,
      fetchPersonalBoards,
      handleCloseAddModal,
      addItemAction,
    ] // Aggiunta addItemAction alle dipendenze
  );

  useEffect(() => {
    if (showAddModal && modalInputRef.current) {
      setTimeout(() => modalInputRef.current.focus(), 100);
    }
  }, [showAddModal]);

  const currentBoardIndex = useMemo(() => {
    if (!selectedBoard || !Array.isArray(boards) || boards.length === 0)
      return -1;
    return boards.findIndex((b) => String(b.id) === String(selectedBoard.id));
  }, [selectedBoard, boards]);

  const selectBoardByIndex = useCallback(
    (index) => {
      if (Array.isArray(boards) && index >= 0 && index < boards.length) {
        const boardToSelect = boards[index];
        if (String(selectedBoard?.id) !== String(boardToSelect.id)) {
          setSelectedBoard(boardToSelect);
        }
      }
    },
    [boards, setSelectedBoard, selectedBoard?.id]
  );

  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (currentBoardIndex !== -1 && currentBoardIndex < boards.length - 1) {
        selectBoardByIndex(currentBoardIndex + 1);
      }
    },
    onSwipedRight: () => {
      if (currentBoardIndex > 0) {
        selectBoardByIndex(currentBoardIndex - 1);
      }
    },
    preventScrollOnSwipe: true,
    trackMouse: true,
    delta: 70,
  });

  return (
    <div {...handlers} className="personal-board-layout">
      {/* SubHeader visibile solo se autenticato, non loading e ci sono board */}
      {authStatus && !loadingBoards && boards && boards.length > 0 && (
        <div
          className={`sub-header-wrapper ${isSubHeaderHidden ? "sub-header--hidden" : ""}`}
        >
          <PersonalBoardSubHeader
            selectedBoard={selectedBoard}
            setSelectedBoard={setSelectedBoard}
            boards={boards}
            setBoards={setBoards}
            fetchPersonalBoards={fetchPersonalBoards}
          />
        </div>
      )}
      {/* Contenuto Board */}
      <div className="board-content-area">
        {loadingBoards ? (
          <div className="board-placeholder-loading text-center p-5">
            <LoadingSpinner />
            <p className="mt-3 text-muted font-secondary">
              Caricamento lavagne...
            </p>
          </div>
        ) : selectedBoard ? (
          <Board
            key={selectedBoard.id}
            selectedBoard={selectedBoard}
            hideSubHeader={hideSubHeader}
            showSubHeader={showSubHeader}
            onDataRefreshNeeded={fetchPersonalBoards} // Passa callback per refresh
          />
        ) : boards && boards.length > 0 ? (
          <div className="board-placeholder-select text-center p-4">
            <p className="lead text-muted font-secondary">
              Seleziona una lavagna dal menu in alto.
            </p>
          </div>
        ) : (
          <div className="board-placeholder-empty text-center p-4">
            <p className="lead text-muted font-secondary">
              Non hai ancora lavagne personali. Creane una usando il pulsante{" "}
              <FaPlus style={{ verticalAlign: "middle" }} /> nel menu in alto.
            </p>
          </div>
        )}
      </div>
      {/* FAB per aggiungere prodotto */}
      {authStatus && !loadingBoards && selectedBoard && (
        <button
          className="fab-add-button"
          onClick={handleShowAddModal}
          title="Aggiungi Prodotto"
          aria-label="Aggiungi Prodotto"
        >
          <FaPlus />
        </button>
      )}
      {/* Modale Aggiunta Prodotto */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="font-primary text-accent">
            Aggiungi Prodotto
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleModalAddItem}>
          <Modal.Body>
            <Form.Group controlId="newItemNameModalPersonal">
              <Form.Label visuallyHidden>Nome Prodotto</Form.Label>
              <Form.Control
                ref={modalInputRef}
                type="text"
                className="font-secondary"
                placeholder="Nome del prodotto..."
                value={newItemNameModal}
                onChange={handleModalInputChange}
                required
                autoComplete="off"
              />
              <Form.Control.Feedback type="invalid">
                Obbligatorio.
              </Form.Control.Feedback>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={handleCloseAddModal}
              disabled={isAddingItem}
            >
              Annulla
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={isAddingItem || !newItemNameModal.trim()}
            >
              {isAddingItem ? (
                <BootstrapSpinner size="sm" className="me-1" />
              ) : null}{" "}
              Aggiungi
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

// --- Componente Wrapper AppContent ---
const AppContent = () => {
  const [authStatus, setAuthStatus] = useState(authService.isLoggedIn());
  const [selectedBoard, _setSelectedBoard] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const currentSelectedBoardRef = useRef(null);

  useEffect(() => {
    currentSelectedBoardRef.current = selectedBoard;
  }, [selectedBoard]);

  const handleSetSelectedBoard = useCallback((board) => {
    // console.log("[handleSetSelectedBoard] Setting board:", board ? { id: board.id, name: board.name, userBackground: board.userBackground, products_count: board.products?.length } : null);
    _setSelectedBoard(board);
    if (board && !board.groupId) {
      // Salva solo se personale
      localStorage.setItem("selectedBoard", JSON.stringify(board));
    } else {
      localStorage.removeItem("selectedBoard");
    }
  }, []);

  // Funzione fetch lavagne personali (potrebbe includere logica per userBackground)
  const fetchPersonalBoards = useCallback(async () => {
    if (!authStatus) {
      handleSetSelectedBoard(null);
      setBoards([]);
      setLoadingBoards(false);
      return;
    }
    setLoadingBoards(true); // Imposta loading prima del fetch
    try {
      // console.log("[fetchPersonalBoards] Fetching personal boards...");
      const response = await api.get("/auth/boards/personal");
      let fetchedBoards = response.data || [];
      fetchedBoards.sort((a, b) => /* ... logica sort ... */ {
        if (
          (a.is_default === 1 || a.is_default === true) &&
          !(b.is_default === 1 || b.is_default === true)
        )
          return -1;
        if (
          !(a.is_default === 1 || a.is_default === true) &&
          (b.is_default === 1 || b.is_default === true)
        )
          return 1;
        return (a.name || "").localeCompare(b.name || "");
      });

      // Applica userBackground simulato da localStorage (TESTING)
      const testUserId = authService.getCurrentUserId
        ? authService.getCurrentUserId()
        : null;
      if (testUserId) {
        fetchedBoards = fetchedBoards.map((board) => {
          const storageKey = `test_user_${testUserId}_board_${board.id}_bg`;
          const simulatedUserBg = localStorage.getItem(storageKey);
          return {
            ...board,
            userBackground: simulatedUserBg || board.userBackground,
          };
        });
      }
      // Fine TEST

      setBoards(fetchedBoards); // Aggiorna stato

      // Logica per ripristinare/aggiornare la selezione
      const previouslySelectedBoardId = currentSelectedBoardRef.current?.id;
      if (previouslySelectedBoardId) {
        const updatedBoardData = fetchedBoards.find(
          (b) => String(b.id) === String(previouslySelectedBoardId)
        );
        if (
          updatedBoardData &&
          JSON.stringify(currentSelectedBoardRef.current) !==
            JSON.stringify(updatedBoardData)
        ) {
          // console.log(`[fetchPersonalBoards] Found previous board ${previouslySelectedBoardId} and data changed. Updating.`);
          handleSetSelectedBoard(updatedBoardData);
        } else if (!updatedBoardData) {
          // console.log(`[fetchPersonalBoards] Previous board ${previouslySelectedBoardId} not found.`);
          handleSetSelectedBoard(null); // Resetta se non trovata
        }
      } else if (fetchedBoards.length > 0 && !currentSelectedBoardRef.current) {
        // console.log("[fetchPersonalBoards] No previous selection, selection useEffect will handle.");
        // Lascia che l'altro useEffect scelga la default/prima
      } else if (fetchedBoards.length === 0) {
        // console.log("[fetchPersonalBoards] No boards fetched.");
        handleSetSelectedBoard(null); // Nessuna board da selezionare
      }
    } catch (error) {
      console.error("Errore fetch lavagne personali:", error);
      toast.error("Impossibile caricare le lavagne personali.");
      setBoards([]); // Pulisci in caso di errore
      handleSetSelectedBoard(null);
    } finally {
      setLoadingBoards(false); // Togli loading alla fine
    }
  }, [authStatus, handleSetSelectedBoard]); // Dipende da authStatus e handleSetSelectedBoard

  // Effetto per il fetch iniziale
  useEffect(() => {
    // console.log("[useEffect auth/mount] Triggering initial fetch.");
    fetchPersonalBoards();
  }, [fetchPersonalBoards]); // Ora dipende solo da fetchPersonalBoards (che dipende da authStatus)

  // Effetto per la selezione iniziale/cambio board
  useEffect(() => {
    if (!loadingBoards && authStatus && Array.isArray(boards)) {
      const currentSelectedId = selectedBoard?.id;
      // console.log(`[Selection useEffect] Running. Current: ${currentSelectedId}. Boards: ${boards.length}`);
      let boardToSelect = null;
      const idFromLocation = location.state?.selectedId;
      const storedBoardJson = localStorage.getItem("selectedBoard");

      if (idFromLocation && location.pathname === "/board") {
        boardToSelect = boards.find(
          (b) => String(b.id) === String(idFromLocation)
        );
        if (boardToSelect)
          navigate(location.pathname, {
            state: { ...location.state, selectedId: null },
            replace: true,
          });
      }
      if (!boardToSelect && storedBoardJson) {
        try {
          const parsed = JSON.parse(storedBoardJson);
          if (
            parsed?.id &&
            !parsed.groupId &&
            boards.some((b) => String(b.id) === String(parsed.id))
          ) {
            boardToSelect = boards.find(
              (b) => String(b.id) === String(parsed.id)
            );
          } else {
            localStorage.removeItem("selectedBoard");
          }
        } catch (e) {
          localStorage.removeItem("selectedBoard");
        }
      }
      if (!boardToSelect && boards.length > 0) {
        boardToSelect =
          boards.find((b) => b.is_default === 1 || b.is_default === true) ||
          boards[0];
      }
      if (!boardToSelect && boards.length === 0) {
        boardToSelect = null;
      }

      if (String(currentSelectedId) !== String(boardToSelect?.id)) {
        // console.log(`[Selection useEffect] Selecting board ID ${boardToSelect?.id}`);
        handleSetSelectedBoard(boardToSelect);
      }
    } else if (!authStatus && selectedBoard !== null) {
      // console.log("[Selection useEffect] Not auth, clearing selected board.");
      handleSetSelectedBoard(null);
    }
  }, [
    authStatus,
    loadingBoards,
    boards,
    location.pathname,
    location.state,
    handleSetSelectedBoard,
    navigate,
    selectedBoard,
  ]); // Aggiunta dipendenza selectedBoard per ri-valutare

  return (
    <LayoutProvider>
      <GroupProvider>
        <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
        <Routes>
          {/* Rotte Pubbliche */}
          <Route
            path="/auth/login"
            element={
              !authStatus ? (
                <Login setAuthenticated={setAuthStatus} />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route
            path="/auth/register"
            element={
              !authStatus ? <Register /> : <Navigate to="/dashboard" replace />
            }
          />
          {/* Rotte Protette */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/board"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <PersonalBoardLayout
                    selectedBoard={selectedBoard}
                    setSelectedBoard={handleSetSelectedBoard}
                    boards={boards}
                    setBoards={setBoards} // Passa setBoards se PersonalBoardSubHeader la usa per add/delete
                    loadingBoards={loadingBoards}
                    authStatus={authStatus}
                    fetchPersonalBoards={fetchPersonalBoards} // Passa la funzione di refresh
                  />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/groups-dashboard"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <GroupDashboard />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/groups/:groupId"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <GroupDetail />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/groups/:groupId/boards/:boardId"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <GroupBoardView />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/statistics"
            element={
              <PrivateRoute>
                <ProtectedLayout>
                  <StatisticsPage />
                </ProtectedLayout>
              </PrivateRoute>
            }
          />{" "}
          {/* Rotta Statistiche */}
          {/* Redirect e Fallback */}
          <Route
            path="/"
            element={
              <Navigate
                to={authStatus ? "/dashboard" : "/auth/login"}
                replace
              />
            }
          />
          <Route
            path="*"
            element={
              <div style={{ padding: "40px", textAlign: "center" }}>
                <h1 className="font-primary text-accent">404</h1>
                <p>Pagina Non Trovata</p>
                <Link to="/">Home</Link>
              </div>
            }
          />
        </Routes>
      </GroupProvider>
    </LayoutProvider>
  );
};

// App principale
const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};
export default App;
