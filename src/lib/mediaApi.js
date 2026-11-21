// Helpers for the R2 media Worker (see media-api/ next to this project).
// VITE_MEDIA_API_URL must be set in .env locally and in Vercel's environment variables.
const MEDIA_API = import.meta.env.VITE_MEDIA_API_URL;

// POST JSON to the Worker; throws with the Worker's error message on failure.
export async function callMediaApi(path, body) {
  if (!MEDIA_API) throw new Error("VITE_MEDIA_API_URL is not set.");
  const res = await fetch(`${MEDIA_API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// PUT a file to a presigned R2 URL, reporting progress 0–100.
export function putToR2(url, file, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`R2 upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload (check the bucket CORS policy)."));
    xhr.onabort = () => reject(new Error("Upload cancelled."));
    xhr.send(file);
  });
}
