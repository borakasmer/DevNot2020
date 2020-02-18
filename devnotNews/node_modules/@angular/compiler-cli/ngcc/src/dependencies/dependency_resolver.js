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
        define("@angular/compiler-cli/ngcc/src/dependencies/dependency_resolver", ["require", "exports", "tslib", "dependency-graph", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/ngcc/src/packages/entry_point", "@angular/compiler-cli/ngcc/src/dependencies/dependency_host"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var dependency_graph_1 = require("dependency-graph");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var entry_point_1 = require("@angular/compiler-cli/ngcc/src/packages/entry_point");
    var dependency_host_1 = require("@angular/compiler-cli/ngcc/src/dependencies/dependency_host");
    var builtinNodeJsModules = new Set(require('module').builtinModules);
    /**
     * A class that resolves dependencies between entry-points.
     */
    var DependencyResolver = /** @class */ (function () {
        function DependencyResolver(fs, logger, hosts, typingsHost) {
            this.fs = fs;
            this.logger = logger;
            this.hosts = hosts;
            this.typingsHost = typingsHost;
        }
        /**
         * Sort the array of entry points so that the dependant entry points always come later than
         * their dependencies in the array.
         * @param entryPoints An array entry points to sort.
         * @param target If provided, only return entry-points depended on by this entry-point.
         * @returns the result of sorting the entry points by dependency.
         */
        DependencyResolver.prototype.sortEntryPointsByDependency = function (entryPoints, target) {
            var _a = this.computeDependencyGraph(entryPoints), invalidEntryPoints = _a.invalidEntryPoints, ignoredDependencies = _a.ignoredDependencies, graph = _a.graph;
            var sortedEntryPointNodes;
            if (target) {
                if (target.compiledByAngular && graph.hasNode(target.path)) {
                    sortedEntryPointNodes = graph.dependenciesOf(target.path);
                    sortedEntryPointNodes.push(target.path);
                }
                else {
                    sortedEntryPointNodes = [];
                }
            }
            else {
                sortedEntryPointNodes = graph.overallOrder();
            }
            return {
                entryPoints: sortedEntryPointNodes
                    .map(function (path) { return graph.getNodeData(path); }),
                graph: graph,
                invalidEntryPoints: invalidEntryPoints,
                ignoredDependencies: ignoredDependencies,
            };
        };
        DependencyResolver.prototype.getEntryPointDependencies = function (entryPoint) {
            var formatInfo = this.getEntryPointFormatInfo(entryPoint);
            var host = this.hosts[formatInfo.format];
            if (!host) {
                throw new Error("Could not find a suitable format for computing dependencies of entry-point: '" + entryPoint.path + "'.");
            }
            var depInfo = dependency_host_1.createDependencyInfo();
            host.collectDependencies(formatInfo.path, depInfo);
            this.typingsHost.collectDependencies(entryPoint.typings, depInfo);
            return depInfo;
        };
        /**
         * Computes a dependency graph of the given entry-points.
         *
         * The graph only holds entry-points that ngcc cares about and whose dependencies
         * (direct and transitive) all exist.
         */
        DependencyResolver.prototype.computeDependencyGraph = function (entryPoints) {
            var _this = this;
            var invalidEntryPoints = [];
            var ignoredDependencies = [];
            var graph = new dependency_graph_1.DepGraph();
            var angularEntryPoints = entryPoints.filter(function (entryPoint) { return entryPoint.compiledByAngular; });
            // Add the Angular compiled entry points to the graph as nodes
            angularEntryPoints.forEach(function (entryPoint) { return graph.addNode(entryPoint.path, entryPoint); });
            // Now add the dependencies between them
            angularEntryPoints.forEach(function (entryPoint) {
                var _a = _this.getEntryPointDependencies(entryPoint), dependencies = _a.dependencies, missing = _a.missing, deepImports = _a.deepImports;
                var missingDependencies = Array.from(missing).filter(function (dep) { return !builtinNodeJsModules.has(dep); });
                if (missingDependencies.length > 0 && !entryPoint.ignoreMissingDependencies) {
                    // This entry point has dependencies that are missing
                    // so remove it from the graph.
                    removeNodes(entryPoint, missingDependencies);
                }
                else {
                    dependencies.forEach(function (dependencyPath) {
                        if (!graph.hasNode(entryPoint.path)) {
                            // The entry-point has already been identified as invalid so we don't need
                            // to do any further work on it.
                        }
                        else if (graph.hasNode(dependencyPath)) {
                            // The entry-point is still valid (i.e. has no missing dependencies) and
                            // the dependency maps to an entry point that exists in the graph so add it
                            graph.addDependency(entryPoint.path, dependencyPath);
                        }
                        else if (invalidEntryPoints.some(function (i) { return i.entryPoint.path === dependencyPath; })) {
                            // The dependency path maps to an entry-point that was previously removed
                            // from the graph, so remove this entry-point as well.
                            removeNodes(entryPoint, [dependencyPath]);
                        }
                        else {
                            // The dependency path points to a package that ngcc does not care about.
                            ignoredDependencies.push({ entryPoint: entryPoint, dependencyPath: dependencyPath });
                        }
                    });
                }
                if (deepImports.size) {
                    var imports = Array.from(deepImports).map(function (i) { return "'" + i + "'"; }).join(', ');
                    _this.logger.warn("Entry point '" + entryPoint.name + "' contains deep imports into " + imports + ". " +
                        "This is probably not a problem, but may cause the compilation of entry points to be out of order.");
                }
            });
            return { invalidEntryPoints: invalidEntryPoints, ignoredDependencies: ignoredDependencies, graph: graph };
            function removeNodes(entryPoint, missingDependencies) {
                var nodesToRemove = tslib_1.__spread([entryPoint.path], graph.dependantsOf(entryPoint.path));
                nodesToRemove.forEach(function (node) {
                    invalidEntryPoints.push({ entryPoint: graph.getNodeData(node), missingDependencies: missingDependencies });
                    graph.removeNode(node);
                });
            }
        };
        DependencyResolver.prototype.getEntryPointFormatInfo = function (entryPoint) {
            var e_1, _a;
            try {
                for (var SUPPORTED_FORMAT_PROPERTIES_1 = tslib_1.__values(entry_point_1.SUPPORTED_FORMAT_PROPERTIES), SUPPORTED_FORMAT_PROPERTIES_1_1 = SUPPORTED_FORMAT_PROPERTIES_1.next(); !SUPPORTED_FORMAT_PROPERTIES_1_1.done; SUPPORTED_FORMAT_PROPERTIES_1_1 = SUPPORTED_FORMAT_PROPERTIES_1.next()) {
                    var property = SUPPORTED_FORMAT_PROPERTIES_1_1.value;
                    var formatPath = entryPoint.packageJson[property];
                    if (formatPath === undefined)
                        continue;
                    var format = entry_point_1.getEntryPointFormat(this.fs, entryPoint, property);
                    if (format === undefined)
                        continue;
                    return { format: format, path: file_system_1.resolve(entryPoint.path, formatPath) };
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (SUPPORTED_FORMAT_PROPERTIES_1_1 && !SUPPORTED_FORMAT_PROPERTIES_1_1.done && (_a = SUPPORTED_FORMAT_PROPERTIES_1.return)) _a.call(SUPPORTED_FORMAT_PROPERTIES_1);
                }
                finally { if (e_1) throw e_1.error; }
            }
            throw new Error("There is no appropriate source code format in '" + entryPoint.path + "' entry-point.");
        };
        return DependencyResolver;
    }());
    exports.DependencyResolver = DependencyResolver;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVwZW5kZW5jeV9yZXNvbHZlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9uZ2NjL3NyYy9kZXBlbmRlbmNpZXMvZGVwZW5kZW5jeV9yZXNvbHZlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCxxREFBMEM7SUFDMUMsMkVBQW1GO0lBRW5GLG1GQUF1SDtJQUV2SCwrRkFBdUY7SUFFdkYsSUFBTSxvQkFBb0IsR0FBRyxJQUFJLEdBQUcsQ0FBUyxPQUFPLENBQUMsUUFBUSxDQUFDLENBQUMsY0FBYyxDQUFDLENBQUM7SUErRC9FOztPQUVHO0lBQ0g7UUFDRSw0QkFDWSxFQUFjLEVBQVUsTUFBYyxFQUN0QyxLQUF3RCxFQUN4RCxXQUEyQjtZQUYzQixPQUFFLEdBQUYsRUFBRSxDQUFZO1lBQVUsV0FBTSxHQUFOLE1BQU0sQ0FBUTtZQUN0QyxVQUFLLEdBQUwsS0FBSyxDQUFtRDtZQUN4RCxnQkFBVyxHQUFYLFdBQVcsQ0FBZ0I7UUFBRyxDQUFDO1FBQzNDOzs7Ozs7V0FNRztRQUNILHdEQUEyQixHQUEzQixVQUE0QixXQUF5QixFQUFFLE1BQW1CO1lBRWxFLElBQUEsNkNBQ3NDLEVBRHJDLDBDQUFrQixFQUFFLDRDQUFtQixFQUFFLGdCQUNKLENBQUM7WUFFN0MsSUFBSSxxQkFBK0IsQ0FBQztZQUNwQyxJQUFJLE1BQU0sRUFBRTtnQkFDVixJQUFJLE1BQU0sQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDMUQscUJBQXFCLEdBQUcsS0FBSyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQzFELHFCQUFxQixDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7aUJBQ3pDO3FCQUFNO29C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QUk7b0JBQ3hCLGtCQUFrQixDQUFDLElBQUksQ0FBQyxFQUFDLFVBQVUsRUFBRSxLQUFLLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxFQUFFLG1CQUFtQixxQkFBQSxFQUFDLENBQUMsQ0FBQztvQkFDcEYsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDekIsQ0FBQyxDQUFDLENBQUM7WUFDTCxDQUFDO1FBQ0gsQ0FBQztRQUVPLG9EQUF1QixHQUEvQixVQUFnQyxVQUFzQjs7O2dCQUVwRCxLQUF1QixJQUFBLGdDQUFBLGlCQUFBLHlDQUEyQixDQUFBLHdFQUFBLGlIQUFFO29CQUEvQyxJQUFNLFFBQVEsd0NBQUE7b0JBQ2pCLElBQU0sVUFBVSxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLENBQUM7b0JBQ3BELElBQUksVUFBVSxLQUFLLFNBQVM7d0JBQUUsU0FBUztvQkFFdkMsSUFBTSxNQUFNLEdBQUcsaUNBQW1CLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxVQUFVLEVBQUUsUUFBUSxDQUFDLENBQUM7b0JBQ2xFLElBQUksTUFBTSxLQUFLLFNBQVM7d0JBQUUsU0FBUztvQkFFbkMsT0FBTyxFQUFDLE1BQU0sUUFBQSxFQUFFLElBQUksRUFBRSxxQkFBTyxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsVUFBVSxDQUFDLEVBQUMsQ0FBQztpQkFDN0Q7Ozs7Ozs7OztZQUVELE1BQU0sSUFBSSxLQUFLLENBQ1gsb0RBQWtELFVBQVUsQ0FBQyxJQUFJLG1CQUFnQixDQUFDLENBQUM7UUFDekYsQ0FBQztRQUNILHlCQUFDO0lBQUQsQ0FBQyxBQW5JRCxJQW1JQztJQW5JWSxnREFBa0IiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7RGVwR3JhcGh9IGZyb20gJ2RlcGVuZGVuY3ktZ3JhcGgnO1xuaW1wb3J0IHtBYnNvbHV0ZUZzUGF0aCwgRmlsZVN5c3RlbSwgcmVzb2x2ZX0gZnJvbSAnLi4vLi4vLi4vc3JjL25ndHNjL2ZpbGVfc3lzdGVtJztcbmltcG9ydCB7TG9nZ2VyfSBmcm9tICcuLi9sb2dnaW5nL2xvZ2dlcic7XG5pbXBvcnQge0VudHJ5UG9pbnQsIEVudHJ5UG9pbnRGb3JtYXQsIFNVUFBPUlRFRF9GT1JNQVRfUFJPUEVSVElFUywgZ2V0RW50cnlQb2ludEZvcm1hdH0gZnJvbSAnLi4vcGFja2FnZXMvZW50cnlfcG9pbnQnO1xuaW1wb3J0IHtQYXJ0aWFsbHlPcmRlcmVkTGlzdH0gZnJvbSAnLi4vdXRpbHMnO1xuaW1wb3J0IHtEZXBlbmRlbmN5SG9zdCwgRGVwZW5kZW5jeUluZm8sIGNyZWF0ZURlcGVuZGVuY3lJbmZvfSBmcm9tICcuL2RlcGVuZGVuY3lfaG9zdCc7XG5cbmNvbnN0IGJ1aWx0aW5Ob2RlSnNNb2R1bGVzID0gbmV3IFNldDxzdHJpbmc+KHJlcXVpcmUoJ21vZHVsZScpLmJ1aWx0aW5Nb2R1bGVzKTtcblxuLyoqXG4gKiBIb2xkcyBpbmZvcm1hdGlvbiBhYm91dCBlbnRyeSBwb2ludHMgdGhhdCBhcmUgcmVtb3ZlZCBiZWNhdXNlXG4gKiB0aGV5IGhhdmUgZGVwZW5kZW5jaWVzIHRoYXQgYXJlIG1pc3NpbmcgKGRpcmVjdGx5IG9yIHRyYW5zaXRpdmVseSkuXG4gKlxuICogVGhpcyBtaWdodCBub3QgYmUgYW4gZXJyb3IsIGJlY2F1c2Ugc3VjaCBhbiBlbnRyeSBwb2ludCBtaWdodCBub3QgYWN0dWFsbHkgYmUgdXNlZFxuICogaW4gdGhlIGFwcGxpY2F0aW9uLiBJZiBpdCBpcyB1c2VkIHRoZW4gdGhlIGBuZ2NgIGFwcGxpY2F0aW9uIGNvbXBpbGF0aW9uIHdvdWxkXG4gKiBmYWlsIGFsc28sIHNvIHdlIGRvbid0IG5lZWQgbmdjYyB0byBjYXRjaCB0aGlzLlxuICpcbiAqIEZvciBleGFtcGxlLCBjb25zaWRlciBhbiBhcHBsaWNhdGlvbiB0aGF0IHVzZXMgdGhlIGBAYW5ndWxhci9yb3V0ZXJgIHBhY2thZ2UuXG4gKiBUaGlzIHBhY2thZ2UgaW5jbHVkZXMgYW4gZW50cnktcG9pbnQgY2FsbGVkIGBAYW5ndWxhci9yb3V0ZXIvdXBncmFkZWAsIHdoaWNoIGhhcyBhIGRlcGVuZGVuY3lcbiAqIG9uIHRoZSBgQGFuZ3VsYXIvdXBncmFkZWAgcGFja2FnZS5cbiAqIElmIHRoZSBhcHBsaWNhdGlvbiBuZXZlciB1c2VzIGNvZGUgZnJvbSBgQGFuZ3VsYXIvcm91dGVyL3VwZ3JhZGVgIHRoZW4gdGhlcmUgaXMgbm8gbmVlZCBmb3JcbiAqIGBAYW5ndWxhci91cGdyYWRlYCB0byBiZSBpbnN0YWxsZWQuXG4gKiBJbiB0aGlzIGNhc2UgdGhlIG5nY2MgdG9vbCBzaG91bGQganVzdCBpZ25vcmUgdGhlIGBAYW5ndWxhci9yb3V0ZXIvdXBncmFkZWAgZW5kLXBvaW50LlxuICovXG5leHBvcnQgaW50ZXJmYWNlIEludmFsaWRFbnRyeVBvaW50IHtcbiAgZW50cnlQb2ludDogRW50cnlQb2ludDtcbiAgbWlzc2luZ0RlcGVuZGVuY2llczogc3RyaW5nW107XG59XG5cbi8qKlxuICogSG9sZHMgaW5mb3JtYXRpb24gYWJvdXQgZGVwZW5kZW5jaWVzIG9mIGFuIGVudHJ5LXBvaW50IHRoYXQgZG8gbm90IG5lZWQgdG8gYmUgcHJvY2Vzc2VkXG4gKiBieSB0aGUgbmdjYyB0b29sLlxuICpcbiAqIEZvciBleGFtcGxlLCB0aGUgYHJ4anNgIHBhY2thZ2UgZG9lcyBub3QgY29udGFpbiBhbnkgQW5ndWxhciBkZWNvcmF0b3JzIHRoYXQgbmVlZCB0byBiZVxuICogY29tcGlsZWQgYW5kIHNvIHRoaXMgY2FuIGJlIHNhZmVseSBpZ25vcmVkIGJ5IG5nY2MuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgSWdub3JlZERlcGVuZGVuY3kge1xuICBlbnRyeVBvaW50OiBFbnRyeVBvaW50O1xuICBkZXBlbmRlbmN5UGF0aDogc3RyaW5nO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERlcGVuZGVuY3lEaWFnbm9zdGljcyB7XG4gIGludmFsaWRFbnRyeVBvaW50czogSW52YWxpZEVudHJ5UG9pbnRbXTtcbiAgaWdub3JlZERlcGVuZGVuY2llczogSWdub3JlZERlcGVuZGVuY3lbXTtcbn1cblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgcGFydGlhbGx5IG9yZGVyZWQgbGlzdCBvZiBlbnRyeS1wb2ludHMuXG4gKlxuICogVGhlIGVudHJ5LXBvaW50cycgb3JkZXIvcHJlY2VkZW5jZSBpcyBzdWNoIHRoYXQgZGVwZW5kZW50IGVudHJ5LXBvaW50cyBhbHdheXMgY29tZSBsYXRlciB0aGFuXG4gKiB0aGVpciBkZXBlbmRlbmNpZXMgaW4gdGhlIGxpc3QuXG4gKlxuICogU2VlIGBEZXBlbmRlbmN5UmVzb2x2ZXIjc29ydEVudHJ5UG9pbnRzQnlEZXBlbmRlbmN5KClgLlxuICovXG5leHBvcnQgdHlwZSBQYXJ0aWFsbHlPcmRlcmVkRW50cnlQb2ludHMgPSBQYXJ0aWFsbHlPcmRlcmVkTGlzdDxFbnRyeVBvaW50PjtcblxuLyoqXG4gKiBBIGxpc3Qgb2YgZW50cnktcG9pbnRzLCBzb3J0ZWQgYnkgdGhlaXIgZGVwZW5kZW5jaWVzLCBhbmQgdGhlIGRlcGVuZGVuY3kgZ3JhcGguXG4gKlxuICogVGhlIGBlbnRyeVBvaW50c2AgYXJyYXkgd2lsbCBiZSBvcmRlcmVkIHNvIHRoYXQgbm8gZW50cnkgcG9pbnQgZGVwZW5kcyB1cG9uIGFuIGVudHJ5IHBvaW50IHRoYXRcbiAqIGFwcGVhcnMgbGF0ZXIgaW4gdGhlIGFycmF5LlxuICpcbiAqIFNvbWUgZW50cnkgcG9pbnRzIG9yIHRoZWlyIGRlcGVuZGVuY2llcyBtYXkgaGF2ZSBiZWVuIGlnbm9yZWQuIFRoZXNlIGFyZSBjYXB0dXJlZCBmb3JcbiAqIGRpYWdub3N0aWMgcHVycG9zZXMgaW4gYGludmFsaWRFbnRyeVBvaW50c2AgYW5kIGBpZ25vcmVkRGVwZW5kZW5jaWVzYCByZXNwZWN0aXZlbHkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgU29ydGVkRW50cnlQb2ludHNJbmZvIGV4dGVuZHMgRGVwZW5kZW5jeURpYWdub3N0aWNzIHtcbiAgZW50cnlQb2ludHM6IFBhcnRpYWxseU9yZGVyZWRFbnRyeVBvaW50cztcbiAgZ3JhcGg6IERlcEdyYXBoPEVudHJ5UG9pbnQ+O1xufVxuXG4vKipcbiAqIEEgY2xhc3MgdGhhdCByZXNvbHZlcyBkZXBlbmRlbmNpZXMgYmV0d2VlbiBlbnRyeS1wb2ludHMuXG4gKi9cbmV4cG9ydCBjbGFzcyBEZXBlbmRlbmN5UmVzb2x2ZXIge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZnM6IEZpbGVTeXN0ZW0sIHByaXZhdGUgbG9nZ2VyOiBMb2dnZXIsXG4gICAgICBwcml2YXRlIGhvc3RzOiBQYXJ0aWFsPFJlY29yZDxFbnRyeVBvaW50Rm9ybWF0LCBEZXBlbmRlbmN5SG9zdD4+LFxuICAgICAgcHJpdmF0ZSB0eXBpbmdzSG9zdDogRGVwZW5kZW5jeUhvc3QpIHt9XG4gIC8qKlxuICAgKiBTb3J0IHRoZSBhcnJheSBvZiBlbnRyeSBwb2ludHMgc28gdGhhdCB0aGUgZGVwZW5kYW50IGVudHJ5IHBvaW50cyBhbHdheXMgY29tZSBsYXRlciB0aGFuXG4gICAqIHRoZWlyIGRlcGVuZGVuY2llcyBpbiB0aGUgYXJyYXkuXG4gICAqIEBwYXJhbSBlbnRyeVBvaW50cyBBbiBhcnJheSBlbnRyeSBwb2ludHMgdG8gc29ydC5cbiAgICogQHBhcmFtIHRhcmdldCBJZiBwcm92aWRlZCwgb25seSByZXR1cm4gZW50cnktcG9pbnRzIGRlcGVuZGVkIG9uIGJ5IHRoaXMgZW50cnktcG9pbnQuXG4gICAqIEByZXR1cm5zIHRoZSByZXN1bHQgb2Ygc29ydGluZyB0aGUgZW50cnkgcG9pbnRzIGJ5IGRlcGVuZGVuY3kuXG4gICAqL1xuICBzb3J0RW50cnlQb2ludHNCeURlcGVuZGVuY3koZW50cnlQb2ludHM6IEVudHJ5UG9pbnRbXSwgdGFyZ2V0PzogRW50cnlQb2ludCk6XG4gICAgICBTb3J0ZWRFbnRyeVBvaW50c0luZm8ge1xuICAgIGNvbnN0IHtpbnZhbGlkRW50cnlQb2ludHMsIGlnbm9yZWREZXBlbmRlbmNpZXMsIGdyYXBofSA9XG4gICAgICAgIHRoaXMuY29tcHV0ZURlcGVuZGVuY3lHcmFwaChlbnRyeVBvaW50cyk7XG5cbiAgICBsZXQgc29ydGVkRW50cnlQb2ludE5vZGVzOiBzdHJpbmdbXTtcbiAgICBpZiAodGFyZ2V0KSB7XG4gICAgICBpZiAodGFyZ2V0LmNvbXBpbGVkQnlBbmd1bGFyICYmIGdyYXBoLmhhc05vZGUodGFyZ2V0LnBhdGgpKSB7XG4gICAgICAgIHNvcnRlZEVudHJ5UG9pbnROb2RlcyA9IGdyYXBoLmRlcGVuZGVuY2llc09mKHRhcmdldC5wYXRoKTtcbiAgICAgICAgc29ydGVkRW50cnlQb2ludE5vZGVzLnB1c2godGFyZ2V0LnBhdGgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc29ydGVkRW50cnlQb2ludE5vZGVzID0gW107XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHNvcnRlZEVudHJ5UG9pbnROb2RlcyA9IGdyYXBoLm92ZXJhbGxPcmRlcigpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICBlbnRyeVBvaW50czogKHNvcnRlZEVudHJ5UG9pbnROb2RlcyBhcyBQYXJ0aWFsbHlPcmRlcmVkTGlzdDxzdHJpbmc+KVxuICAgICAgICAgICAgICAgICAgICAgICAubWFwKHBhdGggPT4gZ3JhcGguZ2V0Tm9kZURhdGEocGF0aCkpLFxuICAgICAgZ3JhcGgsXG4gICAgICBpbnZhbGlkRW50cnlQb2ludHMsXG4gICAgICBpZ25vcmVkRGVwZW5kZW5jaWVzLFxuICAgIH07XG4gIH1cblxuICBnZXRFbnRyeVBvaW50RGVwZW5kZW5jaWVzKGVudHJ5UG9pbnQ6IEVudHJ5UG9pbnQpOiBEZXBlbmRlbmN5SW5mbyB7XG4gICAgY29uc3QgZm9ybWF0SW5mbyA9IHRoaXMuZ2V0RW50cnlQb2ludEZvcm1hdEluZm8oZW50cnlQb2ludCk7XG4gICAgY29uc3QgaG9zdCA9IHRoaXMuaG9zdHNbZm9ybWF0SW5mby5mb3JtYXRdO1xuICAgIGlmICghaG9zdCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBDb3VsZCBub3QgZmluZCBhIHN1aXRhYmxlIGZvcm1hdCBmb3IgY29tcHV0aW5nIGRlcGVuZGVuY2llcyBvZiBlbnRyeS1wb2ludDogJyR7ZW50cnlQb2ludC5wYXRofScuYCk7XG4gICAgfVxuICAgIGNvbnN0IGRlcEluZm8gPSBjcmVhdGVEZXBlbmRlbmN5SW5mbygpO1xuICAgIGhvc3QuY29sbGVjdERlcGVuZGVuY2llcyhmb3JtYXRJbmZvLnBhdGgsIGRlcEluZm8pO1xuICAgIHRoaXMudHlwaW5nc0hvc3QuY29sbGVjdERlcGVuZGVuY2llcyhlbnRyeVBvaW50LnR5cGluZ3MsIGRlcEluZm8pO1xuICAgIHJldHVybiBkZXBJbmZvO1xuICB9XG5cbiAgLyoqXG4gICAqIENvbXB1dGVzIGEgZGVwZW5kZW5jeSBncmFwaCBvZiB0aGUgZ2l2ZW4gZW50cnktcG9pbnRzLlxuICAgKlxuICAgKiBUaGUgZ3JhcGggb25seSBob2xkcyBlbnRyeS1wb2ludHMgdGhhdCBuZ2NjIGNhcmVzIGFib3V0IGFuZCB3aG9zZSBkZXBlbmRlbmNpZXNcbiAgICogKGRpcmVjdCBhbmQgdHJhbnNpdGl2ZSkgYWxsIGV4aXN0LlxuICAgKi9cbiAgcHJpdmF0ZSBjb21wdXRlRGVwZW5kZW5jeUdyYXBoKGVudHJ5UG9pbnRzOiBFbnRyeVBvaW50W10pOiBEZXBlbmRlbmN5R3JhcGgge1xuICAgIGNvbnN0IGludmFsaWRFbnRyeVBvaW50czogSW52YWxpZEVudHJ5UG9pbnRbXSA9IFtdO1xuICAgIGNvbnN0IGlnbm9yZWREZXBlbmRlbmNpZXM6IElnbm9yZWREZXBlbmRlbmN5W10gPSBbXTtcbiAgICBjb25zdCBncmFwaCA9IG5ldyBEZXBHcmFwaDxFbnRyeVBvaW50PigpO1xuXG4gICAgY29uc3QgYW5ndWxhckVudHJ5UG9pbnRzID0gZW50cnlQb2ludHMuZmlsdGVyKGVudHJ5UG9pbnQgPT4gZW50cnlQb2ludC5jb21waWxlZEJ5QW5ndWxhcik7XG5cbiAgICAvLyBBZGQgdGhlIEFuZ3VsYXIgY29tcGlsZWQgZW50cnkgcG9pbnRzIHRvIHRoZSBncmFwaCBhcyBub2Rlc1xuICAgIGFuZ3VsYXJFbnRyeVBvaW50cy5mb3JFYWNoKGVudHJ5UG9pbnQgPT4gZ3JhcGguYWRkTm9kZShlbnRyeVBvaW50LnBhdGgsIGVudHJ5UG9pbnQpKTtcblxuICAgIC8vIE5vdyBhZGQgdGhlIGRlcGVuZGVuY2llcyBiZXR3ZWVuIHRoZW1cbiAgICBhbmd1bGFyRW50cnlQb2ludHMuZm9yRWFjaChlbnRyeVBvaW50ID0+IHtcbiAgICAgIGNvbnN0IHtkZXBlbmRlbmNpZXMsIG1pc3NpbmcsIGRlZXBJbXBvcnRzfSA9IHRoaXMuZ2V0RW50cnlQb2ludERlcGVuZGVuY2llcyhlbnRyeVBvaW50KTtcblxuICAgICAgY29uc3QgbWlzc2luZ0RlcGVuZGVuY2llcyA9IEFycmF5LmZyb20obWlzc2luZykuZmlsdGVyKGRlcCA9PiAhYnVpbHRpbk5vZGVKc01vZHVsZXMuaGFzKGRlcCkpO1xuXG4gICAgICBpZiAobWlzc2luZ0RlcGVuZGVuY2llcy5sZW5ndGggPiAwICYmICFlbnRyeVBvaW50Lmlnbm9yZU1pc3NpbmdEZXBlbmRlbmNpZXMpIHtcbiAgICAgICAgLy8gVGhpcyBlbnRyeSBwb2ludCBoYXMgZGVwZW5kZW5jaWVzIHRoYXQgYXJlIG1pc3NpbmdcbiAgICAgICAgLy8gc28gcmVtb3ZlIGl0IGZyb20gdGhlIGdyYXBoLlxuICAgICAgICByZW1vdmVOb2RlcyhlbnRyeVBvaW50LCBtaXNzaW5nRGVwZW5kZW5jaWVzKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRlcGVuZGVuY2llcy5mb3JFYWNoKGRlcGVuZGVuY3lQYXRoID0+IHtcbiAgICAgICAgICBpZiAoIWdyYXBoLmhhc05vZGUoZW50cnlQb2ludC5wYXRoKSkge1xuICAgICAgICAgICAgLy8gVGhlIGVudHJ5LXBvaW50IGhhcyBhbHJlYWR5IGJlZW4gaWRlbnRpZmllZCBhcyBpbnZhbGlkIHNvIHdlIGRvbid0IG5lZWRcbiAgICAgICAgICAgIC8vIHRvIGRvIGFueSBmdXJ0aGVyIHdvcmsgb24gaXQuXG4gICAgICAgICAgfSBlbHNlIGlmIChncmFwaC5oYXNOb2RlKGRlcGVuZGVuY3lQYXRoKSkge1xuICAgICAgICAgICAgLy8gVGhlIGVudHJ5LXBvaW50IGlzIHN0aWxsIHZhbGlkIChpLmUuIGhhcyBubyBtaXNzaW5nIGRlcGVuZGVuY2llcykgYW5kXG4gICAgICAgICAgICAvLyB0aGUgZGVwZW5kZW5jeSBtYXBzIHRvIGFuIGVudHJ5IHBvaW50IHRoYXQgZXhpc3RzIGluIHRoZSBncmFwaCBzbyBhZGQgaXRcbiAgICAgICAgICAgIGdyYXBoLmFkZERlcGVuZGVuY3koZW50cnlQb2ludC5wYXRoLCBkZXBlbmRlbmN5UGF0aCk7XG4gICAgICAgICAgfSBlbHNlIGlmIChpbnZhbGlkRW50cnlQb2ludHMuc29tZShpID0+IGkuZW50cnlQb2ludC5wYXRoID09PSBkZXBlbmRlbmN5UGF0aCkpIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXBlbmRlbmN5IHBhdGggbWFwcyB0byBhbiBlbnRyeS1wb2ludCB0aGF0IHdhcyBwcmV2aW91c2x5IHJlbW92ZWRcbiAgICAgICAgICAgIC8vIGZyb20gdGhlIGdyYXBoLCBzbyByZW1vdmUgdGhpcyBlbnRyeS1wb2ludCBhcyB3ZWxsLlxuICAgICAgICAgICAgcmVtb3ZlTm9kZXMoZW50cnlQb2ludCwgW2RlcGVuZGVuY3lQYXRoXSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFRoZSBkZXBlbmRlbmN5IHBhdGggcG9pbnRzIHRvIGEgcGFja2FnZSB0aGF0IG5nY2MgZG9lcyBub3QgY2FyZSBhYm91dC5cbiAgICAgICAgICAgIGlnbm9yZWREZXBlbmRlbmNpZXMucHVzaCh7ZW50cnlQb2ludCwgZGVwZW5kZW5jeVBhdGh9KTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuXG4gICAgICBpZiAoZGVlcEltcG9ydHMuc2l6ZSkge1xuICAgICAgICBjb25zdCBpbXBvcnRzID0gQXJyYXkuZnJvbShkZWVwSW1wb3J0cykubWFwKGkgPT4gYCcke2l9J2ApLmpvaW4oJywgJyk7XG4gICAgICAgIHRoaXMubG9nZ2VyLndhcm4oXG4gICAgICAgICAgICBgRW50cnkgcG9pbnQgJyR7ZW50cnlQb2ludC5uYW1lfScgY29udGFpbnMgZGVlcCBpbXBvcnRzIGludG8gJHtpbXBvcnRzfS4gYCArXG4gICAgICAgICAgICBgVGhpcyBpcyBwcm9iYWJseSBub3QgYSBwcm9ibGVtLCBidXQgbWF5IGNhdXNlIHRoZSBjb21waWxhdGlvbiBvZiBlbnRyeSBwb2ludHMgdG8gYmUgb3V0IG9mIG9yZGVyLmApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgcmV0dXJuIHtpbnZhbGlkRW50cnlQb2ludHMsIGlnbm9yZWREZXBlbmRlbmNpZXMsIGdyYXBofTtcblxuICAgIGZ1bmN0aW9uIHJlbW92ZU5vZGVzKGVudHJ5UG9pbnQ6IEVudHJ5UG9pbnQsIG1pc3NpbmdEZXBlbmRlbmNpZXM6IHN0cmluZ1tdKSB7XG4gICAgICBjb25zdCBub2Rlc1RvUmVtb3ZlID0gW2VudHJ5UG9pbnQucGF0aCwgLi4uZ3JhcGguZGVwZW5kYW50c09mKGVudHJ5UG9pbnQucGF0aCldO1xuICAgICAgbm9kZXNUb1JlbW92ZS5mb3JFYWNoKG5vZGUgPT4ge1xuICAgICAgICBpbnZhbGlkRW50cnlQb2ludHMucHVzaCh7ZW50cnlQb2ludDogZ3JhcGguZ2V0Tm9kZURhdGEobm9kZSksIG1pc3NpbmdEZXBlbmRlbmNpZXN9KTtcbiAgICAgICAgZ3JhcGgucmVtb3ZlTm9kZShub2RlKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgZ2V0RW50cnlQb2ludEZvcm1hdEluZm8oZW50cnlQb2ludDogRW50cnlQb2ludCk6XG4gICAgICB7Zm9ybWF0OiBFbnRyeVBvaW50Rm9ybWF0LCBwYXRoOiBBYnNvbHV0ZUZzUGF0aH0ge1xuICAgIGZvciAoY29uc3QgcHJvcGVydHkgb2YgU1VQUE9SVEVEX0ZPUk1BVF9QUk9QRVJUSUVTKSB7XG4gICAgICBjb25zdCBmb3JtYXRQYXRoID0gZW50cnlQb2ludC5wYWNrYWdlSnNvbltwcm9wZXJ0eV07XG4gICAgICBpZiAoZm9ybWF0UGF0aCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgY29uc3QgZm9ybWF0ID0gZ2V0RW50cnlQb2ludEZvcm1hdCh0aGlzLmZzLCBlbnRyeVBvaW50LCBwcm9wZXJ0eSk7XG4gICAgICBpZiAoZm9ybWF0ID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICByZXR1cm4ge2Zvcm1hdCwgcGF0aDogcmVzb2x2ZShlbnRyeVBvaW50LnBhdGgsIGZvcm1hdFBhdGgpfTtcbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIGBUaGVyZSBpcyBubyBhcHByb3ByaWF0ZSBzb3VyY2UgY29kZSBmb3JtYXQgaW4gJyR7ZW50cnlQb2ludC5wYXRofScgZW50cnktcG9pbnQuYCk7XG4gIH1cbn1cblxuaW50ZXJmYWNlIERlcGVuZGVuY3lHcmFwaCBleHRlbmRzIERlcGVuZGVuY3lEaWFnbm9zdGljcyB7XG4gIGdyYXBoOiBEZXBHcmFwaDxFbnRyeVBvaW50Pjtcbn1cbiJdfQ==