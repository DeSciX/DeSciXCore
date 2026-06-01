"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDs401Response = void 0;
var GetExchangeRateByAssetsIDs401Response = (function () {
    function GetExchangeRateByAssetsIDs401Response() {
    }
    GetExchangeRateByAssetsIDs401Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDs401Response.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDs401Response.discriminator = undefined;
    GetExchangeRateByAssetsIDs401Response.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "error",
            "baseName": "error",
            "type": "GetExchangeRateByAssetsIDsE401"
        }
    ];
    return GetExchangeRateByAssetsIDs401Response;
}());
exports.GetExchangeRateByAssetsIDs401Response = GetExchangeRateByAssetsIDs401Response;
//# sourceMappingURL=getExchangeRateByAssetsIDs401Response.js.map