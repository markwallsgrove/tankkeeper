# Tankkeeper integration

Tankkeeper keeps a fish tank's records in Home Assistant and gives Claude tools to read and change them. You talk to Claude; Claude uses the tools. This page covers the integration as it is built today: records, tools, conversations, history and undo, the plan calendar, reminders and the light.

## Use cases

- Tell Claude what you dosed or tested, and it records it straight away.
- Set up the tank, tap water, products and contents in a conversation, saying yes to each change.
- Ask Claude a question and get an answer from your own records, doses and past conversations.
- See what changed, who changed it and why, and undo a change.
- Keep the plan in a calendar, tick off today's tasks, and get a reminder with Complete and Skip on your phone.
- Let Tankkeeper switch the tank light on its schedule, and know when the light does not follow it.

## What it provides

- **Tools** for Claude, through Home Assistant's LLM API. Claude Code and Claude Desktop reach them through the [Model Context Protocol](https://www.home-assistant.io/integrations/mcp_server/) integration. Assist reaches them when its conversation agent can control Home Assistant.
- **Entities** on a Tankkeeper service device:
  - **Proposals waiting** (sensor): how many proposals wait for a yes or a no.
  - **Last water test** (sensor): when the tank water was last tested. Tap water tests don't count.
  - **Plan** (`calendar.tankkeeper`): every task as a 30-minute event at its slot time. A done task's title starts with `Complete:` or `Skip:`, and its note is the description. You can add, change and delete tasks in the calendar. Tasks can't repeat.
  - **Today** (`todo.tankkeeper_today`): today's tasks. Tick an item to complete its task. Tick it with a description that starts with `Skip` to skip it; the rest of the description is the note.
  - **Next light change** (sensor, only with a light): when a light next turns on or off, and which lights.
  - **Light problem** (binary sensor, only with a light): on when a light's entity is unavailable or did not switch. The `problems` attribute lists each light with when it became unavailable and the change it missed.
