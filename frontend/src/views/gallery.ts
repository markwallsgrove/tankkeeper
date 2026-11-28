import { css, html, nothing, type TemplateResult } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { TankkeeperApi } from "../api";
import { TkView, openGallery, shared } from "../base";
import { BACK, EXPAND, textButton } from "../buttons";
import { shortTime } from "../format";
import { finding, heading, photo, photoStyles, verdict } from "../photo";
import "../tk-dialog";
import type { PhotoCheck } from "../types";

/** TankKeeper keeps at most this many photo checks. */
export const GALLERY_LIMIT = 200;

/** Photos shown at first and added by Show more. Each Show more asks again, as photo links last 10 minutes. */
export const GALLERY_PAGE = 20;

const PRUNED = "The photo is no longer kept.";

/** Every photo check kept, newest first, each with what Claude said. Opening one shows it large. */
export class TkGallery extends TkView {
  static override properties = {
    ...TkView.properties,
    photos: { state: true },
    opened: { state: true },
    shown: { state: true },
  };

  static override styles = [
    shared,
    photoStyles,
    css`
      ul.photos {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 12px;
      }
      ul.photos li.photo-check {
        border: 1px solid var(--divider-color, #e0e0e0);
        border-radius: 8px;
        padding: 8px;
      }
      button.open {
        display: block;
        width: 100%;
        padding: 0;
        border: none;
        background: none;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }
      button.open .photo {
        aspect-ratio: 16 / 9;
        object-fit: cover;
        margin: 0 0 8px;
      }
      .pruned {
        display: flex;
        align-items: center;
        justify-content: center;
        aspect-ratio: 16 / 9;
        margin-bottom: 8px;
        border-radius: 8px;
        background: var(--secondary-background-color, #f5f5f5);
      }
      .large .photo {
        max-width: 100%;
      }
    `,
  ];

  declare photos: PhotoCheck[] | undefined;
  /** The photo check shown large, by its id. */
  declare opened: string | undefined;
  /** How many photo checks to ask for. */
  declare shown: number;

  constructor() {
    super();
    this.photos = undefined;
    this.opened = undefined;
    this.shown = GALLERY_PAGE;
  }

  protected override async load(api: TankkeeperApi): Promise<() => void> {
    const listed = await api.call<{ photos: PhotoCheck[] }>("list_photos", {
      limit: this.shown,
    });
    return () => {
      this.photos = listed.photos;
    };
  }

  private showMore(): void {
    this.shown = Math.min(this.shown + GALLERY_PAGE, GALLERY_LIMIT);
    void this.reload();
  }

  /** Show more, while the backend may keep more photo checks than are shown. */
  private renderMore(photos: PhotoCheck[]): TemplateResult | typeof nothing {
    if (photos.length < this.shown || this.shown >= GALLERY_LIMIT) return nothing;
    return html`<div class="row">
      ${textButton({
        icon: EXPAND,
        label: "Show more",
        className: "more",
        onClick: () => {
          this.showMore();
        },
      })}
    </div>`;
  }

  private renderCard(check: PhotoCheck): TemplateResult {
    return html`<li class="photo-check" data-check=${check.id}>
      <button
        class="open"
        type="button"
        aria-label="Open the photo check of ${shortTime(check.time)}"
        @click=${() => (this.opened = check.id)}
      >
        ${check.photo_url === null ? html`<div class="pruned muted">${PRUNED}</div>` : photo(check)}
        <div class="muted">${heading(check)}</div>
      </button>
      ${verdict(check)} ${finding(check)}
    </li>`;
  }

  private renderLarge(): TemplateResult | typeof nothing {
    const check = this.photos?.find((item) => item.id === this.opened);
    if (check === undefined) return nothing;
    return html`<tk-dialog
      class="large"
      wide
      heading=${heading(check)}
      @tk-dialog-closed=${() => (this.opened = undefined)}
    >
      <div class="large">
        ${check.photo_url === null ? html`<p class="muted pruned-note">${PRUNED}</p>` : photo(check)}
        ${verdict(check)} ${finding(check)}
      </div>
    </tk-dialog>`;
  }

  override render(): TemplateResult {
    const photos = this.photos;
    return html`<section id="gallery">
      <div class="row">
        ${textButton({
          icon: BACK,
          label: "Overview",
          className: "back",
          onClick: () => {
            openGallery(this, false);
          },
        })}
      </div>
      <h2>Photos</h2>
      ${this.renderError()}
      ${
        photos === undefined
          ? nothing
          : photos.length === 0
            ? html`<p class="muted">No photos yet.</p>`
            : html`<ul class="photos">
                  ${repeat(
                    photos,
                    (check) => check.id,
                    (check) => this.renderCard(check),
                  )}
                </ul>
                ${this.renderMore(photos)}`
      }
      ${this.renderLarge()}
    </section>`;
  }
}

customElements.define("tk-gallery", TkGallery);
