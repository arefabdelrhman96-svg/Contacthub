const STORAGE_KEY = "contacts";
let contacts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let editingId = null;
let photoData = "";

const modalEl = document.getElementById("contactModal");
const modal = new bootstrap.Modal(modalEl);
const form = document.getElementById("contactForm");
const $ = (id) => document.getElementById(id);

const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));

const esc = (s = "") =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const initials = (name) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const gradients = [
  ["#a855f7", "#ec4899"], ["#3b82f6", "#06b6d4"], ["#10b981", "#14b8a6"],
  ["#f97316", "#ef4444"], ["#6366f1", "#8b5cf6"],
];
const gradientFor = (name) => {
  let h = 0;
  for (const ch of name) h += ch.charCodeAt(0);
  const [a, b] = gradients[h % gradients.length];
  return `linear-gradient(135deg, ${a}, ${b})`;
};

function avatarHTML(c, withBadges = false) {
  const style = c.photo
    ? `background-image:url('${c.photo}')`
    : `background:${gradientFor(c.name)}`;
  const text = c.photo ? "" : initials(c.name);
  const badges = withBadges
    ? `${c.favorite ? '<span class="badge-star"><i class="bi bi-star-fill"></i></span>' : ""}
       ${c.emergency ? '<span class="badge-heart"><i class="bi bi-heart-pulse-fill"></i></span>' : ""}`
    : "";
  return `<div class="avatar" style="${style}">${text}${badges}</div>`;
}

function contactCard(c) {
  return `
  <div class="col-12 col-md-6">
    <div class="contact-card">
      <div class="d-flex align-items-center gap-3">
        ${avatarHTML(c, true)}
        <div class="min-w-0">
          <div class="fw-semibold">${esc(c.name)}</div>
          <div class="info-row mt-1"><span class="info-ico ico-phone"><i class="bi bi-telephone-fill"></i></span>${esc(c.phone)}</div>
        </div>
      </div>
      ${c.email ? `<div class="info-row"><span class="info-ico ico-mail"><i class="bi bi-envelope-fill"></i></span>${esc(c.email)}</div>` : ""}
      ${c.address ? `<div class="info-row"><span class="info-ico ico-loc"><i class="bi bi-geo-alt-fill"></i></span>${esc(c.address)}</div>` : ""}
      <div>
        ${c.group ? `<span class="tag-group">${esc(c.group)}</span>` : ""}
        ${c.emergency ? `<span class="tag-emg"><i class="bi bi-heart-pulse-fill"></i> Emergency</span>` : ""}
      </div>
      <div class="actions">
        <div class="d-flex gap-2">
          <a class="act-btn act-call" href="tel:${esc(c.phone)}"><i class="bi bi-telephone-fill"></i></a>
          ${c.email ? `<a class="act-btn act-mail" href="mailto:${esc(c.email)}"><i class="bi bi-envelope-fill"></i></a>` : ""}
        </div>
        <div class="d-flex gap-2">
          <button class="act-btn act-star ${c.favorite ? "on" : ""}" onclick="toggleFlag(${c.id}, 'favorite')"><i class="bi bi-star-fill"></i></button>
          <button class="act-btn act-heart ${c.emergency ? "on" : ""}" onclick="toggleFlag(${c.id}, 'emergency')"><i class="bi bi-heart-pulse-fill"></i></button>
          <button class="act-btn act-edit" onclick="openEdit(${c.id})"><i class="bi bi-pencil-fill"></i></button>
          <button class="act-btn act-del" onclick="deleteContact(${c.id})"><i class="bi bi-trash-fill"></i></button>
        </div>
      </div>
    </div>
  </div>`;
}

function sideItem(c, cls) {
  return `
  <div class="side-item">
    ${avatarHTML(c)}
    <div>
      <div class="fw-semibold small">${esc(c.name)}</div>
      <small class="text-muted">${esc(c.phone)}</small>
    </div>
    <a class="call ${cls}" href="tel:${esc(c.phone)}"><i class="bi bi-telephone-fill"></i></a>
  </div>`;
}

