export const mmkvStorage = {
  setItem: (name: string, value: string) => {
    localStorage.setItem(name, value);
  },
  getItem: (name: string) => localStorage.getItem(name),
  removeItem: (name: string) => {
    localStorage.removeItem(name);
  },
};
