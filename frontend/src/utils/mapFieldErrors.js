export function mapFieldErrors(details) {
  if (!Array.isArray(details)) return {};
  return details.reduce((acc, item) => {
    if (item.field) acc[item.field] = item.message;
    return acc;
  }, {});
}
