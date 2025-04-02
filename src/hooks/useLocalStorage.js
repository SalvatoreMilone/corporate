import { useState, useEffect, useRef } from "react";

function useLocalStorage(key, initialValue) {
  // Get stored value once at initialization
  const getStoredValue = () => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error("Error reading from localStorage:", error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Use ref to avoid triggering effect on every render
  const initialValueRef = useRef(initialValue);
  const prevKeyRef = useRef(key);

  const setValue = (value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;

      // Only update state if the value has changed
      if (JSON.stringify(valueToStore) !== JSON.stringify(storedValue)) {
        setStoredValue(valueToStore);

        // Save to localStorage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      }
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  };

  // Update stored value if key changes or initialValue changes
  useEffect(() => {
    // Only handle key changes after initial render
    if (prevKeyRef.current !== key) {
      const newValue = getStoredValue();
      setStoredValue(newValue);
      prevKeyRef.current = key;
    }
    // Only update if initialValue changes by reference (avoid frequent re-renders)
    else if (initialValueRef.current !== initialValue) {
      initialValueRef.current = initialValue;
      // If localStorage doesn't have a value, use the new initialValue
      if (window.localStorage.getItem(key) === null) {
        setValue(initialValue);
      }
    }
  }, [key, initialValue]);

  return [storedValue, setValue];
}

export default useLocalStorage;
