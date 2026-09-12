# Debugging the Rag Tutor API

This project can be run in normal mode or debug mode from VS Code.

## 1) Run the app directly in VS Code

Use the built-in debug config in VS Code:

- Open the Run and Debug panel
- Select `FastAPI: Debug`
- Press `F5`

This starts the app through Python and attaches the debugger automatically.

## 2) Run the app in debug mode from the terminal

Use the project Make target:

```bash
make debug
```

This launches the app through Poe and runs:

```bash
uv run python -m rag_tutor.main --debug
```

The app runs with reload enabled and debug logging.

## 3) Attach VS Code to an already running process

If the app is already running in a separate terminal, start a debugpy listener:

```bash
python -m debugpy --listen 5678 --wait-for-client -m uvicorn rag_tutor.main:app --host 127.0.0.1 --port 8005
```

Then in VS Code, create or use an attach configuration:

```json
{
  "name": "Attach to FastAPI",
  "type": "debugpy",
  "request": "attach",
  "connect": {
    "host": "127.0.0.1",
    "port": 5678
  },
  "justMyCode": true
}
```

Then select `Attach to FastAPI` and press `F5`.

## 4) Important note

Do not run a second server on the same port while the debugger is already attached. If a previous app is still running on port `8005`, stop it first before launching another instance.

## 5) Common commands

```bash
make dev
make debug
make lint
make test
```

## 6) Troubleshooting

- If VS Code cannot attach, ensure the app was started with `debugpy` or launched from VS Code.
- If the port is busy, stop the old process first.
- If reload causes confusion, run the app without `--debug` and attach to the single process.
