'use strict';
/**
 * cryptoapis-sdk — HTTP transport layer
 * ----------------------------------------------------------------------------
 * Faithful re-implementation of the OpenAPI Generator `typescript-node` profile
 * runtime (the `request` + `bluebird` HTTP core) for the CryptoAPIs Blockchain
 * Data / Fees / Broadcast / Subscriptions endpoints actually used by DeSciX.
 *
 * This is a COMMITTED build (see README "Regenerating from the OpenAPI spec").
 * The call surface, argument order, auth model (`setApiKey(0, key)` →
 * `X-API-Key` header) and return shape (`{ response, body }` where
 * `body.data.item(s)` carries the payload) match the official CryptoAPIs SDK
 * so the consuming services need ZERO changes.
 *
 * Base URL + auth verified live (docs/design/ws-admin-b1-cryptoapis-live-verification.md):
 *   base : https://rest.cryptoapis.io/v2
 *   auth : X-API-Key: <key>
 */

const request = require('request');
const Promise = require('bluebird');

const DEFAULT_BASE_PATH = 'https://rest.cryptoapis.io/v2';

/**
 * Enum mirrors the generator's `<Api>.ApiKeyAuth` index. The CryptoAPIs SDK
 * exposes a single api-key security scheme, so `setApiKey(0, key)` selects it.
 */
const ApiKeyEnum = { apiKey: 0 };

/**
 * Base class for all generated *Api classes. Holds the api key + base path and
 * performs the actual HTTP call with the CryptoAPIs envelope conventions.
 */
class ApiBase {
    constructor(basePath) {
        this.basePath = basePath || DEFAULT_BASE_PATH;
        this._apiKey = null;
        this.defaultHeaders = {};
        // Mirrors the generator field so existing test monkey-patches that read
        // `api.authentications` keep working.
        this.authentications = {
            ApiKeyAuth: { apiKey: null }
        };
    }

    /**
     * setApiKey(0, key) — matches the generated SDK signature. The first arg is
     * the security-scheme enum index (only ApiKeyAuth exists); the second is the
     * key value placed in the X-API-Key header.
     */
    setApiKey(_enumIndex, value) {
        this._apiKey = value;
        this.authentications.ApiKeyAuth.apiKey = value;
    }

    /**
     * Low-level request. Returns a bluebird Promise resolving to
     * `{ response, body }` (parsed JSON body), matching the generator runtime.
     * Rejects with an Error carrying `.statusCode`, `.response`, and `.body`.
     *
     * @param {string} method  HTTP verb
     * @param {string} pathTemplate  e.g. '/addresses-latest/evm/{blockchain}/{network}/{address}'
     * @param {Object} pathParams  values substituted into the template
     * @param {Object} [opts]  { query, body, context }
     */
    _request(method, pathTemplate, pathParams, opts) {
        opts = opts || {};
        if (!this._apiKey) {
            return Promise.reject(new Error('cryptoapis-sdk: API key not set — call setApiKey(0, key) first'));
        }

        let localPath = pathTemplate;
        for (const k of Object.keys(pathParams || {})) {
            const v = pathParams[k];
            if (v === undefined || v === null) {
                return Promise.reject(new Error(`cryptoapis-sdk: required path param '${k}' is missing for ${pathTemplate}`));
            }
            localPath = localPath.replace(`{${k}}`, encodeURIComponent(String(v)));
        }

        const queryParameters = {};
        if (opts.context !== undefined && opts.context !== null) {
            queryParameters.context = opts.context;
        }
        if (opts.query) {
            for (const k of Object.keys(opts.query)) {
                if (opts.query[k] !== undefined && opts.query[k] !== null) {
                    queryParameters[k] = opts.query[k];
                }
            }
        }

        const headers = Object.assign(
            { Accept: 'application/json', 'Content-Type': 'application/json', 'X-API-Key': this._apiKey },
            this.defaultHeaders
        );

        const requestOptions = {
            method,
            uri: this.basePath + localPath,
            qs: queryParameters,
            json: true,
            headers
        };
        if (opts.body !== undefined && opts.body !== null) {
            requestOptions.body = opts.body;
        }

        return new Promise((resolve, reject) => {
            request(requestOptions, (error, response, body) => {
                if (error) {
                    return reject(error);
                }
                if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                    return resolve({ response, body });
                }
                const err = new Error(
                    `cryptoapis-sdk: HTTP ${response.statusCode} for ${method} ${localPath}` +
                    (body && body.error && body.error.message ? ` — ${body.error.message}` : '')
                );
                err.statusCode = response.statusCode;
                err.response = response;
                err.body = body;
                return reject(err);
            });
        });
    }
}

module.exports = { ApiBase, ApiKeyEnum, DEFAULT_BASE_PATH };
