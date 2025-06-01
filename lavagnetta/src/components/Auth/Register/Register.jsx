// src/components/Auth/Register/Register.jsx
import React, { useState } from "react"; // Rimosso useEffect non usato
import { Link, useNavigate } from "react-router-dom";
import "./Register.css"; // Assicurati che il percorso sia corretto
import authService from "../../../services/authService"; // Assicurati che il percorso sia corretto
import { Spinner, Alert } from "react-bootstrap"; // Spinner ora è usato
import InstallPrompt from "../../InstallPrompt/InstallPrompt"; // Assicurati che il percorso sia corretto

// Regex definite (come nel backend e validazione precedente)
const uppercaseRegex = /[A-Z]/;
const lowercaseRegex = /[a-z]/;
const digitRegex = /\d/g; // 'g' per contare tutte le occorrenze
const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/; // PERSONALIZZA QUESTO SET (uguale al backend)
const specialCharsAllowed = '!@#$%^&*(),.?":{}|<>'; // Stringa per messaggio errore (uguale al backend)

// Stato iniziale per la validità dei requisiti password
const initialPasswordValidity = {
  length: false,
  uppercase: false,
  lowercase: false,
  digits: false,
  special: false,
};

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    username: "",
    email: "",
    // Non mostriamo più l'errore specifico password qui, ma dalla lista
    confirmPassword: "",
    general: "",
  });
  const [passwordValidity, setPasswordValidity] = useState(
    initialPasswordValidity
  );
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Funzione per validare la password in tempo reale
  const validatePasswordRealtime = (password) => {
    const digitCount = (password.match(digitRegex) || []).length;
    setPasswordValidity({
      length: password.length >= 8,
      uppercase: uppercaseRegex.test(password),
      lowercase: lowercaseRegex.test(password),
      digits: digitCount >= 3,
      special: specialCharRegex.test(password),
    });
  };

  // Mostra i requisiti quando si entra nel campo password
  const handlePasswordFocus = () => {
    setShowPasswordRequirements(true);
  };

  // Gestisce i cambiamenti negli input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "password") {
      validatePasswordRealtime(value);
      if (value.length > 0 && !showPasswordRequirements) {
        // Mostra se si inizia a digitare
        setShowPasswordRequirements(true);
      }
    }
    // Resetta errori specifici e generale
    setErrors((prev) => ({ ...prev, [name]: "", general: "" }));
  };

  // Validazione chiamata prima del submit
  const validateOnSubmit = () => {
    let valid = true;
    let newErrors = {
      username: "",
      email: "",
      confirmPassword: "",
      general: "",
    };

    if (!formData.username.trim()) {
      newErrors.username = "Il nome utente è obbligatorio.";
      valid = false;
    }
    if (!formData.email) {
      newErrors.email = "L'indirizzo email è obbligatorio.";
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Inserisci un indirizzo email valido.";
      valid = false;
    }

    const allPasswordReqsMet = Object.values(passwordValidity).every(Boolean);
    if (!allPasswordReqsMet) {
      valid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Conferma la password.";
      valid = false;
    } else if (
      allPasswordReqsMet &&
      formData.password !== formData.confirmPassword
    ) {
      newErrors.confirmPassword = "Le password non corrispondono.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Gestione del submit del form
  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = validateOnSubmit();
    if (!isValid) {
      // Se la validazione fallisce, assicurati che i requisiti password siano visibili
      if (!Object.values(passwordValidity).every(Boolean)) {
        setShowPasswordRequirements(true);
      }
      return;
    }

    setIsLoading(true);
    setErrors({
      // Resetta tutti gli errori
      username: "",
      email: "",
      confirmPassword: "",
      general: "",
    });

    try {
      await authService.register(
        formData.email,
        formData.password,
        formData.username
      );
      navigate("/auth/login?registered=true");
    } catch (error) {
      const apiError =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        "Errore durante la registrazione. Riprova.";
      setErrors((prev) => ({ ...prev, general: apiError }));
    } finally {
      setIsLoading(false);
    }
  };

  // Funzioni per mostrare/nascondere password
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const toggleConfirmPasswordVisibility = () =>
    setShowConfirmPassword((prev) => !prev);

  // JSX del componente
  return (
    <div className="auth-container">
      <div className="card shadow-lg" id="auth-card">
        <h2 className="mb-4">Crea il tuo account</h2>

        <form onSubmit={handleSubmit} noValidate>
          {errors.general && (
            <Alert variant="danger" className="error-message mb-3">
              {errors.general}
            </Alert>
          )}

          {/* Campo Nome Utente */}
          <div className="form-group mb-3">
            <label htmlFor="registerUsername" className="form-label">
              Nome Utente
            </label>
            <div className="input-group">
              <span className="input-group-text icon-left">
                <i className="bi bi-person"></i>
              </span>
              <input
                type="text"
                id="registerUsername"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-control ${errors.username ? "is-invalid" : ""}`}
                placeholder="Scegli un nome utente"
                required
                autoFocus
                aria-label="Nome Utente"
                aria-invalid={!!errors.username}
                aria-describedby="usernameError"
              />
            </div>
            {errors.username && (
              <div id="usernameError" className="text-danger">
                {errors.username}
              </div>
            )}
          </div>

          {/* Campo Email */}
          <div className="form-group mb-3">
            <label htmlFor="registerEmail" className="form-label">
              Email
            </label>
            <div className="input-group">
              <span className="input-group-text icon-left">
                <i className="bi bi-envelope"></i>
              </span>
              <input
                type="email"
                id="registerEmail"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                placeholder="iltuoindirizzo@email.com"
                required
                aria-label="Email"
                aria-invalid={!!errors.email}
                aria-describedby="emailErrorReg"
              />
            </div>
            {errors.email && (
              <div id="emailErrorReg" className="text-danger">
                {errors.email}
              </div>
            )}
          </div>

          {/* Campo Password */}
          <div className="form-group mb-2">
            <label htmlFor="registerPassword" className="form-label">
              Password
            </label>
            <div className="input-group">
              <span className="input-group-text icon-left">
                <i className="bi bi-lock"></i>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                id="registerPassword"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={handlePasswordFocus}
                className={`form-control`} // Rimosso is-invalid qui
                placeholder="Crea una password sicura"
                required
                aria-label="Password"
                aria-describedby="password-requirements"
              />
              <span
                className="input-group-text toggle-password"
                onClick={togglePasswordVisibility}
                role="button"
                tabIndex={0}
                aria-label={
                  showPassword ? "Nascondi password" : "Mostra password"
                }
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </span>
            </div>
          </div>

          {/* Lista Requisiti Password */}
          {showPasswordRequirements && (
            <div
              id="password-requirements"
              className="password-requirements mb-3"
            >
              <ul>
                <li className={passwordValidity.length ? "valid" : "invalid"}>
                  Almeno 8 caratteri
                </li>
                <li
                  className={passwordValidity.uppercase ? "valid" : "invalid"}
                >
                  Almeno 1 lettera maiuscola (A-Z)
                </li>
                <li
                  className={passwordValidity.lowercase ? "valid" : "invalid"}
                >
                  Almeno 1 lettera minuscola (a-z)
                </li>
                <li className={passwordValidity.digits ? "valid" : "invalid"}>
                  Almeno 3 numeri (0-9)
                </li>
                <li className={passwordValidity.special ? "valid" : "invalid"}>
                  Almeno 1 carattere speciale ({specialCharsAllowed})
                </li>
              </ul>
            </div>
          )}

          {/* Campo Conferma Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              Conferma Password
            </label>
            <div className="input-group">
              <span className="input-group-text icon-left">
                <i className="bi bi-check2-circle"></i>
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                placeholder="Reinserisci la password"
                required
                aria-label="Conferma Password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby="confirmPasswordError"
              />
              <span
                className="input-group-text toggle-password"
                onClick={toggleConfirmPasswordVisibility}
                role="button"
                tabIndex={0}
                aria-label={
                  showConfirmPassword
                    ? "Nascondi password di conferma"
                    : "Mostra password di conferma"
                }
              >
                <i
                  className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </span>
            </div>
            {errors.confirmPassword && (
              <div id="confirmPasswordError" className="text-danger">
                {errors.confirmPassword}
              </div>
            )}
          </div>

          {/* Bottone Registrazione */}
          <button
            type="submit"
            className="btn btn-warning w-100 mt-3"
            disabled={isLoading}
          >
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
                Registrazione...
              </>
            ) : (
              "Registrati"
            )}
          </button>
        </form>

        <InstallPrompt />

        <p className="bottom-text">
          Hai già un account? <Link to="/auth/login">Accedi</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
