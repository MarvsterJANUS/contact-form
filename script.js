const dropzone = document.getElementById("dropzone");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const form = document.getElementById("contactForm");

function updateFileList(files) {
  if (!files || !files.length) {
    fileList.textContent = "";
    return;
  }
  const names = Array.from(files).map(f => f.name);
  fileList.textContent = names.join(", ");
}

dropzone.addEventListener("click", () => fileInput.click());

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
    fileInput.files = dtFiles;
    updateFileList(dtFiles);
  }
});

fileInput.addEventListener("change", e => {
  updateFileList(e.target.files);
});

form.addEventListener("submit", e => {
  if (!form.checkValidity()) {
    e.preventDefault();
    form.reportValidity();
  }
});
