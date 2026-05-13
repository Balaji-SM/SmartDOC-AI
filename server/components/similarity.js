// utils/similarity.js

const calculateSimilarity = (
  question,
  chunk
) => {
  const cleanQuestion = question
    .toLowerCase()
    .replace(/[^\w\s]/gi, "");

  const cleanChunk = chunk
    .toLowerCase()
    .replace(/[^\w\s]/gi, "");

  const questionWords =
    cleanQuestion.split(/\s+/);

  let score = 0;

  questionWords.forEach((word) => {
    if (
      word.length > 2 &&
      cleanChunk.includes(word)
    ) {
      score += 1;
    }
  });

  return score;
};

module.exports = calculateSimilarity;