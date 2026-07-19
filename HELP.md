# Town Weaver — Setup and Usage Guide

## Quick start (30 seconds)

1. Open Town Weaver (GitHub Pages link once deployed)
2. If Ollama is running locally, it just works
3. If not, install Ollama first (see below)

## Setup A: Run Ollama locally (you use Town Weaver on your own machine)

### Step 1: Install Ollama

Visit https://ollama.ai and download the installer for your OS (Windows, macOS, Linux).

Run the installer and complete setup. Ollama will start automatically after installation.

### Step 2: Pull a model (do this once)

Open a terminal and run:

```bash
ollama pull mistral
```

This downloads Mistral (a capable open-source model, ~4 GB). Takes 5-10 minutes depending on your internet. You only need to do this once.

Alternative models (all work with Town Weaver):
- `ollama pull llama2` — Llama 2, slightly smaller, also good for structured tasks
- `ollama pull neural-chat` — Optimized for chat-style tasks, smaller download

### Step 3: Start Ollama

Ollama starts automatically after installation. You'll see it running in your system tray/menu bar (macOS/Windows) or as a background process (Linux).

To verify it's running, open a terminal and run:

```bash
curl http://localhost:11434/api/tags
```

If Ollama is running, you'll see a list of installed models (including `mistral`).

### Step 4: Open Town Weaver

Open https://emil3663.github.io/town-weaver/ in your browser.

If Ollama is running, the app will find it automatically. Generate a settlement and enjoy.

**Troubleshooting:** If it says "Ollama not found":
- Make sure Ollama is actually running (check system tray or run `ollama serve` in a terminal)
- Refresh the page
- If still stuck, go to Settings (⚙ in the top right) and confirm the URL shows `http://localhost:11434`

---

## Setup B: Shared Ollama instance (multiple people share one Ollama server)

**Who should do this:** If you want friends to use Town Weaver without each installing Ollama separately, one of you runs a shared server.

### Person A: The friend running the shared server

#### Step 1: Install Ollama (same as Setup A)

https://ollama.ai, download, install, run `ollama pull mistral`.

#### Step 2: Configure Ollama to accept remote connections

By default, Ollama listens only on `localhost` (your own machine). To let friends connect, it needs to listen on all network interfaces.

**macOS:**
- Ollama → Settings (gear icon in menu bar) → Advanced
- Set `OLLAMA_HOST=0.0.0.0:11434`
- Restart Ollama

**Windows:**
- Restart Ollama using environment variables. Open PowerShell as Administrator and run:
```bash
$env:OLLAMA_HOST='0.0.0.0:11434'
ollama serve
```
Leave this window open while running.

**Linux:**
- Edit `/etc/systemd/system/ollama.service` (or create it if it doesn't exist):
```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
```
Then reload: `sudo systemctl daemon-reload && sudo systemctl restart ollama`

#### Step 3: Find your machine's IP address

**macOS/Linux:**
Open terminal, run:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```
Look for something like `192.168.1.100` or `10.0.0.50`.

**Windows:**
Open PowerShell and run:
```bash
ipconfig
```
Look for "IPv4 Address" — something like `192.168.1.100`.

#### Step 4: Test the connection

From another machine on your network (or from a friend's computer if you're remote), open a terminal and run:

```bash
curl http://[your-ip]:11434/api/tags
```

Replace `[your-ip]` with the address from Step 3. If it works, you'll see the model list.

#### Step 5: Share the URL

Give your friends the URL in this format:

```
http://[your-ip]:11434
```

Example: `http://192.168.1.100:11434`

**Important notes:**
- If your friends are on a different network (not the same WiFi), this won't work without additional setup (VPN, port forwarding, etc.). For remote friends, see "Remote shared server" below.
- Ollama has no built-in authentication. Only share this URL with people you trust.

### Person B (and friends): Using the shared server

#### Step 1: Open Town Weaver

Go to https://emil3663.github.io/town-weaver/

#### Step 2: Go to Settings

Click the ⚙ (settings) button in the top right of the app.

#### Step 3: Change the Ollama URL

You'll see a field labeled "Ollama URL". It defaults to `http://localhost:11434`.

Replace it with the URL your friend shared (e.g., `http://192.168.1.100:11434`).

#### Step 4: Click "Test connection"

The app will verify it can reach Ollama. If it works, you're done.

#### Step 5: Generate away

Close settings and start generating settlements.

---

## Setup C: Remote shared server (for friends not on your home network)

If your friends are far away or on a different internet connection, running Ollama on a cheap cloud VPS is an option:

### Option C.1: Linode / DigitalOcean / similar

1. Spin up a $5-10/month virtual server (Ubuntu 24.04 is fine)
2. SSH in and install Ollama: `curl https://ollama.ai/install.sh | sh`
3. Run: `OLLAMA_HOST=0.0.0.0:11434 ollama serve`
4. Pull a model: `ollama pull mistral` (from a different SSH session)
5. Note the server's public IP (e.g., `203.0.113.42`)
6. Share `http://203.0.113.42:11434` with friends

**Cost:** ~$5–10/month for the server. Much cheaper than paying per-API-call if multiple people are generating lots of settlements.

**Important:** Ollama on a public IP is unprotected. Use a firewall to restrict access to trusted IPs, or use a VPN.

### Option C.2: You don't have a server? Claude Code can help.

If setting up a VPS sounds intimidating, you can ask Claude Code to help script the setup, or stick with local Ollama for now.

---

## Changing models

In the app's Settings (⚙), you can change which model Ollama uses. By default it's `mistral`. You can change it to:

- `llama2` (if you've installed it)
- `neural-chat`
- Any other model you've `ollama pull`'d

Try different models and see which generates settlements you like. Mistral is a good default.

---

## Troubleshooting

**"Ollama not found" / "Connection refused"**
- Make sure Ollama is running (`ollama serve` in a terminal, or check system tray)
- Verify the URL in Settings is correct
- Refresh the page

**"Invalid JSON from Ollama" / Settlement doesn't render**
- Ollama sometimes hallucinates extra text. The app tries to extract JSON. If it fails, try regenerating.
- Try a different model (some are better at JSON than others)
- If it keeps failing, let us know — this might be a parsing bug.

**Ollama is slow**
- First generation of a model takes longer (it's loading weights into memory)
- Subsequent generations are faster
- If your machine is slow, Mistral might struggle. Try `neural-chat` (smaller) or just wait longer.

**Friends can't connect to my shared server**
- Verify firewall isn't blocking port 11434
- Check your machine's IP address is correct
- If remote (different network), you may need port forwarding or a VPN

**I want to switch back to Claude API later**
- No problem. The app's prompts and settlement generation logic don't care whether they're calling Ollama or Claude. We can swap the backend endpoint and it'll just work.

---

## How it works (technical)

Town Weaver sends a text prompt to Ollama's `/api/generate` endpoint. Ollama returns generated text, which the app parses as JSON and renders as an interactive map.

The prompts are tier-aware (town, city, county seat, provincial capital) and each one explicitly tells Ollama to output valid JSON with no extra text.

Ollama runs locally by default, so your settlements are generated on your own machine — no data leaves your computer unless you choose a shared server.

---

## Questions or issues?

If something doesn't work, check this guide first. If you're still stuck, open an issue on the GitHub repo or ask Claude Code for help troubleshooting.

Happy settlement generating! 🏘️
