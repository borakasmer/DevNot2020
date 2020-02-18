/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/host/umd_host", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/ngcc/src/utils", "@angular/compiler-cli/ngcc/src/host/commonjs_umd_utils", "@angular/compiler-cli/ngcc/src/host/esm5_host"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var utils_1 = require("@angular/compiler-cli/ngcc/src/utils");
    var commonjs_umd_utils_1 = require("@angular/compiler-cli/ngcc/src/host/commonjs_umd_utils");
    var esm5_host_1 = require("@angular/compiler-cli/ngcc/src/host/esm5_host");
    var UmdReflectionHost = /** @class */ (function (_super) {
        tslib_1.__extends(UmdReflectionHost, _super);
        function UmdReflectionHost(logger, isCore, src, dts) {
            if (dts === void 0) { dts = null; }
            var _this = _super.call(this, logger, isCore, src, dts) || this;
            _this.umdModules = new utils_1.FactoryMap(function (sf) { return _this.computeUmdModule(sf); });
            _this.umdExports = new utils_1.FactoryMap(function (sf) { return _this.computeExportsOfUmdModule(sf); });
            _this.umdImportPaths = new utils_1.FactoryMap(function (param) { return _this.computeImportPath(param); });
            _this.program = src.program;
            _this.compilerHost = src.host;
            return _this;
        }
        UmdReflectionHost.prototype.getImportOfIdentifier = function (id) {
            var superImport = _super.prototype.getImportOfIdentifier.call(this, id);
            if (superImport !== null) {
                return superImport;
            }
            // Is `id` a namespaced property access, e.g. `Directive` in `core.Directive`?
            // If so capture the symbol of the namespace, e.g. `core`.
            var nsIdentifier = commonjs_umd_utils_1.findNamespaceOfIdentifier(id);
            var importParameter = nsIdentifier && this.findUmdImportParameter(nsIdentifier);
            var from = importParameter && this.getUmdImportPath(importParameter);
            return from !== null ? { from: from, name: id.text } : null;
        };
        UmdReflectionHost.prototype.getDeclarationOfIdentifier = function (id) {
            return (!id.getSourceFile().isDeclarationFile && this.getUmdImportedDeclaration(id)) ||
                _super.prototype.getDeclarationOfIdentifier.call(this, id);
        };
        UmdReflectionHost.prototype.getExportsOfModule = function (module) {
            return _super.prototype.getExportsOfModule.call(this, module) || this.umdExports.get(module.getSourceFile());
        };
        UmdReflectionHost.prototype.getUmdModule = function (sourceFile) {
            if (sourceFile.isDeclarationFile) {
                return null;
            }
            return this.umdModules.get(sourceFile);
        };
        UmdReflectionHost.prototype.getUmdImportPath = function (importParameter) {
            return this.umdImportPaths.get(importParameter);
        };
        /** Get the top level statements for a module.
         *
         * In UMD modules these are the body of the UMD factory function.
         *
         * @param sourceFile The module whose statements we want.
         * @returns An array of top level statements for the given module.
         */
        UmdReflectionHost.prototype.getModuleStatements = function (sourceFile) {
            var umdModule = this.getUmdModule(sourceFile);
            return umdModule !== null ? Array.from(umdModule.factoryFn.body.statements) : [];
        };
        UmdReflectionHost.prototype.computeUmdModule = function (sourceFile) {
            if (sourceFile.statements.length !== 1) {
                throw new Error("Expected UMD module file (" + sourceFile.fileName + ") to contain exactly one statement, " +
                    ("but found " + sourceFile.statements.length + "."));
            }
            return parseStatementForUmdModule(sourceFile.statements[0]);
        };
        UmdReflectionHost.prototype.computeExportsOfUmdModule = function (sourceFile) {
            var e_1, _a, e_2, _b;
            var moduleMap = new Map();
            try {
                for (var _c = tslib_1.__values(this.getModuleStatements(sourceFile)), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var statement = _d.value;
                    if (commonjs_umd_utils_1.isExportStatement(statement)) {
                        var exportDeclaration = this.extractUmdExportDeclaration(statement);
                        moduleMap.set(exportDeclaration.name, exportDeclaration.declaration);
                    }
                    else if (commonjs_umd_utils_1.isReexportStatement(statement)) {
                        var reexports = this.extractUmdReexports(statement, sourceFile);
                        try {
                            for (var reexports_1 = (e_2 = void 0, tslib_1.__values(reexports)), reexports_1_1 = reexports_1.next(); !reexports_1_1.done; reexports_1_1 = reexports_1.next()) {
                                var reexport = reexports_1_1.value;
                                moduleMap.set(reexport.name, reexport.declaration);
                            }
                        }
                        catch (e_2_1) { e_2 = { error: e_2_1 }; }
                        finally {
                            try {
                                if (reexports_1_1 && !reexports_1_1.done && (_b = reexports_1.return)) _b.call(reexports_1);
                            }
                            finally { if (e_2) throw e_2.error; }
                        }
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return moduleMap;
        };
        UmdReflectionHost.prototype.computeImportPath = function (param) {
            var e_3, _a;
            var umdModule = this.getUmdModule(param.getSourceFile());
            if (umdModule === null) {
                return null;
            }
            var imports = getImportsOfUmdModule(umdModule);
            if (imports === null) {
                return null;
            }
            var importPath = null;
            try {
                for (var imports_1 = tslib_1.__values(imports), imports_1_1 = imports_1.next(); !imports_1_1.done; imports_1_1 = imports_1.next()) {
                    var i = imports_1_1.value;
                    // Add all imports to the map to speed up future look ups.
                    this.umdImportPaths.set(i.parameter, i.path);
                    if (i.parameter === param) {
                        importPath = i.path;
                    }
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (imports_1_1 && !imports_1_1.done && (_a = imports_1.return)) _a.call(imports_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
            return importPath;
        };
        UmdReflectionHost.prototype.extractUmdExportDeclaration = function (statement) {
            var exportExpression = statement.expression.right;
            var declaration = this.getDeclarationOfExpression(exportExpression);
            var name = statement.expression.left.name.text;
            if (declaration !== null) {
                return { name: name, declaration: declaration };
            }
            else {
                return {
                    name: name,
                    declaration: {
                        node: null,
                        known: null,
                        expression: exportExpression,
                        viaModule: null,
                    },
                };
            }
        };
        UmdReflectionHost.prototype.extractUmdReexports = function (statement, containingFile) {
            var reexportArg = statement.expression.arguments[0];
            var requireCall = commonjs_umd_utils_1.isRequireCall(reexportArg) ?
                reexportArg :
                ts.isIdentifier(reexportArg) ? commonjs_umd_utils_1.findRequireCallReference(reexportArg, this.checker) : null;
            var importPath = null;
            if (requireCall !== null) {
                importPath = requireCall.arguments[0].text;
            }
            else if (ts.isIdentifier(reexportArg)) {
                var importParameter = this.findUmdImportParameter(reexportArg);
                importPath = importParameter && this.getUmdImportPath(importParameter);
            }
            if (importPath === null) {
                return [];
            }
            var importedFile = this.resolveModuleName(importPath, containingFile);
            if (importedFile === undefined) {
                return [];
            }
            var importedExports = this.getExportsOfModule(importedFile);
            if (importedExports === null) {
                return [];
            }
            var viaModule = utils_1.stripExtension(importedFile.fileName);
            var reexports = [];
            importedExports.forEach(function (decl, name) {
                if (decl.node !== null) {
                    reexports.push({ name: name, declaration: { node: decl.node, known: null, viaModule: viaModule } });
                }
                else {
                    reexports.push({ name: name, declaration: { node: null, known: null, expression: decl.expression, viaModule: viaModule } });
                }
            });
            return reexports;
        };
        /**
         * Is the identifier a parameter on a UMD factory function, e.g. `function factory(this, core)`?
         * If so then return its declaration.
         */
        UmdReflectionHost.prototype.findUmdImportParameter = function (id) {
            var symbol = id && this.checker.getSymbolAtLocation(id) || null;
            var declaration = symbol && symbol.valueDeclaration;
            return declaration && ts.isParameter(declaration) ? declaration : null;
        };
        UmdReflectionHost.prototype.getUmdImportedDeclaration = function (id) {
            var importInfo = this.getImportOfIdentifier(id);
            if (importInfo === null) {
                return null;
            }
            var importedFile = this.resolveModuleName(importInfo.from, id.getSourceFile());
            if (importedFile === undefined) {
                return null;
            }
            // We need to add the `viaModule` because  the `getExportsOfModule()` call
            // did not know that we were importing the declaration.
            return { node: importedFile, known: null, viaModule: importInfo.from };
        };
        UmdReflectionHost.prototype.resolveModuleName = function (moduleName, containingFile) {
            if (this.compilerHost.resolveModuleNames) {
                var moduleInfo = this.compilerHost.resolveModuleNames([moduleName], containingFile.fileName, undefined, undefined, this.program.getCompilerOptions())[0];
                return moduleInfo && this.program.getSourceFile(file_system_1.absoluteFrom(moduleInfo.resolvedFileName));
            }
            else {
                var moduleInfo = ts.resolveModuleName(moduleName, containingFile.fileName, this.program.getCompilerOptions(), this.compilerHost);
                return moduleInfo.resolvedModule &&
                    this.program.getSourceFile(file_system_1.absoluteFrom(moduleInfo.resolvedModule.resolvedFileName));
            }
        };
        return UmdReflectionHost;
    }(esm5_host_1.Esm5ReflectionHost));
    exports.UmdReflectionHost = UmdReflectionHost;
    function parseStatementForUmdModule(statement) {
        var wrapperCall = getUmdWrapperCall(statement);
        if (!wrapperCall)
            return null;
        var wrapperFn = wrapperCall.expression;
        if (!ts.isFunctionExpression(wrapperFn))
            return null;
        var factoryFnParamIndex = wrapperFn.parameters.findIndex(function (parameter) { return ts.isIdentifier(parameter.name) && parameter.name.text === 'factory'; });
        if (factoryFnParamIndex === -1)
            return null;
        var factoryFn = esm5_host_1.stripParentheses(wrapperCall.arguments[factoryFnParamIndex]);
        if (!factoryFn || !ts.isFunctionExpression(factoryFn))
            return null;
        return { wrapperFn: wrapperFn, factoryFn: factoryFn };
    }
    exports.parseStatementForUmdModule = parseStatementForUmdModule;
    function getUmdWrapperCall(statement) {
        if (!ts.isExpressionStatement(statement) || !ts.isParenthesizedExpression(statement.expression) ||
            !ts.isCallExpression(statement.expression.expression) ||
            !ts.isFunctionExpression(statement.expression.expression.expression)) {
            return null;
        }
        return statement.expression.expression;
    }
    function getImportsOfUmdModule(umdModule) {
        var imports = [];
        for (var i = 1; i < umdModule.factoryFn.parameters.length; i++) {
            imports.push({
                parameter: umdModule.factoryFn.parameters[i],
                path: getRequiredModulePath(umdModule.wrapperFn, i)
            });
        }
        return imports;
    }
    exports.getImportsOfUmdModule = getImportsOfUmdModule;
    function getRequiredModulePath(wrapperFn, paramIndex) {
        var statement = wrapperFn.body.statements[0];
        if (!ts.isExpressionStatement(statement)) {
            throw new Error('UMD wrapper body is not an expression statement:\n' + wrapperFn.body.getText());
        }
        var modulePaths = [];
        findModulePaths(statement.expression);
        // Since we were only interested in the `require()` calls, we miss the `exports` argument, so we
        // need to subtract 1.
        // E.g. `function(exports, dep1, dep2)` maps to `function(exports, require('path/to/dep1'),
        // require('path/to/dep2'))`
        return modulePaths[paramIndex - 1];
        // Search the statement for calls to `require('...')` and extract the string value of the first
        // argument
        function findModulePaths(node) {
            if (commonjs_umd_utils_1.isRequireCall(node)) {
                var argument = node.arguments[0];
                if (ts.isStringLiteral(argument)) {
                    modulePaths.push(argument.text);
                }
            }
            else {
                node.forEachChild(findModulePaths);
            }
        }
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidW1kX2hvc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbmdjYy9zcmMvaG9zdC91bWRfaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCwrQkFBaUM7SUFFakMsMkVBQTREO0lBSTVELDhEQUFvRDtJQUNwRCw2RkFBdU07SUFDdk0sMkVBQWlFO0lBRWpFO1FBQXVDLDZDQUFrQjtRQVV2RCwyQkFBWSxNQUFjLEVBQUUsTUFBZSxFQUFFLEdBQWtCLEVBQUUsR0FBOEI7WUFBOUIsb0JBQUEsRUFBQSxVQUE4QjtZQUEvRixZQUNFLGtCQUFNLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxTQUdoQztZQWJTLGdCQUFVLEdBQ2hCLElBQUksa0JBQVUsQ0FBZ0MsVUFBQSxFQUFFLElBQUksT0FBQSxLQUFJLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxDQUFDLEVBQXpCLENBQXlCLENBQUMsQ0FBQztZQUN6RSxnQkFBVSxHQUFHLElBQUksa0JBQVUsQ0FDakMsVUFBQSxFQUFFLElBQUksT0FBQSxLQUFJLENBQUMseUJBQXlCLENBQUMsRUFBRSxDQUFDLEVBQWxDLENBQWtDLENBQUMsQ0FBQztZQUNwQyxvQkFBYyxHQUNwQixJQUFJLGtCQUFVLENBQXVDLFVBQUEsS0FBSyxJQUFJLE9BQUEsS0FBSSxDQUFDLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxFQUE3QixDQUE2QixDQUFDLENBQUM7WUFNL0YsS0FBSSxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO1lBQzNCLEtBQUksQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQzs7UUFDL0IsQ0FBQztRQUVELGlEQUFxQixHQUFyQixVQUFzQixFQUFpQjtZQUNyQyxJQUFNLFdBQVcsR0FBRyxpQkFBTSxxQkFBcUIsWUFB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QyxFQUFFO29CQUNoQyxXQUFXLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztpQkFDakM7YUFDRjtpQkFBTTtnQkFDTCxJQUFJLENBQUMsWUFBWSxDQUFDLGVBQWUsQ0FBQyxDQUFDO2FBQ3BDO1FBQ0gsQ0FBQztJQUNILENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge2Fic29sdXRlRnJvbX0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7RGVjbGFyYXRpb24sIEltcG9ydH0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL3JlZmxlY3Rpb24nO1xuaW1wb3J0IHtMb2dnZXJ9IGZyb20gJy4uL2xvZ2dpbmcvbG9nZ2VyJztcbmltcG9ydCB7QnVuZGxlUHJvZ3JhbX0gZnJvbSAnLi4vcGFja2FnZXMvYnVuZGxlX3Byb2dyYW0nO1xuaW1wb3J0IHtGYWN0b3J5TWFwLCBzdHJpcEV4dGVuc2lvbn0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHtFeHBvcnREZWNsYXJhdGlvbiwgRXhwb3J0U3RhdGVtZW50LCBSZWV4cG9ydFN0YXRlbWVudCwgZmluZE5hbWVzcGFjZU9mSWRlbnRpZmllciwgZmluZFJlcXVpcmVDYWxsUmVmZXJlbmNlLCBpc0V4cG9ydFN0YXRlbWVudCwgaXNSZWV4cG9ydFN0YXRlbWVudCwgaXNSZXF1aXJlQ2FsbH0gZnJvbSAnLi9jb21tb25qc191bWRfdXRpbHMnO1xuaW1wb3J0IHtFc201UmVmbGVjdGlvbkhvc3QsIHN0cmlwUGFyZW50aGVzZXN9IGZyb20gJy4vZXNtNV9ob3N0JztcblxuZXhwb3J0IGNsYXNzIFVtZFJlZmxlY3Rpb25Ib3N0IGV4dGVuZHMgRXNtNVJlZmxlY3Rpb25Ib3N0IHtcbiAgcHJvdGVjdGVkIHVtZE1vZHVsZXMgPVxuICAgICAgbmV3IEZhY3RvcnlNYXA8dHMuU291cmNlRmlsZSwgVW1kTW9kdWxlfG51bGw+KHNmID0+IHRoaXMuY29tcHV0ZVVtZE1vZHVsZShzZikpO1xuICBwcm90ZWN0ZWQgdW1kRXhwb3J0cyA9IG5ldyBGYWN0b3J5TWFwPHRzLlNvdXJjZUZpbGUsIE1hcDxzdHJpbmcsIERlY2xhcmF0aW9uPnxudWxsPihcbiAgICAgIHNmID0+IHRoaXMuY29tcHV0ZUV4cG9ydHNPZlVtZE1vZHVsZShzZikpO1xuICBwcm90ZWN0ZWQgdW1kSW1wb3J0UGF0aHMgPVxuICAgICAgbmV3IEZhY3RvcnlNYXA8dHMuUGFyYW1ldGVyRGVjbGFyYXRpb24sIHN0cmluZ3xudWxsPihwYXJhbSA9PiB0aGlzLmNvbXB1dGVJbXBvcnRQYXRoKHBhcmFtKSk7XG4gIHByb3RlY3RlZCBwcm9ncmFtOiB0cy5Qcm9ncmFtO1xuICBwcm90ZWN0ZWQgY29tcGlsZXJIb3N0OiB0cy5Db21waWxlckhvc3Q7XG5cbiAgY29uc3RydWN0b3IobG9nZ2VyOiBMb2dnZXIsIGlzQ29yZTogYm9vbGVhbiwgc3JjOiBCdW5kbGVQcm9ncmFtLCBkdHM6IEJ1bmRsZVByb2dyYW18bnVsbCA9IG51bGwpIHtcbiAgICBzdXBlcihsb2dnZXIsIGlzQ29yZSwgc3JjLCBkdHMpO1xuICAgIHRoaXMucHJvZ3JhbSA9IHNyYy5wcm9ncmFtO1xuICAgIHRoaXMuY29tcGlsZXJIb3N0ID0gc3JjLmhvc3Q7XG4gIH1cblxuICBnZXRJbXBvcnRPZklkZW50aWZpZXIoaWQ6IHRzLklkZW50aWZpZXIpOiBJbXBvcnR8bnVsbCB7XG4gICAgY29uc3Qgc3VwZXJJbXBvcnQgPSBzdXBlci5nZXRJbXBvcnRPZklkZW50aWZpZXIoaWQpO1xuICAgIGlmIChzdXBlckltcG9ydCAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHN1cGVySW1wb3J0O1xuICAgIH1cblxuICAgIC8vIElzIGBpZGAgYSBuYW1lc3BhY2VkIHByb3BlcnR5IGFjY2VzcywgZS5nLiBgRGlyZWN0aXZlYCBpbiBgY29yZS5EaXJlY3RpdmVgP1xuICAgIC8vIElmIHNvIGNhcHR1cmUgdGhlIHN5bWJvbCBvZiB0aGUgbmFtZXNwYWNlLCBlLmcuIGBjb3JlYC5cbiAgICBjb25zdCBuc0lkZW50aWZpZXIgPSBmaW5kTmFtZXNwYWNlT2ZJZGVudGlmaWVyKGlkKTtcbiAgICBjb25zdCBpbXBvcnRQYXJhbWV0ZXIgPSBuc0lkZW50aWZpZXIgJiYgdGhpcy5maW5kVW1kSW1wb3J0UGFyYW1ldGVyKG5zSWRlbnRpZmllcik7XG4gICAgY29uc3QgZnJvbSA9IGltcG9ydFBhcmFtZXRlciAmJiB0aGlzLmdldFVtZEltcG9ydFBhdGgoaW1wb3J0UGFyYW1ldGVyKTtcbiAgICByZXR1cm4gZnJvbSAhPT0gbnVsbCA/IHtmcm9tLCBuYW1lOiBpZC50ZXh0fSA6IG51bGw7XG4gIH1cblxuICBnZXREZWNsYXJhdGlvbk9mSWRlbnRpZmllcihpZDogdHMuSWRlbnRpZmllcik6IERlY2xhcmF0aW9ufG51bGwge1xuICAgIHJldHVybiAoIWlkLmdldFNvdXJjZUZpbGUoKS5pc0RlY2xhcmF0aW9uRmlsZSAmJiB0aGlzLmdldFVtZEltcG9ydGVkRGVjbGFyYXRpb24oaWQpKSB8fFxuICAgICAgICBzdXBlci5nZXREZWNsYXJhdGlvbk9mSWRlbnRpZmllcihpZCk7XG4gIH1cblxuICBnZXRFeHBvcnRzT2ZNb2R1bGUobW9kdWxlOiB0cy5Ob2RlKTogTWFwPHN0cmluZywgRGVjbGFyYXRpb24+fG51bGwge1xuICAgIHJldHVybiBzdXBlci5nZXRFeHBvcnRzT2ZNb2R1bGUobW9kdWxlKSB8fCB0aGlzLnVtZEV4cG9ydHMuZ2V0KG1vZHVsZS5nZXRTb3VyY2VGaWxlKCkpO1xuICB9XG5cbiAgZ2V0VW1kTW9kdWxlKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBVbWRNb2R1bGV8bnVsbCB7XG4gICAgaWYgKHNvdXJjZUZpbGUuaXNEZWNsYXJhdGlvbkZpbGUpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLnVtZE1vZHVsZXMuZ2V0KHNvdXJjZUZpbGUpO1xuICB9XG5cbiAgZ2V0VW1kSW1wb3J0UGF0aChpbXBvcnRQYXJhbWV0ZXI6IHRzLlBhcmFtZXRlckRlY2xhcmF0aW9uKTogc3RyaW5nfG51bGwge1xuICAgIHJldHVybiB0aGlzLnVtZEltcG9ydFBhdGhzLmdldChpbXBvcnRQYXJhbWV0ZXIpO1xuICB9XG5cbiAgLyoqIEdldCB0aGUgdG9wIGxldmVsIHN0YXRlbWVudHMgZm9yIGEgbW9kdWxlLlxuICAgKlxuICAgKiBJbiBVTUQgbW9kdWxlcyB0aGVzZSBhcmUgdGhlIGJvZHkgb2YgdGhlIFVNRCBmYWN0b3J5IGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAcGFyYW0gc291cmNlRmlsZSBUaGUgbW9kdWxlIHdob3NlIHN0YXRlbWVudHMgd2Ugd2FudC5cbiAgICogQHJldHVybnMgQW4gYXJyYXkgb2YgdG9wIGxldmVsIHN0YXRlbWVudHMgZm9yIHRoZSBnaXZlbiBtb2R1bGUuXG4gICAqL1xuICBwcm90ZWN0ZWQgZ2V0TW9kdWxlU3RhdGVtZW50cyhzb3VyY2VGaWxlOiB0cy5Tb3VyY2VGaWxlKTogdHMuU3RhdGVtZW50W10ge1xuICAgIGNvbnN0IHVtZE1vZHVsZSA9IHRoaXMuZ2V0VW1kTW9kdWxlKHNvdXJjZUZpbGUpO1xuICAgIHJldHVybiB1bWRNb2R1bGUgIT09IG51bGwgPyBBcnJheS5mcm9tKHVtZE1vZHVsZS5mYWN0b3J5Rm4uYm9keS5zdGF0ZW1lbnRzKSA6IFtdO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21wdXRlVW1kTW9kdWxlKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBVbWRNb2R1bGV8bnVsbCB7XG4gICAgaWYgKHNvdXJjZUZpbGUuc3RhdGVtZW50cy5sZW5ndGggIT09IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgRXhwZWN0ZWQgVU1EIG1vZHVsZSBmaWxlICgke3NvdXJjZUZpbGUuZmlsZU5hbWV9KSB0byBjb250YWluIGV4YWN0bHkgb25lIHN0YXRlbWVudCwgYCArXG4gICAgICAgICAgYGJ1dCBmb3VuZCAke3NvdXJjZUZpbGUuc3RhdGVtZW50cy5sZW5ndGh9LmApO1xuICAgIH1cblxuICAgIHJldHVybiBwYXJzZVN0YXRlbWVudEZvclVtZE1vZHVsZShzb3VyY2VGaWxlLnN0YXRlbWVudHNbMF0pO1xuICB9XG5cbiAgcHJpdmF0ZSBjb21wdXRlRXhwb3J0c09mVW1kTW9kdWxlKHNvdXJjZUZpbGU6IHRzLlNvdXJjZUZpbGUpOiBNYXA8c3RyaW5nLCBEZWNsYXJhdGlvbj58bnVsbCB7XG4gICAgY29uc3QgbW9kdWxlTWFwID0gbmV3IE1hcDxzdHJpbmcsIERlY2xhcmF0aW9uPigpO1xuICAgIGZvciAoY29uc3Qgc3RhdGVtZW50IG9mIHRoaXMuZ2V0TW9kdWxlU3RhdGVtZW50cyhzb3VyY2VGaWxlKSkge1xuICAgICAgaWYgKGlzRXhwb3J0U3RhdGVtZW50KHN0YXRlbWVudCkpIHtcbiAgICAgICAgY29uc3QgZXhwb3J0RGVjbGFyYXRpb24gPSB0aGlzLmV4dHJhY3RVbWRFeHBvcnREZWNsYXJhdGlvbihzdGF0ZW1lbnQpO1xuICAgICAgICBtb2R1bGVNYXAuc2V0KGV4cG9ydERlY2xhcmF0aW9uLm5hbWUsIGV4cG9ydERlY2xhcmF0aW9uLmRlY2xhcmF0aW9uKTtcbiAgICAgIH0gZWxzZSBpZiAoaXNSZWV4cG9ydFN0YXRlbWVudChzdGF0ZW1lbnQpKSB7XG4gICAgICAgIGNvbnN0IHJlZXhwb3J0cyA9IHRoaXMuZXh0cmFjdFVtZFJlZXhwb3J0cyhzdGF0ZW1lbnQsIHNvdXJjZUZpbGUpO1xuICAgICAgICBmb3IgKGNvbnN0IHJlZXhwb3J0IG9mIHJlZXhwb3J0cykge1xuICAgICAgICAgIG1vZHVsZU1hcC5zZXQocmVleHBvcnQubmFtZSwgcmVleHBvcnQuZGVjbGFyYXRpb24pO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBtb2R1bGVNYXA7XG4gIH1cblxuICBwcml2YXRlIGNvbXB1dGVJbXBvcnRQYXRoKHBhcmFtOiB0cy5QYXJhbWV0ZXJEZWNsYXJhdGlvbik6IHN0cmluZ3xudWxsIHtcbiAgICBjb25zdCB1bWRNb2R1bGUgPSB0aGlzLmdldFVtZE1vZHVsZShwYXJhbS5nZXRTb3VyY2VGaWxlKCkpO1xuICAgIGlmICh1bWRNb2R1bGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydHMgPSBnZXRJbXBvcnRzT2ZVbWRNb2R1bGUodW1kTW9kdWxlKTtcbiAgICBpZiAoaW1wb3J0cyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgbGV0IGltcG9ydFBhdGg6IHN0cmluZ3xudWxsID0gbnVsbDtcblxuICAgIGZvciAoY29uc3QgaSBvZiBpbXBvcnRzKSB7XG4gICAgICAvLyBBZGQgYWxsIGltcG9ydHMgdG8gdGhlIG1hcCB0byBzcGVlZCB1cCBmdXR1cmUgbG9vayB1cHMuXG4gICAgICB0aGlzLnVtZEltcG9ydFBhdGhzLnNldChpLnBhcmFtZXRlciwgaS5wYXRoKTtcbiAgICAgIGlmIChpLnBhcmFtZXRlciA9PT0gcGFyYW0pIHtcbiAgICAgICAgaW1wb3J0UGF0aCA9IGkucGF0aDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gaW1wb3J0UGF0aDtcbiAgfVxuXG4gIHByaXZhdGUgZXh0cmFjdFVtZEV4cG9ydERlY2xhcmF0aW9uKHN0YXRlbWVudDogRXhwb3J0U3RhdGVtZW50KTogRXhwb3J0RGVjbGFyYXRpb24ge1xuICAgIGNvbnN0IGV4cG9ydEV4cHJlc3Npb24gPSBzdGF0ZW1lbnQuZXhwcmVzc2lvbi5yaWdodDtcbiAgICBjb25zdCBkZWNsYXJhdGlvbiA9IHRoaXMuZ2V0RGVjbGFyYXRpb25PZkV4cHJlc3Npb24oZXhwb3J0RXhwcmVzc2lvbik7XG4gICAgY29uc3QgbmFtZSA9IHN0YXRlbWVudC5leHByZXNzaW9uLmxlZnQubmFtZS50ZXh0O1xuICAgIGlmIChkZWNsYXJhdGlvbiAhPT0gbnVsbCkge1xuICAgICAgcmV0dXJuIHtuYW1lLCBkZWNsYXJhdGlvbn07XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG5hbWUsXG4gICAgICAgIGRlY2xhcmF0aW9uOiB7XG4gICAgICAgICAgbm9kZTogbnVsbCxcbiAgICAgICAgICBrbm93bjogbnVsbCxcbiAgICAgICAgICBleHByZXNzaW9uOiBleHBvcnRFeHByZXNzaW9uLFxuICAgICAgICAgIHZpYU1vZHVsZTogbnVsbCxcbiAgICAgICAgfSxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBleHRyYWN0VW1kUmVleHBvcnRzKHN0YXRlbWVudDogUmVleHBvcnRTdGF0ZW1lbnQsIGNvbnRhaW5pbmdGaWxlOiB0cy5Tb3VyY2VGaWxlKTpcbiAgICAgIEV4cG9ydERlY2xhcmF0aW9uW10ge1xuICAgIGNvbnN0IHJlZXhwb3J0QXJnID0gc3RhdGVtZW50LmV4cHJlc3Npb24uYXJndW1lbnRzWzBdO1xuXG4gICAgY29uc3QgcmVxdWlyZUNhbGwgPSBpc1JlcXVpcmVDYWxsKHJlZXhwb3J0QXJnKSA/XG4gICAgICAgIHJlZXhwb3J0QXJnIDpcbiAgICAgICAgdHMuaXNJZGVudGlmaWVyKHJlZXhwb3J0QXJnKSA/IGZpbmRSZXF1aXJlQ2FsbFJlZmVyZW5jZShyZWV4cG9ydEFyZywgdGhpcy5jaGVja2VyKSA6IG51bGw7XG5cbiAgICBsZXQgaW1wb3J0UGF0aDogc3RyaW5nfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHJlcXVpcmVDYWxsICE9PSBudWxsKSB7XG4gICAgICBpbXBvcnRQYXRoID0gcmVxdWlyZUNhbGwuYXJndW1lbnRzWzBdLnRleHQ7XG4gICAgfSBlbHNlIGlmICh0cy5pc0lkZW50aWZpZXIocmVleHBvcnRBcmcpKSB7XG4gICAgICBjb25zdCBpbXBvcnRQYXJhbWV0ZXIgPSB0aGlzLmZpbmRVbWRJbXBvcnRQYXJhbWV0ZXIocmVleHBvcnRBcmcpO1xuICAgICAgaW1wb3J0UGF0aCA9IGltcG9ydFBhcmFtZXRlciAmJiB0aGlzLmdldFVtZEltcG9ydFBhdGgoaW1wb3J0UGFyYW1ldGVyKTtcbiAgICB9XG5cbiAgICBpZiAoaW1wb3J0UGF0aCA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydGVkRmlsZSA9IHRoaXMucmVzb2x2ZU1vZHVsZU5hbWUoaW1wb3J0UGF0aCwgY29udGFpbmluZ0ZpbGUpO1xuICAgIGlmIChpbXBvcnRlZEZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydGVkRXhwb3J0cyA9IHRoaXMuZ2V0RXhwb3J0c09mTW9kdWxlKGltcG9ydGVkRmlsZSk7XG4gICAgaWYgKGltcG9ydGVkRXhwb3J0cyA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cblxuICAgIGNvbnN0IHZpYU1vZHVsZSA9IHN0cmlwRXh0ZW5zaW9uKGltcG9ydGVkRmlsZS5maWxlTmFtZSk7XG4gICAgY29uc3QgcmVleHBvcnRzOiBFeHBvcnREZWNsYXJhdGlvbltdID0gW107XG4gICAgaW1wb3J0ZWRFeHBvcnRzLmZvckVhY2goKGRlY2wsIG5hbWUpID0+IHtcbiAgICAgIGlmIChkZWNsLm5vZGUgIT09IG51bGwpIHtcbiAgICAgICAgcmVleHBvcnRzLnB1c2goe25hbWUsIGRlY2xhcmF0aW9uOiB7bm9kZTogZGVjbC5ub2RlLCBrbm93bjogbnVsbCwgdmlhTW9kdWxlfX0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVleHBvcnRzLnB1c2goXG4gICAgICAgICAgICB7bmFtZSwgZGVjbGFyYXRpb246IHtub2RlOiBudWxsLCBrbm93bjogbnVsbCwgZXhwcmVzc2lvbjogZGVjbC5leHByZXNzaW9uLCB2aWFNb2R1bGV9fSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgcmV0dXJuIHJlZXhwb3J0cztcbiAgfVxuXG4gIC8qKlxuICAgKiBJcyB0aGUgaWRlbnRpZmllciBhIHBhcmFtZXRlciBvbiBhIFVNRCBmYWN0b3J5IGZ1bmN0aW9uLCBlLmcuIGBmdW5jdGlvbiBmYWN0b3J5KHRoaXMsIGNvcmUpYD9cbiAgICogSWYgc28gdGhlbiByZXR1cm4gaXRzIGRlY2xhcmF0aW9uLlxuICAgKi9cbiAgcHJpdmF0ZSBmaW5kVW1kSW1wb3J0UGFyYW1ldGVyKGlkOiB0cy5JZGVudGlmaWVyKTogdHMuUGFyYW1ldGVyRGVjbGFyYXRpb258bnVsbCB7XG4gICAgY29uc3Qgc3ltYm9sID0gaWQgJiYgdGhpcy5jaGVja2VyLmdldFN5bWJvbEF0TG9jYXRpb24oaWQpIHx8IG51bGw7XG4gICAgY29uc3QgZGVjbGFyYXRpb24gPSBzeW1ib2wgJiYgc3ltYm9sLnZhbHVlRGVjbGFyYXRpb247XG4gICAgcmV0dXJuIGRlY2xhcmF0aW9uICYmIHRzLmlzUGFyYW1ldGVyKGRlY2xhcmF0aW9uKSA/IGRlY2xhcmF0aW9uIDogbnVsbDtcbiAgfVxuXG4gIHByaXZhdGUgZ2V0VW1kSW1wb3J0ZWREZWNsYXJhdGlvbihpZDogdHMuSWRlbnRpZmllcik6IERlY2xhcmF0aW9ufG51bGwge1xuICAgIGNvbnN0IGltcG9ydEluZm8gPSB0aGlzLmdldEltcG9ydE9mSWRlbnRpZmllcihpZCk7XG4gICAgaWYgKGltcG9ydEluZm8gPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGNvbnN0IGltcG9ydGVkRmlsZSA9IHRoaXMucmVzb2x2ZU1vZHVsZU5hbWUoaW1wb3J0SW5mby5mcm9tLCBpZC5nZXRTb3VyY2VGaWxlKCkpO1xuICAgIGlmIChpbXBvcnRlZEZpbGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgLy8gV2UgbmVlZCB0byBhZGQgdGhlIGB2aWFNb2R1bGVgIGJlY2F1c2UgIHRoZSBgZ2V0RXhwb3J0c09mTW9kdWxlKClgIGNhbGxcbiAgICAvLyBkaWQgbm90IGtub3cgdGhhdCB3ZSB3ZXJlIGltcG9ydGluZyB0aGUgZGVjbGFyYXRpb24uXG4gICAgcmV0dXJuIHtub2RlOiBpbXBvcnRlZEZpbGUsIGtub3duOiBudWxsLCB2aWFNb2R1bGU6IGltcG9ydEluZm8uZnJvbX07XG4gIH1cblxuICBwcml2YXRlIHJlc29sdmVNb2R1bGVOYW1lKG1vZHVsZU5hbWU6IHN0cmluZywgY29udGFpbmluZ0ZpbGU6IHRzLlNvdXJjZUZpbGUpOiB0cy5Tb3VyY2VGaWxlXG4gICAgICB8dW5kZWZpbmVkIHtcbiAgICBpZiAodGhpcy5jb21waWxlckhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzKSB7XG4gICAgICBjb25zdCBtb2R1bGVJbmZvID0gdGhpcy5jb21waWxlckhvc3QucmVzb2x2ZU1vZHVsZU5hbWVzKFxuICAgICAgICAgIFttb2R1bGVOYW1lXSwgY29udGFpbmluZ0ZpbGUuZmlsZU5hbWUsIHVuZGVmaW5lZCwgdW5kZWZpbmVkLFxuICAgICAgICAgIHRoaXMucHJvZ3JhbS5nZXRDb21waWxlck9wdGlvbnMoKSlbMF07XG4gICAgICByZXR1cm4gbW9kdWxlSW5mbyAmJiB0aGlzLnByb2dyYW0uZ2V0U291cmNlRmlsZShhYnNvbHV0ZUZyb20obW9kdWxlSW5mby5yZXNvbHZlZEZpbGVOYW1lKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IG1vZHVsZUluZm8gPSB0cy5yZXNvbHZlTW9kdWxlTmFtZShcbiAgICAgICAgICBtb2R1bGVOYW1lLCBjb250YWluaW5nRmlsZS5maWxlTmFtZSwgdGhpcy5wcm9ncmFtLmdldENvbXBpbGVyT3B0aW9ucygpLFxuICAgICAgICAgIHRoaXMuY29tcGlsZXJIb3N0KTtcbiAgICAgIHJldHVybiBtb2R1bGVJbmZvLnJlc29sdmVkTW9kdWxlICYmXG4gICAgICAgICAgdGhpcy5wcm9ncmFtLmdldFNvdXJjZUZpbGUoYWJzb2x1dGVGcm9tKG1vZHVsZUluZm8ucmVzb2x2ZWRNb2R1bGUucmVzb2x2ZWRGaWxlTmFtZSkpO1xuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VTdGF0ZW1lbnRGb3JVbWRNb2R1bGUoc3RhdGVtZW50OiB0cy5TdGF0ZW1lbnQpOiBVbWRNb2R1bGV8bnVsbCB7XG4gIGNvbnN0IHdyYXBwZXJDYWxsID0gZ2V0VW1kV3JhcHBlckNhbGwoc3RhdGVtZW50KTtcbiAgaWYgKCF3cmFwcGVyQ2FsbCkgcmV0dXJuIG51bGw7XG5cbiAgY29uc3Qgd3JhcHBlckZuID0gd3JhcHBlckNhbGwuZXhwcmVzc2lvbjtcbiAgaWYgKCF0cy5pc0Z1bmN0aW9uRXhwcmVzc2lvbih3cmFwcGVyRm4pKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBmYWN0b3J5Rm5QYXJhbUluZGV4ID0gd3JhcHBlckZuLnBhcmFtZXRlcnMuZmluZEluZGV4KFxuICAgICAgcGFyYW1ldGVyID0+IHRzLmlzSWRlbnRpZmllcihwYXJhbWV0ZXIubmFtZSkgJiYgcGFyYW1ldGVyLm5hbWUudGV4dCA9PT0gJ2ZhY3RvcnknKTtcbiAgaWYgKGZhY3RvcnlGblBhcmFtSW5kZXggPT09IC0xKSByZXR1cm4gbnVsbDtcblxuICBjb25zdCBmYWN0b3J5Rm4gPSBzdHJpcFBhcmVudGhlc2VzKHdyYXBwZXJDYWxsLmFyZ3VtZW50c1tmYWN0b3J5Rm5QYXJhbUluZGV4XSk7XG4gIGlmICghZmFjdG9yeUZuIHx8ICF0cy5pc0Z1bmN0aW9uRXhwcmVzc2lvbihmYWN0b3J5Rm4pKSByZXR1cm4gbnVsbDtcblxuICByZXR1cm4ge3dyYXBwZXJGbiwgZmFjdG9yeUZufTtcbn1cblxuZnVuY3Rpb24gZ2V0VW1kV3JhcHBlckNhbGwoc3RhdGVtZW50OiB0cy5TdGF0ZW1lbnQpOiB0cy5DYWxsRXhwcmVzc2lvbiZcbiAgICB7ZXhwcmVzc2lvbjogdHMuRnVuY3Rpb25FeHByZXNzaW9ufXxudWxsIHtcbiAgaWYgKCF0cy5pc0V4cHJlc3Npb25TdGF0ZW1lbnQoc3RhdGVtZW50KSB8fCAhdHMuaXNQYXJlbnRoZXNpemVkRXhwcmVzc2lvbihzdGF0ZW1lbnQuZXhwcmVzc2lvbikgfHxcbiAgICAgICF0cy5pc0NhbGxFeHByZXNzaW9uKHN0YXRlbWVudC5leHByZXNzaW9uLmV4cHJlc3Npb24pIHx8XG4gICAgICAhdHMuaXNGdW5jdGlvbkV4cHJlc3Npb24oc3RhdGVtZW50LmV4cHJlc3Npb24uZXhwcmVzc2lvbi5leHByZXNzaW9uKSkge1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBzdGF0ZW1lbnQuZXhwcmVzc2lvbi5leHByZXNzaW9uIGFzIHRzLkNhbGxFeHByZXNzaW9uICYge2V4cHJlc3Npb246IHRzLkZ1bmN0aW9uRXhwcmVzc2lvbn07XG59XG5cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEltcG9ydHNPZlVtZE1vZHVsZSh1bWRNb2R1bGU6IFVtZE1vZHVsZSk6XG4gICAge3BhcmFtZXRlcjogdHMuUGFyYW1ldGVyRGVjbGFyYXRpb24sIHBhdGg6IHN0cmluZ31bXSB7XG4gIGNvbnN0IGltcG9ydHM6IHtwYXJhbWV0ZXI6IHRzLlBhcmFtZXRlckRlY2xhcmF0aW9uLCBwYXRoOiBzdHJpbmd9W10gPSBbXTtcbiAgZm9yIChsZXQgaSA9IDE7IGkgPCB1bWRNb2R1bGUuZmFjdG9yeUZuLnBhcmFtZXRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICBpbXBvcnRzLnB1c2goe1xuICAgICAgcGFyYW1ldGVyOiB1bWRNb2R1bGUuZmFjdG9yeUZuLnBhcmFtZXRlcnNbaV0sXG4gICAgICBwYXRoOiBnZXRSZXF1aXJlZE1vZHVsZVBhdGgodW1kTW9kdWxlLndyYXBwZXJGbiwgaSlcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gaW1wb3J0cztcbn1cblxuaW50ZXJmYWNlIFVtZE1vZHVsZSB7XG4gIHdyYXBwZXJGbjogdHMuRnVuY3Rpb25FeHByZXNzaW9uO1xuICBmYWN0b3J5Rm46IHRzLkZ1bmN0aW9uRXhwcmVzc2lvbjtcbn1cblxuZnVuY3Rpb24gZ2V0UmVxdWlyZWRNb2R1bGVQYXRoKHdyYXBwZXJGbjogdHMuRnVuY3Rpb25FeHByZXNzaW9uLCBwYXJhbUluZGV4OiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBzdGF0ZW1lbnQgPSB3cmFwcGVyRm4uYm9keS5zdGF0ZW1lbnRzWzBdO1xuICBpZiAoIXRzLmlzRXhwcmVzc2lvblN0YXRlbWVudChzdGF0ZW1lbnQpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAnVU1EIHdyYXBwZXIgYm9keSBpcyBub3QgYW4gZXhwcmVzc2lvbiBzdGF0ZW1lbnQ6XFxuJyArIHdyYXBwZXJGbi5ib2R5LmdldFRleHQoKSk7XG4gIH1cbiAgY29uc3QgbW9kdWxlUGF0aHM6IHN0cmluZ1tdID0gW107XG4gIGZpbmRNb2R1bGVQYXRocyhzdGF0ZW1lbnQuZXhwcmVzc2lvbik7XG5cbiAgLy8gU2luY2Ugd2Ugd2VyZSBvbmx5IGludGVyZXN0ZWQgaW4gdGhlIGByZXF1aXJlKClgIGNhbGxzLCB3ZSBtaXNzIHRoZSBgZXhwb3J0c2AgYXJndW1lbnQsIHNvIHdlXG4gIC8vIG5lZWQgdG8gc3VidHJhY3QgMS5cbiAgLy8gRS5nLiBgZnVuY3Rpb24oZXhwb3J0cywgZGVwMSwgZGVwMilgIG1hcHMgdG8gYGZ1bmN0aW9uKGV4cG9ydHMsIHJlcXVpcmUoJ3BhdGgvdG8vZGVwMScpLFxuICAvLyByZXF1aXJlKCdwYXRoL3RvL2RlcDInKSlgXG4gIHJldHVybiBtb2R1bGVQYXRoc1twYXJhbUluZGV4IC0gMV07XG5cbiAgLy8gU2VhcmNoIHRoZSBzdGF0ZW1lbnQgZm9yIGNhbGxzIHRvIGByZXF1aXJlKCcuLi4nKWAgYW5kIGV4dHJhY3QgdGhlIHN0cmluZyB2YWx1ZSBvZiB0aGUgZmlyc3RcbiAgLy8gYXJndW1lbnRcbiAgZnVuY3Rpb24gZmluZE1vZHVsZVBhdGhzKG5vZGU6IHRzLk5vZGUpIHtcbiAgICBpZiAoaXNSZXF1aXJlQ2FsbChub2RlKSkge1xuICAgICAgY29uc3QgYXJndW1lbnQgPSBub2RlLmFyZ3VtZW50c1swXTtcbiAgICAgIGlmICh0cy5pc1N0cmluZ0xpdGVyYWwoYXJndW1lbnQpKSB7XG4gICAgICAgIG1vZHVsZVBhdGhzLnB1c2goYXJndW1lbnQudGV4dCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vZGUuZm9yRWFjaENoaWxkKGZpbmRNb2R1bGVQYXRocyk7XG4gICAgfVxuICB9XG59XG4iXX0=