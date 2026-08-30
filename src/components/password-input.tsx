"use client";

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

type PasswordInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "className"
> & {
  className?: string;
  /** Optional label rendered above the field */
  label?: ReactNode;
};

function EyeOpenIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.75" />
    </svg>
  );
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.4A10.4 10.4 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16.6 16.6 0 0 1-3.1 3.6M6.1 6.6A16.3 16.3 0 0 0 2.5 12S6 18.5 12 18.5c1.4 0 2.7-.3 3.9-.8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M10.1 10.2a2.75 2.75 0 0 0 3.7 3.7"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * Password field with show / hide toggle (eye icon).
 */
export function PasswordInput({
  label,
  className = "",
  id,
  ...props
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const field = (
    <div className={`password-field ${className}`.trim()}>
      <input
        {...props}
        id={inputId}
        type={visible ? "text" : "password"}
        className="field-input password-field__input"
      />
      <button
        type="button"
        className="password-field__toggle"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={0}
      >
        {visible ? (
          <EyeOffIcon className="h-5 w-5" />
        ) : (
          <EyeOpenIcon className="h-5 w-5" />
        )}
      </button>
    </div>
  );

  if (!label) return field;

  return (
    <label className="block" htmlFor={inputId}>
      <span className="eyebrow mb-2 block">{label}</span>
      {field}
    </label>
  );
}
