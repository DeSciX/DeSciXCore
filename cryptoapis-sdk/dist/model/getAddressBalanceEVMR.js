"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVMR = void 0;
var GetAddressBalanceEVMR = (function () {
    function GetAddressBalanceEVMR() {
    }
    GetAddressBalanceEVMR.getAttributeTypeMap = function () {
        return GetAddressBalanceEVMR.attributeTypeMap;
    };
    GetAddressBalanceEVMR.discriminator = undefined;
    GetAddressBalanceEVMR.attributeTypeMap = [
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
            "type": "GetAddressBalanceEVMRData"
        }
    ];
    return GetAddressBalanceEVMR;
}());
exports.GetAddressBalanceEVMR = GetAddressBalanceEVMR;
//# sourceMappingURL=getAddressBalanceEVMR.js.map