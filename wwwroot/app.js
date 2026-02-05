// app.js (works with your current index.html + CSS)

let page = 1;
let totalCount = 0;
let editingId = null;

const apiBase = ""; // same host/port

const el = (id) => document.getElementById(id);

function showError(msg) {
    const box = el("error");
    box.textContent = msg || "";
    box.classList.toggle("hidden", !msg);
}

function escapeHtml(s) {
    return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}

// -------------------- Modal (use your .hidden class) --------------------
function openModal(title) {
    el("modalTitle").textContent = title || "New Task";
    el("modal").classList.remove("hidden");
    el("modal").setAttribute("aria-hidden", "false");
}

function closeModal() {
    el("modal").classList.add("hidden");
    el("modal").setAttribute("aria-hidden", "true");

    editingId = null;

    // reset fields
    el("taskForm").reset();

    // clear validation messages (if validate is active)
    if (window.jQuery && $("#taskForm").data("validator")) {
        $("#taskForm").validate().resetForm();
        $(".input-error").removeClass("input-error");
        $(".field-error").remove();
    }
}

// -------------------- Query string for GET /api/tasks --------------------
function buildQuery() {
    const params = new URLSearchParams();

    const status = el("status").value.trim();
    const priority = el("priority").value.trim();
    const q = el("q").value.trim();
    const sortBy = el("sortBy").value || "createdAt";
    const sortDir = el("sortDir").value || "desc";
    const pageSize = parseInt(el("pageSize").value || "20", 10);

    if (status) params.set("status", status);
    if (priority) params.set("priority", priority);
    if (q) params.set("q", q);

    params.set("sortBy", sortBy);
    params.set("sortDir", sortDir);
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));

    return { params, pageSize };
}

// -------------------- Load + Render --------------------
async function loadTasks() {
    showError("");

    const { params, pageSize } = buildQuery();
    const url = `${apiBase}/api/tasks?${params.toString()}`;

    try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();

        // Your API returns PagedResult: { page, pageSize, totalCount, items }
        const items = data.items || [];
        totalCount = data.totalCount || 0;

        render(items);

        const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
        el("pageInfo").textContent = `Page ${data.page || page} / ${totalPages} (${totalCount} total)`;

        el("btnPrev").disabled = page <= 1;
        el("btnNext").disabled = page >= totalPages;
    } catch (e) {
        showError(e.message || "Failed to load tasks");
    }
}

function render(items) {
    const list = el("list");
    list.innerHTML = "";

    if (!items.length) {
        list.innerHTML = `<div class="muted">No tasks found.</div>`;
        return;
    }

    for (const t of items) {
        const due = t.dueDate ? new Date(t.dueDate).toLocaleDateString() : "-";
        const updated = t.updatedAtUtc ? new Date(t.updatedAtUtc).toLocaleString() : "-";

        const isDeleted = !!t.isDeleted;
        const isOverdue =
            t.dueDate &&
            new Date(t.dueDate) < new Date() &&
            t.status !== "Done" &&
            !isDeleted;

        const div = document.createElement("div");
        div.className = "task" + (isOverdue ? " overdue" : "");

        div.innerHTML = `
      <div class="task-top">
        <div>
          <div style="font-weight:700; font-size:16px">${escapeHtml(t.title)}</div>
          <div class="muted" style="margin-top:4px">${escapeHtml(t.description ?? "")}</div>
        </div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end">
          <span class="badge">${escapeHtml(t.status)}</span>
          <span class="badge">${escapeHtml(t.priority)}</span>
          <span class="badge">Due: ${escapeHtml(due)}</span>
          ${isOverdue ? `<span class="badge danger">Overdue</span>` : ``}
          ${isDeleted ? `<span class="badge">Deleted</span>` : ``}
        </div>
      </div>

      <div class="row" style="margin-top:10px; justify-content:space-between">
        <div class="muted" style="font-size:12px">Updated: ${escapeHtml(updated)}</div>
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

// -------------------- Create / Update --------------------
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
        title: el("title").value.trim(),
        description: (el("description").value || "").trim() || null,
        priority: el("mPriority").value,
        status: el("mStatus").value,
        dueDate: el("dueDate").value ? el("dueDate").value : null
    };

    if (!payload.title) {
        showError("Title is required.");
        return;
    }

    const isEdit = editingId != null;
    const url = isEdit ? `/api/tasks/${editingId}` : `/api/tasks`;
    const method = isEdit ? "PUT" : "POST";

    try {
        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(await res.text());

        closeModal();
        await loadTasks();
    } catch (e) {
        showError(e.message || "Save failed");
    }
}

// -------------------- Delete / Restore --------------------
async function delTask(id) {
    if (!confirm(`Delete task #${id}?`)) return;

    try {
        const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
        if (!res.ok && res.status !== 204) throw new Error(await res.text());
        await loadTasks();
    } catch (e) {
        showError(e.message || "Delete failed");
    }
}

async function restoreTask(id) {
    try {
        const res = await fetch(`/api/tasks/${id}/restore`, { method: "POST" });
        if (!res.ok) throw new Error(await res.text());
        await loadTasks();
    } catch (e) {
        showError(e.message || "Restore failed");
    }
}

// -------------------- jQuery validate (optional but works with your CSS) --------------------
function setupValidation() {
    if (!window.jQuery || !$.fn.validate) return;

    $.validator.setDefaults({
        errorClass: "field-error",
        highlight: function (element) { $(element).addClass("input-error"); },
        unhighlight: function (element) { $(element).removeClass("input-error"); }
    });

    $("#taskForm").validate({
        rules: {
            title: { required: true, maxlength: 200 },
            priority: { required: true },
            status: { required: true }
        },
        messages: {
            title: {
                required: "Title is required.",
                maxlength: "Title must be 200 characters or less."
            }
        },
        submitHandler: function () {
            saveTask();
        }
    });
}

// -------------------- Events --------------------
document.addEventListener("DOMContentLoaded", () => {
    // Search / paging
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

    // Modal open/close
    el("btnNew").addEventListener("click", openNew);
    el("btnClose").addEventListener("click", closeModal);
    el("btnCancel").addEventListener("click", closeModal);

    // click outside closes
    el("modal").addEventListener("click", (e) => {
        if (e.target === el("modal")) closeModal();
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !el("modal").classList.contains("hidden")) closeModal();
    });

    // Validation
    setupValidation();

    // First load
    loadTasks();
});
