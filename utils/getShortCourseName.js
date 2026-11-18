function getCourseShortName(courseName) {
  const ignoredWords = new Set(["in", "of", "and", "the", "for", "on", "to"]);
  return courseName
    .split(/\s+/)
    .filter((word) => word && !ignoredWords.has(word.toLowerCase()))
    .map((word) => word[0].toUpperCase())
    .join("");
}

module.exports = getCourseShortName;
