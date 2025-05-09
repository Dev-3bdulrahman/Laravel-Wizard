"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerArtisanCommands = registerArtisanCommands;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const cp = __importStar(require("child_process"));
const laravelUtils_1 = require("../utils/laravelUtils");
/**
 * Register Artisan commands
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
function registerArtisanCommands(context, laravelRoot) {
    const config = (0, laravelUtils_1.getLaravelConfig)(laravelRoot);
    const artisanProvider = new ArtisanProvider(config);
    // Register Artisan command
    const artisanCommand = vscode.commands.registerCommand('laravelWizard.artisanCommand', async () => {
        const commands = await artisanProvider.getCommands();
        if (commands.length === 0) {
            vscode.window.showInformationMessage('No Artisan commands found.');
            return;
        }
        const commandItems = commands.map(command => ({
            label: command.name,
            description: command.description,
            command
        }));
        const selectedCommand = await vscode.window.showQuickPick(commandItems, {
            placeHolder: 'Select an Artisan command'
        });
        if (selectedCommand) {
            const command = selectedCommand.command;
            let commandString = command.name;
            // Handle parameters for the command
            for (const param of command.parameters.filter(p => p.required)) {
                const value = await vscode.window.showInputBox({
                    prompt: `Enter value for ${param.name}`,
                    placeHolder: param.description,
                    value: param.default
                });
                if (value === undefined) {
                    // User cancelled
                    return;
                }
                commandString += ` ${value}`;
            }
            // Ask for optional parameters
            const optionalParams = command.parameters.filter(p => !p.required);
            if (optionalParams.length > 0) {
                const useOptional = await vscode.window.showQuickPick(['Yes', 'No'], {
                    placeHolder: 'Do you want to specify optional parameters?'
                });
                if (useOptional === 'Yes') {
                    for (const param of optionalParams) {
                        const value = await vscode.window.showInputBox({
                            prompt: `Enter value for ${param.name} (optional)`,
                            placeHolder: param.description,
                            value: param.default
                        });
                        if (value !== undefined && value !== '') {
                            commandString += ` ${param.name.startsWith('--') ? param.name : '--' + param.name}=${value}`;
                        }
                    }
                }
            }
            // Execute the command
            const terminal = vscode.window.createTerminal('Laravel Artisan');
            terminal.sendText(`cd "${laravelRoot}" && php artisan ${commandString}`);
            terminal.show();
        }
    });
    context.subscriptions.push(artisanCommand);
}
/**
 * Artisan provider
 */
class ArtisanProvider {
    config;
    commands = [];
    constructor(config) {
        this.config = config;
    }
    /**
     * Get all Artisan commands
     */
    async getCommands() {
        if (this.commands.length > 0) {
            return this.commands;
        }
        try {
            await this.loadCommands();
            return this.commands;
        }
        catch (error) {
            console.error('Error loading Artisan commands:', error);
            return [];
        }
    }
    /**
     * Load Artisan commands
     */
    async loadCommands() {
        return new Promise((resolve, reject) => {
            const artisanPath = path.join(this.config.root, 'artisan');
            if (!fs.existsSync(artisanPath)) {
                reject(new Error('Artisan file not found'));
                return;
            }
            // Execute artisan list command to get all available commands
            cp.exec(`cd "${this.config.root}" && php artisan list --format=json`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                try {
                    const commandList = JSON.parse(stdout);
                    // Parse commands
                    for (const command of commandList.commands) {
                        const parameters = [];
                        // Parse command definition to extract parameters
                        const definition = command.definition || '';
                        const paramRegex = /\{([^}]+)\}/g;
                        let match;
                        while ((match = paramRegex.exec(definition)) !== null) {
                            const paramDef = match[1];
                            const required = !paramDef.includes('?');
                            const name = paramDef.replace('?', '');
                            parameters.push({
                                name,
                                description: `Parameter: ${name}`,
                                required
                            });
                        }
                        // Add options
                        if (command.options) {
                            for (const option of command.options) {
                                parameters.push({
                                    name: option.name,
                                    description: option.description || `Option: ${option.name}`,
                                    required: false,
                                    default: option.default
                                });
                            }
                        }
                        this.commands.push({
                            name: command.name,
                            description: command.description || '',
                            signature: command.synopsis || '',
                            parameters
                        });
                    }
                    resolve();
                }
                catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }
}
//# sourceMappingURL=artisanCommands.js.map