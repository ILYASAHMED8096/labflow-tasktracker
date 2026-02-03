let page = 1;
let totalCount = 0;
let editingId = null;

const apiBase = ""; // same host

const el = (id) => document.getElementById(id);

const showError = (msg) => {
    const box = el("error");
    box.textContent = msg || "";
    box.classList.toggle("hidden", !msg);
};

function qs() {
    const status = el("status").value.trim();
    const priority = el("priority").value.trim();
    const q = el("q").value.trim();
    const sortBy = el("sortBy").value;
    const sortDir = el("sortDir").value;
    const pageSize = parseInt(el("pageSize").value, 10);

    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (q) params.set("q", q);

    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());

    return params;
}

async function loadTasks() {
    showError("");
    const url = `${apiBase}/api/tasks?${qs().toString()}`;

    try {
        const res = await fetch(url, { headers: { "Accept": "application/json" } });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `HTTP ${res.status}`);
        }

        const data = await res.json();

        totalCount = data.totalCount || 0;
        render(data.items || []);

        const pageSize = parseInt(el("pageSize").value, 10);
        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        el("pageInfo").textContent = `Page ${data.page} / ${totalPages} (${totalCount} total)`;

        el("btnPrev").disabled = page <= 1;
        el("btnNext").disabled = page >= totalPages;
    } catch (e) {
        showError(e.message);
    }
}

function render(items) {
    const list = el("list");
    list.innerHTML = "";

    if (items.length === 0) {
        list.innerHTML = `<div class="muted">No tasks found.</div>`;
        return;
    }

    for (const t of items) {
        // ✅ Fix: compute isOverdue BEFORE using it
        const isOverdue =
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== "Done";

        const div = document.createElement("div");
        div.className = "task" + (isOverdue ? " overdue" : "");

        const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-";
        const updated = t.updatedAtUtc ? new Date(t.updatedAtUtc).toLocaleString() : "-";

        // Optional: show restore only when deleted (if your API returns isDeleted)
        const isDeleted = !!t.isDeleted;

        div.innerHTML = `
      <div class="task-top">
        <div>
          <div style="font-weight:700; font-size:16px">${escapeHtml(t.title)}</div>
          <div class="muted" style="margin-top:4px">${escapeHtml(t.description ?? "")}</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end">
          <span class="badge">${t.status}</span>
          <span class="badge">${t.priority}</span>
          <span class="badge">Due: ${due}</span>
          ${isOverdue ? `<span class="badge danger">Overdue</span>` : ``}
          ${isDeleted ? `<span class="badge">Deleted</span>` : ``}
        </div>
      </div>

      <div class="row" style="margin-top:10px; justify-content:space-between">
        <div class="muted" style="font-size:12px">Updated: ${updated}</div>
        <div class="row" style="gap:8px;">
          <button class="secondary" data-edit="${t.id}">Edit</button>
          ${!isDeleted ? `<button class="danger" data-del="${t.id}">Delete</button>` : ``}
          ${isDeleted ? `<button class="secondary" data-restore="${t.id}">Restore</button>` : ``}
        </div>
      </div>
    `;

        div.querySelector("[data-edit]").addEventListener("click", () => openEdit(t));

        const delBtn = div.querySelector("[data-del]");
        if (delBtn) delBtn.addEventListener("click", () => delTask(t.id));

        const restoreBtn = div.querySelector("[data-restore]");
        if (restoreBtn) restoreBtn.addEventListener("click", () => restoreTask(t.id));

        list.appendChild(div);
    }
}

