const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const form = document.getElementById("contactForm");
const submitBtn = form.querySelector(".btn-submit");
const formMessage = document.getElementById("formMessage");
const themeToggle = document.getElementById("themeToggle");

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_TYPES = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'];
const STORAGE_KEY = 'contactFormData';
const STORAGE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const MAX_MESSAGE_LENGTH = 1000;
const THEME_STORAGE_KEY = 'contactFormTheme';

// Store files in an array for easier management
let selectedFiles = [];

// Theme toggle functionality
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (e) {
    console.warn('Could not save theme preference:', e);
  }
}

function getTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) || 'light';
  } catch (e) {
    console.warn('Could not load theme preference:', e);
    return 'light';
  }
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
}

// Initialize theme on page load
const savedTheme = getTheme();
setTheme(savedTheme);

// Theme toggle button event
if (themeToggle) {
  themeToggle.addEventListener('click', toggleTheme);
}

// Validation rules
const validators = {
  name: (value) => {
    if (!value.trim()) return "Name is required";
    if (value.trim().length < 2) return "Name must be at least 2 characters";
    return null;
  },
  email: (value) => {
    if (!value.trim()) return "Email is required";
    // Enhanced email validation
    // Checks for: valid characters, @ symbol, domain with valid TLD (2+ characters)
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value.trim())) return "Please enter a valid email address";

    // Additional checks
    const parts = value.trim().split('@');
    if (parts.length !== 2) return "Please enter a valid email address";

    const [localPart, domain] = parts;
    if (localPart.length === 0 || localPart.length > 64) return "Email address is invalid";
    if (domain.length === 0 || domain.length > 255) return "Email domain is invalid";

    // Check for consecutive dots
    if (value.includes('..')) return "Email cannot contain consecutive dots";

    // Check domain has at least one dot
    if (!domain.includes('.')) return "Please enter a valid email domain";

    return null;
  },
  message: (value) => {
    if (!value.trim()) return "Message is required";
    if (value.trim().length < 10) return "Message must be at least 10 characters";
    return null;
  }
};

// Show error for a field
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);
  const wrapper = field?.closest('.input-wrapper');

  if (field && errorElement) {
    field.classList.add("error");
    errorElement.textContent = message;
    errorElement.classList.add("show");
    if (wrapper) wrapper.classList.remove("valid");
  }
}

// Clear error for a field
function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(`${fieldId}-error`);

  if (field && errorElement) {
    field.classList.remove("error");
    errorElement.textContent = "";
    errorElement.classList.remove("show");
  }
}

// Show success indicator for a field
function showSuccess(fieldId) {
  const field = document.getElementById(fieldId);
  const wrapper = field?.closest('.input-wrapper');

  if (wrapper && field.value.trim()) {
    wrapper.classList.add("valid");
  }
}

// Clear success indicator for a field
function clearSuccess(fieldId) {
  const field = document.getElementById(fieldId);
  const wrapper = field?.closest('.input-wrapper');

  if (wrapper) {
    wrapper.classList.remove("valid");
  }
}

// Validate a single field
function validateField(fieldId) {
  const field = document.getElementById(fieldId);
  if (!field || !validators[fieldId]) return true;

  const error = validators[fieldId](field.value);
  if (error) {
    showError(fieldId, error);
    clearSuccess(fieldId);
    return false;
  } else {
    clearError(fieldId);
    showSuccess(fieldId);
    return true;
  }
}

// Form data persistence functions
function saveFormData() {
  const formData = {
    inquiry: document.getElementById('inquiry')?.value || '',
    name: document.getElementById('name')?.value || '',
    email: document.getElementById('email')?.value || '',
    phone: document.getElementById('phone')?.value || '',
    countryCode: document.getElementById('countryCode')?.value || '',
    message: document.getElementById('message')?.value || '',
    consent: document.getElementById('consent')?.checked || false,
    timestamp: Date.now()
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  } catch (e) {
    console.warn('Could not save form data to localStorage:', e);
  }
}

function loadFormData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return false;

    const formData = JSON.parse(saved);

    // Check if data has expired
    if (Date.now() - formData.timestamp > STORAGE_EXPIRY) {
      clearFormData();
      return false;
    }

    // Restore form values
    if (formData.inquiry) document.getElementById('inquiry').value = formData.inquiry;
    if (formData.name) document.getElementById('name').value = formData.name;
    if (formData.email) document.getElementById('email').value = formData.email;
    if (formData.phone) document.getElementById('phone').value = formData.phone;
    if (formData.countryCode) document.getElementById('countryCode').value = formData.countryCode;
    if (formData.message) document.getElementById('message').value = formData.message;
    if (formData.consent) document.getElementById('consent').checked = formData.consent;

    return true;
  } catch (e) {
    console.warn('Could not load form data from localStorage:', e);
    return false;
  }
}

function clearFormData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Could not clear form data from localStorage:', e);
  }
}

