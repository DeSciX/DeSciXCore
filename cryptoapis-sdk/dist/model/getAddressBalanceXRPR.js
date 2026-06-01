"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRPR = void 0;
var GetAddressBalanceXRPR = (function () {
    function GetAddressBalanceXRPR() {
    }
    GetAddressBalanceXRPR.getAttributeTypeMap = function () {
        return GetAddressBalanceXRPR.attributeTypeMap;
    };
    GetAddressBalanceXRPR.discriminator = undefined;
    GetAddressBalanceXRPR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "GetAddressBalanceXRPRData"
        }
    ];
    return GetAddressBalanceXRPR;
}());
exports.GetAddressBalanceXRPR = GetAddressBalanceXRPR;
//# sourceMappingURL=getAddressBalanceXRPR.js.map