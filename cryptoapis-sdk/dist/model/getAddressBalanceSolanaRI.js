"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetAddressBalanceSolanaRI = void 0;
var GetAddressBalanceSolanaRI = (function () {
    function GetAddressBalanceSolanaRI() {
    }
    GetAddressBalanceSolanaRI.getAttributeTypeMap = function () {
        return GetAddressBalanceSolanaRI.attributeTypeMap;
    };
    GetAddressBalanceSolanaRI.discriminator = undefined;
    GetAddressBalanceSolanaRI.attributeTypeMap = [
        {
            "name": "confirmedBalance",
            "baseName": "confirmedBalance",
            "type": "GetAddressBalanceSolanaRIConfirmedBalance"
        }
    ];
    return GetAddressBalanceSolanaRI;
}());
exports.GetAddressBalanceSolanaRI = GetAddressBalanceSolanaRI;
//# sourceMappingURL=getAddressBalanceSolanaRI.js.map