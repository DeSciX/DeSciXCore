"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolanaRIConfirmedBalance = void 0;
var GetAddressBalanceSolanaRIConfirmedBalance = (function () {
    function GetAddressBalanceSolanaRIConfirmedBalance() {
    }
    GetAddressBalanceSolanaRIConfirmedBalance.getAttributeTypeMap = function () {
        return GetAddressBalanceSolanaRIConfirmedBalance.attributeTypeMap;
    };
    GetAddressBalanceSolanaRIConfirmedBalance.discriminator = undefined;
    GetAddressBalanceSolanaRIConfirmedBalance.attributeTypeMap = [
        {
            "name": "amount",
            "baseName": "amount",
            "type": "string"
        },
        {
            "name": "unit",
            "baseName": "unit",
            "type": "string"
        }
    ];
    return GetAddressBalanceSolanaRIConfirmedBalance;
}());
exports.GetAddressBalanceSolanaRIConfirmedBalance = GetAddressBalanceSolanaRIConfirmedBalance;
//# sourceMappingURL=getAddressBalanceSolanaRIConfirmedBalance.js.map