export default () => ({
    NODE_ENV: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10) || 3000,
    databaseUrl: process.env.DATABASE_URL,
    blockchainNetworkUrl: process.env.RCP_URL,
    contractAddress: process.env.CONTRACT_ADDRESS,
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
    youtubeBaseUrl: "https://www.googleapis.com/youtube/v3",
    youtubeApiKey: process.env.YOUTUBE_API_KEY,
    tokenAddress: process.env.TOKEN_ADDRESS,
    httpsInfuraUrl: process.env.RCP_URL_HTTPS
});