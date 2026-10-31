# Taskflow

A calm, responsive daily task planner built with HTML, CSS, and JavaScript. No build step or account required.

## Use

Open the GitHub Pages URL, or serve this directory locally:

```sh
python3 -m http.server 8000
```

Visit http://localhost:8000. Press **N** to add a task. Tasks support notes, priorities, optional due dates, editing, completion, deletion with undo, search, and sorting. My day includes tasks due today and tasks completed today. Undated tasks live in All tasks. Overdue tasks have their own view.

A 25-minute focus timer supports pause and reset. The timer uses elapsed wall-clock time when browser tabs are throttled; keep the page open for the session.

## Appearance

Dark mode is the default, using Onyx (#000F08), Jet Black (#1C3738), Charcoal (#4D4847), Mint Cream (#F4FFF8), and Cool Steel (#8BAAAD). The sidebar theme button switches between dark and light modes. Your choice is saved on this device.

## Your data

Tasks are stored in this browser's local storage, using the original `taskflow_v1` key for compatibility. There is no server sync. Export backups before clearing browser data or switching devices. Import merges tasks by ID without replacing existing tasks. Changes synchronize between open tabs on the same origin. Fonts use Google Fonts with local sans-serif fallbacks.

## GitHub Pages

The existing workflow deploys on pushes to `main`. In repository **Settings → Pages**, select **GitHub Actions** as the source. All app asset paths are relative and match their on-disk capitalization, so project URLs such as `/Task-Manager-App/` work.

The old page referenced lowercase `css/` and `js/` paths while the repository used `CSS/` and `JAVASCRIPT/`, with further filename mismatches. The rebuilt entry point uses `./assets/app.css` and `./assets/app.js`.

## Checks

```sh
node --check assets/app.js
node --test tests/app.test.cjs
```

The tests cover the task lifecycle, legacy storage, HTML escaping, asset paths, and focus controls. A real-browser visual check is still recommended before release.
