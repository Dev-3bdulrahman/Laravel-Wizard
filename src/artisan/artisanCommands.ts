import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { getLaravelConfig } from '../utils/laravelUtils';

/**
 * Artisan command information
 */
interface ArtisanCommand {
    name: string;
    description: string;
    signature: string;
    parameters: ArtisanParameter[];
}

/**
 * Artisan command parameter
 */
interface ArtisanParameter {
    name: string;
    description: string;
    required: boolean;
    default?: string;
}

/**
 * Register Artisan commands
 * @param context Extension context
 * @param laravelRoot Laravel project root path
 */
export function registerArtisanCommands(context: vscode.ExtensionContext, laravelRoot: string) {
    const config = getLaravelConfig(laravelRoot);
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
    private config: any;
    private commands: ArtisanCommand[] = [];
    
    constructor(config: any) {
        this.config = config;
    }
    
    /**
     * Get all Artisan commands
     */
    public async getCommands(): Promise<ArtisanCommand[]> {
        if (this.commands.length > 0) {
            return this.commands;
        }
        
        try {
            await this.loadCommands();
            return this.commands;
        } catch (error) {
            console.error('Error loading Artisan commands:', error);
            return [];
        }
    }
    
    /**
     * Load Artisan commands
     */
    private async loadCommands(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
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
                        const parameters: ArtisanParameter[] = [];
                        
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
                } catch (parseError) {
                    reject(parseError);
                }
            });
        });
    }
}
