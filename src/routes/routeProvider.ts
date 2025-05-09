import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { getLaravelConfig } from '../utils/laravelUtils';

/**
 * Route information
 */
interface RouteInfo {
    name: string;
    uri: string;
    method: string;
    controller?: string;
    action?: string;
    middleware?: string[];
    filePath: string;
    line: number;
}

/**
 * Register Route support
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
export function registerRouteSupport(context: vscode.ExtensionContext, laravelRoot: string) {
    const config = getLaravelConfig(laravelRoot);
    const routeProvider = new RouteProvider(config);

    // Register route completion provider
    const phpSelector = { language: 'php', scheme: 'file' };
    const bladeSelector = { language: 'blade', scheme: 'file' };

    const phpRouteCompletionProvider = vscode.languages.registerCompletionItemProvider(
        phpSelector,
        routeProvider,
        '\'', '"'
    );

    const bladeRouteCompletionProvider = vscode.languages.registerCompletionItemProvider(
        bladeSelector,
        routeProvider,
        '\'', '"'
    );

    // Register route hover provider
    const phpRouteHoverProvider = vscode.languages.registerHoverProvider(
        phpSelector,
        routeProvider
    );

    const bladeRouteHoverProvider = vscode.languages.registerHoverProvider(
        bladeSelector,
        routeProvider
    );

    // Register go to route command
    const goToRouteCommand = vscode.commands.registerCommand('laravelWizard.goToRoute', async () => {
        const routes = routeProvider.getRoutes();

        if (routes.length === 0) {
            vscode.window.showInformationMessage('No routes found in the project.');
            return;
        }

        const routeItems = routes.map(route => ({
            label: route.name || route.uri,
            description: `${route.method} ${route.uri}`,
            detail: route.controller ? `${route.controller}@${route.action}` : '',
            route
        }));

        const selectedRoute = await vscode.window.showQuickPick(routeItems, {
            placeHolder: 'Select a route to navigate to'
        });

        if (selectedRoute) {
            const uri = vscode.Uri.file(selectedRoute.route.filePath);
            const position = new vscode.Position(selectedRoute.route.line, 0);

            const document = await vscode.workspace.openTextDocument(uri);
            await vscode.window.showTextDocument(document);

            // Move cursor to the route definition
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.revealRange(
                    new vscode.Range(position, position),
                    vscode.TextEditorRevealType.InCenter
                );

                editor.selection = new vscode.Selection(position, position);
            }
        }
    });

    context.subscriptions.push(
        phpRouteCompletionProvider,
        bladeRouteCompletionProvider,
        phpRouteHoverProvider,
        bladeRouteHoverProvider,
        goToRouteCommand
    );
}

/**
 * Route provider
 */
class RouteProvider implements vscode.CompletionItemProvider, vscode.HoverProvider {
    private config: any;
    private routes: RouteInfo[] = [];

    constructor(config: any) {
        this.config = config;
        this.parseRoutes();
    }

    /**
     * Parse routes from route files
     */
    private parseRoutes() {
        try {
            const routesPath = this.config.routesPath;
            if (fs.existsSync(routesPath)) {
                const webRoutesPath = path.join(routesPath, 'web.php');
                const apiRoutesPath = path.join(routesPath, 'api.php');

                if (fs.existsSync(webRoutesPath)) {
                    this.parseRouteFile(webRoutesPath, 'web');
                }

                if (fs.existsSync(apiRoutesPath)) {
                    this.parseRouteFile(apiRoutesPath, 'api');
                }
            }
        } catch (error) {
            console.error('Error parsing routes:', error);
        }
    }

    /**
     * Parse a route file
     * @param filePath Route file path
     * @param group Route group
     */
    private parseRouteFile(filePath: string, group: string) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const lines = content.split('\n');

