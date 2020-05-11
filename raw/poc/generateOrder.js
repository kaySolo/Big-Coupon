let puppeteer = require("puppeteer");
let fs = require("fs");
let cFile = process.argv[2];

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
 }

(async function(){
    try{

        //read cred file
        let data = await fs.promises.readFile(cFile);
        let {user, pwd, url} = JSON.parse(data);

        //launch browser
        let browser =  await puppeteer.launch({
            headless : false,
            defaultViewport : null,
            args : ["--start-maximized", "--disable-notifications","--incognito"]
        })

        // tab
        let tabs = await browser.pages();
        let tab = tabs[0];

        //menu page
        await tab.goto(url, {waitUntil: "networkidle2"});

        //login
        await tab.click(".prf-grp-txt");
        // await tab.waitForNavigation({waitUntil: "networkidle2"});

        //facebook login
        await tab.waitForSelector(".btn--blue");
        await delay(2000);
        const pageTarget = tab.target(); //save this to know that this was the opener
        await tab.click(".btn--blue");

        //new page => fb login opens here
        const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget); //check that you opened this page, rather than just checking the url
        const newPage = await newTarget.page(); //get the page object
        // await newPage.once("load",()=>{}); //this doesn't work; wait till page is loaded
        await newPage.waitForSelector("body"); //wait for page to be loaded

        // await tab.waitForNavigation({waitUntil: "networkidle2"});
        await newPage.waitForSelector("input[type=text]");
        await newPage.waitForSelector("input[type=password]");
        
        Promise.all([await newPage.type("input[type=text]", user), await newPage.type("input[type=password]", pwd)])
        
        await newPage.click("input[type=submit]");

        //wait for original page to load
        await tab.waitForNavigation({waitUntil: "networkidle2"});

        //add pizza to cart
        

        

        
        

    }
    catch(err){
        console.log("Error "+ err);
    }
})()
