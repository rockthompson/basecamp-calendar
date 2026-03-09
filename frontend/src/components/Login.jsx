import React from "react";
import { loginUrl } from "../api";

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Basecamp Calendar</h1>
        <p>View your communication to-dos across all projects in one calendar.</p>
        <a href={loginUrl()} className="btn btn-primary">
          Sign in with Basecamp
        </a>
      </div>
    </div>
  );
}
