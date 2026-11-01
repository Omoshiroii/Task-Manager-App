# Taskflow

A calm, responsive daily task planner built with HTML, CSS, and JavaScript. No build step or account required.

## Use

Open the GitHub Pages URL, or serve this directory locally:

```sh
python3 -m http.server 8000
```

Visit http://localhost:8000. Press **N** to add a task. Tasks support notes, priorities, optional due dates, editing, completion, deletion with undo, search, and sorting. My day includes tasks due today and tasks completed today. Undated tasks live in All tasks. Overdue tasks have their own view.

The header clock shows your local time and date. When tasks are overdue, **Move to today** brings unfinished tasks into today’s plan; the notification offers undo to restore their original dates.

The dashboard charts completions over the last seven days and breaks open tasks down by priority. A 25-minute focus timer shows its expected finish time and supports pause and reset. The timer uses elapsed wall-clock time when browser tabs are throttled; keep the page open for the session.

## Appearance

Dark mode is the default, using Onyx (#000F08), Jet Black (#1C3738), Charcoal (#4D4847), Mint Cream (#F4FFF8), and Cool Steel (#8BAAAD). The sidebar theme button switches between dark and light modes. Your choice is saved on this device.

## Your data

Tasks are saved in a browser database on this device and load when you return to the same site in the same browser. Existing tasks saved under the original `taskflow_v1` key are imported automatically the first time. The database syncs open tabs on the same site. It does not sync across devices or browsers; export a JSON backup and import it on another device. Import merges by task ID without replacing existing tasks. If the browser does not support its local database, the app falls back to local storage. Browser data may be removed when you clear site storage, so export occasional backups for extra safety. Fonts use Google Fonts with local sans-serif fallbacks.

## GitHub Pages

The existing workflow deploys on pushes to `main`. In repository **Settings → Pages**, select **GitHub Actions** as the source. All app asset paths are relative and match their on-disk capitalization, so project URLs such as `/Task-Manager-App/` work.

The old page referenced lowercase `css/` and `js/` paths while the repository used `CSS/` and `JAVASCRIPT/`, with further filename mismatches. The rebuilt entry point uses `./assets/app.css` and `./assets/app.js`.

## Checks

```sh
node --check assets/app.js
node --test tests/app.test.cjs
```

The tests cover the task lifecycle, legacy storage, HTML escaping, asset paths, and focus controls. The suite also verifies overdue rescheduling and undo. The redesign was checked in Chromium on desktop and mobile, including both themes, task editing, and the live clock.
