---
name: SPA documentation deep links
description: Preserve direct hash navigation in client-rendered documentation pages.
---

For documentation rendered by React, the browser can process a URL fragment before the target section exists in the DOM. On mount, resolve `window.location.hash` after rendering, scroll the target into view, and update the active navigation item. Also respond to later `hashchange` events.

**Why:** Direct section links initially opened the documentation at the top of the page instead of at the requested section.

**How to apply:** Add post-mount hash synchronization to client-rendered docs and keep the scroll-spy threshold aligned with the section's scroll margin.