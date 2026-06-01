"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOsE400 = void 0;
var GetBlockDetailsByBlockHashUTXOsE400 = (function () {
    function GetBlockDetailsByBlockHashUTXOsE400() {
    }
    GetBlockDetailsByBlockHashUTXOsE400.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOsE400.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOsE400.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOsE400.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashUTXOsE400;
}());
exports.GetBlockDetailsByBlockHashUTXOsE400 = GetBlockDetailsByBlockHashUTXOsE400;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOsE400.js.map