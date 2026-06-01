"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDs422Response = void 0;
var GetExchangeRateByAssetsIDs422Response = (function () {
    function GetExchangeRateByAssetsIDs422Response() {
    }
    GetExchangeRateByAssetsIDs422Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDs422Response.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDs422Response.discriminator = undefined;
    GetExchangeRateByAssetsIDs422Response.attributeTypeMap = [
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
            "type": "GetExchangeRateByAssetsIDsE422"
        }
    ];
    return GetExchangeRateByAssetsIDs422Response;
}());
exports.GetExchangeRateByAssetsIDs422Response = GetExchangeRateByAssetsIDs422Response;
//# sourceMappingURL=getExchangeRateByAssetsIDs422Response.js.map