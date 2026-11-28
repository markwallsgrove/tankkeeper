# TankKeeper integration

TankKeeper keeps a fish tank's records in Home Assistant and gives Claude tools to read and change them. You talk to Claude; Claude uses the tools. This page covers the integration as it is built today: records, tools, conversations, history and undo, the plan calendar, reminders, the light, decisions, the rules and status, the Assist agent and the camera.

## Use cases

- Tell Claude what you dosed or tested, and it records it straight away.
- Set up the tank, tap water, products and contents in a conversation, saying yes to each change.
- Ask Claude a question and get an answer from your own records, doses and past conversations.
- Chat with Claude in Assist on your phone, and find the whole conversation, with its tool calls, in TankKeeper.
- See what changed, who changed it and why, and undo a change.
- Keep the plan in a calendar, tick off today's tasks, and get a reminder with Complete and Skip on your phone.
- Keep the tank light's times in the helpers of a Home Assistant automation, and know when the light does not follow them.
- Know where the tank stands: On course, Watch or Act, with the reason and what to do.
- Keep numbered decisions, and move your earlier decisions and log in.
- Let Claude look at a photo of the tank each day and tell you about algae, cloudy water or a plant melting.

## What it provides

- **Tools** for Claude, through Home Assistant's LLM API. Claude Code and Claude Desktop reach them through the [Model Context Protocol](https://www.home-assistant.io/integrations/mcp_server/) integration. Assist reaches them through the [Assist agent](#assist-agent), or when its conversation agent can control Home Assistant.
- **Entities** on a TankKeeper service device:
  - **Status** (sensor): On course, Watch or Act, the worst result of the [rules](#rules-and-status). The `rules` attribute lists each rule's result with its reason and what to do.
  - **Proposals waiting** (sensor): how many proposals wait for a yes or a no.
  - **Last water test** (sensor): when the tank water was last tested. Tap water tests don't count.
  - **Plan** (`calendar.tankkeeper`): every task as a 30-minute event at its slot time. A done task's title starts with `Complete:` or `Skip:`, and its note is the description. You can add, change and delete tasks in the calendar. A change or delete there applies to one occurrence of a [repeating task](#repeating-tasks); the calendar can't add a repeating task.
  - **Today** (`todo.tankkeeper_today`): today's tasks. Tick an item to complete its task. Tick it with a description that starts with `Skip` to skip it; the rest of the description is the note.
  - **Next light change** (sensor, only with a light): when a light next turns on or off, and which lights.
  - **Assist agent** (`conversation.<tank>_assist_agent`): chats about the tank through the agent you choose, and records the conversation. See [Assist agent](#assist-agent).
  - **Light problem** (binary sensor, only with a light): on when a light's entity is unavailable, its automation is off or missing, a helper is wrong or missing, or the light did not follow the helper times. The `problems` attribute lists each light with what is wrong.
- **Reminders**, **status alerts** and **proposals still waiting** to the notify services you choose (see [options](#options)).
- **A repair issue** for each light with a problem. It clears by itself.
- **Diagnostics:** record counts and settings, without notes, messages or reasons.
- **Photos** in Home Assistant's media browser, under **TankKeeper photos**, only while the tank is loaded.

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
| `get_history` | The newest changes, with the record before and after, where each change came from, the Home Assistant user and the conversation with its name (`deleted conversation` once it is deleted). |
| `list_conversations` | Past conversations about the tank, newest first by last activity. Each has a `name`: its title, or the first thing you said, clipped. |
| `get_conversation` | A past conversation, its key messages and the changes made in it. |
| `search_conversations` | Past conversations whose messages, title or summary hold some words, ignoring simple case ("STRASSE" does not find "straße"), newest first. Each result has a `match`: where the words are, the words around them as `snippet`, and `start` and `end` of the match in it, counted in code points. What was said is searched before the title, the summary and tool calls. |
| `record_dose` | Record a dose. |
| `record_test` | Record water test results: ammonia, nitrite, nitrate and phosphate in mg/l, KH in dKH, GH in dGH, and pH. Returns the status. |
| `add_content` | Record something put in the tank. |
| `add_note` | Record an open question or an assumption. |
| `update_note` | Propose changes to a note. |
| `remove_note` | Propose removing a note, such as an answered question. The history keeps it. |
| `save_conversation` | Start a conversation, or add a title, summary and key messages to one. Up to 20 messages a call and 200 a conversation. |
| `rename_conversation` | Give a conversation a new title. Its place in the list stays. |
| `delete_conversation` | Delete a conversation in two calls. Without `code` it says what goes and gives a code; with the code it deletes. Only the person who asked can use the code, for 15 minutes, with 5 wrong tries; a restart forgets it. The changes made in the conversation stay in the history and can be undone, and its waiting proposals stay. |
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
| `get_plan` | Tasks between two dates, 7 days from today by default, with their times, the repeating tasks and the reminder settings. Each occurrence of a repeating task in the range is a task. |
| `complete_task` | Record a task as complete, with an optional note. |
| `skip_task` | Record a task as skipped, with an optional note. |
| `add_task` | Propose a new task for a day, in the task or dose slot. With `every_days` or `weekdays` it repeats from that day, until an optional `until` day. |
| `update_task` | Propose changes to a task: text, day, slot, state or note. For a repeating task, `scope` is `this` (one occurrence, the default) or `future` (it and every later one); only `future` changes the repeat. |
| `remove_task` | Propose taking a task out of the plan. For a repeating task, `scope` is `this` or `future`. |
| `set_reminders` | Propose the notify services for reminders and for status alerts, and the task, dose and resend times. |
| `get_status` | The status, each rule's result, the stage and the rule limits. |
| `set_rules` | Propose new rule limits. |
| `list_decisions` | Every decision by number, with its title, date and status. |
| `get_decision` | One decision in full, with what replaced it and what it replaced. |
| `set_decision` | Propose adding a decision (it gets the next number), changing its text, accepting a proposed one, or replacing one with another. |
| `import_decisions` | Propose adding or updating decisions given in full, such as your decision files. |
| `import_log` | Propose adding your earlier log. Each dose and test becomes a log record; tasks, fills and water changes become an event. Records already in the log are left out. |
| `get_light` | The lights, the schedule the helpers hold, the automation, today's schedule, the dose time, the next change, the problems in words, and the on/off log and changes with their reasons. 7 days by default, up to 30. Listed only when a light is set. |
| `set_light` | Propose adding, changing or removing a light, its automation and helpers, a change for one day, or cancelling it. Applying it sets the helpers. No tool switches the light. |
| `get_claude` | The Claude settings: the agent, the AI task entity, what starts a review, comments, the daily review time and the daily cap, with a note on where the models are set. |
| `get_reviews` | The latest reviews, newest first: what started each, the rules' result, Claude's comment or why there is none, and the plan changes it proposed. 20 by default. |
| `set_claude` | Propose new Claude settings. An empty value clears the agent, the AI task entity or the daily review time. |
| `get_camera` | The camera settings, the latest photo check and the issues waiting for you, each with a `photo_url`. |
| `set_camera` | Propose new camera settings. An empty camera or check time clears it. |
| `check_now` | Take a photo now and have Claude look at it. Fails with `lights_off` when every light is off. Listed only when a camera is set. |
| `get_photo` | Take a fresh photo for the chat and get what Claude saw in it. It never sends an alert. Listed only when a camera is set. |
| `list_photos` | The photo checks kept, newest first, with what Claude saw. Listed only when a camera is set. |
| `get_photo_check` | One photo check by its id, with a fresh `photo_url`. Listed only when a camera is set. |
| `dismiss_finding` | Close an issue the camera found as not a problem. Listed only when a camera is set. |
| `import_plan` | Propose tasks copied from another calendar, such as `calendar.fish_tank`. `Complete:` and `Skip:` titles keep their state. 7 days back to 30 days ahead by default. |

### Panel

The **TankKeeper** panel is in the sidebar. Only admins see it. It works at phone width and uses your Home Assistant theme.

- **Overview**: the status and the rules that need you, today's tasks with Skip and Complete, the cycle chart, a chart for each water parameter, the next 7 days, the tank, the tap water, the lights, the rule limits and the changes waiting for you.
- **Chat**: talk to the tank's [Assist agent](#assist-agent). Each chat is a conversation, so its follow-ups keep the context. The changes Claude makes show under the chat with **Undo**, and the changes waiting for you with **Accept** and **Reject**. **New chat** starts again. Your chats are listed beside the chat, newest first, or under **Chats** on a narrow screen; one click opens a chat with its messages, photos and charts. You can search what was said and the titles, rename a chat and delete one after a confirm in the panel. Opening a search result goes to the message that matched and marks it. Chats from Assist or Claude open read only. Replies show simple formatting; HTML in a reply shows as text, and links open only web addresses, in a new tab. Replies can show photos and charts; see [Photos and charts in chat](#photos-and-charts-in-chat). Without a conversation agent in the Claude settings, the tab says where to choose one.
- **Plan**, **Log**, **Decisions** and **Notes**: list, add, edit and remove records. The Log only adds doses and tests. The Plan adds repeating tasks, marks their occurrences with a repeat icon, and changes or removes one occurrence or it and every later one. Above the list, a week grid shows each day's tasks as chips coloured by kind (test, dose or other task), with today marked; click a chip to scroll to its row, and use Previous and Next to move a week inside the loaded 28 days. On a narrow screen it is a strip of task counts per day; tap a day to show only its tasks.
- **Contents** and **Products**: list them, with their history.
- **Claude**: the Claude settings, with their history, and the latest reviews.
- **Camera** (on the Overview): the latest photo and what Claude saw, **Check now** and **Photos**. **Seen by the camera** lists the issues waiting for you, with **Not a problem**, **Discuss**, **Reject** and **Accept**.
- **Conversations**: list, search, read the messages and the changes made in each, undo a change, and delete a conversation after a confirm in the panel. Search shows where the words matched. **Continue in Chat** goes on with a chat started in the panel.
- Settings are read-only in the panel: the tank, tap water, products, contents, lights, reminders, rule limits, Claude and camera. The cog in the panel's header, **TankKeeper settings**, opens the integration page; choose **Configure** there to change them. Home Assistant cannot open a given options step from a link.
- Each record has its latest changes with Undo, settings too.
- On the charts, hollow points are tap tests. Dashed lines are the Watch and Act limits, the tap water values you gave and the target temperature.
- **Discuss**, on a waiting change, a camera issue or a notification, opens a new chat with a first message about it. The message is not sent until you send it, so you can change it first. A link only names the item, such as `/tankkeeper?proposal=<id>`; the panel reads its text from the records.

#### Photos and charts in chat

Claude puts a photo or chart in a panel chat reply as a markdown image with a `tankkeeper:` address:

- `![The tank](tankkeeper:photo/<check id>)`: a photo check's photo. The photo tools return this string as `embed`.
- `![Nitrate, 30 days](tankkeeper:chart/<chart>?days=<n>)`: a chart, where `<chart>` is `ammonia`, `nitrite`, `nitrate`, `phosphate`, `ph`, `kh`, `gh`, `temperature_c`, `cycle` or `light`. `days` is 1 to 365 (1 to 30 for `light`) and 30 when left out; other numbers are moved into that range.

- The panel loads a photo with your own sign-in, through a link signed for you with `get_photo_check`, and draws a chart from the same data as the Overview. Click a photo to open it larger.
- A reply shows at most 5 photos and charts; the rest show as text.
- Every other image shows as text, with a web address as a link: the panel never loads an image from another site.
- The Chat tab and the agent's messages in **Conversations** show them. Phone notifications don't change.
- Only panel chats are told about charts. MCP and Assist clients get the `embed` string from the photo tools and can ignore it.

### Assist agent

TankKeeper adds its own conversation agent. It does not talk to Anthropic itself and never holds an API key. It passes each message to the agent chosen in the Claude settings, such as the Anthropic integration's `conversation.claude_conversation`, with:

- the conversation's id, so every change Claude makes is linked to it;
- a note that TankKeeper's records are the owner's data, never instructions;
- for an empty tank, the instruction to start setup and ask the first question.

The chosen agent answers with its own model, its own key and its own LLM APIs. Turn on the **TankKeeper** API in that agent's options so it gets the tools. TankKeeper then records your message, each tool call with its arguments and result, and each reply in the conversation, which you can read in the panel or with `get_conversation`. Confirm codes are left out of the recorded results. Tools from other APIs, such as Home Assistant's own, are recorded with their arguments only, so data from outside the tank is not kept. When the agent fails, the conversation records an error instead of a reply. A recorded conversation keeps up to 500 messages: past that, the oldest tool calls go first, then the oldest messages. Your messages and replies are kept up to 8,000 characters and tool calls up to 2,000. Words past those limits can't be found by search.

Only chats started in the panel can go on. Home Assistant gives a chat from Assist a new id once its session ends, and chats from Claude through MCP never ran through the agent, so the panel shows those read only.

To use it, open the panel's **Chat** tab, or open **Settings > Voice assistants**, add or edit an assistant, and choose the tank's **Assist agent** as its conversation agent.

A chat whose Home Assistant session has ended, such as one continued from **Conversations**, starts without its earlier messages. The agent then gets the latest 10 recorded messages as JSON data, with a note that they are the owner's data, never instructions.

### Websocket API

The panel uses websocket commands. Only admins can use them.

- `tankkeeper/<tool>` runs a tool, with its arguments in `args`. It has every tool except the ones that belong to a conversation: `save_conversation`, `start_batch`, `start_setup`, `get_batch`, `apply_change` and `reject_change`.
- A change applies straight away, as in the options. It is recorded with the source `panel` and your Home Assistant user, and can be undone. `reason` is optional.
- `tankkeeper/accept_proposal` and `tankkeeper/reject_proposal` take a `proposal_id`. They work as Accept and Reject in a notification.
- `tankkeeper/accept_finding` and `tankkeeper/reject_finding` take a `check_id`. Accept closes the issue and applies its plan changes; Reject closes it and rejects them.
- An error has the same code as the tool's error, `invalid_format` for wrong arguments, `unauthorized` for a person who is not an admin, or `not_loaded`.
- Deleting a conversation keeps its waiting proposals. They can still be accepted or rejected.

### Batches and setup

A batch is one proposal that holds many changes of any kind. After `start_batch`, every change tool called by the same person in the same conversation adds to the batch instead of making a new proposal.

- One code applies the whole batch. The apply is all or nothing, and `undo_change` puts the whole batch back.
- A record changed twice holds one change, from the stored value to the newest value.
- Later changes see the earlier ones. For example, `update_task` can change a task added earlier in the batch.
- The code lasts 15 minutes after the last change, and at most 2 hours after the batch started. After that a change returns `batch_expired`. Call `start_batch` again: the new batch keeps the changes and has a new code.
- Entities, the calendar and the read tools show the stored records, not the batch, until it is applied.

Setup is a batch for an empty tank: no products, contents, tasks, repeating tasks, lights or decisions. Claude asks one thing at a time in Assist, or reads the notes you point to in Claude Code. Then it reads the whole draft back, and one yes applies it.

### Reviews

A review checks the tank after the events chosen in **Review after**: a new test, a task completed or skipped, or a status change. Events less than 2 minutes apart give one review, 2 minutes after the last of them. With a **Daily review** time, a review also runs then each day.

- Each review stores the rules' result in one line, such as `Watch: Ammonia 3 ppm on 26 Nov is above the 2 ppm watch limit.` TankKeeper keeps the latest 100 reviews, and every review from today.
- With **Claude comments on reviews** on and an AI task entity set, TankKeeper asks that entity for a short comment on what the rules can't see. The entity reads the records with the TankKeeper tools. Codes are left out of what it reads, and it can't apply, reject or undo anything.
- A plan change Claude suggests in a review is a proposal (add, change or remove a task). It waits for you in the panel, and is sent to you as a [proposal notification](#proposal-notifications).
- Once the daily cap of comments is reached, reviews still run, without a comment, until midnight. When the entity fails, or takes more than 3 minutes, the review is stored with a note instead of a comment. A review can call at most 20 tools; after that the tools answer with an error asking for the comment.
- Each review goes to the **Status alert devices**: the rules' result, Claude's comment and how many plan changes wait. It replaces the status alert on the phone, and opens the panel when tapped. **Discuss** opens a chat about the review.

### Camera

A camera, such as a Tapo C100 on the side glass, lets Claude look at the tank. Choose the camera entity in **Configure > Camera** or with `set_camera`.

- A photo check takes a frame from the camera's stream with FFmpeg, scaled down to 1568 pixels on its long edge, which is as much as Claude reads. A camera with no stream, or a stream that gives no frame, gives its own snapshot instead. The check stores it in `config/tankkeeper/photos`, and sends it to the AI task entity as an attachment, with the date, the tank's contents (type, name, count, where and when added), the rules' result and the findings you said are not a problem. When **Check plant health** and **Check fish health** are on, Claude looks for signs of poor health in the plants (pale or yellow leaves, holes, dark patches, melting or slimy leaves) and the fish (white spots, damaged or clamped fins, sores, gasping, hiding). It answers with a summary, whether it is an issue, a suggestion and what it saw of the water, algae, plants, fish and water level. With a health check off, it leaves out that part.
- Checks run at the **Daily check time** (14:00 by default), only while a light is on when lights are set; after each water test when **Check after each test** is on; and when you choose **Check now** or ask Claude for a photo.
- Each check that asks Claude counts toward the **Comments a day** cap, shared with reviews. Past the cap, the photo is kept with a note and Claude does not look. The same 3-minute and 20-tool-call limits as reviews apply.
- An issue from a daily or after-test check goes to the **Status alert devices** with the photo, unless **Alert me about issues** is off. The notification has **Discuss**, which opens a chat about the issue, **Open in panel**, and **Not a problem**, which closes the issue as the person who pressed it.
- Claude can propose plan changes for an issue. They wait on the issue, and the panel lists them under it. **Accept** applies all of them, or none if one can no longer apply. **Reject** and **Not a problem** reject them. An alert counts the plan changes; changes from a check that sent no alert go out as usual proposal notifications.
- Photos older than **Keep photos for** are deleted when the tank loads, before each scheduled check and every day at 03:00, even with no camera set.
- Photos are kept for **Keep photos for** days (30 by default). The check stays in the records without its photo. TankKeeper keeps the latest 200 checks, every check from today, the open issues and the latest 50 findings you said are not a problem.
- Photos are served only to signed-in admins, at `/api/tankkeeper/photos/<check id>`. A `photo_url` from a tool is signed and works for 10 minutes. MCP can't return images, so the tools give this link and Claude's text instead.

**Privacy.** Photos stay in your Home Assistant config folder and backups. Each check sends the photo to Anthropic through the AI task entity. Point the camera at the tank only, and turn the camera off or clear it in the options when you don't want photos sent.

### Proposal notifications

A proposal or batch still waiting 10 minutes after its last change is sent once to the **Status alert devices**. A batch that keeps changing is not sent. A proposal applied or rejected in the conversation is not sent.

- **Accept** applies it, without a code. **Reject** closes it. Both record who pressed the button. Anyone who gets the notification can use them.
- **Discuss** opens a chat about it in the TankKeeper panel, where you can also accept or reject it.
- When the proposal is applied or rejected anywhere, the notification is cleared.

### Tasks and slots

A task is due in one of two slots: **task** (09:00 by default) or **dose** (12:00 by default). A task whose text is a product name and an amount in ml, such as `Bio-CO2 1.5 ml`, is a dose. In the calendar, a task you add at the dose or task time takes that slot.

### Repeating tasks

A repeating task repeats every N days (1 to 365) or weekly on chosen weekdays, from its first day, with an optional end day.

- Its occurrences are made when they are read, over the range asked for: 7 days back to 14 days ahead by default. The calendar, the Today list, reminders and the rules see them as tasks.
- An occurrence's id is the repeating task's id, `@` and its day, such as `01JD8…@2026-11-28`.
- Complete, skip, move or change one occurrence (`scope` `this`), and only that day changes. Removing it leaves that day out.
- Change it and every later one (`scope` `future`) to change the text, slot, note, first day or repeat. From the first occurrence this changes the repeating task; from a later one it ends the old one the day before and starts a new one. Done occurrences stay as they were.
- Remove it and every later one to end the repeating task the day before, or to remove it from its first occurrence.
- A plain task can't be made to repeat: remove it and add a repeating task.
- The **Plan runs out** rule counts each repeating task up to its last occurrence. One with no end day never runs out.

### Light

A light is a `light` or `switch` entity, its model, its control, a daily schedule, a Home Assistant automation and its helpers. The control is **on/off**, **dimmable** (brightness and ramp) or **colour** (brightness and ramp; TankKeeper sets no colour). The schedule turns the light on and off on the same day. The ramp fades the light in at on and out at off.

- TankKeeper does not switch the light. The automation does, at the times in its helpers: an `input_datetime` for on and one for off (time only), and for a dimmable or colour light an `input_number` for brightness (%) and one for the ramp (minutes). The [README](../README.md#-the-tank-light) has an example package.
- TankKeeper sets the helpers with `input_datetime.set_datetime` and `input_number.set_value` when a light is added or its schedule, one-day change or helpers change, and when Home Assistant starts with a light added before it. A helper changed by hand stays until the next change.
- Each helper is checked when it is set: it must exist, be the right type and, for a time, hold a time only. A brightness or ramp must fit the helper's range. A helper that could not be set is set again when it comes back or changes.
- A light added before helpers existed **needs helpers**: it shows a problem and nothing is set until its automation and helpers are given.
- A one-day change sets the helpers for its day. After it, TankKeeper puts the schedule back, unless a helper was changed by hand. A light has one one-day change at a time.
- TankKeeper keeps a 30-day on/off log, with who switched the light: the automation or something else.
- The light chart's on periods come from Home Assistant's recorded state history of the entity, from the day the light was added. Unavailable counts as off. The on/off log fills the days before the recorder's oldest state (the recorder keeps 10 days by default), and all of it when the recorder is not loaded or leaves the entity out.
- At each helper time TankKeeper checks the light within 5 minutes, or at off within 5 minutes plus the ramp. A light that did not follow is logged as missed and is a problem until it is in the wanted state. Times over midnight in the helpers are followed. Five minutes after Home Assistant starts, TankKeeper also checks the light against its last helper time, so a change missed while Home Assistant was down is a problem.
- A light whose entity is unavailable, whose automation is off or missing, or whose helper is missing or could not be set is a problem: the light problem sensor turns on and a repair issue opens. It clears when that is fixed.
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
| Light problem | a light did not follow its helper times | its entity is unavailable, it needs helpers, or its automation or a helper is wrong |

The limits are settings: change them in the options or with `set_rules`. The pH and cycle stalled rules need the stage set to cycling. A planned test is a task with "test" in its text. It is done when it is completed or skipped, or when a tank test is recorded on or after its day.

When a rule gets worse, the status alert devices get the status, the reasons and what to do. When the status goes back to On course, they get one "Back on course" message. Each has **Discuss**, which opens a chat about the status. Nothing is sent after a restart until something changes.

### Reminders

At the task time, each open task for today in the task slot is sent, and open tasks from the last 7 days are sent as *not confirmed*. At the dose time, each open dose is sent. At the resend time (21:00 by default), each of today's tasks still open is sent again as *not complete yet*.

A reminder has **Complete** and **Skip** actions (Home Assistant Companion app). Press one on any device and TankKeeper records it and clears the reminder on every device. A task done another way (Claude, the calendar, the to-do list) clears its reminders too.

## Installation

### HACS

1. In HACS, open the menu, choose **Custom repositories**, and add `https://github.com/markwallsgrove/tankkeeper` as an **Integration**.
2. Download **TankKeeper**, then restart Home Assistant.

### Set up

1. Go to **Settings > Devices & services > Add integration** and choose **TankKeeper**.
2. Go through the steps (see the parameters below). You can set up one tank.
3. To use the tools from Claude Code or Claude Desktop, set up the **Model Context Protocol** integration and, in its options, choose **TankKeeper** (only the tank's tools) or **Assist** (TankKeeper's tools are added to Assist's). Choose one of the two, not both.

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
5. Light: the entity, its schedule, its automation and helpers, as in the options below.
6. Reminders: the devices and times, as in the options below.
7. Claude: the agent TankKeeper chats through, the AI task entity and the reviews, as in the options below.

What you enter is saved as one change, with source PANEL, when the tank is created. Undo it in the panel's history like any other change. Home Assistant does not tell a setup dialog who runs it, so the change has no user.

To change them later, open the integration and choose **Reconfigure**. The old values stay in the history.

### Options

Open the integration and choose **Configure**. Changes made here apply straight away, with no proposal and no reason. Each is recorded with its history and can be undone in the panel.

**Tank** and **Tap water.** The same fields as in [setup](#parameters). Clear a field to remove its value. Renaming the tank reloads the integration. Claude can propose the same with `set_tank` and `set_water`.

**Products** and **Contents.** Add, change, or stop using a product; add, change, or take something out. Taking something out records today as its removal date. Claude can propose the same with `add_product`, `update_product`, `remove_product`, `update_content` and `remove_content`. `add_content` records an item straight away.

**Reminders.** Claude can propose the same with `set_reminders`.

| Option | Description |
|---|---|
| Devices | The notify services that get reminders, such as `mobile_app_phone`. None means no reminders. |
| Task time | When tasks are sent. |
| Dose time | When doses are sent when no light is set. |
| Resend time | When tasks still open are sent again. |
| Status alert devices | The notify services that get a message when the status changes, reviews and proposals still waiting. None means no alerts. |

**Rules and status.** The stage (cycling or cycled) and the Watch and Act limit of each rule. Act must be at least as strict as Watch. Claude can propose the same with `set_rules` and `set_tank`.

**Claude.** Claude can propose the same with `set_claude`. The models are set in the Anthropic integration: the chat model on its conversation agent, the review model on its AI task entity. The API key stays in the Anthropic integration.

| Option | Description |
|---|---|
| Conversation agent | The agent the Assist agent passes chat to, such as `conversation.claude_conversation`. It can't be TankKeeper's own agent. |
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
| Brightness | 1 to 100%. Dimmable and colour only. Needs the brightness helper. Empty leaves the helper as it is. |
| Ramp | Minutes to fade in and out. Dimmable and colour only. Needs the ramp helper. |
| Automation | The automation that runs the light from the helpers. |
| On helper, Off helper | The `input_datetime` helpers, time only, that hold the on and off times. |
| Brightness helper, Ramp helper | Optional `input_number` helpers for the brightness (%) and the ramp (minutes). |

**Camera.** Claude can propose the same with `set_camera`. Photo checks use the AI task entity from the Claude options.

| Option | Description |
|---|---|
| Camera | The camera entity, such as a Tapo C100's `camera.tank_hd_stream`. Empty means no photo checks. |
| Daily check time | 14:00 by default. Only while a light is on, when lights are set. Empty means no daily check. |
| Check after each test | Off by default. A check 2 minutes after the last water test. |
| Alert me about issues | On by default. Issues from daily and after-test checks go to the status alert devices. |
| Keep photos for | 1 to 365 days, 30 by default. |
| Check plant health | On by default. Claude looks for signs of disease or poor health in the plants. |
| Check fish health | On by default. Claude looks for signs of disease or stress in the fish. Turn it off when the tank has no fish, so the check is shorter. |

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
      message: "TankKeeper has {{ states('sensor.office_tank_proposals_waiting') }} proposals waiting."
```

## Known limitations

- One tank per Home Assistant.
- In a conversation, proposals can only be applied in the one that made them. From a notification, anyone who gets it can accept it. A proposal whose code has expired, or that had too many wrong codes, stays waiting until it is rejected. Make it again to get a new code.
- Over MCP, a conversation is known only by the `conversation_id` Claude passes. Proposals made without one can be applied from any conversation by the same Home Assistant user.
- A camera can't see ammonia, nitrite, nitrate or pH. Claude is told so and never judges them from a photo.
- A photo check skipped because the lights are off is not recorded.
- A daily photo check waiting during a restart is lost; the next one runs the next day.
- Photo alerts link to the photo without a signature. The Companion app loads it with its own sign-in.
- A log entry can't be edited or removed in the panel. No tool changes one.
- The rule limits are settings. A decision does not change them by itself; Claude proposes the change with `set_rules`.
- Temperature has no rule yet.
- A schedule turns the light on and off on the same day. A schedule over midnight is not possible.
- TankKeeper does not check that a light or plug really changed. It trusts the entity's state.
- A switch is logged as made by the automation only when the device reports it with the automation's action. A device that reports later shows it as made by something else.
- TankKeeper does not read the automation. It checks only that it is on and that the light follows the helper times.
- A light with helpers sets no colour.
- The light problem state is kept in memory. After a restart TankKeeper checks each light again.
- Calendar and to-do edits are recorded as made in the panel, without the Home Assistant user.
- Reminders sent before a restart are not cleared on other devices after it.
- A batch needs a `conversation_id`. A conversation has one open batch per person.
- A proposal made while no status alert device is set is sent when it is waiting and a device is set.
- Tasks can't repeat. Add one for each day, or ask Claude to.
- Conversations and the records Claude reads are sent to Anthropic when you talk to Claude. Photos are sent to Anthropic when Claude looks at them.
- The panel's chat talks to the agent with `conversation/process`, so a reply shows when it is complete, not word by word. Home Assistant's streaming Assist pipeline can't be told which agent to use.
- **Continue in Chat** is only for chats started in the panel. Other conversations can be read but not continued.
- The Assist agent records up to 200 messages a conversation and up to 2000 characters a message. Later messages are not recorded.
- An agent that does not use Home Assistant's chat log has only its spoken reply recorded, without tool calls.
- A review waits 2 minutes after the last event, and events that keep coming put it off. A review waiting during a restart is lost.
- A review's plan changes are tasks only. Claude can't propose other changes in a review.

## Cost

Assist chat and Claude's comments use the Anthropic API and are paid per use, on the key in the Anthropic integration. Each chat message is at least one API call, and more when Claude calls tools. Each review comment is one AI task, which makes several API calls when Claude reads the records with tools, up to 20 tool calls and 3 minutes. Comments are off by default, and the daily cap limits them: with 5 a day, at most 5 comments are asked for each day, however many reviews run. Reviews without a comment cost nothing. Each photo check that asks Claude is one AI task with an image, counted in the same daily cap; an image adds input tokens to the call. A photo check past the cap, and the camera itself, cost nothing. The rules, reminders, the panel and Claude Code or Claude Desktop on your Claude plan cost nothing extra. Check Anthropic's pricing before you choose a model.

## Troubleshooting

- **Claude can't see the tools.** Check that TankKeeper is loaded, and that the Model Context Protocol integration or Assist uses the TankKeeper or Assist API. Reload the Model Context Protocol integration after you change its options, then start a new Claude session: Claude loads the tools only when a session starts.
- **"The confirm code does not match" or "expired".** Ask Claude to make the proposal again.
- **`batch_expired`.** The batch had no change for 15 minutes, or is 2 hours old. Ask Claude to start the batch again; it keeps the changes.
- **No notification for a proposal.** It is sent 10 minutes after the last change, only to the **Status alert devices**, and only once.
- **Accept did nothing.** The proposal was applied or rejected already, or a record in it changed since. Ask Claude to make it again.
- **"The proposal belongs to another conversation".** Apply it from the conversation that made it, or reject it and make it again.
- **No reminders.** Check that the device is chosen in the options, and that its `notify.mobile_app_…` action works from **Developer tools > Actions**.
- **Complete or Skip did nothing.** The task may be done already, or removed; the reminder is cleared anyway. Check the task in `calendar.tankkeeper`.
- **"TankKeeper tasks can't repeat".** Add a single event for each day.
- **The status is Watch or Act.** Read the `rules` attribute of the status sensor, or ask Claude for `get_status`. Each rule says why and what to do.
- **No status alerts.** Check that the device is chosen under **Status alert devices** in the options. Only Watch, Act and back on course are sent.
- **Light problem is on.** Read the `problems` attribute, or ask Claude for `get_light`. Check that the light or plug has power and shows in Home Assistant, that the automation is on, and that each helper exists and holds a time only. A missed change clears when the light is in the state the helpers want.
- **The light needs helpers.** Add the automation and helpers from the [README](../README.md#-the-tank-light), then choose **Configure > Change a light** or ask Claude to set them.
- **"Choose the conversation agent in TankKeeper's Claude settings first".** Choose the agent with **Configure > Claude** or with Claude Code.
- **The Assist agent answers but can't change anything.** Turn on the **TankKeeper** API in the chosen agent's options.
- **"Every tank light is off".** A photo in the dark shows nothing. Try again while a light is on.
- **No photo alert.** Alerts are sent only for issues from daily and after-test checks, to the **Status alert devices**, and only when **Alert me about issues** is on.
- **A photo check has a note and no summary.** The note says why: the camera failed, the daily cap was reached, or the AI task entity failed or took too long.
- **Something else.** Download the diagnostics from the integration's menu and [open an issue](https://github.com/markwallsgrove/tankkeeper/issues). Diagnostics leave out your notes and messages.

## Removal

1. Go to **Settings > Devices & services > TankKeeper**, open the menu and choose **Delete**. This deletes the tank's records. Make a backup first if you want to keep them.
2. Remove TankKeeper in HACS.
3. Restart Home Assistant.
