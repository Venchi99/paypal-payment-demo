const fs = require("fs");
const path = require("path");

const host = "http://localhost:3001/static";
const bookFilePath = path.join(__dirname, "./static/book.pdf");
const deleteInterval = 30000;

const getBookDownloadUrl = () => {
  const copiedFileName = `${new Date().valueOf()}.pdf`;
  // generate random file path
  const randomFilePath = path.join(__dirname, `./static/${copiedFileName}`);
  // copy file
  fs.copyFileSync(bookFilePath, randomFilePath);

  // delete after deleteInterval
  setTimeout(() => {
    fs.unlinkSync(randomFilePath);
  }, deleteInterval);

  return `${host}/${copiedFileName}`;
};

module.exports = { getBookDownloadUrl }; //
