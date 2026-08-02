# File & Media Handling

This app does **not upload, store, or display any user files or images**.

- No `UploadFile` integration calls exist.
- No `file_url` fields are stored on any entity.
- No `<img>` tags or `Image` components render user-supplied media.
- No private/signed file URLs are generated.

The only static assets are:
- `index.html` favicon/manifest references (bundled at build time).
- Lucide React icons (SVG, rendered inline by the icon library).

## Migration Note

No file storage migration is needed. If you add file uploads in the future, you will need an object storage service (S3, Cloudflare R2, etc.) and a signed-URL endpoint.