import { useCallback, useState } from "react";

type RuleType =
  | { type: "required" }
  | { type: "minLength"; value: number }
  | { type: "maxLength"; value: number }
  | { type: "dosage" }
  | { type: "futureDate" }
  | { type: "positiveInteger" }
  | { type: "numericOnly"; minDigits?: number }
  | { type: "fileSize"; maxMB: number }
  | { type: "fileType"; allowedTypes: string[] }
  | { type: "custom"; validate: (value: string) => string | null };

export type ValidationRules = RuleType[];

export type FieldErrors = Record<string, string>;
export type TouchedFields = Record<string, boolean>;

function validateValue(value: string, rules: ValidationRules): string {
  for (const rule of rules) {
    switch (rule.type) {
      case "required":
        if (!value.trim()) return "This field is required";
        break;
      case "minLength":
        if (value.trim().length < rule.value)
          return `Must be at least ${rule.value} characters`;
        break;
      case "maxLength":
        if (value.trim().length > rule.value)
          return `Must be ${rule.value} characters or fewer`;
        break;
      case "dosage": {
        const dosagePattern =
          /^\d+(\.\d+)?\s*(mg|ml|g|mcg|tablet|tablets|cap|caps|unit|units|iu|patch|drop|drops|puff|puffs|spray|sprays)$/i;
        if (!dosagePattern.test(value.trim()))
          return "Enter a valid dosage (e.g. 500mg, 5ml, 1 tablet)";
        break;
      }
      case "futureDate": {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (Number.isNaN(date.getTime()) || date <= today)
          return "Expiry date must be a future date";
        break;
      }
      case "positiveInteger": {
        const num = Number(value);
        if (!Number.isInteger(num) || num < 1)
          return "Must be a positive whole number";
        break;
      }
      case "numericOnly": {
        if (!/^\d+$/.test(value.trim())) return "Must contain only digits";
        if (rule.minDigits && value.trim().length < rule.minDigits)
          return `Must be at least ${rule.minDigits} digits`;
        break;
      }
      case "custom": {
        const msg = rule.validate(value);
        if (msg) return msg;
        break;
      }
      default:
        break;
    }
  }
  return "";
}

export function useFormValidation<T extends Record<string, string>>(
  initialValues: T,
  rulesMap: Partial<Record<keyof T, ValidationRules>>,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  const validateField = useCallback(
    (name: string, value: string) => {
      const rules = rulesMap[name as keyof T];
      if (!rules) return "";
      return validateValue(value, rules);
    },
    [rulesMap],
  );

  const handleChange = useCallback(
    (name: keyof T, value: string) => {
      setValues((prev) => ({ ...prev, [name]: value }));
      if (touched[name as string]) {
        const error = validateField(name as string, value);
        setErrors((prev) => ({ ...prev, [name]: error }));
      }
    },
    [touched, validateField],
  );

  const handleBlur = useCallback(
    (name: keyof T) => {
      setTouched((prev) => ({ ...prev, [name]: true }));
      const error = validateField(name as string, values[name]);
      setErrors((prev) => ({ ...prev, [name]: error }));
    },
    [values, validateField],
  );

  const validateAll = useCallback(() => {
    const newErrors: FieldErrors = {};
    const newTouched: TouchedFields = {};
    for (const name of Object.keys(rulesMap)) {
      newTouched[name] = true;
      newErrors[name] = validateField(name, values[name as keyof T] ?? "");
    }
    setTouched(newTouched);
    setErrors(newErrors);
    return Object.values(newErrors).every((e) => !e);
  }, [values, validateField, rulesMap]);

  const isValid = Object.keys(rulesMap).every(
    (name) => !errors[name] && !!values[name as keyof T]?.trim(),
  );

  const reset = useCallback(
    (newValues?: T) => {
      setValues(newValues ?? initialValues);
      setErrors({});
      setTouched({});
    },
    [initialValues],
  );

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validateField,
    validateAll,
    reset,
    setValues,
  };
}

// Standalone file validation utility
export function validateFile(
  file: File,
  options: { maxMB?: number; allowedTypes?: string[] },
): string | null {
  if (options.maxMB && file.size > options.maxMB * 1024 * 1024) {
    return `"${file.name}" exceeds ${options.maxMB}MB limit`;
  }
  if (options.allowedTypes && options.allowedTypes.length > 0) {
    const isAllowed = options.allowedTypes.some(
      (t) =>
        file.type === t ||
        file.name
          .toLowerCase()
          .endsWith(t.replace(/^.*\//, ".").replace("image/", ".")),
    );
    if (!isAllowed) {
      return `"${file.name}" is not a supported file type (allowed: ${options.allowedTypes.join(", ")})`;
    }
  }
  return null;
}
