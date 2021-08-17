const qs = require("qs");
const axios = require("axios");

class OidcClient {

  /**
   * Creates a client that will hold the authentication token
   * @param clientId API client ID
   * @param clientSecret API secret
   * @param region one of: 'emea', 'apac', 'nam'
   */
  constructor(clientId, clientSecret, region) {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._oidcClient = axios.create({ baseURL: this._getOIDCBaseURL(region) });
    this._accessToken = undefined;
    this._tokenExpirationDate = undefined;
  }

  /**
   * @returns {Promise<String>} Returns promise with access token used to authenticate.
   */
  authenticate() {
    if (this._accessToken && !this._isAccessTokenOutdated()) {
      return Promise.resolve(this._accessToken);
    }
    return this._getJwtTokenFromOidcServer()
    .then(r => {
      this._accessToken = r.access_token;
      const tokenExpirationDate = new Date();
      tokenExpirationDate.setSeconds(tokenExpirationDate.getSeconds() + (r.expires_in * 0.9));
      this._tokenExpirationDate = tokenExpirationDate;
      return r.access_token;
    });
  }

  _getJwtTokenFromOidcServer() {
    console.log('Getting token from server')
    return this._oidcClient
        .post(
            "/connect/token",
            qs.stringify({
              grant_type: "client_credentials",
              scope: "interaction-content:read",
            }),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              auth: {
                username: this._clientId,
                password: this._clientSecret,
              },
            }
        )
        .then(
            (r) => {
              return r.data;
            },
            (e) => {
              console.error("Authentication failed", e);
              throw e;
            }
        );
  }

  _getOIDCBaseURL(region) {
    if (region.toLowerCase() === "itg-test-ric") {
      return "https://itg-test-ric.nvminternal.net/Auth";
    }
    return `https://${region}.newvoicemedia.com/Auth`;
  }

  _isAccessTokenOutdated() {
    if(this._tokenExpirationDate) {
      return new Date().getTime() >= this._tokenExpirationDate.getTime();
    }
    return false;
  }
}

module.exports = OidcClient;
