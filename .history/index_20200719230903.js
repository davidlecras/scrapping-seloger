const puppeteer = require("puppeteer");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const writeStream = fs.createWriteStream("apiData.csv");
writeStream.write(`Title,Photo,Price \n`);
// Start scraping with Puppeeter
const getAllUrl = async (browser) => {
  const page = await browser.newPage();
  await page.setViewport({ width: 1680, height: 920 });
  await page.goto(
    "https://www.seloger.com/list.htm?projects=2%2C5&types=2%2C1&natures=1%2C2%2C4&places=%5B%7Bcp%3A75%7D%5D&enterprise=0&qsVersion=1.0&LISTING-LISTpg=1",
    {
      waitUntil: "networkidle2",
    }
  );
  await page.waitFor("body");
  const urlToGet = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        ".Page__Wrap-st6q56-0 > .Page__WrapMain-st6q56-1 > .block__ShadowedBlock-sc-10w6hsj-0 > .Card__ContentZone-sc-7insep-3 > .CoveringLink-a3s3kt-0"
      )
    ).map((info) => info.getAttribute("href"))
  );
  return urlToGet;
};
const scrap = async () => {
  const browser = await puppeteer.launch({
    userDataDir: "./user_data",
    headless: false,
  });
  const urlList = await getAllUrl(browser);
  const results = await Promise.all(
    urlList.map((url) => {
      if (url.includes("bellesdemeures")) {
        console.log(url.includes("bellesdemeures"));
        axios.get(url).then((urlResponse) => {
          const $ = cheerio.load(urlResponse.data);
          $(".detail").each((i, element) => {
            const title = $(element)
              .find(".js_carouselImg")
              .attr("title")
              .replace(/,/g, "/");
            const price = $(element).find(".js_price").text();
            const img = $(element).find(".carouselListItem").attr("data-src");
            writeStream.write(`${title}, ${img}, ${price} \n`);
          });
        });
      }
    })
  );
  console.log(urlList);
  browser.close();
};
scrap();
