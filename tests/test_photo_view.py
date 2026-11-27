"""Photos are served only to a signed-in admin, and reach the AI task entity through Home Assistant's media source."""

from homeassistant.components import media_source
from homeassistant.components.media_source import Unresolvable
from homeassistant.core import HomeAssistant
from homeassistant.setup import async_setup_component
import pytest
from pytest_homeassistant_custom_component.common import MockConfigEntry
from pytest_homeassistant_custom_component.typing import ClientSessionGenerator, WebSocketGenerator

from custom_components.tankkeeper.service import TankkeeperService

from .agents import AI_TASK, CAMERA, PHOTO, FakeCamera, FakeClaude, async_add_camera
from .common import Caller, Panel, apply, dict_of, str_of

pytestmark = [pytest.mark.freeze_time("2026-11-26T08:00:00+00:00")]

UNKNOWN = "01JD0000000000000000000000"


@pytest.fixture
async def check_id(call: Caller, claude: FakeClaude) -> str:
    """A photo check with a photo."""
    fake: FakeCamera = await async_add_camera(call.hass)
    assert fake.entity_id == CAMERA
    await apply(call, await call.ok("set_camera", camera=CAMERA, check_time="", reason="Camera"))
    await apply(call, await call.ok("set_claude", ai_task=AI_TASK, reason="Photo checks"))
    return str_of((await call.ok("check_now"))["id"])


async def test_an_admin_gets_the_photo(hass_client: ClientSessionGenerator, check_id: str) -> None:
    client = await hass_client()

    response = await client.get(f"/api/tankkeeper/photos/{check_id}")

    assert response.status == 200
    assert response.content_type == "image/jpeg"
    assert response.headers["Cache-Control"] == "private, max-age=86400"
    assert await response.read() == PHOTO


async def test_nobody_else_gets_the_photo(
    hass_client: ClientSessionGenerator,
    hass_client_no_auth: ClientSessionGenerator,
    hass_read_only_access_token: str,
    check_id: str,
) -> None:
    anyone = await hass_client_no_auth()
    assert (await anyone.get(f"/api/tankkeeper/photos/{check_id}")).status == 401

    read_only = await hass_client(hass_read_only_access_token)
    assert (await read_only.get(f"/api/tankkeeper/photos/{check_id}")).status == 401


@pytest.mark.parametrize(
    ("photo_id", "status"),
    [
        (UNKNOWN, 404),
        ("01jd0000000000000000000000", 404),
        ("configuration.yaml", 404),
        ("..%2F..%2Fconfiguration.yaml", 400),
    ],
)
async def test_an_unknown_photo_is_not_found(
    hass_client: ClientSessionGenerator, check_id: str, photo_id: str, status: int
) -> None:
    client = await hass_client()

    assert (await client.get(f"/api/tankkeeper/photos/{photo_id}")).status == status


async def test_a_check_whose_photo_is_gone_is_not_found(
    hass: HomeAssistant, hass_client: ClientSessionGenerator, call: Caller, check_id: str, loaded_entry: MockConfigEntry
) -> None:
    service: TankkeeperService = loaded_entry.runtime_data
    path = service.photo_path(service.photo_check(check_id))
    assert path is not None
    await hass.async_add_executor_job(path.unlink)
    client = await hass_client()

    assert (await client.get(f"/api/tankkeeper/photos/{check_id}")).status == 404


async def test_a_link_from_the_panel_opens_without_signing_in(
    hass_ws_client: WebSocketGenerator, hass_client_no_auth: ClientSessionGenerator, check_id: str
) -> None:
    panel = Panel(await hass_ws_client())
    latest = dict_of((await panel.ok("get_camera"))["latest"])
    anyone = await hass_client_no_auth()

    response = await anyone.get(str_of(latest["photo_url"]))

    assert response.status == 200
    assert await response.read() == PHOTO


async def test_a_link_signed_with_no_owner_does_not_open(
    hass_client_no_auth: ClientSessionGenerator, call: Caller, check_id: str
) -> None:
    latest = dict_of((await call.ok("get_camera"))["latest"])
    anyone = await hass_client_no_auth()

    assert (await anyone.get(str_of(latest["photo_url"]))).status == 401


async def test_the_media_source_resolves_a_photo_to_its_file(
    hass: HomeAssistant, check_id: str, loaded_entry: MockConfigEntry
) -> None:
    media = await media_source.async_resolve_media(hass, f"media-source://tankkeeper/{check_id}", None)

    service: TankkeeperService = loaded_entry.runtime_data
    assert media.mime_type == "image/jpeg"
    assert media.path == service.photo_path(service.photo_check(check_id))
    assert media.url.startswith(f"/api/tankkeeper/photos/{check_id}")


@pytest.mark.parametrize("identifier", [UNKNOWN, "x/../y", ""])
async def test_the_media_source_resolves_nothing_else(hass: HomeAssistant, check_id: str, identifier: str) -> None:
    with pytest.raises(Unresolvable):
        await media_source.async_resolve_media(hass, f"media-source://tankkeeper/{identifier}", None)


async def test_the_media_source_lists_the_photos(hass: HomeAssistant, check_id: str) -> None:
    browsed = await media_source.async_browse_media(hass, "media-source://tankkeeper")

    assert browsed.title == "Tankkeeper photos"
    assert [(child.media_content_id, child.title, child.media_content_type) for child in browsed.children or []] == [
        (f"media-source://tankkeeper/{check_id}", "26 Nov 2026 08:00", "image/jpeg")
    ]


async def test_the_media_source_needs_a_loaded_tank(hass: HomeAssistant) -> None:
    assert await async_setup_component(hass, "media_source", {})
    assert await async_setup_component(hass, "tankkeeper", {})

    with pytest.raises(Unresolvable):
        await media_source.async_resolve_media(hass, f"media-source://tankkeeper/{UNKNOWN}", None)
    with pytest.raises(Unresolvable):
        await media_source.async_browse_media(hass, "media-source://tankkeeper")
