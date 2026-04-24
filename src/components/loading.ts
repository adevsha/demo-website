export function loadingMarkup(label = "Loading..."): string {
  return `
    <div class="flex items-center justify-center p-8" role="status" aria-live="polite" data-testid="loading_indicator">
      <svg class="h-6 w-6 animate-spin text-accent" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
      </svg>
      <span class="ml-3 text-sm text-warm-sub">${label}</span>
    </div>
  `;
}
