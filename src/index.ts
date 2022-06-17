/*!
 * pkce-x
 * Copyright(c) 2022 Nadeen Gamage
 * MIT Licensed
 */

import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import WordArray from 'crypto-js/lib-typedarrays';
import IConfig from "./interfaces/IConfig";
import IObject from "./interfaces/IObject";
import IAuthResponse from "./interfaces/IAuthResponse";
import ITokenResponse from "./interfaces/ITokenResponse";

export default class AuthService {
  private config: IConfig;
  private state: string = '';
  private codeVerifier: string = '';

  constructor(config: IConfig) {
    this.config = config;
  }

  public authorize(additionalParams: IObject = {}) {
    if (this.getCodeFromUrl() === null && this.getToken() === null) {
      window.location.replace(`${this.config.authorization_endpoint}?${this.getQueryString(additionalParams)}`);
    }
  }

  public exchange(additionalParams: IObject = {}): Promise<ITokenResponse> {
    return this.parseAuthResponseUrl(window.location.href).then((q) => {
      return fetch(this.config.token_endpoint, {
        method: 'POST',
        body: new URLSearchParams(
          Object.assign(
            {
              grant_type: 'authorization_code',
              code: q.code,
              client_id: this.config.client_id,
              redirect_uri: this.config.redirect_uri,
              code_verifier: this.getCodeVerifier(),
            },
            additionalParams,
          ),
        ),
        headers: this.getHeaders(),
      }).then((response) => {
        if (response.status === 200) {
          response.clone().json().then((data) => {
            this.getStore().setItem('refresh_token', data.access_token);
            this.getStore().setItem('expires_in', data.expires_in);
            this.getStore().setItem('scope', data.scope);
            this.getStore().setItem('token_type', data.token_type);
          });

          // redirect to application url
          setTimeout(() => {
            window.location.href = this.config.authenticated_url;
          }, 2000);
        }

        if (response.status !== 200) {
          window.location.replace(`${this.config.authorization_endpoint}?${this.getQueryString(additionalParams)}`);
        }

        return response.json()
      });
    }).catch();
  }

  public getToken(): string {
    return this.getStore().getItem('refresh_token') || null;
  }

  public getExpiresIn(): number {
    return parseInt(this.getStore().getItem('expires_in') || '0', 10);
  }

  public getScope(): string {
    return this.getStore().getItem('scope') || null;
  }

  private getQueryString(additionalParams: IObject = {}): string {
    const codeChallenge = this.pkceChallengeFromVerifier();

    const queryString = new URLSearchParams(
      Object.assign(
        {
          response_type: 'code',
          client_id: this.config.client_id,
          state: this.getState(additionalParams.state || null),
          scope: this.config.requested_scopes,
          redirect_uri: this.config.redirect_uri,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        },
        additionalParams,
      ),
    ).toString();

    return queryString;
  }

  private parseAuthResponseUrl(url: string): Promise<IAuthResponse> {
    const params = new URL(url).searchParams;

    return this.validateAuthResponse({
      error: params.get('error'),
      query: params.get('query'),
      state: params.get('state'),
      code: params.get('code'),
    });
  }

  private getHeaders(): HeadersInit {
    if (this.config.client_secret) {
      return {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Authorization': `Basic ${this.getEncodedCredentials()}`,
      };
    } else {
      return {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      };
    }
  }

  private getCodeFromUrl(): string {
    const params = new URL(window.location.href).searchParams;
    return params.get('code') || null;
  }

  private getEncodedCredentials(): string {
    return btoa(`${this.config.client_id}:${this.config.client_secret}`);
  }

  private validateAuthResponse(queryParams: IAuthResponse): Promise<IAuthResponse> {
    return new Promise<IAuthResponse>((resolve, reject) => {
      if (queryParams.error) {
        return reject({ error: queryParams.error });
      }

      if (queryParams.state !== this.getState()) {
        return reject({ error: 'Invalid State' });
      }

      return resolve(queryParams);
    });
  }

  private pkceChallengeFromVerifier(): string {
    const hashed = sha256(this.getCodeVerifier());
    return Base64.stringify(hashed).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private getCodeVerifier(): string {
    if (this.codeVerifier === '') {
      this.codeVerifier = this.randomStringFromStorage('pkce_code_verifier');
    }

    return this.codeVerifier;
  }

  private getState(state: string = null): string {
    const stateKey = 'pkce_state';

    if (state !== null) {
      this.getStore().setItem(stateKey, state);
    }

    if (this.state === '') {
      this.state = this.randomStringFromStorage(stateKey);
    }

    return this.state;
  }

  private randomStringFromStorage(key: string): string {
    const fromStorage = this.getStore().getItem(key);
    if (fromStorage === null) {
      this.getStore().setItem(key, WordArray.random(64));
    }

    return this.getStore().getItem(key) || '';
  }

  private getStore(): Storage {
    return this.config?.storage || sessionStorage;
  }
}