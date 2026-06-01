"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOsRI = void 0;
var GetAddressBalanceUTXOsRI = (function () {
    function GetAddressBalanceUTXOsRI() {
    }
    GetAddressBalanceUTXOsRI.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOsRI.attributeTypeMap;
    };
    GetAddressBalanceUTXOsRI.discriminator = undefined;
    GetAddressBalanceUTXOsRI.attributeTypeMap = [
        {
            "name": "confirmedBalance",
            "baseName": "confirmedBalance",
            "type": "GetAddressBalanceUTXOsRIConfirmedBalance"
        }
    ];
    return GetAddressBalanceUTXOsRI;
}());
exports.GetAddressBalanceUTXOsRI = GetAddressBalanceUTXOsRI;
//# sourceMappingURL=getAddressBalanceUTXOsRI.js.map