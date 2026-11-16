import {
  hasErrors,
  isDateAfter,
  isEmail,
  isValidCountry,
  isValidCurrency,
  isValidLogo,
  isValidName,
  isValidPhone,
  isValidSlug,
  isStrongPassword,
  validateEmailField,
  validateNameField,
  validateNewPasswordField,
  validatePasswordField,
  validatePhoneField,
} from "./validation";

describe("email validation", () => {
  it.each([
    "guest@example.com",
    "first.last+tag@sub.example.co",
    "  trimmed@example.com  ",
  ])("accepts %s", (value) => {
    expect(isEmail(value)).toBe(true);
    expect(validateEmailField(value)).toBeNull();
  });

  it.each(["", "   ", "not-an-email", "missing@domain", "@example.com", "a b@example.com"])(
    "rejects %s",
    (value) => {
      expect(isEmail(value)).toBe(false);
      expect(validateEmailField(value)).toBe(value.trim() ? "err_email_invalid" : "err_required");
    },
  );
});

describe("password validation", () => {
  it("requires 10 characters, letters and digits", () => {
    expect(isStrongPassword("Abcdef1234")).toBe(true);
    expect(isStrongPassword("Abcdefghij")).toBe(false);
    expect(isStrongPassword("1234567890")).toBe(false);
    expect(isStrongPassword("Abc123")).toBe(false);
  });

  it("returns the right error key", () => {
    expect(validateNewPasswordField("")).toBe("err_required");
    expect(validateNewPasswordField("weakpass")).toBe("err_password_rule");
    expect(validateNewPasswordField("StrongPass1")).toBeNull();
    expect(validatePasswordField("anything")).toBeNull();
  });
});

describe("phone validation", () => {
  it.each(["+221 77 123 45 67", "0771234567", "(221) 77-123-45-67"])(
    "accepts %s",
    (value) => {
      expect(isValidPhone(value)).toBe(true);
      expect(validatePhoneField(value)).toBeNull();
    },
  );

  it.each(["", "123", "phone", "++221", "1234567890123456"])(
    "rejects %s",
    (value) => {
      expect(isValidPhone(value)).toBe(false);
      expect(validatePhoneField(value)).toBe(value.trim() ? "err_phone_invalid" : "err_required");
    },
  );
});

describe("name validation", () => {
  it("requires at least two characters", () => {
    expect(isValidName("Awa")).toBe(true);
    expect(isValidName(" A ")).toBe(false);
    expect(validateNameField("")).toBe("err_required");
    expect(validateNameField("A")).toBe("err_required");
  });
});

describe("hotel fields validation", () => {
  it("validates slugs", () => {
    expect(isValidSlug("sunuhotel-dakar")).toBe(true);
    expect(isValidSlug("Hotel_Dakar")).toBe(false);
    expect(isValidSlug("-leading")).toBe(false);
    expect(isValidSlug("trailing-")).toBe(false);
  });

  it("validates country and currency codes", () => {
    expect(isValidCountry("SN")).toBe(true);
    expect(isValidCountry("sn")).toBe(true);
    expect(isValidCountry("SEN")).toBe(false);
    expect(isValidCurrency("XOF")).toBe(true);
    expect(isValidCurrency("xo")).toBe(false);
  });
});

describe("date and logo validation", () => {
  it("requires a strictly later check-out date", () => {
    expect(isDateAfter("2026-11-16", "2026-11-15")).toBe(true);
    expect(isDateAfter("2026-11-15", "2026-11-15")).toBe(false);
    expect(isDateAfter("2026-11-14", "2026-11-15")).toBe(false);
    expect(isDateAfter("", "2026-11-15")).toBe(false);
  });

  it("accepts only reasonable image files", () => {
    expect(isValidLogo({ type: "image/png", size: 1024 })).toBe(true);
    expect(isValidLogo({ type: "image/webp", size: 2 * 1024 * 1024 })).toBe(true);
    expect(isValidLogo({ type: "application/pdf", size: 1024 })).toBe(false);
    expect(isValidLogo({ type: "image/png", size: 0 })).toBe(false);
    expect(isValidLogo({ type: "image/png", size: 3 * 1024 * 1024 })).toBe(false);
  });
});

describe("hasErrors", () => {
  it("detects any truthy field error", () => {
    expect(hasErrors({})).toBe(false);
    expect(hasErrors({ email: undefined })).toBe(false);
    expect(hasErrors({ email: "err_email_invalid" })).toBe(true);
  });
});
