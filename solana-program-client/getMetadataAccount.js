const { Connection, PublicKey } = require('@solana/web3.js');

// Connect to the Solana network
const connection = new Connection("http://127.0.0.1:8899", 'confirmed');

// Public key of the target account
const ACCOUNT_PUBLIC_KEY = new PublicKey('7GsqfasUHUw9YHxucPEakwq9U5f3Y5LEBDMLZkJ2HAfp');

async function getAccountData() {
  try {
    // Get account information
    const accountInfo = await connection.getAccountInfo(ACCOUNT_PUBLIC_KEY);

    if (accountInfo === null) {
      console.log('Account does not exist or is inaccessible');
      return;
    }

    // Account data is a Buffer object
    const accountData = accountInfo.data;
    console.log("IPFS URI: ", accountData.toString().slice(1));
    // Deserialize according to the data structure
    // Assuming the data is in JSON format here
    

  } catch (error) {
    console.error('Failed to get account data:', error);
  }
}

getAccountData();