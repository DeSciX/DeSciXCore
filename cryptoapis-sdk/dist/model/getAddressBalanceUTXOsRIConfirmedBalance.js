"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceUTXOsRIConfirmedBalance = void 0;
var GetAddressBalanceUTXOsRIConfirmedBalance = (function () {
    function GetAddressBalanceUTXOsRIConfirmedBalance() {
    }
    GetAddressBalanceUTXOsRIConfirmedBalance.getAttributeTypeMap = function () {
        return GetAddressBalanceUTXOsRIConfirmedBalance.attributeTypeMap;
    };
    GetAddressBalanceUTXOsRIConfirmedBalance.discriminator = undefined;
    GetAddressBalanceUTXOsRIConfirmedBalance.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "denomination",
            "baseName": "denomination",
            "type": "number"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetAddressBalanceUTXOsRIConfirmedBalance;
}());
exports.GetAddressBalanceUTXOsRIConfirmedBalance = GetAddressBalanceUTXOsRIConfirmedBalance;
//# sourceMappingURL=getAddressBalanceUTXOsRIConfirmedBalance.js.map