// Load saved form data on page load
const dataRestored = loadFormData();
if (dataRestored) {
  console.log('Form data restored from previous session');
}

// Add real-time validation and auto-save
["name", "email", "message"].forEach(fieldId => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.addEventListener("blur", () => validateField(fieldId));
    field.addEventListener("input", () => {
      if (field.classList.contains("error")) {
        validateField(fieldId);
      }
      // Auto-save form data
      saveFormData();
    });
  }
});

// Auto-save for other form fields
["inquiry", "phone", "countryCode"].forEach(fieldId => {
  const field = document.getElementById(fieldId);
  if (field) {
    field.addEventListener("change", saveFormData);
  }
});

// Auto-save for consent checkbox
const consentCheckbox = document.getElementById('consent');
if (consentCheckbox) {
  consentCheckbox.addEventListener("change", saveFormData);
}

// Character counter for message field
const messageField = document.getElementById('message');
const messageCounter = document.getElementById('message-counter');

function updateCharCounter() {
  if (!messageField || !messageCounter) return;

  const length = messageField.value.length;
  const maxLength = MAX_MESSAGE_LENGTH;

  messageCounter.textContent = `${length} / ${maxLength}`;

  // Remove all classes first
  messageCounter.classList.remove('warning', 'limit');

  // Add warning at 80%
  if (length >= maxLength * 0.8 && length < maxLength) {
    messageCounter.classList.add('warning');
  }
  // Add limit at 95%
  else if (length >= maxLength * 0.95) {
    messageCounter.classList.add('limit');
  }
}

if (messageField) {
  messageField.addEventListener('input', updateCharCounter);
  // Initialize counter on page load
  updateCharCounter();
}

// Phone number formatting
const phoneField = document.getElementById('phone');

function formatPhoneNumber(value) {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');

  // Format based on length
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  } else if (digits.length <= 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
}

if (phoneField) {
  phoneField.addEventListener('input', (e) => {
    const cursorPosition = e.target.selectionStart;
    const oldValue = e.target.value;
    const oldLength = oldValue.length;

    // Format the phone number
    const formatted = formatPhoneNumber(oldValue);
    e.target.value = formatted;

    // Adjust cursor position
    const newLength = formatted.length;
    const diff = newLength - oldLength;
    e.target.selectionStart = e.target.selectionEnd = cursorPosition + diff;

    // Auto-save
    saveFormData();
  });
}

// File validation
function validateFile(file) {
  const extension = '.' + file.name.split('.').pop().toLowerCase();

  if (!ALLOWED_TYPES.includes(extension)) {
    return `${file.name}: Invalid file type. Allowed: JPG, JPEG, PNG, GIF, PDF`;
  }

  if (file.size > MAX_FILE_SIZE) {
    return `${file.name}: File size exceeds 5MB limit`;
  }

  return null;
}

function validateFiles(files) {
  const fileArray = Array.from(files);

  if (fileArray.length > MAX_FILES) {
    return `You can only upload up to ${MAX_FILES} files`;
  }

  for (const file of fileArray) {
    const error = validateFile(file);
    if (error) return error;
  }

  return null;
}

// Update file list display with chips
function updateFileList() {
  fileList.innerHTML = "";
  const fileError = document.getElementById("file-error");

  if (selectedFiles.length === 0) {
    fileError.classList.remove("show");
    return;
  }

  selectedFiles.forEach((file, index) => {
    const chip = document.createElement("div");
    chip.className = "file-chip";

    const nameSpan = document.createElement("span");
    nameSpan.className = "file-chip-name";
    nameSpan.textContent = file.name;
    nameSpan.title = file.name;

    const removeBtn = document.createElement("button");
    removeBtn.className = "file-chip-remove";
    removeBtn.innerHTML = "×";
    removeBtn.type = "button";
    removeBtn.setAttribute("aria-label", `Remove ${file.name}`);
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeFile(index);
    });

    chip.appendChild(nameSpan);
    chip.appendChild(removeBtn);
    fileList.appendChild(chip);
  });
}

// Remove a file
function removeFile(index) {
  selectedFiles.splice(index, 1);
  updateFileInput();
  updateFileList();
}

// Update the actual file input with selected files
function updateFileInput() {
  const dt = new DataTransfer();
  selectedFiles.forEach(file => dt.items.add(file));
  fileInput.files = dt.files;
}

// Handle file selection
function handleFiles(files) {
  const fileError = document.getElementById("file-error");
  const error = validateFiles(files);

  if (error) {
    fileError.textContent = error;
    fileError.classList.add("show");
    return;
  }

  fileError.classList.remove("show");
  selectedFiles = Array.from(files);
  updateFileInput();
  updateFileList();
}

// Dropzone events
dropzone.addEventListener("click", (e) => {
  if (!e.target.closest('.file-chip-remove')) {
    fileInput.click();
  }
});

dropzone.addEventListener("dragover", e => {
  e.preventDefault();
  dropzone.classList.add("hover");
});

