"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NewBlock403Response = void 0;
var NewBlock403Response = (function () {
    function NewBlock403Response() {
    }
    NewBlock403Response.getAttributeTypeMap = function () {
        return NewBlock403Response.attributeTypeMap;
    };
    NewBlock403Response.discriminator = undefined;
    NewBlock403Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "NewBlockE403"
        }
    ];
    return NewBlock403Response;
}());
exports.NewBlock403Response = NewBlock403Response;
//# sourceMappingURL=newBlock403Response.js.map