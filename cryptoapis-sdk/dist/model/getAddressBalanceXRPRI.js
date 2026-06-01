"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceXRPRI = void 0;
var GetAddressBalanceXRPRI = (function () {
    function GetAddressBalanceXRPRI() {
    }
    GetAddressBalanceXRPRI.getAttributeTypeMap = function () {
        return GetAddressBalanceXRPRI.attributeTypeMap;
    };
    GetAddressBalanceXRPRI.discriminator = undefined;
    GetAddressBalanceXRPRI.attributeTypeMap = [
        {
            "name": "confirmedBalance",
            "baseName": "confirmedBalance",
            "type": "GetAddressBalanceXRPRIConfirmedBalance"
        }
    ];
    return GetAddressBalanceXRPRI;
}());
exports.GetAddressBalanceXRPRI = GetAddressBalanceXRPRI;
//# sourceMappingURL=getAddressBalanceXRPRI.js.map