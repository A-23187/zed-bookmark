# Zed-Bookmark

Zed-bookmark is a lightweight bookmark extension for the [Zed](https://zed.dev) editor, let you quickly add, manage bookmarks, and jump from bookmarks to source positions.

## Features
- **Add bookmarks** for the current cursor positions
- **Manage bookmarks** all bookmarks are stored in `.zed/bookmarks.txt`, manage them in the same way you edit the file
- **Go to source position** to jump from a bookmark to its source position, this is done by a custom language server
- **Stale bookmark detection** indicated via diagnostics (yellow squiggly underline) when a bookmark cannot be resolved

## Setup
1. Install the extension from the Zed extension marketplace
2. Configure the extension by adding the following tasks to your `.zed/tasks.json` (or `~/.config/zed/tasks.json` for all workspaces)
```json
[
  {
    "label": "Bookmark: Add bookmark",
    "command": "read -e -i \"$(sed -n \"${ZED_ROW}p\" \"${ZED_RELATIVE_FILE}\")\" && echo -e \"\\n$REPLY\\n${ZED_RELATIVE_FILE}:$((${ZED_ROW} - 1)):$((${ZED_COLUMN} - 1))\" >> .zed/bookmarks.txt",
    "env": {},
    "hide": "on_success",
    "reveal": "always"
  },
  {
    "label": "Bookmark: Find bookmark",
    "command": "zed",
    "args": [".zed/bookmarks.txt"],
    "env": {},
    "hide": "always",
    "reveal": "never"
  }
]
```

## License
Apache 2.0
