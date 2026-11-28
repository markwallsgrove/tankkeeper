# Research: remotely controlled aquarium lights

Snapshot of issue #44, 2026-11-28. A later decision on the issue overrides this file.

Sources are vendor and Home Assistant pages plus community projects and forum threads. Community findings are marked as such; they were not tested on hardware.

## Lights with a Home Assistant integration

| Light | Integration | Link | Local only | What HA gets |
|---|---|---|---|---|
| EHEIM classicLEDcontrol+e | Core: EHEIM Digital | WiFi, WebSocket to the EHEIM main device, polled every 15 s | Yes | A light with brightness, and a `daycycle` effect that runs the schedule set on the device. The docs differ between releases on whether both channels are separate. |
| Chihiros (A2, C2, C2 RGB, WRGB, Z-Light Tiny and others) | HACS: AquaBle, or chihiros-led-control it is based on | Bluetooth LE | Yes | Per-channel brightness. Unofficial, reverse-engineered protocol; Chihiros has no public API. A firmware update can break it. |
| Juwel HeliaLux SmartControl | HACS: Juwel HeliaLux (MrSleeps) | WiFi, the controller's local web interface | Yes | Sensors, on/off, per-channel brightness, manual colour simulation. Opening the controller's own web page cancels changes made from HA. Juwel says AppControl replaces SmartControl. |
| Juwel HeliaLux AppControl | Community integration on the MyJUWEL cloud API | Cloud | No | The API is not public and may change. |
| AquaIllumination Hydra, Prime HD | Community custom component (2019) | WiFi | Yes | Each channel as its own light entity. Old; maintenance unknown. |
| Aquatlantis Ori | HACS custom component | Not confirmed | Not confirmed | Light control and sensors where the light has them. |
| Red Sea ReefLED | Community integration on GitHub | WiFi, local IP | Reported local | Not confirmed. |
| Fluval (Aquasky, Plant 3.0/4.0) | Community BLE work in progress | Bluetooth LE | Yes | Not finished. |
| Twinstar, Kessil | None found | — | — | Kessil can be driven by 0–10 V PWM from a DIY controller (reef-pi). Otherwise a smart plug only. |

## Generic routes

- **WLED or ESPHome** on an LED strip or a converted light: local, per-channel brightness and colour, full HA control. Needs DIY work.
- **Smart plug**: on/off only. This is what TankKeeper supports today.
- **Adaptive Lighting (HACS)** ramps any dimmable HA light around sunrise and sunset. Fixed sun times fit planted tanks badly in the north, where the day length changes by many hours.

## What each light exposes

- Everything with an integration exposes on/off and brightness through a normal `light` entity.
- Per-channel colour: Chihiros, Juwel SmartControl and AquaIllumination (one entity per channel), WLED and ESPHome.
- Built-in schedules: EHEIM (`daycycle`), Chihiros, Juwel and most vendor lights run their own day cycle. A schedule in the light and one from HA fight each other; only one may be in charge.

## Reliable and local

- Best fit for a tailnet-only HA: EHEIM Digital (core, local, maintained), then WLED and ESPHome.
- Chihiros and Juwel SmartControl are local but rely on community, reverse-engineered code.
- Cloud-only routes (MyJUWEL) do not fit.

## What TankKeeper would need

TankKeeper today never switches a light. It writes each light's schedule (on and off times, optional brightness %) into HA helpers, and an HA automation runs the light from them.

- **Light model**: a light made of one or more channels, each a `light` entity, with a role (white, red, blue, moonlight). Brightness per channel instead of one value.
- **Schedules with ramps**: points in the day with a brightness per channel, and a ramp time between them (sunrise, sunset, siesta, moonlight). Either TankKeeper writes more helpers for the automation, or the automation steps brightness with `transition`.
- **Who runs the day**: a setting that says whether the light's own schedule or TankKeeper's is in charge, so the two never fight. For EHEIM this is the `daycycle` effect on or off.
- **Plants vs fish**: presets for the photoperiod, peak brightness and spectrum, which the rules and Claude can propose as changes like any other setting.

## Open questions for the founder

- Which light does the tank have, or which would you buy? That decides the first integration to support.
- Should TankKeeper keep writing helpers for an automation, or set light entities itself?

## Sources

- [Home Assistant: EHEIM Digital](https://www.home-assistant.io/integrations/eheimdigital/)
- [AquaBle](https://caleb-venner.github.io/projects/aquable/)
- [chihiros-led-control](https://github.com/TheMicDiet/chihiros-led-control)
- [Chihiros forum: request for an open API](https://bbs.chihirosaquaticstudio.com/threads/request-for-open-api-local-integration-options-for-chihiros-devices.2594)
- [Juwel HeliaLux custom component](https://github.com/MrSleeps/Juwel-HeliaLux-Home-Assistant-Custom-Component)
- [Juwel HeliaLux AppControl](https://www.juwel-aquarium.de/en/equipment/lighting/led/helialux-appcontrol)
- [AquaIllumination Hydra and Prime HD thread](https://community.home-assistant.io/t/aquaillumination-hydra-and-prime-hd-lights/123552)
- [Aquatlantis Ori custom component](https://community.home-assistant.io/t/custom-component-aquatlantis-ori-integration/918928)
- [Red Sea LED thread](https://community.home-assistant.io/t/red-sea-led-aquarium-lights/455008)
- [Fluval Aquasky BLE thread](https://community.home-assistant.io/t/fluval-aquasky-ble-rgb-light/259598?page=9)
- [reef-pi Kessil controller](https://learn.adafruit.com/reef-pi-lighting-controller?view=all)
- [WLED fish tank lighting](https://wled.discourse.group/t/fishtank-lighting/5519)
- [Adaptive Lighting](https://github.com/basnijholt/adaptive-lighting/blob/master/README.md)
- [Aquarium and terrarium lighting control thread](https://community.home-assistant.io/t/aquarium-terrarium-lighting-control/900871)
