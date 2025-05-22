import { useState } from "react";

const useExpandableText = (text = "", length = 100) => {
  const [expanded, setExpanded] = useState(false);

  const isTruncated = text?.length > length;
  const displayText =
    expanded || !isTruncated ? text : text.slice(0, length).trim() + "...";

  const toggleExpand = () => setExpanded((prev) => !prev);

  return { displayText, isTruncated, expanded, toggleExpand };
};

export default useExpandableText;
