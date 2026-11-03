import React from "react"
import ReactDOM from "react-dom/client"
import App from "./app/App"
import "./index.css"
// Admin design system — must load after index.css so it wins the cascade.
import "./admin/admin-shell.css"
import "./admin/pages/programs/programs.css"
import "./admin/pages/dashboard/dashboard.css"

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
