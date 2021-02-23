const axios = require('axios')
const qs = require('qs')
const axiosRateLimit = require('axios-rate-limit')
const axiosRetry = require('retry-axios')

class IcsClient {

  /***
   * @param clientId API client ID
   * @param clientSecret API secret
   * @param region one of: 'emea', 'apac', 'nam'
   */
  constructor (clientId, clientSecret, region) {
    this._clientId = clientId
    this._clientSecret = clientSecret
    this._icsClient = axiosRateLimit(
      axios.create({ baseURL: this._getICSBaseURL(region) }),
      { maxRequests: 16, perMilliseconds: 60 * 1000 }
    )
    this._icsClient.defaults.raxConfig = {
      instance: this._icsClient,
      retries: 3,
      retryDelay: 10000,
      backoffType: 'exponential',
      statusCodesToRetry: [[429, 429], [500, 599]],
      onRetryAttempt: err => {
        const cfg = axiosRetry.getConfig(err)
        console.log(`Retry attempt #${cfg.currentRetryAttempt}`)
      }
    }
    axiosRetry.attach(this._icsClient)
    this._oidcClient = axios.create({ baseURL: this._getOIDCBaseURL(region) })
  }

  /**
   * Delete interaction metadata and all related content.
   * @param guids GUIDs of interactions to remove
   * @returns {PromiseLike<T>}
   */
  deleteInteractions (guids) {
    return this._authenticate()
      .then(token => this._icsClient.post(
        '/interactions/delete-batch',
        {guids},
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.newvoicemedia.v3+json',
            'x-nvm-application': 'node-sample'
          }
        }))
      .then(
        r => r.data,
        e => {
          if (e.response && e.response.data) {
            console.error('Delete failed', e.response.statusText, e.response.data.message)
          } else {
            console.error('Delete failed', e)
          }
          throw e
        }
      )
  }

  _authenticate () {
    return this._oidcClient.post('/connect/token',
      qs.stringify({
        grant_type: 'client_credentials',
        scope: 'interaction-content:delete'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        auth: {
          username: this._clientId,
          password: this._clientSecret
        }
      })
      .then(r => r.data.access_token, e => {
        console.error('Authentication failed', e)
        throw e
      })
  }

  _getOIDCBaseURL (region) {
    if (region.toLowerCase() === 'itg-test-ric') {
      return 'https://itg-test-ric.nvminternal.net/Auth'
    }
    return `https://${region}.newvoicemedia.com/Auth`
  }

  _getICSBaseURL (region) {
    if (region.toLowerCase() === 'itg-test-ric') {
      return 'https://api-itg-test-ric.nvminternal.net/interaction-content'
    }
    return `https://${region}.api.newvoicemedia.com/interaction-content`
  }
}

module.exports = IcsClient
