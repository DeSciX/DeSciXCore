"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspaRIConfirmedBalance = void 0;
var GetAddressBalanceKaspaRIConfirmedBalance = (function () {
    function GetAddressBalanceKaspaRIConfirmedBalance() {
    }
    GetAddressBalanceKaspaRIConfirmedBalance.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspaRIConfirmedBalance.attributeTypeMap;
    };
    GetAddressBalanceKaspaRIConfirmedBalance.discriminator = undefined;
    GetAddressBalanceKaspaRIConfirmedBalance.attributeTypeMap = [
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
    return GetAddressBalanceKaspaRIConfirmedBalance;
}());
exports.GetAddressBalanceKaspaRIConfirmedBalance = GetAddressBalanceKaspaRIConfirmedBalance;
//# sourceMappingURL=getAddressBalanceKaspaRIConfirmedBalance.js.map