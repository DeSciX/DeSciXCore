"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockRI = void 0;
var NewBlockRI = (function () {
    function NewBlockRI() {
    }
    NewBlockRI.getAttributeTypeMap = function () {
        return NewBlockRI.attributeTypeMap;
    };
    NewBlockRI.discriminator = undefined;
    NewBlockRI.attributeTypeMap = [
        {
            "name": "callbackSecretKey",
            "baseName": "callbackSecretKey",
            "type": "string"
        },
        {
            "name": "callbackUrl",
            "baseName": "callbackUrl",
            "type": "string"
        },
        {
            "name": "createdTimestamp",
            "baseName": "createdTimestamp",
            "type": "number"
        },
        {
            "name": "isActive",
            "baseName": "isActive",
            "type": "boolean"
        },
        {
            "name": "referenceId",
            "baseName": "referenceId",
            "type": "string"
        }
    ];
    return NewBlockRI;
}());
exports.NewBlockRI = NewBlockRI;
//# sourceMappingURL=newBlockRI.js.map