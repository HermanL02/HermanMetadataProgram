use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
    system_instruction,
    program::invoke_signed,
    sysvar::{rent::Rent, Sysvar},
    program_pack::Pack,
    program_option,
};
use spl_token::state::Mint as MintAccount;

// Define struct for metadata storage
#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct TokenMetadata {
    pub ipfs_uri: String,
}

// Define program entrypoint
entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    instruction_data: &[u8],
) -> ProgramResult {
    let instruction = instruction_data[0]; // First byte represents the instruction type

    match instruction {
        1 => create_token_metadata(program_id, accounts, &instruction_data[1..]),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

// Create token metadata function
fn create_token_metadata(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    metadata_uri: &[u8], // IPFS address passed as instruction data
) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();

    let signer = next_account_info(accounts_iter)?; // First account is signer
    let mint_account = next_account_info(accounts_iter)?; // SPL token mint account
    let metadata_account = next_account_info(accounts_iter)?; // PDA for storing metadata
    let system_program = next_account_info(accounts_iter)?; // System Program for creating accounts

    // Verify signer is in the list
    if !signer.is_signer {
        msg!("Missing required signer.");
        return Err(ProgramError::MissingRequiredSignature);
    }

    // Verify token owner
    let token_owner = signer.key;
    let mint_account_data = mint_account.try_borrow_data()?;
    let mint_account_state = MintAccount::unpack(&mint_account_data)?;

    if mint_account_state.mint_authority != solana_program::program_option::COption::Some(*token_owner) {
        msg!("Signer is not the token owner.");
        msg!("Token owner: {}", token_owner);
        msg!("Signer: {}", signer.key);
    
        
        return Err(ProgramError::IllegalOwner);
    }
    
    msg!("Owner Check Passed");
    // Create PDA using mint address as seed
    let (pda, bump) = Pubkey::find_program_address(&[mint_account.key.as_ref()], program_id);

    if pda != *metadata_account.key {
        msg!("Metadata account does not match expected PDA.");
        return Err(ProgramError::InvalidSeeds);
    }

    // Check if metadata account exists, if not, create it
    if metadata_account.lamports() == 0 {
        let rent = Rent::get()?.minimum_balance(100); // Ensure minimum balance for account
        let create_account_ix = system_instruction::create_account(
            signer.key,
            metadata_account.key,
            rent,
            100, // Space for metadata
            program_id,
        );

        invoke_signed(
            &create_account_ix,
            &[
                signer.clone(),
                metadata_account.clone(),
                system_program.clone(),
            ],
            &[&[mint_account.key.as_ref(), &[bump]]], // PDA seeds
        )?;
    }

    // Store IPFS metadata URI in PDA
    let metadata = TokenMetadata {
        ipfs_uri: String::from_utf8(metadata_uri.to_vec()).unwrap(),
    };
    
    let mut metadata_data = metadata_account.try_borrow_mut_data()?;
    metadata.serialize(&mut metadata_data.as_mut())?;

    msg!("Token metadata created successfully.");
    Ok(())
}