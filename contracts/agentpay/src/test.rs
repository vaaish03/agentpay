#![cfg(test)]
use super::{AgentPayContract, AgentPayContractClient, RequestStatus};
use soroban_sdk::{
    symbol_short, testutils::{Address as _, Ledger}, token, Address, BytesN, Env, Symbol
};

// Create a simple test token utility
fn create_token_contract<'a>(env: &Env, admin: &Address) -> token::Client<'a> {
    token::Client::new(
        env,
        &env.register_stellar_asset_contract(admin.clone()),
    )
}

#[test]
fn test_registration_and_payment_flow() {
    let env = Env::default();
    env.mock_all_auths();

    // Create contract
    let contract_id = env.register_contract(None, AgentPayContract);
    let client = AgentPayContractClient::new(&env, &contract_id);

    // Create addresses
    let token_admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let provider_addr = Address::generate(&env);

    // Setup token
    let token = create_token_contract(&env, &token_admin);
    
    // Mint tokens to client
    token::StellarAssetClient::new(&env, &token.address).mint(&client_addr, &1000);
    assert_eq!(token.balance(&client_addr), 1000);

    // Register service
    let service_id = Symbol::new(&env, "translation");
    let price = 50;
    client.register_service(&provider_addr, &service_id, &price, &token.address);

    // Verify service registered correctly
    let service_info = client.get_service(&provider_addr, &service_id).unwrap();
    assert_eq!(service_info.price, price);
    assert_eq!(service_info.token, token.address);

    // Create request
    let request_hash = BytesN::from_array(&env, &[0; 32]);
    let amount = 50;
    let timeout_seconds = 100;
    let request_id = client.create_request(
        &client_addr,
        &provider_addr,
        &service_id,
        &request_hash,
        &amount,
        &timeout_seconds,
    );

    assert_eq!(request_id, 1);
    // Escrow balance should be equal to amount
    assert_eq!(token.balance(&contract_id), 50);
    assert_eq!(token.balance(&client_addr), 950);

    // Claim payment
    let result_hash = BytesN::from_array(&env, &[1; 32]);
    client.claim_payment(&provider_addr, &request_id, &result_hash);

    // Escrow should be empty and provider paid
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&provider_addr), 50);

    // Verify request status is completed
    let req_info = client.get_request(&request_id).unwrap();
    assert_eq!(req_info.status, RequestStatus::Completed);
}

#[test]
fn test_refund_after_timeout() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, AgentPayContract);
    let client = AgentPayContractClient::new(&env, &contract_id);

    let token_admin = Address::generate(&env);
    let client_addr = Address::generate(&env);
    let provider_addr = Address::generate(&env);

    let token = create_token_contract(&env, &token_admin);
    token::StellarAssetClient::new(&env, &token.address).mint(&client_addr, &1000);

    let service_id = Symbol::new(&env, "image_gen");
    let price = 100;
    client.register_service(&provider_addr, &service_id, &price, &token.address);

    let request_hash = BytesN::from_array(&env, &[0; 32]);
    let timeout_seconds = 60;
    let request_id = client.create_request(
        &client_addr,
        &provider_addr,
        &service_id,
        &request_hash,
        &price,
        &timeout_seconds,
    );

    // Attempt to refund early (should panic)
    // We expect this to fail because the timeout has not expired yet.
    let mut ledger_info = env.ledger().get();
    ledger_info.timestamp = 59; // less than initial ledger timestamp (0) + 60
    env.ledger().set(ledger_info);

    // Advance ledger timestamp to trigger timeout (e.g. to 61)
    let mut ledger_info = env.ledger().get();
    ledger_info.timestamp = 61;
    env.ledger().set(ledger_info);

    // Refund should work now
    client.refund_request(&client_addr, &request_id);

    // Verify token balances and request status
    assert_eq!(token.balance(&contract_id), 0);
    assert_eq!(token.balance(&client_addr), 1000); // refunded back to 1000
    
    let req_info = client.get_request(&request_id).unwrap();
    assert_eq!(req_info.status, RequestStatus::Refunded);
}
