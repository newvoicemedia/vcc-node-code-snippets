const axios = require('axios');
const qs = require('qs');
const fs = require('fs').promises;

class IcsClient {

  /***
   * @param clientId API client ID
   * @param clientSecret API secret
   * @param region one of: 'emea', 'apac', 'nam'
   * @param downloadFolder folder where files will be downloaded to
   */
  constructor(clientId, clientSecret, region, downloadFolder) {
    this._clientId = clientId;
    this._clientSecret = clientSecret;
    this._downloadFolder = downloadFolder;
    this._icsClient = axios.create({baseURL: `https://${region}.api.newvoicemedia.com/interaction-content`});
    this._oidcClient = axios.create({baseURL: `https://${region}.newvoicemedia.com/Auth`});
  }

  /***
   * Search for interactions
   * @param start ISO8601 date to search interactions from
   * @param end ISO8601 date to search interactions to
   * @param page Page number starting from 1
   * @param pageSize How many items will one page contain. Maximum allowed value by API is 1000
   * @returns {PromiseLike<T | void>} Response contains an JSON object:
   * {
   *  "items" :[],
   *  "meta": {
   *    "page": 1,
   *    "count": 25,
   *    "pageCount": 14,
   *    "totalCount": 359
   *  }
   * }
   * "items" are used by IcsClient#downloadPage method.
   * "meta" describes paging:
   *  - "page": which page search is on
   *  - "count": how many elements are on a page
   *  - "pageCount": how many pages are there
   *  - "totalCount": how many interactions were found in a given time period
   */
  search(start, end, page = 1, pageSize = 1000) {
    return this._authenticate()
        .then(token => this._icsClient.get('/interactions', {
          params: {
            start, end, page,
            limit: pageSize
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.newvoicemedia.v2+json',
            'x-nvm-application': 'node-sample'
          }
        }))
        .then(r => r.data, e => console.error('Search failed', e.message, e.response.statusText))
  }

  /**
   * Download specific content of an interaction.
   * Content will be downloaded to folder specified by IcsClient#_downloadFolder.
   * @param interactionId GUID of an interaction
   * @param contentKey Unique name of content within interaction
   * @returns {PromiseLike<T | void>}
   */
  downloadContent(interactionId, contentKey) {
    const contentUrl = `/interactions/${interactionId}/content/${contentKey}`;
    return this._authenticate().then(
        token => this._icsClient.request({
          responseType: 'arraybuffer',
          url: `${contentUrl}`,
          method: 'get',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.newvoicemedia.v2+json'
          }
        })
    ).then(
        r => this._saveToDisk(r, interactionId, contentKey),
        e => console.error(`Content ${contentKey} couldn't be downloaded for ${interactionId} - ${contentUrl}`, e.response.status)
    ).then(() => console.log(`Content ${contentKey} was downloaded for ${interactionId}`))
  }

  /**
   * Downloads all from a list of items. Items are downloaded to folder  IcsClient#_downloadFolder
   * @param items is a list of interactions and should be coming from IcsClient#search method.
   * @private {PromiseLike<T | void>}
   */
  async downloadPage(items) {
    for (const i of items) {
      await this._downloadAllContent(i.guid, i.content).catch(console.error)
    }
  }

  _authenticate() {
    return this._oidcClient.post('/connect/token',
        qs.stringify({
          grant_type: 'client_credentials',
          scope: 'interaction-content:read'
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
        .then(r => r.data.access_token, e => console.error('Authentication failed', e));
  }

  _downloadAllContent(interactionId, contentList) {
    console.log(`All content for interaction ${interactionId} will be downloaded`)
    return Promise.all(contentList.map(c => this.downloadContent(interactionId, c.contentKey)))
        .then(() => console.log(`All content for interaction ${interactionId} downloaded\n`));
  }

  _saveToDisk(response, interactionId, contentKey) {
    return fs.writeFile(
        `${this._downloadFolder}/${interactionId}_${contentKey}${this._determineExtension(response.headers)}`,
        response.data
    );
  }

  _determineExtension(headers) {
    const contentType = headers['content-type'];
    if (!contentType) {
      return '';
    }
    if (contentType.includes('wav')) {
      return '.wav';
    }
    if (contentType.includes('json')) {
      return '.json';
    }
    if (contentType.includes('webm')) {
      return '.webm';
    }
    return '';
  }
}

module.exports = IcsClient;
