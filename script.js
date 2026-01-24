// ====== CONFIG ======
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "259838c3-1e41-4388-92a9-fcab44556d07";
const MIN_SECONDS_ON_PAGE = 3;
const BUTTON_RESET_DELAY = 2500; // ms

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
function sanitize(val) {
  return String(val || "").trim();
}

function isValidPhone(phone) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isValidEmail(email) {
  if (!email) return true; // optional field
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function resetMessages(clearSuccess = true) {
  addressError.textContent = "";
  formError.textContent = "";
  if (clearSuccess) {
    successBox.hidden = true;
    successBox.textContent = "";
  }
}

function showSuccess(message) {
  successBox.hidden = false;
  successBox.textContent = message;
}

function focusFirstInvalidField() {
  const firstError = leadForm.querySelector(".error, input:invalid, select:invalid, textarea:invalid");
  if (firstError) firstError.focus();
}

// ====== STEP 1: ADDRESS ======
addressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  resetMessages();

  const addr = sanitize(addressInput.value);
  if (addr.length < 8) {
    addressError.textContent = "Please enter a complete property address (street + city).";
    addressInput.focus();
    return;
  }

  addressPrefill.value = addr;

  document.getElementById("formSection").scrollIntoView({ behavior: "smooth", block: "start" });

  setTimeout(() => {
    const nameField = leadForm.querySelector('input[name="fullName"]');
    if (nameField) nameField.focus();
  }, 350);
});

// ====== STEP 2: FULL SUBMISSION ======
leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetMessages(false);

  if (submitBtn.disabled) return;

  const secondsOnPage = (Date.now() - pageLoadedAt) / 1000;
  if (secondsOnPage < MIN_SECONDS_ON_PAGE) {
    formError.textContent = "Please wait a moment and try again.";
    return;
  }

  const fd = new FormData(leadForm);

  // Honeypot (anti-spam)
  if (sanitize(fd.get("companyWebsite"))) return;

  const payload = {
    access_key: WEB3FORMS_KEY,
    subject: "New Memphis Cash Offer Lead",
    from_name: "Restored Home Solutions Website",
    replyto: sanitize(fd.get("email")),
    submittedAt: new Date().toISOString(),
    fullName: sanitize(fd.get("fullName")),
    phone: sanitize(fd.get("phone")),
    email: sanitize(fd.get("email")),
    propertyAddress: sanitize(fd.get("propertyAddress")),
    condition: sanitize(fd.get("condition")),
    timeline: sanitize(fd.get("timeline")),
    notes: sanitize(fd.get("notes")),
    cityTarget: "Memphis, TN",
    source: "Website Lead Funnel"
  };

  // ====== VALIDATION ======
  if (payload.fullName.length < 2) {
    formError.textContent = "Please enter your full name.";
    focusFirstInvalidField();
    return;
  }

  if (!isValidPhone(payload.phone)) {
    formError.textContent = "Please enter a valid phone number.";
    focusFirstInvalidField();
    return;
  }

  if (payload.propertyAddress.length < 8) {
    formError.textContent = "Please enter a complete property address.";
    focusFirstInvalidField();
    return;
  }

  if (!payload.timeline) {
    formError.textContent = "Please select your timeline.";
    focusFirstInvalidField();
    return;
  }

  if (!isValidEmail(payload.email)) {
    formError.textContent = "Please enter a valid email address.";
    focusFirstInvalidField();
    return;
  }

  // ====== SUBMIT ======
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Sending... ⏳";

  try {
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error("Submission failed");
    }

    const firstName = payload.fullName.split(" ")[0] || "there";
    showSuccess(`Thanks, ${firstName}. I’ve received your info and will personally reach out to you within 24–48 hours to talk through your options.`);

    leadForm.reset();
    addressPrefill.value = payload.propertyAddress;
    submitBtn.textContent = "Submitted ✓";

    // Reset button after a short delay
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }, BUTTON_RESET_DELAY);

  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    formError.textContent = "Something went wrong. Please call or text (901) 307-5197 and I’ll take it from there.";
    console.error("Form submission error:", err);
  }
});




  