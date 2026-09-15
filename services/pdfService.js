const fs = require("fs");
const pdfParse = require("pdf-parse");
const { normalizeWhitespace } = require("../utils/textUtils");

async function extractPages(pdfPath) {
  const pages = [];
  let currentPage = 0;

  const dataBuffer = fs.readFileSync(pdfPath);

  const options = {
    pagerender: async (pageData) => {
      currentPage++;

      const textContent = await pageData.getTextContent({
        normalizeWhitespace: true,
        disableCombineTextItems: false,
      });

      const text = normalizeWhitespace(
        textContent.items
          .map((item) => item.str)
          .join(" ")
      );

      pages.push({
        page: currentPage,
        text,
      });

      return text;
    },
  };

  await pdfParse(dataBuffer, options);

  return pages.sort((a, b) => a.page - b.page);
}

module.exports = {
  extractPages,
};