dropzone.addEventListener("dragleave", e => {
  e.preventDefault();
  dropzone.classList.remove("hover");
});

dropzone.addEventListener("drop", e => {
  e.preventDefault();
  dropzone.classList.remove("hover");
  const dtFiles = e.dataTransfer.files;
  if (dtFiles && dtFiles.length) {
    handleFiles(dtFiles);
  }
});

fileInput.addEventListener("change", e => {
  if (e.target.files && e.target.files.length) {
    handleFiles(e.target.files);
  }
});

// Show form message
function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = `form-message show ${type}`;

  // Auto-hide after 5 seconds for success messages
  if (type === 'success') {
    setTimeout(() => {
      formMessage.classList.remove("show");
    }, 5000);
  }
  // Error messages stay visible until dismissed
}

// Scroll to first error field
function scrollToFirstError() {
  const firstError = document.querySelector('.input.error, select.error, textarea.error');
  if (firstError) {
    firstError.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    // Focus the field after scrolling
    setTimeout(() => {
      firstError.focus();
    }, 300);
  }
}

// Show specific validation errors for all fields
function showAllValidationErrors() {
  let hasError = false;

  // Validate inquiry field
  const inquiryField = document.getElementById('inquiry');
  if (inquiryField && !inquiryField.value) {
    const inquiryWrapper = inquiryField.closest('.field');
    if (inquiryWrapper) {
      inquiryField.classList.add('error');
      hasError = true;
    }
  }

  // Validate name, email, message
  ['name', 'email', 'message'].forEach(fieldId => {
    if (!validateField(fieldId)) {
      hasError = true;
    }
  });

  // Validate consent checkbox
  const consentField = document.getElementById('consent');
  if (consentField && !consentField.checked) {
    hasError = true;
  }

  return !hasError;
}

// Modal functions
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalMessage = document.getElementById("modalMessage");
const modalCloseBtn = document.getElementById("modalCloseBtn");
const modalOverlay = modal.querySelector(".modal-overlay");

function showModal(title, message) {
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("show");
  document.body.style.overflow = "";
}

modalCloseBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("show")) {
    closeModal();
  }
});

// Network retry logic
let retryCount = 0;
const MAX_RETRIES = 2;

async function submitFormWithRetry(formData, attempt = 1) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout. Please try again.');
    }

    // Retry on network errors
    if (attempt < MAX_RETRIES && (error.message.includes('fetch') || error.message.includes('network'))) {
      console.log(`Retrying... Attempt ${attempt + 1} of ${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
      return submitFormWithRetry(formData, attempt + 1);
    }

    throw error;
  }
}

// Form submission
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Clear previous messages
  formMessage.classList.remove("show");

  // Validate all fields and show specific errors
  const allValid = showAllValidationErrors();

  if (!allValid) {
    showMessage("Please correct the errors highlighted below", "error");
    scrollToFirstError();
    return;
  }

  // Additional HTML5 validation check
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Show loading state
  submitBtn.classList.add("loading");
  submitBtn.disabled = true;
  retryCount = 0;

  try {
    const formData = new FormData(form);

    const response = await submitFormWithRetry(formData);

    if (response.ok) {
      showModal("Thank You!", "Your message has been sent successfully. We'll get back to you soon!");
      form.reset();
      selectedFiles = [];
      updateFileList();
      updateCharCounter();
      // Clear saved form data after successful submission
      clearFormData();

      // Clear all validation states
      ['name', 'email', 'message'].forEach(fieldId => {
        clearError(fieldId);
        clearSuccess(fieldId);
      });
    } else if (response.status === 429) {
      // Rate limit error
      showMessage("Too many requests. Please wait a moment before trying again.", "error");
    } else if (response.status >= 500) {
      // Server error
      showMessage("Server error. Please try again in a few moments.", "error");
    } else {
      // Client error (400-499)
      try {
        const data = await response.json();
        if (data.errors && Array.isArray(data.errors)) {
          const errorMessages = data.errors
            .map(error => error.message || error.field)
            .filter(Boolean)
            .join(", ");
          showMessage(`Submission error: ${errorMessages}`, "error");
        } else {
          showMessage("Unable to submit form. Please check your inputs and try again.", "error");
        }
      } catch (jsonError) {
        showMessage("Unable to submit form. Please try again.", "error");
      }
    }
  } catch (error) {
    console.error("Form submission error:", error);

    // Specific error messages based on error type
    if (error.message.includes('timeout')) {
      showMessage("Request timed out. Please check your connection and try again.", "error");
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      showMessage("Network error. Please check your internet connection and try again.", "error");
    } else if (error.name === 'TypeError') {
      showMessage("Connection failed. Please check your internet connection.", "error");
    } else {
      showMessage("An unexpected error occurred. Please try again.", "error");
    }
  } finally {
    // Remove loading state
    submitBtn.classList.remove("loading");
    submitBtn.disabled = false;
  }
});
