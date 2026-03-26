const normalizePhone = (value) => String(value || "").replace(/[^\d+]/g, "");

const maskPhone = (value) => {
  const phone = normalizePhone(value);
  if (!phone) return "";
  const visible = phone.slice(-3);
  return `${"*".repeat(Math.max(phone.length - 3, 3))}${visible}`;
};

export const sendSms = async ({ to, text }) => {
  const normalizedTo = normalizePhone(to);
  if (!normalizedTo) {
    throw new Error("Valid phone number is required for SMS");
  }

  // Placeholder provider until a real SMS gateway (e.g. Twilio) is configured.
  console.log("[SMS_FALLBACK]", { to: normalizedTo, text });

  return {
    mode: "fallback_console",
    destination: maskPhone(normalizedTo)
  };
};

export { maskPhone, normalizePhone };
