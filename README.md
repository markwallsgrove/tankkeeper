# 🐠 Tankkeeper

**Talk to Claude about your fish tank.**

[![HACS][hacsbadge]][hacs]
[![Home Assistant][ha-shield]][ha]
[![MCP first][mcp-shield]][mcp]
[![Status][status-shield]][design]
[![Quality scale][quality-shield]][quality]
[![License][license-shield]][license]

[![Project Maintenance][maintenance-shield]][profile]
[![BuyMeCoffee][buymecoffeebadge]][buymecoffee]

Tankkeeper will be a Home Assistant integration for a planted aquarium. You tell Claude what's in your tank and what you did today, and Tankkeeper keeps the plan, the log and the reminders, watches the water, and tells you when something needs you.

You don't fill in forms. You have a conversation.

> [!IMPORTANT]
> Tankkeeper is early. Records, tools, conversations, history and undo work today; see [what the integration does now](docs/integration.md). The rest is in the [design](docs/design.html). [Open an issue](https://github.com/markwallsgrove/tankkeeper/issues/new) if you have ideas or want to help test it.

## 🤔 The problem

Keeping a planted tank healthy means keeping track of a lot of small things:

- Doses of fertiliser, liquid carbon, bacteria and conditioner, each with its own schedule and dose for your tank's volume.
- Water tests: ammonia, nitrite, nitrate, pH, KH, GH. What the numbers mean, and what to do when one moves.
- What's in the tank: plants, wood, rocks, substrate, later fish. Each one changes the water.
- Why you made each choice, so you don't argue with yourself next month.

Most people keep this in their head, a notebook or a spreadsheet. Apps exist, but they are forms to fill in, and they don't know your tank. When a test comes back odd, you are on your own with a forum thread.

## 💡 The idea

This is the plan. Put the tank's records in Home Assistant, give Claude tools to read and change them, and make the conversation the main way in.

- **MCP first.** Everything you can see or do in Tankkeeper, Claude can see and do through its tools. The panel is there as a fallback, not the main way in.
- **It knows your tank.** Claude answers from your own records: your products and doses, your test history, your plants and wood, and the decisions you made.
- **You stay in charge.** Claude records what you tell it straight away. Anything else, like a new dose, a plan change or a new light schedule, it reads back first and saves only when you say yes. Every change can be undone.
- **It remembers.** Every conversation is kept with the changes it made. You can read old ones, and Claude reads them to remember what you discussed.
- **Your data stays yours.** Home Assistant holds the records, and its backups include them. It is built to work behind Tailscale, with nothing exposed to the internet. When you talk to Claude, the conversation and the records it reads are sent to Anthropic.

## 💬 Ways to talk to it

| Where | How | Paid with |
|---|---|---|
| 📱 Phone | Home Assistant app: Assist chat, the Tankkeeper panel, reminder notifications with Complete and Skip | Anthropic API key |
| 🌐 Browser | Home Assistant in any browser: the same Assist chat and panel | Anthropic API key |
| 💻 Claude Code | Home Assistant's MCP server | Your Claude plan |
| 🖥️ Claude Desktop | The same MCP server, as a local MCP server: a small proxy on your computer reaches Home Assistant over your network or Tailscale. Not a custom connector: those connect from Anthropic's cloud and can't reach a private Home Assistant | Your Claude plan |

## ✨ What you'll be able to do

**Set up by talking.** Tell Claude about your tank, water, products, plants and hardscape. It asks one thing at a time and sets everything up. Already keep notes? Point Claude Code at them and it reads them in.

```text
› set up my tank from my notes
  set_tank · set_water · add_product ×5 · add_content ×11 · set_light · set_reminders
Ready: 1 tank, 5 products, 11 items, light 12:00–20:00. Shall I save it?
› yes
Saved. Tankkeeper is live.
```

**Log as you go.** "Topped up 5 litres, used 1.3 ml conditioner, water looks a bit yellow." Claude marks the task complete, logs the dose, notes the colour and tells you it's probably tannins from the wood.

**Know where you stand.** Rules check the tank every time something changes and set a status: ✅ On course, 👀 Watch or 🚨 Act. You get a notification when it changes, with what to do next.

**Get feedback after every test.** Log your readings and get the rules' result straight away (free), plus an optional comment from Claude on what the numbers mean for your tank.

**Never miss a dose.** Tankkeeper owns a calendar and sends a reminder for each task. Press and hold the notification to Complete or Skip.

**Change anything, any time.** Added a plant, swapped a fertiliser, moved a rock? Just say so. Claude reads the change back, you say yes, it's done.

**Ask anything.** "Should I do a water change?" "Why is my pH dropping?" "Is it safe to add fish yet?" Claude answers from your records and your decisions, not a generic guide.

**Look back.** The Conversations tab shows every conversation, where it happened and what it changed, with undo.

**Optional extras:**

- 💡 **Light:** tell it which lights the tank has. It runs the schedule and keeps a 30-day on/off history. Claude can suggest a better schedule; you decide.
- 📷 **Camera:** a cheap IP camera on the side glass. Claude looks at a photo and flags things like algae, cloudy water or a plant melting, with a suggested fix.

## 🎁 Why it's worth it

- **Less to remember.** The plan, the doses and the reminders live in one place.
- **Fewer mistakes.** Doses are worked out for your tank's volume, and rules catch a bad reading the moment you log it.
- **Advice that fits.** Claude knows your tank, your products and your history.
- **A record you can trust.** Every change keeps the old version, who made it, when, and why.
- **Faster than an app.** Saying what you did takes seconds. No forms.

## 📋 Requirements

- Home Assistant with the [MCP Server](https://www.home-assistant.io/integrations/mcp_server/) integration, for Claude Code and Claude Desktop.
- An [Anthropic API key](https://console.anthropic.com/), for Assist chat and review comments. Optional: the panel, reminders and rules work without it.
- [Tailscale](https://tailscale.com/), or another private way to reach Home Assistant, if you want to talk to it away from home.

## 📦 Installation

Tankkeeper installs through [HACS][hacs] as a custom repository:

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=markwallsgrove&repository=tankkeeper)

1. In HACS, open the menu, choose **Custom repositories**, and add `https://github.com/markwallsgrove/tankkeeper` as an **Integration**.
2. Download **Tankkeeper**, then restart Home Assistant.
3. Go to **Settings > Devices & services > Add integration** and choose **Tankkeeper**.

See [the integration docs](docs/integration.md) for the MCP Server set-up and the tools.

## 🗺️ Roadmap

The [design](docs/design.html) sets out the build order:

1. Check the risky parts: MCP sign-in, custom tools over MCP, a custom Assist agent.
2. Records, tools and conversations, with history and undo.
3. Calendar and reminders.
4. Light (optional).
5. Rules and status.
6. Proposals and setup by conversation.
7. Panel (fallback).
8. Assist agent and Claude's review comments.
9. Camera (optional).

## 🏆 Quality

Tankkeeper aims for Platinum, the highest tier of Home Assistant's [integration quality scale][quality]. Home Assistant grades only core integrations, so this is our own target. From the first line of code:

- Every quality scale rule is tracked in `quality_scale.yaml`. A test checks that each rule is done or exempt with a reason, and that the code backs the done rules. `hassfest` and the HACS action run on every PR.
- Fully typed, checked with mypy in strict mode.
- Fully asynchronous.
- Every line covered by tests, including property-based tests with [Hegel](https://hegel.readthedocs.io), through its Python package [`hegeltest`](https://pypi.org/project/hegeltest/).
- Every change reviewed twice, by Claude and by Codex, before it merges.

## 🤝 Contributing

Ideas, questions and testers are welcome. [Open an issue](https://github.com/markwallsgrove/tankkeeper/issues).

## 📄 License

[MIT][license]. Use it, copy it, change it.

## ☕ Support

Tankkeeper is a free side project. If it saves your fish, or your weekend, you can [buy me a coffee][buymecoffee].

---

Tankkeeper is not made by or linked to Anthropic or Home Assistant. Claude can make mistakes: check advice that matters, and always follow the label on the bottle.

[hacs]: https://hacs.xyz
[hacsbadge]: https://img.shields.io/badge/HACS-Custom-orange.svg
[ha]: https://www.home-assistant.io/
[ha-shield]: https://img.shields.io/badge/Home%20Assistant-integration-41BDF5.svg?logo=home-assistant
[mcp]: https://modelcontextprotocol.io/
[mcp-shield]: https://img.shields.io/badge/MCP-first-0b7a75.svg
[design]: docs/design.html
[status-shield]: https://img.shields.io/badge/status-design-yellow.svg
[maintenance-shield]: https://img.shields.io/badge/maintainer-markwallsgrove-blue.svg
[profile]: https://github.com/markwallsgrove
[quality]: https://developers.home-assistant.io/docs/core/integration-quality-scale/
[quality-shield]: https://img.shields.io/badge/quality%20scale-platinum%20(target)-8a8a8a.svg
[license]: LICENSE
[license-shield]: https://img.shields.io/github/license/markwallsgrove/tankkeeper.svg
[buymecoffee]: https://www.buymeacoffee.com/markwallsgrove
[buymecoffeebadge]: https://img.shields.io/badge/buy%20me%20a%20coffee-donate-yellow.svg?logo=buy-me-a-coffee