function render() {
  const q = $("searchInput").value.trim().toLowerCase();
  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
  );

  $("contactsList").innerHTML = filtered.map(contactCard).join("");
  $("emptyState").style.display = filtered.length ? "none" : "block";

  const favs = contacts.filter((c) => c.favorite);
  const emgs = contacts.filter((c) => c.emergency);

  $("totalCount").textContent = contacts.length;
  $("favCount").textContent = favs.length;
  $("emgCount").textContent = emgs.length;
  $("subtitle").textContent = `Manage and organize your ${contacts.length} contacts`;

  $("favList").innerHTML = favs.length
    ? favs.map((c) => sideItem(c, "g")).join("")
    : '<div class="side-empty">No favorites yet</div>';
  $("emgList").innerHTML = emgs.length
    ? emgs.map((c) => sideItem(c, "r")).join("")
    : '<div class="side-empty">No emergency contacts</div>';
}

/* ---------- Modal ---------- */
function setPhoto(src) {
  photoData = src || "";
  const p = $("photoPreview");
  if (photoData) {
    p.style.backgroundImage = `url('${photoData}')`;
    p.innerHTML = "";
  } else {
    p.style.backgroundImage = "";
    p.innerHTML = '<i class="bi bi-person-fill"></i>';
  }
}

function resetForm() {
  form.reset();
  setPhoto("");
  editingId = null;
}

$("openAdd").addEventListener("click", () => {
  resetForm();
  $("modalTitle").textContent = "Add New Contact";
  modal.show();
});

window.openEdit = function (id) {
  const c = contacts.find((x) => x.id === id);
  if (!c) return;
  resetForm();
  editingId = id;
  $("modalTitle").textContent = "Edit Contact";
  $("name").value = c.name;
  $("phone").value = c.phone;
  $("email").value = c.email || "";
  $("address").value = c.address || "";
  $("group").value = c.group || "";
  $("notes").value = c.notes || "";
  $("isFav").checked = c.favorite;
  $("isEmg").checked = c.emergency;
  setPhoto(c.photo);
  modal.show();
};

// Photo upload (resized to keep localStorage small)
$("photoInput").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const size = 200;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext("2d");
      const min = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - min) / 2, (img.height - min) / 2, min, min, 0, 0, size, size);
      setPhoto(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

/* ---------- Save ---------- */
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const data = {
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    email: $("email").value.trim(),
    address: $("address").value.trim(),
    group: $("group").value,
    notes: $("notes").value.trim(),
    favorite: $("isFav").checked,
    emergency: $("isEmg").checked,
    photo: photoData,
  };

  if (!data.name || !data.phone) {
    return Swal.fire({ icon: "warning", title: "Missing data", text: "Full name and phone number are required." });
  }
  if (!/^[0-9+\-\s]{7,15}$/.test(data.phone)) {
    return Swal.fire({ icon: "warning", title: "Invalid phone", text: "Please enter a valid phone number." });
  }
  if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) {
    return Swal.fire({ icon: "warning", title: "Invalid email", text: "Please enter a valid email address." });
  }

  // Duplicate check (phone or email must be unique)
  const dup = contacts.find(
    (c) =>
      c.id !== editingId &&
      (c.phone === data.phone ||
        (data.email && c.email && c.email.toLowerCase() === data.email.toLowerCase()))
  );
  if (dup) {
    return Swal.fire({
      icon: "error",
      title: "Cannot save",
      text: "A contact with the same phone number or email already exists.",
    });
  }

  if (editingId) {
    contacts = contacts.map((c) => (c.id === editingId ? { ...c, ...data } : c));
  } else {
    contacts.push({ id: Date.now(), ...data });
  }

  save();
  render();
  modal.hide();
  Swal.fire({
    icon: "success",
    title: "Success!",
    text: editingId ? "Contact updated successfully." : "Contact added successfully.",
    timer: 1800,
    showConfirmButton: false,
  });
  editingId = null;
});

/* ---------- Actions ---------- */
window.toggleFlag = function (id, flag) {
  contacts = contacts.map((c) => (c.id === id ? { ...c, [flag]: !c[flag] } : c));
  save();
  render();
};

window.deleteContact = function (id) {
  const c = contacts.find((x) => x.id === id);
  Swal.fire({
    icon: "warning",
    title: "Delete Contact?",
    text: `Are you sure you want to delete ${c.name}? This action cannot be undone.`,
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#64748b",
    confirmButtonText: "Yes, delete it!",
  }).then((r) => {
    if (r.isConfirmed) {
      contacts = contacts.filter((x) => x.id !== id);
      save();
      render();
      Swal.fire({ icon: "success", title: "Deleted!", timer: 1200, showConfirmButton: false });
    }
  });
};

$("searchInput").addEventListener("input", render);

render();