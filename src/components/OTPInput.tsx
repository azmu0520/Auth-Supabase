import React, {
  useRef,
  useState,
  type KeyboardEvent,
  type ClipboardEvent,
} from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  const handleChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, "");

    if (digit.length === 0) {
      // Handle deletion
      const newValue = value.slice(0, index) + value.slice(index + 1);
      onChange(newValue);
      return;
    }

    // Handle single digit input
    const newValue = value.slice(0, index) + digit[0] + value.slice(index + 1);
    onChange(newValue);

    // Move to next input
    if (index < length - 1 && digit.length > 0) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if complete
    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();

      if (value[index]) {
        // Delete current digit
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      } else if (index > 0) {
        // Move to previous input and delete
        const newValue = value.slice(0, index - 1) + value.slice(index);
        onChange(newValue);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    const newValue = pastedData.slice(0, length);
    onChange(newValue);

    // Focus last filled input or last input
    const focusIndex = Math.min(newValue.length, length - 1);
    inputRefs.current[focusIndex]?.focus();

    // Check if complete
    if (newValue.length === length && onComplete) {
      onComplete(newValue);
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[index] || ""}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex(null)}
          disabled={disabled}
          className={`
            w-12 h-14 text-center text-2xl font-semibold rounded-lg
            border-2 transition-all duration-200
            ${
              error
                ? "border-red-500 focus:border-red-600"
                : focusedIndex === index
                ? "border-indigo-600 shadow-lg shadow-indigo-500/20"
                : "border-slate-300 dark:border-slate-600"
            }
            ${
              disabled
                ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed opacity-50"
                : "bg-white dark:bg-slate-900"
            }
            focus:outline-none focus:ring-2 focus:ring-indigo-500/20
            hover:border-slate-400 dark:hover:border-slate-500
            text-slate-900 dark:text-slate-100
          `}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
};
