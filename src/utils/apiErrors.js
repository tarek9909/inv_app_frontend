export const mapApiErrors = (error) => {
  const fieldErrors = {};
  (error?.errors || []).forEach((entry) => {
    const key = entry?.field || entry?.path;
    if (key) fieldErrors[key] = entry.message;
  });
  return {
    message: error?.message || 'Something went wrong',
    fieldErrors
  };
};
