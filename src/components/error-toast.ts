let container: HTMLElement | null = null;

function ensureContainer(): HTMLElement {
  if (container && document.body.contains(container)) return container;
  container = document.createElement("div");
  container.className =
    "pointer-events-none fixed bottom-6 right-6 z-50 flex flex-col gap-2";
  document.body.appendChild(container);
  return container;
}

export function showError(message: string): void {
  const host = ensureContainer();
  const toast = document.createElement("div");
  toast.className =
    "pointer-events-auto flex max-w-sm items-start gap-3 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-lg";
  toast.setAttribute("data-testid", "error_dialog");
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <span class="flex-1 text-sm">${escapeHtml(message)}</span>
    <button type="button" data-testid="error_dialog_dismiss" class="text-red-700 hover:text-red-900" aria-label="Dismiss">✕</button>
  `;
  const dismiss = () => toast.remove();
  toast.querySelector("button")?.addEventListener("click", dismiss);
  host.appendChild(toast);
  setTimeout(dismiss, 6000);
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
