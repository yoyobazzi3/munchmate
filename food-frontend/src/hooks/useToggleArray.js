import { useState } from "react";

/**
 * Manages an array where items can be toggled in or out.
 * @param {Array} initial - Starting array value
 * @returns {[Array, Function, Function]} - [items, toggle(item), setItems]
 */
const useToggleArray = (initial = []) => {
  const [items, setItems] = useState(initial);

  const toggle = (item) =>
    setItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );

  return [items, toggle, setItems];
};

export default useToggleArray;
