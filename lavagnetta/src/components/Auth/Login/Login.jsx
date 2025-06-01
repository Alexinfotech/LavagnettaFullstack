// src/components/Auth/Login/Login.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css"; // Assicurati che il percorso sia corretto
import authService from "../../../services/authService"; // Assicurati che il percorso sia corretto
import { Spinner, Alert } from "react-bootstrap";
import InstallPrompt from "../../InstallPrompt/InstallPrompt"; // Assicurati che il percorso sia corretto

const Login = ({ setAuthenticated }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    general: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  // Validazione frontend per il login (semplice)
  const validate = () => {
    let valid = true;
    let newErrors = { email: "", password: "", general: "" };
    if (!formData.email) {
      newErrors.email = "L'indirizzo email è obbligatorio.";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Inserisci un indirizzo email valido.";
      valid = false;
    }
    if (!formData.password) {
      newErrors.password = "La password è obbligatoria.";
      valid = false;
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({ email: "", password: "", general: "" }); // Resetta errori

    try {
      const response = await authService.login(
        formData.email,
        formData.password
      );
      // Assumendo che authService.login restituisca { token: '...' } in caso di successo
      // o lanci un errore in caso di fallimento
      if (response.token) {
        setAuthenticated(true); // Aggiorna lo stato di autenticazione nell'app principale
        navigate("/dashboard"); // O dove vuoi reindirizzare dopo il login
      } else {
        // Caso imprevisto in cui la chiamata API ha successo ma non c'è token
        console.warn("Login API success but no token received.");
        setErrors((prev) => ({
          ...prev,
          general: "Errore di login imprevisto.",
        }));
      }
    } catch (error) {
      // Estrae il messaggio di errore più specifico possibile dalla risposta API
      const apiError =
        error.response?.data?.message || // Messaggio personalizzato dal backend
        error.response?.data?.errors?.[0]?.msg || // Errore da express-validator (meno probabile qui)
        error.response?.data?.error || // Campo errore generico
        (error.response?.status === 401 // Errore specifico per credenziali errate
          ? "Credenziali non valide."
          : "Errore durante il login. Riprova."); // Fallback generico

      setErrors((prev) => ({ ...prev, general: apiError }));
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  return (
    <div className="auth-container">
      <div className="card shadow-lg" id="auth-card">
        <h2 className="mb-4">Accedi</h2>

        <form onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <Alert variant="danger" className="error-message mb-3">
              {errors.general}
            </Alert>
          )}

          {/* Campo Email */}
          <div className="form-group mb-3">
            {/* ... (contenuto invariato) ... */}
            <label htmlFor="loginEmail" className="form-label">
              Email
            </label>
            <div className="input-group">
              <span className="input-group-text icon-left">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                id="loginEmail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                placeholder="iltuoindirizzo@email.com"
                required
                autoFocus
                aria-label="Email"
                aria-invalid={!!errors.email}
                aria-describedby="emailError"
              />
            </div>
            {errors.email && (
              <div id="emailError" className="text-danger">
                {errors.email}
              </div>
            )}
          </div>

          {/* Campo Password */}
          <div className="form-group">
            {/* ... (contenuto invariato) ... */}
            <label htmlFor="loginPassword" className="form-label">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text icon-left">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="loginPassword"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-control ${errors.password ? "is-invalid" : ""}`}
                placeholder="La tua password"
                required
                aria-label="Password"
                aria-invalid={!!errors.password}
                aria-describedby="passwordError"
              />
              <span
                className="input-group-text toggle-password"
                onClick={togglePasswordVisibility}
                role="button"
                tabIndex={0}
                onKeyPress={(e) =>
                  e.key === "Enter" && togglePasswordVisibility()
                }
                aria-label={
                  showPassword ? "Nascondi password" : "Mostra password"
                }
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </span>
            </div>
            {errors.password && (
              <div id="passwordError" className="text-danger">
                {errors.password}
              </div>
            )}
          </div>

          {/* Bottone di Accesso */}
          <button
            type="submit"
            className="btn btn-warning w-100 mt-3"
            disabled={isLoading}
          >
            {/* ... (contenuto loading/testo invariato) ... */}
            {isLoading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Accesso...
              </>
            ) : (
              "Accedi"
            )}
          </button>
        </form>

        <InstallPrompt />

        {/* Link Registrazione */}
        <p className="bottom-text">
          Non hai un account?
          <Link to="/auth/register">Registrati</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
