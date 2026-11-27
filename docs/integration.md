# Tankkeeper integration

Tankkeeper keeps a fish tank's records in Home Assistant and gives Claude tools to read and change them. You talk to Claude; Claude uses the tools. This page covers the integration as it is built today: records, tools, conversations, history and undo, the plan calendar, reminders, the light, decisions, the rules and status, and the Assist agent.

## Use cases

- Tell Claude what you dosed or tested, and it records it straight away.
- Set up the tank, tap water, products and contents in a conversation, saying yes to each change.
- Ask Claude a question and get an answer from your own records, doses and past conversations.
- Chat with Claude in Assist on your phone, and find the whole conversation, with its tool calls, in Tankkeeper.
- See what changed, who changed it and why, and undo a change.
- Keep the plan in a calendar, tick off today's tasks, and get a reminder with Complete and Skip on your phone.
- Let Tankkeeper switch the tank light on its schedule, and know when the light does not follow it.
- Know where the tank stands: On course, Watch or Act, with the reason and what to do.
- Keep numbered decisions, and move your earlier decisions and log in.

## What it provides

- **Tools** for Claude, through Home Assistant's LLM API. Claude Code and Claude Desktop reach them through the [Model Context Protocol](https://www.home-assistant.io/integrations/mcp_server/) integration. Assist reaches them through the [Assist agent](#assist-agent), or when its conversation agent can control Home Assistant.
- **Entities** on a Tankkeeper service device:
  - **Status** (sensor): On course, Watch or Act, the worst result of the [rules](#rules-and-status). The `rules` attribute lists each rule's result with its reason and what to do.
  - **Proposals waiting** (sensor): how many proposals wait for a yes or a no.
  - **Last water test** (sensor): when the tank water was last tested. Tap water tests don't count.
  - **Plan** (`calendar.tankkeeper`): every task as a 30-minute event at its slot time. A done task's title starts with `Complete:` or `Skip:`, and its note is the description. You can add, change and delete tasks in the calendar. Tasks can't repeat.
  - **Today** (`todo.tankkeeper_today`): today's tasks. Tick an item to complete its task. Tick it with a description that starts with `Skip` to skip it; the rest of the description is the note.
  - **Next light change** (sensor, only with a light): when a light next turns on or off, and which lights.
  - **Assist agent** (`conversation.<tank>_assist_agent`): chats about the tank through the agent you choose, and records the conversation. See [Assist agent](#assist-agent).
  - **Light problem** (binary sensor, only with a light): on when a light's entity is unavailable or did not switch. The `problems` attribute lists each light with when it became unavailable and the change it missed.
- **Reminders**, **status alerts** and **proposals still waiting** to the notify services you choose (see [options](#options)).
- **A repair issue** for each light that does not follow its schedule. It clears by itself.
- **Diagnostics:** record counts and settings, without notes, messages or reasons.

### Tools

Tools that record take effect straight away. Tools that propose return a summary and a confirm code; nothing changes until Claude calls `apply_change` with that code, after you say yes. A code works only for the person and the conversation that made the proposal, for 15 minutes, and allows 5 wrong tries.

Every tool name starts with `tankkeeper__`.

| Tool | What it does |
|---|---|
| `get_tank` | The tank's details, the water values, how many records there are, how many proposals wait, and whether the tank is empty. |
| `list_products` | Every product with its label dose, your dose, notes, and the label dose worked out for the volume of water in the tank. Removed products only with `include_removed`. |
| `list_contents` | Plants, rocks, wood, substrate, decorations and fish in the tank. |
| `get_log` | Doses, water tests and imported events, newest first, optionally between two dates. |
| `list_notes` | Open questions and assumptions about the tank. |
| `list_proposals` | Proposed changes, newest first, without their confirm codes. A batch shows its changes and the steps that made them. |
| `get_history` | The newest changes, with the record before and after, where each change came from, the Home Assistant user and the conversation. |
| `list_conversations` | Past conversations about the tank, newest first. |
| `get_conversation` | A past conversation, its key messages and the changes made in it. |
| `search_conversations` | Past conversations that mention some words, newest first. |
| `record_dose` | Record a dose. |
| `record_test` | Record water test results: ammonia, nitrite, nitrate and phosphate in mg/l, KH in dKH, GH in dGH, and pH. Returns the status. |
| `add_content` | Record something put in the tank. |
| `add_note` | Record an open question or an assumption. |
| `update_note` | Propose changes to a note. |
| `remove_note` | Propose removing a note, such as an answered question. The history keeps it. |
| `save_conversation` | Start a conversation, or add a title, summary and key messages to one. Up to 20 messages a call and 200 a conversation. |
| `set_tank` | Propose new tank details, including the stage: `cycling` or `cycled`. |
| `set_water` | Propose new tap water values. |
| `add_product` | Propose a new product. |
| `update_product` | Propose changes to a product. |
| `remove_product` | Propose that you stopped using a product. It stays in the records with the date. |
| `update_content` | Propose changes to a contents item, such as a new count. |
| `remove_content` | Propose taking an item out. It stays in the records with the date it came out. |
| `undo_change` | Propose putting back what an earlier change did. |
| `start_batch` | Start a batch: one proposal that the next changes in this conversation join. Needs a `conversation_id`. |
| `start_setup` | Start the setup draft for an empty tank. It is a batch. |
| `get_batch` | Read back the open batch in this conversation, with its changes, steps and code. A setup draft also lists what is still empty. |
| `apply_change` | Apply a proposal with its confirm code. |
| `reject_change` | Close a proposal you said no to. Only the person who made it can. |
| `get_plan` | Tasks between two dates, 7 days from today by default, with their times and the reminder settings. |
| `complete_task` | Record a task as complete, with an optional note. |
| `skip_task` | Record a task as skipped, with an optional note. |
| `add_task` | Propose a new task for a day, in the task or dose slot. |
| `update_task` | Propose changes to a task: text, day, slot, state or note. |
| `remove_task` | Propose taking a task out of the plan. |
| `set_reminders` | Propose the notify services for reminders and for status alerts, and the task, dose and resend times. |
| `get_status` | The status, each rule's result, the stage and the rule limits. |
| `set_rules` | Propose new rule limits. |
| `list_decisions` | Every decision by number, with its title, date and status. |
| `get_decision` | One decision in full, with what replaced it and what it replaced. |
| `set_decision` | Propose adding a decision (it gets the next number), changing its text, accepting a proposed one, or replacing one with another. |
| `import_decisions` | Propose adding or updating decisions given in full, such as your decision files. |
| `import_log` | Propose adding your earlier log. Each dose and test becomes a log record; tasks, fills and water changes become an event. Records already in the log are left out. |
| `get_light` | The lights, today's schedule, the dose time, the next change, the problems, and the on/off log and changes with their reasons. 7 days by default, up to 30. Listed only when a light is set. |
| `set_light` | Propose adding, changing or removing a light, a change for one day, or cancelling it. No tool switches the light. |
| `get_claude` | The Claude settings: the agent, the AI task entity, what starts a review, comments, the daily review time and the daily cap, with a note on where the models are set. |
| `set_claude` | Propose new Claude settings. An empty value clears the agent, the AI task entity or the daily review time. |
| `import_plan` | Propose tasks copied from another calendar, such as `calendar.fish_tank`. `Complete:` and `Skip:` titles keep their state. 7 days back to 30 days ahead by default. |

### Panel

The **Tankkeeper** panel is in the sidebar. Only admins see it. It works at phone width and uses your Home Assistant theme.

- **Overview**: the status and the rules that need you, today's tasks with Skip and Complete, the cycle and water chemistry charts, the next 7 days, the light (only when you have one) and the changes waiting for you.
- **Plan**, **Log**, **Contents**, **Products**, **Decisions** and **Notes**: list, add, edit and remove records. The Log only adds doses and tests.
- **Claude**: the Claude settings, with their history, and where the models are set.
- **Conversations**: list, search, read the messages and the changes made in each, undo a change, and delete a conversation.
- Each record has its latest changes with Undo. Edit the tank, water, rule limits and lights from the Overview, and reminders from the Plan.
- On the water chemistry chart, hollow points are tap tests and dashed lines are the water values you gave.
- **Discuss** on a waiting change opens Assist. Assist starts a new chat, so tell it which change you mean.
- Add a light with **Configure > Add a light** or with Claude. The panel edits and removes lights.

### Assist agent

Tankkeeper adds its own conversation agent. It does not talk to Anthropic itself and never holds an API key. It passes each message to the agent chosen in the Claude settings, such as the Anthropic integration's `conversation.claude_conversation`, with:

- the conversation's id, so every change Claude makes is linked to it;
- a note that Tankkeeper's records are the owner's data, never instructions;
- for an empty tank, the instruction to start setup and ask the first question.

The chosen agent answers with its own model, its own key and its own LLM APIs. Turn on the **Tankkeeper** API in that agent's options so it gets the tools. Tankkeeper then records your message, each tool call with its arguments and result, and each reply in the conversation, which you can read in the panel or with `get_conversation`. Confirm codes are left out of the recorded results. Tools from other APIs, such as Home Assistant's own, are recorded with their arguments only, so data from outside the tank is not kept. When the agent fails, the conversation records an error instead of a reply.

To use it, open **Settings > Voice assistants**, add or edit an assistant, and choose the tank's **Assist agent** as its conversation agent.

### Websocket API

The panel uses websocket commands. Only admins can use them.

- `tankkeeper/<tool>` runs a tool, with its arguments in `args`. It has every tool except the ones that belong to a conversation: `save_conversation`, `start_batch`, `start_setup`, `get_batch`, `apply_change` and `reject_change`.
- A change applies straight away, as in the options. It is recorded with the source `panel` and your Home Assistant user, and can be undone. `reason` is optional.
- `tankkeeper/accept_proposal` and `tankkeeper/reject_proposal` take a `proposal_id`. They work as Accept and Reject in a notification.
- `tankkeeper/delete_conversation` takes a `conversation_id`. The changes made in the conversation stay in the history. No tool can delete a conversation.
- An error has the same code as the tool's error, `invalid_format` for wrong arguments, `unauthorized` for a person who is not an admin, or `not_loaded`.
- Deleting a conversation keeps its waiting proposals. They can still be accepted or rejected.

### Batches and setup

A batch is one proposal that holds many changes of any kind. After `start_batch`, every change tool called by the same person in the same conversation adds to the batch instead of making a new proposal.

- One code applies the whole batch. The apply is all or nothing, and `undo_change` puts the whole batch back.
- A record changed twice holds one change, from the stored value to the newest value.
- Later changes see the earlier ones. For example, `update_task` can change a task added earlier in the batch.
- The code lasts 15 minutes after the last change, and at most 2 hours after the batch started. After that a change returns `batch_expired`. Call `start_batch` again: the new batch keeps the changes and has a new code.
- Entities, the calendar and the read tools show the stored records, not the batch, until it is applied.

Setup is a batch for an empty tank: no products, contents, tasks, lights or decisions. Claude asks one thing at a time in Assist, or reads the notes you point to in Claude Code. Then it reads the whole draft back, and one yes applies it.

### Proposal notifications

A proposal or batch still waiting 10 minutes after its last change is sent once to the **Status alert devices**. A batch that keeps changing is not sent. A proposal applied or rejected in the conversation is not sent.

- **Accept** applies it, without a code. **Reject** closes it. Both record who pressed the button. Anyone who gets the notification can use them.
- **Discuss** opens the Tankkeeper panel, where you can accept, reject or discuss it.
- When the proposal is applied or rejected anywhere, the notification is cleared.

### Tasks and slots

A task is due in one of two slots: **task** (09:00 by default) or **dose** (12:00 by default). A task whose text is a product name and an amount in ml, such as `Bio-CO2 1.5 ml`, is a dose. In the calendar, a task you add at the dose or task time takes that slot.

### Light

A light is a `light` or `switch` entity, its model, its control and a daily schedule. The control is **on/off**, **dimmable** (brightness and ramp) or **colour** (brightness, ramp and colour). The light turns on and off on the same day. The ramp fades the light in at on and out at off.

- Tankkeeper switches the light itself. At startup, after a schedule change and when the entity comes back, it puts the light in the state the schedule wants. A switch by hand stays until the next change.
- A one-day change sets other times, and maybe a brightness, for one day. The next day the light goes back to its schedule. A light has one one-day change at a time.
- Tankkeeper keeps a 30-day on/off log, with who switched the light: the schedule or something else.
- If the entity is unavailable, or a switch fails, the schedule stays as it is. The change is logged as missed, the light problem sensor turns on and a repair issue opens. When the entity comes back, Tankkeeper makes the missed change, late.
- With a light, doses are due when the earliest light turns on, the one-day change included. Without one, they use the dose time.

### Rules and status

The rules run after every change to the records and once an hour. The status is the worst result. A rule with no data gives no result. Tap water tests never count.

| Rule | Watch | Act |
|---|---|---|
| Ammonia, nitrite | latest tank test above 2 ppm | above 4 ppm |
| pH, while cycling | under 7.0 | under 6.5 |
| Cycle stalled, while cycling | ammonia the same for 5 days with no nitrite | 7 days |
| Test overdue | a planned test 1 day late | 3 days late |
| Dose skipped | a product's dose skipped once in the last 7 days | twice running in the last 7 days |
| Plan runs out | 14 days of tasks left | 7 days |
| Light problem | a light missed a change | its entity is unavailable |

The limits are settings: change them in the options or with `set_rules`. The pH and cycle stalled rules need the stage set to cycling. A planned test is a task with "test" in its text. It is done when it is completed or skipped, or when a tank test is recorded on or after its day.

When a rule gets worse, the status alert devices get the status, the reasons and what to do. When the status goes back to On course, they get one "Back on course" message. Nothing is sent after a restart until something changes.

### Reminders

At the task time, each open task for today in the task slot is sent, and open tasks from the last 7 days are sent as *not confirmed*. At the dose time, each open dose is sent. At the resend time (21:00 by default), each of today's tasks still open is sent again as *not complete yet*.

A reminder has **Complete** and **Skip** actions (Home Assistant Companion app). Press one on any device and Tankkeeper records it and clears the reminder on every device. A task done another way (Claude, the calendar, the to-do list) clears its reminders too.

## Installation

### HACS

1. In HACS, open the menu, choose **Custom repositories**, and add `https://github.com/markwallsgrove/tankkeeper` as an **Integration**.
2. Download **Tankkeeper**, then restart Home Assistant.

### Set up

1. Go to **Settings > Devices & services > Add integration** and choose **Tankkeeper**.
2. Go through the steps (see the parameters below). You can set up one tank.
3. To use the tools from Claude Code or Claude Desktop, set up the **Model Context Protocol** integration and, in its options, choose **Tankkeeper** (only the tank's tools) or **Assist** (Tankkeeper's tools are added to Assist's). Choose one of the two, not both.

### Parameters

| Parameter | Description |
|---|---|
| Name | What you call the tank, for example Office tank. |
| What's the volume of your tank? | In litres, as given on the box or by the maker. |
| What's the volume of water in your tank? | In litres. Gravel, rocks and wood take up space, so this is less than the volume of the tank. Doses are worked out for this volume. If you don't know it, use about 10% less than the volume of the tank. |
| Temperature | Optional. The target temperature, in °C. |
| Notes | Optional. Anything Claude should know about the tank. |

After the tank, choose **Go on step by step** or **Finish now**. The later steps can each be skipped:

1. Tank (above).
2. Tap water: the values from your supplier or a test.
3. Products: add each product, with its label dose if you want doses worked out.
4. Contents: plants, fish, rocks, wood and the rest.
5. Light: the entity and its schedule, as in the options below.
6. Reminders: the devices and times, as in the options below.
7. Claude: the agent Tankkeeper chats through, the AI task entity and the reviews, as in the options below.

What you enter is saved as one change, with source PANEL, when the tank is created. Undo it in the panel's history like any other change. Home Assistant does not tell a setup dialog who runs it, so the change has no user.

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
| Status alert devices | The notify services that get a message when the status changes, and proposals still waiting. None means no alerts. |

**Rules and status.** The stage (cycling or cycled) and the Watch and Act limit of each rule. Act must be at least as strict as Watch. Claude can propose the same with `set_rules` and `set_tank`.

**Claude.** Claude can propose the same with `set_claude`. The models are set in the Anthropic integration: the chat model on its conversation agent, the review model on its AI task entity. The API key stays in the Anthropic integration.

| Option | Description |
|---|---|
| Conversation agent | The agent the Assist agent passes chat to, such as `conversation.claude_conversation`. It can't be Tankkeeper's own agent. |
| AI task entity | The entity that writes Claude's comments on reviews, such as `ai_task.claude_ai_task`. |
| Review after | New tests, completed or skipped tasks, and status changes. |
| Claude comments on reviews | Off by default. Each comment is an API call. |
| Daily review | Optional. A review at this time each day. |
| Comments a day | At most this many Claude comments a day, 0 to 50. 5 by default. |

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
- In a conversation, proposals can only be applied in the one that made them. From a notification, anyone who gets it can accept it. A proposal whose code has expired, or that had too many wrong codes, stays waiting until it is rejected. Make it again to get a new code.
- Over MCP, a conversation is known only by the `conversation_id` Claude passes. Proposals made without one can be applied from any conversation by the same Home Assistant user.
- No camera yet. See the [design](design.html).
- A log entry can't be edited or removed in the panel. No tool changes one.
- The rule limits are settings. A decision does not change them by itself; Claude proposes the change with `set_rules`.
- Temperature has no rule yet.
- A light turns on and off on the same day. A schedule over midnight is not possible.
- Tankkeeper does not check that a light or plug really changed. It trusts the entity's state.
- A switch is logged as made by the schedule only when the device reports it with Tankkeeper's action. A device that reports later shows it as made by something else.
- The light problem state is kept in memory. After a restart Tankkeeper checks each light again.
- Calendar and to-do edits are recorded as made in the panel, without the Home Assistant user.
- Reminders sent before a restart are not cleared on other devices after it.
- A batch needs a `conversation_id`. A conversation has one open batch per person.
- A proposal made while no status alert device is set is sent when it is waiting and a device is set.
- Tasks can't repeat. Add one for each day, or ask Claude to.
- Conversations and the records Claude reads are sent to Anthropic when you talk to Claude.
- The Assist agent records up to 200 messages a conversation and up to 2000 characters a message. Later messages are not recorded.
- An agent that does not use Home Assistant's chat log has only its spoken reply recorded, without tool calls.

## Cost

Assist chat and Claude's comments use the Anthropic API and are paid per use, on the key in the Anthropic integration. Each chat message is at least one API call, and more when Claude calls tools. Comments are off by default, and the daily cap limits them. The rules, reminders, the panel and Claude Code or Claude Desktop on your Claude plan cost nothing extra. Check Anthropic's pricing before you choose a model.

## Troubleshooting

- **Claude can't see the tools.** Check that Tankkeeper is loaded, and that the Model Context Protocol integration or Assist uses the Tankkeeper or Assist API. Reload the Model Context Protocol integration after you change its options, then start a new Claude session: Claude loads the tools only when a session starts.
- **"The confirm code does not match" or "expired".** Ask Claude to make the proposal again.
- **`batch_expired`.** The batch had no change for 15 minutes, or is 2 hours old. Ask Claude to start the batch again; it keeps the changes.
- **No notification for a proposal.** It is sent 10 minutes after the last change, only to the **Status alert devices**, and only once.
- **Accept did nothing.** The proposal was applied or rejected already, or a record in it changed since. Ask Claude to make it again.
- **"The proposal belongs to another conversation".** Apply it from the conversation that made it, or reject it and make it again.
- **No reminders.** Check that the device is chosen in the options, and that its `notify.mobile_app_…` action works from **Developer tools > Actions**.
- **Complete or Skip did nothing.** The task may be done already, or removed; the reminder is cleared anyway. Check the task in `calendar.tankkeeper`.
- **"Tankkeeper tasks can't repeat".** Add a single event for each day.
- **The status is Watch or Act.** Read the `rules` attribute of the status sensor, or ask Claude for `get_status`. Each rule says why and what to do.
- **No status alerts.** Check that the device is chosen under **Status alert devices** in the options. Only Watch, Act and back on course are sent.
- **Light problem is on.** Check that the light or plug has power and shows in Home Assistant. Read the `problems` attribute to see what was missed. The problem clears when the light is in the state its schedule wants.
- **"Choose the conversation agent in Tankkeeper's Claude settings first".** Choose the agent with **Configure > Claude**, in the panel's Claude tab, or with Claude Code.
- **The Assist agent answers but can't change anything.** Turn on the **Tankkeeper** API in the chosen agent's options.
- **Something else.** Download the diagnostics from the integration's menu and [open an issue](https://github.com/markwallsgrove/tankkeeper/issues). Diagnostics leave out your notes and messages.

## Removal

1. Go to **Settings > Devices & services > Tankkeeper**, open the menu and choose **Delete**. This deletes the tank's records. Make a backup first if you want to keep them.
2. Remove Tankkeeper in HACS.
3. Restart Home Assistant.
