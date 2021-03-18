const axios = require("axios");
const qs = require("qs");
const axiosRateLimit = require("axios-rate-limit");
const axiosRetry = require("retry-axios");
const fs = require("fs").promises;

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
    this._icsClient = axiosRateLimit(
      axios.create({ baseURL: this._getICSBaseURL(region) }),
      { maxRequests: 160, perMilliseconds: 60 * 1000 }
    );
    this._icsClient.defaults.raxConfig = {
      instance: this._icsClient,
      retries: 3,
      retryDelay: 10000,
      backoffType: "exponential",
      statusCodesToRetry: [
        [429, 429],
        [500, 599],
      ],
      onRetryAttempt: (err) => {
        const cfg = axiosRetry.getConfig(err);
        console.log(`Retry attempt #${cfg.currentRetryAttempt}`);
      },
    };
    axiosRetry.attach(this._icsClient);
    this._oidcClient = axios.create({ baseURL: this._getOIDCBaseURL(region) });
  }

  /***
   * Search for interactions
   * @param start ISO8601 date to search interactions from
   * @param end ISO8601 date to search interactions to
   * @param continuationToken token needed to fetch next page or null
   * @param pageSize How many items will one page contain. Maximum allowed value by API is 1000
   * @returns {PromiseLike<T | void>} Response contains an JSON object:
   * {
   *  "items" :[],
   *  "meta": {
   *    "nextContinuationToken": null
   *  }
   * }
   * "items" are used by IcsClient#downloadPage method.
   * "meta" describes paging:
   *  - "nextContinuationToken": token required to get next page of results. If there is no next page token value will be null.
   */
  search(start, end, continuationToken = undefined, pageSize = 1000) {
    return this._authenticate()
      .then((token) =>
        this._icsClient.get("/interactions", {
          params: {
            start,
            end,
            limit: pageSize,
            continuationToken,
          },
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.newvoicemedia.v3+json",
            "x-nvm-application": "node-sample",
          },
        })
      )
      .then(
        (r) => r.data,
        (e) => {
          if (e.response && e.response.data) {
            console.error(
              "Search failed",
              e.response.data.message,
              e.response.statusText
            );
          } else {
            console.error("Search failed", e);
          }
          throw e;
        }
      );
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
    return this._authenticate()
      .then((token) =>
        this._icsClient.request({
          responseType: "arraybuffer",
          url: `${contentUrl}`,
          method: "get",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.newvoicemedia.v3+json",
            "x-nvm-application": "node-sample",
          },
        })
      )
      .then(
        (r) => this._saveToDisk(r, interactionId, contentKey),
        (e) => {
          console.error(
            `Content ${contentKey} couldn't be downloaded for ${interactionId} - ${contentUrl}`,
            e.response
          );
          throw e;
        }
      )
      .then(() =>
        console.log(`Content ${contentKey} was downloaded for ${interactionId}`)
      );
  }

  /**
   * Download all content of an interaction.
   * Content will be downloaded to folder specified by IcsClient#_downloadFolder.
   * @param interactionId GUID of an interaction
   * @param contentList List of content
   * @returns {PromiseLike<T | void>}
   */
  downloadAllContent(interactionId, contentList) {
    console.log(
      `All content for interaction ${interactionId} will be downloaded`
    );
    return Promise.all(
      contentList.map((c) => this.downloadContent(interactionId, c.contentKey))
    ).then(() =>
      console.log(`All content for interaction ${interactionId} downloaded\n`)
    );
  }

  /**
   * Get interaction metadata and all related content.
   * @param guid GUID of interaction
   * @returns {PromiseLike<T>}
   */
  getInteraction(guid) {
    return this._authenticate()
      .then((token) =>
        this._icsClient.get(`/interactions/${guid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/vnd.newvoicemedia.v3+json",
            "x-nvm-application": "node-sample",
          },
        })
      )
      .then(
        (r) => r.data,
        (e) => {
          if (e.response && e.response.data) {
            console.error(
              "Get interaction failed",
              e.response.statusText,
              e.response.data.message
            );
          } else {
            console.error("Get interaction failed", e);
          }
          throw e;
        }
      );
  }

  _authenticate() {
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
        (r) => r.data.access_token,
        (e) => {
          console.error("Authentication failed", e);
          throw e;
        }
      );
  }

  _saveToDisk(response, interactionId, contentKey) {
    return fs.writeFile(
      `${
        this._downloadFolder
      }/${interactionId}_${contentKey}${this._determineExtension(
        response.headers
      )}`,
      response.data
    );
  }

  _determineExtension(headers) {
    const contentType = headers["content-type"];
    if (!contentType) {
      return "";
    }
    if (contentType.includes("wav")) {
      return ".wav";
    }
    if (contentType.includes("json")) {
      return ".json";
    }
    if (contentType.includes("webm")) {
      return ".webm";
    }
    return "";
  }

  _getOIDCBaseURL(region) {
    if (region.toLowerCase() === "itg-test-ric") {
      return "https://itg-test-ric.nvminternal.net/Auth";
    }
    return `https://${region}.newvoicemedia.com/Auth`;
  }

  _getICSBaseURL(region) {
    if (region.toLowerCase() === "itg-test-ric") {
      return "https://api-itg-test-ric.nvminternal.net/interaction-content";
    }
    return `https://${region}.api.newvoicemedia.com/interaction-content`;
  }
}

module.exports = IcsClient;
