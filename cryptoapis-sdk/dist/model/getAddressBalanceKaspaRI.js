"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceKaspaRI = void 0;
var GetAddressBalanceKaspaRI = (function () {
    function GetAddressBalanceKaspaRI() {
    }
    GetAddressBalanceKaspaRI.getAttributeTypeMap = function () {
        return GetAddressBalanceKaspaRI.attributeTypeMap;
    };
    GetAddressBalanceKaspaRI.discriminator = undefined;
    GetAddressBalanceKaspaRI.attributeTypeMap = [
        {
            "name": "confirmedBalance",
            "baseName": "confirmedBalance",
            "type": "GetAddressBalanceKaspaRIConfirmedBalance"
        }
    ];
    return GetAddressBalanceKaspaRI;
}());
exports.GetAddressBalanceKaspaRI = GetAddressBalanceKaspaRI;
//# sourceMappingURL=getAddressBalanceKaspaRI.js.map