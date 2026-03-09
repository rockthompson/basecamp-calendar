import React from "react";
import { loginUrl } from "../api";

export default function Login() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <line x1="9" y1="14" x2="9" y2="14.01" />
            <line x1="13" y1="14" x2="13" y2="14.01" />
            <line x1="9" y1="18" x2="9" y2="18.01" />
          </svg>
        </div>
        <h1>Basecamp Calendar</h1>
        <p>
          All your communication to-dos across every project, in one clean
          calendar view.
        </p>
        <a href={loginUrl()} className="btn btn-primary">
          Sign in with Basecamp
        </a>
      </div>
    </div>
  );
}
