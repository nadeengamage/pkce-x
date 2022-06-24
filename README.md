# PKCE-X
## _Easily Implement PKCE Authentication in Your JavaScript Application_

[![Build Status](https://travis-ci.org/joemccann/dillinger.svg?branch=master)](https://travis-ci.org/joemccann/dillinger)

PKCE is a security extension to OAuth 2.0 for public clients on mobile devices, designed to prevent malicious applications from intercepting the authorization code.

## Installation

PKCE-X requires [Node.js](https://nodejs.org/) v12+ to run.

Install the dependencies and start the server.

```sh
npm install pkce-x
```

For production environments...

```sh
npm install pkce-x --production
NODE_ENV=production
```
## Usage

Want to contribute? Great!

Dillinger uses Gulp + Webpack for fast developing.
Make a change in your file and instantaneously see your updates!

Open your favorite Terminal and run these commands.

First invoke the auth service form the package:

```sh
import AuthService from "pkce-x";

const service = new AuthService({
  client_id: 'XYZ',
  client_secret: 'XYZ', // Optional. Use this if you want to send basic credentials with a base64 header.
  redirect_uri: 'http://localhost:3000/pkce-demo',
  authorization_endpoint: 'https://example.com/oauth2/authorize',
  token_endpoint: 'https://example.com/oauth2/token',
  authenticated_url: 'http://localhost:3000/dashboard', Optional. // When authentication is successful, redirect to a different page.
  requested_scopes: '*',
  storage: localStorage, // Optioanl. By default it set to session storage.
  organization: "PKCE-X" // Optioanl.
});

```

Authorize the application:

```sh
service.authorize();
```

Exchange the metadata with authentication server and browser:

```sh
service.exchange();
```

Get the access token:

```sh
service.getToken();
```

Get the expire in time:

```sh
service.getExpiresIn();
```

Get the scopes:

```sh
service.getScope();
```

## License

MIT