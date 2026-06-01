"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetExchangeRateByAssetsIDs403Response = void 0;
var GetExchangeRateByAssetsIDs403Response = (function () {
    function GetExchangeRateByAssetsIDs403Response() {
    }
    GetExchangeRateByAssetsIDs403Response.getAttributeTypeMap = function () {
        return GetExchangeRateByAssetsIDs403Response.attributeTypeMap;
    };
    GetExchangeRateByAssetsIDs403Response.discriminator = undefined;
    GetExchangeRateByAssetsIDs403Response.attributeTypeMap = [
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
            "type": "GetExchangeRateByAssetsIDsE403"
        }
    ];
    return GetExchangeRateByAssetsIDs403Response;
}());
exports.GetExchangeRateByAssetsIDs403Response = GetExchangeRateByAssetsIDs403Response;
//# sourceMappingURL=getExchangeRateByAssetsIDs403Response.js.map