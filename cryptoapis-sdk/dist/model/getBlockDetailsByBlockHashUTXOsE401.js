"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOsE401 = void 0;
var GetBlockDetailsByBlockHashUTXOsE401 = (function () {
    function GetBlockDetailsByBlockHashUTXOsE401() {
    }
    GetBlockDetailsByBlockHashUTXOsE401.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOsE401.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOsE401.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOsE401.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashUTXOsE401;
}());
exports.GetBlockDetailsByBlockHashUTXOsE401 = GetBlockDetailsByBlockHashUTXOsE401;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOsE401.js.map