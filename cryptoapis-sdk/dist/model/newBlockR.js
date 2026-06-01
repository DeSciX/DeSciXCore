"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlockR = void 0;
var NewBlockR = (function () {
    function NewBlockR() {
    }
    NewBlockR.getAttributeTypeMap = function () {
        return NewBlockR.attributeTypeMap;
    };
    NewBlockR.discriminator = undefined;
    NewBlockR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "NewBlockRData"
        }
    ];
    return NewBlockR;
}());
exports.NewBlockR = NewBlockR;
//# sourceMappingURL=newBlockR.js.map