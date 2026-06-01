"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOsE401 = void 0;
var GetBlockDetailsByBlockHeightUTXOsE401 = (function () {
    function GetBlockDetailsByBlockHeightUTXOsE401() {
    }
    GetBlockDetailsByBlockHeightUTXOsE401.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOsE401.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOsE401.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOsE401.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return GetBlockDetailsByBlockHeightUTXOsE401;
}());
exports.GetBlockDetailsByBlockHeightUTXOsE401 = GetBlockDetailsByBlockHeightUTXOsE401;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOsE401.js.map