            // Regular expressions for route patterns
            const routeRegex = /Route::(get|post|put|patch|delete|options|any)\(\s*['"]([^'"]+)['"]/;
            const nameRegex = /->name\(\s*['"]([^'"]+)['"]\s*\)/;
            const controllerRegex = /->uses\(\s*['"]?([^'"(),]+)@([^'"(),]+)['"]?\s*\)/;
            const middlewareRegex = /->middleware\(\s*(?:\[([^\]]+)\]|['"]([^'"]+)['"])\s*\)/;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const routeMatch = line.match(routeRegex);

                if (routeMatch) {
                    const method = routeMatch[1].toUpperCase();
                    const uri = routeMatch[2];

                    // Look for route name
                    const nameMatch = line.match(nameRegex) || (i + 1 < lines.length ? lines[i + 1].match(nameRegex) : null);
                    const name = nameMatch ? nameMatch[1] : '';

                    // Look for controller
                    const controllerMatch = line.match(controllerRegex) || (i + 1 < lines.length ? lines[i + 1].match(controllerRegex) : null);
                    const controller = controllerMatch ? controllerMatch[1] : undefined;
                    const action = controllerMatch ? controllerMatch[2] : undefined;

                    // Look for middleware
                    const middlewareMatch = line.match(middlewareRegex) || (i + 1 < lines.length ? lines[i + 1].match(middlewareRegex) : null);
                    const middleware = middlewareMatch ?
                        (middlewareMatch[1] ? middlewareMatch[1].split(',').map(m => m.trim().replace(/['"]/g, '')) :
                        (middlewareMatch[2] ? [middlewareMatch[2]] : [])) :
                        [];

                    this.routes.push({
                        name,
                        uri,
                        method,
                        controller,
                        action,
                        middleware,
                        filePath,
                        line: i
                    });
                }
            }
        } catch (error) {
            console.error(`Error parsing route file ${filePath}:`, error);
        }
    }

    /**
     * Get all routes
     */
    public getRoutes(): RouteInfo[] {
        return this.routes;
    }

    /**
     * Provide completion items
     */
    public provideCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken,
        context: vscode.CompletionContext
    ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList<vscode.CompletionItem>> {
        const linePrefix = document.lineAt(position).text.substr(0, position.character);

        // Check for route() function
        if (linePrefix.match(/route\s*\(\s*['"]$/)) {
            return this.provideRouteCompletions();
        }

        // Check for URL generation in Blade
        if (linePrefix.match(/(?:url|action|route)\(\s*['"]$/)) {
            return this.provideRouteCompletions();
        }

        return null;
    }

    /**
     * Provide route completions
     */
    private provideRouteCompletions(): vscode.CompletionItem[] {
        return this.routes
            .filter(route => route.name) // Only named routes
            .map(route => {
                const item = new vscode.CompletionItem(route.name, vscode.CompletionItemKind.Reference);
                item.detail = `${route.method} ${route.uri}`;
                item.documentation = new vscode.MarkdownString()
                    .appendMarkdown(`**Route:** ${route.name}\n\n`)
                    .appendMarkdown(`**URI:** ${route.uri}\n\n`)
                    .appendMarkdown(`**Method:** ${route.method}\n\n`);

                if (route.controller) {
                    item.documentation.appendMarkdown(`**Controller:** ${route.controller}@${route.action}\n\n`);
                }

                if (route.middleware && route.middleware.length > 0) {
                    item.documentation.appendMarkdown(`**Middleware:** ${route.middleware.join(', ')}`);
                }

                return item;
            });
    }

    /**
     * Provide hover information
     */
    public provideHover(
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
    ): vscode.ProviderResult<vscode.Hover> {
        const wordRange = document.getWordRangeAtPosition(position);
        if (!wordRange) {
            return null;
        }

        const word = document.getText(wordRange);
        const line = document.lineAt(position.line).text;

        // Check for route name in route() function
        const routeMatch = line.match(/route\s*\(\s*['"]([^'"]+)['"]/);
        if (routeMatch && this.isPositionInRange(position, routeMatch.index || 0, routeMatch[0].length)) {
            const routeName = routeMatch[1];
            return this.getRouteHover(routeName);
        }

        return null;
    }

    /**
     * Check if position is within a range in the line
     */
    private isPositionInRange(position: vscode.Position, startIndex: number, length: number): boolean {
        return position.character >= startIndex && position.character <= startIndex + length;
    }

    /**
     * Get hover information for a route
     */
    private getRouteHover(routeName: string): vscode.Hover | null {
        const route = this.routes.find(r => r.name === routeName);
        if (route) {
            const markdown = new vscode.MarkdownString()
                .appendMarkdown(`**Route:** ${route.name}\n\n`)
                .appendMarkdown(`**URI:** ${route.uri}\n\n`)
                .appendMarkdown(`**Method:** ${route.method}\n\n`);

            if (route.controller) {
                markdown.appendMarkdown(`**Controller:** ${route.controller}@${route.action}\n\n`);
            }

            if (route.middleware && route.middleware.length > 0) {
                markdown.appendMarkdown(`**Middleware:** ${route.middleware.join(', ')}`);
            }

            return new vscode.Hover(markdown);
        }
        return null;
    }
}
