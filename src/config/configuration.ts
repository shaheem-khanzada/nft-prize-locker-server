export default () => ({
    NODE_ENV: process.env.NODE_ENV,
    port: parseInt(process.env.PORT, 10) || 3000,
    databaseUrl: process.env.DATABASE_URL,
    blockchainNetworkUrl: process.env.RCP_URL,
    contractAddress: process.env.CONTRACT_ADDRESS
});