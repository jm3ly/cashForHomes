// ====== CONFIG ======
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "259838c3-1e41-4388-92a9-fcab44556d07"; // <-- paste key here
const MIN_SECONDS_ON_PAGE = 3;

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

function formatByTomorrowSameTimeCT() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const hours = tomorrow.getHours();
  const minutes = String(tomorrow.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = ((hours + 11) % 12) + 1;
  return `${h12}:${minutes} ${ampm} CT`;
}

function resetMessages() {
  addressError.textContent = "";
  formError.textContent = "";
  successBox.hidden = true;
  successBox.textContent = "";
}

function showSuccess(message) {
  successBox.hidden = false;
  successBox.textContent = message;
}

// ====== STEP 1: ADDRESS ======
addressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  resetMessages();

  const addr = sanitize(addressInput.value);
  if (addr.length < 8) {
    addressError.textContent =
      "Please enter a complete property address (street + city).";
    addressInput.focus();
    return;
  }

  addressPrefill.value = addr;

  document
    .getElementById("formSection")
    .scrollIntoView({ behavior: "smooth", block: "start" });

  setTimeout(() => {
    const nameField = leadForm.querySelector('input[name="fullName"]');
    if (nameField) nameField.focus();
  }, 350);
});

// ====== STEP 2: FULL SUBMISSION ======
leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetMessages();

  if (submitBtn.disabled) return;

  const secondsOnPage = (Date.now() - pageLoadedAt) / 1000;
  if (secondsOnPage < MIN_SECONDS_ON_PAGE) {
    formError.textContent = "Please wait a moment and try again.";
    return;
  }

  const fd = new FormData(leadForm);

  // Honeypot
  if (sanitize(fd.get("companyWebsite"))) return;

  const payload = {
    access_key: WEB3FORMS_KEY,
    subject: "New Memphis Cash Offer Lead",
    from_name: "Restored Home Solutions Website",

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

  if (!payload.timeline) {
    formError.textContent = "Please select your timeline.";
    return;
  }

  // ====== SUBMIT ======
  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";

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

    const promiseTime = formatByTomorrowSameTimeCT();
    const firstName = payload.fullName.split(" ")[0] || "there";

    showSuccess(
      `Thanks, ${firstName}. I’ve received your info and will personally reach out by ${promiseTime}.`
    );

    leadForm.reset();
    addressPrefill.value = payload.propertyAddress;
    submitBtn.textContent = "Submitted ✓";

  } catch (err) {
    submitBtn.disabled = false;
    submitBtn.textContent = "Get My Offer";
    formError.textContent =
      "Something went wrong. Please call or text (901) 307-5197 and I’ll take it from there.";
  }
});




  