const WEBHOOK_URL = "https://hooks.zapier.com/hooks/catch/XXXXXX/YYYYYY/"; // replace later
const MIN_SECONDS_ON_PAGE = 3;

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

function sanitize(v){ return String(v || "").trim(); }
function isValidPhone(phone){
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}
function promiseTimeCT(){
  // Simple, human promise; avoids brittle timezone code.
  const now = new Date();
  const tmr = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const mins = String(tmr.getMinutes()).padStart(2, "0");
  const hours = tmr.getHours();
  const ampm = hours >= 12 ? "PM" : "AM";
  const h12 = ((hours + 11) % 12) + 1;
  return `${h12}:${mins} ${ampm} CT`;
}
function resetMessages(){
  addressError.textContent = "";
  formError.textContent = "";
  successBox.hidden = true;
  successBox.textContent = "";
}
function showSuccess(msg){
  successBox.hidden = false;
  successBox.textContent = msg;
}

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
  }, 300);
});

leadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  resetMessages();

  const secondsOnPage = (Date.now() - pageLoadedAt) / 1000;
  if (secondsOnPage < MIN_SECONDS_ON_PAGE) {
    formError.textContent = "Please wait a moment and try again.";
    return;
  }

  const fd = new FormData(leadForm);

  // Honeypot
  if (sanitize(fd.get("companyWebsite"))) return;

  const payload = {
    submittedAt: new Date().toISOString(),
    cityTarget: "Memphis, TN",
    fullName: sanitize(fd.get("fullName")),
    phone: sanitize(fd.get("phone")),
    email: sanitize(fd.get("email")),
    propertyAddress: sanitize(fd.get("propertyAddress")),
    condition: sanitize(fd.get("condition")),
    preferredContact: sanitize(fd.get("preferredContact")),
    notes: sanitize(fd.get("notes")),
    source: "memphis-landing-page"
  };

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

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";

    // no-cors is common for Zapier catch hooks.
    await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      mode: "no-cors"
    });

    const firstName = payload.fullName.split(" ")[0] || "there";
    showSuccess(`Received. Thanks, ${firstName}. You’ll hear from me by tomorrow at ${promiseTimeCT()}.`);

    leadForm.reset();
    addressPrefill.value = payload.propertyAddress;

  } catch {
    formError.textContent = "Something went wrong. Please call/text (901) 307-5197 and I’ll take it from there.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Send My Info";
  }
});


  