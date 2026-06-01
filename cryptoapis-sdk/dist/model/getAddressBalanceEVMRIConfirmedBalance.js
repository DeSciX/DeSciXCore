"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceEVMRIConfirmedBalance = void 0;
var GetAddressBalanceEVMRIConfirmedBalance = (function () {
    function GetAddressBalanceEVMRIConfirmedBalance() {
    }
    GetAddressBalanceEVMRIConfirmedBalance.getAttributeTypeMap = function () {
        return GetAddressBalanceEVMRIConfirmedBalance.attributeTypeMap;
    };
    GetAddressBalanceEVMRIConfirmedBalance.discriminator = undefined;
    GetAddressBalanceEVMRIConfirmedBalance.attributeTypeMap = [
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
    return GetAddressBalanceEVMRIConfirmedBalance;
}());
exports.GetAddressBalanceEVMRIConfirmedBalance = GetAddressBalanceEVMRIConfirmedBalance;
//# sourceMappingURL=getAddressBalanceEVMRIConfirmedBalance.js.map