- **Reminders** to the notify services you choose (see [options](#options)).
- **A repair issue** for each light that does not follow its schedule. It clears by itself.
- **Diagnostics:** record counts and settings, without notes, messages or reasons.

### Tools

Tools that record take effect straight away. Tools that propose return a summary and a confirm code; nothing changes until Claude calls `apply_change` with that code, after you say yes. A code works only for the person and the conversation that made the proposal, for 15 minutes, and allows 5 wrong tries.

Every tool name starts with `tankkeeper__`.

| Tool | What it does |
|---|---|
| `get_tank` | The tank's details, the water values, how many records there are and how many proposals wait. |
| `list_products` | Every product with its label dose, your dose, notes, and the label dose worked out for the volume of water in the tank. |
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
| `get_plan` | Tasks between two dates, 7 days from today by default, with their times and the reminder settings. |
| `complete_task` | Record a task as complete, with an optional note. |
| `skip_task` | Record a task as skipped, with an optional note. |
| `add_task` | Propose a new task for a day, in the task or dose slot. |
| `update_task` | Propose changes to a task: text, day, slot, state or note. |
| `remove_task` | Propose taking a task out of the plan. |
| `set_reminders` | Propose the notify services and the task, dose and resend times. |
| `get_light` | The lights, today's schedule, the dose time, the next change, the problems, and the on/off log and changes with their reasons. 7 days by default, up to 30. Listed only when a light is set. |
| `set_light` | Propose adding, changing or removing a light, a change for one day, or cancelling it. No tool switches the light. |
| `import_plan` | Propose tasks copied from another calendar, such as `calendar.fish_tank`. `Complete:` and `Skip:` titles keep their state. 7 days back to 30 days ahead by default. |

### Tasks and slots

A task is due in one of two slots: **task** (09:00 by default) or **dose** (12:00 by default). A task whose text is a product name and an amount in ml, such as `Bio-CO2 1.5 ml`, is a dose. In the calendar, a task you add at the dose or task time takes that slot.

### Light

A light is a `light` or `switch` entity, its model, its control and a daily schedule. The control is **on/off**, **dimmable** (brightness and ramp) or **colour** (brightness, ramp and colour). The light turns on and off on the same day. The ramp fades the light in at on and out at off.

- Tankkeeper switches the light itself. At startup, after a schedule change and when the entity comes back, it puts the light in the state the schedule wants. A switch by hand stays until the next change.
- A one-day change sets other times, and maybe a brightness, for one day. The next day the light goes back to its schedule. A light has one one-day change at a time.
- Tankkeeper keeps a 30-day on/off log, with who switched the light: the schedule or something else.
- If the entity is unavailable, or a switch fails, the schedule stays as it is. The change is logged as missed, the light problem sensor turns on and a repair issue opens. When the entity comes back, Tankkeeper makes the missed change, late.
- With a light, doses are due when the earliest light turns on, the one-day change included. Without one, they use the dose time.

### Reminders

At the task time, each open task for today in the task slot is sent, and open tasks from the last 7 days are sent as *not confirmed*. At the dose time, each open dose is sent. At the resend time (21:00 by default), each of today's tasks still open is sent again as *not complete yet*.

A reminder has **Complete** and **Skip** actions (Home Assistant Companion app). Press one on any device and Tankkeeper records it and clears the reminder on every device. A task done another way (Claude, the calendar, the to-do list) clears its reminders too.

## Installation

### HACS

1. In HACS, open the menu, choose **Custom repositories**, and add `https://github.com/markwallsgrove/tankkeeper` as an **Integration**.
2. Download **Tankkeeper**, then restart Home Assistant.

### Set up

1. Go to **Settings > Devices & services > Add integration** and choose **Tankkeeper**.
2. Fill in the form (see the parameters below). You can set up one tank.
3. To use the tools from Claude Code or Claude Desktop, set up the **Model Context Protocol** integration and, in its options, choose **Tankkeeper** (only the tank's tools) or **Assist** (Tankkeeper's tools are added to Assist's). Choose one of the two, not both.

### Parameters

| Parameter | Description |
|---|---|
| Name | What you call the tank, for example Office tank. |
| What's the volume of your tank? | In litres, as given on the box or by the maker. |
| What's the volume of water in your tank? | In litres. Gravel, rocks and wood take up space, so this is less than the volume of the tank. Doses are worked out for this volume. If you don't know it, use about 10% less than the volume of the tank. |

To change them later, open the integration and choose **Reconfigure**. The old values stay in the history.

### Options

Open the integration and choose **Configure**. Changes made here apply straight away, with no proposal and no reason.

**Reminders.** Claude can propose the same with `set_reminders`.

| Option | Description |
|---|---|
| Devices | The notify services that get reminders, such as `mobile_app_phone`. None means no reminders. |
| Task time | When tasks are sent. |
| Dose time | When doses are sent when no light is set. |
| Resend time | When tasks still open are sent again. |

**Lights.** Add, change or remove a light, or change it for one day. Claude can propose the same with `set_light`.

| Option | Description |
|---|---|
| Entity | The `light` or `switch` entity. Dimmable and colour need a `light`. |
| Model | The light's make and model. |
| Control | On/off, dimmable or colour. |
| On, Off | When the light turns on and off each day. |
| Brightness | 1 to 100%. Dimmable and colour only. |
| Ramp | Minutes to fade in and out. Dimmable and colour only. |
| Colour | Colour lights only. |

## How data updates

Nothing is polled. The records live in Home Assistant storage (`.storage/tankkeeper.<entry id>`) and are part of Home Assistant backups. Each change is saved straight away, and the entities update when it is saved. The to-do list and the dose time move to the next day at midnight. The light entities update when a light changes state, and come and go with the lights.

## Examples

Log as you go:

```text
› I gave 1.3 ml of Easy Green this morning and the nitrate test says 10
  tankkeeper__record_dose · tankkeeper__record_test
Recorded the dose at 08:00 and nitrate at 10 mg/l.
```

Change something, with a yes first:

```text
› there are 54 litres of water in the tank now, not 60
  tankkeeper__set_tank
I'll change the volume of water from 60 to 54 litres. Shall I save it?
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
- No rules, status, panel or camera yet. See the [design](design.html). A light problem raises a repair issue, but sends no notification yet.
- A light turns on and off on the same day. A schedule over midnight is not possible.
- Tankkeeper does not check that a light or plug really changed. It trusts the entity's state.
- A switch is logged as made by the schedule only when the device reports it with Tankkeeper's action. A device that reports later shows it as made by something else.
- The light problem state is kept in memory. After a restart Tankkeeper checks each light again.
- Calendar and to-do edits are recorded as made in the panel, without the Home Assistant user.
- Reminders sent before a restart are not cleared on other devices after it.
- Tasks can't repeat. Add one for each day, or ask Claude to.
- Conversations and the records Claude reads are sent to Anthropic when you talk to Claude.

## Troubleshooting

- **Claude can't see the tools.** Check that Tankkeeper is loaded, and that the Model Context Protocol integration or Assist uses the Tankkeeper or Assist API. Reload the Model Context Protocol integration after you change its options, then start a new Claude session: Claude loads the tools only when a session starts.
- **"The confirm code does not match" or "expired".** Ask Claude to make the proposal again.
- **"The proposal belongs to another conversation".** Apply it from the conversation that made it, or reject it and make it again.
- **No reminders.** Check that the device is chosen in the options, and that its `notify.mobile_app_…` action works from **Developer tools > Actions**.
- **Complete or Skip did nothing.** The task may be done already, or removed; the reminder is cleared anyway. Check the task in `calendar.tankkeeper`.
- **"Tankkeeper tasks can't repeat".** Add a single event for each day.
- **Light problem is on.** Check that the light or plug has power and shows in Home Assistant. Read the `problems` attribute to see what was missed. The problem clears when the light is in the state its schedule wants.
- **Something else.** Download the diagnostics from the integration's menu and [open an issue](https://github.com/markwallsgrove/tankkeeper/issues). Diagnostics leave out your notes and messages.

## Removal

1. Go to **Settings > Devices & services > Tankkeeper**, open the menu and choose **Delete**. This deletes the tank's records. Make a backup first if you want to keep them.
2. Remove Tankkeeper in HACS.
3. Restart Home Assistant.
