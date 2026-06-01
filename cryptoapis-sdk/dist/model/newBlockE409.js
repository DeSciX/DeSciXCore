"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockE409 = void 0;
var NewBlockE409 = (function () {
    function NewBlockE409() {
    }
    NewBlockE409.getAttributeTypeMap = function () {
        return NewBlockE409.attributeTypeMap;
    };
    NewBlockE409.discriminator = undefined;
    NewBlockE409.attributeTypeMap = [
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
    return NewBlockE409;
}());
exports.NewBlockE409 = NewBlockE409;
//# sourceMappingURL=newBlockE409.js.map