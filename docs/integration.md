# Tankkeeper integration

Tankkeeper keeps a fish tank's records in Home Assistant and gives Claude tools to read and change them. You talk to Claude; Claude uses the tools. This page covers the integration as it is built today: records, tools, conversations, history and undo.

## Use cases

- Tell Claude what you dosed or tested, and it records it straight away.
- Set up the tank, tap water, products and contents in a conversation, saying yes to each change.
- Ask Claude a question and get an answer from your own records, doses and past conversations.
- See what changed, who changed it and why, and undo a change.

## What it provides

- **Tools** for Claude, through Home Assistant's LLM API. Claude Code and Claude Desktop reach them through the [MCP Server](https://www.home-assistant.io/integrations/mcp_server/) integration. Assist reaches them when its conversation agent can control Home Assistant.
- **Two sensors** on a Tankkeeper service device:
  - **Proposals waiting:** how many proposals wait for a yes or a no.
  - **Last water test:** when the tank water was last tested. Tap water tests don't count.
- **Diagnostics:** record counts and settings, without notes, messages or reasons.

### Tools

Tools that record take effect straight away. Tools that propose return a summary and a confirm code; nothing changes until Claude calls `apply_change` with that code, after you say yes. A code works only for the person and the conversation that made the proposal, for 15 minutes, and allows 5 wrong tries.

Every tool name starts with `tankkeeper__`.

| Tool | What it does |
|---|---|
| `get_tank` | The tank's details, the water values, how many records there are and how many proposals wait. |
| `list_products` | Every product with its label dose, your dose, notes, and the label dose worked out for the tank's dosing volume. |
| `list_contents` | Plants, rocks, wood, substrate, decorations and fish in the tank. |
| `get_log` | Doses and water tests, newest first, optionally between two dates. |
| `list_notes` | Open questions and assumptions about the tank. |
| `list_proposals` | Proposed changes, newest first, without their confirm codes. |
| `get_history` | The newest changes, with the record before and after, who made each change and in which conversation. |
| `list_conversations` | Past conversations about the tank, newest first. |
| `get_conversation` | A past conversation, its key messages and the changes made in it. |
| `search_conversations` | Past conversations that mention some words, newest first. |
| `record_dose` | Record a dose. |
| `record_test` | Record water test results: ammonia, nitrite, nitrate and phosphate in mg/l, KH in dKH, GH in dGH, and pH. |
| `add_content` | Record something put in the tank. |
| `add_note` | Record an open question or an assumption. |
| `save_conversation` | Start a conversation, or add a title, summary and key messages to one. Up to 20 messages a call and 200 a conversation. |
| `set_tank` | Propose new tank details. |
| `set_water` | Propose new tap water values. |
| `add_product` | Propose a new product. |
| `update_product` | Propose changes to a product. |
| `update_content` | Propose changes to a contents item, such as a new count. |
| `remove_content` | Propose taking an item out. It stays in the records with the date it came out. |
| `undo_change` | Propose putting back what an earlier change did. |
| `apply_change` | Apply a proposal with its confirm code. |
| `reject_change` | Close a proposal you said no to. Only the person who made it can. |

## Installation

### HACS

1. In HACS, open the menu, choose **Custom repositories**, and add `https://github.com/markwallsgrove/tankkeeper` as an **Integration**.
2. Download **Tankkeeper**, then restart Home Assistant.

### Manual

1. Copy `custom_components/tankkeeper` into your Home Assistant `config/custom_components/` folder.
2. Restart Home Assistant.

### Set up

1. Go to **Settings > Devices & services > Add integration** and choose **Tankkeeper**.
2. Fill in the form (see the parameters below). You can set up one tank.
3. To use the tools from Claude Code or Claude Desktop, set up the **MCP Server** integration and, in its options, choose **Tankkeeper** (only the tank's tools) or **Assist** (Tankkeeper's tools are added to Assist's). Choose one of the two, not both.

### Parameters

| Parameter | Description |
|---|---|
| Name | What you call the tank, for example Office tank. |
| Tank volume | The tank's full volume in litres, from the box or the maker. |
| Volume for dosing | The water volume in litres that doses are worked out for. Usually a little less than the tank volume, once substrate and decor are in. It can't be larger than the tank volume. |

To change them later, open the integration and choose **Reconfigure**. The old values stay in the history.

There are no options.

## How data updates

Nothing is polled. The records live in Home Assistant storage (`.storage/tankkeeper.<entry id>`) and are part of Home Assistant backups. Each change is saved straight away, and the sensors update when it is saved.

## Examples

Log as you go:

```text
› I gave 1.3 ml of Easy Green this morning and the nitrate test says 10
  tankkeeper__record_dose · tankkeeper__record_test
Recorded the dose at 08:00 and nitrate at 10 mg/l.
```

Change something, with a yes first:

```text
› the dosing volume is 54 litres now, not 60
  tankkeeper__set_tank
I'll change the dosing volume from 60 to 54 litres. Shall I save it?
› yes
  tankkeeper__apply_change
Saved.
```

An automation that reminds you when proposals wait:

```yaml
triggers:
  - trigger: numeric_state
    entity_id: sensor.office_tank_proposals_waiting
    above: 0
actions:
  - action: notify.notify
    data:
      message: "Tankkeeper has {{ states('sensor.office_tank_proposals_waiting') }} proposals waiting."
```

## Known limitations

- One tank per Home Assistant.
- Proposals can only be accepted in the conversation that made them. A proposal whose code has expired, or that had too many wrong codes, stays waiting until it is rejected. Make it again to get a new code.
- Over MCP, a conversation is known only by the `conversation_id` Claude passes. Proposals made without one can be applied from any conversation by the same Home Assistant user.
- No calendar, reminders, light schedule, rules, status, panel or camera yet. See the [design](design.html).
- Conversations and the records Claude reads are sent to Anthropic when you talk to Claude.

## Troubleshooting

- **Claude can't see the tools.** Check that Tankkeeper is loaded, and that the MCP Server integration or Assist uses the Tankkeeper or Assist API. Reload the MCP Server integration after you change its options.
- **"The confirm code does not match" or "expired".** Ask Claude to make the proposal again.
- **"The proposal belongs to another conversation".** Apply it from the conversation that made it, or reject it and make it again.
- **Something else.** Download the diagnostics from the integration's menu and [open an issue](https://github.com/markwallsgrove/tankkeeper/issues). Diagnostics leave out your notes and messages.

## Removal

1. Go to **Settings > Devices & services > Tankkeeper**, open the menu and choose **Delete**. This deletes the tank's records. Make a backup first if you want to keep them.
2. If you installed with HACS, remove Tankkeeper in HACS. Otherwise delete `config/custom_components/tankkeeper`.
3. Restart Home Assistant.
