export default interface IConfig {
    client_id: string;
    client_secret?: string;
    redirect_uri: string;
    authorization_endpoint: string;
    token_endpoint: string;
    authenticated_url?: string;
    requested_scopes: string;
    storage?: Storage;
    organization?: string;
  }
  