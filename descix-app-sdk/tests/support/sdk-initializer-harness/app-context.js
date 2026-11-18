/** `../AppContext` for the harness: the test sets the value SdkInitializer reads. */
export const harnessContext = { value: null };
export function useAppContext() {
  return harnessContext.value;
}
