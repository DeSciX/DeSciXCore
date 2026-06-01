"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HDWalletDataUTXOApi = exports.HDWalletDataUTXOApiApiKeys = void 0;
var request_1 = __importDefault(require("request"));
var models_1 = require("../model/models");
var models_2 = require("../model/models");
var apis_1 = require("./apis");
var defaultBasePath = 'https://rest.cryptoapis.io';
var HDWalletDataUTXOApiApiKeys;
(function (HDWalletDataUTXOApiApiKeys) {
    HDWalletDataUTXOApiApiKeys[HDWalletDataUTXOApiApiKeys["ApiKey"] = 0] = "ApiKey";
})(HDWalletDataUTXOApiApiKeys || (exports.HDWalletDataUTXOApiApiKeys = HDWalletDataUTXOApiApiKeys = {}));
var HDWalletDataUTXOApi = (function () {
    function HDWalletDataUTXOApi(basePathOrUsername, password, basePath) {
        this._basePath = defaultBasePath;
        this._defaultHeaders = {};
        this._useQuerystring = false;
        this.authentications = {
            'default': new models_1.VoidAuth(),
            'ApiKey': new models_2.ApiKeyAuth('header', 'x-api-key'),
        };
        this.interceptors = [];
        if (password) {
            if (basePath) {
                this.basePath = basePath;
            }
        }
        else {
            if (basePathOrUsername) {
                this.basePath = basePathOrUsername;
            }
        }
    }
    Object.defineProperty(HDWalletDataUTXOApi.prototype, "useQuerystring", {
        set: function (value) {
            this._useQuerystring = value;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HDWalletDataUTXOApi.prototype, "basePath", {
        get: function () {
            return this._basePath;
        },
        set: function (basePath) {
            this._basePath = basePath;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(HDWalletDataUTXOApi.prototype, "defaultHeaders", {
        get: function () {
            return this._defaultHeaders;
        },
        set: function (defaultHeaders) {
            this._defaultHeaders = defaultHeaders;
        },
        enumerable: false,
        configurable: true
    });
    HDWalletDataUTXOApi.prototype.setDefaultAuthentication = function (auth) {
        this.authentications.default = auth;
    };
    HDWalletDataUTXOApi.prototype.setApiKey = function (key, value) {
        this.authentications[HDWalletDataUTXOApiApiKeys[key]].apiKey = value;
    };
    HDWalletDataUTXOApi.prototype.addInterceptor = function (interceptor) {
        this.interceptors.push(interceptor);
    };
    HDWalletDataUTXOApi.prototype.deriveAndSyncNewChangeAddressesUTXO = function (blockchain_1, network_1, extendedPublicKey_1, context_1, deriveAndSyncNewChangeAddressesUTXORB_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, deriveAndSyncNewChangeAddressesUTXORB, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_1, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/addresses/derive-and-sync-change'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling deriveAndSyncNewChangeAddressesUTXO.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling deriveAndSyncNewChangeAddressesUTXO.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling deriveAndSyncNewChangeAddressesUTXO.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'POST',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                    body: models_1.ObjectSerializer.serialize(deriveAndSyncNewChangeAddressesUTXORB, "DeriveAndSyncNewChangeAddressesUTXORB")
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_1 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_1(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "DeriveAndSyncNewChangeAddressesUTXOR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    HDWalletDataUTXOApi.prototype.deriveAndSyncNewReceivingAddressesUTXO = function (blockchain_1, network_1, extendedPublicKey_1, context_1, deriveAndSyncNewReceivingAddressesUTXORB_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, deriveAndSyncNewReceivingAddressesUTXORB, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_2, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/addresses/derive-and-sync'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling deriveAndSyncNewReceivingAddressesUTXO.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling deriveAndSyncNewReceivingAddressesUTXO.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling deriveAndSyncNewReceivingAddressesUTXO.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'POST',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                    body: models_1.ObjectSerializer.serialize(deriveAndSyncNewReceivingAddressesUTXORB, "DeriveAndSyncNewReceivingAddressesUTXORB")
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_2 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_2(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "DeriveAndSyncNewReceivingAddressesUTXOR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    HDWalletDataUTXOApi.prototype.getHDWalletXPubYPubZPubAssetsUTXO = function (blockchain_1, network_1, extendedPublicKey_1, context_1, derivation_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, derivation, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_3, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/assets'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling getHDWalletXPubYPubZPubAssetsUTXO.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling getHDWalletXPubYPubZPubAssetsUTXO.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling getHDWalletXPubYPubZPubAssetsUTXO.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                if (derivation !== undefined) {
                    localVarQueryParameters['derivation'] = models_1.ObjectSerializer.serialize(derivation, "'account' | 'bip32'");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'GET',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_3 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_3(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "GetHDWalletXPubYPubZPubAssetsUTXOR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    HDWalletDataUTXOApi.prototype.getHDWalletXPubYPubZPubDetailsUTXO = function (blockchain_1, network_1, extendedPublicKey_1, context_1, derivation_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, derivation, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_4, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/details'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling getHDWalletXPubYPubZPubDetailsUTXO.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling getHDWalletXPubYPubZPubDetailsUTXO.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling getHDWalletXPubYPubZPubDetailsUTXO.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                if (derivation !== undefined) {
                    localVarQueryParameters['derivation'] = models_1.ObjectSerializer.serialize(derivation, "'account' | 'bip32'");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'GET',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_4 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_4(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "GetHDWalletXPubYPubZPubDetailsUTXOR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    HDWalletDataUTXOApi.prototype.listHDWalletXPubYPubZPubTransactionsUTXO = function (blockchain_1, network_1, extendedPublicKey_1, context_1, limit_1, offset_1, derivation_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, limit, offset, derivation, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_5, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/transactions'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling listHDWalletXPubYPubZPubTransactionsUTXO.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling listHDWalletXPubYPubZPubTransactionsUTXO.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling listHDWalletXPubYPubZPubTransactionsUTXO.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                if (limit !== undefined) {
                    localVarQueryParameters['limit'] = models_1.ObjectSerializer.serialize(limit, "number");
                }
                if (offset !== undefined) {
                    localVarQueryParameters['offset'] = models_1.ObjectSerializer.serialize(offset, "number");
                }
                if (derivation !== undefined) {
                    localVarQueryParameters['derivation'] = models_1.ObjectSerializer.serialize(derivation, "'account' | 'bip32'");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'GET',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_5 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_5(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "ListHDWalletXPubYPubZPubTransactionsUTXOR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    HDWalletDataUTXOApi.prototype.listHDWalletXPubYPubZPubUTXOs = function (blockchain_1, network_1, extendedPublicKey_1, context_1, limit_1, offset_1, derivation_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, limit, offset, derivation, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_6, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/unspent-outputs'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling listHDWalletXPubYPubZPubUTXOs.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling listHDWalletXPubYPubZPubUTXOs.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling listHDWalletXPubYPubZPubUTXOs.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                if (limit !== undefined) {
                    localVarQueryParameters['limit'] = models_1.ObjectSerializer.serialize(limit, "number");
                }
                if (offset !== undefined) {
                    localVarQueryParameters['offset'] = models_1.ObjectSerializer.serialize(offset, "number");
                }
                if (derivation !== undefined) {
                    localVarQueryParameters['derivation'] = models_1.ObjectSerializer.serialize(derivation, "'account' | 'bip32'");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'GET',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_6 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_6(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "ListHDWalletXPubYPubZPubUTXOsR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    HDWalletDataUTXOApi.prototype.listSyncedAddressesUTXO = function (blockchain_1, network_1, extendedPublicKey_1, context_1, addressFormat_1, isChangeAddress_1, limit_1, offset_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, addressFormat, isChangeAddress, limit, offset, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_7, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/addresses'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling listSyncedAddressesUTXO.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling listSyncedAddressesUTXO.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling listSyncedAddressesUTXO.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                if (addressFormat !== undefined) {
                    localVarQueryParameters['addressFormat'] = models_1.ObjectSerializer.serialize(addressFormat, "'p2pkh' | 'p2sh' | 'p2wpkh' | 'p2pkh-cash' | 'p2sh-cash'");
                }
                if (isChangeAddress !== undefined) {
                    localVarQueryParameters['isChangeAddress'] = models_1.ObjectSerializer.serialize(isChangeAddress, "string");
                }
                if (limit !== undefined) {
                    localVarQueryParameters['limit'] = models_1.ObjectSerializer.serialize(limit, "number");
                }
                if (offset !== undefined) {
                    localVarQueryParameters['offset'] = models_1.ObjectSerializer.serialize(offset, "number");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'GET',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_7 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_7(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "ListSyncedAddressesUTXOR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    HDWalletDataUTXOApi.prototype.prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPub = function (blockchain_1, network_1, extendedPublicKey_1, context_1, prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB_1) {
        return __awaiter(this, arguments, void 0, function (blockchain, network, extendedPublicKey, context, prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB, options) {
            var localVarPath, localVarQueryParameters, localVarHeaderParams, produces, localVarFormParams, localVarUseFormData, localVarRequestOptions, authenticationPromise, interceptorPromise, _loop_8, _i, _a, interceptor;
            var _this = this;
            if (options === void 0) { options = { headers: {} }; }
            return __generator(this, function (_b) {
                localVarPath = this.basePath + '/hd-wallets/utxo/{blockchain}/{network}/{extendedPublicKey}/transactions/prepare'
                    .replace('{blockchain}', encodeURIComponent(String(blockchain)))
                    .replace('{network}', encodeURIComponent(String(network)))
                    .replace('{extendedPublicKey}', encodeURIComponent(String(extendedPublicKey)));
                localVarQueryParameters = {};
                localVarHeaderParams = Object.assign({}, this._defaultHeaders);
                produces = ['application/json'];
                if (produces.indexOf('application/json') >= 0) {
                    localVarHeaderParams.Accept = 'application/json';
                }
                else {
                    localVarHeaderParams.Accept = produces.join(',');
                }
                localVarFormParams = {};
                if (blockchain === null || blockchain === undefined) {
                    throw new Error('Required parameter blockchain was null or undefined when calling prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPub.');
                }
                if (network === null || network === undefined) {
                    throw new Error('Required parameter network was null or undefined when calling prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPub.');
                }
                if (extendedPublicKey === null || extendedPublicKey === undefined) {
                    throw new Error('Required parameter extendedPublicKey was null or undefined when calling prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPub.');
                }
                if (context !== undefined) {
                    localVarQueryParameters['context'] = models_1.ObjectSerializer.serialize(context, "string");
                }
                Object.assign(localVarHeaderParams, options.headers);
                localVarUseFormData = false;
                localVarRequestOptions = {
                    method: 'POST',
                    qs: localVarQueryParameters,
                    headers: localVarHeaderParams,
                    uri: localVarPath,
                    useQuerystring: this._useQuerystring,
                    json: true,
                    body: models_1.ObjectSerializer.serialize(prepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB, "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubRB")
                };
                authenticationPromise = Promise.resolve();
                if (this.authentications.ApiKey.apiKey) {
                    authenticationPromise = authenticationPromise.then(function () { return _this.authentications.ApiKey.applyToRequest(localVarRequestOptions); });
                }
                authenticationPromise = authenticationPromise.then(function () { return _this.authentications.default.applyToRequest(localVarRequestOptions); });
                interceptorPromise = authenticationPromise;
                _loop_8 = function (interceptor) {
                    interceptorPromise = interceptorPromise.then(function () { return interceptor(localVarRequestOptions); });
                };
                for (_i = 0, _a = this.interceptors; _i < _a.length; _i++) {
                    interceptor = _a[_i];
                    _loop_8(interceptor);
                }
                return [2, interceptorPromise.then(function () {
                        if (Object.keys(localVarFormParams).length) {
                            if (localVarUseFormData) {
                                localVarRequestOptions.formData = localVarFormParams;
                            }
                            else {
                                localVarRequestOptions.form = localVarFormParams;
                            }
                        }
                        return new Promise(function (resolve, reject) {
                            (0, request_1.default)(localVarRequestOptions, function (error, response, body) {
                                if (error) {
                                    reject(error);
                                }
                                else {
                                    if (response.statusCode && response.statusCode >= 200 && response.statusCode <= 299) {
                                        body = models_1.ObjectSerializer.deserialize(body, "PrepareAUTXOBasedTransactionFromHDWalletXPubYPubZPubR");
                                        resolve({ response: response, body: body });
                                    }
                                    else {
                                        reject(new apis_1.HttpError(response, body, response.statusCode));
                                    }
                                }
                            });
                        });
                    })];
            });
        });
    };
    return HDWalletDataUTXOApi;
}());
exports.HDWalletDataUTXOApi = HDWalletDataUTXOApi;
//# sourceMappingURL=hDWalletDataUTXOApi.js.map