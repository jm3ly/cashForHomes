// ====== CONFIG ======
const WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/XXXXXX/YYYYYY/"; // <-- replace with your Zapier/Make webhook
const MIN_SECONDS_ON_PAGE = 3; // basic bot friction

// ====== ELEMENTS ======
const addressForm = document.getElementById("addressForm");
const addressInput = document.getElementById("addressInput");
const addressError = document.getElementById("addressError");

const leadForm = document.getElementById("leadForm");
const addressPrefill = document.getElementById("addressPrefill");
const formError = document.getElementById("formError");
const successBox = document.getElementById("successBox");
const submitBtn = document.getElementById("submitBtn");

document.getElementById("year").textContent = new Date().getFullYear();

const pageLoadedAt = Date.now();

// ====== HELPERS ======
function sanitize(str) {
  return String(str || "").trim();
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function formatByTomorrowSameTime() {
  // User timezone: America/Chicago (CST/CDT). We'll show a simple "by tomorrow" promise without heavy TZ logic.
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const hours = tomorrow.getHours();
  const minutes = tomorrow.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = ((hours + 11) % 12) + 1;
  return `${h12}:${minutes} ${ampm} CT`;
}

function showSuccess(message) {
  successBox.hidden = false;
  successBox.textContent = message;
}

function resetMessages() {
  addressError.textContent = "";
  formError.textContent = "";
  successBox.hidden = true;
  successBox.textContent = "";
}

// ====== STEP 1: Address only ======
addressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  resetMessages();

  const addr = sanitize(addressInput.value);
  if (addr.length < 8) {
    addressError.textContent = "Please enter a complete property address (street + city).";
    addressInput.focus();
    return;
  }

  // Prefill step 2 + scroll
  addressPrefill.value = addr;

  document.getElementById("formSection").scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => {
    const nameField = leadForm.querySelector('input[name="fullName"]');
    if (nameField) nameField.focus();
  }, 350);
});

// ====== STEP 2: Full form submit ======
leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetMessages();

  // Anti-bot: time on page
  const secondsOnPage = (Date.now() - pageLoadedAt) / 1000;
  if (secondsOnPage < MIN_SECONDS_ON_PAGE) {
    formError.textContent = "Please wait a moment and try again.";
    return;
  }

  const fd = new FormData(leadForm);

  // Honeypot check
  const hp = sanitize(fd.get("companyWebsite"));
  if (hp) return; // silently drop

  const payload = {
    submittedAt: new Date().toISOString(),
    fullName: sanitize(fd.get("fullName")),
    phone: sanitize(fd.get("phone")),
    email: sanitize(fd.get("email")),
    propertyAddress: sanitize(fd.get("propertyAddress")),
    condition: sanitize(fd.get("condition")),
    preferredContact: sanitize(fd.get("preferredContact")),
    notes: sanitize(fd.get("notes")),
    source: "website"
  };

  // Validation
  if (payload.fullName.length < 2) {
    formError.textContent = "Please enter your full name.";
    return;
  }
  if (!isValidPhone(payload.phone)) {
    formError.textContent = "Please enter a valid phone number.";
    return;
  }
  if (payload.propertyAddress.length < 8) {
    formError.textContent = "Please enter a complete property address.";
    return;
  }
  if (!payload.preferredContact) {
    formError.textContent = "Please select your preferred contact method.";
    return;
  }

  // Submission
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    // If you don't want submissions to fail during local dev, you can temporarily comment this out.
    const res = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "no-cors" // Zapier often uses no-cors; you won't get a readable response.
    });

    // Show success regardless (no-cors prevents reading status)
    const promise = formatByTomorrowSameTime();
    showSuccess(`Received. Thanks, ${payload.fullName.split(" ")[0] || ""}. You’ll hear from me by tomorrow at ${promise}.`);

    leadForm.reset();
    addressPrefill.value = payload.propertyAddress; // keep address visible after reset

    // Optional: disable form after success to prevent duplicates
    // leadForm.querySelectorAll("input,select,textarea,button").forEach(el => el.disabled = true);

  } catch (err) {
    formError.textContent = "Something went wrong. Please call/text (901) 307-5197 and I’ll take it from there.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send My Info";
  }
});

  