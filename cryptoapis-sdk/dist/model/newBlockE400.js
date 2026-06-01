"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockE400 = void 0;
var NewBlockE400 = (function () {
    function NewBlockE400() {
    }
    NewBlockE400.getAttributeTypeMap = function () {
        return NewBlockE400.attributeTypeMap;
    };
    NewBlockE400.discriminator = undefined;
    NewBlockE400.attributeTypeMap = [
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
    return NewBlockE400;
}());
exports.NewBlockE400 = NewBlockE400;
//# sourceMappingURL=newBlockE400.js.map