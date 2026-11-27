"""Serves a stored photo to a signed-in admin, by the id of its check."""

from aiohttp import web
from homeassistant.components.http.const import KEY_HASS_USER
from homeassistant.helpers.http import KEY_HASS, HomeAssistantView

from .const import DOMAIN
from .domain import NotFoundError
from .photos import PHOTO_PATH, is_photo_id
from .service import TankkeeperService

CACHE_CONTROL = "private, max-age=86400"


class PhotoView(HomeAssistantView):
    """GET a photo. Only an admin may see it: photos show the owner's home."""

    url = PHOTO_PATH + "/{photo_id}"
    name = f"api:{DOMAIN}:photo"
    requires_auth = True

    async def get(self, request: web.Request, photo_id: str) -> web.StreamResponse:
        """The photo, or 404 when the id is unknown or its photo is gone."""
        if not request[KEY_HASS_USER].is_admin:
            raise web.HTTPUnauthorized
        hass = request.app[KEY_HASS]
        entries = hass.config_entries.async_loaded_entries(DOMAIN)
        if not entries or not is_photo_id(photo_id):
            raise web.HTTPNotFound
        service: TankkeeperService = entries[0].runtime_data
        try:
            path = service.photo_path(service.photo_check(photo_id))
        except NotFoundError as err:
            raise web.HTTPNotFound from err
        if path is None or not await hass.async_add_executor_job(path.is_file):
            raise web.HTTPNotFound
        return web.FileResponse(path, headers={"Cache-Control": CACHE_CONTROL})
