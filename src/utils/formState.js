export const createFormState = (initialValue = {}) => {
  let value = { ...initialValue };
  const touched = new Set();
  let errors = {};

  return {
    get value() {
      return value;
    },
    get touched() {
      return Array.from(touched);
    },
    get errors() {
      return errors;
    },
    setField(field, nextValue) {
      value = { ...value, [field]: nextValue };
      touched.add(field);
      return value;
    },
    setValue(nextValue) {
      value = { ...nextValue };
      return value;
    },
    setErrors(nextErrors) {
      errors = { ...nextErrors };
      return errors;
    },
    reset(nextValue = initialValue) {
      value = { ...nextValue };
      touched.clear();
      errors = {};
    }
  };
};
