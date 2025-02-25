// execute_instruction.js
const {
    Connection,
    PublicKey,
    clusterApiUrl,
    Keypair,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
  } = require('@solana/web3.js');
const fs = require('fs/promises');
const dotenv = require('dotenv');
const bs58 = require('bs58');
dotenv.config();
  // Replace with your program ID

  async function main() {
    // Connect to the Solana devnet

  const PROGRAM_ID = new PublicKey('B4trfw2vZjcbN2AhfbezLFm1E3t36ku8bCkTHY5xMXrf');
  const K2_WALLET_FILE = await fs.readFile(process.env.K2_WALLET, 'utf8');
  // the wallet is array of integers
  const K2_WALLET = new Uint8Array(JSON.parse(K2_WALLET_FILE));
  const K2_WALLET_KEYPAIR = Keypair.fromSecretKey(K2_WALLET);
  const K2_WALLET_PUBLIC_KEY = K2_WALLET_KEYPAIR.publicKey;
  // Replace with your accounts' public keys
  const SIGNER_PUBLIC_KEY = K2_WALLET_PUBLIC_KEY;
  const MINT_ACCOUNT_PUBLIC_KEY = new PublicKey('FRSQumXUg8xyV91WYgi68dxb8yKDcz9PGVtvXEtfU1u7');
  // calculate the PDA
  const [METADATA_ACCOUNT_PUBLIC_KEY, bump] = PublicKey.findProgramAddressSync(
    [MINT_ACCOUNT_PUBLIC_KEY.toBuffer()],
    PROGRAM_ID
  );
  console.log("Metadata account public key: ", METADATA_ACCOUNT_PUBLIC_KEY.toBase58());
  // IPFS URI to be stored
  const METADATA_URI = Buffer.from('ipfs://QmS4ghgMgfFvqPjB4WKXHaN15ZyT4K4JYZxG4Y8Y8Y8');
  
    const connection = new Connection("http://127.0.0.1:8899", 'confirmed');
  
    // Generate a new keypair for the transaction signer
  
  const signer = K2_WALLET_KEYPAIR;
    // Create the transaction instruction
    const instruction = new Transaction().add({
      keys: [
        { pubkey: SIGNER_PUBLIC_KEY, isSigner: true, isWritable: true },
        { pubkey: MINT_ACCOUNT_PUBLIC_KEY, isSigner: false, isWritable: false },
        { pubkey: METADATA_ACCOUNT_PUBLIC_KEY, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.concat([Buffer.from([1]), METADATA_URI]), // 1 is the instruction type for create_token_metadata
    });
  
    // Send the transaction
    try {
      const signature = await sendAndConfirmTransaction(connection, instruction, [signer]);
      console.log('Transaction successful with signature:', signature);
    } catch (error) {
      console.error('Transaction failed:', error);
    }
  }
  
  main().catch(console.error);