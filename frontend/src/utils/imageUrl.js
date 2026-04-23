const buildProxyUrl = (value, apiUrl) => {
  if (!value || !apiUrl) return null;
  return `${apiUrl.replace(/\/$/, '')}/api/upload/s3/object/${encodeURIComponent(value)}`;
};

export const resolveStoredImageUrl = (image, bucketUrl, apiUrl) => {
  if (!image) return null;

  if (image.key) {
    return buildProxyUrl(image.key, apiUrl) || image.url || null;
  }

  if (image.url) {
    if (/amazonaws\.com/i.test(image.url)) {
      return buildProxyUrl(image.url, apiUrl) || image.url;
    }
    return image.url;
  }
  if (image.cdnUrl) return image.cdnUrl;

  const value = image.key || image.uuid || null;
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    if (/amazonaws\.com/i.test(value)) {
      return buildProxyUrl(value, apiUrl) || value;
    }
    return value;
  }
  if (apiUrl) return buildProxyUrl(value, apiUrl);
  if (bucketUrl) return `${bucketUrl.replace(/\/$/, '')}/${value}`;

  return `https://ucarecdn.com/${value}/`;
};

export const resolveStoredAssetUrl = (value, bucketUrl, apiUrl) => {
  if (!value) return null;

  if (typeof value === 'object') {
    return resolveStoredImageUrl(value, bucketUrl, apiUrl);
  }

  if (/^https?:\/\//i.test(value)) {
    if (/amazonaws\.com/i.test(value)) {
      return buildProxyUrl(value, apiUrl) || value;
    }
    return value;
  }
  if (apiUrl) return buildProxyUrl(value, apiUrl);
  if (bucketUrl) return `${bucketUrl.replace(/\/$/, '')}/${value}`;

  return `https://ucarecdn.com/${value}/`;
};
