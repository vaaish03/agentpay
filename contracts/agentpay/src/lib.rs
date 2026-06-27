#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, BytesN, Env, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ServiceInfo {
    pub price: i128,
    pub token: Address,
}

#[contracttype]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
pub enum RequestStatus {
    Pending = 0,
    Completed = 1,
    Refunded = 2,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RequestInfo {
    pub client: Address,
    pub provider: Address,
    pub service_id: Symbol,
    pub request_hash: BytesN<32>,
    pub amount: i128,
    pub timeout: u64,
    pub status: RequestStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Service(Address, Symbol), // key for ServiceInfo: (provider, service_id)
    Request(u64),             // key for RequestInfo: request_id
    NextRequestId,            // counter for request IDs
}

#[contract]
pub struct AgentPayContract;

#[contractimpl]
impl AgentPayContract {
    /// Register or update an AI service price and accepted token.
    pub fn register_service(
        env: Env,
        provider: Address,
        service_id: Symbol,
        price: i128,
        token: Address,
    ) {
        provider.require_auth();
        assert!(price > 0, "price must be positive");

        let service = ServiceInfo {
            price,
            token: token.clone(),
        };
        env.storage().instance().set(
            &DataKey::Service(provider.clone(), service_id.clone()),
            &service,
        );

        // Emit registration event
        env.events().publish(
            (symbol_short!("reg_srv"), provider, service_id),
            (price, token),
        );
    }

    /// Retrieve service information.
    pub fn get_service(env: Env, provider: Address, service_id: Symbol) -> Option<ServiceInfo> {
        env.storage()
            .instance()
            .get(&DataKey::Service(provider, service_id))
    }

    /// Create an escrowed payment request for an AI service call.
    pub fn create_request(
        env: Env,
        client: Address,
        provider: Address,
        service_id: Symbol,
        request_hash: BytesN<32>,
        amount: i128,
        timeout_seconds: u64,
    ) -> u64 {
        client.require_auth();

        // Retrieve registered service info to validate
        let service: ServiceInfo = env
            .storage()
            .instance()
            .get(&DataKey::Service(provider.clone(), service_id.clone()))
            .expect("service not registered");

        assert!(amount >= service.price, "insufficient payment amount");
        assert!(timeout_seconds > 0, "timeout must be positive");

        // Transfer funds from client to contract escrow
        let token_client = token::Client::new(&env, &service.token);
        token_client.transfer(&client, &env.current_contract_address(), &amount);

        // Generate next request ID
        let mut request_id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::NextRequestId)
            .unwrap_or(0);
        request_id += 1;
        env.storage()
            .instance()
            .set(&DataKey::NextRequestId, &request_id);

        // Create request record
        let timeout = env.ledger().timestamp() + timeout_seconds;
        let request = RequestInfo {
            client: client.clone(),
            provider: provider.clone(),
            service_id: service_id.clone(),
            request_hash,
            amount,
            timeout,
            status: RequestStatus::Pending,
        };

        env.storage()
            .instance()
            .set(&DataKey::Request(request_id), &request);

        // Emit event
        env.events().publish(
            (symbol_short!("req_new"), request_id, client, provider),
            (service_id, amount, timeout),
        );

        request_id
    }

    /// Claim payment by providing the result hash (called by the provider).
    pub fn claim_payment(env: Env, provider: Address, request_id: u64, result_hash: BytesN<32>) {
        provider.require_auth();

        let mut request: RequestInfo = env
            .storage()
            .instance()
            .get(&DataKey::Request(request_id))
            .expect("request not found");

        assert!(request.provider == provider, "not the request provider");
        assert!(
            request.status == RequestStatus::Pending,
            "request not pending"
        );
        assert!(
            env.ledger().timestamp() < request.timeout,
            "request has expired"
        );

        // Fetch service to get token address
        let service: ServiceInfo = env
            .storage()
            .instance()
            .get(&DataKey::Service(
                request.provider.clone(),
                request.service_id.clone(),
            ))
            .expect("service not registered");

        // Transfer escrowed tokens to provider
        let token_client = token::Client::new(&env, &service.token);
        token_client.transfer(&env.current_contract_address(), &provider, &request.amount);

        // Mark completed
        request.status = RequestStatus::Completed;
        env.storage()
            .instance()
            .set(&DataKey::Request(request_id), &request);

        // Emit event
        env.events().publish(
            (symbol_short!("req_done"), request_id, provider),
            result_hash,
        );
    }

    /// Refund payment to client if request has timed out without completion.
    pub fn refund_request(env: Env, client: Address, request_id: u64) {
        client.require_auth();

        let mut request: RequestInfo = env
            .storage()
            .instance()
            .get(&DataKey::Request(request_id))
            .expect("request not found");

        assert!(request.client == client, "not the request client");
        assert!(
            request.status == RequestStatus::Pending,
            "request not pending"
        );
        assert!(
            env.ledger().timestamp() >= request.timeout,
            "timeout has not expired"
        );

        // Fetch service to get token address
        let service: ServiceInfo = env
            .storage()
            .instance()
            .get(&DataKey::Service(
                request.provider.clone(),
                request.service_id.clone(),
            ))
            .expect("service not registered");

        // Refund escrowed tokens back to client
        let token_client = token::Client::new(&env, &service.token);
        token_client.transfer(&env.current_contract_address(), &client, &request.amount);

        // Mark refunded
        request.status = RequestStatus::Refunded;
        env.storage()
            .instance()
            .set(&DataKey::Request(request_id), &request);

        // Emit event
        env.events().publish(
            (symbol_short!("req_ref"), request_id, client),
            request.amount,
        );
    }

    /// Retrieve request information.
    pub fn get_request(env: Env, request_id: u64) -> Option<RequestInfo> {
        env.storage().instance().get(&DataKey::Request(request_id))
    }
}

mod test;
