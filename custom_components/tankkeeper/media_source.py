"""Photos as a media source, so the AI task entity gets a stored photo as an attachment."""

from typing import override

from homeassistant.components.media_player.const import MediaClass
from homeassistant.components.media_source import (
    BrowseMediaSource,
    MediaSource,
    MediaSourceItem,
    PlayMedia,
    Unresolvable,
)
from homeassistant.core import HomeAssistant
from homeassistant.util import dt as dt_util

from .const import DOMAIN
from .domain import NotFoundError
from .photos import PHOTO_PATH, is_photo_id
from .service import TankkeeperService

TITLE = "Tankkeeper photos"
TIME_FORMAT = "%d %b %Y %H:%M"


async def async_get_media_source(hass: HomeAssistant) -> TankkeeperMediaSource:
    """The photos of the loaded tank."""
    return TankkeeperMediaSource(hass)


class TankkeeperMediaSource(MediaSource):
    """Each stored photo, by the id of its check, newest first."""

    name = TITLE

    def __init__(self, hass: HomeAssistant) -> None:
        """Find the loaded tank when asked."""
        super().__init__(DOMAIN)
        self.hass = hass

    def _service(self) -> TankkeeperService:
        entries = self.hass.config_entries.async_loaded_entries(DOMAIN)
        if not entries:
            raise Unresolvable("Tankkeeper is not loaded")
        service: TankkeeperService = entries[0].runtime_data
        return service

    @override
    async def async_resolve_media(self, item: MediaSourceItem) -> PlayMedia:
        service = self._service()
        if not is_photo_id(item.identifier):
            raise Unresolvable(f"No photo {item.identifier}")
        try:
            check = service.photo_check(item.identifier)
        except NotFoundError as err:
            raise Unresolvable(f"No photo {item.identifier}") from err
        path = service.photo_path(check)
        if path is None or check.content_type is None:
            raise Unresolvable(f"The photo {item.identifier} is no longer kept")
        return PlayMedia(f"{PHOTO_PATH}/{check.id}", check.content_type, path=path)

    @override
    async def async_browse_media(self, item: MediaSourceItem) -> BrowseMediaSource:
        service = self._service()
        children = [
            BrowseMediaSource(
                domain=DOMAIN,
                identifier=check.id,
                media_class=MediaClass.IMAGE,
                media_content_type=check.content_type,
                title=dt_util.as_local(check.time).strftime(TIME_FORMAT),
                can_play=True,
                can_expand=False,
            )
            for check in reversed(service.photo_checks())
            if check.content_type is not None
        ]
        return BrowseMediaSource(
            domain=DOMAIN,
            identifier=None,
            media_class=MediaClass.APP,
            media_content_type="",
            title=TITLE,
            can_play=False,
            can_expand=True,
            children_media_class=MediaClass.IMAGE,
            children=children,
        )
