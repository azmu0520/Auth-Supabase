// src/components/OTPInput.tsx
import React, { useRef, type KeyboardEvent, type ClipboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: OTPInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (index: number, newValue: string) => {
    if (disabled) return;

    // Only allow digits
    const digit = newValue.replace(/[^0-9]/g, "");
    if (digit.length > 1) return;

    // Update the value at the specific index
    const newCode = value.split("");
    newCode[index] = digit;
    const newCodeString = newCode.join("");

    onChange(newCodeString);

    // Auto-focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Trigger onComplete when all digits entered
    if (newCodeString.replace(/ /g, "").length === length && onComplete) {
      onComplete(newCodeString);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    // Handle backspace - move to previous input if current is empty
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys for navigation
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/[^0-9]/g, "")
      .slice(0, length);

    onChange(pasteData.padEnd(length, " "));

    // Focus the last filled input or the next empty one
    const nextEmptyIndex = Math.min(pasteData.length, length - 1);
    inputRefs.current[nextEmptyIndex]?.focus();

    // Trigger onComplete if all digits pasted
    if (pasteData.length === length && onComplete) {
      onComplete(pasteData);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select the input content on focus for easier replacement
    e.target.select();
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={handleFocus}
          disabled={disabled}
          className={`
            w-12 h-14 text-center text-2xl font-bold 
            border-2 rounded-lg 
            focus:outline-none focus:ring-2 focus:ring-offset-2
            transition-all duration-200
            ${
              error
                ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500"
                : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            }
            ${
              disabled
                ? "bg-gray-100 cursor-not-allowed opacity-50"
                : "bg-white"
            }
            ${value[index] ? "border-blue-500" : ""}
          `}
          aria-label={`Digit ${index + 1} of ${length}`}
          autoComplete="off"
        />
      ))}
    </div>
  );
}
