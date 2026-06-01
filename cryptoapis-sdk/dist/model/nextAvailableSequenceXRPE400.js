"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NextAvailableSequenceXRPE400 = void 0;
var NextAvailableSequenceXRPE400 = (function () {
    function NextAvailableSequenceXRPE400() {
    }
    NextAvailableSequenceXRPE400.getAttributeTypeMap = function () {
        return NextAvailableSequenceXRPE400.attributeTypeMap;
    };
    NextAvailableSequenceXRPE400.discriminator = undefined;
    NextAvailableSequenceXRPE400.attributeTypeMap = [
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
    return NextAvailableSequenceXRPE400;
}());
exports.NextAvailableSequenceXRPE400 = NextAvailableSequenceXRPE400;
//# sourceMappingURL=nextAvailableSequenceXRPE400.js.map