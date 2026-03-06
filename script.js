// ====== CONFIG ======
const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const WEB3FORMS_KEY = "259838c3-1e41-4388-92a9-fcab44556d07";
const MIN_SECONDS_ON_PAGE = 3;

// ====== ELEMENTS ======
const addressForm = document.getElementById("addressForm");
const addressInput = document.getElementById("addressInput");
const addressError = document.getElementById("addressError");

const leadForm = document.getElementById("leadForm");
// This looks for the hidden input we added to the second form
const addressPrefill = document.getElementById("addressPrefill");
const formError = document.getElementById("formError");
const successBox = document.getElementById("successBox");
const submitBtn = document.getElementById("submitBtn");

// Set footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

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

function resetMessages() {
  addressError.textContent = "";
  formError.textContent = "";
}

// ====== STEP 1: ADDRESS HAND-OFF ======
addressForm.addEventListener("submit", (e) => {
  e.preventDefault();
  resetMessages();

  const addr = sanitize(addressInput.value);
  
  // Validation for Step 1
  if (addr.length < 8) {
    addressError.textContent = "Please enter a complete property address (Street, City, State).";
    addressInput.focus();
    return;
  }

  // PASSING DATA: Put the address into the hidden field of Form 2
  if (addressPrefill) {
    addressPrefill.value = addr;
  }

  // UI: Smooth scroll to the next section
  const target = document.getElementById("formSection");
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // UX: Auto-focus the Name field after the scroll finishes
  setTimeout(() => {
    const nameField = leadForm.querySelector('input[name="fullName"]');
    if (nameField) nameField.focus();
  }, 600);
});

// ====== STEP 2: FULL SUBMISSION ======
leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetMessages();

  if (submitBtn.disabled) return;

  // Bot Protection: Time on page check
  const secondsOnPage = (Date.now() - pageLoadedAt) / 1000;
  if (secondsOnPage < MIN_SECONDS_ON_PAGE) {
    formError.textContent = "Processing... please try again in a moment.";
    return;
  }

  const fd = new FormData(leadForm);

  // Honeypot check
  if (sanitize(fd.get("companyWebsite"))) {
    return; // Silent fail for bots
  }

  // Construct the Final Payload
  const payload = {
    access_key: WEB3FORMS_KEY,
    subject: "New Memphis Cash Offer Lead",
    from_name: "Restored Home Solutions",
    replyto: sanitize(fd.get("email")),
    fullName: sanitize(fd.get("fullName")),
    phone: sanitize(fd.get("phone")),
    email: sanitize(fd.get("email")),
    // This pulls from the hidden field filled by Step 1
    propertyAddress: sanitize(fd.get("propertyAddress")), 
    condition: fd.get("condition"),
    timeline: fd.get("timeline"),
    notes: sanitize(fd.get("notes")),
    cityTarget: "Memphis, TN"
  };

  // ====== FINAL VALIDATION ======
  if (payload.fullName.length < 2) {
    formError.textContent = "Please enter your full name.";
    leadForm.querySelector('[name="fullName"]').focus();
    return;
  }

  if (!isValidPhone(payload.phone)) {
    formError.textContent = "Please enter a valid phone number.";
    leadForm.querySelector('[name="phone"]').focus();
    return;
  }

  // This is where your previous error was—now it checks the hidden value
  if (!payload.propertyAddress || payload.propertyAddress.length < 5) {
    formError.textContent = "Property address is missing. Please scroll up and enter it.";
    return;
  }

  if (!payload.timeline) {
    formError.textContent = "Please select your selling timeline.";
    return;
  }

  // ====== SENDING ======
  submitBtn.disabled = true;
  const originalText = submitBtn.textContent;
  submitBtn.textContent = "Sending Your Request... ⏳";

  try {
    const res = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      // SUCCESS STATE
      const firstName = payload.fullName.split(" ")[0] || "there";
      successBox.innerHTML = `<strong>Success!</strong> Thanks, ${firstName}. I've received your info and will personally reach out within 24 hours.`;
      successBox.hidden = false;
      
      // Lock form to prevent double-leads
      leadForm.style.opacity = "0.4";
      leadForm.style.pointerEvents = "none";
      submitBtn.textContent = "Offer Requested ✓";
      
      successBox.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      throw new Error();
    }
  } catch (err) {
    // ERROR STATE
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    formError.textContent = "Something went wrong. Please text (901) 307-5197 for your offer.";
  }
});




  