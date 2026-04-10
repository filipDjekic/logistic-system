type DownloadFileOptions = {
  data: Blob | ArrayBuffer | Uint8Array | string;
  fileName: string;
  mimeType?: string;
};

function toBlob(
  data: DownloadFileOptions['data'],
  mimeType = 'application/octet-stream',
): Blob {
  if (data instanceof Blob) {
    return data;
  }

  if (data instanceof ArrayBuffer) {
    return new Blob([data], { type: mimeType });
  }

  if (data instanceof Uint8Array) {
    const arrayBuffer = data.buffer.slice(
      data.byteOffset,
      data.byteOffset + data.byteLength,
    ) as ArrayBuffer;

    return new Blob([arrayBuffer], { type: mimeType });
  }

  return new Blob([data], { type: mimeType });
}

export function downloadFile({
  data,
  fileName,
  mimeType,
}: DownloadFileOptions): void {
  const blob = toBlob(data, mimeType);
  const objectUrl = window.URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = fileName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  window.URL.revokeObjectURL(objectUrl);
}