function escapeHtml(s) {
    return String(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

function openModal(title) {
    el("modalTitle").textContent = title;
    el("modal").classList.remove("hidden");
}

function closeModal() {
    el("modal").classList.add("hidden");
    editingId = null;

    // Clear fields
    el("title").value = "";
    el("description").value = "";
    el("mPriority").value = "Medium";
    el("mStatus").value = "Todo";
    el("dueDate").value = "";

    // Clear validation UI
    if (window.jQuery) {
        const $form = $("#taskForm");
        if ($form.length && $form.data("validator")) {
            $form.validate().resetForm();
            $form.find(".input-error").removeClass("input-error");
        }
    }
}

function openNew() {
    editingId = null;
    openModal("New Task");
}

function openEdit(t) {
    editingId = t.id;
    el("title").value = t.title ?? "";
    el("description").value = t.description ?? "";
    el("mPriority").value = t.priority ?? "Medium";
    el("mStatus").value = t.status ?? "Todo";
    el("dueDate").value = t.dueDate ? String(t.dueDate).slice(0, 10) : "";
    openModal(`Edit Task #${t.id}`);
}

async function saveTask() {
    const payload = {
        title: el("title").value,
        description: el("description").value,
        priority: el("mPriority").value,
        status: el("mStatus").value,
        dueDate: el("dueDate").value ? el("dueDate").value : null
    };

    const isEdit = editingId != null;
    const url = isEdit ? `/api/tasks/${editingId}` : `/api/tasks`;
    const method = isEdit ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", "Accept": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `HTTP ${res.status}`);
        }

        closeModal();
        await loadTasks();
    } catch (e) {
        showError(e.message);
    }
}

async function delTask(id) {
    if (!confirm(`Delete task #${id}?`)) return;

    try {
        const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) {
            const txt = await res.text();
            throw new Error(txt || `HTTP ${res.status}`);
        }
        await loadTasks();
    } catch (e) {
        showError(e.message);
    }
}

async function restoreTask(id) {
    try {
        const res = await fetch(`/api/tasks/${id}/restore`, { method: "POST" });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || `HTTP ${res.status}`);
        }
        await loadTasks();
    } catch (e) {
        showError(e.message);
    }
}

/* ---------------------------
   jQuery Validation Setup
---------------------------- */
function setupValidation() {
    if (!window.jQuery || !$.fn.validate) return;

    // Optional: style error message
    $.validator.setDefaults({
        errorClass: "field-error",
        validClass: "field-valid",
        errorPlacement: function (error, element) {
            // place error below the field
            error.insertAfter(element);
        },
        highlight: function (element) {
            $(element).addClass("input-error");
        },
        unhighlight: function (element) {
            $(element).removeClass("input-error");
        }
    });

    // Custom rule: dueDate cannot be in the past (optional)
    $.validator.addMethod("notPastDate", function (value) {
        if (!value) return true; // empty allowed
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const d = new Date(value);
        d.setHours(0, 0, 0, 0);
        return d >= today;
    }, "Due date cannot be in the past.");

    $("#taskForm").validate({
        rules: {
            title: {
                required: true,
                maxlength: 200
            },
            priority: {
                required: true
            },
            status: {
                required: true
            },
            dueDate: {
                notPastDate: true
            }
        },
        messages: {
            title: {
                required: "Title is required.",
                maxlength: "Title must be 200 characters or less."
            },
            priority: {
                required: "Priority is required."
            },
            status: {
                required: "Status is required."
            }
        },
        submitHandler: function () {
            // ✅ only called if valid
            saveTask();
        }
    });
}

/* ---------------------------
   Events
---------------------------- */
el("btnSearch").addEventListener("click", () => { page = 1; loadTasks(); });

el("btnClear").addEventListener("click", () => {
    el("q").value = "";
    el("status").value = "";
    el("priority").value = "";
    page = 1;
    loadTasks();
});

el("btnPrev").addEventListener("click", () => { page = Math.max(1, page - 1); loadTasks(); });

el("btnNext").addEventListener("click", () => { page = page + 1; loadTasks(); });

el("btnNew").addEventListener("click", openNew);
el("btnClose").addEventListener("click", closeModal);
el("btnCancel").addEventListener("click", closeModal);

// ✅ IMPORTANT: remove old click handler for btnSave
// We now submit form (btnSave is type="submit")
const saveBtn = el("btnSave");
if (saveBtn) saveBtn.removeEventListener?.("click", saveTask);

// Close modal on ESC
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !el("modal").classList.contains("hidden")) {
        closeModal();
    }
});

// Optional: close when clicking outside modal content
el("modal").addEventListener("click", (e) => {
    if (e.target === el("modal")) closeModal();
});

// Initial load
setupValidation();
loadTasks();
