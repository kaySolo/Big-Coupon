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
        let {user, pwd, url, couponUrl} = JSON.parse(data);

        //launch browser
        let browser =  await puppeteer.launch({
            headless : false,
            defaultViewport : null,
            args : ["--start-maximized", "--disable-notifications"]
        })

        // tab
        let tabs = await browser.pages();
        let tab = tabs[0];

        //menu page
        await tab.goto(url, {waitUntil: "networkidle2"});

//**************************LOGIN **********************************************/
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

//*******************************ITEMS ADDED TO CART************************************ */ 
        let order = ["Margherita","Pepper Barbecue Chicken","Indi Chicken Tikka"];
        let orderNo = [];
        let allProducts = await tab.$$(".itm-wrppr");
        // console.log(allProducts.length);

        for(let i=0;i<allProducts.length;i++){
            let currPdt = allProducts[i];
            
            let pdtName = await tab.evaluate(function(ele){
                return ele.querySelector("div").getAttribute("data-label");
            },currPdt)
            
            // console.log((i+1)+" > "+pdtName);
            
            
            for(let j=0;j<order.length;j++){
                if(pdtName === order[j]){
                    orderNo.push(i);
                    console.log("Removed: "+order.splice(j,1));
                    break;
                }
            }
            
            if(order.length==0){
                // console.log(orderNo.length)
                break;
            }
        }

        //all products at add btn array
        let allPdtsAddtoCart = [];

        //add orders from orderNo array to cart
        for(let idx=0;idx<orderNo.length;idx++){
            let pdtToAdd = allProducts[orderNo[idx]];
            console.log(allProducts.length)
            console.log(orderNo[idx])
            // console.log(pdtToAdd)
            // let addToCartBtn = await tab.evaluate(function(ele){

            //     return ele.querySelector("button[data-label=addTocart]");

            // },pdtToAdd)

            await tab.waitForSelector("button[data-label=addTocart]")
            let addToCartBtn = await pdtToAdd.$("button[data-label=addTocart]")

            allPdtsAddtoCart.push(addToCartBtn.click());
        }   

        await Promise.all(allPdtsAddtoCart);
        // console.log("All products added to cart");

// ***************************CHECKOUT**************************************
        await delay(500)
        let checkOutBtn = await tab.$("button[data-label=miniCartCheckout]")
        await checkOutBtn.click();
        await tab.waitForNavigation({waitUntil: "networkidle2"});
        
        await tab.click("div[data-label=offers]");
        // await tab.waitForSelector(".sc-jDwBTQ.lfmjW > input");
        
        //**************************COUPON TESTING **********************************/
        
        //fetch promo codes
        let tab2 = await browser.newPage();
        await tab2.goto(couponUrl, {waitUntil: "networkidle0"});
        let promoCodes = await getPromoCodes(tab2);
        tab2.close();
        
        //testing promo codes
        
        for(let i=0;i<promoCodes.length;i++){
            console.log(promoCodes[i]);
        }
        
        let pUrl = tab.url();

            for(let i=0;i<promoCodes.length;i++){

                let newtab = await browser.newPage();
                

                tryPromoCode(pUrl, newtab, promoCodes[i])
                
            }
              
        

    }
    catch(err){
        console.log(err);
    }
})()

async function getPromoCodes(tab2){


        await tab2.click(".list-inline.go-tLinks > li[data-type=cpn]");

        let allLiElements = await tab2.$$("#category_coupons > ul > li");
        // console.log(allLiElements.length)

        let allPromoCodes = [];

        for(let idx=0;idx<allLiElements.length;idx++){
            //find classname
            let clsname = await tab2.evaluate(function(ele){
                return ele.className;
            },allLiElements[idx])
            
            let promocode;
            // console.log(idx+" "+clsname);
            if(clsname != "hide"){
                promocode = await tab2.evaluate(function(ele){
                    return ele.querySelector("small").textContent
                },allLiElements[idx])

                // console.log(promocode);
                allPromoCodes.push(promocode);
            }
        }
        return allPromoCodes;
}

async function tryPromoCode(pUrl, tab, promoCode){

    await tab.goto(pUrl,{waitUntil:"networkidle2"});
    await tab.click("div[data-label=offers]");
    // await tab.waitForNavigation({waitUntil: "networkidle2"});
    // console.log("nav wait complete");
    await tab.waitForSelector("input[type=text]")
    console.log("selector wait complete")
    // let promoField = await tab.$("input[type=text]");
    // console.log("1");
    // await tab.click("input[type=text]");
    // console.log("field clicked");
    await tab.type("input[type=text]", promoCode);
    await delay(1000);
    await tab.click(".btn--grn");
    
    await tab.waitForSelector(".inpt-offr-cpn-err");
    let resultEle = await tab.$(".inpt-offr-cpn-err")
    let resultText = await tab.evaluate(function(ele){
        return ele.textContent;
    },resultEle)

    console.log(resultText);

    tab.close();

}